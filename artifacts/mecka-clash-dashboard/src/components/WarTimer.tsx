import { useEffect, useMemo, useState } from 'react';
import { Clock3, Swords } from 'lucide-react';

type Dict = Record<string, any>;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function parseClashTime(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 100000000000 ? value * 1000 : value;
  }

  const raw = str(value).trim();
  if (!raw) return null;

  // Clash of Clans commonly returns timestamps such as:
  // 20260916T120000.000Z
  const match = raw.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d+))?Z?$/,
  );

  if (match) {
    const [, year, month, day, hour, minute, second, fraction] = match;
    const milliseconds = fraction
      ? Number(fraction.slice(0, 3).padEnd(3, '0'))
      : 0;

    const timestamp = Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
