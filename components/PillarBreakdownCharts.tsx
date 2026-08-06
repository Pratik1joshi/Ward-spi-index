'use client';

import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExclusionComponents, PovertyComponents, VulnerabilityComponents } from '@/lib/types';

const cardClass = 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm';
const headerClass = 'mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500';
const titleClass = 'text-sm font-semibold text-slate-900';

export function ExclusionRadarChart({ components }: { components: ExclusionComponents }) {
  const data = [
    { dimension: 'Socio-Economic', value: components.socioEconomic },
    { dimension: 'Institutional', value: components.institutional },
    { dimension: 'Political', value: components.political },
    { dimension: 'Cultural', value: components.cultural },
    { dimension: 'Spatial', value: components.spatial },
  ];

  return (
    <section className={cardClass}>
      <p className={headerClass}>Exclusion Components</p>
      <h3 className={titleClass}>Dimensions driving exclusion</h3>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 10 }} />
          <Radar dataKey="value" stroke="#3f6f9e" fill="#3f6f9e" fillOpacity={0.35} />
          <Tooltip
            formatter={(value: number, _name, item) => [value.toFixed(2), `${item?.payload?.dimension} Exclusion`]}
            contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </section>
  );
}

export function VulnerabilityRadarChart({ components }: { components: VulnerabilityComponents }) {
  const data = [
    { dimension: 'Exposure', value: components.environmental },
    { dimension: 'Sensitivity', value: components.social },
    { dimension: 'Adaptive Capacity', value: components.climate },
  ];

  return (
    <section className={cardClass}>
      <p className={headerClass}>Vulnerability Index Components</p>
      <h3 className={titleClass}>Sources of vulnerability</h3>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 10 }} />
          <Radar dataKey="value" stroke="#4caf50" fill="#4caf50" fillOpacity={0.35} />
          <Tooltip formatter={(value: number) => value.toFixed(2)} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </section>
  );
}

const mpiGroupColor: Record<string, string> = {
  Nutrition: '#d97706',
  'Child Mortality': '#d97706',
  'Years of Schooling': '#2563eb',
  'School Attendance': '#2563eb',
  'Cooking Fuel': '#0f766e',
  Sanitation: '#0f766e',
  'Drinking Water': '#0f766e',
  Electricity: '#0f766e',
  Housing: '#0f766e',
  Assets: '#0f766e',
};

export function PovertyContributionChart({ components }: { components: PovertyComponents }) {
  const data = [...components.health, ...components.education, ...components.livingStandards]
    .map((item) => ({ name: item.name, value: Number(item.value.toFixed(1)) }))
    .sort((a, b) => b.value - a.value);

  const hasSignal = data.some((item) => item.value > 0);

  return (
    <section className={cardClass}>
      <p className={headerClass}>Poverty Index Components</p>
      <div className="mb-1 flex items-end justify-between gap-3">
        <h3 className={titleClass}>What drives poverty here</h3>
        <div className="flex gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#d97706' }} />Health</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#2563eb' }} />Education</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#0f766e' }} />Living standard</span>
        </div>
      </div>
      {!hasSignal ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-slate-400">
          No poor households in this selection.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 28 }} barSize={13}>
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis type="category" dataKey="name" width={118} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value: number) => [`${value}%`, 'Contribution']} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#64748b', fontSize: 10, formatter: (v: number) => `${v}%` }}>
              {data.map((entry) => <Cell key={entry.name} fill={mpiGroupColor[entry.name] ?? '#94a3b8'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
