import type { IntegrationId } from './integrations';
import { pick } from './prospect';

export type StageId = 'understand' | 'decide' | 'execute' | 'verify' | 'deliver';

export const STAGES: { id: StageId; label: string; title: string; explain: string }[] = [
  {
    id: 'understand',
    label: 'Understand',
    title: 'Understand',
    explain: 'Bombay OS is gathering the information required to make a decision.',
  },
  {
    id: 'decide',
    label: 'Decide',
    title: 'Decide',
    explain: 'Relevant context has been converted into an execution plan.',
  },
  {
    id: 'execute',
    label: 'Execute',
    title: 'Execute',
    explain: 'Multiple business tasks are being handled in parallel.',
  },
  {
    id: 'verify',
    label: 'Verify',
    title: 'Verify',
    explain: 'Outputs are checked against the original source of truth.',
  },
  {
    id: 'deliver',
    label: 'Deliver',
    title: 'Deliver',
    explain: 'Completed work is ready for approval.',
  },
];

export interface Fact {
  source: IntegrationId;
  label: string;
  value: string;
  ref: string;
}

export interface PlanStep {
  title: string;
  detail: string;
  sources: IntegrationId[];
}

export interface Lane {
  id: string;
  title: string;
  tool: IntegrationId;
  outputIds: string[];
  steps: string[];
  // Lines of the work-in-progress preview. `{{token}}` values come from `corrections`.
  preview: string[];
  // Preview line index that is being verified (highlighted during VERIFY).
  watchLine?: number;
}

export interface Check {
  id: string;
  label: string;
  against: string;
  source: IntegrationId;
  flag?: {
    field: string;
    generated: string;
    verified: string;
    reason: string;
    // Which `{{token}}` in the primary document this check corrects, and how it is labelled there.
    token: string;
    lineLabel: string;
    ledger: { detected: string; verified: string; corrected: string };
  };
}

export interface Workflow {
  id: string;
  signalId: string;
  runLabel: string;
  sources: IntegrationId[];
  brief: {
    goal: string;
    estimate: string;
    manual: string;
  };
  facts: Fact[];
  plan: PlanStep[];
  lanes: Lane[];
  block?: { resourceId: string; laneId: string; afterLaneEvent: number; need: string };
  checks: Check[];
  outputs: string[];
  primaryOutput: string;
  corrections: Record<string, { generated: string; verified: string }>;
  impact: { hours: number; pipelineLakhs: number; tasks: number };
  approvalLedger: { text: string; source?: IntegrationId }[];
  completion: string[];
  // The same job done by hand, in minutes. Drives the "Without Bombay OS" race.
  manual: [string, number][];
}

const realestate: Record<string, Workflow> = {
  'wf-enquiry': {
    id: 'wf-enquiry',
    signalId: 'sig-enquiry',
    runLabel: 'Respond to Rahul Mehta',
    sources: ['gmail', 'drive', 'notion'],
    brief: {
      goal: 'Qualify the enquiry and send a tailored proposal within the 2-hour playbook window.',
      estimate: '~40 seconds',
      manual: '3–4 hours manually',
    },
    facts: [
      {
        source: 'gmail',
        label: 'New enquiry from Rahul Mehta',
        value: '4BHK, sea-facing, high floor · budget ₹7–7.5 Cr · possession by late 2027',
        ref: 'Inbox · 06:12 AM',
      },
      {
        source: 'gmail',
        label: 'Earlier conversation found',
        value: 'Attended the Aurelia preview evening in March; asked about private decks',
        ref: 'Thread · 6 messages',
      },
      {
        source: 'drive',
        label: 'Rate Card FY26',
        value: 'Tower B base rate ₹32,000 / sq ft · pre-launch waivers apply',
        ref: 'Sales / Rate Card FY26.pdf · p.2',
      },
      {
        source: 'drive',
        label: 'Live inventory',
        value: '3 units match: B-2401, B-2601, B-2802',
        ref: 'Sales / Inventory_Live.xlsx',
      },
      {
        source: 'notion',
        label: 'Previous client preferences',
        value: 'West-facing, private deck, family of five, prefers Saturday visits',
        ref: 'CRM / Rahul Mehta',
      },
      {
        source: 'notion',
        label: 'HNI sales playbook',
        value: 'Reply within 2 hours with a tailored proposal and a site-visit offer',
        ref: 'Playbooks / HNI enquiries',
      },
    ],
    plan: [
      { title: 'Qualify enquiry', detail: 'Budget, timeline and intent meet HNI criteria', sources: ['gmail', 'notion'] },
      { title: 'Match requirements', detail: 'Shortlist units by floor, view, size and deck', sources: ['drive', 'notion'] },
      { title: 'Check pricing', detail: 'Apply Rate Card FY26 to the recommended unit', sources: ['drive'] },
      { title: 'Prepare proposal', detail: 'Tailored to his stated and past preferences', sources: ['drive', 'notion'] },
      { title: 'Draft response', detail: 'Personal reply inside the 2-hour window', sources: ['gmail'] },
      { title: 'Prepare follow-up', detail: 'Saturday site visit and a 3-touch sequence', sources: ['notion'] },
    ],
    lanes: [
      {
        id: 'proposal',
        title: 'Proposal',
        tool: 'drive',
        outputIds: ['proposal'],
        steps: ['Structuring document', 'Writing executive summary', 'Pricing Unit B-2601', 'Formatting for client'],
        preview: [
          'A residence at The Aurelia',
          'Prepared for Rahul Mehta',
          'Unit B-2601 · 4BHK · 2,095 sq ft',
          'Sea-facing · west · private deck',
          'Investment  {{price}}',
        ],
        watchLine: 4,
      },
      {
        id: 'email',
        title: 'Reply email',
        tool: 'gmail',
        outputIds: ['reply-email'],
        steps: ['Reading original enquiry', 'Matching his tone', 'Drafting response', 'Attaching proposal'],
        preview: [
          'Re: Residence enquiry — The Aurelia',
          'Dear Rahul,',
          'Thank you for thinking of us again…',
          'Three residences match your brief…',
          'Proposal attached · PDF',
        ],
      },
      {
        id: 'lead',
        title: 'Lead record',
        tool: 'notion',
        outputIds: ['lead-record', 'followup-plan'],
        steps: ['Creating record', 'Scoring lead · 92 / 100', 'Linking thread and files', 'Scheduling follow-up'],
        preview: [
          'Rahul Mehta · Mehta Capital',
          'Stage  Qualified',
          'Score  92 / 100',
          'Owner  Kavya Shah',
          'Next  Site visit · Sat 11:00',
        ],
      },
    ],
    block: {
      resourceId: 'drive-finance',
      laneId: 'proposal',
      afterLaneEvent: 5,
      need: 'Bombay OS needs the shared pricing folder to price Unit B-2601.',
    },
    checks: [
      { id: 'c-identity', label: 'Client name and requirements', against: 'Gmail / Original enquiry', source: 'gmail' },
      {
        id: 'c-pricing',
        label: 'Proposal pricing',
        against: 'Google Drive / Rate Card FY26',
        source: 'drive',
        flag: {
          field: 'Total investment · Unit B-2601',
          generated: '₹7,18,50,000',
          verified: '₹7,12,40,000',
          reason: 'Draft applied the standard floor-rise charge. Rate Card FY26 waives it for pre-launch Tower B bookings.',
          token: 'price',
          lineLabel: 'Investment',
          ledger: {
            detected: 'Pricing discrepancy detected',
            verified: 'Source verified · Rate Card FY26',
            corrected: 'Proposal corrected · ₹7,12,40,000',
          },
        },
      },
      { id: 'c-inventory', label: 'Unit B-2601 availability', against: 'Google Drive / Inventory_Live', source: 'drive' },
      { id: 'c-playbook', label: 'Tone and commitments', against: 'Notion / HNI playbook', source: 'notion' },
    ],
    outputs: ['proposal', 'reply-email', 'lead-record', 'followup-plan'],
    primaryOutput: 'proposal',
    corrections: {
      price: { generated: '₹7,18,50,000', verified: '₹7,12,40,000' },
      floorRise: { generated: '₹6,10,000', verified: 'Waived · pre-launch' },
    },
    impact: { hours: 3.5, pipelineLakhs: 712.4, tasks: 4 },
    approvalLedger: [
      { text: 'Proposal approved by Kavya Shah' },
      { text: 'Reply sent to Rahul Mehta with proposal', source: 'gmail' },
      { text: 'Proposal filed · Clients / Mehta', source: 'drive' },
      { text: 'Lead updated · Qualified, score 92', source: 'notion' },
      { text: 'Follow-up scheduled · Site visit Sat 11:00', source: 'notion' },
    ],
    completion: ['Proposal approved', 'Email sent', 'Lead updated', 'Follow-up scheduled'],
    manual: [
      ['Read enquiry and history', 20],
      ['Find rate card and inventory', 15],
      ['Shortlist units', 25],
      ['Draft proposal', 90],
      ['Write reply email', 20],
      ['Update CRM and follow-up', 20],
    ],
  },

  'wf-stalled': {
    id: 'wf-stalled',
    signalId: 'sig-stalled',
    runLabel: 'Re-engage the Nair family',
    sources: ['gmail', 'drive', 'notion'],
    brief: {
      goal: 'Understand why the deal stalled and prepare a personal, well-timed re-engagement.',
      estimate: '~30 seconds',
      manual: '1–2 hours manually',
    },
    facts: [
      { source: 'notion', label: 'Deal record', value: 'Tower A · 3BHK · ₹5.4 Cr · stage: Site visit done', ref: 'CRM / Nair family' },
      { source: 'notion', label: 'Visit notes', value: 'Loved the clubhouse; hesitated on the payment schedule', ref: 'CRM / Visit 16 Sep' },
      { source: 'gmail', label: 'Last outbound email', value: 'Generic brochure sent 15 Sep · opened twice, no reply', ref: 'Sent · 15 Sep' },
      { source: 'drive', label: 'Flexible payment plan', value: '20:80 plan approved for Tower A this month', ref: 'Sales / Offers_Sep.pdf' },
    ],
    plan: [
      { title: 'Diagnose the stall', detail: 'Payment schedule was the objection', sources: ['notion'] },
      { title: 'Find a relevant answer', detail: 'New 20:80 plan addresses it directly', sources: ['drive'] },
      { title: 'Draft personal follow-up', detail: 'Reference the visit, not a brochure', sources: ['gmail'] },
      { title: 'Recommend next action', detail: 'Call from the sales head this week', sources: ['notion'] },
    ],
    lanes: [
      {
        id: 'email',
        title: 'Follow-up email',
        tool: 'gmail',
        outputIds: ['nair-email'],
        steps: ['Recalling visit details', 'Addressing the objection', 'Drafting message'],
        preview: ['Re: Your visit to The Aurelia', 'Dear Priya and Arjun,', 'A payment plan that fits…', 'Suggested call: Thu 6 PM'],
      },
      {
        id: 'plan',
        title: 'Re-engagement plan',
        tool: 'notion',
        outputIds: ['reengage-plan', 'deal-rec'],
        steps: ['Sequencing touches', 'Writing recommendation', 'Updating deal'],
        preview: ['Day 0  Personal email', 'Day 2  Call from Kavya', 'Day 5  Private clubhouse visit', 'Risk  Medium → Low'],
      },
    ],
    checks: [
      { id: 'c-offer', label: 'Payment plan terms', against: 'Google Drive / Offers_Sep', source: 'drive' },
      { id: 'c-history', label: 'Visit details referenced', against: 'Notion / Visit notes', source: 'notion' },
      { id: 'c-tone', label: 'No repeated brochure', against: 'Gmail / Sent history', source: 'gmail' },
    ],
    outputs: ['nair-email', 'reengage-plan', 'deal-rec'],
    primaryOutput: 'nair-email',
    corrections: {},
    impact: { hours: 2, pipelineLakhs: 540, tasks: 3 },
    approvalLedger: [
      { text: 'Follow-up approved by Kavya Shah' },
      { text: 'Email sent to Priya & Arjun Nair', source: 'gmail' },
      { text: 'Deal updated · Re-engaged', source: 'notion' },
    ],
    completion: ['Follow-up sent', 'Plan scheduled', 'Deal re-engaged'],
    manual: [
      ['Review deal history', 20],
      ['Find a relevant offer', 20],
      ['Write personal follow-up', 25],
      ['Plan next steps', 15],
    ],
  },

  'wf-report': {
    id: 'wf-report',
    signalId: 'sig-report',
    runLabel: 'Compile leadership report',
    sources: ['gmail', 'drive', 'notion'],
    brief: {
      goal: 'Compile the weekly leadership report and a summary for the founders.',
      estimate: '~30 seconds',
      manual: 'half a day manually',
    },
    facts: [
      { source: 'drive', label: 'Inventory movement', value: '9 units booked this week · 118 remain', ref: 'Sales / Inventory_Live.xlsx' },
      { source: 'notion', label: 'Pipeline', value: '26 active deals · ₹142 Cr weighted', ref: 'CRM / Pipeline view' },
      { source: 'gmail', label: 'Enquiry volume', value: '64 enquiries · 41% from referrals', ref: 'Inbox · last 7 days' },
      { source: 'drive', label: 'Site progress', value: 'Tower B slab 27 complete · on schedule', ref: 'Projects / Site_Weekly.pdf' },
    ],
    plan: [
      { title: 'Summarise sales', detail: 'Bookings, value and velocity', sources: ['drive'] },
      { title: 'Summarise pipeline', detail: 'Movement and risks', sources: ['notion'] },
      { title: 'Summarise demand', detail: 'Enquiries by channel', sources: ['gmail'] },
      { title: 'Highlight decisions needed', detail: 'Two items for leadership', sources: ['notion', 'drive'] },
    ],
    lanes: [
      {
        id: 'report',
        title: 'Leadership report',
        tool: 'drive',
        outputIds: ['weekly-report'],
        steps: ['Pulling figures', 'Writing commentary', 'Formatting report'],
        preview: ['Week 39 · Leadership report', 'Bookings  9 units · ₹58.6 Cr', 'Pipeline  ₹142 Cr weighted', 'Decisions  2 needed'],
      },
      {
        id: 'actions',
        title: 'Action items',
        tool: 'notion',
        outputIds: ['action-items', 'leadership-email'],
        steps: ['Extracting decisions', 'Assigning owners', 'Drafting summary email'],
        preview: ['Approve Tower C launch date', 'Review referral incentive', 'Owners assigned · 4', 'Summary email drafted'],
      },
    ],
    checks: [
      { id: 'c-figures', label: 'Booking figures', against: 'Google Drive / Inventory_Live', source: 'drive' },
      { id: 'c-pipe', label: 'Pipeline totals', against: 'Notion / Pipeline view', source: 'notion' },
      { id: 'c-demand', label: 'Enquiry counts', against: 'Gmail / Inbox', source: 'gmail' },
    ],
    outputs: ['weekly-report', 'leadership-email', 'action-items'],
    primaryOutput: 'weekly-report',
    corrections: {},
    impact: { hours: 4, pipelineLakhs: 0, tasks: 3 },
    approvalLedger: [
      { text: 'Report approved by Kavya Shah' },
      { text: 'Summary emailed to leadership', source: 'gmail' },
      { text: 'Action items created · 4 owners', source: 'notion' },
    ],
    completion: ['Report approved', 'Summary sent', 'Actions assigned'],
    manual: [
      ['Pull sales and inventory', 45],
      ['Compile pipeline', 40],
      ['Write commentary', 45],
      ['Actions and summary', 30],
    ],
  },
};

const agency: Record<string, Workflow> = {
  'wf-brief': {
    id: 'wf-brief',
    signalId: 'sig-brief',
    runLabel: 'Respond to Lumière Skin',
    sources: ['gmail', 'drive', 'notion'],
    brief: {
      goal: 'Qualify the brief and send a tailored proposal the same morning, before competing agencies reply.',
      estimate: '~40 seconds',
      manual: '3–4 hours manually',
    },
    facts: [
      {
        source: 'gmail',
        label: 'New brief from Ananya Rao',
        value: 'D2C skincare launch in November · performance, social and a landing page · ~$48,000 / quarter',
        ref: 'Inbox · 06:12 AM',
      },
      {
        source: 'gmail',
        label: 'Earlier conversation found',
        value: 'Met Meera at the D2C Summit in August; asked about influencer-led launches',
        ref: 'Thread · 4 messages',
      },
      {
        source: 'drive',
        label: 'Rate Card FY26',
        value: 'Growth retainer $3,850 / month · landing page $5,400 · media fee 10%',
        ref: 'Finance / Rate Card FY26.pdf · p.3',
      },
      {
        source: 'drive',
        label: 'Closest case study',
        value: 'Glow & Co · D2C skincare launch · 3.1× ROAS in 90 days',
        ref: 'Case studies / GlowCo_Launch.pdf',
      },
      {
        source: 'notion',
        label: 'Team capacity',
        value: 'Pod B frees up on 1 Nov · 1 strategist, 2 performance, 1 designer',
        ref: 'Ops / Capacity board',
      },
      {
        source: 'notion',
        label: 'D2C launch playbook',
        value: 'Reply the same day with a 90-day plan, proof and a kickoff slot',
        ref: 'Playbooks / New business',
      },
    ],
    plan: [
      { title: 'Qualify the brief', detail: 'Budget, category and timing fit our D2C practice', sources: ['gmail', 'notion'] },
      { title: 'Shape the scope', detail: 'Performance, social and a launch landing page', sources: ['gmail', 'drive'] },
      { title: 'Price the retainer', detail: 'Apply Rate Card FY26 for a 3-month launch', sources: ['drive'] },
      { title: 'Add proof', detail: 'Glow & Co results from a comparable launch', sources: ['drive'] },
      { title: 'Draft the reply', detail: 'Personal, same-morning, references the Summit', sources: ['gmail'] },
      { title: 'Plan the kickoff', detail: 'Pod B from 1 Nov, discovery call this week', sources: ['notion'] },
    ],
    lanes: [
      {
        id: 'proposal',
        title: 'Proposal',
        tool: 'drive',
        outputIds: ['proposal'],
        steps: ['Structuring scope', 'Writing 90-day plan', 'Pricing the retainer', 'Adding case-study proof'],
        preview: [
          'Launch growth proposal',
          'Prepared for Lumière Skin',
          'Performance · Social · Landing page',
          'Fees  $23,450 · 3 months',
          'Expected ROAS  {{roas}}',
        ],
        watchLine: 4,
      },
      {
        id: 'email',
        title: 'Reply email',
        tool: 'gmail',
        outputIds: ['reply-email'],
        steps: ['Reading the brief', 'Matching her tone', 'Drafting response', 'Attaching proposal'],
        preview: [
          'Re: Launch partner for Lumière Skin',
          'Hi Ananya,',
          'Lovely to hear from you after the Summit…',
          'Our 90-day launch plan is attached…',
          'Proposal attached · PDF',
        ],
      },
      {
        id: 'lead',
        title: 'CRM & kickoff',
        tool: 'notion',
        outputIds: ['lead-record', 'kickoff-plan'],
        steps: ['Creating client record', 'Scoring lead · 88 / 100', 'Linking thread and files', 'Reserving Pod B'],
        preview: [
          'Lumière Skin · Ananya Rao',
          'Stage  Proposal sent',
          'Score  88 / 100',
          'Owner  Meera Kapoor',
          'Next  Discovery call · Thu 11:00',
        ],
      },
    ],
    block: {
      resourceId: 'drive-finance',
      laneId: 'proposal',
      afterLaneEvent: 5,
      need: 'Bombay OS needs the finance folder to price the retainer and media fees.',
    },
    checks: [
      { id: 'c-identity', label: 'Client name and brief', against: 'Gmail / Original brief', source: 'gmail' },
      {
        id: 'c-roas',
        label: 'Performance claim',
        against: 'Google Drive / Glow & Co case study',
        source: 'drive',
        flag: {
          field: 'Expected ROAS · first 90 days',
          generated: '4.2×',
          verified: '3.1×',
          reason:
            'The draft promised 4.2× ROAS. The closest case study, Glow & Co, delivered 3.1× in 90 days. Bombay OS never promises more than the evidence supports.',
          token: 'roas',
          lineLabel: 'Expected ROAS',
          ledger: {
            detected: 'Unsupported ROAS claim detected',
            verified: 'Source verified · Glow & Co case study',
            corrected: 'Proposal corrected · 3.1× ROAS',
          },
        },
      },
      { id: 'c-pricing', label: 'Retainer pricing', against: 'Google Drive / Rate Card FY26', source: 'drive' },
      { id: 'c-capacity', label: 'Team available from 1 Nov', against: 'Notion / Capacity board', source: 'notion' },
    ],
    outputs: ['proposal', 'reply-email', 'lead-record', 'kickoff-plan'],
    primaryOutput: 'proposal',
    corrections: {
      roas: { generated: '4.2×', verified: '3.1×' },
    },
    impact: { hours: 3.5, pipelineLakhs: 19.5, tasks: 4 },
    approvalLedger: [
      { text: 'Proposal approved by Meera Kapoor' },
      { text: 'Reply sent to Ananya Rao with proposal', source: 'gmail' },
      { text: 'Proposal filed · Clients / Lumière Skin', source: 'drive' },
      { text: 'Client record created · score 88', source: 'notion' },
      { text: 'Discovery call proposed · Thu 11:00', source: 'notion' },
    ],
    completion: ['Proposal approved', 'Reply sent', 'Client record created', 'Kickoff planned'],
    manual: [
      ['Read brief and history', 20],
      ['Find rate card and case study', 15],
      ['Check team capacity', 15],
      ['Draft proposal', 90],
      ['Write reply email', 20],
      ['Update CRM, plan kickoff', 25],
    ],
  },

  'wf-perf': {
    id: 'wf-perf',
    signalId: 'sig-perf',
    runLabel: 'Fix Urban Brew performance',
    sources: ['gmail', 'drive', 'notion'],
    brief: {
      goal: 'Diagnose the drop, protect this week’s budget and reassure the client before they call.',
      estimate: '~30 seconds',
      manual: '2 hours manually',
    },
    facts: [
      { source: 'gmail', label: 'Meta Ads daily digest', value: 'ROAS 2.9× → 1.8× · CPM +41% · frequency 6.2', ref: 'Alerts · 05:40 AM' },
      { source: 'gmail', label: 'Client message', value: 'Rohan: “Is something wrong with the ads this week?”', ref: 'Thread · 11:48 PM' },
      { source: 'drive', label: 'Creative library', value: 'Top 3 ads have run 34 days without a refresh', ref: 'Clients / Urban Brew / Creatives' },
      { source: 'notion', label: 'Account plan', value: 'Q4 target 2.5× blended ROAS · Search under-funded', ref: 'Accounts / Urban Brew' },
    ],
    plan: [
      { title: 'Diagnose the drop', detail: 'Creative fatigue, not tracking or pricing', sources: ['gmail', 'drive'] },
      { title: 'Protect the budget', detail: 'Shift 25% to Google Search within approved limits', sources: ['notion'] },
      { title: 'Brief fresh creatives', detail: '3 new concepts built from top performers', sources: ['drive'] },
      { title: 'Update the client', detail: 'Calm, clear explanation with the fix', sources: ['gmail'] },
    ],
    lanes: [
      {
        id: 'update',
        title: 'Client update',
        tool: 'gmail',
        outputIds: ['perf-email'],
        steps: ['Summarising what happened', 'Explaining the fix', 'Drafting message'],
        preview: ['Re: This week’s Meta performance', 'Hi Rohan,', 'Short version: the ads are tired…', 'Fix in motion · new creatives Thu'],
      },
      {
        id: 'plan',
        title: 'Optimisation plan',
        tool: 'notion',
        outputIds: ['perf-plan', 'creative-brief'],
        steps: ['Rebalancing budget', 'Writing creative brief', 'Creating tasks'],
        preview: ['Meta  −25% budget this week', 'Search  +25% · high-intent terms', 'Creatives  3 concepts · due Thu', 'Expected  back to 2.6× in 10 days'],
      },
    ],
    checks: [
      { id: 'c-digest', label: 'Figures match the digest', against: 'Gmail / Meta daily digest', source: 'gmail' },
      { id: 'c-limits', label: 'Budget shift within limits', against: 'Notion / Account plan', source: 'notion' },
      { id: 'c-creative', label: 'Creative age', against: 'Google Drive / Creative library', source: 'drive' },
    ],
    outputs: ['perf-email', 'perf-plan', 'creative-brief'],
    primaryOutput: 'perf-email',
    corrections: {},
    impact: { hours: 2, pipelineLakhs: 0, tasks: 3 },
    approvalLedger: [
      { text: 'Plan approved by Meera Kapoor' },
      { text: 'Update sent to Rohan at Urban Brew', source: 'gmail' },
      { text: 'Budget shift queued · +25% Search', source: 'notion' },
      { text: 'Creative brief assigned · due Thu', source: 'notion' },
    ],
    completion: ['Client updated', 'Budget rebalanced', 'Creatives briefed'],
    manual: [
      ['Pull and compare ad data', 30],
      ['Diagnose the cause', 30],
      ['Plan budget changes', 20],
      ['Write creative brief', 25],
      ['Write client update', 15],
    ],
  },

  'wf-reports': {
    id: 'wf-reports',
    signalId: 'sig-reports',
    runLabel: "Prepare Monday's client reports",
    sources: ['gmail', 'drive', 'notion'],
    brief: {
      goal: 'Build weekly reports for all 12 retainer clients, plus a summary and actions for leadership.',
      estimate: '~30 seconds',
      manual: 'half a day manually',
    },
    facts: [
      { source: 'drive', label: 'Ad performance export', value: '12 accounts · $101,000 spend · blended ROAS 3.4×', ref: 'Reports / Week 39 export.csv' },
      { source: 'notion', label: 'Delivery tracker', value: '41 of 44 tasks shipped · 3 slipped', ref: 'Ops / Delivery board' },
      { source: 'gmail', label: 'Client feedback', value: '3 approvals pending · 1 escalation from Saffron Air', ref: 'Inbox · last 7 days' },
      { source: 'drive', label: 'Retainer sheet', value: '2 renewals due in October', ref: 'Finance / Retainers.xlsx' },
    ],
    plan: [
      { title: 'Summarise performance', detail: 'Spend, ROAS and wins per account', sources: ['drive'] },
      { title: 'Summarise delivery', detail: 'Shipped, slipped and why', sources: ['notion'] },
      { title: 'Surface client risks', detail: 'Escalations and pending approvals', sources: ['gmail'] },
      { title: 'Recommend actions', detail: 'Owners and deadlines for this week', sources: ['notion', 'drive'] },
    ],
    lanes: [
      {
        id: 'report',
        title: 'Client reports',
        tool: 'drive',
        outputIds: ['weekly-report'],
        steps: ['Pulling figures per account', 'Writing commentary', 'Formatting 12 reports'],
        preview: ['Week 39 · Client performance', 'Spend  $101,000 across 12 accounts', 'Blended ROAS  3.4×', 'Risks  1 escalation, 2 renewals'],
      },
      {
        id: 'actions',
        title: 'Actions & summary',
        tool: 'notion',
        outputIds: ['action-items', 'leadership-email'],
        steps: ['Extracting decisions', 'Assigning owners', 'Drafting summary email'],
        preview: ['Call Saffron Air today', 'Prepare 2 renewal decks', 'Owners assigned · 5', 'Summary email drafted'],
      },
    ],
    checks: [
      { id: 'c-spend', label: 'Spend and ROAS figures', against: 'Google Drive / Week 39 export', source: 'drive' },
      { id: 'c-delivery', label: 'Delivery counts', against: 'Notion / Delivery board', source: 'notion' },
      { id: 'c-feedback', label: 'Client feedback', against: 'Gmail / Inbox', source: 'gmail' },
    ],
    outputs: ['weekly-report', 'leadership-email', 'action-items'],
    primaryOutput: 'weekly-report',
    corrections: {},
    impact: { hours: 4, pipelineLakhs: 0, tasks: 3 },
    approvalLedger: [
      { text: 'Reports approved by Meera Kapoor' },
      { text: '12 client reports shared', source: 'drive' },
      { text: 'Summary emailed to leadership', source: 'gmail' },
      { text: 'Actions created · 5 owners', source: 'notion' },
    ],
    completion: ['Reports shared', 'Summary sent', 'Actions assigned'],
    manual: [
      ['Export data per account', 60],
      ['Build 12 reports', 120],
      ['Write commentary', 45],
      ['Summary and actions', 30],
    ],
  },
};

export const workflows: Record<string, Workflow> = pick({ agency, realestate });

export const workflowForSignal = (signalId: string) =>
  Object.values(workflows).find((w) => w.signalId === signalId)!;
