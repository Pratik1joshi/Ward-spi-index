'use client';

import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Municipality, Pillar } from '@/lib/types';
import { isHigherBetter, resolvePillar } from '@/lib/data';
import { getSummaryValue, HouseholdSummary } from '@/lib/households';

const labels: Record<Exclude<Pillar, 'none'>, string> = {
  overall: 'SPI',
  exclusion: 'Exclusion Index',
  poverty: 'Poverty Index',
  vulnerability: 'Vulnerability Index',
};

function wrapAxisLabel(value: string, maxCharacters = 16): string[] {
  const words = value.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && candidate.length > maxCharacters) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function WrappedAxisTick({ x, y, payload }: any) {
  const lines = wrapAxisLabel(String(payload?.value ?? ''));
  return (
    <text x={x} y={y + 12} textAnchor="middle" fill="#64748b" fontSize={10}>
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : 12}>{line}</tspan>
      ))}
    </text>
  );
}

function ActualScoreLabel({ x, y, width, height, value, payload }: any) {
  const difference = payload?.difference ?? 0;
  // Recharts can report a negative bar with either a negative height or an
  // inverted y-coordinate. Normalising the rectangle keeps the score outside
  // the bar on both sides of the average line.
  const top = Math.min(y, y + height);
  const bottom = Math.max(y, y + height);
  const labelY = difference >= 0 ? top - 5 : bottom + 12;
  return (
    <text x={x + width / 2} y={labelY} textAnchor="middle" fill="#475569" fontSize={10}>
      {Number(value).toFixed(1)}
    </text>
  );
}

export function WardAverageChart({
  municipality,
  municipalities,
  pillar,
  selectedWardId,
  wardSummaries,
  municipalitySummaries,
  comparisonSummary,
}: {
  municipality: Municipality;
  municipalities?: Municipality[];
  pillar: Pillar;
  selectedWardId?: string;
  wardSummaries: Map<string, HouseholdSummary>;
  municipalitySummaries: Map<string, HouseholdSummary>;
  comparisonSummary: HouseholdSummary | null;
}) {
  const activePillar = resolvePillar(pillar);
  const isAllMunicipalities = municipality.id === 'all';
  const scores = isAllMunicipalities
    ? (municipalities ?? []).flatMap((item) => {
        const itemSummary = municipalitySummaries.get(item.id);
        return itemSummary ? [{ id: item.id, name: item.name, value: getSummaryValue(itemSummary, activePillar) }] : [];
      })
    : municipality.wards.flatMap((ward) => {
        const wardSummary = wardSummaries.get(ward.id);
        return wardSummary ? [{ id: ward.id, name: `Ward ${ward.wardNumber}`, value: getSummaryValue(wardSummary, activePillar) }] : [];
      });
  // This is the household-weighted result for the current municipality/filter context,
  // not an unweighted mean of ward means.
  const average = comparisonSummary ? getSummaryValue(comparisonSummary, activePillar) : 0;
  const higherIsBetter = isHigherBetter(activePillar);

  const data = scores
    .map(({ id, name, value }) => ({
      name,
      id,
      value: Number(value.toFixed(1)),
      difference: Number((value - average).toFixed(1)),
      aboveAverage: value >= average,
    }))
    .sort((a, b) => a.value - b.value);
  const chartBound = Math.ceil((Math.max(5, ...data.map((item) => Math.abs(item.difference))) + 2) * 10) / 10;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Average comparison</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
            {labels[activePillar]} vs. {isAllMunicipalities ? 'overall municipality average' : 'municipality average'}
          </h3>
        </div>
        <span className="text-xs text-slate-500">Avg: {average.toFixed(1)}</span>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[520px]">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ left: 0, right: 4, top: 22, bottom: 0 }} barSize={24}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={<WrappedAxisTick />} interval={0} height={72} />
              <YAxis hide domain={[-chartBound, chartBound]} />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 3" />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(_, __, item: any) => [String(item.payload.value), labels[activePillar]]}
                labelFormatter={(name) => name}
              />
              <Bar dataKey="difference" radius={[4, 4, 4, 4]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.id}
                    fill={!isAllMunicipalities && entry.id === selectedWardId ? '#d66a4b' : entry.aboveAverage === higherIsBetter ? '#2f9e6f' : '#c0483a'}
                  />
                ))}
                <LabelList dataKey="value" content={<ActualScoreLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
        {higherIsBetter
          ? `Bars above the line beat the ${isAllMunicipalities ? 'overall municipality' : 'municipality'} average; below the line trail it.`
          : 'For this index, bars below the line perform better than the average.'}
      </p>
    </section>
  );
}
