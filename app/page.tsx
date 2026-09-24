'use client';

import { useMemo, useState } from 'react';
import { MapPinned } from 'lucide-react';
import { municipalities, households } from '@/lib/data';
import { Municipality, Pillar, Ward } from '@/lib/types';
import { KPICards } from '@/components/KPICards';
import { SPIGaugeChart } from '@/components/SPIGaugeChart';
import { GesiProfileChart } from '@/components/GesiProfileChart';
import { HouseholdHeadPie } from '@/components/HouseholdHeadPie';
import { WardAverageChart } from '@/components/WardAverageChart';
import { WardRankingsTable } from '@/components/WardRankingsTable';
import { MapSection } from '@/components/MapSection';
import { ExclusionRadarChart, VulnerabilityRadarChart, PovertyContributionChart } from '@/components/PillarBreakdownCharts';
import { groupByWard, HouseholdSex, HouseholdSummary, filterHouseholds, summarizeHouseholds } from '@/lib/households';

const projectTitle = 'Shared Prosperity Mapping in six municipalities in Koshi River Basin, Nepal';
const ALL_MUNICIPALITIES_ID = 'all';

function applyAggregateMetrics(
  summary: HouseholdSummary | null,
  aggregate: Municipality | Ward | undefined,
  enabled: boolean
): HouseholdSummary | null {
  if (!summary || !aggregate || !enabled) return summary;
  return {
    ...summary,
    spi: 'spiScore' in aggregate ? aggregate.spiScore : aggregate.overallSpi,
    exclusionPercent: aggregate.exclusionPercent ?? aggregate.exclusionIndex * 100,
    povertyPercent: aggregate.povertyPercent ?? aggregate.povertyIndex * 100,
    vulnerabilityPercent: aggregate.vulnerabilityPercent ?? aggregate.vulnerabilityIndex * 100,
    exclusionComponents: aggregate.exclusionComponents ?? summary.exclusionComponents,
    povertyComponents: aggregate.povertyComponents ?? summary.povertyComponents,
    vulnerabilityComponents: aggregate.vulnerabilityComponents ?? summary.vulnerabilityComponents,
  };
}

function buildAllMunicipalitiesView(): Municipality {
  const wards = municipalities.flatMap((municipality) =>
    municipality.wards.map((ward) => ({ ...ward, name: `${municipality.name} · ${ward.name}` }))
  );
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
  return {
    id: ALL_MUNICIPALITIES_ID,
    name: 'All Municipalities',
    district: 'Koshi River Basin',
    overallSpi: average(municipalities.map((item) => item.overallSpi)),
    exclusionIndex: average(municipalities.map((item) => item.exclusionIndex)),
    povertyIndex: average(municipalities.map((item) => item.povertyIndex)),
    vulnerabilityIndex: average(municipalities.map((item) => item.vulnerabilityIndex)),
    wards,
  };
}

const allMunicipalitiesView = buildAllMunicipalitiesView();

function findMunicipalityIdForWard(wardId: string): string | undefined {
  return municipalities.find((item) => item.wards.some((ward) => ward.id === wardId))?.id;
}

export default function Dashboard() {
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(ALL_MUNICIPALITIES_ID);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>('overall');
  const [selectedWardId, setSelectedWardId] = useState<string | undefined>();
  const [selectedSex, setSelectedSex] = useState<HouseholdSex>('all');
  const [selectedHouseholdTypes, setSelectedHouseholdTypes] = useState<string[]>([]);
  const [selectedReligions, setSelectedReligions] = useState<string[]>([]);
  const municipality = selectedMunicipalityId === ALL_MUNICIPALITIES_ID
    ? allMunicipalitiesView
    : municipalities.find((m) => m.id === selectedMunicipalityId) ?? allMunicipalitiesView;
  const ward = selectedWardId ? municipality.wards.find((item) => item.id === selectedWardId) : undefined;
  const contextLabel = ward ? ward.name : municipality.name;

  const municipalityHouseholds = useMemo(
    () => selectedMunicipalityId === ALL_MUNICIPALITIES_ID
      ? households
      : households.filter((household) => household.municipalityId === municipality.id),
    [municipality.id, selectedMunicipalityId]
  );

  const filteredHouseholds = useMemo(
    () =>
      filterHouseholds(households, {
        municipalityId: selectedMunicipalityId,
        wardId: selectedWardId,
        sex: selectedSex,
        householdTypes: selectedHouseholdTypes,
        religions: selectedReligions,
      }),
    [municipality.id, selectedMunicipalityId, selectedWardId, selectedSex, selectedHouseholdTypes, selectedReligions]
  );

  // Keep the comparison universe intact when one ward is selected. Demographic
  // filters still apply, so every map/chart value describes the same population.
  const comparisonHouseholds = useMemo(
    () =>
      filterHouseholds(households, {
        municipalityId: selectedMunicipalityId,
        sex: selectedSex,
        householdTypes: selectedHouseholdTypes,
        religions: selectedReligions,
      }),
    [selectedMunicipalityId, selectedSex, selectedHouseholdTypes, selectedReligions]
  );

  const useAggregateMetrics = selectedSex === 'all' && selectedHouseholdTypes.length === 0 && selectedReligions.length === 0;

  const comparisonSummary = useMemo(
    () => applyAggregateMetrics(
      summarizeHouseholds(comparisonHouseholds),
      municipality.id === ALL_MUNICIPALITIES_ID ? undefined : municipality,
      useAggregateMetrics
    ),
    [comparisonHouseholds, municipality, useAggregateMetrics]
  );

  const wardSummaries = useMemo(() => {
    const result = new Map<string, HouseholdSummary>();
    for (const [wardId, group] of groupByWard(comparisonHouseholds)) {
      const wardSummary = summarizeHouseholds(group);
      const aggregateWard = municipality.wards.find((item) => item.id === wardId);
      const displaySummary = applyAggregateMetrics(wardSummary, aggregateWard, useAggregateMetrics);
      if (displaySummary) result.set(wardId, displaySummary);
    }
    return result;
  }, [comparisonHouseholds, municipality.wards, useAggregateMetrics]);

  const municipalitySummaries = useMemo(() => {
    const groups = new Map<string, typeof comparisonHouseholds>();
    for (const household of comparisonHouseholds) {
      const group = groups.get(household.municipalityId);
      if (group) group.push(household);
      else groups.set(household.municipalityId, [household]);
    }
    const result = new Map<string, HouseholdSummary>();
    for (const [municipalityId, group] of groups) {
      const municipalitySummary = summarizeHouseholds(group);
      const aggregateMunicipality = municipalities.find((item) => item.id === municipalityId);
      const displaySummary = applyAggregateMetrics(municipalitySummary, aggregateMunicipality, useAggregateMetrics);
      if (displaySummary) result.set(municipalityId, displaySummary);
    }
    return result;
  }, [comparisonHouseholds, useAggregateMetrics]);

  const summary = useMemo(() => {
    const rawSummary = summarizeHouseholds(filteredHouseholds);
    const aggregate = ward ?? (municipality.id === ALL_MUNICIPALITIES_ID ? undefined : municipality);
    return applyAggregateMetrics(rawSummary, aggregate, useAggregateMetrics);
  }, [filteredHouseholds, municipality, useAggregateMetrics, ward]);
  const showPoverty = Boolean(summary && summary.povertyComponents.headcountRatio > 0);

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-4 text-slate-900 sm:px-4 sm:py-5 md:px-8 md:py-7">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {municipality.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-600 sm:text-base">
              {projectTitle}
            </p>
          </div>
          {/* <div className="inline-flex w-fit max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm sm:px-4 sm:py-2 sm:text-sm">
            <MapPinned className="mr-2 h-4 w-4 shrink-0 text-[#d66a4b]" />
            <span className="truncate">
              {municipality.name}, {municipality.district}
            </span>
          </div> */}
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
              municipalityHouseholds={municipalityHouseholds}
              wardSummaries={wardSummaries}
            />
            <WardAverageChart
              municipality={municipality}
              municipalities={municipalities}
              pillar={selectedPillar}
              selectedWardId={selectedWardId}
              wardSummaries={wardSummaries}
              municipalitySummaries={municipalitySummaries}
              comparisonSummary={comparisonSummary}
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

        <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-12">
          <div className={showPoverty ? 'min-w-0 xl:col-span-7' : 'min-w-0 xl:col-span-12'}>
            <WardRankingsTable
              municipality={municipality}
              pillar={selectedPillar}
              limit={5}
              onWardSelect={(id) => {
                if (selectedMunicipalityId === ALL_MUNICIPALITIES_ID) {
                  const ownerId = findMunicipalityIdForWard(id);
                  if (ownerId) setSelectedMunicipalityId(ownerId);
                }
                setSelectedWardId(id);
                document.getElementById('ward-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              wardSummaries={wardSummaries}
            />
          </div>
          {summary && showPoverty ? (
            <div className="min-w-0 xl:col-span-5">
              <PovertyContributionChart components={summary.povertyComponents} />
            </div>
          ) : null}
        </section>

        {summary ? (
          <section className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 md:grid-cols-2">
            <div className="min-w-0">
              <ExclusionRadarChart components={summary.exclusionComponents} />
            </div>
            <div className="min-w-0">
              <VulnerabilityRadarChart components={summary.vulnerabilityComponents} />
            </div>
          </section>
        ) : null}

        <footer className="mt-4 flex flex-col gap-2 border-t border-slate-200 py-4 text-xs text-slate-500 sm:mt-6 sm:flex-row sm:justify-between sm:py-5">
          <span>Prepared by Innovative Engineering Services Pvt. Ltd.</span>
        </footer>
      </div>
    </main>
  );
}
