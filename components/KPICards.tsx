'use client';

import { Card } from '@/components/ui/card';
import { LinkIcon, Home, AlertTriangle } from 'lucide-react';

interface KPICardsProps {
  exclusion: number;
  poverty: number;
  vulnerability: number;
}

export function KPICards({ exclusion, poverty, vulnerability }: KPICardsProps) {
  const cards = [
    {
      title: 'Exclusion Index',
      value: exclusion.toFixed(2),
      icon: LinkIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Poverty Index',
      value: poverty.toFixed(2),
      icon: Home,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Vulnerability Index',
      value: vulnerability.toFixed(2),
      icon: AlertTriangle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className={`${card.bgColor} border-0 p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <Icon className={`${card.color} h-8 w-8`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
