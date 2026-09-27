// Prospect-specific identity. `{client}` is replaced with the prospect name from the setup screen / URL.
import { pick } from './prospect';

export const os = {
  name: 'Bombay OS',
  maker: 'Bombay Media',
  version: 'v1.0',
  presenter: 'Farhan Rakhangi',
  presenterRole: 'CEO, Bombay Media',
};

export const client = pick({
  agency: {
    name: '{client}',
    initials: '{initials}',
    descriptor: 'Digital marketing & technology · Dubai',
    approver: 'Meera Kapoor',
    approverRole: 'Client Services Director',
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
});

// Figures shown in the impact meter before any workflow runs.
export const impactBaseline = pick({
  agency: { hoursSaved: 11.5, pipelineLakhs: 186, tasksCompleted: 29 },
  realestate: { hoursSaved: 14.5, pipelineLakhs: 4280, tasksCompleted: 37 },
});

export type AmbientEntry = {
  minutesAgo: number;
  text: string;
  source?: 'gmail' | 'drive' | 'notion';
  tone?: 'default' | 'accent' | 'ok' | 'flag';
};

// Ledger entries that make the system feel alive before the demo starts.
export const ambientLedger: AmbientEntry[] = pick<AmbientEntry[]>({
  agency: [
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

export const boot = {
  lines: ['Linking Gmail', 'Linking Google Drive', 'Linking Notion', `Loading ${client.name} business context`, 'Signals detected · 3'],
};

// Inputs for the closing "What this means for {client}" screen.
export const roi = pick({
  agency: {
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
