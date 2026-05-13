// Ward data structure
export interface Ward {
  id: string;
  name: string;
  wardNumber: number;
  spiScore: number;
  exclusionIndex: number;
  povertyIndex: number;
  vulnerabilityIndex: number;
  population?: number;
  coordinates?: [number, number]; // [latitude, longitude]
}

// Municipality data structure
export interface Municipality {
  id: string;
  name: string;
  district: string;
  overallSpi: number;
  exclusionIndex: number;
  povertyIndex: number;
  vulnerabilityIndex: number;
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
