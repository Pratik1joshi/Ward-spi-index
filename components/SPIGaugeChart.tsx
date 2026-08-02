'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface SPIGaugeChartProps {
  value: number;
  title?: string;
}

export function SPIGaugeChart({ value, title = 'Shared Prosperity Index (SPI)' }: SPIGaugeChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gaugeData = useMemo(
    () => [
      { name: 'Used', value },
      { name: 'Remaining', value: 100 - value },
    ],
    [value]
  );

  const gaugeColor = useMemo(() => {
    if (value < 45) return '#8eafd0';
    if (value < 60) return '#638db9';
    return '#3f6f9e';
  }, [value]);

  return (
    <Card className="flex flex-col items-center justify-center border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-0 text-center text-sm font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={174}>
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={54}
            outerRadius={84}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive
            activeIndex={activeIndex ?? undefined}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <Cell fill={gaugeColor} />
            <Cell fill="#e0e0e0" />
          </Pie>
          <Tooltip
            formatter={(rawValue, name) => [
              `${Number(rawValue).toFixed(1)}%`,
              name === 'Used' ? 'SPI' : 'Remaining',
            ]}
            contentStyle={{ borderRadius: '0.75rem', borderColor: '#e2e8f0' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="-mt-5 text-center">
        <p className="text-3xl font-semibold text-gray-900">{value.toFixed(1)}</p>
      </div>
    </Card>
  );
}
