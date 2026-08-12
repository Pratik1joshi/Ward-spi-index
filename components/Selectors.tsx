'use client';

import { Municipality, Pillar } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { getGesiCategoryColor } from '@/lib/colors';
import { Users2, ChevronDown } from 'lucide-react';

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
    <div className="flex w-full min-w-0 flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        Select Municipality
      </label>
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-full border-slate-300 bg-white text-slate-900 data-[placeholder]:text-slate-500">
          <SelectValue placeholder="Select municipality" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All Municipalities</SelectItem>
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
    { value: 'none', label: 'None (no colour)' },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
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
    <div className="flex w-full min-w-0 flex-col gap-2">
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

export function GesiCategorySelector({
  categories,
  selected,
  onChange,
  label = 'GESI overlay',
}: {
  categories: string[];
  selected: string[];
  onChange: (categories: string[]) => void;
  label?: string;
}) {
  const toggle = (name: string) => {
    onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between border-slate-300 bg-white font-normal text-slate-900 hover:bg-white"
          >
            <span className="flex items-center gap-2 truncate">
              <Users2 className="h-4 w-4 shrink-0 text-slate-500" />
              {selected.length === 0 ? 'None selected' : `${selected.length} categor${selected.length === 1 ? 'y' : 'ies'}`}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(16rem,calc(100vw-2rem))] bg-white p-2" align="start">
          <div className="max-h-64 space-y-0.5 overflow-y-auto">
            {categories.map((name) => (
              <label
                key={name}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Checkbox checked={selected.includes(name)} onCheckedChange={() => toggle(name)} />
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getGesiCategoryColor(name) }} />
                <span className="truncate">{name}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              Clear selection
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function HouseholdSexSelector({
  selected,
  onSelect,
}: {
  selected: 'all' | 'female' | 'male';
  onSelect: (value: 'all' | 'female' | 'male') => void;
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">Household head sex</label>
      <Select value={selected} onValueChange={(value) => onSelect(value as 'all' | 'female' | 'male')}>
        <SelectTrigger className="w-full border-slate-300 bg-white text-slate-900 data-[placeholder]:text-slate-500">
          <SelectValue placeholder="All households" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All households</SelectItem>
          <SelectItem value="female">Female-headed</SelectItem>
          <SelectItem value="male">Male-headed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
