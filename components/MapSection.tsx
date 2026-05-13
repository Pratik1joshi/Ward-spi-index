
'use client';

import dynamic from 'next/dynamic';
import { Municipality, Pillar } from '@/lib/types';
import { Municipality as MunicipalityType } from '@/lib/types';

const WardMapClient = dynamic(
  () => import('@/components/WardMapClient').then((module) => module.WardMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[540px] items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-sm text-slate-400">
        Loading map...
      </div>
    ),
  }
);

interface MapSectionProps {
  municipality: Municipality;
  pillar: Pillar;
  onWardSelect?: (wardId: string) => void;

  // Selector state/handlers to render filters inside the map
  municipalities?: Municipality[];
  selectedMunicipalityId?: string;
  setSelectedMunicipalityId?: (id: string) => void;
  selectedPillar?: Pillar;
  setSelectedPillar?: (p: Pillar) => void;
  selectedWardId?: string | undefined;
  setSelectedWardId?: (id?: string) => void;
}

export function MapSection({
  municipality,
  pillar,
  onWardSelect,
  municipalities,
  selectedMunicipalityId,
  setSelectedMunicipalityId,
  selectedPillar,
  setSelectedPillar,
  selectedWardId,
  setSelectedWardId,
}: MapSectionProps) {
  return (
    <WardMapClient
      municipality={municipality}
      pillar={pillar}
      onWardSelect={onWardSelect}
      municipalities={municipalities}
      selectedMunicipalityId={selectedMunicipalityId}
      setSelectedMunicipalityId={setSelectedMunicipalityId}
      selectedPillar={selectedPillar}
      setSelectedPillar={setSelectedPillar}
      selectedWardId={selectedWardId}
      setSelectedWardId={setSelectedWardId}
    />
  );
}
