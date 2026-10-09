import { pick, type PresetId } from './prospect';

export type NewsTier = 'T1' | 'T2' | 'T3';

export interface NewsItem {
  id: string;
  tier: NewsTier;
  scope: string;
  headline: string;
  source: string;
  ageHours: number;
  deck: string;
  body: string;
  why: string;
}

export interface NewsFeed {
  /** The morning five, in the order the scrape finds them. */
  items: NewsItem[];
  /** A newer story that replaces one once it falls outside 48 hours. */
  incoming: NewsItem;
}

// Five stories, newest first. Anything older than 48 hours is already gone.
export const newsByPreset: Record<PresetId, NewsFeed> = {
  creator: {
    items: [
      {
        id: 'cr-permit',
        tier: 'T1',
        scope: 'UAE',
        headline: 'UAE Media Council reminds creators: paid and gifted posts need the advertiser permit',
        source: 'The National',
        ageHours: 3,
        deck: 'Gifted items count. A post that features one without disclosure can be fined.',
        body: 'The National reports the UAE Media Council has restated that any post promoting a product, paid or gifted, needs the advertiser permit and a clear disclosure. Accounts flagged this month were mostly lifestyle creators tagging gifted fashion.',
        why: 'Anything that shows the Atlas jacket needs #gifted before it goes live.',
      },
      {
        id: 'cr-shorts',
        tier: 'T1',
        scope: 'UAE',
        headline: 'YouTube Shorts views in the Gulf up 40% year on year',
        source: 'Campaign ME',
        ageHours: 8,
        deck: 'Short vertical video is now the fastest-growing format on YouTube in the region.',
        body: 'Campaign Middle East says Shorts views from the UAE and Saudi Arabia rose 40% on last year, and Shorts that cross-post a viral Reel within 24 hours do best. Long-form channels that add Shorts see subscriber growth first.',
        why: 'Cross-post the Metro reel tonight while it is still climbing.',
      },
      {
        id: 'cr-reels',
        tier: 'T1',
        scope: 'UAE',
        headline: 'Instagram now ranks Reels on saves and shares over likes',
        source: 'Reuters',
        ageHours: 15,
        deck: 'A Reel people save travels further than one people only like.',
        body: 'Reuters reports Instagram has confirmed saves and sends now weigh more than likes in Reels ranking. Creators with high save rates are seeing second-day spikes. Answering the top question in a pinned comment keeps a Reel in circulation.',
        why: 'Saves on the Metro reel are up 6×. Pin the answer people are asking for.',
      },
      {
        id: 'cr-ksa',
        tier: 'T2',
        scope: 'GCC',
        headline: 'Saudi beauty brands double creator budgets for Q4',
        source: 'Gulf News',
        ageHours: 21,
        deck: 'Kept because the UAE scrape was short. Most of these brands also book Dubai creators.',
        body: 'Gulf News cites agency data showing Saudi beauty brands doubling creator spend for the fourth quarter, with a preference for creators whose audiences span the UAE and KSA. Rates are holding, not falling.',
        why: 'Hold the rate on the Lumière deal. Demand for this audience is rising.',
      },
      {
        id: 'cr-eu',
        tier: 'T3',
        scope: 'World · UAE',
        headline: 'EU influencer rules start to cover Dubai creators selling to Europe',
        source: 'Reuters',
        ageHours: 33,
        deck: 'Tier three. It stays because some of the audience is in Europe.',
        body: 'Reuters notes the EU disclosure rule reaches anyone paid to promote a product to EU buyers, even if they film in Dubai. Creators with European affiliate links are being asked for contracts.',
        why: 'Keep disclosure on affiliate posts consistent across every platform.',
      },
    ],
    incoming: {
      id: 'cr-fresh',
      tier: 'T1',
      scope: 'UAE',
      headline: 'Trending audio this morning: “5 AM in the city” sound passes 90K Reels',
      source: 'Instagram trends',
      ageHours: 1,
      deck: 'The sound behind the viral Metro reel is trending across the Gulf.',
      body: 'Instagram’s trend board shows the sound used in the Metro reel crossing 90,000 Reels overnight, most of them from Dubai and Riyadh. Part 2 on the same sound would ride the trend while it lasts.',
      why: 'Use the same audio for Part 2 tomorrow.',
    },
  },
  studio: {
    items: [
      {
        id: 'ae-meta',
        tier: 'T1',
        scope: 'UAE',
        headline: 'Dubai D2C brands see Meta frequency climb past 6 before November launches',
        source: 'The National',
        ageHours: 4,
        deck: 'The same people are seeing tired ads, and the auction is charging more for them.',
        body: 'The National’s read of Meta’s UAE auction data shows D2C accounts heading into November with frequency past 6, and cost per thousand rising with it. The drop shows up as creative fatigue, not a tracking fault. It is the same shape as the Urban Brew alert already on the desk.',
        why: 'Refresh the oldest ads before launch week, or November briefs inherit an expensive audience.',
      },
      {
        id: 'ae-noon',
        tier: 'T1',
        scope: 'UAE',
        headline: 'noon opens Q4 brand placements to performance agencies',
        source: 'Reuters',
        ageHours: 9,
        deck: 'Retail-media slots for the quarter are open to agencies, not only in-house brand teams.',
        body: 'Reuters says noon is taking performance agencies onto its Q4 brand slate, with November inventory already being held. The better placements expect a landing page and a product feed on day one. Teams who wait for a briefing call will find the home-page units gone.',
        why: 'Lumière’s vitamin C launch can sit here beside Meta, if the proposal names the placement this week.',
      },
      {
        id: 'ae-tiktok',
        tier: 'T1',
        scope: 'UAE',
        headline: 'TikTok tightens shopping-ad disclosure for UAE creators',
        source: 'Campaign ME',
        ageHours: 14,
        deck: 'A paid creator post in the UAE now has to say it was paid for.',
        body: 'Campaign Middle East reports TikTok is enforcing that disclosure on shopping ads before the gifting season. Creators who blur a paid mention are being limited, which thins the supply of seeding that looks organic. Beauty is one of the categories called out.',
        why: 'The creator line in a launch plan needs a disclosure note, or the seeding budget sits in review.',
      },
      {
        id: 'ae-saudi',
        tier: 'T2',
        scope: 'GCC',
        headline: 'Saudi study: ads older than 30 days lose about a third of ROAS',
        source: 'Gulf News',
        ageHours: 22,
        deck: 'Kept because the UAE scrape was short. The finding still applies to this desk.',
        body: 'Gulf News cites Saudi account data: ads left running past 30 days lose about a third of their return. Frequency climbs first, then the hook weakens. It is not a pixel problem. GCC is tier two — used only after the UAE sources did not fill the five.',
        why: 'This is the proof line when a client asks why last month’s winning ad should come down.',
      },
      {
        id: 'ae-eu',
        tier: 'T3',
        scope: 'World · UAE',
        headline: 'EU influencer rules begin to cover UAE creators selling into Europe',
        source: 'Reuters',
        ageHours: 31,
        deck: 'Tier three. It stays only because the creators are here and the buyers are not.',
        body: 'Reuters notes the disclosure rule reaches anyone paid to promote a product to EU buyers, even if they film in Dubai. A few beauty creators on local rosters already ship into Europe. Stories with no UAE link are dropped. This one is not.',
        why: 'Flag those creators before a European retailer asks for the contract.',
      },
    ],
    incoming: {
      id: 'ae-fresh',
      tier: 'T1',
      scope: 'UAE',
      headline: 'Dubai retail-media rates for November just published',
      source: 'Campaign ME',
      ageHours: 1,
      deck: 'The November card is out. Last quarter’s prices are already stale.',
      body: 'Campaign Middle East has the first November rate card for Dubai retail media. Noon and a second marketplace are both on it, and the premium home-page placements are being held this morning. It replaces the story that just fell outside the 48-hour window.',
      why: 'Price the media fee from this card, not last quarter’s, before a proposal goes out.',
    },
  },
  realestate: {
    items: [
      {
        id: 're-dld',
        tier: 'T1',
        scope: 'UAE',
        headline: 'Dubai Land Department logs a busy week for sea-facing off-plan sales',
        source: 'The National',
        ageHours: 5,
        deck: 'Sea-facing off-plan stock is moving again, mostly to end users rather than bulk buyers.',
        body: 'The National’s read of this week’s Dubai Land Department filings shows sea-facing off-plan homes leading the count. High floors are the ones clearing. It matches the kind of brief already sitting in the inbox.',
        why: 'Lead the next residence note with the sea-facing stack, and say the week’s filings back the demand.',
      },
      {
        id: 're-rera',
        tier: 'T1',
        scope: 'UAE',
        headline: 'RERA restates escrow rules for towers handing over in 2027',
        source: 'Gulf News',
        ageHours: 11,
        deck: 'Buyers asking about 2027 possession will ask about escrow in the same breath.',
        body: 'Gulf News reports RERA has restated how escrow applies to towers with a 2027 handover. The rule is not new. The reminder is, and it will show up in the next serious enquiry. Proposals that quote a price without the escrow line will get sent back.',
        why: 'Put the escrow position next to the price, not in an appendix.',
      },
      {
        id: 're-auh',
        tier: 'T1',
        scope: 'UAE',
        headline: 'Abu Dhabi buyer enquiries rise for high-floor family homes',
        source: 'Reuters',
        ageHours: 16,
        deck: 'A second emirate is asking for the same home the Dubai desk is already selling.',
        body: 'Reuters notes a rise in Abu Dhabi enquiries for high-floor family homes, four bedrooms and a real outdoor space. It is the same brief as the sea-facing demand in Dubai, from buyers who have not toured yet.',
        why: 'Keep two Abu Dhabi-ready options beside the Dubai recommendation, so the first call does not end in a wait.',
      },
      {
        id: 're-ksa',
        tier: 'T2',
        scope: 'GCC',
        headline: 'Saudi buyers return to Dubai waterfront stock after a quiet August',
        source: 'Arab News',
        ageHours: 27,
        deck: 'Tier two. Used because the UAE filings alone did not fill the morning five.',
        body: 'Arab News reports Saudi buyers are back on Dubai waterfront stock after a quiet August. The tickets are family-sized, not studio investors. GCC is the second ring: it is read only after the UAE sources run short.',
        why: 'Brief the floor team that waterfront viewings this week may come from Riyadh, not only from Dubai.',
      },
      {
        id: 're-lon',
        tier: 'T3',
        scope: 'World · UAE',
        headline: 'London wealth desks flag fresh UAE residence enquiries this week',
        source: 'Reuters',
        ageHours: 36,
        deck: 'Tier three. It stays because the home they want is here.',
        body: 'Reuters says London wealth desks logged fresh enquiries this week for UAE residences, mostly sea-facing and ready around 2027. A London headline with no UAE asset would be dropped. This one names the asset.',
        why: 'Have a one-page answer ready for an advisor who will not tour, covering price, escrow and possession.',
      },
    ],
    incoming: {
      id: 're-fresh',
      tier: 'T1',
      scope: 'UAE',
      headline: 'A new high-floor stack on the Marina released this morning',
      source: 'Gulf News',
      ageHours: 1,
      deck: 'New stock, still inside the hour. It replaces the story that aged out.',
      body: 'Gulf News has a Marina release from this morning: a high-floor stack with sea aspect, not yet on the usual portal lists. It is the fresh UAE item that takes the seat of whatever just passed 48 hours.',
      why: 'Check it against the open briefs before the first call. It may already fit one of them.',
    },
  },
};

export const newsFeed: NewsFeed = pick(newsByPreset);
