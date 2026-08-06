'use client';

import { Municipality, Pillar } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { getPercentByPillar, isHigherBetter, resolvePillar } from '@/lib/data';
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
  const activePillar = resolvePillar(pillar);

  const colorRange = (() => {
    const values = municipality.wards.map((ward) => getPercentByPillar(ward, activePillar));
    if (values.length === 0) return { min: 0, max: 100 };
    return { min: Math.min(...values), max: Math.max(...values) };
  })();

  let sortedWards = [...municipality.wards].sort((a, b) => {
    const scoreA = getPercentByPillar(a, activePillar);
    const scoreB = getPercentByPillar(b, activePillar);
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

  const getPillarLabel = (p: Exclude<Pillar, 'none'>) => {
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
    activePillar === 'overall' ? percent.toFixed(2) : percent.toFixed(1);

  return (
    <Card className="border border-slate-200 bg-white p-4 shadow-sm sm:border-0 sm:p-6">
      <h3 className="mb-3 text-base font-semibold text-gray-900 sm:mb-4 sm:text-lg">
        Top {limit} Wards - {getPillarLabel(activePillar)}
      </h3>

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {sortedWards.map((ward, index) => {
          const percent = getPercentByPillar(ward, activePillar);
          const color = getPillarColor(percent, isHigherBetter(activePillar), colorRange);
          return (
            <button
              key={ward.id}
              type="button"
              onClick={() => onWardSelect?.(ward.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{ward.name}</p>
                <p className="truncate text-[11px] text-slate-500">{municipality.name}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold tabular-nums text-slate-900">
                <i className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                {formatScore(percent)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
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
              <TableHead className="hidden text-white md:table-cell">Palika</TableHead>
              <TableHead
                className="cursor-pointer text-right text-white hover:bg-slate-800"
                onClick={() => handleSort('score')}
              >
                {getPillarLabel(activePillar)} {sortColumn === 'score' && (sortDirection === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-center text-white">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWards.map((ward, index) => {
              const percent = getPercentByPillar(ward, activePillar);
              const color = getPillarColor(percent, isHigherBetter(activePillar), colorRange);
              return (
                <TableRow key={ward.id} className="border-b border-gray-200">
                  <TableCell className="font-semibold text-gray-900">{index + 1}</TableCell>
                  <TableCell className="text-gray-700">{ward.name}</TableCell>
                  <TableCell className="hidden text-gray-700 md:table-cell">{municipality.name}</TableCell>
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
