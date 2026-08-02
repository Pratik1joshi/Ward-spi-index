'use client';

import { useState } from 'react';
import { MapPinned } from 'lucide-react';
import { municipalities } from '@/lib/data';
import { Pillar } from '@/lib/types';
import { KPICards } from '@/components/KPICards';
import { SPIGaugeChart } from '@/components/SPIGaugeChart';
import { GesiProfileChart } from '@/components/GesiProfileChart';
import { HouseholdHeadPie } from '@/components/HouseholdHeadPie';
import { WardComparisonChart } from '@/components/WardComparisonChart';
import { WardRankingsTable } from '@/components/WardRankingsTable';
import { MapSection } from '@/components/MapSection';

export default function Dashboard() {
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(municipalities[0].id);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>('overall');
  const [selectedWardId, setSelectedWardId] = useState<string | undefined>();
  const municipality = municipalities.find((m) => m.id === selectedMunicipalityId)!;
  const ward = selectedWardId ? municipality.wards.find((item) => item.id === selectedWardId) : undefined;
  const profile = ward?.gesi ?? municipality.gesi;
  const spi = ward?.spiScore ?? municipality.overallSpi;
  const exclusion = ward?.exclusionIndex ?? municipality.exclusionIndex;
  const poverty = ward?.povertyIndex ?? municipality.povertyIndex;
  const vulnerability = ward?.vulnerabilityIndex ?? municipality.vulnerabilityIndex;
  const contextLabel = ward ? ward.name : `${municipality.name} municipality`;

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-5 text-slate-900 md:px-8 md:py-7">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#87604d]">Ward-level dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{municipality.name} <span className="font-normal text-slate-400">at a glance</span></h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Shared Prosperity Index and household inclusion data, mapped ward by ward.</p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm"><MapPinned className="mr-2 inline h-4 w-4 text-[#d66a4b]" /> {municipality.name}, {municipality.district}</div>
        </header>

        <div className="grid gap-6 xl:grid-cols-12">
          <section id="ward-map" className="xl:col-span-7"><MapSection municipality={municipality} pillar={selectedPillar} onWardSelect={setSelectedWardId} municipalities={municipalities} selectedMunicipalityId={selectedMunicipalityId} setSelectedMunicipalityId={(id) => { setSelectedMunicipalityId(id); setSelectedWardId(undefined); }} selectedPillar={selectedPillar} setSelectedPillar={setSelectedPillar} selectedWardId={selectedWardId} setSelectedWardId={setSelectedWardId} /></section>

          <aside className="space-y-5 xl:col-span-5">
            <KPICards exclusion={exclusion} poverty={poverty} vulnerability={vulnerability} />
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87604d]">Selected place</p><h2 className="mt-1 text-lg font-semibold">{contextLabel}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Household profile</span></div><div className="grid gap-3 sm:grid-cols-2"><SPIGaugeChart value={spi} title="Shared Prosperity Index" /><HouseholdHeadPie profile={profile} /></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><GesiProfileChart profile={profile} metric="religion" compact /><GesiProfileChart profile={profile} metric="household" compact /></div></section>
          </aside>
        </div>

        <section className="mt-6 grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-6"><WardComparisonChart municipality={municipality} pillar={selectedPillar} selectedWardId={selectedWardId} /></div>
          <div className="xl:col-span-6"><WardRankingsTable municipality={municipality} pillar={selectedPillar} limit={5} onWardSelect={(id) => { setSelectedWardId(id); document.getElementById('ward-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} /></div>
        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>SPI identifies geographic outcomes; GESI provides the household inclusion context.</span><span>Click any ward to explore its combined profile.</span></footer>
      </div>
    </main>
  );
}
