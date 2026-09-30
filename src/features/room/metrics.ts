import type { Channel } from './types';

/** Pulse Index: engagement 60 (full at 8%), growth 25 (full at 2% in 14 days), reach consistency 15. */
export function pulseIndex(ch: Channel) {
  const er = Math.min((ch.er ?? 0) / 8, 1) * 60;
  const growth = Math.min((ch.growth ?? 0) / 2, 1) * 25;
  const series = ch.dailyReach ?? [];
  const mean = series.reduce((a, b) => a + b, 0) / (series.length || 1);
  const sd = Math.sqrt(series.reduce((a, b) => a + (b - mean) ** 2, 0) / (series.length || 1));
  const cv = mean ? sd / mean : 1;
  const consistency = Math.max(0, 1 - cv / 0.5) * 15;
  return {
    total: Math.round(er + growth + consistency),
    er: Math.round(er * 10) / 10,
    growth: Math.round(growth * 10) / 10,
    consistency: Math.round(consistency * 10) / 10,
  };
}

export function consistencyPct(series: number[] = []) {
  const mean = series.reduce((a, b) => a + b, 0) / (series.length || 1);
  const sd = Math.sqrt(series.reduce((a, b) => a + (b - mean) ** 2, 0) / (series.length || 1));
  return mean ? Math.round(Math.max(0, 1 - sd / mean) * 100) : 0;
}
