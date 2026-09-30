import { animate } from 'framer-motion';
import { Crosshair, Maximize2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoom } from './store';
import { fmtMin, minutesNow } from './time';
import type { CalEvent, Place, PlaceId } from './types';
import { M, Panel } from './ui';

// Equirectangular projection of greater Dubai. Longitude is scaled by cos(25.2°) so distances stay true.
const LON0 = 55.05;
const LON1 = 55.45;
const LAT0 = 25.03;
const LAT1 = 25.37;
const KX = 2500;
const KY = 2762;
const W = (LON1 - LON0) * KX;
const H = (LAT1 - LAT0) * KY;
const KM_PER_UNIT = 111.32 / KY;
const Z_MIN = 0.5;
const Z_MAX = 6;
const FOCUS_Z = 2.6;
const EASE = [0.22, 1, 0.36, 1] as const;

type Pt = [number, number];
type View = { cx: number; cy: number; z: number };
type Box = { x0: number; y0: number; x1: number; y1: number };

const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

const px = (lon: number, lat: number): Pt => [(lon - LON0) * KX, (LAT1 - lat) * KY];
const path = (pts: Pt[], close = false) =>
  pts
    .map(([lon, lat], i) => {
      const [x, y] = px(lon, lat);
      return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + (close ? ' Z' : '');

const COAST: Pt[] = [
  [54.9, 24.93], [55.0, 24.99], [55.06, 25.03], [55.12, 25.07], [55.135, 25.085], [55.16, 25.11], [55.19, 25.14],
  [55.22, 25.17], [55.245, 25.2], [55.26, 25.23], [55.275, 25.255], [55.29, 25.27], [55.31, 25.28], [55.335, 25.295],
  [55.355, 25.315], [55.375, 25.335], [55.395, 25.355], [55.42, 25.375], [55.47, 25.41], [55.55, 25.47],
];
const SEA = path([...COAST, [55.7, 25.7], [54.7, 25.7], [54.7, 24.8]], true);
const COASTLINE = path(COAST);
const DEIRA_ISLANDS = path([[55.3, 25.292], [55.318, 25.302], [55.335, 25.312], [55.342, 25.305], [55.325, 25.294], [55.305, 25.286]], true);
const CREEK = path([[55.297, 25.268], [55.305, 25.258], [55.318, 25.247], [55.326, 25.232], [55.33, 25.215], [55.338, 25.203]]);
const CANAL = path([[55.322, 25.205], [55.3, 25.19], [55.275, 25.183], [55.255, 25.185], [55.237, 25.192]]);
const LAGOON = px(55.342, 25.196);
const RUNWAYS = [path([[55.343, 25.262], [55.381, 25.238]]), path([[55.349, 25.269], [55.387, 25.245]])];
const ROADS = [
  path([[54.95, 24.95], [55.05, 25.01], [55.13, 25.062], [55.2, 25.118], [55.25, 25.165], [55.275, 25.2], [55.29, 25.225], [55.305, 25.245], [55.325, 25.262], [55.35, 25.285], [55.38, 25.308], [55.42, 25.33], [55.5, 25.37]]),
  path([[55.15, 24.98], [55.2, 25.04], [55.24, 25.1], [55.27, 25.14], [55.3, 25.17], [55.33, 25.2], [55.36, 25.23], [55.4, 25.27]]),
  path([[55.2, 24.95], [55.27, 25.03], [55.33, 25.1], [55.38, 25.16], [55.42, 25.22], [55.47, 25.3]]),
];
const STREETS = [
  path([[55.14, 25.085], [55.17, 25.115], [55.2, 25.145], [55.23, 25.175], [55.25, 25.2], [55.265, 25.228], [55.28, 25.25]]),
  path([[55.18, 25.11], [55.21, 25.14], [55.235, 25.168], [55.255, 25.195], [55.27, 25.215], [55.285, 25.235]]),
  path([[55.17, 25.098], [55.195, 25.075], [55.22, 25.05]]),
  path([[55.2, 25.14], [55.225, 25.115], [55.25, 25.09]]),
  path([[55.235, 25.168], [55.26, 25.145], [55.29, 25.12]]),
  path([[55.265, 25.228], [55.29, 25.205], [55.32, 25.18]]),
  path([[55.33, 25.215], [55.345, 25.235], [55.36, 25.25], [55.38, 25.275]]),
  path([[55.3, 25.265], [55.32, 25.275], [55.345, 25.285], [55.37, 25.3]]),
  path([[55.135, 25.075], [55.16, 25.05], [55.19, 25.02]]),
];
const SHIELDS: { id: string; at: Pt }[] = [
  { id: 'E11', at: [55.2, 25.118] },
  { id: 'E44', at: [55.24, 25.1] },
  { id: 'E311', at: [55.33, 25.1] },
];
const AREAS: { en: string; ar: string; at: Pt; sea?: boolean; minZ?: number }[] = [
  { en: 'Arabian Gulf', ar: 'الخليج العربي', at: [55.12, 25.25], sea: true },
  { en: 'Palm Jumeirah', ar: 'نخلة جميرا', at: [55.108, 25.142], minZ: 1.2 },
  { en: 'The World', ar: 'جزر العالم', at: [55.175, 25.252], minZ: 1.6 },
  { en: 'Jumeirah', ar: 'جميرا', at: [55.252, 25.183], minZ: 1.4 },
  { en: 'Al Barsha', ar: 'البرشاء', at: [55.2, 25.098], minZ: 1.4 },
  { en: 'Bur Dubai', ar: 'بر دبي', at: [55.292, 25.247], minZ: 1.4 },
  { en: 'Deira', ar: 'ديرة', at: [55.327, 25.272] },
  { en: 'Ras Al Khor', ar: 'رأس الخور', at: [55.35, 25.18], minZ: 1.6 },
  { en: 'DXB', ar: 'مطار دبي', at: [55.362, 25.245], minZ: 1.2 },
  { en: 'Sharjah', ar: 'الشارقة', at: [55.42, 25.35] },
  { en: 'Jebel Ali', ar: 'جبل علي', at: [55.07, 25.02] },
];

// The World: a fixed scatter of islets off Jumeirah.
const ISLANDS = (() => {
  const [cx, cy] = px(55.175, 25.228);
  return Array.from({ length: 72 }, (_, i) => {
    const a = i * 2.39996;
    const r = Math.sqrt((i + 0.5) / 72);
    return { x: cx + Math.cos(a) * r * 46, y: cy + Math.sin(a) * r * 30, r: 2 + ((i * 7) % 5) * 0.5 };
  });
})();

function Palm() {
  const [bx, by] = px(55.15, 25.1);
  const [cx, cy] = px(55.126, 25.121);
  const dir = Math.atan2(cy - by, cx - bx);
  const fronds = Array.from({ length: 9 }, (_, i) => {
    const a = dir + ((i - 4) * 20 * Math.PI) / 180;
    return `M${cx.toFixed(1)},${cy.toFixed(1)} L${(cx + Math.cos(a) * 38).toFixed(1)},${(cy + Math.sin(a) * 38).toFixed(1)}`;
  }).join(' ');
  const r = 56;
  const a0 = dir - (105 * Math.PI) / 180;
  const a1 = dir + (105 * Math.PI) / 180;
  const crescent = `M${(cx + Math.cos(a0) * r).toFixed(1)},${(cy + Math.sin(a0) * r).toFixed(1)} A${r},${r} 0 1 1 ${(cx + Math.cos(a1) * r).toFixed(1)},${(cy + Math.sin(a1) * r).toFixed(1)}`;
  return (
    <g className="rm-map__palm">
      <path d={`M${bx},${by} L${cx},${cy}`} />
      <path d={fronds} />
      <path d={crescent} />
    </g>
  );
}

function distanceKm(a: Place, b: Place) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

const kindOf = (id: PlaceId) => (id === 'hq' ? 'studio' : id === 'quoz' ? 'shoot' : 'client');
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function useSize<T extends HTMLElement>() {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0, rem: 16 });
  useEffect(() => {
    if (!el) return;
    const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    setSize({ w: el.clientWidth, h: el.clientHeight, rem: rem() });
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height, rem: rem() }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, size, el] as const;
}

export function Radar() {
  const room = useRoom();
  const ar = room.lang === 'ar';
  const masked = room.panelMasked('radar') === 'names';
  const now = minutesNow();
  const [vpRef, size, vpEl] = useSize<HTMLDivElement>();
  const [view, setView] = useState<View>({ cx: W / 2, cy: H / 2, z: 1 });
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<PlaceId | null>(null);
  const [filter, setFilter] = useState<'all' | 'today'>('all');
  const viewRef = useRef(view);
  viewRef.current = view;
  const tween = useRef<{ stop: () => void } | null>(null);
  const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);

  const places = room.places;
  const hq = places.find((p) => p.id === 'hq')!;
  const centre = places.find((p) => p.id === room.radarCentre)!;
  const aspect = size.w && size.h ? size.h / size.w : 0.66;
  const viewW = W / view.z;
  const viewH = viewW * aspect;
  const x0 = view.cx - viewW / 2;
  const y0 = view.cy - viewH / 2;
  const toScreen = ([ux, uy]: Pt): Pt => [((ux - x0) / viewW) * size.w, ((uy - y0) / viewH) * size.h];

  const meetings = useMemo(() => {
    const byPlace = new Map<PlaceId, CalEvent[]>();
    for (const e of room.calendar) {
      if (!e.place) continue;
      byPlace.set(e.place, [...(byPlace.get(e.place) ?? []), e]);
    }
    return byPlace;
  }, [room.calendar]);
  const nextAt = (id: PlaceId) => meetings.get(id)?.find((e) => e.end > now);

  const clampView = useCallback((v: View): View => ({ z: clamp(v.z, Z_MIN, Z_MAX), cx: clamp(v.cx, 0, W), cy: clamp(v.cy, 0, H) }), []);

  // Screen padding keeps every pin clear of the filter, zoom controls, HUD and pin labels.
  const fitView = useCallback((): View => {
    const pts = places.map((p) => px(p.lon, p.lat));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const [padL, padR, padT, padB] = [72, 72, 64, 56];
    const w = size.w || 400;
    const h = size.h || 300;
    const bw = Math.max(1, Math.max(...xs) - Math.min(...xs));
    const bh = Math.max(1, Math.max(...ys) - Math.min(...ys));
    const z = Math.min(((w - padL - padR) * W) / (bw * w), ((h - padT - padB) * W) / (bh * w));
    const perPx = W / (z * w);
    return clampView({
      cx: (Math.max(...xs) + Math.min(...xs)) / 2 + ((padR - padL) / 2) * perPx,
      cy: (Math.max(...ys) + Math.min(...ys)) / 2 + ((padB - padT) / 2) * perPx,
      z,
    });
  }, [places, size.w, size.h, clampView]);

  const flyTo = useCallback(
    (target: View) => {
      tween.current?.stop();
      const from = viewRef.current;
      const t = clampView(target);
      tween.current = animate(0, 1, {
        duration: 0.9,
        ease: EASE,
        onUpdate: (p) => setView({ cx: from.cx + (t.cx - from.cx) * p, cy: from.cy + (t.cy - from.cy) * p, z: from.z * Math.pow(t.z / from.z, p) }),
      });
    },
    [clampView],
  );

  const focusOn = useCallback((p: Place) => {
    const [x, y] = px(p.lon, p.lat);
    flyTo({ cx: x, cy: y, z: Math.max(FOCUS_Z, viewRef.current.z) });
  }, [flyTo]);

  // Frame every location on first measurement, and again on resize until the user moves the map.
  const touched = useRef(false);
  useEffect(() => {
    if (!size.w || (ready && (touched.current || room.radarPick))) return;
    setView(fitView());
    setReady(true);
    // Only when the viewport is measured or resized.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  // A pick from the chips, pins or the assistant flies there; clearing it frames everything again.
  useEffect(() => {
    if (!ready) return;
    const pick = room.radarPick ? places.find((p) => p.id === room.radarPick) : null;
    if (pick) focusOn(pick);
    else flyTo(fitView());
    // Only when the pick changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.radarPick, ready]);

  useEffect(() => () => tween.current?.stop(), []);

  const zoomBy = useCallback(
    (factor: number, at?: Pt) => {
      tween.current?.stop();
      touched.current = true;
      const v = viewRef.current;
      const vw = W / v.z;
      const vh = vw * aspect;
      const [mx, my] = at ?? [size.w / 2, size.h / 2];
      const ux = v.cx - vw / 2 + (mx / size.w) * vw;
      const uy = v.cy - vh / 2 + (my / size.h) * vh;
      const z = clamp(v.z * factor, Z_MIN, Z_MAX);
      const nw = W / z;
      const nh = nw * aspect;
      const next = clampView({ z, cx: ux - (mx / size.w - 0.5) * nw, cy: uy - (my / size.h - 0.5) * nh });
      viewRef.current = next;
      setView(next);
    },
    [aspect, size.w, size.h, clampView],
  );

  useEffect(() => {
    const el = vpEl;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(e.deltaY < 0 ? 1.18 : 1 / 1.18, [e.clientX - r.left, e.clientY - r.top]);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [vpEl, zoomBy]);

  const rings = [2, 5, 10].map((k) => ({ k, r: k / KM_PER_UNIT }));
  const [fx, fy] = px(centre.lon, centre.lat);
  const [hx, hy] = px(hq.lon, hq.lat);
  // Ring labels sit on the side facing away from HQ so they never cross the route.
  const away = (() => {
    const dx = fx - hx;
    const dy = fy - hy;
    const len = Math.hypot(dx, dy);
    return len > 1 ? [dx / len, dy / len] : [-Math.SQRT1_2, -Math.SQRT1_2];
  })();
  const route = centre.id !== 'hq'
    ? (() => {
        const mx = (hx + fx) / 2;
        const my = (hy + fy) / 2;
        const len = Math.hypot(fx - hx, fy - hy);
        const cx = mx + ((hy - fy) / len) * len * 0.18;
        const cy = my + ((fx - hx) / len) * len * 0.18;
        return { d: `M${hx},${hy} Q${cx},${cy} ${fx},${fy}`, ctrl: [cx, cy] as Pt, km: distanceKm(hq, centre) };
      })()
    : null;

  const focusNext = nextAt(centre.id);
  const name = (p: Place) => (ar ? p.nameAr : p.name);
  const short = (p: Place) => name(p).split(' · ')[0];
  const area = (p: Place) => name(p).split(' · ').pop();
  const hovered = hover ? places.find((p) => p.id === hover) : null;
  const kindLabel = { studio: room.t('studioHq'), shoot: room.t('shootLocation'), client: room.t('clientOffice') } as const;

  // Greedy label placement in priority order: each label tries the right, then the left, else waits for hover.
  const layout = (() => {
    const rem = size.rem;
    const charW = 0.4 * rem;
    const lh = 1.25 * rem;
    const boxes: Box[] = [
      { x0: 0, y0: 0, x1: 13 * rem, y1: 3 * rem },
      { x0: size.w - 3.25 * rem, y0: 0, x1: size.w, y1: 7.25 * rem },
      { x0: 0, y0: size.h - 2.75 * rem, x1: Math.min(size.w, 24 * rem), y1: size.h },
    ];
    const fits = (b: Box) => b.x0 >= 4 && b.x1 <= size.w - 4 && b.y0 >= 4 && b.y1 <= size.h - 4 && !boxes.some((o) => hit(o, b));
    const pins = places.map((p) => {
      const [x, y] = toScreen(px(p.lon, p.lat));
      const next = nextAt(p.id);
      return { p, x, y, next, live: !!next && next.start <= now };
    });
    pins.forEach(({ x, y }) => boxes.push({ x0: x - 0.6 * rem, y0: y - 0.6 * rem, x1: x + 0.6 * rem, y1: y + 0.6 * rem }));
    const rank = (d: (typeof pins)[number]) =>
      d.p.id === centre.id ? 0 : d.p.id === 'hq' ? 1 : d.live ? 2 : d.next ? 3 + d.next.start / 1e4 : 5;
    const placed = new Map<PlaceId, { label: 'r' | 'l' | null; time: boolean }>();
    for (const d of [...pins].sort((a, b) => rank(a) - rank(b))) {
      const text = masked && d.p.id !== 'hq' ? 6 : short(d.p).length;
      const w = text * charW + 1.1 * rem;
      const right = { x0: d.x + 0.875 * rem, y0: d.y - lh / 2, x1: d.x + 0.875 * rem + w, y1: d.y + lh / 2 };
      const left = { x0: d.x - 0.875 * rem - w, y0: d.y - lh / 2, x1: d.x - 0.875 * rem, y1: d.y + lh / 2 };
      const side = fits(right) ? 'r' : fits(left) ? 'l' : null;
      if (side) boxes.push(side === 'r' ? right : left);
      let time = false;
      if (d.next) {
        const tw = 3.1 * rem;
        const tb = side === 'l'
          ? { x0: d.x + 0.75 * rem, y0: d.y - 0.55 * rem, x1: d.x + 0.75 * rem + tw, y1: d.y + 0.55 * rem }
          : { x0: d.x - 0.75 * rem - tw, y0: d.y - 0.55 * rem, x1: d.x - 0.75 * rem, y1: d.y + 0.55 * rem };
        time = fits(tb);
        if (time) boxes.push(tb);
      }
      placed.set(d.p.id, { label: side, time });
    }
    let routeAt: Pt | null = null;
    if (route) {
      const text = room.t('kmFromHq', { n: route.km.toFixed(1) });
      const w = text.length * charW + 1.2 * rem;
      const [hq0, c, f] = [px(hq.lon, hq.lat), route.ctrl, px(centre.lon, centre.lat)];
      for (const t of [0.5, 0.4, 0.6, 0.3, 0.7]) {
        const u = 1 - t;
        const [sx, sy] = toScreen([u * u * hq0[0] + 2 * u * t * c[0] + t * t * f[0], u * u * hq0[1] + 2 * u * t * c[1] + t * t * f[1]]);
        const b = { x0: sx - w / 2, y0: sy - lh / 2, x1: sx + w / 2, y1: sy + lh / 2 };
        if (fits(b)) {
          boxes.push(b);
          routeAt = [sx, sy];
          break;
        }
      }
    }
    const ringsAt = rings.map(({ k, r }) => {
      const [sx, sy] = toScreen([fx + away[0] * r, fy + away[1] * r]);
      const b = { x0: sx - 1.2 * rem, y0: sy - 0.5 * rem, x1: sx + 1.2 * rem, y1: sy + 0.5 * rem };
      if (!fits(b)) return null;
      boxes.push(b);
      return { k, x: sx, y: sy };
    });
    return { pins, placed, routeAt, ringsAt };
  })();

  return (
    <Panel id="radar" title={room.t('pRadar')} source="Calendar · client and studio locations" fresh={room.radarPick ? room.t('pinned') : room.t('follows')} connector="calendar">
      <div className="rm-radar" dir="ltr">
        <div
          ref={vpRef}
          className="rm-radar__viewport"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            tween.current?.stop();
            drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, moved: false };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = e.clientX - d.x;
            const dy = e.clientY - d.y;
            if (!d.moved && Math.hypot(dx, dy) < 4) return;
            d.moved = true;
            touched.current = true;
            setView((v) => clampView({ ...v, cx: d.cx - (dx / size.w) * viewW, cy: d.cy - (dy / size.h) * viewH }));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onDoubleClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            zoomBy(1.6, [e.clientX - r.left, e.clientY - r.top]);
          }}
        >
          <svg className="rm-map" viewBox={`${x0} ${y0} ${viewW} ${viewH}`} preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="rm-sea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0a1517" />
                <stop offset="1" stopColor="#0d1a1c" />
              </linearGradient>
              <radialGradient id="rm-sweep" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform={`scale(${rings[2].r})`}>
                <stop offset="0" stopColor="rgba(242,169,59,0.28)" />
                <stop offset="1" stopColor="rgba(242,169,59,0)" />
              </radialGradient>
              <pattern id="rm-blocks" width="24" height="24" patternUnits="userSpaceOnUse">
                <rect width="24" height="24" fill="none" />
                <circle cx="12" cy="12" r="1" fill="rgba(244,236,224,0.05)" />
              </pattern>
            </defs>
            <rect x={-2000} y={-2000} width={W + 4000} height={H + 4000} className="rm-map__land" />
            <rect x={-2000} y={-2000} width={W + 4000} height={H + 4000} fill="url(#rm-blocks)" />
            <path d={SEA} fill="url(#rm-sea)" />
            <path d={COASTLINE} className="rm-map__shallows" />
            <path d={COASTLINE} className="rm-map__coast" />
            <path d={DEIRA_ISLANDS} className="rm-map__islet" />
            <circle cx={px(55.247, 25.217)[0]} cy={px(55.247, 25.217)[1]} r={5} className="rm-map__islet" />
            {ISLANDS.map((i, n) => (
              <circle key={n} cx={i.x} cy={i.y} r={i.r} className="rm-map__islet" />
            ))}
            <Palm />
            <path d={CREEK} className="rm-map__water" strokeWidth={9} />
            <path d={CANAL} className="rm-map__water" strokeWidth={5} />
            <ellipse cx={LAGOON[0]} cy={LAGOON[1]} rx={18} ry={12} className="rm-map__lagoon" />
            {RUNWAYS.map((d, i) => (
              <path key={i} d={d} className="rm-map__runway" />
            ))}
            <g className="rm-map__streets" style={{ opacity: clamp((view.z - 1.2) / 0.8, 0, 1) }}>
              {STREETS.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            {ROADS.map((d, i) => (
              <g key={i}>
                <path d={d} className="rm-map__road-casing" />
                <path d={d} className="rm-map__road" />
              </g>
            ))}
            {rings.map(({ k, r }) => (
              <circle key={k} cx={fx} cy={fy} r={r} className="rm-map__ring" />
            ))}
            <g transform={`translate(${fx} ${fy})`}>
              <g className="rm-map__sweep">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="7s" repeatCount="indefinite" />
                <path d={`M0,0 L${rings[2].r},0 A${rings[2].r},${rings[2].r} 0 0 1 ${(rings[2].r * Math.cos(0.9)).toFixed(1)},${(rings[2].r * Math.sin(0.9)).toFixed(1)} Z`} fill="url(#rm-sweep)" />
              </g>
            </g>
            {route && <path d={route.d} className="rm-map__route" />}
          </svg>

          {size.w > 0 && (
            <div className="rm-overlay">
              {AREAS.filter((a) => view.z >= (a.minZ ?? 0)).map((a) => {
                const [x, y] = toScreen(px(a.at[0], a.at[1]));
                return (
                  <span key={a.en} className={`rm-area ${a.sea ? 'is-sea' : ''}`} style={{ left: x, top: y }}>
                    {ar ? a.ar : a.en}
                  </span>
                );
              })}
              {view.z >= 1.1 &&
                SHIELDS.map((s) => {
                  const [x, y] = toScreen(px(s.at[0], s.at[1]));
                  return (
                    <span key={s.id} className="rm-shield" style={{ left: x, top: y }}>
                      {s.id}
                    </span>
                  );
                })}
              {layout.ringsAt.map(
                (r) =>
                  r && (
                    <span key={r.k} className="rm-ring-label" dir={ar ? 'rtl' : 'ltr'} style={{ left: r.x, top: r.y }}>
                      {r.k} {room.t('km')}
                    </span>
                  ),
              )}
              {route && layout.routeAt && (
                <span className="rm-route-label" dir={ar ? 'rtl' : 'ltr'} style={{ left: layout.routeAt[0], top: layout.routeAt[1] }}>
                  {room.t('kmFromHq', { n: route.km.toFixed(1) })}
                </span>
              )}

              {layout.pins.map(({ p, x, y, next, live }) => {
                const dim = filter === 'today' && !next && p.id !== 'hq';
                const focused = p.id === centre.id;
                const spot = layout.placed.get(p.id);
                return (
                  <button
                    key={p.id}
                    className={`rm-pin is-${kindOf(p.id)} ${focused ? 'is-focus' : ''} ${live ? 'is-live' : ''} ${dim ? 'is-dim' : ''} ${hover === p.id ? 'is-hover' : ''} ${spot?.label === 'l' ? 'is-flip' : ''} ${spot?.label ? '' : 'is-quiet'}`}
                    style={{ left: x, top: y }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => (room.radarPick === p.id ? focusOn(p) : room.setRadar(p.id))}
                    onMouseEnter={() => setHover(p.id)}
                    onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
                    onFocus={() => setHover(p.id)}
                    onBlur={() => setHover((h) => (h === p.id ? null : h))}
                    aria-label={masked && p.id !== 'hq' ? kindLabel[kindOf(p.id)] : name(p)}
                  >
                    <i className="rm-pin__halo" />
                    <i className="rm-pin__dot" />
                    {next && !dim && spot?.time && <span className="rm-pin__time">{fmtMin(next.start)}</span>}
                    <span className="rm-pin__label">
                      <M on={masked && p.id !== 'hq'} w={6}>
                        {short(p)}
                      </M>
                    </span>
                  </button>
                );
              })}

              {hovered && (() => {
                const [x, y] = toScreen(px(hovered.lon, hovered.lat));
                const left = x > size.w * 0.55;
                const list = meetings.get(hovered.id) ?? [];
                return (
                  <div dir={ar ? 'rtl' : 'ltr'} className={`rm-tip ${left ? 'is-left' : ''}`} style={{ left: x, top: clamp(y, 70, size.h - 70) }}>
                    <span className="rm-tip__kind">{kindLabel[kindOf(hovered.id)]}</span>
                    <b className="rm-tip__name">
                      <M on={masked && hovered.id !== 'hq'} w={8}>
                        {short(hovered)}
                      </M>
                    </b>
                    <span className="rm-tip__meta">
                      {area(hovered)}
                      {hovered.id !== 'hq' && ` · ${room.t('kmFromHq', { n: distanceKm(hq, hovered).toFixed(1) })}`}
                    </span>
                    <span className="rm-tip__list">
                      {list.length === 0 && <span className="t-3">{room.t('noMeetings')}</span>}
                      {list.map((e) => {
                        const state = e.end <= now ? 'done' : e.start <= now ? 'live' : 'next';
                        return (
                          <span key={e.id} className={`rm-tip__row is-${state}`}>
                            <b>{fmtMin(e.start)}</b>
                            <span className="rm-ellipsis">
                              <M on={masked} w={7}>
                                {e.with}
                              </M>
                            </span>
                            {state === 'live' && <em>{room.t('liveNow')}</em>}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          <div className="rm-mapfilter rm-tabs" onPointerDown={(e) => e.stopPropagation()}>
            <button className={filter === 'all' ? 'is-on' : ''} onClick={() => setFilter('all')}>
              {room.t('allPlaces')}
            </button>
            <button className={filter === 'today' ? 'is-on' : ''} onClick={() => setFilter('today')}>
              {room.t('meetingsToday')}
            </button>
          </div>

          <div className="rm-mapctl" onPointerDown={(e) => e.stopPropagation()}>
            <button onClick={() => zoomBy(1.4)} aria-label={room.t('zoomIn')} title={room.t('zoomIn')}>
              <Plus size={14} />
            </button>
            <button onClick={() => zoomBy(1 / 1.4)} aria-label={room.t('zoomOut')} title={room.t('zoomOut')}>
              <Minus size={14} />
            </button>
            <button
              onClick={() => {
                touched.current = false;
                if (room.radarPick) room.setRadarPick(null);
                else flyTo(fitView());
              }}
              aria-label={room.t('fitAll')}
              title={room.t('fitAll')}
            >
              <Maximize2 size={13} />
            </button>
          </div>

          <div className="rm-radar__hud" dir={ar ? 'rtl' : 'ltr'} onPointerDown={(e) => e.stopPropagation()}>
            <Crosshair size={12} />
            <span className="rm-ellipsis">
              <M on={masked && centre.id !== 'hq'} w={8}>
                {name(centre)}
              </M>
            </span>
            {route && <span className="t-3">{room.t('kmFromHq', { n: route.km.toFixed(1) })}</span>}
            {focusNext && (
              <span className={`rm-radar__when ${focusNext.start <= now ? 'is-live' : ''}`}>
                {focusNext.start <= now ? room.t('liveNow') : room.t('next')} {fmtMin(focusNext.start)}
              </span>
            )}
          </div>
        </div>

        <div className="rm-radar__picks">
          {places.map((p) => (
            <button key={p.id} className={p.id === centre.id ? 'is-on' : ''} onClick={() => room.setRadar(p.id)}>
              {nextAt(p.id) && <i className="rm-pick-dot" />}
              {area(p)}
            </button>
          ))}
          {room.radarPick && (
            <button className="rm-follow" onClick={() => room.setRadarPick(null)}>
              ↺ {room.t('follows')}
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}
