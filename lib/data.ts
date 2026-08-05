import sourceData from './dashboard-data.json';
import { Household, Municipality, Ward } from './types';

// Generated from the two Excel source sheets with `scripts/build-dashboard-data.ps1`.
// The source workbooks remain in /public; rerun the script whenever they are replaced.
const data = sourceData as { municipalities: Municipality[]; households: Household[] };
export const municipalities = data.municipalities;
export const households = data.households;

export function getMunicipalityById(id: string): Municipality | undefined {
  return municipalities.find((municipality) => municipality.id === id);
}

export function getMunicipalityByDistrictAndName(district: string, name: string): Municipality | undefined {
  return municipalities.find((municipality) => municipality.district === district && municipality.name === name);
}

export function getTopWards(municipality: Municipality, limit = 5) {
  return [...municipality.wards].sort((a, b) => b.spiScore - a.spiScore).slice(0, limit);
}

export function getScoreByPillar(ward: Ward, pillar: 'overall' | 'exclusion' | 'poverty' | 'vulnerability'): number {
  if (pillar === 'exclusion') return ward.exclusionIndex;
  if (pillar === 'poverty') return ward.povertyIndex;
  if (pillar === 'vulnerability') return ward.vulnerabilityIndex;
  return ward.spiScore;
}

// Percent-scale (0-100) version, used for map colouring and the diverging average chart
// so every pillar sits on the same axis regardless of its native units.
export function getPercentByPillar(ward: Ward, pillar: 'overall' | 'exclusion' | 'poverty' | 'vulnerability'): number {
  if (pillar === 'exclusion') return ward.exclusionPercent ?? ward.exclusionIndex * 100;
  if (pillar === 'poverty') return ward.povertyPercent ?? ward.povertyIndex * 100;
  if (pillar === 'vulnerability') return ward.vulnerabilityPercent ?? ward.vulnerabilityIndex * 100;
  return ward.spiScore;
}

// SPI is higher-is-better; exclusion/poverty/vulnerability are higher-is-worse.
export function isHigherBetter(pillar: 'overall' | 'exclusion' | 'poverty' | 'vulnerability'): boolean {
  return pillar === 'overall';
}
