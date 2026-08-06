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
      shortTitle: 'Exclusion',
      value: `${exclusion.toFixed(1)}%`,
      icon: LinkIcon,
      color: '#3f6f9e',
    },
    {
      title: 'Poverty Index',
      shortTitle: 'Poverty',
      value: `${poverty.toFixed(1)}%`,
      icon: Home,
      color: '#d97706',
    },
    {
      title: 'Vulnerability Index',
      shortTitle: 'Vulnerability',
      value: `${vulnerability.toFixed(1)}%`,
      icon: AlertTriangle,
      color: '#4caf50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="min-w-0 border border-slate-200 bg-white p-2.5 shadow-sm sm:p-4">
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <p className="text-[10px] font-medium leading-tight text-slate-500 sm:text-xs">
                <span className="sm:hidden">{card.shortTitle}</span>
                <span className="hidden sm:inline">{card.title}</span>
              </p>
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" style={{ color: card.color }} />
            </div>
            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">
              {card.value}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
