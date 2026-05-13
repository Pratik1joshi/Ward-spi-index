'use client';

import { useState } from 'react';
import { municipalities } from '@/lib/data';
import { Pillar } from '@/lib/types';
import { MunicipalitySelector, PillarSelector, WardFilterSelector } from '@/components/Selectors';
import { KPICards } from '@/components/KPICards';
import { SPIGaugeChart } from '@/components/SPIGaugeChart';
import { CompositionChart } from '@/components/CompositionChart';
import { WardRankingsTable } from '@/components/WardRankingsTable';
import { MapSection } from '@/components/MapSection';
import { ExportButtons } from '@/components/ExportButtons';

export default function Dashboard() {
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState(municipalities[0].id);
  const [selectedPillar, setSelectedPillar] = useState<Pillar>('overall');
  const [selectedWardId, setSelectedWardId] = useState<string | undefined>();

  const selectedMunicipality = municipalities.find((m) => m.id === selectedMunicipalityId);

  if (!selectedMunicipality) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <main
      id="dashboard-container"
      className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-2 md:px-6"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Shared Prosperity Index Dashboard</h1>
        <p className="mt-2 text-gray-600">
          {selectedMunicipality.name}, {selectedMunicipality.district}
        </p>
      </div>

      <div className="mx-auto max-w-screen-2xl space-y-6">
        {/* Main Content Grid (responsive) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Map (balanced on desktop) */}
          <div className="lg:col-span-3">
            <MapSection
              municipality={selectedMunicipality}
              pillar={selectedPillar}
              onWardSelect={setSelectedWardId}
              municipalities={municipalities}
              selectedMunicipalityId={selectedMunicipalityId}
              setSelectedMunicipalityId={setSelectedMunicipalityId}
              selectedPillar={selectedPillar}
              setSelectedPillar={setSelectedPillar}
              selectedWardId={selectedWardId}
              setSelectedWardId={setSelectedWardId}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI Cards */}
            <KPICards municipality={selectedMunicipality} />

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              <SPIGaugeChart value={selectedMunicipality.overallSpi} />
              <CompositionChart
                exclusion={selectedMunicipality.exclusionIndex}
                poverty={selectedMunicipality.povertyIndex}
                vulnerability={selectedMunicipality.vulnerabilityIndex}
              />
            </div>

            {/* Rankings Table */}
            <WardRankingsTable
              municipality={selectedMunicipality}
              pillar={selectedPillar}
              limit={5}
            />

            {/* Export Buttons */}
            <div className="flex justify-between gap-4 rounded-lg bg-white p-6 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Export Data</h3>
                <p className="text-xs text-gray-600">Download dashboard data in multiple formats</p>
              </div>
              <ExportButtons municipalities={municipalities} />
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Dashboard Statistics</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded bg-slate-50 p-4">
              <p className="text-sm text-gray-600">Total Municipalities</p>
              <p className="text-2xl font-bold text-gray-900">{municipalities.length}</p>
            </div>
            <div className="rounded bg-slate-50 p-4">
              <p className="text-sm text-gray-600">Total Wards</p>
              <p className="text-2xl font-bold text-gray-900">
                {municipalities.reduce((sum, m) => sum + m.wards.length, 0)}
              </p>
            </div>
            <div className="rounded bg-slate-50 p-4">
              <p className="text-sm text-gray-600">Current Municipality Wards</p>
              <p className="text-2xl font-bold text-gray-900">{selectedMunicipality.wards.length}</p>
            </div>
            <div className="rounded bg-slate-50 p-4">
              <p className="text-sm text-gray-600">Avg SPI Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {(
                  municipalities.reduce((sum, m) => sum + m.overallSpi, 0) / municipalities.length
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
