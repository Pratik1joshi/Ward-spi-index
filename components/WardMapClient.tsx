'use client';

import { useEffect, useMemo, useState } from 'react';
import shp from 'shpjs';
import * as L from 'leaflet';
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Card } from '@/components/ui/card';
import { MunicipalitySelector, PillarSelector, WardFilterSelector } from '@/components/Selectors';
import { getSPIColor } from '@/lib/colors';
import { getScoreByPillar } from '@/lib/data';
import { Municipality, Pillar } from '@/lib/types';

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

function FallbackWardMarkers({
  municipality,
  pillar,
  onWardSelect,
}: {
  municipality: Municipality;
  pillar: Pillar;
  onWardSelect: (wardId: string) => void;
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
        const score = getScoreByPillar(ward, pillar);
        const color = getSPIColor(score);
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
                <p>SPI: {ward.spiScore.toFixed(2)}</p>
                <p>Exclusion: {ward.exclusionIndex.toFixed(2)}</p>
                <p>Poverty: {ward.povertyIndex.toFixed(2)}</p>
                <p>Vulnerability: {ward.vulnerabilityIndex.toFixed(2)}</p>
                {ward.population ? <p>Population: {ward.population.toLocaleString()}</p> : null}
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
}: WardMapClientProps) {
  const [selectedWardLocalId, setSelectedWardLocalId] = useState<string | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection<Geometry, ShapefileProperties> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleWardClick = (wardId: string) => {
    setSelectedWardLocalId(wardId);
    setSelectedWardId?.(wardId as any);
    onWardSelect?.(wardId);
  };

      const effectiveSelectedWardId = selectedWardId ?? selectedWardLocalId; // Use effectiveSelectedWardId

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
        console.log('[ShapeFile] Raw parsed data:', parsed);
        
        const fc = toFeatureCollection(parsed);
        console.log('[ShapeFile] FeatureCollection created:', {
          type: fc.type,
          featureCount: fc.features.length,
          sampleFeatures: fc.features.slice(0, 3).map(f => ({
            palika: f.properties?.PALIKA,
            district: f.properties?.DISTRICT,
            ward: f.properties?.WARD,
          })),
        });
        
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
    console.log('[Map Filter] Municipality:', municipality.name, 'District:', municipality.district);

    const filtered = geoJsonData.features.filter((feature) => {
      const properties = feature.properties || {};
      const featureDistrict = normalizeText(properties.DISTRICT);
      const featurePalika = normalizeText(properties.PALIKA);
      const match = featureDistrict === normalizedDistrict && featurePalika === normalizedPalika;
      
      if (!match && geoJsonData.features.indexOf(feature) < 5) {
        console.log('[Map Filter] Feature not matched:', {
          palika: properties.PALIKA,
          district: properties.DISTRICT,
          ward: properties.WARD,
        });
      }
      
      return match;
    });

    console.log('[Map Filter] Matched features:', filtered.length, 'out of', geoJsonData.features.length);
    return filtered;
  }, [geoJsonData, municipality]);

  const wardFeatureCollection = useMemo<FeatureCollection<Geometry, ShapefileProperties>>(
    () => ({
      type: 'FeatureCollection',
      features: municipalityFeatures,
    }),
    [municipalityFeatures]
  );

  const selectedWardFeature = useMemo(() => {
    if (!effectiveSelectedWardId) {
      return null;
    }

    const selectedWardNumber = String(effectiveSelectedWardId).split('-').pop();
    return municipalityFeatures.find((feature) => String(feature.properties?.WARD) === selectedWardNumber) || null;
  }, [municipalityFeatures, effectiveSelectedWardId]);

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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
              <FallbackWardMarkers municipality={municipality} pillar={pillar} onWardSelect={handleWardClick} />
            ) : null}
            {!loading && !error && municipalityFeatures.length > 0 ? (
              <>
                <MapBounds data={wardFeatureCollection} />
                <GeoJSON
                  key={`${municipality.id}-${effectiveSelectedWardId || 'all'}`}
                  data={wardFeatureCollection as any}
                  style={(feature) => {
                    const wardNumber = String(feature?.properties?.WARD || '');
                    const ward = municipality.wards.find((item) => String(item.wardNumber) === wardNumber);
                    const score = ward ? getScoreByPillar(ward, pillar) : 0;
                    const isSelectedWard = effectiveSelectedWardId
                      ? wardNumber === String(effectiveSelectedWardId).split('-').pop()
                      : false;

                    return {
                      color: isSelectedWard ? '#254a36' : '#ffffff',
                      weight: isSelectedWard ? 3 : 1.5,
                      fillColor: isSelectedWard ? '#4f735f' : getSPIColor(score),
                      fillOpacity: isSelectedWard ? 0.95 : 0.72,
                    };
                  }}
                  onEachFeature={(feature, layer) => {
                    const wardNumber = String(feature.properties?.WARD || '');
                    const ward = municipality.wards.find((item) => String(item.wardNumber) === wardNumber);
                    const spi = ward?.spiScore;
                    const exclusion = ward?.exclusionIndex;
                    const poverty = ward?.povertyIndex;
                    const vulnerability = ward?.vulnerabilityIndex;
                    const population = ward?.population;

                    layer.bindTooltip(
                      `${feature.properties?.PALIKA || municipality.name} Ward ${wardNumber}<br />` +
                    `SPI: ${spi !== undefined ? spi.toFixed(1) : 'NA'}<br />` +
                        `Exclusive: ${exclusion !== undefined ? exclusion.toFixed(1) : 'NA'}<br />` +
                        `Poverty: ${poverty !== undefined ? poverty.toFixed(1) : 'NA'}<br />` +
                        `Vulnerability: ${vulnerability !== undefined ? vulnerability.toFixed(1) : 'NA'}` +
                        (population ? `<br />Population: ${population.toLocaleString()}` : ''),
                      {
                        sticky: true,
                      }
                    );

                    layer.on('click', () => {
                      if (ward) {
                        handleWardClick(ward.id);
                      }
                    });
                  }}
                />
                {selectedWardFeature ? (
                  <GeoJSON
                    data={selectedWardFeature as any}
                    style={{
                      color: '#254a36',
                      weight: 4,
                      fillOpacity: 0.15,
                    }}
                  />
                ) : null}
              </>
            ) : null}
          </MapContainer>
          {loading ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40 text-sm text-slate-200">
              Loading shapefile geometry...
            </div>
          ) : null}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-md border border-black/5 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-slate-500"><span>{pillar === 'overall' ? 'SPI score' : `${pillar} index`}</span><span>Lower → higher</span></div>
            <div className="flex items-center gap-0.5">
              {['#eef1ef', '#d7ded9', '#aebfb5', '#7f9989', '#4f735f', '#254a36'].map((color) => <span key={color} className="h-2.5 w-5 first:rounded-l-sm last:rounded-r-sm" style={{ backgroundColor: color }} />)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
