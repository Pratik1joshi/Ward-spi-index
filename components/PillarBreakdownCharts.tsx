'use client';

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExclusionComponents, PovertyComponents, VulnerabilityComponents } from '@/lib/types';

const cardClass = 'rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4';
const headerClass = 'mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs';
const titleClass = 'text-sm font-semibold text-slate-900';

export function ExclusionRadarChart({ components }: { components: ExclusionComponents }) {
  const data = [
    { dimension: 'Socio-Economic', value: Number(components.socioEconomic.toFixed(2)) },
    { dimension: 'Institutional', value: Number(components.institutional.toFixed(2)) },
    { dimension: 'Political', value: Number(components.political.toFixed(2)) },
    { dimension: 'Cultural', value: Number(components.cultural.toFixed(2)) },
    { dimension: 'Spatial', value: Number(components.spatial.toFixed(2)) },
  ];

  return (
    <section className={cardClass}>
      <p className={headerClass}>Exclusion Components</p>
      <h3 className={titleClass}>Dimensions driving exclusion</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 8 }} barSize={36}>
          <XAxis
            dataKey="dimension"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fill: '#64748b', fontSize: 10 }}
            height={48}
            angle={-20}
            textAnchor="end"
          />
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), 'Score']}
            contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#3f6f9e" radius={[6, 6, 0, 0]}>
            <LabelList dataKey="value" position="top" fill="#475569" fontSize={11} formatter={(v: number) => `${v}`} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export function VulnerabilityRadarChart({ components }: { components: VulnerabilityComponents }) {
  const data = [
    { dimension: 'Exposure', value: Number(components.environmental.toFixed(2)) },
    { dimension: 'Sensitivity', value: Number(components.social.toFixed(2)) },
    { dimension: 'Adaptive Capacity', value: Number(components.climate.toFixed(2)) },
  ];

  return (
    <section className={cardClass}>
      <p className={headerClass}>Vulnerability Index Components</p>
      <h3 className={titleClass}>Sources of vulnerability</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 8 }} barSize={48}>
          <XAxis dataKey="dimension" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis hide domain={[0, 'dataMax']} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), 'Score']}
            contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }}
          />
          <Bar dataKey="value" fill="#4caf50" radius={[6, 6, 0, 0]}>
            <LabelList dataKey="value" position="top" fill="#475569" fontSize={11} formatter={(v: number) => `${v}`} />
          </Bar>
        </BarChart>
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
    <section className={`${cardClass} flex h-full min-h-[360px] flex-col sm:min-h-[400px]`}>
      <p className={headerClass}>Poverty Index Components</p>
      <div className="mb-2 flex flex-col gap-2 sm:mb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <h3 className={titleClass}>What drives poverty here</h3>
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#d97706' }} />Health</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#2563eb' }} />Education</span>
          <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full" style={{ background: '#0f766e' }} />Living standard</span>
        </div>
      </div>
      {!hasSignal ? (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-slate-400">
          No poor households in this selection.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <div className="min-w-[300px]">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data} layout="vertical" margin={{ top: 4, left: 0, right: 36, bottom: 4 }} barSize={18}>
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="name" width={108} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value: number) => [String(value), 'Contribution']} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#64748b', fontSize: 11, formatter: (v: number) => `${v}` }}>
                  {data.map((entry) => <Cell key={entry.name} fill={mpiGroupColor[entry.name] ?? '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
