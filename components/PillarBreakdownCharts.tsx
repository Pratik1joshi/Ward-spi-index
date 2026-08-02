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
    { dimension: 'Socio-economic', value: components.socioEconomic },
    { dimension: 'Institutional', value: components.institutional },
    { dimension: 'Political', value: components.political },
    { dimension: 'Cultural', value: components.cultural },
    { dimension: 'Spatial', value: components.spatial },
  ];

  return (
    <section className={cardClass}>
      <p className={headerClass}>Exclusion Index</p>
      <h3 className={titleClass}>Dimensions driving exclusion</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fill: '#64748b', fontSize: 10 }} />
          <Radar dataKey="value" stroke="#3f6f9e" fill="#3f6f9e" fillOpacity={0.35} />
          <Tooltip formatter={(value: number) => value.toFixed(2)} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </section>
  );
}

export function VulnerabilityRadarChart({ components }: { components: VulnerabilityComponents }) {
  const data = [
    { dimension: 'Environmental', value: components.environmental },
    { dimension: 'Social', value: components.social },
    { dimension: 'Climate', value: components.climate },
  ];

  return (
    <section className={cardClass}>
      <p className={headerClass}>Vulnerability Index</p>
      <h3 className={titleClass}>Sources of vulnerability</h3>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} outerRadius="72%">
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
  'Child mortality': '#d97706',
  'Years of schooling': '#2563eb',
  'School attendance': '#2563eb',
  'Cooking fuel': '#0f766e',
  Sanitation: '#0f766e',
  'Drinking water': '#0f766e',
  Electricity: '#0f766e',
  Housing: '#0f766e',
  Assets: '#0f766e',
};

export function PovertyContributionChart({ components }: { components: PovertyComponents }) {
  const data = [...components.health, ...components.education, ...components.livingStandards]
    .map((item) => ({ name: item.name, value: Number(item.value.toFixed(1)) }))
    .sort((a, b) => b.value - a.value);

  return (
    <section className={cardClass}>
      <p className={headerClass}>Multidimensional Poverty Index</p>
      <div className="mb-1 flex items-end justify-between gap-3">
        <h3 className={titleClass}>What drives poverty here</h3>
        <div className="flex gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#d97706' }} />Health</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#2563eb' }} />Education</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#0f766e' }} />Living standard</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ left: 4, right: 12 }} barSize={13}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={104} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value: number) => [`${value}%`, 'Contribution']} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry) => <Cell key={entry.name} fill={mpiGroupColor[entry.name] ?? '#94a3b8'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
