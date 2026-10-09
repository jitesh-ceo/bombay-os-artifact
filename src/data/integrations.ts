import { pick, type PresetId } from './prospect';

export type IntegrationId =
  | 'gmail'
  | 'drive'
  | 'notion'
  | 'calendar'
  | 'metaads'
  | 'googleads'
  | 'ga4'
  | 'hubspot'
  | 'slack'
  | 'jira'
  | 'figma'
  | 'linkedin'
  | 'shopify'
  | 'whatsapp'
  | 'salesforce'
  | 'sheets'
  | 'zoho'
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'capcut';

export type IntegrationStatus = 'connected' | 'available' | 'accessRequired' | 'pending' | 'connecting';

export interface IntegrationDef {
  id: IntegrationId;
  name: string;
  category: string;
  description: string;
  initialStatus: IntegrationStatus;
  capabilities: string[];
  stats?: string;
  accessOwner?: string;
}

type CatalogueEntry = Omit<IntegrationDef, 'initialStatus'>;

const catalogue: Record<IntegrationId, CatalogueEntry> = {
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    category: 'Communication',
    description: 'Briefs, client threads, platform alerts and outbound replies.',
    capabilities: ['Read incoming briefs and alerts', 'Understand full client history', 'Draft replies for approval'],
    stats: '12,480 emails indexed · synced 1m ago',
  },
  drive: {
    id: 'drive',
    name: 'Google Drive',
    category: 'Documents',
    description: 'Rate cards, case studies, reports and proposals.',
    capabilities: ['Read rate cards and case studies', 'Generate proposals from templates', 'File finished documents'],
    stats: '2,316 files indexed · synced 3m ago',
  },
  notion: {
    id: 'notion',
    name: 'Notion',
    category: 'Knowledge & CRM',
    description: 'Client records, playbooks, capacity and team tasks.',
    capabilities: ['Read client preferences and playbooks', 'Check team capacity', 'Create and update records'],
    stats: '864 pages indexed · synced 2m ago',
  },
  calendar: {
    id: 'calendar',
    name: 'Google Calendar',
    category: 'Scheduling',
    description: 'Meetings, kickoffs and availability.',
    capabilities: ['Read upcoming meetings', 'Check availability', 'Create follow-up tasks'],
    accessOwner: 'Workspace admin',
  },
  metaads: {
    id: 'metaads',
    name: 'Meta Ads',
    category: 'Advertising',
    description: 'Facebook and Instagram campaigns across client accounts.',
    capabilities: ['Read live campaign performance', 'Detect fatigue and anomalies', 'Propose budget shifts for approval'],
    accessOwner: 'Business Manager admin',
  },
  googleads: {
    id: 'googleads',
    name: 'Google Ads',
    category: 'Advertising',
    description: 'Search, Performance Max and YouTube campaigns.',
    capabilities: ['Read search performance', 'Rebalance budgets within limits', 'Flag wasted spend'],
  },
  ga4: {
    id: 'ga4',
    name: 'Google Analytics 4',
    category: 'Analytics',
    description: 'Site traffic, conversions and attribution.',
    capabilities: ['Read conversion data', 'Attribute results to channels', 'Build weekly reports'],
  },
  hubspot: {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    description: 'Contacts, deals and pipeline.',
    capabilities: ['Sync deals and contacts', 'Score inbound leads', 'Trigger nurture sequences'],
  },
  slack: {
    id: 'slack',
    name: 'Slack',
    category: 'Team',
    description: 'Internal alerts and approvals.',
    capabilities: ['Notify the right team', 'Request approvals in-channel', 'Post daily summaries'],
  },
  jira: {
    id: 'jira',
    name: 'Jira',
    category: 'Delivery',
    description: 'Creative and development tickets.',
    capabilities: ['Create tickets from briefs', 'Track delivery status', 'Flag blocked work'],
  },
  figma: {
    id: 'figma',
    name: 'Figma',
    category: 'Design',
    description: 'Creative files and brand assets.',
    capabilities: ['Find approved brand assets', 'Attach designs to proposals', 'Track creative versions'],
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn Ads',
    category: 'Advertising',
    description: 'B2B campaigns and lead forms.',
    capabilities: ['Read campaign results', 'Sync lead-form leads', 'Report cost per lead'],
  },
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    category: 'Commerce',
    description: 'Client store orders and revenue.',
    capabilities: ['Read orders and revenue', 'Tie ad spend to sales', 'Spot stock-outs before campaigns'],
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'Messaging',
    description: 'Client conversations on WhatsApp.',
    capabilities: ['Send approved follow-ups', 'Share documents and updates', 'Log conversations to CRM'],
  },
  salesforce: {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    description: 'Enterprise account records.',
    capabilities: ['Read account history', 'Update opportunity stages', 'Log activities automatically'],
    accessOwner: 'Salesforce admin',
  },
  sheets: {
    id: 'sheets',
    name: 'Google Sheets',
    category: 'Data',
    description: 'Trackers, forecasts and MIS sheets.',
    capabilities: ['Read trackers', 'Update forecasts', 'Build weekly MIS'],
  },
  zoho: {
    id: 'zoho',
    name: 'Zoho Books',
    category: 'Finance',
    description: 'Invoices, receipts and collections.',
    capabilities: ['Track retainer payments', 'Flag overdue invoices', 'Prepare payment reminders'],
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube Studio',
    category: 'Channel',
    description: 'Channel analytics, audience, Shorts and scheduled uploads.',
    capabilities: ['Read views, retention and audience', 'Benchmark Shorts and long-form', 'Schedule uploads for approval'],
    stats: '412K subscribers · 640 videos indexed · synced 2m ago',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    category: 'Channel',
    description: 'Reels insights, comments, DMs and drafts.',
    capabilities: ['Read Reel insights and comments', 'Draft captions and pinned comments', 'Spot viral moments early'],
    stats: '318K followers · 1,240 posts indexed · synced 1m ago',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    category: 'Channel',
    description: 'Video analytics, trending sounds and comments.',
    capabilities: ['Read video analytics', 'Track trending sounds in your niche', 'Draft captions for approval'],
    accessOwner: 'Account owner',
  },
  capcut: {
    id: 'capcut',
    name: 'CapCut',
    category: 'Editing',
    description: 'Edit projects, templates and export queues.',
    capabilities: ['Read edit status', 'Prepare Shorts re-cuts', 'Hand projects to the editor'],
  },
};

const lineup = pick<[IntegrationId, IntegrationStatus][]>({
  creator: [
    ['gmail', 'connected'],
    ['youtube', 'connected'],
    ['instagram', 'connected'],
    ['drive', 'connected'],
    ['notion', 'connected'],
    ['tiktok', 'accessRequired'],
    ['calendar', 'accessRequired'],
    ['capcut', 'available'],
    ['figma', 'available'],
    ['slack', 'available'],
    ['shopify', 'available'],
    ['whatsapp', 'available'],
  ],
  studio: [
    ['gmail', 'connected'],
    ['drive', 'connected'],
    ['notion', 'connected'],
    ['metaads', 'accessRequired'],
    ['calendar', 'accessRequired'],
    ['googleads', 'available'],
    ['ga4', 'available'],
    ['hubspot', 'available'],
    ['slack', 'available'],
    ['jira', 'available'],
    ['figma', 'available'],
    ['linkedin', 'available'],
    ['shopify', 'available'],
    ['zoho', 'available'],
  ],
  realestate: [
    ['gmail', 'connected'],
    ['drive', 'connected'],
    ['notion', 'connected'],
    ['calendar', 'accessRequired'],
    ['whatsapp', 'available'],
    ['hubspot', 'available'],
    ['slack', 'available'],
    ['salesforce', 'accessRequired'],
    ['sheets', 'available'],
    ['zoho', 'available'],
  ],
});

export const integrations: IntegrationDef[] = lineup.map(([id, initialStatus]) => ({ ...catalogue[id], initialStatus }));

export const integrationById = catalogue as Record<IntegrationId, CatalogueEntry>;

// Restricted resources inside a connected tool. Used for the blocked-workflow moment.
export interface RestrictedResource {
  id: string;
  integrationId: IntegrationId;
  path: string;
  owner: string;
  reason: string;
  capabilities: string[];
}

export const restrictedByPreset: Record<PresetId, Record<string, RestrictedResource>> = {
  creator: {
    'drive-rates': {
      id: 'drive-rates',
      integrationId: 'drive' as IntegrationId,
      path: 'Shared / Management / Brand Rates 2026',
      owner: 'Sara Mansour',
      reason: 'The rate card and past deal terms live in management’s restricted folder.',
      capabilities: ['Read the 2026 rate card', 'Compare past deal terms', 'Verify quoted figures'],
    },
  },
  studio: {
    'drive-finance': {
      id: 'drive-finance',
      integrationId: 'drive' as IntegrationId,
      path: 'Shared / Finance / Retainer Pricing FY26',
      owner: 'Finance team',
      reason: 'Retainer and media-fee pricing lives in a restricted shared folder.',
      capabilities: ['Read current retainer pricing', 'Apply approved discounts', 'Verify quoted figures'],
    },
  },
  realestate: {
    'drive-finance': {
      id: 'drive-finance',
      integrationId: 'drive' as IntegrationId,
      path: 'Shared / Finance / Unit Pricing FY26',
      owner: 'Finance team',
      reason: 'Unit-level pricing lives in a restricted shared folder.',
      capabilities: ['Read unit-level prices', 'Apply current offers and waivers', 'Verify quoted figures'],
    },
  },
};

export const restrictedResources: Record<string, RestrictedResource> = pick(restrictedByPreset);
