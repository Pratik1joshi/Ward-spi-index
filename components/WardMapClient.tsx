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
import { HouseholdSex, HouseholdSummary, groupByWard, summarizeHouseholds, uniqueCollapsedLabels } from '@/lib/households';
import { Household, Municipality, Pillar, Ward } from '@/lib/types';

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
  AREA?: string | number;
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

function formatWardArea(area: string | number | undefined): string | null {
  const value = typeof area === 'number' ? area : Number(area);
  if (!Number.isFinite(value) || value <= 0) return null;
  return `${value.toFixed(2)} km²`;
}

function wardAreaFromProps(properties?: ShapefileProperties): string | number | undefined {
  return properties?.area ?? properties?.AREA;
}

function wardTooltipHtml({
  title,
  summary,
  area,
}: {
  title: string;
  summary?: HouseholdSummary;
  area?: string | number;
}): string {
  const areaLabel = formatWardArea(area);
  if (!summary) {
    return `${title}${areaLabel ? `<br />Area: ${areaLabel}` : ''}`;
  }
  return (
    `${title}<br />` +
    `SPI: ${summary.spi.toFixed(1)}<br />` +
    `Exclusion: ${summary.exclusionPercent.toFixed(1)}<br />` +
    `Poverty: ${summary.povertyPercent.toFixed(1)}<br />` +
    `Vulnerability: ${summary.vulnerabilityPercent.toFixed(1)}` +
    (areaLabel ? `<br />Area: ${areaLabel}` : '')
  );
}

function WardGeoJSONLayer({
  data,
  municipality,
  findWard,
  wardSummaries,
  pillar,
  selectedWardId,
  dimmed,
  colorRange,
  onWardClick,
}: {
  data: FeatureCollection<Geometry, ShapefileProperties>;
  municipality: Municipality;
  findWard: (properties?: ShapefileProperties) => Ward | undefined;
  wardSummaries: Map<string, HouseholdSummary>;
  pillar: Pillar;
  selectedWardId: string | null | undefined;
  dimmed: boolean;
  colorRange: { min: number; max: number };
  onWardClick: (wardId: string) => void;
}) {
  const layerRef = useRef<L.GeoJSON | null>(null);
  const uncoloured = pillar === 'none';

  const getStyle = useCallback(
    (feature?: Feature<Geometry, ShapefileProperties>) => {
      const ward = findWard(feature?.properties);
      const summary = ward ? wardSummaries.get(ward.id) : undefined;
      const isSelected = Boolean(selectedWardId && ward && ward.id === selectedWardId);
      const fillColor = !ward
        ? '#e2e8f0'
        : !summary
          ? '#e2e8f0'
          : uncoloured
            ? '#94a3b8'
            : getPillarColor(getPercentByPillar(ward, pillar), isHigherBetter(pillar), colorRange);

      return {
        color: isSelected ? '#254a36' : '#ffffff',
        weight: isSelected ? 3.5 : 1.5,
        fillColor,
        fillOpacity: isSelected ? 0.92 : dimmed ? 0.25 : uncoloured ? 0.45 : 0.72,
      };
    },
    [colorRange, dimmed, findWard, pillar, selectedWardId, uncoloured, wardSummaries]
  );

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((leafletLayer) => {
      const feature = (leafletLayer as L.Layer & { feature?: Feature<Geometry, ShapefileProperties> }).feature;
      (leafletLayer as L.Path).setStyle(getStyle(feature));

      const wardNumber = String(feature?.properties?.WARD || '');
      const ward = findWard(feature?.properties);
      const summary = ward ? wardSummaries.get(ward.id) : undefined;
      const title = `${feature?.properties?.PALIKA || municipality.name} Ward ${wardNumber}`;
      (leafletLayer as L.Layer).bindTooltip(
        wardTooltipHtml({ title, summary, area: wardAreaFromProps(feature?.properties) }),
        { sticky: true }
      );
    });
  }, [findWard, getStyle, municipality.name, wardSummaries]);

  return (
    <GeoJSON
      ref={layerRef}
      data={data as any}
      style={(feature) => getStyle(feature as Feature<Geometry, ShapefileProperties>)}
      onEachFeature={(feature, layer) => {
        const wardNumber = String(feature.properties?.WARD || '');
        const ward = findWard(feature.properties);
        const summary = ward ? wardSummaries.get(ward.id) : undefined;
        const title = `${feature.properties?.PALIKA || municipality.name} Ward ${wardNumber}`;

        layer.bindTooltip(wardTooltipHtml({ title, summary, area: wardAreaFromProps(feature.properties) }), { sticky: true });

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
        const color =
          !summary ? '#e2e8f0' : pillar === 'none' ? '#94a3b8' : getPillarColor(getPercentByPillar(ward, pillar), isHigherBetter(pillar), colorRange);
        return (
          <CircleMarker
            key={ward.id}
            center={[lat, lng]}
            radius={12}
            fillColor={color}
            color="#ffffff"
            weight={1.5}
            opacity={1}
            fillOpacity={pillar === 'none' ? 0.45 : 0.85}
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
                    <p>Exclusion: {summary.exclusionPercent.toFixed(1)}</p>
                    <p>Poverty: {summary.povertyPercent.toFixed(1)}</p>
                    <p>Vulnerability: {summary.vulnerabilityPercent.toFixed(1)}</p>
                  </>
                ) : null}
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
    () => uniqueCollapsedLabels(municipalityHouseholds.map((household) => household.householdType)),
    [municipalityHouseholds]
  );
  const religionCategories = useMemo(
    () => uniqueCollapsedLabels(municipalityHouseholds.map((household) => household.religion)),
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
    if (setSelectedMunicipalityId && municipality.id === 'all' && municipalities) {
      const owner = municipalities.find((item) => item.wards.some((ward) => ward.id === wardId));
      if (owner) setSelectedMunicipalityId(owner.id);
    }
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

  const displayedMunicipalities = useMemo(
    () => municipality.id === 'all' ? (municipalities ?? []) : [municipality],
    [municipalities, municipality]
  );

  const findWardForFeature = useCallback((properties?: ShapefileProperties): Ward | undefined => {
    const wardNumber = String(properties?.WARD || '');
    const featureMunicipality = displayedMunicipalities.find((item) =>
      normalizeText(item.district) === normalizeText(properties?.DISTRICT) &&
      normalizeText(item.mapPalika || item.name) === normalizeText(properties?.PALIKA)
    );
    return featureMunicipality?.wards.find((ward) => String(ward.wardNumber) === wardNumber);
  }, [displayedMunicipalities]);

  const municipalityFeatures = useMemo(() => {
    if (!geoJsonData) {
      return [];
    }

    return geoJsonData.features.filter((feature) => {
      const properties = feature.properties || {};
      return displayedMunicipalities.some((item) =>
        normalizeText(properties.DISTRICT) === normalizeText(item.district) &&
        normalizeText(properties.PALIKA) === normalizeText(item.mapPalika || item.name)
      );
    });
  }, [displayedMunicipalities, geoJsonData]);

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
        const ward = findWardForFeature(feature.properties);
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
  }, [findWardForFeature, municipalityFeatures, selectedGesiCategories, selectedReligions, wardSummaries]);

  return (
    <Card className="border border-slate-200 bg-white p-3 text-slate-900 shadow-sm sm:p-5">
      <div className="mb-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:mb-0 sm:p-3">
        {(municipalities || setSelectedPillar) && (
          <div className="relative z-20 mb-2 rounded-md border border-slate-200 bg-white p-2.5 shadow-sm sm:mb-3 sm:p-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 2xl:grid-cols-4">
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

        <div className="relative z-10 h-[min(62vh,420px)] min-h-[280px] w-full sm:h-[54vh] sm:min-h-[320px] md:h-[520px]">
          <MapContainer
            className="h-full w-full"
            center={loading || error || municipalityFeatures.length === 0 ? [27.5, 87.5] : [26.8, 86.0]}
            zoom={loading || error || municipalityFeatures.length === 0 ? 7 : 8}
            scrollWheelZoom
            preferCanvas
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                  findWard={findWardForFeature}
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
          <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] flex max-h-[42%] max-w-[min(200px,calc(100%-1rem))] flex-col gap-1.5 sm:bottom-3 sm:left-3 sm:max-h-[45%] sm:max-w-[min(240px,calc(100%-1.5rem))] sm:gap-2">
            {pillar !== 'none' ? (
              <div className="rounded-md border border-black/5 bg-white/95 px-2 py-1.5 shadow-md backdrop-blur-sm sm:px-3 sm:py-2">
                <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:mb-1.5 sm:text-[10px]">
                  <span className="truncate">{pillar === 'overall' ? 'SPI' : `${pillar[0].toUpperCase()}${pillar.slice(1)}`} range</span>
                  <span className="shrink-0">{isHigherBetter(pillar) ? 'Low→High' : 'Better→Worse'}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 6 }, (_, i) => {
                    const t = i / 5;
                    const value = colorRange.min + t * (colorRange.max - colorRange.min || 1);
                    return getPillarColor(value, isHigherBetter(pillar), colorRange);
                  }).map((color, i) => (
                    <span key={i} className="h-2 w-3.5 first:rounded-l-sm last:rounded-r-sm sm:h-2.5 sm:w-5" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[9px] tabular-nums text-slate-500 sm:text-[10px]">
                  <span>{colorRange.min.toFixed(1)}</span>
                  <span>{colorRange.max.toFixed(1)}</span>
                </div>
              </div>
            ) : null}

            {hasGesiOverlay ? (
              <div className="overflow-y-auto rounded-md border border-black/5 bg-white/95 px-2 py-1.5 shadow-md backdrop-blur-sm sm:px-3 sm:py-2">
                <div className="mb-1 text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:mb-1.5 sm:text-[10px]">
                  Overlay{selectedSex !== 'all' ? ` · ${selectedSex === 'female' ? 'female' : 'male'}` : ''}
                </div>
                <div className="flex flex-col gap-1">
                  {[...selectedGesiCategories, ...selectedReligions].map((name) => (
                    <span key={name} className="flex items-center gap-1.5 text-[10px] text-slate-700 sm:text-[11px]">
                      <span className="h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5" style={{ backgroundColor: getGesiCategoryColor(name) }} />
                      <span className="truncate">{name}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[9px] leading-tight text-slate-400 sm:mt-1.5 sm:text-[10px]">
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
