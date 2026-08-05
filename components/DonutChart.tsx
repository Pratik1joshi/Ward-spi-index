'use client';

import { useEffect, useMemo, useState } from 'react';

export type DonutSegment = {
  name: string;
  value: number;
  color: string;
};

interface DonutArc extends DonutSegment {
  index: number;
  start: number;
  end: number;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: round(cx + r * Math.cos(rad)), y: round(cy + r * Math.sin(rad)) };
}

function arcPath(cx: number, cy: number, outerR: number, innerR: number, start: number, end: number) {
  if (end - start >= 359.99) {
    end = start + 359.99;
  }
  const outerStart = polar(cx, cy, outerR, start);
  const outerEnd = polar(cx, cy, outerR, end);
  const innerEnd = polar(cx, cy, innerR, end);
  const innerStart = polar(cx, cy, innerR, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${round(outerR)} ${round(outerR)} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${round(innerR)} ${round(innerR)} 0 ${large} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  innerRatio?: number;
  center?: React.ReactNode;
  defaultActiveIndex?: number;
  onActiveChange?: (index: number | null) => void;
  className?: string;
}

export function DonutChart({
  segments,
  size = 160,
  innerRatio = 0.62,
  center,
  defaultActiveIndex = 0,
  onActiveChange,
  className = '',
}: DonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(defaultActiveIndex);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visible = useMemo(() => segments.filter((segment) => segment.value > 0), [segments]);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);

  const arcs = useMemo(() => {
    if (total <= 0) return [] as DonutArc[];
    let angle = 0;
    return segments
      .map((segment, index) => ({ ...segment, index }))
      .filter((segment) => segment.value > 0)
      .map((segment) => {
        const sweep = (segment.value / total) * 360;
        const start = angle;
        const end = angle + sweep;
        angle = end;
        return { ...segment, start, end };
      });
  }, [segments, total]);

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * innerRatio;

  const setActive = (index: number | null) => {
    setActiveIndex(index);
    onActiveChange?.(index);
  };

  if (total <= 0) {
    return (
      <div className={`flex items-center justify-center text-sm text-slate-400 ${className}`} style={{ width: size, height: size }}>
        No data
      </div>
    );
  }

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      {mounted ? (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
          {arcs.length === 1 ? (
            <circle
              cx={round(cx)}
              cy={round(cy)}
              r={round((outerR + innerR) / 2)}
              fill="none"
              stroke={arcs[0].color}
              strokeWidth={round(outerR - innerR)}
              className="cursor-default"
            />
          ) : (
            arcs.map((arc) => (
              <path
                key={arc.name}
                d={arcPath(cx, cy, outerR, innerR, arc.start, arc.end)}
                fill={arc.color}
                opacity={activeIndex === null || activeIndex === arc.index ? 1 : 0.45}
                className="cursor-pointer transition-opacity duration-150"
                onMouseEnter={() => setActive(arc.index)}
                onMouseLeave={() => setActive(defaultActiveIndex)}
              />
            ))
          )}
        </svg>
      ) : (
        <div className="h-full w-full rounded-full bg-slate-100" />
      )}
      {center ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">{center}</div>
      ) : null}
    </div>
  );
}

export function DonutLegend({
  segments,
  activeIndex,
  onHover,
  formatValue = (value) => `${value.toFixed(1)}%`,
}: {
  segments: DonutSegment[];
  activeIndex?: number | null;
  onHover?: (index: number | null) => void;
  formatValue?: (value: number) => string;
}) {
  const visible = segments.filter((segment) => segment.value > 0);
  if (visible.length === 0) return null;

  return (
    <div className="grid gap-1.5">
      {segments.map((segment, index) => {
        if (segment.value <= 0) return null;
        return (
          <button
            key={segment.name}
            type="button"
            onMouseEnter={() => onHover?.(index)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(index)}
            className={`flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left transition-colors ${
              activeIndex === index ? 'bg-slate-100' : 'hover:bg-slate-50'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="truncate">{segment.name}</span>
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">{formatValue(segment.value)}</span>
          </button>
        );
      })}
    </div>
  );
}
