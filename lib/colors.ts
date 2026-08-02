// Color scale for SPI values: Red (Low) -> Orange (Medium) -> Green (High)
export const spiColorScale = {
  low: '#eef1ef',
  mediumLow: '#d7ded9',
  medium: '#aebfb5',
  mediumHigh: '#7f9989',
  high: '#4f735f',
  veryHigh: '#254a36',
};

// Get color based on SPI score (0.0 to 1.0)
export function getSPIColor(score: number): string {
  const normalised = score > 1 ? score / 100 : score;
  if (normalised < 0.2) return spiColorScale.low;
  if (normalised < 0.35) return spiColorScale.mediumLow;
  if (normalised < 0.5) return spiColorScale.medium;
  if (normalised < 0.65) return spiColorScale.mediumHigh;
  if (normalised < 0.8) return spiColorScale.high;
  return spiColorScale.veryHigh;
}

// Get color with opacity for map overlays
export function getSPIColorWithOpacity(score: number, opacity: number = 0.7): string {
  const color = getSPIColor(score);
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Color scheme for dashboard theme
export const themeColors = {
  background: '#0f1f2e',
  surfaceLight: '#f5f7fa',
  surfaceDark: '#1a3a52',
  text: '#1a2332',
  textLight: '#ffffff',
  primary: '#1976d2',
  accent: '#00bcd4',
  border: '#e0e0e0',
};

// Color scale for gauge/charts
export const chartColors = {
  exclusion: '#1976d2',  // Blue
  poverty: '#ff9800',    // Orange
  vulnerability: '#4caf50', // Green
};

// Gradient data for charts
export const pieChartData = [
  { name: 'Exclusion', value: 30, fill: chartColors.exclusion },
  { name: 'Poverty', value: 35, fill: chartColors.poverty },
  { name: 'Vulnerability', value: 35, fill: chartColors.vulnerability },
];
