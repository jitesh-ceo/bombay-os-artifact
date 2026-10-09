// Pre-written Content Forge packages, used when Gemini is not configured or does not answer in time.
// `{topic}` is replaced with what the presenter asked for.
import type { ForgePackage } from './forge';

type Sample = Omit<ForgePackage, 'topic'> & { match: RegExp; defaultTopic: string };

export const FORGE_SAMPLES: Sample[] = [
  {
    match: /phone|iphone|samsung|pixel|tech|gadget|\bai\b|laptop|camera|launch|review|app|جوال|تقنية/i,
    defaultTopic: 'the new iPhone in Dubai',
    angle: 'An honest week with {topic}: what actually changes for someone living in Dubai',
    format: 'youtube',
    trend: [
      { label: 'Searches for “{topic}” in the UAE', score: 92 },
      { label: 'Unboxing and first-week videos', score: 81 },
      { label: 'Heat and battery questions in the comments', score: 74 },
    ],
    hook: 'I used {topic} for seven days in 45-degree heat. Here is what nobody tells you.',
    script: [
      'Cold open: the phone on a car dashboard at noon, temperature on screen',
      'Day 1: setup, first impressions, the one feature everyone is asking about',
      'Day 3: camera test at Dubai Marina, day and night',
      'Day 5: battery and heat, with real numbers from a full day out',
      'Day 7: the verdict, who should upgrade and who should wait',
      'Close: ask viewers which test to run next',
    ],
    thumbnails: [
      { title: '7 DAYS. 45°C.', visual: 'Creator squinting at {topic} on a sun-baked dashboard' },
      { title: 'WORTH IT?', visual: 'Split screen: old phone vs new phone, big red question mark' },
      { title: 'THE TRUTH', visual: 'Close-up of the camera bump with the Marina skyline reflected' },
    ],
    shots: [
      'Dashboard close-up at noon, thermometer in frame',
      'Unboxing on the studio desk, top-down',
      'Marina walk, golden hour camera test',
      'Night shot at the Museum of the Future',
      'Battery screen at 22:00 after a full day',
      'Talking-head verdict, studio lighting',
    ],
    captions: {
      en: 'Seven days with {topic} in Dubai heat. The battery result surprised me.',
      ar: 'سبعة أيام مع {topic} في حر دبي. نتيجة البطارية فاجأتني.',
    },
    hashtags: ['#dubai', '#techreview', '#uae', '#smartphone', '#honestreview'],
    postTime: 'Thu 20:30 Gulf time',
    issue: {
      field: 'Script claim',
      generated: '“The fastest phone ever made”',
      verified: '“The fastest phone I have tested”',
      reason: 'The draft claimed it is the fastest phone ever made. There is no benchmark in the sources to back that, so JARVIS narrowed it to what was actually tested.',
    },
  },
  {
    match: /food|eat|restaurant|shawarma|coffee|cafe|café|brunch|burger|dessert|karak|شاورما|اكل|أكل|مطعم|قهوة|كرك/i,
    defaultTopic: 'the best shawarma in Dubai',
    angle: 'One day, five spots, one winner: {topic}, ranked honestly',
    format: 'reel',
    trend: [
      { label: '“{topic}” saves on Reels this week', score: 88 },
      { label: 'Ranking and taste-test formats', score: 84 },
      { label: 'Late-night food searches in Dubai', score: 71 },
    ],
    hook: 'I tried {topic} at five places in one day. Number one is not the famous one.',
    script: [
      'Hook on the bite: first spot, no talking, just the crunch',
      'Spots five to three: quick verdicts with a score on screen',
      'Spot two: the crowd favourite and why it almost won',
      'Spot one: the hidden winner, address on screen',
      'Close: “Tag who you are taking”',
    ],
    thumbnails: [
      { title: 'NUMBER 1 SHOCKED ME', visual: 'Creator mid-bite, wide eyes, five plates of {topic} lined up' },
      { title: '5 SPOTS. 1 WINNER.', visual: 'Map of Dubai with five glowing pins' },
      { title: 'NOT THE FAMOUS ONE', visual: 'Hand crossing out a famous storefront' },
    ],
    shots: [
      'Slow-motion bite, macro lens',
      'Walking into each spot, handheld',
      'Score cards on the table',
      'Owner handing over the winning order',
      'Night skyline outro with the winner in hand',
    ],
    captions: {
      en: 'Five spots, one day, one winner. Save this for your next late-night craving.',
      ar: 'خمسة مطاعم في يوم واحد وفائز واحد. احفظ الفيديو لسهرتك الجاية.',
    },
    hashtags: ['#dubaifood', '#foodreview', '#uae', '#streetfood', '#dubaieats'],
    postTime: 'Tue 19:00 Gulf time',
    issue: {
      field: 'Disclosure',
      generated: 'None',
      verified: '#ad · hosted meal at spot two',
      reason: 'Spot two hosted the meal for free. UAE rules treat that as advertising, so JARVIS added the #ad disclosure before anything is posted.',
    },
  },
  {
    match: /travel|trip|hotel|desert|beach|hatta|camping|flight|mountain|island|staycation|سفر|رحلة|صحراء|حتا|فندق/i,
    defaultTopic: 'a weekend in Hatta',
    angle: 'Everything you need for {topic}, in under a minute',
    format: 'short',
    trend: [
      { label: '“{topic}” searches before the long weekend', score: 86 },
      { label: 'Budget breakdown videos', score: 78 },
      { label: 'Cooler-weather escapes from Dubai', score: 73 },
    ],
    hook: '{topic}, done properly, for less than you think. Here is the exact plan.',
    script: [
      'Hook: the view at sunrise, then cut to the price on screen',
      'Getting there: the drive and where to stop',
      'Where to stay: two options at two budgets',
      'What to do: three things in the order to do them',
      'The total cost, itemised, on screen',
    ],
    thumbnails: [
      { title: 'UNDER AED 500', visual: 'Sunrise over the mountains, {topic} in bold letters' },
      { title: 'THE EXACT PLAN', visual: 'Itinerary card floating over a lake' },
      { title: 'SKIP THE CROWDS', visual: 'Empty kayak on still water at dawn' },
    ],
    shots: [
      'Sunrise timelapse from the ridge',
      'Car interior on the mountain road',
      'Cabin walkthrough, handheld',
      'Kayak POV on the dam',
      'Cost breakdown written on a notebook',
    ],
    captions: {
      en: 'The exact plan for {topic}, with every dirham on screen. Save it for the weekend.',
      ar: 'الخطة الكاملة لـ{topic} وكل درهم مكتوب. احفظها لنهاية الأسبوع.',
    },
    hashtags: ['#uaetravel', '#weekendplans', '#dubai', '#travelreels', '#budgettravel'],
    postTime: 'Wed 20:00 Gulf time',
    issue: {
      field: 'Shot list',
      generated: 'Drone flyover of the dam',
      verified: 'Ridge timelapse, no drone',
      reason: 'Flying a drone there needs a GCAA permit, and none is on file. JARVIS swapped the drone shot for a ground-level timelapse.',
    },
  },
];
