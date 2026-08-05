'use client';

import { Card } from '@/components/ui/card';

interface SPIGaugeChartProps {
  value: number;
  title?: string;
}

export function SPIGaugeChart({ value, title = 'Shared Prosperity Index (SPI)' }: SPIGaugeChartProps) {
  const gaugeColor = value < 45 ? '#8eafd0' : value < 60 ? '#638db9' : '#3f6f9e';
  const clamped = Math.min(100, Math.max(0, value));
  const endAngle = 180 - (clamped / 100) * 180;
  const endX = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
  const endY = 100 - 80 * Math.sin((endAngle * Math.PI) / 180);

  return (
    <Card className="flex flex-col items-center justify-center border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-center text-sm font-semibold text-gray-900">{title}</h3>
      <div className="relative mt-1 h-[120px] w-full max-w-[200px]">
        <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e8edf2" strokeWidth="18" strokeLinecap="butt" />
          {clamped > 0 ? (
            <path
              d={`M 20 100 A 80 80 0 0 1 ${endX.toFixed(2)} ${endY.toFixed(2)}`}
              fill="none"
              stroke={gaugeColor}
              strokeWidth="18"
              strokeLinecap="butt"
            />
          ) : null}
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="text-3xl font-semibold tabular-nums text-gray-900">{value.toFixed(1)}</p>
        </div>
      </div>
    </Card>
  );
}
