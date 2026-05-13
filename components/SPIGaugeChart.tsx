'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

interface SPIGaugeChartProps {
  value: number;
  title?: string;
}

export function SPIGaugeChart({ value, title = 'Shared Prosperity Index (SPI)' }: SPIGaugeChartProps) {
  const gaugeData = useMemo(
    () => [
      { name: 'Used', value: value * 100 },
      { name: 'Remaining', value: (1 - value) * 100 },
    ],
    [value]
  );

  const gaugeColor = useMemo(() => {
    if (value < 0.2) return '#d32f2f';
    if (value < 0.35) return '#f57c00';
    if (value < 0.5) return '#ff9800';
    if (value < 0.65) return '#7cb342';
    if (value < 0.8) return '#388e3c';
    return '#1b5e20';
  }, [value]);

  return (
    <Card className="flex flex-col items-center justify-center border-0 bg-white p-8">
      <h3 className="mb-6 text-center text-lg font-semibold text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={false}
          >
            <Cell fill={gaugeColor} />
            <Cell fill="#e0e0e0" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-5xl font-bold text-gray-900">{value.toFixed(2)}</p>
      </div>
    </Card>
  );
}
