'use client';

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Municipality, Pillar } from '@/lib/types';
import { getPercentByPillar, isHigherBetter } from '@/lib/data';

const labels: Record<Pillar, string> = {
  overall: 'SPI', exclusion: 'Exclusion Index', poverty: 'Poverty Index', vulnerability: 'Vulnerability Index',
};

export function WardAverageChart({ municipality, pillar, selectedWardId }: { municipality: Municipality; pillar: Pillar; selectedWardId?: string }) {
  const scores = municipality.wards.map((ward) => ({ ward, value: getPercentByPillar(ward, pillar) }));
  const average = scores.reduce((sum, item) => sum + item.value, 0) / (scores.length || 1);
  const higherIsBetter = isHigherBetter(pillar);

  const data = scores
    .map(({ ward, value }) => ({
      name: `Ward ${ward.wardNumber}`,
      id: ward.id,
      diff: Number((value - average).toFixed(1)),
      value: Number(value.toFixed(1)),
      aboveAverage: value >= average,
    }))
    .sort((a, b) => a.diff - b.diff);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Average comparison</p>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{labels[pillar]} vs. municipality average</h3>
        </div>
        <span className="text-xs text-slate-500">Avg: {average.toFixed(1)}%</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }} barSize={22}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={50} />
          <YAxis hide />
          <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 3" />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            formatter={(_, __, item: any) => [`${item.payload.value}%`, labels[pillar]]}
            labelFormatter={(name) => name}
          />
          <Bar dataKey="diff" radius={[4, 4, 4, 4]}>
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.id === selectedWardId ? '#d66a4b' : entry.aboveAverage === higherIsBetter ? '#2f9e6f' : '#c0483a'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-[11px] text-slate-400">Bars above the line beat the municipality average; below the line trail it. {higherIsBetter ? 'Higher is better for SPI.' : 'Lower is better for this index.'}</p>
    </section>
  );
}
