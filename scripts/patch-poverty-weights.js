/**
 * Patch household povertyWeights from GESI Excel W1.1–W3.6 columns.
 * Matches households 1:1 with Excel data rows (same sheet order as the build script).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const root = path.join(__dirname, '..');
const xlsx = path.join(root, 'public', 'All combined for power bi gesi lens with ei vi mpi v2.xlsx');
const jsonPath = path.join(root, 'lib', 'dashboard-data.json');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gesi-'));
const zipCopy = path.join(tmp, 'gesi.zip');
fs.copyFileSync(xlsx, zipCopy);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force"`,
  { stdio: 'inherit' }
);

const sharedXml = fs.readFileSync(path.join(tmp, 'xl', 'sharedStrings.xml'), 'utf8');
const shared = [];
const siRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
let m;
while ((m = siRe.exec(sharedXml))) {
  shared.push([...m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((x) => x[1]).join(''));
}

const sheetXml = fs.readFileSync(path.join(tmp, 'xl', 'worksheets', 'sheet1.xml'), 'utf8');
const rows = [...sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map((x) => x[1]);

function parseCells(rowXml) {
  const out = {};
  const re = /<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let cell;
  while ((cell = re.exec(rowXml))) {
    const attrs = cell[1];
    const body = cell[2] || '';
    const col = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
    if (!col) continue;
    const t = /t="([^"]+)"/.exec(attrs)?.[1];
    const v = /<v>([^<]*)<\/v>/.exec(body)?.[1];
    if (v == null) {
      out[col] = '';
      continue;
    }
    out[col] = t === 's' ? shared[Number(v)] ?? '' : v;
  }
  return out;
}

const headerByCol = parseCells(rows[0]);
const needed = ['W1.1', 'W1.2', 'W2.1', 'W2.2', 'W3.1', 'W3.2', 'W3.3', 'W3.4', 'W3.5', 'W3.6'];
const colFor = {};
for (const [col, name] of Object.entries(headerByCol)) {
  if (needed.includes(String(name))) colFor[name] = col;
}
for (const name of needed) {
  if (!colFor[name]) {
    throw new Error(`Missing column ${name}. Nearby: ${Object.entries(headerByCol).filter(([, v]) => /W\d|Sum|Contribution/.test(String(v))).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function weightsFromValues(values) {
  return {
    health: [
      { name: 'Nutrition', value: Number(num(values[colFor['W1.1']]).toFixed(6)) },
      { name: 'Child Mortality', value: Number(num(values[colFor['W1.2']]).toFixed(6)) },
    ],
    education: [
      { name: 'Years of Schooling', value: Number(num(values[colFor['W2.1']]).toFixed(6)) },
      { name: 'School Attendance', value: Number(num(values[colFor['W2.2']]).toFixed(6)) },
    ],
    livingStandards: [
      { name: 'Cooking Fuel', value: Number(num(values[colFor['W3.1']]).toFixed(6)) },
      { name: 'Sanitation', value: Number(num(values[colFor['W3.2']]).toFixed(6)) },
      { name: 'Drinking Water', value: Number(num(values[colFor['W3.3']]).toFixed(6)) },
      { name: 'Electricity', value: Number(num(values[colFor['W3.4']]).toFixed(6)) },
      { name: 'Housing', value: Number(num(values[colFor['W3.5']]).toFixed(6)) },
      { name: 'Assets', value: Number(num(values[colFor['W3.6']]).toFixed(6)) },
    ],
  };
}

const weightRows = [];
for (let i = 1; i < rows.length; i++) {
  weightRows.push(weightsFromValues(parseCells(rows[i])));
}

const raw = fs.readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

if (weightRows.length !== data.households.length) {
  console.warn(`Row count mismatch: excel=${weightRows.length} households=${data.households.length}`);
}

const n = Math.min(weightRows.length, data.households.length);
for (let i = 0; i < n; i++) {
  data.households[i].povertyWeights = weightRows[i];
  delete data.households[i].povertyContributions;
}
for (let i = n; i < data.households.length; i++) {
  data.households[i].povertyWeights = weightsFromValues({});
  delete data.households[i].povertyContributions;
}

function renameContrib(list) {
  if (!Array.isArray(list)) return list;
  const map = {
    'Child mortality': 'Child Mortality',
    'Years of schooling': 'Years of Schooling',
    'School attendance': 'School Attendance',
    'Cooking fuel': 'Cooking Fuel',
    'Drinking water': 'Drinking Water',
  };
  return list.map((item) => ({ ...item, name: map[item.name] || item.name }));
}
function patchPovertyComponents(pc) {
  if (!pc) return;
  pc.health = renameContrib(pc.health);
  pc.education = renameContrib(pc.education);
  pc.livingStandards = renameContrib(pc.livingStandards);
}
for (const muni of data.municipalities) {
  patchPovertyComponents(muni.povertyComponents);
  for (const ward of muni.wards || []) patchPovertyComponents(ward.povertyComponents);
}

fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
const sample = data.households.find((h) => h.ifExceeds033 === 1 && h.povertyWeights.health.some((x) => x.value > 0));
console.log(`Patched ${n} households.`);
console.log('Sample poor weights:', JSON.stringify(sample?.povertyWeights));
