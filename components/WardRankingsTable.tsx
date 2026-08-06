'use client';

import { Municipality, Pillar } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { getPercentByPillar, isHigherBetter } from '@/lib/data';
import { getPillarColor } from '@/lib/colors';

interface WardRankingsTableProps {
  municipality: Municipality;
  pillar: Pillar;
  limit?: number;
  onWardSelect?: (wardId: string) => void;
}

export function WardRankingsTable({ municipality, pillar, limit = 5, onWardSelect }: WardRankingsTableProps) {
  const [sortColumn, setSortColumn] = useState<'ward' | 'score'>('score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const colorRange = (() => {
    const values = municipality.wards.map((ward) => getPercentByPillar(ward, pillar));
    if (values.length === 0) return { min: 0, max: 100 };
    return { min: Math.min(...values), max: Math.max(...values) };
  })();

  let sortedWards = [...municipality.wards].sort((a, b) => {
    const scoreA = getPercentByPillar(a, pillar);
    const scoreB = getPercentByPillar(b, pillar);
    return sortDirection === 'desc' ? scoreB - scoreA : scoreA - scoreB;
  });

  sortedWards = sortedWards.slice(0, limit);

  const handleSort = (column: 'ward' | 'score') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const getPillarLabel = (p: Pillar) => {
    switch (p) {
      case 'exclusion':
        return 'Exclusion Index';
      case 'poverty':
        return 'Poverty Index';
      case 'vulnerability':
        return 'Vulnerability Index';
      default:
        return 'SPI Score';
    }
  };

  const formatScore = (percent: number) =>
    pillar === 'overall' ? percent.toFixed(2) : `${percent.toFixed(1)}%`;

  return (
    <Card className="border-0 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Top {limit} Wards - {getPillarLabel(pillar)}</h3>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-900">
            <TableRow className="hover:bg-slate-900">
              <TableHead className="text-white">Rank</TableHead>
              <TableHead
                className="cursor-pointer text-white hover:bg-slate-800"
                onClick={() => handleSort('ward')}
              >
                Ward {sortColumn === 'ward' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-white">Palika</TableHead>
              <TableHead
                className="cursor-pointer text-right text-white hover:bg-slate-800"
                onClick={() => handleSort('score')}
              >
                {getPillarLabel(pillar)} {sortColumn === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-center text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWards.map((ward, index) => {
              const percent = getPercentByPillar(ward, pillar);
              const color = getPillarColor(percent, isHigherBetter(pillar), colorRange);
              return (
                <TableRow key={ward.id} className="border-b border-gray-200">
                  <TableCell className="font-semibold text-gray-900">{index + 1}</TableCell>
                  <TableCell className="text-gray-700">{ward.name}</TableCell>
                  <TableCell className="text-gray-700">{municipality.name}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center justify-end gap-2 font-semibold tabular-nums text-slate-900">
                      <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      {formatScore(percent)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => onWardSelect?.(ward.id)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
