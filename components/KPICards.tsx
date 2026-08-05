'use client';

import { Card } from '@/components/ui/card';
import { LinkIcon, Home, AlertTriangle } from 'lucide-react';

interface KPICardsProps {
  exclusion: number;
  poverty: number;
  vulnerability: number;
}

export function KPICards({
  exclusion,
  poverty,
  vulnerability,
}: KPICardsProps) {
  const cards = [
    {
      title: 'Exclusion Index',
      value: `${exclusion.toFixed(1)}%`,
      icon: LinkIcon,
      color: '#3f6f9e',
    },
    {
      title: 'Poverty Index',
      value: `${poverty.toFixed(1)}%`,
      icon: Home,
      color: '#d97706',
    },
    {
      title: 'Vulnerability Index',
      value: `${vulnerability.toFixed(1)}%`,
      icon: AlertTriangle,
      color: '#4caf50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium leading-tight text-slate-500">{card.title}</p>
              <Icon className="h-4 w-4 shrink-0" style={{ color: card.color }} />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
