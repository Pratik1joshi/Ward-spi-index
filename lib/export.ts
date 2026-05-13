import { Municipality, Ward } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';

// CSV Export
export async function exportToCSV(municipalities: Municipality[]) {
  const rows: any[] = [];

  // Add header
  rows.push({
    'Municipality': '',
    'Ward': '',
    'Ward Number': '',
    'SPI Score': '',
    'Exclusion Index': '',
    'Poverty Index': '',
    'Vulnerability Index': '',
  });

  // Add data
  municipalities.forEach((municipality) => {
    municipality.wards.forEach((ward) => {
      rows.push({
        'Municipality': municipality.name,
        'Ward': ward.name,
        'Ward Number': ward.wardNumber,
        'SPI Score': ward.spiScore.toFixed(2),
        'Exclusion Index': ward.exclusionIndex.toFixed(2),
        'Poverty Index': ward.povertyIndex.toFixed(2),
        'Vulnerability Index': ward.vulnerabilityIndex.toFixed(2),
      });
    });
  });

  // Convert to CSV
  const csv = Papa.unparse(rows);

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `spi-dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// PDF Export
export async function exportToPDF(elementId: string = 'dashboard-container') {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element not found for PDF export');
      return;
    }

    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 297; // A4 landscape width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Save PDF
    pdf.save(`spi-dashboard-export-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
  }
}

// Export ward data as JSON
export function exportToJSON(municipalities: Municipality[]) {
  const data = {
    exportDate: new Date().toISOString(),
    totalMunicipalities: municipalities.length,
    totalWards: municipalities.reduce((sum, m) => sum + m.wards.length, 0),
    municipalities: municipalities.map((m) => ({
      name: m.name,
      district: m.district,
      overallSpi: m.overallSpi,
      exclusionIndex: m.exclusionIndex,
      povertyIndex: m.povertyIndex,
      vulnerabilityIndex: m.vulnerabilityIndex,
      wardCount: m.wards.length,
      wards: m.wards.map((w) => ({
        name: w.name,
        wardNumber: w.wardNumber,
        spiScore: w.spiScore,
        exclusionIndex: w.exclusionIndex,
        povertyIndex: w.povertyIndex,
        vulnerabilityIndex: w.vulnerabilityIndex,
      })),
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `spi-dashboard-export-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
