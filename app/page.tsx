'use client';

import { useMemo, useState } from 'react';
import { MapPinned } from 'lucide-react';
import { municipalities, households } from '@/lib/data';
import { Pillar } from '@/lib/types';
import { KPICards } from '@/components/KPICards';
import { SPIGaugeChart } from '@/components/SPIGaugeChart';
import { GesiProfileChart } from '@/components/GesiProfileChart';
import { HouseholdHeadPie } from '@/components/HouseholdHeadPie';
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

  const municipalityHouseholds = useMemo(
    () => households.filter((household) => household.municipalityId === municipality.id),
    [municipality.id]
  );

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
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-4 text-slate-900 sm:px-4 sm:py-5 md:px-8 md:py-7">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#87604d] sm:mb-3 sm:text-xs">
              Ward-level dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {municipality.name}{' '}
              <span className="font-normal text-slate-400">at a glance</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Shared Prosperity Index and household inclusion data, mapped ward by ward.
            </p>
          </div>
          <div className="inline-flex w-fit max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm sm:px-4 sm:py-2 sm:text-sm">
            <MapPinned className="mr-2 h-4 w-4 shrink-0 text-[#d66a4b]" />
            <span className="truncate">
              {municipality.name}, {municipality.district}
            </span>
          </div>
        </header>

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-12">
          <section id="ward-map" className="min-w-0 space-y-4 sm:space-y-6 xl:col-span-7">
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
            <WardRankingsTable
              municipality={municipality}
              pillar={selectedPillar}
              limit={5}
              onWardSelect={(id) => {
                setSelectedWardId(id);
                document.getElementById('ward-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          </section>

          <aside className="min-w-0 space-y-4 sm:space-y-5 xl:col-span-5">
            {summary === null ? (
              <section className="flex h-56 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:h-64 sm:p-5">
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
                <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#87604d]">Selected place</p>
                      <h2 className="mt-1 truncate text-base font-semibold sm:text-lg">{contextLabel}</h2>
                    </div>
                    <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {summary.totalHouseholds.toLocaleString()} households
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SPIGaugeChart value={summary.spi} title="Shared Prosperity Index" />
                    <HouseholdHeadPie femaleHeaded={summary.femaleHeaded} maleHeaded={summary.maleHeaded} />
                  </div>
                  <div className="mt-3 grid gap-3 sm:gap-4">
                    <GesiProfileChart data={summary.religion} metric="religion" compact />
                    <GesiProfileChart data={summary.householdType} metric="household" compact />
                  </div>
                </section>
              </>
            )}
          </aside>
        </div>

        {summary ? (
          <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2 xl:grid-cols-12">
            <div className={summary.povertyComponents.headcountRatio > 0 ? 'min-w-0 xl:col-span-4' : 'min-w-0 md:col-span-1 xl:col-span-6'}>
              <ExclusionRadarChart components={summary.exclusionComponents} />
            </div>
            <div className={summary.povertyComponents.headcountRatio > 0 ? 'min-w-0 xl:col-span-4' : 'min-w-0 md:col-span-1 xl:col-span-6'}>
              <VulnerabilityRadarChart components={summary.vulnerabilityComponents} />
            </div>
            {summary.povertyComponents.headcountRatio > 0 ? (
              <div className="min-w-0 md:col-span-2 xl:col-span-4">
                <PovertyContributionChart components={summary.povertyComponents} />
              </div>
            ) : null}
          </section>
        ) : null}

        <footer className="mt-4 flex flex-col gap-2 border-t border-slate-200 py-4 text-xs text-slate-500 sm:mt-6 sm:flex-row sm:justify-between sm:py-5">
          <span>SPI identifies geographic outcomes; GESI provides the household inclusion context.</span>
          <span>Tap any ward to explore its combined profile.</span>
        </footer>
      </div>
    </main>
  );
}
