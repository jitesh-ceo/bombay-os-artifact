import type { IntegrationId } from './integrations';
import { pick } from './prospect';

export interface Signal {
  id: string;
  index: string;
  kind: string;
  headline: string;
  time: string;
  source: IntegrationId;
  urgency: 'High' | 'Alert' | 'Medium' | 'Scheduled';
  workflowId: string;
  from: string;
  fromRole: string;
  excerpt: string;
  value?: string;
  // Where the signal sits on the live operations map.
  place: { city: string; lon: number; lat: number };
}

// Accounts the OS is watching; plotted on the live operations map.
export interface Account {
  name: string;
  city: string;
  lon: number;
  lat: number;
  detail: string;
}

export interface Intent {
  id: string;
  label: string;
  hint: string;
  action: { type: 'briefing' } | { type: 'run'; signalId: string };
}

interface Pack {
  signals: Signal[];
  accounts: Account[];
  intents: Intent[];
  briefing: string[];
  morning: { label: string; lines: [string, string][] };
}

const pack = pick<Pack>({
  agency: {
    signals: [
      {
        id: 'sig-brief',
        index: '01',
        kind: 'New client brief',
        headline: 'D2C launch · $48K / quarter',
        time: '6:12 AM',
        source: 'gmail',
        urgency: 'High',
        workflowId: 'wf-brief',
        from: 'Ananya Rao',
        fromRole: 'Founder, Lumière Skin · Abu Dhabi',
        excerpt:
          'We launch our vitamin C range in November and need one agency for performance marketing, social and a new landing page. Budget is around $48,000 for the quarter. Could you send a proposal this week?',
        value: '$48K / quarter',
        place: { city: 'Abu Dhabi', lon: 54.37, lat: 24.45 },
      },
      {
        id: 'sig-perf',
        index: '02',
        kind: 'Performance alert',
        headline: 'Meta ROAS down 38% overnight',
        time: '5:40 AM',
        source: 'gmail',
        urgency: 'Alert',
        workflowId: 'wf-perf',
        from: 'Urban Brew Coffee',
        fromRole: 'Retainer client · Sharjah · Meta + Google',
        excerpt:
          'Daily digest: return on ad spend fell from 2.9× to 1.8×, cost per thousand impressions up 41%, frequency at 6.2. The client has already asked if something is wrong.',
        value: '$7,700 / month spend',
        place: { city: 'Sharjah', lon: 55.39, lat: 25.36 },
      },
      {
        id: 'sig-reports',
        index: '03',
        kind: 'Monday client reports',
        headline: '12 accounts · due 09:00',
        time: 'Scheduled',
        source: 'drive',
        urgency: 'Scheduled',
        workflowId: 'wf-reports',
        from: 'Account management',
        fromRole: 'Recurring every Monday',
        excerpt:
          'Weekly performance reports for every retainer client, compiled from ad exports, the delivery tracker and client emails. Usually takes the team half a day.',
        place: { city: 'Dubai', lon: 55.27, lat: 25.2 },
      },
    ],
    accounts: [
      { name: 'Kinetic Fitness', city: 'Abu Dhabi', lon: 54.37, lat: 24.47, detail: 'Paid social · healthy' },
      { name: 'Saffron Air', city: 'Al Ain', lon: 55.76, lat: 24.21, detail: 'Search + web · healthy' },
      { name: 'Coastline Resorts', city: 'Fujairah', lon: 56.34, lat: 25.13, detail: 'Content + SEO · healthy' },
      { name: 'Velo EV', city: 'Ras Al Khaimah', lon: 55.94, lat: 25.79, detail: 'Launch campaign · healthy' },
      { name: 'Handloom Co.', city: 'Ajman', lon: 55.51, lat: 25.41, detail: 'Shopify + Meta · healthy' },
      { name: 'Pinkcity Jewels', city: 'Umm Al Quwain', lon: 55.55, lat: 25.56, detail: 'Influencer · healthy' },
      { name: 'Tealeaf Finance', city: 'Dubai Marina', lon: 55.14, lat: 25.08, detail: 'LinkedIn B2B · healthy' },
      { name: 'Mountain Crate', city: 'Khor Fakkan', lon: 56.35, lat: 25.34, detail: 'D2C · healthy' },
      { name: 'Indie Books', city: 'Dibba', lon: 56.26, lat: 25.62, detail: 'Social · healthy' },
      { name: 'Malwa Foods', city: 'Madinat Zayed', lon: 53.65, lat: 23.65, detail: 'Search · healthy' },
      { name: 'Deccan Dental', city: 'Ruwais', lon: 52.73, lat: 24.11, detail: 'Local SEO · healthy' },
    ],
    intents: [
      { id: 'attention', label: 'What needs my attention?', hint: 'Composed briefing across all tools', action: { type: 'briefing' } },
      { id: 'brief', label: 'Respond to the Lumière Skin brief', hint: 'Proposal, reply, CRM record, kickoff plan', action: { type: 'run', signalId: 'sig-brief' } },
      { id: 'perf', label: 'Fix Urban Brew performance', hint: 'Diagnose, rebalance budget, update the client', action: { type: 'run', signalId: 'sig-perf' } },
      { id: 'reports', label: "Prepare Monday's client reports", hint: '12 accounts, summary email, action items', action: { type: 'run', signalId: 'sig-reports' } },
    ],
    briefing: [
      'Good morning. Three things need you before 09:00.',
      '01  Lumière Skin sent a $48,000 launch brief. A tailored proposal can be ready in about 40 seconds.',
      '02  Urban Brew’s Meta ROAS fell 38% overnight. Creative fatigue is likely; $250 a day is at risk.',
      '03  Monday client reports are due at 09:00 for 12 accounts.',
      'Overnight I triaged 57 emails, synced 12 ad accounts and found nothing else urgent.',
    ],
    morning: {
      label: 'Before 9:00 AM',
      lines: [
        ['06:12', 'Lumière Skin brief → proposal, reply, CRM record, kickoff plan'],
        ['06:31', 'Urban Brew ROAS drop → diagnosis, budget shift, client update'],
        ['08:47', 'Monday reports → 12 accounts, leadership summary, actions'],
      ],
    },
  },

  realestate: {
    signals: [
      {
        id: 'sig-enquiry',
        index: '01',
        kind: 'New inbound enquiry',
        headline: 'High-value prospect',
        time: '6:12 AM',
        source: 'gmail',
        urgency: 'High',
        workflowId: 'wf-enquiry',
        from: 'Rahul Mehta',
        fromRole: 'Managing Director, Mehta Capital · Bengaluru',
        excerpt:
          'We are looking for a four-bedroom, sea-facing residence at The Aurelia. Ideally a high floor, possession by late 2027. Could you share options and pricing this week?',
        value: '₹7–7.5 Cr',
        place: { city: 'Bengaluru', lon: 77.59, lat: 12.97 },
      },
      {
        id: 'sig-stalled',
        index: '02',
        kind: 'Stalled opportunity',
        headline: 'Follow-up required',
        time: '11 days idle',
        source: 'notion',
        urgency: 'Medium',
        workflowId: 'wf-stalled',
        from: 'Priya & Arjun Nair',
        fromRole: 'Site visit on 16 Sep · Pune',
        excerpt:
          'Visited Tower A with their two children. Loved the clubhouse, hesitated on the payment schedule. No reply to the brochure sent afterwards.',
        value: '₹5.4 Cr',
        place: { city: 'Pune', lon: 73.86, lat: 18.52 },
      },
      {
        id: 'sig-report',
        index: '03',
        kind: 'Weekly leadership report',
        headline: 'Monday 09:00',
        time: 'Scheduled',
        source: 'drive',
        urgency: 'Scheduled',
        workflowId: 'wf-report',
        from: 'Leadership team',
        fromRole: 'Recurring every Monday',
        excerpt:
          'Sales, marketing and site progress for the week, compiled from the inbox, the inventory sheet and the CRM. Usually takes half a day.',
        place: { city: 'Mumbai', lon: 72.82, lat: 19.0 },
      },
    ],
    accounts: [
      { name: 'NRI desk', city: 'Delhi', lon: 77.21, lat: 28.61, detail: '14 active buyers' },
      { name: 'Channel partner', city: 'Hyderabad', lon: 78.49, lat: 17.39, detail: '6 referrals this month' },
      { name: 'Buyer cluster', city: 'Ahmedabad', lon: 72.57, lat: 23.02, detail: '9 enquiries' },
      { name: 'Buyer cluster', city: 'Kolkata', lon: 88.36, lat: 22.57, detail: '4 enquiries' },
      { name: 'Channel partner', city: 'Chennai', lon: 80.27, lat: 13.08, detail: '3 referrals' },
      { name: 'Buyer cluster', city: 'Jaipur', lon: 75.79, lat: 26.91, detail: '5 enquiries' },
      { name: 'Buyer cluster', city: 'Indore', lon: 75.86, lat: 22.72, detail: '3 enquiries' },
      { name: 'Buyer cluster', city: 'Kochi', lon: 76.27, lat: 9.93, detail: '2 enquiries' },
    ],
    intents: [
      { id: 'attention', label: 'What needs my attention?', hint: 'Composed briefing across all tools', action: { type: 'briefing' } },
      { id: 'enquiry', label: 'Respond to Rahul Mehta', hint: 'Proposal, reply, lead record, follow-up', action: { type: 'run', signalId: 'sig-enquiry' } },
      { id: 'stalled', label: 'Re-engage the Nair family', hint: 'Personal follow-up and recommendation', action: { type: 'run', signalId: 'sig-stalled' } },
      { id: 'report', label: "Prepare Monday's leadership report", hint: 'Sales, pipeline, demand, decisions', action: { type: 'run', signalId: 'sig-report' } },
    ],
    briefing: [
      'Good morning. Three things need you before 09:00.',
      '01  Rahul Mehta enquired about a ₹7–7.5 Cr sea-facing residence. A proposal can be ready in about 40 seconds.',
      '02  The Nair family has gone quiet for 11 days after their site visit. The new 20:80 plan answers their objection.',
      '03  The weekly leadership report is due at 09:00.',
      'Overnight I triaged 42 emails and synced 118 live units.',
    ],
    morning: {
      label: 'Before 9:00 AM',
      lines: [
        ['06:12', 'Rahul Mehta enquiry → proposal, reply, lead record, follow-up'],
        ['06:34', 'Nair family → personal follow-up, plan, recommendation'],
        ['08:47', 'Leadership report → report, summary, action items'],
      ],
    },
  },
});

export const signals = pack.signals;
export const accounts = pack.accounts;
export const intents = pack.intents;
export const briefing = pack.briefing;
export const morning = pack.morning;

export const signalById = Object.fromEntries(signals.map((s) => [s.id, s])) as Record<string, Signal>;
