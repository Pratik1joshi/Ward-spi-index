'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface CompositionChartProps {
  exclusion: number;
  poverty: number;
  vulnerability: number;
}

export function CompositionChart({ exclusion, poverty, vulnerability }: CompositionChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const data = useMemo(() => {
    const total = exclusion + poverty + vulnerability;
    if (total === 0) {
      return [
        { name: 'Exclusion', value: 0, fill: '#1976d2' },
        { name: 'Poverty', value: 0, fill: '#ff9800' },
        { name: 'Vulnerability', value: 0, fill: '#4caf50' },
      ];
    }

    return [
      {
        name: 'Exclusion',
        value: Math.round((exclusion / total) * 100),
        fill: '#1976d2',
      },
      {
        name: 'Poverty',
        value: Math.round((poverty / total) * 100),
        fill: '#ff9800',
      },
      {
        name: 'Vulnerability',
        value: Math.round((vulnerability / total) * 100),
        fill: '#4caf50',
      },
    ];
  }, [exclusion, poverty, vulnerability]);

  return (
    <Card className="border-0 bg-white p-8">
      <h3 className="mb-6 text-lg font-semibold text-gray-900">SPI Composition</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive
            activeIndex={activeIndex ?? undefined}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(rawValue, name) => [`${Number(rawValue).toFixed(0)}%`, name]}
            contentStyle={{ borderRadius: '0.75rem', borderColor: '#e2e8f0' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
