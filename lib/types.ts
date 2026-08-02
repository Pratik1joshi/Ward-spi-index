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
  gesi?: GesiProfile;
}

export type GesiProfile = {
  totalHouseholds: number;
  femaleHeaded: number;
  maleHeaded: number;
  religion: { name: string; value: number }[];
  householdType: { name: string; value: number }[];
};

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
  gesi: GesiProfile;
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
