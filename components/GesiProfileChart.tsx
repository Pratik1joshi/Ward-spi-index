'use client';

import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, type PieSectorDataItem } from 'recharts';
import { GesiProfile } from '@/lib/types';

const chartColors = ['#0f766e', '#2563eb', '#d97706', '#db2777'];

function renderActiveShape({ cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value }: PieSectorDataItem) {
  const radians = Math.PI / 180;
  const sin = Math.sin(-radians * (midAngle ?? 0));
  const cos = Math.cos(-radians * (midAngle ?? 0));
  const startX = (cx ?? 0) + ((outerRadius ?? 0) + 8) * cos;
  const startY = (cy ?? 0) + ((outerRadius ?? 0) + 8) * sin;
  const middleX = (cx ?? 0) + ((outerRadius ?? 0) + 23) * cos;
  const middleY = (cy ?? 0) + ((outerRadius ?? 0) + 23) * sin;
  const endX = middleX + (cos >= 0 ? 1 : -1) * 18;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  const labelX = endX + (cos >= 0 ? 1 : -1) * 7;

  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={(outerRadius ?? 0) + 4} outerRadius={(outerRadius ?? 0) + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <path d={`M${startX},${startY}L${middleX},${middleY}L${endX},${middleY}`} stroke={fill} fill="none" />
      <circle cx={endX} cy={middleY} r={2} fill={fill} />
      <text x={cx} y={cy} dy={-2} textAnchor="middle" className="fill-slate-800 text-[10px] font-semibold">{payload.name}</text>
      <text x={cx} y={cy} dy={13} textAnchor="middle" className="fill-slate-500 text-[9px]">{`${value}% of households`}</text>
      <text x={labelX} y={middleY} textAnchor={textAnchor} className="fill-slate-700 text-[10px] font-semibold">{payload.name}</text>
      <text x={labelX} y={middleY} dy={13} textAnchor={textAnchor} className="fill-slate-500 text-[9px]">{`${((percent ?? 0) * 100).toFixed(1)}%`}</text>
    </g>
  );
}

export function GesiProfileChart({ profile, metric, compact = false }: { profile: GesiProfile; metric: 'sex' | 'religion' | 'household'; compact?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const data = metric === 'sex'
    ? [{ name: 'Female-headed', value: profile.femaleHeaded }, { name: 'Male-headed', value: profile.maleHeaded }]
    : metric === 'religion' ? profile.religion : profile.householdType;
  const title = metric === 'sex' ? 'Household head sex' : metric === 'religion' ? 'Religion' : 'Household type';

  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${compact ? 'p-3' : 'p-5'} shadow-sm`}>
      <div className="mb-2 flex items-baseline justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">GESI profile</p><h3 className={`${compact ? 'text-sm' : 'text-base'} mt-1 font-semibold text-slate-900`}>{title}</h3></div>
        <span className="text-xs text-slate-500">% of households</span>
      </div>
      <ResponsiveContainer width="100%" height={compact ? 200 : 260}>
        <PieChart margin={{ top: 20, right: 52, bottom: 10, left: 52 }}>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="47%" innerRadius={compact ? 34 : 44} outerRadius={compact ? 58 : 72} paddingAngle={3} activeIndex={activeIndex} activeShape={renderActiveShape} onMouseEnter={(_, index) => setActiveIndex(index)}>
            {data.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={chartColors[index % chartColors.length]} stroke="white" strokeWidth={2} />)}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value}%`, name]} contentStyle={{ borderRadius: 10, borderColor: '#cbd5e1' }} />
          <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(value: string) => <span className="text-[10px] font-medium text-slate-600">{value.length > 18 ? `${value.slice(0, 18)}…` : value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </section>
  );
}
