// Prospect-specific identity. `{client}` is replaced with the prospect name from the setup screen / URL.
import { integrations, type IntegrationId } from './integrations';
import { pick, type PresetId } from './prospect';

export const os = {
  name: 'JARVIS',
  maker: 'Northstar Studio',
  version: 'v1.0',
  presenter: 'Farhan Rakhangi',
  presenterRole: 'CEO, Bombay Media',
};

interface ClientIdentity {
  name: string;
  initials: string;
  descriptor: string;
  approver: string;
  approverRole: string;
  hq: { city: string; lon: number; lat: number };
}

export const clientByPreset: Record<PresetId, ClientIdentity> = {
  creator: {
    name: '{client}',
    initials: '{initials}',
    descriptor: 'Lifestyle & tech creator · Dubai',
    approver: 'Sara Mansour',
    approverRole: 'Manager',
    hq: { city: 'Dubai', lon: 55.27, lat: 25.2 },
  },
  studio: {
    name: '{client}',
    initials: '{initials}',
    descriptor: 'Creator-led content studio · Dubai',
    approver: 'Meera Kapoor',
    approverRole: 'Creative Director',
    hq: { city: 'Dubai', lon: 55.27, lat: 25.2 },
  },
  realestate: {
    name: '{client}',
    initials: '{initials}',
    descriptor: 'Premium residences · Mumbai',
    approver: 'Kavya Shah',
    approverRole: 'Head of Sales',
    hq: { city: 'Mumbai', lon: 72.82, lat: 19.0 },
  },
};

export const client = pick(clientByPreset);

// Figures shown in the impact meter before any workflow runs.
export const impactBaseline = pick({
  creator: { hoursSaved: 6.5, pipelineLakhs: 22, tasksCompleted: 17 },
  studio: { hoursSaved: 11.5, pipelineLakhs: 186, tasksCompleted: 29 },
  realestate: { hoursSaved: 14.5, pipelineLakhs: 4280, tasksCompleted: 37 },
});

export type AmbientEntry = {
  minutesAgo: number;
  text: string;
  source?: IntegrationId;
  tone?: 'default' | 'accent' | 'ok' | 'flag';
};

// Ledger entries that make the system feel alive before the demo starts.
export const ambientLedger: AmbientEntry[] = pick<AmbientEntry[]>({
  creator: [
    { minutesAgo: 196, text: 'Overnight DMs and comments triaged · 63 items, 3 need you', source: 'instagram' },
    { minutesAgo: 152, text: 'Channel stats synced · +12,400 followers overnight', source: 'youtube', tone: 'ok' },
    { minutesAgo: 90, text: 'Viral spike detected · Metro reel at 4× pace', source: 'instagram', tone: 'flag' },
    { minutesAgo: 34, text: 'Brand deal received · Lumière Skin', source: 'gmail', tone: 'accent' },
  ],
  studio: [
    { minutesAgo: 192, text: 'Overnight inbox triaged · 57 emails, 4 need action', source: 'gmail' },
    { minutesAgo: 150, text: 'Ad spend synced · 12 client accounts', source: 'drive', tone: 'ok' },
    { minutesAgo: 88, text: 'Performance anomaly detected · Urban Brew, Meta Ads', source: 'gmail', tone: 'flag' },
    { minutesAgo: 34, text: 'New client brief received · Lumière Skin', source: 'gmail', tone: 'accent' },
  ],
  realestate: [
    { minutesAgo: 188, text: 'Overnight inbox triaged · 42 emails, 3 need action', source: 'gmail' },
    { minutesAgo: 141, text: 'Inventory sheet synced · 118 units live', source: 'drive', tone: 'ok' },
    { minutesAgo: 96, text: 'Stalled deal detected · Nair family, 11 days idle', source: 'notion', tone: 'accent' },
    { minutesAgo: 34, text: 'High-value enquiry received · Rahul Mehta', source: 'gmail', tone: 'accent' },
  ],
});

// Boot log: one line per connected tool for the preset, then context and signals.
export const boot = {
  lines: [
    ...integrations.filter((i) => i.initialStatus === 'connected').map((i) => `Linking ${i.name}`),
    `Loading ${client.name} context`,
    'Signals detected · 3',
  ],
};

// Inputs for the closing "What this means for {client}" screen.
export const roi = pick({
  creator: {
    teamSize: 4,
    teamMin: 1,
    teamMax: 20,
    teamLabel: 'People on your team: editing, management, design',
    hoursPerPersonWeek: 12,
    automationShare: 0.55,
    hourlyCost: 2075,
    responseBefore: '9h 40m',
    responseAfter: '< 3 min',
    sameDayBefore: 22,
    sameDayAfter: 100,
    sameDayLabel: 'Brand deals answered the same day',
    pilot: 'A 2-week pilot on the tools you already use: Gmail, YouTube Studio, Instagram and Notion. One workflow live in week one.',
  },
  studio: {
    teamSize: 24,
    teamMin: 5,
    teamMax: 120,
    teamLabel: 'People in client services, performance and account management',
    hoursPerPersonWeek: 9,
    automationShare: 0.6,
    hourlyCost: 1400,
    responseBefore: '4h 10m',
    responseAfter: '< 3 min',
    sameDayBefore: 38,
    sameDayAfter: 100,
    sameDayLabel: 'Briefs answered the same day',
    pilot: 'A 2-week pilot on the tools you already use: Gmail, Google Drive and Notion. One workflow live in week one.',
  },
  realestate: {
    teamSize: 18,
    teamMin: 5,
    teamMax: 80,
    teamLabel: 'People in sales, CRM and leadership reporting',
    hoursPerPersonWeek: 10,
    automationShare: 0.6,
    hourlyCost: 1200,
    responseBefore: '5h 30m',
    responseAfter: '< 3 min',
    sameDayBefore: 31,
    sameDayAfter: 100,
    sameDayLabel: 'Enquiries answered the same day',
    pilot: 'A 2-week pilot on the tools you already use: Gmail, Google Drive and Notion. One workflow live in week one.',
  },
});
