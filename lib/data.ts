import { Municipality, Ward } from './types';

// Generate realistic SPI scores using seed for consistency
function generateScore(seed: number): number {
  const random = Math.sin(seed) * 10000;
  return Math.round((random - Math.floor(random)) * 100) / 100;
}

// Create wards for each municipality
function createWards(municipalityId: string, wardCount: number): Ward[] {
  const wards: Ward[] = [];
  for (let i = 1; i <= wardCount; i++) {
    const seed = parseInt(municipalityId) * 100 + i;
    wards.push({
      id: `${municipalityId}-ward-${i}`,
      name: `Ward ${i}`,
      wardNumber: i,
      spiScore: generateScore(seed),
      exclusionIndex: generateScore(seed + 0.1),
      povertyIndex: generateScore(seed + 0.2),
      vulnerabilityIndex: generateScore(seed + 0.3),
      population: Math.floor(Math.random() * 15000) + 3000,
    });
  }
  return wards;
}

// Calculate municipality-level indices from wards
function calculateMunicipalityIndices(wards: Ward[]) {
  const sum = {
    spi: 0,
    exclusion: 0,
    poverty: 0,
    vulnerability: 0,
  };
  wards.forEach((ward) => {
    sum.spi += ward.spiScore;
    sum.exclusion += ward.exclusionIndex;
    sum.poverty += ward.povertyIndex;
    sum.vulnerability += ward.vulnerabilityIndex;
  });
  return {
    overallSpi: Math.round((sum.spi / wards.length) * 100) / 100,
    exclusionIndex: Math.round((sum.exclusion / wards.length) * 100) / 100,
    povertyIndex: Math.round((sum.poverty / wards.length) * 100) / 100,
    vulnerabilityIndex: Math.round((sum.vulnerability / wards.length) * 100) / 100,
  };
}

// Municipalities data
export const municipalities: Municipality[] = [
  {
    id: '1',
    name: 'Kepilasgadhi',
    district: 'Khotang',
    wards: createWards('1', 5),
    overallSpi: 0,
    exclusionIndex: 0,
    povertyIndex: 0,
    vulnerabilityIndex: 0,
  },
  {
    id: '2',
    name: 'Halesi',
    district: 'Khotang',
    wards: createWards('2', 5),
    overallSpi: 0,
    exclusionIndex: 0,
    povertyIndex: 0,
    vulnerabilityIndex: 0,
  },
  {
    id: '3',
    name: 'Gadhi',
    district: 'Sunsari',
    wards: createWards('3', 6),
    overallSpi: 0,
    exclusionIndex: 0,
    povertyIndex: 0,
    vulnerabilityIndex: 0,
  },
  {
    id: '4',
    name: 'Sunkoshi',
    district: 'Sindhuli',
    wards: createWards('4', 5),
    overallSpi: 0,
    exclusionIndex: 0,
    povertyIndex: 0,
    vulnerabilityIndex: 0,
  },
  {
    id: '5',
    name: 'Belaka',
    district: 'Udayapur',
    wards: createWards('5', 4),
    overallSpi: 0,
    exclusionIndex: 0,
    povertyIndex: 0,
    vulnerabilityIndex: 0,
  },
  {
    id: '6',
    name: 'Hanumannagar Kankalini',
    district: 'Saptari',
    wards: createWards('6', 7),
    overallSpi: 0,
    exclusionIndex: 0,
    povertyIndex: 0,
    vulnerabilityIndex: 0,
  },
];

// Calculate municipality indices
municipalities.forEach((municipality) => {
  const indices = calculateMunicipalityIndices(municipality.wards);
  municipality.overallSpi = indices.overallSpi;
  municipality.exclusionIndex = indices.exclusionIndex;
  municipality.povertyIndex = indices.povertyIndex;
  municipality.vulnerabilityIndex = indices.vulnerabilityIndex;
});

// Helper function to get municipality by ID
export function getMunicipalityById(id: string): Municipality | undefined {
  return municipalities.find((m) => m.id === id);
}

// Helper function to get top wards
export function getTopWards(municipality: Municipality, limit: number = 5) {
  return municipality.wards
    .sort((a, b) => b.spiScore - a.spiScore)
    .slice(0, limit);
}

// Helper function to get score value based on pillar
export function getScoreByPillar(
  ward: Ward,
  pillar: 'overall' | 'exclusion' | 'poverty' | 'vulnerability'
): number {
  switch (pillar) {
    case 'exclusion':
      return ward.exclusionIndex;
    case 'poverty':
      return ward.povertyIndex;
    case 'vulnerability':
      return ward.vulnerabilityIndex;
    default:
      return ward.spiScore;
  }
}
