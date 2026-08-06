'use client';

import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Municipality, Pillar } from '@/lib/types';
import { getPercentByPillar, isHigherBetter, resolvePillar } from '@/lib/data';

const labels: Record<Exclude<Pillar, 'none'>, string> = {
  overall: 'SPI',
  exclusion: 'Exclusion Index',
  poverty: 'Poverty Index',
  vulnerability: 'Vulnerability Index',
};

export function WardAverageChart({ municipality, pillar, selectedWardId }: { municipality: Municipality; pillar: Pillar; selectedWardId?: string }) {
  const activePillar = resolvePillar(pillar);
  const scores = municipality.wards.map((ward) => ({ ward, value: getPercentByPillar(ward, activePillar) }));
  const average = scores.reduce((sum, item) => sum + item.value, 0) / (scores.length || 1);
  const higherIsBetter = isHigherBetter(activePillar);

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
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Average comparison</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">{labels[activePillar]} vs. municipality average</h3>
        </div>
        <span className="text-xs text-slate-500">Avg: {average.toFixed(1)}</span>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[280px]">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ left: 0, right: 4, top: 8, bottom: 0 }} barSize={18}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} interval={0} angle={-35} textAnchor="end" height={48} />
              <YAxis hide />
              <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 3" />
              <Tooltip
                cursor={{ fill: '#f1f5f9' }}
                formatter={(_, __, item: any) => [String(item.payload.value), labels[activePillar]]}
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
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400">Bars above the line beat the municipality average; below the line trail it. {higherIsBetter ? 'Higher is better for SPI.' : 'Lower is better for this index.'}</p>
    </section>
  );
}
