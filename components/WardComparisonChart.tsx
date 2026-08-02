'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Municipality, Pillar } from '@/lib/types';
import { getScoreByPillar } from '@/lib/data';

const labels: Record<Pillar, string> = {
  overall: 'SPI', exclusion: 'Exclusive Index', poverty: 'Poverty Index', vulnerability: 'Vulnerability Index',
};

export function WardComparisonChart({ municipality, pillar, selectedWardId }: { municipality: Municipality; pillar: Pillar; selectedWardId?: string }) {
  const data = [...municipality.wards]
    .map((ward) => ({ name: `Ward ${ward.wardNumber}`, value: Number(getScoreByPillar(ward, pillar).toFixed(1)), id: ward.id }))
    .sort((a, b) => a.value - b.value);
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Ward comparison</p><h3 className="mt-1 text-base font-semibold text-slate-900">{labels[pillar]} across wards</h3></div><span className="text-xs text-slate-500">Select a bar on map</span></div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 2, right: 8 }} barSize={17}>
          <XAxis type="number" domain={[0, Math.ceil(maxValue / 10) * 10]} hide />
          <YAxis type="category" dataKey="name" width={54} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [value, labels[pillar]]} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry) => <Cell key={entry.id} fill={entry.id === selectedWardId ? '#d66a4b' : '#6688aa'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
