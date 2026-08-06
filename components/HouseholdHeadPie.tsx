'use client';

import { useState } from 'react';
import { DonutChart, DonutLegend } from '@/components/DonutChart';
import { HouseholdSex } from '@/lib/households';

export function HouseholdHeadPie({
  femaleHeaded,
  maleHeaded,
}: {
  femaleHeaded: number;
  maleHeaded: number;
  sexFilter?: HouseholdSex;
  totalHouseholds?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  const segments = [
    { name: 'Female-headed', value: femaleHeaded, color: '#d66a4b' },
    { name: 'Male-headed', value: maleHeaded, color: '#94a3b8' },
  ];
  const defaultIndex = segments.findIndex((segment) => segment.value > 0);
  const active =
    activeIndex === null || segments[activeIndex]?.value <= 0
      ? segments[Math.max(0, defaultIndex)]
      : segments[activeIndex];

  return (
    <section className="rounded-lg border border-slate-200 bg-[#fcfaf8] p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-slate-900">Household head sex</h3>

      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4 md:flex-col">
        <DonutChart
          segments={segments}
          size={132}
          innerRatio={0.68}
          defaultActiveIndex={Math.max(0, defaultIndex)}
          onActiveChange={setActiveIndex}
          center={
            <div className="flex flex-col items-center px-2 text-center">
              <span className="text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">{active.value.toFixed(1)}%</span>
              <span className="mt-0.5 max-w-[72px] text-[10px] leading-tight text-slate-500">{active.name}</span>
            </div>
          }
        />
        <DonutLegend segments={segments} activeIndex={activeIndex} onHover={setActiveIndex} formatValue={(v) => `${v.toFixed(1)}%`} />
      </div>
    </section>
  );
}
