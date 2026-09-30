// Demo snapshot for the Control Room. In a live build every value comes from a connector or a
// dated manual snapshot; here they are fixed sample values for {client}, labelled as such.
import { client } from '../../data/client';
import { personalize, prospect } from '../../data/prospect';
import { dubaiDate, dubaiParts, minutesNow } from './time';
import type {
  CalEvent,
  Channel,
  Competitor,
  ContentPack,
  InboxThread,
  MeetingNote,
  MetricsRecord,
  Person,
  Place,
  Routine,
  Settings,
  Story,
  Task,
} from './types';

const slug = prospect.name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'studio';

export const STUDIO = {
  name: prospect.name,
  handle: `@${slug}`,
  director: client.approver,
  directorRole: client.approverRole,
};

export const ACCOUNTS = [STUDIO.name, 'Urban Brew', 'Lumière Skin', 'Glow & Co', 'Saffron Air'];

export const PLACES: Place[] = personalize([
  { id: 'hq', name: '{client} HQ · Dubai Design District', nameAr: 'مقر {client} · حي دبي للتصميم', lat: 25.1873, lon: 55.2976 },
  { id: 'media', name: 'Urban Brew · Dubai Media City', nameAr: 'أوربان برو · مدينة دبي للإعلام', lat: 25.0955, lon: 55.156 },
  { id: 'difc', name: 'Lumière Skin · DIFC', nameAr: 'لوميير سكن · مركز دبي المالي', lat: 25.2125, lon: 55.2797 },
  { id: 'quoz', name: 'Shoot studio · Al Quoz', nameAr: 'استوديو التصوير · القوز', lat: 25.137, lon: 55.227 },
  { id: 'dafz', name: 'Saffron Air · Airport Freezone', nameAr: 'سافرون إير · المنطقة الحرة للمطار', lat: 25.2622, lon: 55.3786 },
  { id: 'marina', name: 'Glow & Co · Dubai Marina', nameAr: 'غلو آند كو · دبي مارينا', lat: 25.0805, lon: 55.1403 },
  { id: 'sharjah', name: 'Qafila Foods · Sharjah', nameAr: 'قافلة فودز · الشارقة', lat: 25.3263, lon: 55.3843 },
] satisfies Place[]);

const reachSeries = (base: number, wobble: number) =>
  Array.from({ length: 14 }, (_, i) => Math.round(base * (1 + Math.sin(i * 1.3) * wobble + (i % 4 === 0 ? wobble * 0.6 : 0))));

export const CHANNELS: Channel[] = [
  { id: 'ig-studio', handle: STUDIO.handle, owner: 'studio', platform: 'Instagram', source: 'metaads', followers: 38_400, reach14: 412_000, newFollowers: 1_180, er: 5.8, growth: 3.1, dailyReach: reachSeries(29_400, 0.12) },
  { id: 'li-studio', handle: STUDIO.name, owner: 'studio', platform: 'LinkedIn page', source: 'linkedin', followers: 12_600, reach14: 58_300, newFollowers: 420, er: 4.6, growth: 3.4, dailyReach: reachSeries(4_160, 0.22) },
  { id: 'li-profile', handle: STUDIO.director, owner: 'studio', platform: 'LinkedIn profile', source: 'manual', followers: 0 },
  { id: 'tiktok', handle: STUDIO.handle, owner: 'studio', platform: 'TikTok', source: 'manual', followers: 0 },
  { id: 'ig-glow', handle: '@glowandco.ae', owner: 'client', platform: 'Instagram', source: 'metaads', followers: 91_800, reach14: 1_020_000, newFollowers: 2_410, er: 6.9, growth: 2.6, dailyReach: reachSeries(72_800, 0.16) },
  { id: 'ig-brew', handle: '@urbanbrew.ae', owner: 'client', platform: 'Instagram', source: 'metaads', followers: 64_200, reach14: 520_000, newFollowers: 310, er: 2.1, growth: 0.5, dailyReach: reachSeries(37_100, 0.34) },
  { id: 'fb-saffron', handle: 'Saffron Air', owner: 'client', platform: 'Facebook', source: 'metaads', followers: 148_000, reach14: 690_000, newFollowers: 900, er: 1.8, growth: 0.6, dailyReach: reachSeries(49_300, 0.2) },
  { id: 'li-saffron', handle: 'Saffron Air', owner: 'client', platform: 'LinkedIn page', source: 'linkedin', followers: 22_400, reach14: 88_000, newFollowers: 510, er: 3.9, growth: 2.3, dailyReach: reachSeries(6_280, 0.26) },
];

export function buildCalendar(): CalEvent[] {
  const now = minutesNow();
  const at = (offset: number) => Math.round((now + offset) / 5) * 5;
  return [
    { id: 'e1', start: at(-150), end: at(-125), title: 'Stand-up · pods A–C', titleAr: 'الاجتماع الصباحي · الفرق A–C', with: 'All pods', place: 'hq' },
    { id: 'e2', start: at(-20), end: at(25), title: 'Urban Brew · weekly performance call', titleAr: 'أوربان برو · مكالمة الأداء الأسبوعية', with: 'Rohan M.', place: 'media' },
    { id: 'e3', start: at(55), end: at(100), title: 'Lumière Skin · discovery call', titleAr: 'لوميير سكن · مكالمة استكشاف', with: 'Ananya Rao', place: 'difc' },
    { id: 'e4', start: at(160), end: at(220), title: 'Glow & Co · reel shoot', titleAr: 'غلو آند كو · تصوير ريلز', with: 'Pod B crew', place: 'quoz' },
    { id: 'e5', start: at(300), end: at(345), title: 'Saffron Air · Q4 plan review', titleAr: 'سافرون إير · مراجعة خطة الربع الرابع', with: 'Marketing team', place: 'dafz' },
  ];
}

export const INBOX: InboxThread[] = [
  { id: 'm1', from: 'Ananya Rao · Lumière Skin', subject: 'Brief: vitamin C serum launch in November', subjectAr: 'موجز: إطلاق سيروم فيتامين سي في نوفمبر', ageH: 2 },
  { id: 'm2', from: 'Rohan M. · Urban Brew', subject: 'Is something wrong with the ads this week?', subjectAr: 'هل في مشكلة في الإعلانات هالأسبوع؟', ageH: 6 },
  { id: 'm3', from: 'Saffron Air', subject: 'Escalation: festive fares creative still unapproved', subjectAr: 'تصعيد: تصميم عروض الموسم ما انعتمد للحين', ageH: 9 },
  { id: 'm4', from: 'Meta Ads', subject: 'Daily digest · Urban Brew ROAS 2.9× → 1.8×', subjectAr: 'الملخص اليومي · عائد أوربان برو من 2.9× إلى 1.8×', ageH: 14 },
  { id: 'm5', from: 'Zoho Books', subject: 'Invoice NS-2291 is 12 days overdue', subjectAr: 'الفاتورة NS-2291 متأخرة 12 يوم', ageH: 30 },
];

export const NOTES: MeetingNote[] = [
  {
    id: 'n1',
    title: 'Pod B weekly · Glow & Co',
    when: 'Yesterday · 17:30',
    points: ['Reel shoot moved to today, Al Quoz studio', 'Every creator post carries the paid-disclosure line', 'Monthly report goes out Thursday 10:00'],
    pointsAr: ['تصوير الريلز انتقل لليوم في استوديو القوز', 'كل منشور مؤثر لازم فيه سطر الإفصاح المدفوع', 'التقرير الشهري يطلع الخميس الساعة 10'],
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
    t('t1', 'Refresh the three oldest Urban Brew ads before Friday', 'Urban Brew', today, 'high'),
    t('t2', 'Send the Lumière Skin proposal after the discovery call', 'Lumière Skin', today, 'high'),
    t('t3', 'Add the paid-disclosure line to Glow & Co creator briefs', 'Glow & Co', dubaiDate(1)),
    t('t4', 'Chase invoice NS-2291 with Saffron Air finance', 'Saffron Air', dubaiDate(2)),
    t('t5', `Approve this week's ${STUDIO.name} LinkedIn pack`, STUDIO.name, today, 'normal', true, 2),
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
    r('r01', 'daily', '08:30', 'Morning brief: calendar, inbox, spend, and what needs a human', 'الموجز الصباحي: التقويم، البريد، الصرف، وشو يحتاج تدخل', 12),
    r('r02', 'daily', '09:00', 'Check spend and ROAS across all 12 ad accounts', 'مراجعة الصرف والعائد في كل حسابات الإعلانات الـ12', 9),
    r('r03', 'mon-fri', '09:30', 'Stand-up with pods A–C, blockers only', 'اجتماع صباحي مع الفرق A–C، العوائق بس', 14),
    r('r04', 'tue,thu', '10:00', `${STUDIO.name} LinkedIn post; reply to every comment within an hour`, `منشور لينكدإن لـ${STUDIO.name}، والرد على كل تعليق خلال ساعة`, 5),
    r('r07', 'thu', '10:00', 'Weekly client reports out by 10:00', 'تقارير العملاء الأسبوعية تطلع قبل الساعة 10', 6),
    r('r05', 'daily', '11:00', 'Scan the newswire and pick one story for a client post', 'مسح الأخبار واختيار خبر واحد لمنشور عميل', 8),
    r('r06', 'mon', '12:00', '10 outreach messages to UAE brand leads: the free growth audit, never a fee', '10 رسائل لمسؤولي علامات في الإمارات: تدقيق النمو المجاني، وبدون ذكر أي رسوم', 4),
    r('r11', 'wed', '14:00', 'Rival sweep: what other agencies published this week', 'متابعة المنافسين: شو نشرت الوكالات الثانية هالأسبوع', 3),
    r('r08', 'fri', '15:00', 'Creative fatigue review: anything live 30+ days comes down', 'مراجعة إرهاق الإعلانات: أي إعلان شغال أكثر من 30 يوم ينزل', 4),
    r('r09', 'fri', '16:00', 'Week close: what shipped, what slipped, what needs a decision', 'ختام الأسبوع: شو انطلق، شو تأخر، وشو يحتاج قرار', 4),
    r('r10', 'daily', '18:00', 'Reply to every warm lead within 24 hours', 'الرد على كل عميل محتمل مهتم خلال 24 ساعة', 7),
  ];
}

export const BUFFER = {
  posts: 126,
  reactions: 48_200,
  comments: 3_140,
  er: 4.4,
  daily: [4, 5, 3, 6, 4, 2, 3, 5, 4, 6, 5, 3, 2, 4, 5, 4, 6, 3, 4, 2, 5, 6, 4, 3, 5, 4, 2, 4, 6, 5],
  channels: [
    { name: 'Instagram · Glow & Co', posts: 38 },
    { name: 'Instagram · Urban Brew', posts: 30 },
    { name: 'Facebook · Saffron Air', posts: 24 },
    { name: `LinkedIn · ${STUDIO.name}`, posts: 18 },
    { name: `Instagram · ${STUDIO.name}`, posts: 16 },
  ],
};

export const STORIES: Story[] = personalize<Story[]>([
  {
    id: 'ae-meta',
    headline: 'Dubai D2C brands see Meta frequency climb past 6 before November launches',
    headlineAr: 'علامات البيع المباشر في دبي تشوف تكرار إعلانات ميتا يتجاوز 6 قبل إطلاقات نوفمبر',
    outlet: 'The National',
    approved: true,
    lane: 'uae',
    ageH: 4,
    virality: 88,
    laneMatch: 95,
    url: 'https://www.thenationalnews.com/',
    summary: 'The same people are seeing tired ads, and the auction is charging more for them. The drop shows up as creative fatigue, not a tracking fault.',
    summaryAr: 'نفس الناس يشوفون إعلانات مستهلكة، والمزاد يرفع السعر عليها. الهبوط سببه إرهاق الإعلان، مو خلل في التتبع.',
    why: 'Same shape as the Urban Brew alert already on the desk. Refresh the oldest ads before launch week.',
    whyAr: 'نفس نمط تنبيه أوربان برو اللي عندنا. جددوا أقدم الإعلانات قبل أسبوع الإطلاق.',
    client: 'Urban Brew',
    post: [
      'HOOK · Seen the same ad six times this week? So has everyone else in Dubai.',
      'Frequency on UAE D2C accounts has passed 6 heading into November.',
      'When people keep seeing a tired ad, the auction charges more to show it again.',
      'What {client} does for its clients: retire anything older than 30 days and brief three fresh hooks from what already worked.',
      'CLOSE · Fresh creative is cheaper than a bigger budget.',
    ],
    postAr: [
      'الافتتاحية · شفت نفس الإعلان ست مرات هالأسبوع؟ كل دبي شافته بعد.',
      'تكرار الإعلانات في حسابات البيع المباشر بالإمارات تجاوز 6 قبل نوفمبر.',
      'لما الناس يشوفون إعلان مستهلك، المزاد يرفع السعر عشان يعرضه مرة ثانية.',
      'اللي تسويه {client} لعملائها: أي إعلان عمره أكثر من 30 يوم ينزل، ونكتب ثلاث افتتاحيات جديدة من اللي نجح.',
      'الختام · الإعلان الجديد أرخص من ميزانية أكبر.',
    ],
    take: [
      'Frequency past 6 is not a budget problem. It is a creative problem, and November will make it an expensive one.',
      'تكرار فوق 6 مو مشكلة ميزانية، مشكلة إبداع. ونوفمبر بيخليها مشكلة غالية.',
    ],
  },
  {
    id: 'ae-tiktok',
    headline: 'TikTok tightens shopping-ad disclosure for UAE creators',
    headlineAr: 'تيك توك تشدد قواعد الإفصاح عن إعلانات التسوق لصناع المحتوى في الإمارات',
    outlet: 'Campaign ME',
    approved: true,
    lane: 'uae',
    ageH: 14,
    virality: 81,
    laneMatch: 90,
    url: 'https://campaignme.com/',
    summary: 'A paid creator post in the UAE now has to say it was paid for. Creators who blur a paid mention are being limited, and beauty is called out.',
    summaryAr: 'أي منشور مدفوع لصانع محتوى في الإمارات لازم يوضح إنه مدفوع. اللي يخفي هالشي ينحد وصوله، والتجميل من الفئات المذكورة.',
    why: 'Glow & Co creator briefs need the disclosure line, or the seeding budget sits in review.',
    whyAr: 'موجزات صناع المحتوى لغلو آند كو تحتاج سطر الإفصاح، وإلا ميزانية التوزيع تتعطل في المراجعة.',
    client: 'Glow & Co',
    post: [
      'HOOK · "Paid partnership" just became the most important line in your creator brief.',
      'TikTok is enforcing shopping-ad disclosure for UAE creators before the gifting season.',
      'Posts that blur a paid mention are being limited. Beauty is one of the categories named.',
      'The fix is simple: write the disclosure into the brief, not into the apology.',
      'CLOSE · Honest labels keep the reach. Hidden ones lose it.',
    ],
    postAr: [
      'الافتتاحية · "شراكة مدفوعة" صارت أهم سطر في موجز صانع المحتوى.',
      'تيك توك تطبق الإفصاح عن إعلانات التسوق لصناع المحتوى في الإمارات قبل موسم الهدايا.',
      'المنشورات اللي تخفي إنها مدفوعة ينحد وصولها، والتجميل من الفئات المذكورة.',
      'الحل بسيط: اكتب الإفصاح في الموجز، مو في الاعتذار.',
      'الختام · الوضوح يحافظ على الوصول، والإخفاء يخسره.',
    ],
    take: [
      'Creator disclosure in the UAE is no longer a legal footnote. It is a reach decision.',
      'الإفصاح في محتوى المؤثرين بالإمارات ما عاد ملاحظة قانونية، صار قرار وصول.',
    ],
  },
  {
    id: 'ae-noon',
    headline: 'noon opens Q4 brand placements to performance agencies',
    headlineAr: 'نون تفتح مساحات العلامات للربع الرابع أمام وكالات التسويق بالأداء',
    outlet: 'Reuters',
    approved: false,
    lane: 'uae',
    ageH: 9,
    virality: 74,
    laneMatch: 86,
    url: 'https://www.reuters.com/',
    summary: 'Context only. Retail-media slots for the quarter are open to agencies, not only in-house brand teams; November inventory is already being held.',
    summaryAr: 'للسياق فقط. مساحات إعلانات التجزئة لهالربع مفتوحة للوكالات، مو بس لفرق العلامات الداخلية، ومخزون نوفمبر قاعد ينحجز.',
    why: 'Lumière Skin’s launch can sit here beside Meta, if the proposal names the placement this week.',
    whyAr: 'إطلاق لوميير سكن ممكن يكون هني جنب ميتا، إذا العرض ذكر المساحة هالأسبوع.',
    client: 'Lumière Skin',
    post: [
      'HOOK · Retail media is not a marketplace thing any more. It is a launch channel.',
      'Q4 brand placements are opening to performance agencies, and November slots are already held.',
      'The better placements expect a landing page and a product feed on day one.',
      'Source note: international press, used for context. Confirm with the marketplace before quoting.',
      'CLOSE · The brands that plan retail media in September own the home page in November.',
    ],
    postAr: [
      'الافتتاحية · إعلانات التجزئة ما عادت شي خاص بالمتاجر، صارت قناة إطلاق.',
      'مساحات العلامات للربع الرابع تنفتح لوكالات الأداء، ومساحات نوفمبر قاعدة تنحجز.',
      'أفضل المساحات تطلب صفحة هبوط وملف منتجات من أول يوم.',
      'ملاحظة المصدر: صحافة دولية للسياق. تأكد من المتجر قبل الاقتباس.',
      'الختام · اللي يخطط لإعلانات التجزئة في سبتمبر يملك الصفحة الرئيسية في نوفمبر.',
    ],
    take: [
      'Retail media is becoming a launch channel in the UAE. Plan it with Meta, not after it.',
      'إعلانات التجزئة صارت قناة إطلاق في الإمارات. خطط لها مع ميتا، مو بعدها.',
    ],
  },
  {
    id: 'ae-saudi',
    headline: 'Saudi study: ads older than 30 days lose about a third of ROAS',
    headlineAr: 'دراسة سعودية: الإعلانات الأقدم من 30 يوم تخسر حوالي ثلث العائد',
    outlet: 'Gulf News',
    approved: true,
    lane: 'gcc',
    ageH: 22,
    virality: 63,
    laneMatch: 82,
    url: 'https://gulfnews.com/',
    summary: 'Ads left running past 30 days lose about a third of their return. Frequency climbs first, then the hook weakens. It is not a pixel problem.',
    summaryAr: 'الإعلانات اللي تستمر أكثر من 30 يوم تخسر حوالي ثلث عائدها. التكرار يرتفع أول، بعدين الافتتاحية تضعف. المشكلة مو في البكسل.',
    why: 'The proof line when a client asks why last month’s winning ad should come down.',
    whyAr: 'هذا الدليل لما العميل يسأل ليش إعلان الشهر الماضي الناجح لازم ينزل.',
    client: 'Urban Brew',
    post: [
      'HOOK · Your best ad has an expiry date. It is about 30 days.',
      'New GCC account data: ads left running past a month lose about a third of their return.',
      'Frequency rises first. Then the hook stops working.',
      'It is not tracking and it is not the pixel. It is fatigue.',
      'CLOSE · Put a refresh date on every ad the day it launches.',
    ],
    postAr: [
      'الافتتاحية · أفضل إعلان عندك له تاريخ انتهاء، تقريباً 30 يوم.',
      'بيانات جديدة من الخليج: الإعلانات اللي تستمر أكثر من شهر تخسر حوالي ثلث عائدها.',
      'التكرار يرتفع أول، بعدين الافتتاحية توقف تشتغل.',
      'المشكلة مو التتبع ولا البكسل، المشكلة إرهاق.',
      'الختام · حط تاريخ تجديد لكل إعلان من يوم إطلاقه.',
    ],
    take: [
      'Every ad has a shelf life. In the GCC it is about 30 days, and it costs a third of your ROAS to ignore it.',
      'كل إعلان له عمر. في الخليج حوالي 30 يوم، وتجاهله يكلفك ثلث العائد.',
    ],
  },
  {
    id: 'ae-eu',
    headline: 'EU influencer rules begin to cover UAE creators selling into Europe',
    headlineAr: 'قواعد المؤثرين الأوروبية تبدأ تشمل صناع المحتوى في الإمارات اللي يبيعون لأوروبا',
    outlet: 'Reuters',
    approved: false,
    lane: 'world',
    ageH: 31,
    virality: 52,
    laneMatch: 64,
    url: 'https://www.reuters.com/',
    summary: 'Context only. The disclosure rule reaches anyone paid to promote a product to EU buyers, even if they film in Dubai.',
    summaryAr: 'للسياق فقط. قاعدة الإفصاح تشمل أي أحد يروّج لمنتج لمشترين في أوروبا، حتى لو يصوّر في دبي.',
    why: 'Flag the Glow & Co creators who ship to Europe before a European retailer asks for the contract.',
    whyAr: 'حددوا صناع محتوى غلو آند كو اللي يشحنون لأوروبا قبل ما يطلب بائع أوروبي العقد.',
    client: 'Glow & Co',
    post: [
      'HOOK · Filming in Dubai does not keep you out of European rules.',
      'EU influencer disclosure now reaches creators paid to sell to EU buyers, wherever they film.',
      'Source note: international press, used for context only.',
      'CLOSE · If your buyers are in Europe, your disclosure should be too.',
    ],
    postAr: [
      'الافتتاحية · التصوير في دبي ما يطلعك من القواعد الأوروبية.',
      'إفصاح المؤثرين الأوروبي صار يشمل صناع المحتوى اللي يبيعون لمشترين في أوروبا، وين ما صوروا.',
      'ملاحظة المصدر: صحافة دولية للسياق فقط.',
      'الختام · إذا مشترينك في أوروبا، إفصاحك لازم يكون بعد.',
    ],
    take: [
      'UAE creators selling into Europe now carry European disclosure rules with them.',
      'صناع المحتوى في الإمارات اللي يبيعون لأوروبا صاروا ملزمين بقواعد الإفصاح الأوروبية.',
    ],
  },
]);

/** Found on the next sweep: newer than anything on the wire. */
export const INCOMING: Story = personalize<Story>({
  id: 'ae-fresh',
  headline: 'Dubai retail-media rates for November just published',
  headlineAr: 'أسعار إعلانات التجزئة في دبي لشهر نوفمبر انتشرت للتو',
  outlet: 'Campaign ME',
  approved: true,
  lane: 'uae',
  ageH: 1,
  virality: 79,
  laneMatch: 92,
  url: 'https://campaignme.com/',
  summary: 'The first November rate card for Dubai retail media is out. Premium home-page placements are being held this morning.',
  summaryAr: 'أول جدول أسعار لإعلانات التجزئة في دبي لشهر نوفمبر نزل، والمساحات المميزة في الصفحة الرئيسية قاعدة تنحجز من الصبح.',
  why: 'Price the Lumière Skin media fee from this card, not last quarter’s, before the proposal goes out.',
  whyAr: 'احسبوا رسوم الإعلام للوميير سكن من هالجدول، مو جدول الربع الماضي، قبل ما يطلع العرض.',
  client: 'Lumière Skin',
  post: [
    'HOOK · Last quarter’s media prices are already out of date.',
    'The November rate card for Dubai retail media has been published.',
    'Premium home-page placements are being held from this morning.',
    'CLOSE · Plan with this month’s numbers, not last quarter’s.',
  ],
  postAr: [
    'الافتتاحية · أسعار الإعلام للربع الماضي صارت قديمة.',
    'جدول أسعار نوفمبر لإعلانات التجزئة في دبي انتشر.',
    'المساحات المميزة في الصفحة الرئيسية قاعدة تنحجز من الصبح.',
    'الختام · خطط بأرقام هالشهر، مو بأرقام الربع الماضي.',
  ],
  take: [
    'November retail-media rates in Dubai are out. Any proposal priced on Q3 numbers is already wrong.',
    'أسعار نوفمبر لإعلانات التجزئة في دبي نزلت. أي عرض محسوب على أرقام الربع الثالث صار غلط.',
  ],
});

export const GATE = { dropped: 2, blocked: 1, blockedOutlet: 'Khaleej Times (paywall)' };

export const PIPELINE_STATS = { shortlist: 48, invitesSent: 29, dm: 14, replied: 5, booked: 2 };

function weekLabel() {
  const p = dubaiParts();
  const idx = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(p.wd);
  const fmt = (offset: number) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short' }).format(Date.now() + offset * 864e5);
  const start = new Date(Date.now() - idx * 864e5);
  const onejan = new Date(start.getFullYear(), 0, 1);
  const week = Math.ceil(((start.getTime() - onejan.getTime()) / 864e5 + onejan.getDay() + 1) / 7);
  return { week: `W${week}`, dates: `${fmt(-idx)} – ${fmt(4 - idx)}` };
}

export const PACK: ContentPack = {
  ...weekLabel(),
  theme: 'Proof beats promises',
  offer: 'Comment "AUDIT" for a free 20-minute growth audit',
  decisionsOpen: 2,
  slots: [
    { day: 'Tue', lang: 'EN', pillar: 'Case study', slot: '10:00', status: 'scheduled' },
    { day: 'Wed', lang: 'AR', pillar: 'Platform update', slot: '10:00', status: 'ready' },
    { day: 'Thu', lang: 'EN', pillar: 'Founder lesson', slot: '10:00', status: 'gap' },
    { day: 'Daily', lang: 'EN', pillar: '10 comments', slot: '11:00', status: 'routine' },
  ],
};

export const OUTREACH: Person[] = [
  { n: 'Noor Al Suwaidi', r: 'CMO', c: 'Oasis Clinics', sector: 'Healthcare', u: 'https://www.linkedin.com/', s: 'replied', dmAt: Date.now() - 2 * 864e5 },
  { n: 'Karim Farouk', r: 'Head of Growth', c: 'Qafila Foods', sector: 'F&B', u: 'https://www.linkedin.com/', s: 'dm', dmAt: Date.now() - 864e5 },
  { n: 'Sara Menon', r: 'Founder', c: 'Tamr & Co', sector: 'Retail', u: 'https://www.linkedin.com/', s: 'invited', dmAt: null },
  { n: 'Rashid Al Ketbi', r: 'Marketing Director', c: 'Dune Motors', sector: 'Automotive', u: 'https://www.linkedin.com/', s: 'invited', dmAt: null },
  { n: 'Hana Yusuf', r: 'Founder', c: 'Palm Pilates', sector: 'Fitness', u: 'https://www.linkedin.com/', s: 'shortlist', dmAt: null },
  { n: 'Vikram Shah', r: 'CEO', c: 'Harbour Coffee Roasters', sector: 'F&B', u: 'https://www.linkedin.com/', s: 'booked', dmAt: Date.now() - 4 * 864e5 },
];

const asOf = dubaiDate(-1);

export const COMPETITORS: Competitor[] = [
  { id: 'c1', name: 'Pixel Dunes', handle: '@pixeldunes', lane: 'performance', platform: 'Instagram', followers: 52_300, eng: 4.1, growth: 2.2, asOf, url: 'https://www.instagram.com/', published: { hook: 'We cut CPA 38% by switching off half the ads', format: 'Reel · 45 s', views: 186_000 } },
  { id: 'c2', name: 'Gradient Media', handle: '@gradient.ae', lane: 'performance', platform: 'Instagram', followers: 44_800, eng: 3.3, growth: 1.4, asOf, url: 'https://www.instagram.com/', published: { hook: 'ROAS is lying to you. Track these three instead', format: 'Carousel · 9 slides', views: 72_000 } },
  { id: 'c3', name: 'Lumen Performance', handle: 'lumen-performance', lane: 'performance', platform: 'LinkedIn', followers: 18_900, eng: 5.0, growth: 2.9, asOf, url: 'https://www.linkedin.com/', published: { hook: 'Our Q3 Meta benchmarks for UAE retail', format: 'Document · 12 pages', views: 41_000 } },
  { id: 'c4', name: 'Studio Sahra', handle: '@studiosahra', lane: 'creative', platform: 'Instagram', followers: 96_500, eng: 6.2, growth: 3.4, asOf, url: 'https://www.instagram.com/', published: { hook: 'Behind the festive film that reached 4M people', format: 'Reel · 58 s', views: 640_000 } },
  { id: 'c5', name: 'Mirage Collective', handle: '@mirage.co', lane: 'creative', platform: 'Instagram', followers: 61_000, eng: 4.8, growth: 1.9, asOf, url: 'https://www.instagram.com/', published: { hook: 'Three hooks we banned this year', format: 'Reel · 38 s', views: 210_000 } },
  { id: 'c6', name: 'Falcon & Fig', handle: 'falcon-and-fig', lane: 'b2b', platform: 'LinkedIn', followers: 24_300, eng: 4.4, growth: 2.1, asOf, url: 'https://www.linkedin.com/', published: { hook: 'How we won a retainer without a pitch deck', format: 'Text post', views: 58_000 } },
  { id: 'c7', name: 'Bayside Digital', handle: 'bayside-digital', lane: 'b2b', platform: 'LinkedIn', followers: 15_200, eng: 3.9, growth: 1.2, asOf, url: 'https://www.linkedin.com/', published: { hook: 'The pitch we lost, and why we are glad', format: 'Text post', views: 33_000 } },
];

export function seedSettings(): Settings {
  return {
    mission: 'Every client account watched before 9. Tomorrow’s work drafted today, and every number on this board traced to its source.',
    missionAr: 'كل حسابات العملاء تحت المتابعة قبل الساعة 9. شغل باكر مكتوب اليوم، وكل رقم على هاللوحة له مصدر.',
    privacyProfile: 'full',
    triggerWord: 'privacy mode',
    replyLine: 'On it',
    radar: 'hq',
    liProfileFollowers: 9_840,
    liProfileAt: dubaiDate(-3),
    tiktokFollowers: 14_200,
    tiktokAt: dubaiDate(-5),
    breakingThreshold: 85,
    connectors: { metaads: true, linkedin: true, calendar: true, gmail: true, notion: true, buffer: true, firecrawl: true },
  };
}

export function seedMetrics(): Record<string, MetricsRecord> {
  const d = dubaiDate(-30);
  return { [d]: { date: d, reach14: 351_000, er: 5.1, followers: 35_200, pulse: 72 } };
}
