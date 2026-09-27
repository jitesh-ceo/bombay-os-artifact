// Dot-matrix UAE, rasterised once from a simplified mainland outline (lon, lat).

const OUTLINE: [number, number][] = [
  [51.58, 24.18], [51.85, 24.02], [52.35, 24.12], [52.9, 24.02], [53.4, 24.12], [53.85, 24.28],
  [54.2, 24.22], [54.38, 24.48], [54.55, 24.38], [54.72, 24.52], [54.95, 25.02], [55.12, 25.22],
  [55.28, 25.32], [55.48, 25.42], [55.62, 25.62], [55.82, 25.72], [56.02, 25.84], [56.22, 26.05],
  [56.38, 25.88], [56.42, 25.55], [56.36, 25.28], [56.28, 25.05], [56.16, 24.82], [55.95, 24.52],
  [55.7, 24.22], [55.4, 24.05], [55.05, 23.85], [54.65, 23.35], [54.25, 22.98], [53.85, 22.82],
  [53.35, 22.92], [52.85, 23.15], [52.3, 23.42], [51.85, 23.72], [51.55, 24.0],
];

const ISLANDS: [number, number][] = [
  [52.32, 24.48], [52.68, 24.52], [53.05, 24.42], [54.52, 24.58],
];

const ORIGIN = { lon: 51.15, lat: 26.3 };
const SCALE_X = 54;
const SCALE_Y = 60;

export const VIEW = { w: 310, h: 230 };

export const project = (lon: number, lat: number) => ({
  x: (lon - ORIGIN.lon) * SCALE_X,
  y: (ORIGIN.lat - lat) * SCALE_Y,
});

// About 1.85 km per map unit at UAE latitudes.
export const KM_PER_UNIT = 111 / SCALE_Y;

function inside(lon: number, lat: number) {
  let hit = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function rasterise(step: number) {
  const pts: { x: number; y: number }[] = [];
  for (let lat = 26.15; lat >= 22.75; lat -= step) {
    for (let lon = 51.4; lon <= 56.5; lon += step) {
      if (inside(lon, lat)) pts.push(project(lon, lat));
    }
  }
  for (const [lon, lat] of ISLANDS) pts.push(project(lon, lat));
  return pts;
}

export const DOTS = rasterise(0.07);

export function bearing(from: { x: number; y: number }, to: { x: number; y: number }) {
  const deg = (Math.atan2(to.x - from.x, -(to.y - from.y)) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function arcPath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(36, len * 0.28);
  const cx = mx + (dy / len) * bend;
  const cy = my - (dx / len) * bend;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}

// Radar wedge drawn as stacked slices so it fades without gradients on arcs.
export function sweepSlices(c: { x: number; y: number }, r: number, spanDeg: number, n: number) {
  const out: { d: string; o: number }[] = [];
  const step = spanDeg / n;
  for (let i = 0; i < n; i++) {
    const a0 = (-i - 1) * step;
    const a1 = -i * step;
    const p = (deg: number) => {
      const rad = (deg * Math.PI) / 180;
      return `${(c.x + Math.sin(rad) * r).toFixed(1)},${(c.y - Math.cos(rad) * r).toFixed(1)}`;
    };
    out.push({ d: `M${c.x},${c.y} L${p(a0)} A${r},${r} 0 0 1 ${p(a1)} Z`, o: 0.2 * Math.pow(1 - i / n, 1.8) });
  }
  return out;
}
