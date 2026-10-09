// Resolves who the demo is personalised for, before any other data module loads.
// Priority: URL (?client=Acme&preset=creator) → saved setup (localStorage) → preset default.

export type PresetId = 'creator' | 'studio' | 'realestate';

export const PRESETS: { id: PresetId; label: string; defaultName: string; blurb: string; hidden?: boolean }[] = [
  {
    id: 'creator',
    label: 'Creator & small team',
    defaultName: 'Layla Noor',
    blurb: 'Brand deals, viral moments, weekly upload packs',
  },
  {
    id: 'studio',
    label: 'Creator-led studio',
    defaultName: 'Falcon & Co Creative',
    blurb: 'Client campaigns, creator roster, weekly client reports',
  },
  {
    id: 'realestate',
    label: 'Real estate developer',
    defaultName: 'Aurelia Estates',
    blurb: 'Buyer enquiries, stalled deals, leadership reporting',
    hidden: true,
  },
];

const DEFAULT_PRESET: PresetId = 'creator';
// Links made before the creator re-theme used ?preset=agency.
const LEGACY: Record<string, PresetId> = { agency: 'studio' };

export function resolvePreset(raw: string | null | undefined): PresetId {
  if (!raw) return DEFAULT_PRESET;
  const id = LEGACY[raw] ?? raw;
  return PRESETS.some((p) => p.id === id) ? (id as PresetId) : DEFAULT_PRESET;
}

const STORAGE_KEY = 'bombay-os.prospect';

function resolve(): { name: string; preset: PresetId; personalised: boolean } {
  const params = new URLSearchParams(window.location.search);
  let saved: { name?: string; preset?: string } = {};
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    saved = {};
  }
  const preset = resolvePreset(params.get('preset') ?? saved.preset);
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

// Creator content falls back to studio until every module has its own creator entry.
export function pick<T>(byPreset: Omit<Record<PresetId, T>, 'creator'> & { creator?: T }): T {
  return personalize(byPreset[prospect.preset] ?? byPreset.studio);
}

// The Control Room exists for the creator presets only.
export const hasRoom = () => prospect.preset !== 'realestate';
// Creator presets price in US dollars; real estate in rupees.
export const usesUsd = () => prospect.preset !== 'realestate';

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
