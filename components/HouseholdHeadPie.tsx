'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { GesiProfile } from '@/lib/types';

export function HouseholdHeadPie({ profile }: { profile: GesiProfile }) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>();
  const data = [
    { name: 'Female-headed', value: profile.femaleHeaded, color: '#d66a4b' },
    { name: 'Male-headed', value: profile.maleHeaded, color: '#d9e4ee' },
  ];
  const active = activeIndex === undefined ? data[0] : data[activeIndex];

  return (
    <section className="rounded-lg border border-slate-200 bg-[#fcfaf8] p-4">
      <div className="flex items-baseline justify-between gap-2"><h3 className="text-sm font-semibold text-slate-900">Household head sex</h3><span className="text-[11px] text-slate-500">hover to explore</span></div>
      <div className="relative mt-1 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} activeIndex={activeIndex} onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(undefined)}>
              {data.map((item) => <Cell key={item.name} fill={item.color} stroke="transparent" />)}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}%`, name]} contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold text-slate-900">{active.value}%</span><span className="max-w-[76px] text-center text-[10px] leading-3 text-slate-500">{active.name}</span></div>
      </div>
      <div className="flex gap-3 text-xs text-slate-600"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d66a4b]" />Female-headed</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#d9e4ee]" />Male-headed</span></div>
    </section>
  );
}
