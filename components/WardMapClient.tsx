'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import shp from 'shpjs';
import * as L from 'leaflet';
import { CircleMarker, GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Card } from '@/components/ui/card';
import { MunicipalitySelector, PillarSelector, WardFilterSelector, GesiCategorySelector, HouseholdSexSelector } from '@/components/Selectors';
import { getGesiCategoryColor, buildGesiConicGradient, getPillarColor } from '@/lib/colors';
import { getPercentByPillar, isHigherBetter } from '@/lib/data';
import { HouseholdSex, HouseholdSummary, groupByWard, summarizeHouseholds } from '@/lib/households';
import { Household, Municipality, Pillar } from '@/lib/types';

function pillarPercent(summary: HouseholdSummary, pillar: Pillar): number {
  if (pillar === 'exclusion') return summary.exclusionPercent;
  if (pillar === 'poverty') return summary.povertyPercent;
  if (pillar === 'vulnerability') return summary.vulnerabilityPercent;
  return summary.spi;
}

interface WardMapClientProps {
  municipality: Municipality;
  pillar: Pillar;
  onWardSelect?: (wardId: string) => void;

  // Optional selector state/handlers forwarded from page
  municipalities?: Municipality[];
  selectedMunicipalityId?: string;
  setSelectedMunicipalityId?: (id: string) => void;
  selectedPillar?: Pillar;
  setSelectedPillar?: (p: Pillar) => void;
  selectedWardId?: string | undefined;
  setSelectedWardId?: (id?: string) => void;

  selectedSex?: HouseholdSex;
  setSelectedSex?: (sex: HouseholdSex) => void;
  selectedHouseholdTypes?: string[];
  setSelectedHouseholdTypes?: (categories: string[]) => void;
  selectedReligions?: string[];
  setSelectedReligions?: (categories: string[]) => void;

  filteredHouseholds: Household[];
  municipalityHouseholds: Household[];
}

type ShapefileProperties = {
  PROVINCE?: string;
  DISTRICT?: string;
  PALIKA?: string;
  TYPE?: string;
  WARD?: string | number;
  area?: string | number;
};

function normalizeText(value: string | undefined) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toFeatureCollection(data: unknown): FeatureCollection<Geometry, ShapefileProperties> {
  if (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    (data as { type?: string }).type === 'FeatureCollection'
  ) {
    return data as FeatureCollection<Geometry, ShapefileProperties>;
  }

  if (Array.isArray(data)) {
    const features = data.flatMap((item) => {
      if (
        item &&
        typeof item === 'object' &&
        'type' in item &&
        (item as { type?: string }).type === 'FeatureCollection' &&
        'features' in item
      ) {
        return (item as FeatureCollection<Geometry, ShapefileProperties>).features;
      }

      if (item && typeof item === 'object' && 'type' in item && (item as { type?: string }).type === 'Feature') {
        return [item as Feature<Geometry, ShapefileProperties>];
      }

      return [];
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  return {
    type: 'FeatureCollection',
    features: [],
  };
}

function MapBounds({ data }: { data: FeatureCollection<Geometry, ShapefileProperties> | null }) {
  const map = useMap();

  useEffect(() => {
    if (!data || data.features.length === 0) {
      return;
    }

    const bounds = L.geoJSON(data as any).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [data, map]);

  return null;
}

function WardGeoJSONLayer({
  data,
  municipality,
  wardSummaries,
  pillar,
  selectedWardId,
  dimmed,
  colorRange,
  onWardClick,
}: {
  data: FeatureCollection<Geometry, ShapefileProperties>;
  municipality: Municipality;
  wardSummaries: Map<string, HouseholdSummary>;
  pillar: Pillar;
  selectedWardId: string | null | undefined;
  dimmed: boolean;
  colorRange: { min: number; max: number };
  onWardClick: (wardId: string) => void;
}) {
  const layerRef = useRef<L.GeoJSON | null>(null);
  const selectedWardNumber = selectedWardId ? String(selectedWardId).split('-').pop() : null;

  const getStyle = useCallback(
    (feature?: Feature<Geometry, ShapefileProperties>) => {
      const wardNumber = String(feature?.properties?.WARD || '');
      const ward = municipality.wards.find((item) => String(item.wardNumber) === wardNumber);
      const summary = ward ? wardSummaries.get(ward.id) : undefined;
      const isSelected = selectedWardNumber !== null && wardNumber === selectedWardNumber;
      // Always color from official municipality ward scores against the municipality min→max range.
      // Filters only affect dimming / gray-out when a ward has no matching households.
      const fillColor = !ward
        ? '#e2e8f0'
        : !summary
          ? '#e2e8f0'
          : getPillarColor(getPercentByPillar(ward, pillar), isHigherBetter(pillar), colorRange);

      return {
        color: isSelected ? '#254a36' : '#ffffff',
        weight: isSelected ? 3.5 : 1.5,
        fillColor,
        fillOpacity: isSelected ? 0.92 : dimmed ? 0.25 : 0.72,
      };
    },
    [colorRange, dimmed, municipality.wards, pillar, selectedWardNumber, wardSummaries]
  );

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((leafletLayer) => {
      const feature = (leafletLayer as L.Layer & { feature?: Feature<Geometry, ShapefileProperties> }).feature;
      (leafletLayer as L.Path).setStyle(getStyle(feature));
    });
  }, [getStyle]);

  return (
    <GeoJSON
      ref={layerRef}
      data={data as any}
      style={(feature) => getStyle(feature as Feature<Geometry, ShapefileProperties>)}
      onEachFeature={(feature, layer) => {
        const wardNumber = String(feature.properties?.WARD || '');
        const ward = municipality.wards.find((item) => String(item.wardNumber) === wardNumber);
        const summary = ward ? wardSummaries.get(ward.id) : undefined;

        layer.bindTooltip(
          summary
            ? `${feature.properties?.PALIKA || municipality.name} Ward ${wardNumber}<br />` +
                `SPI: ${summary.spi.toFixed(1)}<br />` +
                `Exclusion: ${summary.exclusionPercent.toFixed(1)}%<br />` +
                `Poverty: ${summary.povertyPercent.toFixed(1)}%<br />` +
                `Vulnerability: ${summary.vulnerabilityPercent.toFixed(1)}%<br />` +
                `Households: ${summary.totalHouseholds.toLocaleString()}`
            : `${feature.properties?.PALIKA || municipality.name} Ward ${wardNumber}<br />No households match the selected filters.`,
          { sticky: true }
        );

        layer.on('click', () => {
          if (ward) onWardClick(ward.id);
        });
      }}
    />
  );
}

function FallbackWardMarkers({
  municipality,
  pillar,
  onWardSelect,
  wardSummaries,
  colorRange,
}: {
  municipality: Municipality;
  pillar: Pillar;
  onWardSelect: (wardId: string) => void;
  wardSummaries: Map<string, HouseholdSummary>;
  colorRange: { min: number; max: number };
}) {
  // Approximate coordinates for each municipality
  const municipalityCoords: Record<string, [number, number]> = {
    kepilasgadhi: [27.408, 87.367],
    kepilasagadhi: [27.408, 87.367],
    halesi: [27.329, 87.43],
    'halesi tuwachung': [27.329, 87.43],
    gadhi: [26.935, 87.468],
    sunsari: [26.935, 87.468],
    sunkoshi: [27.52, 86.42],
    belaka: [26.67, 87.62],
    'hanumannagar kankalini': [26.49, 86.74],
    'hanumannagar kankalani': [26.49, 86.74],
  };

  const baseCoord = municipalityCoords[normalizeText(municipality.name)] || [27.5, 87.5];
  
  // Distribute wards around the base coordinate
  const wards = municipality.wards.map((ward, idx) => {
    const angle = (idx / municipality.wards.length) * Math.PI * 2;
    const radius = 0.08; // degrees
    const lat = baseCoord[0] + Math.cos(angle) * radius;
    const lng = baseCoord[1] + Math.sin(angle) * radius;
    return { ward, lat, lng };
  });

  return (
    <>
      {wards.map(({ ward, lat, lng }) => {
        const summary = wardSummaries.get(ward.id);
        const color = summary
          ? getPillarColor(getPercentByPillar(ward, pillar), isHigherBetter(pillar), colorRange)
          : '#e2e8f0';
        return (
          <CircleMarker
            key={ward.id}
            center={[lat, lng]}
            radius={12}
            fillColor={color}
            color="#ffffff"
            weight={1.5}
            opacity={1}
            fillOpacity={0.85}
            eventHandlers={{
              click: () => onWardSelect(ward.id),
            }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold">{ward.name}</p>
                {summary ? (
                  <>
                    <p>SPI: {summary.spi.toFixed(2)}</p>
                    <p>Exclusion: {summary.exclusionPercent.toFixed(1)}%</p>
                    <p>Poverty: {summary.povertyPercent.toFixed(1)}%</p>
                    <p>Vulnerability: {summary.vulnerabilityPercent.toFixed(1)}%</p>
                    <p>Households: {summary.totalHouseholds.toLocaleString()}</p>
                  </>
                ) : (
                  <p>No households match the selected filters.</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export function WardMapClient({
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
  selectedSex: selectedSexProp,
  setSelectedSex,
  selectedHouseholdTypes: selectedHouseholdTypesProp,
  setSelectedHouseholdTypes,
  selectedReligions: selectedReligionsProp,
  setSelectedReligions,
  filteredHouseholds,
  municipalityHouseholds,
}: WardMapClientProps) {
  const [selectedWardLocalId, setSelectedWardLocalId] = useState<string | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<Geometry, ShapefileProperties> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGesiCategoriesLocal, setSelectedGesiCategoriesLocal] = useState<string[]>([]);
  const [selectedReligionsLocal, setSelectedReligionsLocal] = useState<string[]>([]);
  const [selectedSexLocal, setSelectedSexLocal] = useState<HouseholdSex>('all');

  const selectedGesiCategories = selectedHouseholdTypesProp ?? selectedGesiCategoriesLocal;
  const onSelectedGesiCategoriesChange = setSelectedHouseholdTypes ?? setSelectedGesiCategoriesLocal;
  const selectedReligions = selectedReligionsProp ?? selectedReligionsLocal;
  const onSelectedReligionsChange = setSelectedReligions ?? setSelectedReligionsLocal;
  const selectedSex = selectedSexProp ?? selectedSexLocal;
  const onSelectedSexChange = setSelectedSex ?? setSelectedSexLocal;

  const gesiCategories = useMemo(
    () => [...new Set(municipalityHouseholds.map((household) => household.householdType))],
    [municipalityHouseholds]
  );
  const religionCategories = useMemo(
    () => [...new Set(municipalityHouseholds.map((household) => household.religion))],
    [municipalityHouseholds]
  );

  const wardSummaries = useMemo(() => {
    const groups = groupByWard(filteredHouseholds);
    const summaries = new Map<string, HouseholdSummary>();
    for (const [wardId, group] of groups) {
      const summary = summarizeHouseholds(group);
      if (summary) summaries.set(wardId, summary);
    }
    return summaries;
  }, [filteredHouseholds]);

  const maxWardHouseholds = useMemo(
    () => Math.max(1, ...[...wardSummaries.values()].map((summary) => summary.totalHouseholds)),
    [wardSummaries]
  );

  // Municipality-level range only — never shrink to a single selected ward.
  const colorRange = useMemo(() => {
    const values = municipality.wards.map((ward) => getPercentByPillar(ward, pillar));
    if (values.length === 0) return { min: 0, max: 100 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [municipality.wards, pillar]);

  const hasGesiOverlay = selectedGesiCategories.length > 0 || selectedReligions.length > 0;

  useEffect(() => {
    setSelectedGesiCategoriesLocal([]);
    setSelectedReligionsLocal([]);
    setSelectedSexLocal('all');
  }, [municipality.id]);

  // Drop overlay selections that no longer exist in this municipality's option lists.
  useEffect(() => {
    if (selectedGesiCategories.some((name) => !gesiCategories.includes(name))) {
      onSelectedGesiCategoriesChange(selectedGesiCategories.filter((name) => gesiCategories.includes(name)));
    }
    if (selectedReligions.some((name) => !religionCategories.includes(name))) {
      onSelectedReligionsChange(selectedReligions.filter((name) => religionCategories.includes(name)));
    }
  }, [
    gesiCategories,
    religionCategories,
    selectedGesiCategories,
    selectedReligions,
    onSelectedGesiCategoriesChange,
    onSelectedReligionsChange,
  ]);

  const handleWardClick = (wardId: string) => {
    setSelectedWardLocalId(wardId);
    setSelectedWardId?.(wardId);
    onWardSelect?.(wardId);
  };

  const effectiveSelectedWardId = selectedWardId ?? selectedWardLocalId;

  useEffect(() => {
    setSelectedWardLocalId(selectedWardId ?? null);
  }, [selectedWardId]);

  useEffect(() => {
    let cancelled = false;

    async function loadShapefile() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/shp/ward_shp.zip');
        if (!response.ok) {
          throw new Error(`Failed to load shapefile zip: ${response.status}`);
        }

        const parsed = await shp(await response.arrayBuffer());
        const fc = toFeatureCollection(parsed);

        if (!cancelled) {
          setGeoJsonData(fc);
        }
      } catch (loadError) {
        const errorMsg = loadError instanceof Error ? loadError.message : 'Unable to load shapefile.';
        console.error('[ShapeFile] Load error:', errorMsg);
        if (!cancelled) {
          setError(errorMsg);
          setGeoJsonData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadShapefile();

    return () => {
      cancelled = true;
    };
  }, []);

  const municipalityFeatures = useMemo(() => {
    if (!geoJsonData) {
      return [];
    }

    const normalizedDistrict = normalizeText(municipality.district);
    const normalizedPalika = normalizeText(municipality.mapPalika || municipality.name);

    return geoJsonData.features.filter((feature) => {
      const properties = feature.properties || {};
      const featureDistrict = normalizeText(properties.DISTRICT);
      const featurePalika = normalizeText(properties.PALIKA);
      return featureDistrict === normalizedDistrict && featurePalika === normalizedPalika;
    });
  }, [geoJsonData, municipality]);

  const wardFeatureCollection = useMemo<FeatureCollection<Geometry, ShapefileProperties>>(
    () => ({
      type: 'FeatureCollection',
      features: municipalityFeatures,
    }),
    [municipalityFeatures]
  );

  type GesiMarker = {
    ward: Municipality['wards'][number];
    center: L.LatLng;
    segments: { name: string; value: number }[];
    householdCount: number;
  };

  const gesiMarkers = useMemo<GesiMarker[]>(() => {
    if ((selectedGesiCategories.length === 0 && selectedReligions.length === 0) || municipalityFeatures.length === 0) {
      return [];
    }

    return municipalityFeatures
      .map((feature: Feature<Geometry, ShapefileProperties>): GesiMarker | null => {
        const wardNumber = String(feature.properties?.WARD || '');
        const ward = municipality.wards.find((item) => String(item.wardNumber) === wardNumber);
        const summary = ward ? wardSummaries.get(ward.id) : undefined;
        if (!ward || !summary) return null;

        const bounds = L.geoJSON(feature as any).getBounds();
        if (!bounds.isValid()) return null;
        const center = bounds.getCenter();

        const householdSegments = selectedGesiCategories.length > 0
          ? summary.householdType.filter((item) => selectedGesiCategories.includes(item.name))
          : [];
        const religionSegments = selectedReligions.length > 0
          ? summary.religion.filter((item) => selectedReligions.includes(item.name))
          : [];
        const segments = [...householdSegments, ...religionSegments];

        return { ward, center, segments, householdCount: summary.totalHouseholds };
      })
      .filter((item: GesiMarker | null): item is GesiMarker => item !== null);
  }, [municipalityFeatures, municipality, selectedGesiCategories, selectedReligions, wardSummaries]);

  return (
    <Card className="border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Ward map of {municipality.name}</h2>
          <p className="text-sm text-slate-500">
            {municipality.district} district, {municipality.wards.length} dashboard wards
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          {pillar === 'overall' ? 'Overall SPI' : `${pillar[0].toUpperCase()}${pillar.slice(1)} index`}
        </div>
      </div>

      <div className="mb-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
        {/* Filters bar inside the map card but outside the map canvas */}
        {(municipalities || setSelectedPillar) && (
          <div className="relative z-20 mb-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {municipalities && setSelectedMunicipalityId && (
                <MunicipalitySelector
                  municipalities={municipalities}
                  selectedId={selectedMunicipalityId ?? municipality.id}
                  onSelect={setSelectedMunicipalityId}
                />
              )}

              {setSelectedPillar && (
                <PillarSelector selectedPillar={selectedPillar ?? pillar} onSelect={setSelectedPillar} />
              )}

              {setSelectedWardId && (
                <WardFilterSelector
                  wards={municipality.wards}
                  selectedId={selectedWardId}
                  onSelect={setSelectedWardId}
                />
              )}

              <HouseholdSexSelector selected={selectedSex} onSelect={onSelectedSexChange} />

              <GesiCategorySelector
                categories={gesiCategories}
                selected={selectedGesiCategories}
                onChange={onSelectedGesiCategoriesChange}
                label="Household type overlay"
              />

              <GesiCategorySelector
                categories={religionCategories}
                selected={selectedReligions}
                onChange={onSelectedReligionsChange}
                label="Religion overlay"
              />
            </div>
          </div>
        )}

        <div className="relative z-10 h-[54vh] min-h-[320px] w-full md:h-[520px]">
          <MapContainer
            className="h-full w-full"
            center={loading || error || municipalityFeatures.length === 0 ? [27.5, 87.5] : [26.8, 86.0]}
            zoom={loading || error || municipalityFeatures.length === 0 ? 7 : 8}
            scrollWheelZoom
            preferCanvas
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {!loading && (error || municipalityFeatures.length === 0) ? (
              <FallbackWardMarkers
                municipality={municipality}
                pillar={pillar}
                onWardSelect={handleWardClick}
                wardSummaries={wardSummaries}
                colorRange={colorRange}
              />
            ) : null}
            {!loading && !error && municipalityFeatures.length > 0 ? (
              <>
                <MapBounds data={wardFeatureCollection} />
                <WardGeoJSONLayer
                  key={municipality.id}
                  data={wardFeatureCollection}
                  municipality={municipality}
                  wardSummaries={wardSummaries}
                  pillar={pillar}
                  selectedWardId={effectiveSelectedWardId}
                  dimmed={hasGesiOverlay}
                  colorRange={colorRange}
                  onWardClick={handleWardClick}
                />
                {gesiMarkers.map(({ ward, center, segments, householdCount }: GesiMarker) => {
                  const sizeRatio = householdCount / maxWardHouseholds;
                  const size = Math.round(26 + Math.min(sizeRatio, 1) * 40);
                  const icon = L.divIcon({
                    className: '',
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${buildGesiConicGradient(segments)};border:2px solid white;box-shadow:0 1px 5px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;cursor:pointer;">` +
                      `<div style="width:${Math.round(size * 0.44)}px;height:${Math.round(size * 0.44)}px;border-radius:9999px;background:white;display:flex;align-items:center;justify-content:center;font:600 ${Math.max(9, Math.round(size * 0.22))}px system-ui;color:#334155;">${householdCount}</div>` +
                      `</div>`,
                  });

                  return (
                    <Marker
                      key={`gesi-${ward.id}`}
                      position={[center.lat, center.lng]}
                      icon={icon}
                      eventHandlers={{ click: () => handleWardClick(ward.id) }}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="mb-1 font-bold">{ward.name}</p>
                          <p className="mb-1 text-slate-500">{householdCount.toLocaleString()} households match{selectedSex !== 'all' ? ` · ${selectedSex === 'female' ? 'female-headed' : 'male-headed'}` : ''}</p>
                          {segments.map((segment: { name: string; value: number }) => (
                            <p key={segment.name} className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: getGesiCategoryColor(segment.name) }}
                              />
                              {segment.name}: {segment.value}%
                            </p>
                          ))}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </>
            ) : null}
          </MapContainer>
          {loading ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40 text-sm text-slate-200">
              Loading shapefile geometry...
            </div>
          ) : null}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex max-h-[45%] max-w-[min(240px,calc(100%-1.5rem))] flex-col gap-2">
            <div className="rounded-md border border-black/5 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                <span>{pillar === 'overall' ? 'SPI' : `${pillar[0].toUpperCase()}${pillar.slice(1)}`} · municipality range</span>
                <span>{isHigherBetter(pillar) ? 'Low → High' : 'Better → Worse'}</span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 6 }, (_, i) => {
                  const t = i / 5;
                  const value = colorRange.min + t * (colorRange.max - colorRange.min || 1);
                  return getPillarColor(value, isHigherBetter(pillar), colorRange);
                }).map((color, i) => (
                  <span key={i} className="h-2.5 w-5 first:rounded-l-sm last:rounded-r-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-500">
                <span>{colorRange.min.toFixed(1)}</span>
                <span>{colorRange.max.toFixed(1)}</span>
              </div>
            </div>

            {hasGesiOverlay ? (
              <div className="overflow-y-auto rounded-md border border-black/5 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
                <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Overlay colors{selectedSex !== 'all' ? ` · ${selectedSex === 'female' ? 'female-headed' : 'male-headed'}` : ''}
                </div>
                <div className="flex flex-col gap-1">
                  {[...selectedGesiCategories, ...selectedReligions].map((name) => (
                    <span key={name} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getGesiCategoryColor(name) }} />
                      {name}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] leading-tight text-slate-400">
                  Bubble size = matching households
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
