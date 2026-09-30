export const TZ = 'Asia/Dubai';

const pad = (n: number) => String(n).padStart(2, '0');

const partsFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
  hourCycle: 'h23',
});

export function dubaiParts(d = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour) % 24,
    min: Number(p.minute),
    s: Number(p.second),
    wd: String(p.weekday).toLowerCase().slice(0, 3),
  };
}

export function dubaiDate(offsetDays = 0) {
  const p = dubaiParts(new Date(Date.now() + offsetDays * 864e5));
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

export function minutesNow() {
  const p = dubaiParts();
  return p.h * 60 + p.min;
}

export function fmtMin(m: number) {
  const v = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
}

export function fmtClock(d = new Date()) {
  const p = dubaiParts(d);
  return `${pad(p.h)}:${pad(p.min)}:${pad(p.s)}`;
}

export function fmtLongDate(lang: 'en' | 'ar', d = new Date()) {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function fmtStamp(ts: number, lang: 'en' | 'ar') {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB', {
    timeZone: TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(ts);
}

const WEEK = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function runsToday(days: string, wd = dubaiParts().wd) {
  const spec = days.toLowerCase().replace(/\s/g, '');
  if (spec === 'daily') return true;
  return spec.split(',').some((part) => {
    if (part.includes('-')) {
      const [a, b] = part.split('-');
      const i = WEEK.indexOf(a);
      const j = WEEK.indexOf(b);
      const k = WEEK.indexOf(wd);
      return i <= j ? k >= i && k <= j : k >= i || k <= j;
    }
    return part === wd;
  });
}

export const compact = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}K` : n.toLocaleString('en-US');
