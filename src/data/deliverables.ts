import type { IntegrationId } from './integrations';
import { pick } from './prospect';

// `{{token}}` in any string is replaced by the verified (or pre-verification) value
// from the workflow's `corrections`.
export type Block =
  | { t: 'h'; text: string; ref?: number }
  | { t: 'p'; text: string; ref?: number }
  | { t: 'lead'; text: string; ref?: number }
  | { t: 'list'; items: string[]; ref?: number }
  | { t: 'kv'; items: [string, string][]; ref?: number }
  | { t: 'table'; head: string[]; rows: string[][]; total?: [string, string]; ref?: number; watchToken?: string }
  | { t: 'steps'; items: [string, string][]; ref?: number };

export type DeliverableKind = 'proposal' | 'email' | 'record' | 'plan' | 'report' | 'recommendation' | 'tasks';

export interface Deliverable {
  id: string;
  kind: DeliverableKind;
  title: string;
  short: string;
  destination: IntegrationId;
  destinationLabel: string;
  approvedLabel: string;
  doc: {
    eyebrow: string;
    title: string;
    meta: [string, string][];
    blocks: Block[];
  };
  refs: { n: number; source: IntegrationId; label: string }[];
}

const realestate: Record<string, Deliverable> = {
  proposal: {
    id: 'proposal',
    kind: 'proposal',
    title: 'Residence Proposal',
    short: 'Proposal',
    destination: 'drive',
    destinationLabel: 'Drive · Clients / Mehta',
    approvedLabel: 'Sent with reply',
    doc: {
      eyebrow: 'Private & confidential · Proposal',
      title: 'A residence at The Aurelia, prepared for Rahul Mehta',
      meta: [
        ['Prepared for', 'Rahul Mehta, Mehta Capital'],
        ['Prepared by', 'Kavya Shah, Head of Sales'],
        ['Date', '27 September 2026'],
        ['Reference', 'AUR-B2601-0927'],
      ],
      blocks: [
        { t: 'h', text: 'Executive summary' },
        {
          t: 'lead',
          text: 'Thank you for your interest in The Aurelia. Based on your brief and our earlier conversation at the preview evening, we recommend Residence B-2601: a west-facing, sea-view four-bedroom home on the 26th floor of Tower B, with the private deck you asked about.',
          ref: 1,
        },
        { t: 'h', text: 'Your requirements' },
        {
          t: 'table',
          head: ['You asked for', 'Residence B-2601'],
          rows: [
            ['Four bedrooms', '4 bedrooms + study'],
            ['Sea-facing, high floor', 'Uninterrupted sea view · floor 26'],
            ['Private outdoor space', '310 sq ft private deck, west-facing'],
            ['Possession by late 2027', 'Scheduled for Q3 2027'],
            ['Room for a family of five', '2,095 sq ft carpet area'],
          ],
          ref: 2,
        },
        { t: 'h', text: 'Recommended solution' },
        {
          t: 'p',
          text: 'Residence B-2601 is one of three homes that match your brief. It offers the best sunset aspect and the largest deck in the stack. Two alternatives, B-2401 and B-2802, are held for you for seven days should you wish to compare.',
          ref: 4,
        },
        { t: 'h', text: 'Investment' },
        {
          t: 'table',
          head: ['Component', 'Amount'],
          rows: [
            ['Base price · 2,095 sq ft at ₹32,000', '₹6,70,40,000'],
            ['Floor-rise premium · floor 26', '{{floorRise}}'],
            ['Two covered car parks', '₹30,00,000'],
            ['Clubhouse and amenities', '₹12,00,000'],
          ],
          total: ['Total investment', '{{price}}'],
          ref: 3,
          watchToken: 'price',
        },
        { t: 'h', text: 'Timeline' },
        {
          t: 'steps',
          items: [
            ['This week', 'Private site visit, Saturday 11:00'],
            ['Within 7 days', 'Unit hold and booking at 10%'],
            ['Q4 2026', 'Agreement for sale and registration'],
            ['Q3 2027', 'Possession and handover'],
          ],
        },
        { t: 'h', text: 'Next steps' },
        {
          t: 'list',
          items: [
            'Confirm the Saturday 11:00 private visit (sea-view show residence is reserved for you).',
            'We will hold B-2601, B-2401 and B-2802 for seven days at no cost.',
            'Our team will share the draft agreement within 48 hours of booking.',
          ],
        },
      ],
    },
    refs: [
      { n: 1, source: 'gmail', label: 'Enquiry from Rahul Mehta · 06:12 AM' },
      { n: 2, source: 'notion', label: 'CRM / Rahul Mehta · preferences' },
      { n: 3, source: 'drive', label: 'Rate Card FY26 · p.2 (verified)' },
      { n: 4, source: 'drive', label: 'Inventory_Live.xlsx · Tower B' },
    ],
  },

  'reply-email': {
    id: 'reply-email',
    kind: 'email',
    title: 'Reply Email',
    short: 'Reply email',
    destination: 'gmail',
    destinationLabel: 'Gmail · Drafts',
    approvedLabel: 'Sent 06:14 AM',
    doc: {
      eyebrow: 'Email · ready to send',
      title: 'Re: Residence enquiry — The Aurelia',
      meta: [
        ['To', 'rahul@mehtacapital.in'],
        ['From', 'Kavya Shah'],
        ['Attachment', 'Aurelia_Proposal_B2601.pdf'],
      ],
      blocks: [
        { t: 'p', text: 'Dear Rahul,' },
        {
          t: 'p',
          text: 'Thank you for thinking of us again. It was lovely to meet you at the preview evening in March, and I remember your question about private decks.',
          ref: 1,
        },
        {
          t: 'p',
          text: 'Three residences match your brief. I would recommend B-2601: west-facing, sea view on the 26th floor, with a 310 sq ft private deck and possession in Q3 2027. The full proposal, including pricing, is attached.',
          ref: 2,
        },
        {
          t: 'p',
          text: 'Would Saturday at 11:00 suit you and your family for a private visit? I have reserved the sea-view show residence for you.',
        },
        { t: 'p', text: 'Warm regards,\nKavya Shah\nHead of Sales, {client}' },
      ],
    },
    refs: [
      { n: 1, source: 'gmail', label: 'Thread · Preview evening, March' },
      { n: 2, source: 'drive', label: 'Inventory_Live.xlsx' },
    ],
  },

  'lead-record': {
    id: 'lead-record',
    kind: 'record',
    title: 'Qualified Lead',
    short: 'Lead record',
    destination: 'notion',
    destinationLabel: 'Notion · CRM',
    approvedLabel: 'Updated in CRM',
    doc: {
      eyebrow: 'CRM record · Notion',
      title: 'Rahul Mehta',
      meta: [
        ['Company', 'Mehta Capital'],
        ['Stage', 'Qualified'],
        ['Owner', 'Kavya Shah'],
      ],
      blocks: [
        {
          t: 'kv',
          items: [
            ['Lead score', '92 / 100'],
            ['Budget', '₹7–7.5 Cr'],
            ['Interest', 'B-2601 · also B-2401, B-2802'],
            ['Timeline', 'Possession by late 2027'],
            ['Source', 'Inbound email · repeat contact'],
            ['Next action', 'Site visit · Sat 11:00'],
          ],
          ref: 1,
        },
        { t: 'h', text: 'Why this score' },
        {
          t: 'list',
          items: [
            'Budget matches available inventory',
            'Second touchpoint (preview evening attendee)',
            'Clear timeline and decision-maker',
          ],
        },
      ],
    },
    refs: [{ n: 1, source: 'gmail', label: 'Enquiry + preview evening thread' }],
  },

  'followup-plan': {
    id: 'followup-plan',
    kind: 'plan',
    title: 'Follow-up Plan',
    short: 'Follow-up plan',
    destination: 'notion',
    destinationLabel: 'Notion · Tasks',
    approvedLabel: 'Scheduled',
    doc: {
      eyebrow: 'Follow-up plan',
      title: 'Rahul Mehta · next 10 days',
      meta: [
        ['Owner', 'Kavya Shah'],
        ['Touches', '3'],
      ],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Today', 'Reply with proposal (prepared)'],
            ['Saturday 11:00', 'Private site visit · sea-view show residence'],
            ['Monday', 'Call to answer questions on payment plan'],
            ['Day 10', 'Hold expiry reminder for B-2601'],
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'notion', label: 'Playbooks / HNI enquiries' }],
  },

  'nair-email': {
    id: 'nair-email',
    kind: 'email',
    title: 'Personal Follow-up',
    short: 'Follow-up email',
    destination: 'gmail',
    destinationLabel: 'Gmail · Drafts',
    approvedLabel: 'Sent',
    doc: {
      eyebrow: 'Email · ready to send',
      title: 'Re: Your visit to The Aurelia',
      meta: [
        ['To', 'priya.nair@gmail.com'],
        ['From', 'Kavya Shah'],
      ],
      blocks: [
        { t: 'p', text: 'Dear Priya and Arjun,' },
        {
          t: 'p',
          text: 'It was a pleasure showing you and the children around Tower A. I know the payment schedule was on your mind, so I wanted to share something new.',
          ref: 1,
        },
        {
          t: 'p',
          text: 'This month we have approved a 20:80 plan for Tower A: 20% now, and the balance on possession. It keeps the same residence you liked, with far more breathing room.',
          ref: 2,
        },
        { t: 'p', text: 'Could I call you on Thursday at 6 PM to walk you through it?' },
        { t: 'p', text: 'Warm regards,\nKavya Shah' },
      ],
    },
    refs: [
      { n: 1, source: 'notion', label: 'CRM / Visit 16 Sep' },
      { n: 2, source: 'drive', label: 'Offers_Sep.pdf' },
    ],
  },

  'reengage-plan': {
    id: 'reengage-plan',
    kind: 'plan',
    title: 'Re-engagement Plan',
    short: 'Re-engagement plan',
    destination: 'notion',
    destinationLabel: 'Notion · Tasks',
    approvedLabel: 'Scheduled',
    doc: {
      eyebrow: 'Plan',
      title: 'Nair family · re-engagement',
      meta: [['Owner', 'Kavya Shah']],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Day 0', 'Personal email with 20:80 plan'],
            ['Day 2', 'Call from Kavya · Thu 6 PM'],
            ['Day 5', 'Private clubhouse evening for the family'],
          ],
        },
      ],
    },
    refs: [{ n: 1, source: 'notion', label: 'CRM / Nair family' }],
  },

  'deal-rec': {
    id: 'deal-rec',
    kind: 'recommendation',
    title: 'Deal Recommendation',
    short: 'Recommendation',
    destination: 'notion',
    destinationLabel: 'Notion · CRM',
    approvedLabel: 'Logged',
    doc: {
      eyebrow: 'Recommendation',
      title: 'Lead with the payment plan, not the brochure',
      meta: [['Confidence', 'High']],
      blocks: [
        {
          t: 'p',
          text: 'The family liked the product; the objection was cash flow. The new 20:80 plan answers it directly. A senior call within 48 hours is recommended.',
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'notion', label: 'Visit notes' }],
  },

  'weekly-report': {
    id: 'weekly-report',
    kind: 'report',
    title: 'Leadership Report',
    short: 'Weekly report',
    destination: 'drive',
    destinationLabel: 'Drive · Leadership',
    approvedLabel: 'Shared',
    doc: {
      eyebrow: 'Leadership report · Week 39',
      title: 'A strong week for Tower B',
      meta: [
        ['Period', '21–27 September 2026'],
        ['Prepared by', 'Bombay OS'],
      ],
      blocks: [
        {
          t: 'kv',
          items: [
            ['Units booked', '9 · ₹58.6 Cr'],
            ['Inventory remaining', '118 units'],
            ['Weighted pipeline', '₹142 Cr'],
            ['Enquiries', '64 · 41% referrals'],
            ['Site progress', 'Tower B slab 27 · on schedule'],
          ],
          ref: 1,
        },
        { t: 'h', text: 'Decisions needed' },
        { t: 'list', items: ['Confirm Tower C launch date', 'Review the referral incentive, now the top channel'] },
      ],
    },
    refs: [{ n: 1, source: 'drive', label: 'Inventory_Live.xlsx · Site_Weekly.pdf' }],
  },

  'leadership-email': {
    id: 'leadership-email',
    kind: 'email',
    title: 'Leadership Summary',
    short: 'Summary email',
    destination: 'gmail',
    destinationLabel: 'Gmail · Drafts',
    approvedLabel: 'Sent',
    doc: {
      eyebrow: 'Email',
      title: 'Week 39 in two minutes',
      meta: [['To', 'leadership@{domain}']],
      blocks: [
        { t: 'p', text: '9 bookings worth ₹58.6 Cr, Tower B on schedule, and referrals are now our strongest channel. Two decisions are needed this week — details in the attached report.' },
      ],
    },
    refs: [],
  },

  'action-items': {
    id: 'action-items',
    kind: 'tasks',
    title: 'Action Items',
    short: 'Action items',
    destination: 'notion',
    destinationLabel: 'Notion · Tasks',
    approvedLabel: 'Assigned',
    doc: {
      eyebrow: 'Tasks',
      title: 'This week',
      meta: [['Owners', '4']],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Founders', 'Confirm Tower C launch date'],
            ['Marketing', 'Review referral incentive'],
            ['Sales', 'Follow up 5 hot leads'],
            ['Projects', 'Share slab 28 schedule'],
          ],
        },
      ],
    },
    refs: [],
  },
};

const agency: Record<string, Deliverable> = {
  proposal: {
    id: 'proposal',
    kind: 'proposal',
    title: 'Launch Proposal',
    short: 'Proposal',
    destination: 'drive',
    destinationLabel: 'Drive · Clients / Lumière Skin',
    approvedLabel: 'Sent with reply',
    doc: {
      eyebrow: 'Confidential · Proposal',
      title: 'A 90-day launch plan for Lumière Skin',
      meta: [
        ['Prepared for', 'Ananya Rao, Founder, Lumière Skin'],
        ['Prepared by', 'Meera Kapoor, {client}'],
        ['Date', '27 September 2026'],
        ['Reference', 'LUM-LAUNCH-0927'],
      ],
      blocks: [
        { t: 'h', text: 'Executive summary' },
        {
          t: 'lead',
          text: 'Lumière Skin is launching its vitamin C range in November. We propose one team running performance marketing, social and a conversion-focused landing page, built on the playbook that took Glow & Co from launch to profitable scale in 90 days.',
          ref: 1,
        },
        { t: 'h', text: 'What you asked for' },
        {
          t: 'table',
          head: ['Your brief', 'Our plan'],
          rows: [
            ['Performance marketing', 'Meta + Google, launch and scale phases'],
            ['Social media', '12 posts and 8 reels a month, creator seeding'],
            ['New landing page', 'Launch page with bundles, live in 3 weeks'],
            ['Launch in November', 'Team starts 1 November'],
            ['~$48,000 for the quarter', 'Fees $23,450 · media $24,500'],
          ],
          ref: 2,
        },
        { t: 'h', text: 'Investment' },
        {
          t: 'table',
          head: ['Component', 'Amount'],
          rows: [
            ['Growth retainer · 3 months at $3,850', '$11,550'],
            ['Launch landing page', '$5,400'],
            ['Creator seeding programme', '$4,050'],
            ['Media management · 10% of $24,500', '$2,450'],
          ],
          total: ['Total fees', '$23,450'],
          ref: 3,
        },
        { t: 'h', text: 'Expected results' },
        {
          t: 'table',
          head: ['Measure', 'First 90 days'],
          rows: [
            ['New customers', '6,000–7,500'],
            ['Cost per acquisition', '$6.50–$7.50'],
            ['Landing page conversion', '3.5%+'],
          ],
          total: ['Expected ROAS', '{{roas}}'],
          ref: 4,
          watchToken: 'roas',
        },
        { t: 'h', text: 'Timeline' },
        {
          t: 'steps',
          items: [
            ['This week', 'Discovery call, Thursday 11:00'],
            ['Week 1–3', 'Strategy, creative and landing page build'],
            ['Week 4', 'Launch across Meta, Google and creators'],
            ['Week 5–12', 'Scale what works, weekly reporting'],
          ],
        },
        { t: 'h', text: 'Next steps' },
        {
          t: 'list',
          items: [
            'Confirm the Thursday 11:00 discovery call.',
            'We will reserve our D2C pod from 1 November.',
            'Share brand assets and past ad data so we can start before kickoff.',
          ],
        },
      ],
    },
    refs: [
      { n: 1, source: 'gmail', label: 'Brief from Ananya Rao · 06:12 AM' },
      { n: 2, source: 'notion', label: 'Playbooks / New business' },
      { n: 3, source: 'drive', label: 'Rate Card FY26 · p.3' },
      { n: 4, source: 'drive', label: 'Glow & Co case study (verified)' },
    ],
  },

  'reply-email': {
    id: 'reply-email',
    kind: 'email',
    title: 'Reply Email',
    short: 'Reply email',
    destination: 'gmail',
    destinationLabel: 'Gmail · Drafts',
    approvedLabel: 'Sent 06:14 AM',
    doc: {
      eyebrow: 'Email · ready to send',
      title: 'Re: Launch partner for Lumière Skin',
      meta: [
        ['To', 'ananya@lumiereskin.in'],
        ['From', 'Meera Kapoor'],
        ['Attachment', 'LumiereSkin_Launch_Proposal.pdf'],
      ],
      blocks: [
        { t: 'p', text: 'Hi Ananya,' },
        {
          t: 'p',
          text: 'Lovely to hear from you after the D2C Summit. I remember our chat about creator-led launches, so I’ve built that into the plan.',
          ref: 1,
        },
        {
          t: 'p',
          text: 'Attached is a 90-day launch plan covering performance, social and a new landing page, with fees of $23,450 and the rest of your budget going to media. It’s based on our work with Glow & Co, a comparable skincare launch that reached 3.1× ROAS in its first 90 days.',
          ref: 2,
        },
        { t: 'p', text: 'Would Thursday at 11:00 work for a discovery call? Our D2C team is free from 1 November, in time for your launch.' },
        { t: 'p', text: 'Warm regards,\nMeera Kapoor\nClient Services Director, {client}' },
      ],
    },
    refs: [
      { n: 1, source: 'gmail', label: 'Thread · D2C Summit, August' },
      { n: 2, source: 'drive', label: 'Glow & Co case study' },
    ],
  },

  'lead-record': {
    id: 'lead-record',
    kind: 'record',
    title: 'Client Record',
    short: 'CRM record',
    destination: 'notion',
    destinationLabel: 'Notion · Clients',
    approvedLabel: 'Created in CRM',
    doc: {
      eyebrow: 'CRM record · Notion',
      title: 'Lumière Skin',
      meta: [
        ['Contact', 'Ananya Rao, Founder'],
        ['Stage', 'Proposal sent'],
        ['Owner', 'Meera Kapoor'],
      ],
      blocks: [
        {
          t: 'kv',
          items: [
            ['Lead score', '88 / 100'],
            ['Budget', '~$48,000 / quarter'],
            ['Services', 'Performance · Social · Web'],
            ['Start', '1 November 2026'],
            ['Source', 'Inbound email · met at D2C Summit'],
            ['Next action', 'Discovery call · Thu 11:00'],
          ],
          ref: 1,
        },
        { t: 'h', text: 'Why this score' },
        {
          t: 'list',
          items: ['Budget fits our D2C retainer range', 'Warm contact from the Summit', 'Clear launch date and decision-maker'],
        },
      ],
    },
    refs: [{ n: 1, source: 'gmail', label: 'Brief + Summit thread' }],
  },

  'kickoff-plan': {
    id: 'kickoff-plan',
    kind: 'plan',
    title: 'Kickoff Plan',
    short: 'Kickoff plan',
    destination: 'notion',
    destinationLabel: 'Notion · Projects',
    approvedLabel: 'Pod B reserved',
    doc: {
      eyebrow: 'Kickoff plan',
      title: 'Lumière Skin · first two weeks',
      meta: [
        ['Team', 'Pod B · 4 people'],
        ['Lead', 'Meera Kapoor'],
      ],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Thu 11:00', 'Discovery call with Ananya'],
            ['Day 3', 'Brand, audience and past-data audit'],
            ['Day 7', 'Launch strategy and creative routes'],
            ['Day 14', 'Landing page design review'],
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'notion', label: 'Ops / Capacity board' }],
  },

  'perf-email': {
    id: 'perf-email',
    kind: 'email',
    title: 'Client Update',
    short: 'Client update',
    destination: 'gmail',
    destinationLabel: 'Gmail · Drafts',
    approvedLabel: 'Sent',
    doc: {
      eyebrow: 'Email · ready to send',
      title: 'Re: This week’s Meta performance',
      meta: [
        ['To', 'rohan@urbanbrew.in'],
        ['From', 'Meera Kapoor'],
      ],
      blocks: [
        { t: 'p', text: 'Hi Rohan,' },
        {
          t: 'p',
          text: 'Short version: nothing is broken. Your three best ads have been running for 34 days and people have seen them too often, so costs rose and returns fell overnight.',
          ref: 1,
        },
        {
          t: 'p',
          text: 'We’ve already moved 25% of this week’s Meta budget to Google Search, where people are actively looking for coffee subscriptions. Three fresh creatives will be live by Thursday.',
          ref: 2,
        },
        { t: 'p', text: 'We expect ROAS back around 2.6× within 10 days. I’ll send you a quick update on Friday.' },
        { t: 'p', text: 'Best,\nMeera' },
      ],
    },
    refs: [
      { n: 1, source: 'gmail', label: 'Meta Ads daily digest' },
      { n: 2, source: 'notion', label: 'Accounts / Urban Brew' },
    ],
  },

  'perf-plan': {
    id: 'perf-plan',
    kind: 'plan',
    title: 'Optimisation Plan',
    short: 'Optimisation plan',
    destination: 'notion',
    destinationLabel: 'Notion · Accounts',
    approvedLabel: 'Queued',
    doc: {
      eyebrow: 'Plan',
      title: 'Urban Brew · recovery plan',
      meta: [['Owner', 'Performance team']],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Today', 'Meta −25%, Google Search +25% (within limits)'],
            ['Thursday', '3 new creatives live, fatigued ads paused'],
            ['Day 7', 'Review frequency and CPM'],
            ['Day 10', 'Target ROAS back to 2.6×'],
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'notion', label: 'Account plan · budget limits' }],
  },

  'creative-brief': {
    id: 'creative-brief',
    kind: 'recommendation',
    title: 'Creative Brief',
    short: 'Creative brief',
    destination: 'notion',
    destinationLabel: 'Notion · Creative',
    approvedLabel: 'Assigned',
    doc: {
      eyebrow: 'Creative brief',
      title: 'Three new concepts from what already works',
      meta: [['Due', 'Thursday']],
      blocks: [
        {
          t: 'list',
          items: [
            'Morning ritual: 6-second hook, same product close-up that drove the best CTR',
            'Founder story: 20-second reel, subtitles on',
            'Subscription offer: static carousel with first-box discount',
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'drive', label: 'Creative library · top performers' }],
  },

  'weekly-report': {
    id: 'weekly-report',
    kind: 'report',
    title: 'Client Reports',
    short: 'Client reports',
    destination: 'drive',
    destinationLabel: 'Drive · Reports / Week 39',
    approvedLabel: 'Shared with 12 clients',
    doc: {
      eyebrow: 'Client performance · Week 39',
      title: 'A strong week across the book',
      meta: [
        ['Period', '21–27 September 2026'],
        ['Accounts', '12'],
        ['Prepared by', 'Bombay OS'],
      ],
      blocks: [
        {
          t: 'kv',
          items: [
            ['Total spend', '$101,000'],
            ['Blended ROAS', '3.4×'],
            ['Best performer', 'Velo EV · 5.2×'],
            ['Needs attention', 'Urban Brew · creative fatigue'],
            ['Delivery', '41 of 44 tasks shipped'],
          ],
          ref: 1,
        },
        { t: 'h', text: 'Risks' },
        { t: 'list', items: ['Saffron Air escalation on landing page speed', 'Two retainers renew in October'] },
      ],
    },
    refs: [{ n: 1, source: 'drive', label: 'Week 39 export · Delivery board' }],
  },

  'leadership-email': {
    id: 'leadership-email',
    kind: 'email',
    title: 'Leadership Summary',
    short: 'Summary email',
    destination: 'gmail',
    destinationLabel: 'Gmail · Drafts',
    approvedLabel: 'Sent',
    doc: {
      eyebrow: 'Email',
      title: 'Week 39 in two minutes',
      meta: [['To', 'leadership@{domain}']],
      blocks: [
        {
          t: 'p',
          text: '$101,000 managed at 3.4× blended ROAS across 12 clients. Velo EV is our best performer; Urban Brew is recovering from creative fatigue. One escalation (Saffron Air) and two October renewals need attention. Details are in the reports.',
        },
      ],
    },
    refs: [],
  },

  'action-items': {
    id: 'action-items',
    kind: 'tasks',
    title: 'Action Items',
    short: 'Action items',
    destination: 'notion',
    destinationLabel: 'Notion · Tasks',
    approvedLabel: 'Assigned',
    doc: {
      eyebrow: 'Tasks',
      title: 'This week',
      meta: [['Owners', '5']],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Meera', 'Call Saffron Air today'],
            ['Web team', 'Fix Saffron Air page speed by Wed'],
            ['Accounts', 'Prepare 2 renewal decks'],
            ['Creative', 'Urban Brew concepts by Thu'],
            ['Performance', 'Scale Velo EV winners'],
          ],
        },
      ],
    },
    refs: [],
  },
};

export const deliverables: Record<string, Deliverable> = pick({ agency, realestate });
