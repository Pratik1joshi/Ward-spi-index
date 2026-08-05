'use client';

import { useState } from 'react';
import { DonutChart, DonutLegend } from '@/components/DonutChart';

const chartColors = ['#0f766e', '#2563eb', '#d97706', '#db2777', '#7c3aed', '#059669'];

export function GesiProfileChart({
  data,
  metric,
  compact = false,
}: {
  data: { name: string; value: number }[];
  metric: 'religion' | 'household';
  compact?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const baseTitle = metric === 'religion' ? 'Religion' : 'Household type';
  const visibleData = data.filter((item) => item.value > 0);
  const segments = visibleData.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: chartColors[index % chartColors.length],
  }));
  const activeItem = activeIndex === null ? segments[0] : segments[activeIndex] ?? segments[0];

  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${compact ? 'p-4' : 'p-5'} shadow-sm`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">GESI profile</p>
          <h3 className={`${compact ? 'text-sm' : 'text-base'} mt-1 font-semibold text-slate-900`}>{baseTitle}</h3>
        </div>
        <span className="shrink-0 text-xs text-slate-500">% of households</span>
      </div>

      {visibleData.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-slate-400">
          No data for the current filter combination.
        </div>
      ) : (
        <div className="grid items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          <div className="mx-auto sm:mx-0">
            <DonutChart
              segments={segments}
              size={compact ? 148 : 168}
              innerRatio={0.66}
              defaultActiveIndex={0}
              onActiveChange={setActiveIndex}
              center={
                <div className="max-w-[88px] px-1 text-center">
                  <p className="truncate text-[11px] font-semibold leading-tight text-slate-900">{activeItem?.name}</p>
                  <p className="mt-0.5 text-[10px] tabular-nums text-slate-500">{activeItem?.value.toFixed(1)}%</p>
                </div>
              }
            />
          </div>
          <DonutLegend segments={segments} activeIndex={activeIndex} onHover={setActiveIndex} />
        </div>
      )}
    </section>
  );
}
