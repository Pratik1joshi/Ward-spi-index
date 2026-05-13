'use client';

import { Municipality, Pillar } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MunicipalitySelectorProps {
  municipalities: Municipality[];
  selectedId: string;
  onSelect: (id: string) => void;
}

interface PillarSelectorProps {
  selectedPillar: Pillar;
  onSelect: (pillar: Pillar) => void;
}

export function MunicipalitySelector({
  municipalities,
  selectedId,
  onSelect,
}: MunicipalitySelectorProps) {
  return (
    <div className="flex min-w-[200px] flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Select Municipality
      </label>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-full border-slate-300 bg-white text-slate-900 data-[placeholder]:text-slate-500">
          <SelectValue placeholder="Select municipality" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {municipalities.map((municipality) => (
            <SelectItem key={municipality.id} value={municipality.id}>
              {municipality.name} ({municipality.district})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PillarSelector({ selectedPillar, onSelect }: PillarSelectorProps) {
  const pillars: { value: Pillar; label: string }[] = [
    { value: 'overall', label: 'Overall SPI' },
    { value: 'exclusion', label: 'Exclusion Index' },
    { value: 'poverty', label: 'Poverty Index' },
    { value: 'vulnerability', label: 'Vulnerability Index' },
  ];

  return (
    <div className="flex min-w-[180px] flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Pillar
      </label>
      <Select value={selectedPillar} onValueChange={(value) => onSelect(value as Pillar)}>
        <SelectTrigger className="w-full border-slate-300 bg-white text-slate-900 data-[placeholder]:text-slate-500">
          <SelectValue placeholder="Select pillar" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {pillars.map((pillar) => (
            <SelectItem key={pillar.value} value={pillar.value}>
              {pillar.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function WardFilterSelector({
  wards,
  selectedId,
  onSelect,
}: {
  wards: any[];
  selectedId?: string;
  onSelect: (id?: string) => void;
}) {
  return (
    <div className="flex min-w-[180px] flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Filter by Ward
      </label>
      <Select value={selectedId || 'all'} onValueChange={(value) => onSelect(value === 'all' ? undefined : value)}>
        <SelectTrigger className="w-full border-slate-300 bg-white text-slate-900 data-[placeholder]:text-slate-500">
          <SelectValue placeholder="All wards" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All Wards</SelectItem>
          {wards.map((ward) => (
            <SelectItem key={ward.id} value={ward.id}>
              {ward.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
