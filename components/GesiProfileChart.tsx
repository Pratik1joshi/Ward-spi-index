'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { GesiProfile } from '@/lib/types';

const chartColors = ['#0f766e', '#2563eb', '#d97706', '#db2777'];

export function GesiProfileChart({ profile, metric, compact = false }: { profile: GesiProfile; metric: 'sex' | 'religion' | 'household'; compact?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const data = metric === 'sex'
    ? [{ name: 'Female-headed', value: profile.femaleHeaded }, { name: 'Male-headed', value: profile.maleHeaded }]
    : metric === 'religion' ? profile.religion : profile.householdType;
  const title = metric === 'sex' ? 'Household head sex' : metric === 'religion' ? 'Religion' : 'Household type';
  const activeItem = data[activeIndex] ?? data[0];

  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${compact ? 'p-4' : 'p-5'} shadow-sm`}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">GESI profile</p><h3 className={`${compact ? 'text-sm' : 'text-base'} mt-1 font-semibold text-slate-900`}>{title}</h3></div>
        <span className="shrink-0 text-xs text-slate-500">% of households</span>
      </div>
      <div className="grid items-center gap-2 sm:grid-cols-[minmax(210px,0.8fr)_minmax(0,1fr)] sm:gap-5">
        <ResponsiveContainer width="100%" height={compact ? 240 : 270}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={compact ? 52 : 62} outerRadius={compact ? 88 : 104} paddingAngle={3} activeIndex={activeIndex} onMouseEnter={(_, index) => setActiveIndex(index)}>
              {data.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} stroke="white" strokeWidth={2} />)}
            </Pie>
            <text x="50%" y="47%" textAnchor="middle" className="fill-slate-900 text-[13px] font-semibold">{activeItem?.name}</text>
            <text x="50%" y="55%" textAnchor="middle" className="fill-slate-500 text-[11px]">{`${activeItem?.value.toFixed(1) ?? '0.0'}% of households`}</text>
            <Tooltip formatter={(value, name) => [`${value}%`, name]} contentStyle={{ borderRadius: 10, borderColor: '#cbd5e1' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid gap-2">
          {data.map((entry, index) => (
            <button key={entry.name} type="button" onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors ${activeIndex === index ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
              <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} /><span className="truncate">{entry.name}</span></span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{entry.value.toFixed(1)}%</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
