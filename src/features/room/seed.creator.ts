// Control Room demo snapshot for a solo creator ({client}) and their small team.
// Fixed sample values, labelled as a demo snapshot on the board.
import { personalize } from '../../data/prospect';
import { reachSeries, STUDIO, weekLabel, type RoomCopy } from './seedUtil';
import { dubaiDate, minutesNow } from './time';
import type { CalEvent, Channel, Competitor, ContentPack, InboxThread, MeetingNote, MetricsRecord, Person, Place, Routine, Settings, Story, Task } from './types';

export const ACCOUNTS = [STUDIO.name, 'Lumière Skin', 'Atlas Outerwear', 'Kinetic Fitness', 'Velo EV'];

export const PLACES: Place[] = personalize([
  { id: 'hq', name: '{client} studio · Dubai Design District', nameAr: 'استوديو {client} · حي دبي للتصميم', lat: 25.1873, lon: 55.2976 },
  { id: 'media', name: 'Creator Hub · Dubai Media City', nameAr: 'مركز صناع المحتوى · مدينة دبي للإعلام', lat: 25.0955, lon: 55.156 },
  { id: 'difc', name: 'Lumière Skin pop-up · DIFC', nameAr: 'متجر لوميير سكن المؤقت · مركز دبي المالي', lat: 25.2125, lon: 55.2797 },
  { id: 'quoz', name: 'Shoot studio · Al Quoz', nameAr: 'استوديو التصوير · القوز', lat: 25.137, lon: 55.227 },
  { id: 'dafz', name: 'Saffron Air · Airport Freezone', nameAr: 'سافرون إير · المنطقة الحرة للمطار', lat: 25.2622, lon: 55.3786 },
  { id: 'marina', name: 'Metro shoot · Dubai Marina', nameAr: 'تصوير المترو · دبي مارينا', lat: 25.0805, lon: 55.1403 },
  { id: 'sharjah', name: 'Book Fair panel · Sharjah Expo Centre', nameAr: 'جلسة معرض الكتاب · مركز إكسبو الشارقة', lat: 25.3263, lon: 55.3843 },
] satisfies Place[]);

export const CHANNELS: Channel[] = [
  { id: 'ig-studio', handle: STUDIO.handle, owner: 'studio', platform: 'Instagram', source: 'metaads', followers: 318_000, reach14: 3_900_000, newFollowers: 12_400, er: 7.4, growth: 4.1, dailyReach: reachSeries(278_000, 0.3) },
  { id: 'yt-studio', handle: STUDIO.name, owner: 'studio', platform: 'YouTube', source: 'metaads', followers: 412_000, reach14: 2_600_000, newFollowers: 5_200, er: 5.9, growth: 1.3, dailyReach: reachSeries(185_000, 0.18) },
  { id: 'tiktok', handle: STUDIO.handle, owner: 'studio', platform: 'TikTok', source: 'manual', followers: 0 },
  { id: 'ig-lumiere', handle: '@lumiereskin.ae', owner: 'client', platform: 'Instagram', source: 'metaads', followers: 91_800, reach14: 1_020_000, newFollowers: 2_410, er: 6.9, growth: 2.6, dailyReach: reachSeries(72_800, 0.16) },
  { id: 'ig-atlas', handle: '@atlas.outerwear', owner: 'client', platform: 'Instagram', source: 'metaads', followers: 64_200, reach14: 820_000, newFollowers: 3_900, er: 5.2, growth: 6.4, dailyReach: reachSeries(58_600, 0.4) },
  { id: 'ig-kinetic', handle: '@kineticfitness.ae', owner: 'client', platform: 'Instagram', source: 'metaads', followers: 48_600, reach14: 310_000, newFollowers: 210, er: 1.9, growth: 0.4, dailyReach: reachSeries(22_100, 0.3) },
];

export function buildCalendar(): CalEvent[] {
  const now = minutesNow();
  const at = (offset: number) => Math.round((now + offset) / 5) * 5;
  return [
    { id: 'e1', start: at(-150), end: at(-125), title: 'Edit review with Omar', titleAr: 'مراجعة المونتاج مع عمر', with: 'Omar', place: 'hq' },
    { id: 'e2', start: at(-20), end: at(25), title: 'Creator Hub · Shorts workshop', titleAr: 'مركز صناع المحتوى · ورشة شورتس', with: 'YouTube partner team', place: 'media' },
    { id: 'e3', start: at(55), end: at(100), title: 'Lumière Skin · deal call', titleAr: 'لوميير سكن · مكالمة الصفقة', with: 'Ananya Rao', place: 'difc' },
    { id: 'e4', start: at(160), end: at(220), title: 'Phone review shoot', titleAr: 'تصوير مراجعة الجوال', with: 'Omar, Dev', place: 'quoz' },
    { id: 'e5', start: at(300), end: at(345), title: 'Saffron Air · travel series planning', titleAr: 'سافرون إير · تخطيط سلسلة السفر', with: 'Partnerships team', place: 'dafz' },
  ];
}

export const INBOX: InboxThread[] = [
  { id: 'm1', from: 'Ananya Rao · Lumière Skin', subject: 'Partnership: vitamin C launch in November', subjectAr: 'شراكة: إطلاق فيتامين سي في نوفمبر', ageH: 2 },
  { id: 'm2', from: 'Atlas Outerwear', subject: 'Loved the Metro reel! Can we repost it?', subjectAr: 'عجبنا ريل المترو! نقدر نعيد نشره؟', ageH: 5 },
  { id: 'm3', from: 'Kinetic Fitness', subject: 'Ambassador renewal: next year’s terms', subjectAr: 'تجديد السفير: شروط السنة الجاية', ageH: 9 },
  { id: 'm4', from: 'YouTube', subject: 'Your video is trending in the UAE', subjectAr: 'فيديوك ترند في الإمارات', ageH: 14 },
  { id: 'm5', from: 'Velo EV accounts', subject: 'Invoice LN-0412 is 12 days overdue', subjectAr: 'الفاتورة LN-0412 متأخرة 12 يوم', ageH: 30 },
];

export const NOTES: MeetingNote[] = [
  {
    id: 'n1',
    title: 'Team sync · Week 42',
    when: 'Yesterday · 17:30',
    points: ['Metro Part 2 shoots tomorrow at 05:00', 'Every gifted item gets #gifted, no exceptions', 'Phone review thumbnail: test two versions'],
    pointsAr: ['الجزء الثاني من المترو ينصور باكر الساعة 5 الصبح', 'أي هدية لازم معها #gifted، بدون استثناء', 'صورة مراجعة الجوال: نجرب نسختين'],
  },
];

export function seedTasks(): Task[] {
  const today = dubaiDate();
  const now = Date.now();
  const t = (id: string, title: string, account: string, due: string | null, priority: Task['priority'] = 'normal', done = false, age = 1): Task => ({
    id,
    title,
    account,
    due,
    priority,
    done,
    doneAt: done ? now - 5 * 36e5 : null,
    createdAt: now - age * 864e5,
  });
  return [
    t('t1', 'Pin the jacket answer on the Metro reel', 'Atlas Outerwear', today, 'high'),
    t('t2', 'Send the Lumière Skin counter-offer after the call', 'Lumière Skin', today, 'high'),
    t('t3', 'Add #gifted to every Atlas Outerwear post', 'Atlas Outerwear', dubaiDate(1)),
    t('t4', 'Chase invoice LN-0412 with Velo EV', 'Velo EV', dubaiDate(2)),
    t('t5', "Approve this week's captions", STUDIO.name, today, 'normal', true, 2),
  ];
}

export function seedRoutines(): Routine[] {
  const y = dubaiDate(-1);
  const r = (id: string, days: string, time: string, title: string, titleAr: string, streak: number, account = STUDIO.name): Routine => ({
    id,
    title,
    titleAr,
    days,
    time,
    account,
    streak,
    lastDone: streak ? y : null,
  });
  return [
    r('r01', 'daily', '08:30', 'Morning brief: comments, DMs, channel stats and what needs me', 'الموجز الصباحي: التعليقات، الرسائل، أرقام القنوات، وشو يحتاجني', 12),
    r('r02', 'daily', '09:00', 'Reply to the top 20 comments on yesterday’s upload', 'الرد على أهم 20 تعليق على فيديو أمس', 9),
    r('r03', 'mon-fri', '09:30', 'Edit check-in with Omar, blockers only', 'متابعة المونتاج مع عمر، العوائق بس', 14),
    r('r04', 'tue,thu', '19:00', 'Reel goes live; reply to every comment in the first hour', 'نزول الريل، والرد على كل تعليق في أول ساعة', 5),
    r('r07', 'thu', '20:30', 'YouTube upload with Dev’s thumbnail A/B test', 'رفع فيديو يوتيوب مع تجربة صورتين من ديف', 6),
    r('r05', 'daily', '11:00', 'Scan the trend radar and save one sound or format', 'مسح رادار الترند وحفظ صوت أو فكرة وحدة', 8),
    r('r06', 'mon', '12:00', '5 pitches to brands that fit the audience: media kit first, never a discount', '5 عروض لعلامات تناسب الجمهور: ملف الوسائط أول، وبدون خصومات', 4),
    r('r11', 'wed', '14:00', 'Niche sweep: what other creators posted this week', 'متابعة المجال: شو نشر صناع المحتوى هالأسبوع', 3),
    r('r08', 'fri', '15:00', 'Disclosure check: every gifted or paid post carries #ad or #gifted', 'مراجعة الإفصاح: كل منشور مدفوع أو هدية فيه #ad أو #gifted', 4),
    r('r09', 'fri', '16:00', 'Week close: what worked, what flopped, what to try next', 'ختام الأسبوع: شو نجح، شو ما نجح، وشو نجرب بعده', 4),
    r('r10', 'daily', '18:00', 'Answer every brand email within 24 hours', 'الرد على كل إيميل من علامة خلال 24 ساعة', 7),
  ];
}

export const BUFFER = {
  posts: 94,
  reactions: 1_240_000,
  comments: 38_600,
  er: 7.1,
  daily: [3, 4, 2, 5, 3, 2, 4, 3, 4, 5, 3, 2, 3, 4, 3, 4, 5, 2, 3, 2, 4, 5, 3, 2, 4, 3, 2, 3, 5, 4],
  channels: [
    { name: `Instagram · ${STUDIO.handle}`, posts: 34 },
    { name: `TikTok · ${STUDIO.handle}`, posts: 28 },
    { name: `Stories · ${STUDIO.handle}`, posts: 12 },
    { name: `YouTube · ${STUDIO.name}`, posts: 12 },
    { name: 'Instagram · Atlas Outerwear repost', posts: 8 },
  ],
};

export const STORIES: Story[] = personalize<Story[]>([
  {
    id: 'cr-permit',
    headline: 'UAE Media Council: paid and gifted posts need the advertiser permit',
    headlineAr: 'مجلس الإمارات للإعلام: المنشورات المدفوعة والهدايا تحتاج تصريح المعلن',
    outlet: 'The National',
    approved: true,
    lane: 'uae',
    ageH: 3,
    virality: 87,
    laneMatch: 96,
    url: 'https://www.thenationalnews.com/',
    summary: 'Gifted items count. Any post that promotes a product, paid or gifted, needs the permit and a clear disclosure. Lifestyle creators tagging gifted fashion were flagged most this month.',
    summaryAr: 'الهدايا تنحسب. أي منشور يروّج لمنتج، مدفوع أو هدية، يحتاج التصريح وإفصاح واضح. أكثر الحسابات اللي انذكرت هالشهر صناع لايف ستايل يتاقون أزياء هدايا.',
    why: 'The Metro reel shows the Atlas jacket. The pinned comment needs #gifted before it goes live.',
    whyAr: 'ريل المترو فيه جاكيت أطلس. التعليق المثبت لازم فيه #gifted قبل لا ينزل.',
    client: 'Atlas Outerwear',
    post: [
      'HOOK · Got something for free? Your followers need to know.',
      'The UAE Media Council has restated it: gifted counts as advertising.',
      'Paid or gifted, the post needs the permit and a clear #ad or #gifted.',
      'What {client} does: every gifted item is tagged before anything goes live.',
      'CLOSE · Trust is the whole job. Disclose it.',
    ],
    postAr: [
      'الافتتاحية · وصلك شي ببلاش؟ متابعينك لازم يعرفون.',
      'مجلس الإمارات للإعلام أكد: الهدية تنحسب إعلان.',
      'مدفوع أو هدية، المنشور يحتاج التصريح و#ad أو #gifted واضح.',
      'اللي تسويه {client}: أي هدية تنكتب قبل لا ينزل أي شي.',
      'الختام · الثقة هي الشغل كله. أفصح عنها.',
    ],
    take: [
      'Gifted is advertising in the UAE. If it is in the shot, it gets #gifted.',
      'الهدية إعلان في الإمارات. إذا طلعت في التصوير، لازم #gifted.',
    ],
  },
  {
    id: 'cr-shorts',
    headline: 'YouTube Shorts views in the Gulf up 40% year on year',
    headlineAr: 'مشاهدات يوتيوب شورتس في الخليج ارتفعت 40% عن السنة اللي فاتت',
    outlet: 'Campaign ME',
    approved: true,
    lane: 'uae',
    ageH: 8,
    virality: 82,
    laneMatch: 91,
    url: 'https://campaignme.com/',
    summary: 'Short vertical video is now the fastest-growing format on YouTube in the region. Shorts that cross-post a viral Reel within 24 hours perform best.',
    summaryAr: 'الفيديو العمودي القصير صار أسرع صيغة نمواً على يوتيوب في المنطقة. الشورتس اللي تعيد نشر ريل منتشر خلال 24 ساعة تحقق أفضل نتيجة.',
    why: 'Cross-post the Metro reel to Shorts tonight while it is still climbing.',
    whyAr: 'انشروا ريل المترو على شورتس الليلة وهو للحين يطلع.',
    client: '{client}',
    post: [
      'HOOK · Your best Reel deserves a second life.',
      'Shorts views in the Gulf are up 40% on last year.',
      'The winners post the same clip within 24 hours, re-captioned for YouTube.',
      'CLOSE · One shoot, two platforms, double the reach.',
    ],
    postAr: [
      'الافتتاحية · أفضل ريل عندك يستاهل فرصة ثانية.',
      'مشاهدات الشورتس في الخليج زادت 40% عن السنة اللي فاتت.',
      'اللي ينجحون ينشرون نفس المقطع خلال 24 ساعة بوصف جديد ليوتيوب.',
      'الختام · تصوير واحد، منصتين، ووصول ضعف.',
    ],
    take: [
      'Shorts is where Gulf audiences are growing fastest. Every viral Reel should land there within a day.',
      'الشورتس هي أسرع مكان ينمو فيه جمهور الخليج. أي ريل منتشر لازم يوصلها خلال يوم.',
    ],
  },
  {
    id: 'cr-reels',
    headline: 'Instagram now ranks Reels on saves and shares over likes',
    headlineAr: 'إنستغرام صار يرتّب الريلز على الحفظ والمشاركة أكثر من اللايكات',
    outlet: 'Reuters',
    approved: true,
    lane: 'world',
    ageH: 15,
    virality: 78,
    laneMatch: 88,
    url: 'https://www.reuters.com/',
    summary: 'Saves and sends now weigh more than likes in Reels ranking. Answering the top question in a pinned comment keeps a Reel in circulation.',
    summaryAr: 'الحفظ والإرسال صاروا أهم من اللايكات في ترتيب الريلز. إذا جاوبت على أكثر سؤال في تعليق مثبت، الريل يظل ينتشر.',
    why: 'Saves on the Metro reel are up 6×. Pin the answer people are asking for.',
    whyAr: 'الحفظ على ريل المترو زاد 6 أضعاف. ثبّتوا الجواب اللي الناس تسأل عنه.',
    client: '{client}',
    post: [
      'HOOK · Stop chasing likes.',
      'Instagram now ranks Reels on saves and shares.',
      'Make something people want to keep, then answer their question in a pinned comment.',
      'CLOSE · Saved beats liked.',
    ],
    postAr: [
      'الافتتاحية · لا تطارد اللايكات.',
      'إنستغرام صار يرتّب الريلز على الحفظ والمشاركة.',
      'سوّ شي الناس تبي تحتفظ فيه، وبعدين جاوب سؤالهم في تعليق مثبت.',
      'الختام · المحفوظ يغلب الملايك.',
    ],
    take: [
      'Likes are applause. Saves are intent. The algorithm now pays for intent.',
      'اللايك تصفيق، والحفظ نية. والخوارزمية صارت تكافئ النية.',
    ],
  },
  {
    id: 'cr-ksa',
    headline: 'Saudi beauty brands double creator budgets for Q4',
    headlineAr: 'علامات التجميل السعودية تضاعف ميزانيات صناع المحتوى للربع الرابع',
    outlet: 'Gulf News',
    approved: true,
    lane: 'gcc',
    ageH: 21,
    virality: 74,
    laneMatch: 84,
    url: 'https://gulfnews.com/',
    summary: 'Saudi beauty brands are doubling creator spend for the fourth quarter and prefer creators whose audiences span the UAE and KSA. Rates are holding.',
    summaryAr: 'علامات التجميل السعودية تضاعف صرفها على صناع المحتوى للربع الرابع، وتفضّل اللي جمهورهم بين الإمارات والسعودية. الأسعار ثابتة.',
    why: 'Hold the rate on the Lumière Skin deal. Demand for this audience is rising.',
    whyAr: 'ثبّتوا السعر في صفقة لوميير سكن. الطلب على هالجمهور قاعد يزيد.',
    client: 'Lumière Skin',
    post: [
      'HOOK · Beauty brands just doubled their creator budgets.',
      'Saudi beauty brands are spending twice as much on creators this quarter.',
      'They want audiences that span the UAE and KSA.',
      'CLOSE · Know your audience map. It is your rate card.',
    ],
    postAr: [
      'الافتتاحية · علامات التجميل ضاعفت ميزانية صناع المحتوى.',
      'علامات التجميل السعودية تصرف الضعف على صناع المحتوى هالربع.',
      'يبون جمهور بين الإمارات والسعودية.',
      'الختام · اعرف خريطة جمهورك، هي جدول أسعارك.',
    ],
    take: [
      'Q4 beauty budgets doubled in KSA. Creators with a UAE–KSA audience should not discount.',
      'ميزانيات التجميل تضاعفت في السعودية. اللي جمهوره إماراتي سعودي لا يعطي خصومات.',
    ],
  },
]);

/** Found on the next sweep: newer than anything on the wire. */
export const INCOMING: Story = personalize<Story>({
  id: 'cr-fresh',
  headline: 'Trending audio: the “5 AM in the city” sound passes 90K Reels',
  headlineAr: 'صوت ترند: «الساعة 5 في المدينة» تجاوز 90 ألف ريل',
  outlet: 'Instagram trends',
  approved: true,
  lane: 'uae',
  ageH: 1,
  virality: 90,
  laneMatch: 97,
  url: 'https://www.instagram.com/',
  summary: 'The sound behind the viral Metro reel crossed 90,000 Reels overnight, mostly from Dubai and Riyadh.',
  summaryAr: 'الصوت اللي في ريل المترو المنتشر تجاوز 90 ألف ريل في ليلة، أغلبها من دبي والرياض.',
  why: 'Use the same audio for Part 2 tomorrow while the trend lasts.',
  whyAr: 'استخدموا نفس الصوت للجزء الثاني باكر وهو للحين ترند.',
  client: '{client}',
  post: [
    'HOOK · The sound you heard in my Metro reel is everywhere now.',
    '90,000 Reels and counting, most of them from Dubai and Riyadh.',
    'Part 2 drops Thursday, same sound, same 5 AM.',
    'CLOSE · Set your alarm.',
  ],
  postAr: [
    'الافتتاحية · الصوت اللي سمعتوه في ريل المترو صار في كل مكان.',
    '90 ألف ريل وأكثر، أغلبها من دبي والرياض.',
    'الجزء الثاني ينزل الخميس، نفس الصوت ونفس الساعة 5.',
    'الختام · اضبطوا المنبه.',
  ],
  take: [
    'Our Metro sound is now a Gulf trend. Part 2 rides it.',
    'صوت المترو صار ترند في الخليج. والجزء الثاني بيركب عليه.',
  ],
});

export const PIPELINE_STATS = { shortlist: 36, invitesSent: 22, dm: 11, replied: 4, booked: 3 };

export const PACK: ContentPack = {
  ...weekLabel(),
  theme: 'Real mornings, real results',
  offer: 'Comment "5AM" for the morning routine guide',
  decisionsOpen: 2,
  slots: [
    { day: 'Tue', lang: 'EN', pillar: 'Metro Part 2', slot: '19:00', status: 'scheduled' },
    { day: 'Wed', lang: 'AR', pillar: 'Platform update', slot: '20:00', status: 'ready' },
    { day: 'Thu', lang: 'EN', pillar: 'Phone review', slot: '20:30', status: 'gap' },
    { day: 'Daily', lang: 'EN', pillar: '20 replies', slot: '11:00', status: 'routine' },
  ],
};

export const OUTREACH: Person[] = [
  { n: 'Mariam Haddad', r: 'Brand Manager', c: 'Tamr & Co', sector: 'Food', u: 'https://www.linkedin.com/', s: 'replied', dmAt: Date.now() - 2 * 864e5 },
  { n: 'Karim Farouk', r: 'Head of Marketing', c: 'Dune Motors', sector: 'Automotive', u: 'https://www.linkedin.com/', s: 'dm', dmAt: Date.now() - 864e5 },
  { n: 'Hana Yusuf', r: 'Founder', c: 'Palm Pilates', sector: 'Fitness', u: 'https://www.instagram.com/', s: 'invited', dmAt: null },
  { n: 'Rashid Al Ketbi', r: 'Marketing Director', c: 'Sky Lounge Hotels', sector: 'Travel', u: 'https://www.linkedin.com/', s: 'invited', dmAt: null },
  { n: 'Lina Aziz', r: 'Partnerships Lead', c: 'Pixel Phones ME', sector: 'Tech', u: 'https://www.linkedin.com/', s: 'shortlist', dmAt: null },
  { n: 'Vikram Shah', r: 'CEO', c: 'Harbour Coffee Roasters', sector: 'F&B', u: 'https://www.instagram.com/', s: 'booked', dmAt: Date.now() - 4 * 864e5 },
];

const asOf = dubaiDate(-1);

export const COMPETITORS: Competitor[] = [
  { id: 'c1', name: 'Noura Daily', handle: '@noura.daily', lane: 'performance', platform: 'Instagram', followers: 540_000, eng: 5.8, growth: 2.1, asOf, url: 'https://www.instagram.com/', published: { hook: 'My 5-minute Dubai summer routine', format: 'Reel · 42 s', views: 1_300_000 } },
  { id: 'c2', name: 'Zaid in Dubai', handle: '@zaid.in.dubai', lane: 'performance', platform: 'Instagram', followers: 286_000, eng: 6.4, growth: 3.2, asOf, url: 'https://www.instagram.com/', published: { hook: 'Things nobody tells you about moving to Dubai', format: 'Carousel · 8 slides', views: 410_000 } },
  { id: 'c3', name: 'Mornings with Maya', handle: '@mornings.with.maya', lane: 'performance', platform: 'Instagram', followers: 198_000, eng: 7.9, growth: 4.6, asOf, url: 'https://www.instagram.com/', published: { hook: 'I woke up at 5 AM for 30 days', format: 'Reel · 55 s', views: 880_000 } },
  { id: 'c4', name: 'Tech with Tariq', handle: '@techwithtariq', lane: 'creative', platform: 'Instagram', followers: 410_000, eng: 4.9, growth: 1.8, asOf, url: 'https://www.instagram.com/', published: { hook: 'The phone I would actually buy this year', format: 'Reel · 38 s', views: 620_000 } },
  { id: 'c5', name: 'Gadget Gulf', handle: '@gadget.gulf', lane: 'creative', platform: 'Instagram', followers: 175_000, eng: 5.5, growth: 2.7, asOf, url: 'https://www.instagram.com/', published: { hook: 'Three gadgets that survive a Dubai summer', format: 'Reel · 47 s', views: 240_000 } },
  { id: 'c6', name: 'Omar Explains', handle: 'omar-explains', lane: 'b2b', platform: 'YouTube', followers: 1_200_000, eng: 4.2, growth: 1.1, asOf, url: 'https://www.youtube.com/', published: { hook: 'I tested every Dubai metro line in one day', format: 'Video · 14 min', views: 1_900_000 } },
  { id: 'c7', name: 'Dubai Diaries', handle: 'dubai-diaries', lane: 'b2b', platform: 'YouTube', followers: 380_000, eng: 5.1, growth: 2.4, asOf, url: 'https://www.youtube.com/', published: { hook: 'A week of 5 AM mornings in Dubai', format: 'Video · 11 min', views: 520_000 } },
];

export function seedSettings(): Settings {
  return {
    mission: 'Every channel checked before 9. Tomorrow’s uploads drafted today, and every number on this board traced to its source.',
    missionAr: 'كل القنوات تنراجع قبل الساعة 9. فيديوهات باكر مكتوبة اليوم، وكل رقم على هاللوحة له مصدر.',
    privacyProfile: 'full',
    triggerWord: 'privacy mode',
    replyLine: 'On it',
    radar: 'hq',
    liProfileFollowers: 0,
    liProfileAt: dubaiDate(-3),
    tiktokFollowers: 126_000,
    tiktokAt: dubaiDate(-2),
    breakingThreshold: 85,
    connectors: { metaads: true, linkedin: true, calendar: true, gmail: true, notion: true, buffer: true, firecrawl: true },
  };
}

export function seedMetrics(): Record<string, MetricsRecord> {
  const d = dubaiDate(-30);
  return { [d]: { date: d, reach14: 3_200_000, er: 6.8, followers: 305_600, pulse: 74 } };
}

export const COPY: RoomCopy = {
  tickerSource: 'INSTAGRAM',
  tickerAlert: { en: 'INSTAGRAM · METRO REEL · 4.1× USUAL PACE · VIRAL', ar: 'إنستغرام · ريل المترو · 4.1 أضعاف المعتاد · منتشر' },
  tickerNews: 'TREND RADAR',
  tickerPosts: 'UPLOADS',
  tickerPipeline: { en: 'BRAND DEALS', ar: 'صفقات العلامات', unitEn: 'SIGNED', unitAr: 'موقّعة' },
  inboxLine: {
    en: 'Inbox: 4 threads need you from the last 2 days, including the Lumière Skin offer.',
    ar: 'البريد: 4 رسائل تحتاجك من آخر يومين، منها عرض لوميير سكن.',
  },
  taskExample: {
    en: 'What’s the task? For example: “Add a task: brief Omar on the Metro Part 2 edit tomorrow”.',
    ar: 'شو المهمة؟ مثلاً: "أضف مهمة: موجز لعمر عن مونتاج الجزء الثاني من المترو باكر".',
  },
  oneThing: 'pin the jacket answer before 11:00',
};
