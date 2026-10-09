// Creator preset deliverables. `{{token}}` values come from the owning workflow's `corrections`.
import type { Deliverable } from '../deliverables';

export const creatorDeliverables: Record<string, Deliverable> = {
  'pitch-deck': {
    id: 'pitch-deck',
    kind: 'proposal',
    title: 'Pitch Deck',
    short: 'Pitch deck',
    destination: 'drive',
    destinationLabel: 'Drive · Deals / Lumière Skin',
    approvedLabel: 'Sent with counter-offer',
    doc: {
      eyebrow: 'Confidential · Brand partnership',
      title: 'Lumière Skin × {client}: a November launch',
      meta: [
        ['Prepared for', 'Ananya Rao, Founder, Lumière Skin'],
        ['Prepared by', 'Sara Mansour, Manager'],
        ['Date', '9 October 2026'],
        ['Reference', 'LUM-DEAL-1009'],
      ],
      blocks: [
        { t: 'h', text: 'Why this works' },
        {
          t: 'lead',
          text: 'Lumière Skin launches its vitamin C range in November. {client}’s audience is 68% women aged 18–34, mostly in the UAE and Saudi Arabia, and skincare videos on the channel keep more than half of viewers to the end.',
          ref: 1,
        },
        { t: 'h', text: 'What you asked for' },
        {
          t: 'table',
          head: ['Your brief', 'Our plan'],
          rows: [
            ['1 YouTube integration', '90-second segment in a “morning routine” video'],
            ['2 Instagram Reels', 'Launch-day Reel and a 7-day results Reel'],
            ['1 TikTok', 'Duet-ready “Dubai summer skin” clip'],
            ['Launch in November', 'Content live from Monday 3 November'],
          ],
          ref: 2,
        },
        { t: 'h', text: 'Package' },
        {
          t: 'table',
          head: ['Piece', 'Rate'],
          rows: [
            ['YouTube integration', '$14,000'],
            ['Instagram Reels · 2 × $4,500', '$9,000'],
            ['TikTok', '$3,000'],
            ['Bundle of 4 pieces', '−$1,500'],
          ],
          total: ['Package · 30-day usage included', '$24,500'],
          ref: 3,
        },
        { t: 'h', text: 'What to expect' },
        {
          t: 'table',
          head: ['Measure', 'Based on the last 90 days'],
          rows: [
            ['Audience in the UAE and KSA', '61%'],
            ['Average watch-through on skincare videos', '54%'],
            ['Comparable deal · Glow & Co 2025', '1.3M views delivered'],
          ],
          total: ['Expected views · per integration', '{{views}}'],
          ref: 4,
          watchToken: 'views',
        },
        { t: 'h', text: 'Timeline' },
        {
          t: 'steps',
          items: [
            ['Sat 18 Oct', 'Shoot day, Al Quoz studio'],
            ['Fri 24 Oct', 'Drafts to Lumière Skin for review'],
            ['Mon 3 Nov', 'Integration and launch Reel go live'],
            ['Mon 10 Nov', 'Results Reel and TikTok'],
          ],
        },
      ],
    },
    refs: [
      { n: 1, source: 'youtube', label: 'YouTube Studio · Audience' },
      { n: 2, source: 'gmail', label: 'Offer from Ananya Rao · 06:12 AM' },
      { n: 3, source: 'drive', label: 'Rates 2026 · p.2' },
      { n: 4, source: 'youtube', label: '90-day analytics (verified)' },
    ],
  },

  'counter-email': {
    id: 'counter-email',
    kind: 'email',
    title: 'Counter-offer',
    short: 'Counter-offer',
    destination: 'gmail',
    destinationLabel: 'Gmail · Drafts',
    approvedLabel: 'Sent 06:15 AM',
    doc: {
      eyebrow: 'Email · ready to send',
      title: 'Re: November launch with {client}',
      meta: [
        ['To', 'ananya@lumiereskin.ae'],
        ['From', 'Sara Mansour'],
        ['Attachment', 'LumiereSkin_x_{client}_Deck.pdf'],
      ],
      blocks: [
        { t: 'p', text: 'Hi Ananya,' },
        {
          t: 'p',
          text: 'Lovely to hear from you after Beautyworld. {client} loves the vitamin C range, and we’d be glad to lead the launch.',
          ref: 1,
        },
        {
          t: 'p',
          text: 'Attached are three concepts and the package: one YouTube integration, two Reels and a TikTok for $24,500, with 30 days of usage included. To be straight with you on numbers, the channel averages 1.4M views per integration over the last 90 days, and our Glow & Co launch last year delivered 1.3M.',
          ref: 2,
        },
        { t: 'p', text: 'We’re holding Saturday 18 October for the shoot, so everything can be live on 3 November. Shall we lock it in?' },
        { t: 'p', text: 'Best,\nSara Mansour\nManager, {client}' },
      ],
    },
    refs: [
      { n: 1, source: 'gmail', label: 'Thread · Beautyworld, June' },
      { n: 2, source: 'youtube', label: 'YouTube Studio · 90-day average' },
    ],
  },

  'content-plan': {
    id: 'content-plan',
    kind: 'plan',
    title: 'Content Plan',
    short: 'Content plan',
    destination: 'notion',
    destinationLabel: 'Notion · Content',
    approvedLabel: 'Shoot day held',
    doc: {
      eyebrow: 'Content plan',
      title: 'Lumière Skin · three concepts',
      meta: [
        ['Shoot', 'Sat 18 Oct · Al Quoz'],
        ['Editor', 'Omar'],
      ],
      blocks: [
        {
          t: 'list',
          items: [
            'Morning routine, real results: the integration, filmed over 7 days with honest before-and-after',
            '“Dubai summer skin”: a 30-second Reel answering the most-asked skincare question in the comments',
            'Launch-day unboxing: a TikTok built to be duetted',
          ],
          ref: 1,
        },
        { t: 'h', text: 'Dates' },
        {
          t: 'steps',
          items: [
            ['Sat 18 Oct', 'Shoot'],
            ['Wed 22 Oct', 'Omar’s first cut'],
            ['Fri 24 Oct', 'Drafts to the brand'],
            ['Mon 3 Nov', 'Live'],
          ],
        },
      ],
    },
    refs: [{ n: 1, source: 'youtube', label: 'Top skincare videos · retention' }],
  },

  'pinned-comment': {
    id: 'pinned-comment',
    kind: 'record',
    title: 'Pinned Comment',
    short: 'Pinned comment',
    destination: 'instagram',
    destinationLabel: 'Instagram · Viral reel',
    approvedLabel: 'Pinned',
    doc: {
      eyebrow: 'Instagram · pinned comment',
      title: 'Where the jacket is from',
      meta: [
        ['Post', 'Reel · “Dubai Metro at 5 AM”'],
        ['Reach', '2.3M views in 19 hours'],
      ],
      blocks: [
        {
          t: 'p',
          text: '📌 So many of you asked: the jacket is from Atlas Outerwear. It’s in my link in bio, sizes XS–XL. Part 2 of the 5 AM series drops Thursday.',
          ref: 1,
        },
        {
          t: 'table',
          head: ['Detail', 'Value'],
          rows: [
            ['Pin on', 'Viral reel'],
            ['Replies to top comments', '20 queued'],
          ],
          total: ['Disclosure', '{{disclosure}}'],
          ref: 2,
          watchToken: 'disclosure',
        },
      ],
    },
    refs: [
      { n: 1, source: 'instagram', label: 'Comment themes · 1,900 comments' },
      { n: 2, source: 'drive', label: 'Atlas gifting agreement (verified)' },
    ],
  },

  'followup-brief': {
    id: 'followup-brief',
    kind: 'recommendation',
    title: 'Part 2 Brief',
    short: 'Part 2 brief',
    destination: 'notion',
    destinationLabel: 'Notion · Content',
    approvedLabel: 'Sent to Omar',
    doc: {
      eyebrow: 'Follow-up video brief',
      title: 'Part 2: Dubai Metro at 5 AM',
      meta: [
        ['Shoot', 'Tomorrow 05:00 · Marina station'],
        ['Post', 'Thu 19:00 Gulf time'],
      ],
      blocks: [
        {
          t: 'list',
          items: [
            'Hook in the first second: “You asked where I was going at 5 AM…”',
            'Same handheld style and colour grade as the original',
            'End on a question to keep the comments going',
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'instagram', label: 'Reel insights · what held attention' }],
  },

  'shorts-plan': {
    id: 'shorts-plan',
    kind: 'plan',
    title: 'Shorts Cross-post',
    short: 'Shorts plan',
    destination: 'youtube',
    destinationLabel: 'YouTube · Shorts',
    approvedLabel: 'Scheduled 21:00',
    doc: {
      eyebrow: 'Cross-post plan',
      title: 'The viral reel on YouTube Shorts',
      meta: [['Scheduled', 'Tonight 21:00']],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Tonight 21:00', 'Post the reel as a Short, re-captioned for YouTube'],
            ['+2 hours', 'Pin a comment linking the full Dubai mornings video'],
            ['+48 hours', 'Compare with the 380K Shorts benchmark'],
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'youtube', label: 'YouTube Studio · Shorts benchmark' }],
  },

  'week-calendar': {
    id: 'week-calendar',
    kind: 'plan',
    title: 'Upload Calendar',
    short: 'Upload calendar',
    destination: 'notion',
    destinationLabel: 'Notion · Content / Week 42',
    approvedLabel: 'Published',
    doc: {
      eyebrow: 'Upload calendar · Week 42',
      title: 'Five uploads, on the best slots',
      meta: [
        ['Week', '13–19 October 2026'],
        ['Prepared by', 'JARVIS'],
      ],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Tue 19:00', 'Instagram Reel · Metro Part 2'],
            ['Wed 20:00', 'TikTok · “What I eat at 5 AM”'],
            ['Thu 20:30', 'YouTube · phone review'],
            ['Fri 19:00', 'Instagram Reel · Q&A from the comments'],
            ['Sun 18:00', 'YouTube vlog · Hatta weekend'],
          ],
          ref: 1,
        },
        { t: 'h', text: 'Still to shoot' },
        { t: 'list', items: ['Hatta vlog · Saturday 07:00'] },
      ],
    },
    refs: [{ n: 1, source: 'instagram', label: 'Best posting times · 30 days' }],
  },

  captions: {
    id: 'captions',
    kind: 'recommendation',
    title: 'Captions EN / AR',
    short: 'Captions',
    destination: 'instagram',
    destinationLabel: 'Instagram · Drafts',
    approvedLabel: 'Saved as drafts',
    doc: {
      eyebrow: 'Captions · English and Arabic',
      title: 'This week’s captions',
      meta: [['Uploads', '5']],
      blocks: [
        {
          t: 'kv',
          items: [
            ['Metro Part 2 · EN', '5 AM Dubai hits different. Part 2, as promised.'],
            ['Metro Part 2 · AR', 'دبي الساعة ٥ الصبح غير. الجزء الثاني مثل ما وعدتكم.'],
            ['Phone review · EN', 'Two weeks, one phone, zero sponsors. Honest review.'],
            ['Phone review · AR', 'أسبوعين مع جوال واحد وبدون رعاية. رأيي بصراحة.'],
            ['Hashtags', '#dubai #morningroutine #uae'],
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'notion', label: 'Content / Week 42' }],
  },

  'team-tasks': {
    id: 'team-tasks',
    kind: 'tasks',
    title: 'Team Tasks',
    short: 'Team tasks',
    destination: 'notion',
    destinationLabel: 'Notion · Team',
    approvedLabel: 'Assigned',
    doc: {
      eyebrow: 'Tasks',
      title: 'This week',
      meta: [['Owners', '3']],
      blocks: [
        {
          t: 'steps',
          items: [
            ['Omar', 'Metro Part 2 edit by Mon · phone review by Wed'],
            ['Dev', '3 thumbnails by Tue'],
            ['Sara', 'Approve captions on Monday'],
            ['{client}', 'Hatta vlog shoot · Sat 07:00'],
          ],
          ref: 1,
        },
      ],
    },
    refs: [{ n: 1, source: 'notion', label: 'Team / Board' }],
  },
};
