'use client';

import { Municipality } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToPDF, exportToJSON } from '@/lib/export';
import { Download, FileJson } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonsProps {
  municipalities: Municipality[];
}

export function ExportButtons({ municipalities }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      await exportToCSV(municipalities);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF('dashboard-container');
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleJSONExport = async () => {
    setIsExporting(true);
    try {
      exportToJSON(municipalities);
    } catch (error) {
      console.error('JSON export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleCSVExport}
        disabled={isExporting}
        className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
      >
        <Download className="h-4 w-4" />
        Download CSV
      </Button>
      <Button
        onClick={handlePDFExport}
        disabled={isExporting}
        className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
      >
        <Download className="h-4 w-4" />
        Export PDF
      </Button>
      <Button
        onClick={handleJSONExport}
        disabled={isExporting}
        variant="outline"
        className="gap-2 border-slate-300"
      >
        <FileJson className="h-4 w-4" />
        Export JSON
      </Button>
    </div>
  );
}
