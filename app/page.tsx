'use client';

import { useMemo, useState } from 'react';
import { MapPinned } from 'lucide-react';
import { municipalities, households } from '@/lib/data';
import { Pillar } from '@/lib/types';
import { KPICards } from '@/components/KPICards';
import { SPIGaugeChart } from '@/components/SPIGaugeChart';
import { GesiProfileChart } from '@/components/GesiProfileChart';
import { HouseholdHeadPie } from '@/components/HouseholdHeadPie';
import { WardComparisonChart } from '@/components/WardComparisonChart';
import { WardAverageChart } from '@/components/WardAverageChart';
import { WardRankingsTable } from '@/components/WardRankingsTable';
import { MapSection } from '@/components/MapSection';
import { ExclusionRadarChart, VulnerabilityRadarChart, PovertyContributionChart } from '@/components/PillarBreakdownCharts';
import { HouseholdSex, filterHouseholds, summarizeHouseholds } from '@/lib/households';

export default function Dashboard() {
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(municipalities[0].id);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>('overall');
  const [selectedWardId, setSelectedWardId] = useState<string | undefined>();
  const [selectedSex, setSelectedSex] = useState<HouseholdSex>('all');
  const [selectedHouseholdTypes, setSelectedHouseholdTypes] = useState<string[]>([]);
  const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
  const municipality = municipalities.find((m) => m.id === selectedMunicipalityId)!;
  const ward = selectedWardId ? municipality.wards.find((item) => item.id === selectedWardId) : undefined;
  const contextLabel = ward ? ward.name : `${municipality.name} municipality`;

  // Every option list (household type / religion overlays) is drawn from all of this
  // municipality's households, independent of the current filter selection, so choices
  // never disappear as filters narrow the dataset.
  const municipalityHouseholds = useMemo(
    () => households.filter((household) => household.municipalityId === municipality.id),
    [municipality.id]
  );

  // Single source of truth: every chart, KPI, index, percentage, map layer and tooltip
  // below is derived from this one filtered array. AND across filter groups, OR within
  // the household type / religion multi-selects.
  const filteredHouseholds = useMemo(
    () =>
      filterHouseholds(households, {
        municipalityId: municipality.id,
        wardId: selectedWardId,
        sex: selectedSex,
        householdTypes: selectedHouseholdTypes,
        religions: selectedReligions,
      }),
    [municipality.id, selectedWardId, selectedSex, selectedHouseholdTypes, selectedReligions]
  );

  const summary = useMemo(() => summarizeHouseholds(filteredHouseholds), [filteredHouseholds]);

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
          <section id="ward-map" className="space-y-6 xl:col-span-7">
            <MapSection
              municipality={municipality}
              pillar={selectedPillar}
              onWardSelect={setSelectedWardId}
              municipalities={municipalities}
              selectedMunicipalityId={selectedMunicipalityId}
              setSelectedMunicipalityId={(id) => {
                setSelectedMunicipalityId(id);
                setSelectedWardId(undefined);
                setSelectedSex('all');
                setSelectedHouseholdTypes([]);
                setSelectedReligions([]);
              }}
              selectedPillar={selectedPillar}
              setSelectedPillar={setSelectedPillar}
              selectedWardId={selectedWardId}
              setSelectedWardId={setSelectedWardId}
              selectedSex={selectedSex}
              setSelectedSex={setSelectedSex}
              selectedHouseholdTypes={selectedHouseholdTypes}
              setSelectedHouseholdTypes={setSelectedHouseholdTypes}
              selectedReligions={selectedReligions}
              setSelectedReligions={setSelectedReligions}
              filteredHouseholds={filteredHouseholds}
              municipalityHouseholds={municipalityHouseholds}
            />
            <WardAverageChart municipality={municipality} pillar={selectedPillar} selectedWardId={selectedWardId} />
            <WardRankingsTable municipality={municipality} pillar={selectedPillar} limit={5} onWardSelect={(id) => { setSelectedWardId(id); document.getElementById('ward-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
          </section>

          <aside className="space-y-5 xl:col-span-5">
            {summary === null ? (
              <section className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className="text-sm font-medium text-slate-600">No households match the selected filters.</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  This often happens when sex, household type, religion, and ward are combined too tightly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWardId(undefined);
                    setSelectedSex('all');
                    setSelectedHouseholdTypes([]);
                    setSelectedReligions([]);
                  }}
                  className="mt-4 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                >
                  Clear all filters
                </button>
              </section>
            ) : (
              <>
                <KPICards
                  exclusion={summary.exclusionPercent}
                  poverty={summary.povertyPercent}
                  vulnerability={summary.vulnerabilityPercent}
                />
                <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87604d]">Selected place</p>
                      <h2 className="mt-1 text-lg font-semibold">{contextLabel}</h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {summary.totalHouseholds.toLocaleString()} households
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SPIGaugeChart value={summary.spi} title="Shared Prosperity Index" />
                    <HouseholdHeadPie
                      femaleHeaded={summary.femaleHeaded}
                      maleHeaded={summary.maleHeaded}
                    />
                  </div>
                  <div className="mt-3 grid gap-4">
                    <GesiProfileChart data={summary.religion} metric="religion" compact />
                    <GesiProfileChart data={summary.householdType} metric="household" compact />
                  </div>
                </section>
              </>
            )}
          </aside>
        </div>

        {summary ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-12">
            <div className={summary.povertyComponents.headcountRatio > 0 ? 'xl:col-span-4' : 'xl:col-span-6'}>
              <ExclusionRadarChart components={summary.exclusionComponents} />
            </div>
            <div className={summary.povertyComponents.headcountRatio > 0 ? 'xl:col-span-4' : 'xl:col-span-6'}>
              <VulnerabilityRadarChart components={summary.vulnerabilityComponents} />
            </div>
            {summary.povertyComponents.headcountRatio > 0 ? (
              <div className="xl:col-span-4">
                <PovertyContributionChart components={summary.povertyComponents} />
              </div>
            ) : null}
          </section>
        ) : null}

        {/* <section className="mt-6 grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-12"><WardComparisonChart municipality={municipality} pillar={selectedPillar} selectedWardId={selectedWardId} /></div>
        </section> */}

        <footer className="mt-6 flex flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between"><span>SPI identifies geographic outcomes; GESI provides the household inclusion context.</span><span>Click any ward to explore its combined profile.</span></footer>
      </div>
    </main>
  );
}
