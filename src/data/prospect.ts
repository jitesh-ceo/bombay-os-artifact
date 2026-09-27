// Resolves who the demo is personalised for, before any other data module loads.
// Priority: URL (?client=Acme&preset=agency) → saved setup (localStorage) → preset default.

export type PresetId = 'agency' | 'realestate';

export const PRESETS: { id: PresetId; label: string; defaultName: string; blurb: string }[] = [
  {
    id: 'agency',
    label: 'Digital & tech agency',
    defaultName: 'Northstar Studio',
    blurb: 'Client briefs, campaign performance, weekly client reports',
  },
  {
    id: 'realestate',
    label: 'Real estate developer',
    defaultName: 'Aurelia Estates',
    blurb: 'Buyer enquiries, stalled deals, leadership reporting',
  },
];

const STORAGE_KEY = 'bombay-os.prospect';

function resolve(): { name: string; preset: PresetId; personalised: boolean } {
  const params = new URLSearchParams(window.location.search);
  let saved: { name?: string; preset?: string } = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    saved = {};
  }
  const rawPreset = params.get('preset') ?? saved.preset ?? 'agency';
  const preset: PresetId = PRESETS.some((p) => p.id === rawPreset) ? (rawPreset as PresetId) : 'agency';
  const name = (params.get('client') ?? saved.name ?? '').trim();
  const def = PRESETS.find((p) => p.id === preset)!;
  return { name: name || def.defaultName, preset, personalised: Boolean(name) };
}

export const prospect = resolve();

const initials = prospect.name
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((w) => w[0]!.toUpperCase())
  .join('');

const domain = `${prospect.name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'client'}.in`;

const TOKENS: Record<string, string> = {
  '{client}': prospect.name,
  '{initials}': initials || 'BO',
  '{domain}': domain,
};

function replaceTokens(s: string): string {
  return s.replace(/\{client\}|\{initials\}|\{domain\}/g, (m) => TOKENS[m] ?? m);
}

export function personalize<T>(value: T): T {
  if (typeof value === 'string') return replaceTokens(value) as T;
  if (Array.isArray(value)) return value.map(personalize) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, personalize(v)])) as T;
  }
  return value;
}

export function pick<T>(byPreset: Record<PresetId, T>): T {
  return personalize(byPreset[prospect.preset]);
}

export function launchProspect(name: string, preset: PresetId) {
  const clean = name.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: clean, preset }));
  const params = new URLSearchParams();
  if (clean) params.set('client', clean);
  params.set('preset', preset);
  window.location.search = params.toString();
}

export function shareLink(name: string, preset: PresetId) {
  const params = new URLSearchParams();
  if (name.trim()) params.set('client', name.trim());
  params.set('preset', preset);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}
