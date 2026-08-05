// Sub-dimension breakdowns behind EI / MPI / VI
export type ExclusionComponents = {
  socioEconomic: number;
  institutional: number;
  political: number;
  cultural: number;
  spatial: number;
};

export type MpiContribution = { name: string; value: number };

export type PovertyComponents = {
  headcountRatio: number; // H
  intensity: number; // A
  health: MpiContribution[];
  education: MpiContribution[];
  livingStandards: MpiContribution[];
};

export type VulnerabilityComponents = {
  environmental: number;
  social: number;
  climate: number;
};

// Ward data structure
export interface Ward {
  id: string;
  name: string;
  wardNumber: number;
  spiScore: number;
  exclusionIndex: number;
  exclusionPercent?: number;
  exclusionComponents?: ExclusionComponents;
  povertyIndex: number;
  povertyPercent?: number;
  povertyComponents?: PovertyComponents;
  vulnerabilityIndex: number;
  vulnerabilityPercent?: number;
  vulnerabilityComponents?: VulnerabilityComponents;
  population?: number;
  coordinates?: [number, number]; // [latitude, longitude]
}

// One real surveyed household, joined from the GESI/EI/VI/MPI source workbook.
export interface Household {
  municipalityId: string;
  wardId: string;
  settlement: string;
  headSex: 'female' | 'male';
  religion: string;
  householdType: string;
  /** Weighted deprivation score (Sum column). */
  deprivationSum: number;
  /** 1 when deprivationSum >= 0.33, else 0 ("if exceeds 0.33" column). */
  ifExceeds033: number;
  exclusionPercent: number;
  vulnerabilityPercent: number;
  exclusionComponents: ExclusionComponents;
  /** Per-indicator MPI contribution %; aggregated at summary time among poor households. */
  povertyContributions: Pick<PovertyComponents, 'health' | 'education' | 'livingStandards'>;
  vulnerabilityComponents: VulnerabilityComponents;
}

// Municipality data structure
export interface Municipality {
  id: string;
  name: string;
  /** The exact PALIKA value used to select this municipality's ward geometry. */
  mapPalika?: string;
  district: string;
  overallSpi: number;
  exclusionIndex: number;
  exclusionPercent?: number;
  exclusionComponents?: ExclusionComponents;
  povertyIndex: number;
  povertyPercent?: number;
  povertyComponents?: PovertyComponents;
  vulnerabilityIndex: number;
  vulnerabilityPercent?: number;
  vulnerabilityComponents?: VulnerabilityComponents;
  wards: Ward[];
}

// Dashboard state
export interface DashboardState {
  selectedMunicipality: string;
  selectedPillar: 'overall' | 'exclusion' | 'poverty' | 'vulnerability';
  selectedWard?: string;
}

// Export formats
export interface ExportData {
  municipalityName: string;
  wardName: string;
  wardNumber: number;
  spiScore: number;
  exclusionIndex: number;
  povertyIndex: number;
  vulnerabilityIndex: number;
}

// Pillar type
export type Pillar = 'overall' | 'exclusion' | 'poverty' | 'vulnerability';
