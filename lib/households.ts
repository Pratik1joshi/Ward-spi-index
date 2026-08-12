import { ExclusionComponents, Household, PovertyComponents, VulnerabilityComponents } from './types';

export type HouseholdSex = 'all' | 'female' | 'male';

export const POVERTY_THRESHOLD = 0.33;

export interface HouseholdFilters {
  municipalityId: string;
  wardId?: string;
  sex: HouseholdSex;
  householdTypes: string[]; // OR within this group
  religions: string[]; // OR within this group
}

export function groupByWard(households: Household[]): Map<string, Household[]> {
  const groups = new Map<string, Household[]>();
  for (const household of households) {
    const group = groups.get(household.wardId);
    if (group) group.push(household);
    else groups.set(household.wardId, [household]);
  }
  return groups;
}

// AND between groups (municipality, ward, sex, household type, religion),
// OR within the household type / religion multi-selects.
export function filterHouseholds(households: Household[], filters: HouseholdFilters): Household[] {
  return households.filter((household) => {
    if (filters.municipalityId !== 'all' && household.municipalityId !== filters.municipalityId) return false;
    if (filters.wardId && household.wardId !== filters.wardId) return false;
    if (filters.sex !== 'all' && household.headSex !== filters.sex) return false;
    if (filters.householdTypes.length > 0) {
      const selected = new Set(filters.householdTypes.map(collapseOtherLabel));
      if (!selected.has(collapseOtherLabel(household.householdType))) return false;
    }
    if (filters.religions.length > 0) {
      const selected = new Set(filters.religions.map(collapseOtherLabel));
      if (!selected.has(collapseOtherLabel(household.religion))) return false;
    }
    return true;
  });
}

function collapseOtherLabel(name: string): string {
  return /^other\b/i.test(name.trim()) ? 'Other' : name;
}

/** Unique labels for filter dropdowns, with all "Other: …" values collapsed to one Other. */
export function uniqueCollapsedLabels(values: string[]): string[] {
  return [...new Set(values.map(collapseOtherLabel))].sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return a.localeCompare(b);
  });
}

function average(households: Household[], pick: (household: Household) => number): number {
  return households.reduce((sum, household) => sum + pick(household), 0) / households.length;
}

function distribution(households: Household[], pick: (household: Household) => string): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const household of households) {
    const key = collapseOtherLabel(pick(household));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, value: Number(((100 * count) / households.length).toFixed(1)) }))
    .sort((a, b) => b.value - a.value);
}

function averageComponents<T extends Record<string, number>>(items: T[], keys: (keyof T)[]): T {
  const result = {} as T;
  for (const key of keys) {
    result[key] = Number((items.reduce((sum, item) => sum + item[key], 0) / items.length).toFixed(2)) as T[keyof T];
  }
  return result;
}

function contributionPercents(
  poor: Household[],
  pick: (household: Household) => { name: string; value: number }[]
): { name: string; value: number }[] {
  if (poor.length === 0) return [];
  const intensity = poor.reduce((sum, household) => sum + household.deprivationSum, 0) / poor.length;
  if (intensity <= 0) return pick(poor[0]).map((item) => ({ name: item.name, value: 0 }));

  const names = pick(poor[0]).map((item) => item.name);
  return names.map((name) => {
    const avgWeight =
      poor.reduce((sum, household) => sum + (pick(household).find((item) => item.name === name)?.value ?? 0), 0) /
      poor.length;
    return { name, value: Number(((avgWeight / intensity) * 100).toFixed(1)) };
  });
}

export function computePovertyMetrics(households: Household[]): {
  headcountRatio: number;
  intensity: number;
  povertyPercent: number;
  contributions: Pick<PovertyComponents, 'health' | 'education' | 'livingStandards'>;
} {
  if (households.length === 0) {
    return {
      headcountRatio: 0,
      intensity: 0,
      povertyPercent: 0,
      contributions: { health: [], education: [], livingStandards: [] },
    };
  }

  const headcountRatio = average(households, (household) => household.ifExceeds033);
  const poor = households.filter((household) => household.deprivationSum >= POVERTY_THRESHOLD);
  const intensity =
    poor.length > 0 ? poor.reduce((sum, household) => sum + household.deprivationSum, 0) / poor.length : 0;
  const povertyPercent = headcountRatio * intensity * 100;

  return {
    headcountRatio: Number(headcountRatio.toFixed(3)),
    intensity: Number(intensity.toFixed(3)),
    povertyPercent: Number(povertyPercent.toFixed(1)),
    contributions: {
      health: contributionPercents(poor, (household) => household.povertyWeights.health),
      education: contributionPercents(poor, (household) => household.povertyWeights.education),
      livingStandards: contributionPercents(poor, (household) => household.povertyWeights.livingStandards),
    },
  };
}

export interface HouseholdSummary {
  totalHouseholds: number;
  femaleHeaded: number;
  maleHeaded: number;
  religion: { name: string; value: number }[];
  householdType: { name: string; value: number }[];
  spi: number;
  exclusionPercent: number;
  povertyPercent: number;
  vulnerabilityPercent: number;
  exclusionComponents: ExclusionComponents;
  povertyComponents: PovertyComponents;
  vulnerabilityComponents: VulnerabilityComponents;
}

// Single source of truth for every derived number in the dashboard.
// Returns null for the empty-state case: no households match the current filters.
export function summarizeHouseholds(filtered: Household[]): HouseholdSummary | null {
  if (filtered.length === 0) return null;

  const female = filtered.filter((household) => household.headSex === 'female').length;
  const exclusionPercent = Number(average(filtered, (household) => household.exclusionPercent).toFixed(1));
  const vulnerabilityPercent = Number(average(filtered, (household) => household.vulnerabilityPercent).toFixed(1));
  const poverty = computePovertyMetrics(filtered);
  const spi = Number((100 - ((exclusionPercent + poverty.povertyPercent + vulnerabilityPercent) / 3)).toFixed(1));

  return {
    totalHouseholds: filtered.length,
    femaleHeaded: Number(((100 * female) / filtered.length).toFixed(1)),
    maleHeaded: Number((100 - (100 * female) / filtered.length).toFixed(1)),
    religion: distribution(filtered, (household) => household.religion),
    householdType: distribution(filtered, (household) => household.householdType),
    spi,
    exclusionPercent,
    povertyPercent: poverty.povertyPercent,
    vulnerabilityPercent,
    exclusionComponents: averageComponents(
      filtered.map((household) => household.exclusionComponents),
      ['socioEconomic', 'institutional', 'political', 'cultural', 'spatial']
    ),
    povertyComponents: {
      headcountRatio: poverty.headcountRatio,
      intensity: poverty.intensity,
      ...poverty.contributions,
    },
    vulnerabilityComponents: averageComponents(
      filtered.map((household) => household.vulnerabilityComponents),
      ['environmental', 'social', 'climate']
    ),
  };
}
