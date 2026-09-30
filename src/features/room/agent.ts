// The on-board assistant. It reads the live board snapshot, follows the studio's rules, and acts
// through the same tools the real drawer exposes. It never posts, schedules or emails.
import { ACCOUNTS, PLACES, STUDIO } from './seed';
import type { Room, ToolCall } from './store';
import { dubaiDate, dubaiParts, fmtMin, runsToday } from './time';
import type { OutreachStatus, PlaceId, Story } from './types';

export interface AgentReply {
  text: string;
  tools: ToolCall[];
}

const PLAN: Record<string, { en: string; ar: string }> = {
  mon: { en: 'Monday: a client result post, with numbers from the live wall and the source named.', ar: 'الإثنين: منشور نتيجة لعميل، بأرقام من الحائط المباشر ومع ذكر المصدر.' },
  tue: { en: 'Tuesday: the case study goes out on LinkedIn at 10:00. It is already scheduled.', ar: 'الثلاثاء: دراسة الحالة تنزل على لينكدإن الساعة 10، وهي مجدولة.' },
  wed: { en: 'Wednesday: a platform-update explainer in Arabic, 30–45 seconds.', ar: 'الأربعاء: شرح لتحديث منصة بالعربي، 30 إلى 45 ثانية.' },
  thu: { en: 'Thursday: a founder lesson on LinkedIn. That slot is still a gap in this week’s pack.', ar: 'الخميس: درس مؤسس على لينكدإن. هالخانة للحين فاضية في باقة الأسبوع.' },
  fri: { en: 'Friday: behind the scenes from this week’s shoot, plus the week-close story.', ar: 'الجمعة: كواليس تصوير الأسبوع، وستوري ختام الأسبوع.' },
  sat: { en: 'Weekend: no studio posts. Client accounts run on their schedules.', ar: 'نهاية الأسبوع: ما في منشورات للاستوديو، وحسابات العملاء تمشي على جدولها.' },
  sun: { en: 'Weekend: no studio posts. Prepare Monday’s client result post.', ar: 'نهاية الأسبوع: ما في منشورات للاستوديو. جهّز منشور نتيجة العميل للإثنين.' },
};

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0300-\u036f]/g, '').trim();

function findPlace(text: string): PlaceId | null {
  const q = norm(text);
  const aliases: [PlaceId, string[]][] = [
    ['hq', ['hq', 'office', 'design district', 'd3', 'studio hq', 'المقر']],
    ['media', ['media city', 'urban brew', 'الإعلام', 'اوربان']],
    ['difc', ['difc', 'lumiere', 'financial', 'المالي', 'لوميير']],
    ['quoz', ['quoz', 'shoot', 'القوز', 'التصوير']],
    ['dafz', ['airport', 'freezone', 'saffron', 'المطار', 'سافرون']],
    ['marina', ['marina', 'glow', 'مارينا', 'غلو']],
    ['sharjah', ['sharjah', 'qafila', 'الشارقة', 'قافلة']],
  ];
  return aliases.find(([, keys]) => keys.some((k) => q.includes(k)))?.[0] ?? null;
}

function bestMatch<T>(items: T[], label: (x: T) => string, query: string): T | null {
  const q = norm(query);
  if (!q) return null;
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  let best: T | null = null;
  let score = 0;
  for (const it of items) {
    const l = norm(label(it));
    const s = words.filter((w) => l.includes(w)).length + (l.includes(q) ? 3 : 0);
    if (s > score) {
      score = s;
      best = it;
    }
  }
  return best;
}

export function respond(input: string, room: Room, story?: Story | null): AgentReply {
  const ar = room.lang === 'ar';
  const q = norm(input);
  const tools: ToolCall[] = [];
  const say = (en: string, arText: string) => ({ text: ar ? arText : en, tools });

  const trigger = norm(room.settings.triggerWord);
  if ((trigger && q.includes(trigger)) || /\b(go private|private on|privacy on)\b/.test(q) || q.includes('الوضع الخاص')) {
    tools.push({ name: 'set_privacy', args: { on: true } });
    room.setPrivacy(true);
    return say(`${room.settings.replyLine}. Private mode is on.`, 'تم. الوضع الخاص مفعّل.');
  }
  if (/stand down|private off|privacy off|show data/.test(q) || q.includes('إظهار البيانات') || q.includes('اظهار البيانات')) {
    tools.push({ name: 'set_privacy', args: { on: false } });
    room.setPrivacy(false);
    return say('Private mode off. Real data restored and refresh resumed.', 'انطفى الوضع الخاص. رجعت البيانات والتحديث.');
  }
  if (/client demo|demo profile/.test(q) || q.includes('عرض للعميل')) {
    tools.push({ name: 'set_privacy_profile', args: { profile: 'demo' } });
    room.setProfile('demo');
    return say('Privacy profile set to Client demo: internal panels masked, live numbers visible.', 'ملف الخصوصية صار عرض للعميل: اللوحات الداخلية مخفية والأرقام ظاهرة.');
  }
  if (/full profile|profile full/.test(q)) {
    tools.push({ name: 'set_privacy_profile', args: { profile: 'full' } });
    room.setProfile('full');
    return say('Privacy profile set to Full.', 'ملف الخصوصية صار كامل.');
  }

  if (/(^|\s)(post it|publish|schedule|send (the |this |an )?(email|dm|message)|email (him|her|them))/.test(q) && !/what should/.test(q)) {
    return say(
      'I can’t post, schedule or email from the board. The draft is ready to copy; you send it.',
      'ما أقدر أنشر أو أجدول أو أرسل من اللوحة. المسودة جاهزة للنسخ، وإنت اللي ترسل.',
    );
  }

  if (/(price|prices|how much|cost|pricing|fee|fees|retainer)/.test(q) || q.includes('السعر') || q.includes('بكم') || q.includes('رسوم')) {
    return say(
      'Fees are never quoted from the board. The retainer rate card sits in Drive › Finance, which is restricted. In outreach, offer the free 20-minute growth audit first.',
      'الرسوم ما تنذكر من اللوحة. جدول أسعار العقود في Drive › Finance وهو مقيّد. في التواصل، اعرض تدقيق النمو المجاني 20 دقيقة أول.',
    );
  }

  const addMatch = input.match(/^(?:please\s+)?add (?:a )?task[:\s-]*(.*)$/i) ?? input.match(/^أضف مهمة[:\s-]*(.*)$/);
  if (addMatch) {
    let title = addMatch[1].trim();
    if (!title) return say('What’s the task? For example: “Add a task: brief Pod B on the Glow & Co shoot tomorrow”.', 'شو المهمة؟ مثلاً: "أضف مهمة: موجز للفريق B عن تصوير غلو آند كو باكر".');
    let due: string | null = dubaiDate();
    if (/\btomorrow\b/i.test(title) || title.includes('باكر')) {
      due = dubaiDate(1);
      title = title.replace(/\btomorrow\b/i, '').replace('باكر', '').trim();
    } else if (/\btoday\b/i.test(title)) title = title.replace(/\btoday\b/i, '').trim();
    const account = ACCOUNTS.find((a) => norm(title).includes(norm(a).split(' ')[0])) ?? STUDIO.name;
    room.addTask(title, due, account);
    tools.push({ name: 'add_task', args: { title, due, account } });
    return say(`Added “${title}”, due ${due}, tagged ${account}.`, `أضفت "${title}"، موعدها ${due}، تحت ${account}.`);
  }

  const doneMatch = input.match(/(?:complete|finish|done with|tick off|mark done)\s+(?:the\s+)?(?:task\s+)?(.+)/i);
  if (doneMatch && !/routine/i.test(input)) {
    const task = bestMatch(room.tasks.filter((x) => !x.done), (x) => x.title, doneMatch[1]);
    if (!task) return say('I couldn’t find an open task like that.', 'ما لقيت مهمة مفتوحة بهالاسم.');
    room.toggleTask(task.id, true);
    tools.push({ name: 'complete_task', args: { id: task.id } });
    return say(`Ticked “${task.title}”.`, `تم إنجاز "${task.title}".`);
  }

  const tickMatch = input.match(/(?:tick|done)\s+(?:routine\s+)?(.+)/i) ?? input.match(/(r\d{2})/i);
  if (tickMatch && (/routine|r\d{2}/i.test(input) || /^tick/i.test(input))) {
    const todays = room.routines.filter((r) => runsToday(r.days));
    const id = input.match(/r\d{2}/i)?.[0].toLowerCase();
    const routine = (id && room.routines.find((r) => r.id === id)) || bestMatch(todays, (r) => r.title, tickMatch[1]);
    if (!routine) return say('No routine on today’s list matches that.', 'ما في روتين اليوم بهالاسم.');
    const streak = room.tickRoutine(routine.id);
    tools.push({ name: 'tick_routine', args: { id: routine.id } });
    return say(`Ticked ${routine.id} · ${routine.title}. Streak: ${streak}.`, `تم ${routine.id} · ${routine.titleAr}. المتتالي: ${streak}.`);
  }

  if (/radar|centre|center|move the map/.test(q) || q.includes('الرادار')) {
    const place = findPlace(input);
    if (!place) return say(`Which place? ${PLACES.map((p) => p.name.split(' · ').pop()).join(', ')}.`, `أي مكان؟ ${PLACES.map((p) => p.nameAr.split(' · ').pop()).join('، ')}.`);
    room.setRadar(place);
    tools.push({ name: 'set_radar', args: { place } });
    const p = PLACES.find((x) => x.id === place)!;
    return say(`Radar centred on ${p.name}.`, `الرادار الحين على ${p.nameAr}.`);
  }

  if (/\b(arabic|in arabic)\b/.test(q) || q.includes('عربي')) {
    room.setLang('ar');
    tools.push({ name: 'set_language', args: { lang: 'ar' } });
    return { text: 'حاضر، اللوحة الحين بالعربي.', tools };
  }
  if (/\benglish\b/.test(q) || q.includes('انجليزي') || q.includes('إنجليزي')) {
    room.setLang('en');
    tools.push({ name: 'set_language', args: { lang: 'en' } });
    return { text: 'Switched the board to English.', tools };
  }
  if (/sound (on|off)|mute|unmute/.test(q) || q.includes('الصوت')) {
    const on = /sound on|unmute/.test(q) || (q.includes('الصوت') && !q.includes('اطفي'));
    room.setSound(on);
    tools.push({ name: 'set_sound', args: { on } });
    return say(`Sound ${on ? 'on' : 'off'}.`, on ? 'الصوت شغال.' : 'الصوت مطفي.');
  }

  const missionMatch = input.match(/(?:set|change|rewrite)\s+(?:the\s+)?mission\s+(?:to|:)\s*(.+)/i) ?? input.match(/^mission[:\s]+(.+)/i);
  if (missionMatch) {
    const mission = missionMatch[1].trim();
    room.saveSettings({ mission });
    tools.push({ name: 'set_mission', args: { mission } });
    return say('Mission line updated. The Arabic line is unchanged; edit it in Settings if it should match.', 'تحدثت جملة المهمة. الجملة العربية ما تغيرت، عدّلها من الإعدادات.');
  }

  const leadMatch = input.match(/(?:mark|move|set)\s+(.+?)\s+(?:as|to)\s+(shortlist|invited|dm|dm sent|replied|booked)/i);
  if (leadMatch) {
    const person = bestMatch(room.outreach, (p) => `${p.n} ${p.c}`, leadMatch[1]);
    if (!person) return say('That contact isn’t on the outreach list.', 'هالشخص مو في قائمة التواصل.');
    const status = leadMatch[2].toLowerCase().replace('dm sent', 'dm') as OutreachStatus;
    room.setOutreachStatus(person.n, status);
    tools.push({ name: 'set_lead_status', args: { name: person.n, status } });
    return say(`${person.n} (${person.c}) moved to ${status} and logged.`, `${person.n} (${person.c}) انتقل إلى ${status} وتسجل.`);
  }

  if (story) {
    return say(
      `Picked up “${story.headline}”. ${story.outlet} is ${story.approved ? 'an approved outlet' : 'context only, so any UAE claim needs an approved source'}. It is ${story.ageH}h old, inside the 48-hour gate, and matters most for ${story.client}. Tell me what to change: the hook, the length, the language, or the client.`,
      `مسكت خبر "${story.headlineAr}". ${story.outlet} ${story.approved ? 'مصدر معتمد' : 'للسياق بس، وأي ادعاء عن الإمارات يحتاج مصدر معتمد'}. عمره ${story.ageH} ساعة، داخل بوابة الـ48، ويهم ${story.client} أكثر شي. قول لي شو أغيّر: الافتتاحية، الطول، اللغة، أو العميل.`,
    );
  }

  const wd = dubaiParts().wd;
  const top = [...room.stories].filter((s) => s.approved).sort((a, b) => b.virality + b.laneMatch - (a.virality + a.laneMatch))[0];

  if (/what should (we|i) post|post today/.test(q) || q.includes('ننشر') || q.includes('انشر') || q.includes('أنشر')) {
    const slot = PLAN[wd];
    return say(
      `${slot.en}\nStrongest story on the wire: “${top.headline}” (${top.outlet}, ${top.ageH}h, virality ${top.virality}). It matters for ${top.client}. Open it on the Newswire and press Client post.`,
      `${slot.ar}\nأقوى خبر على الشريط: "${top.headlineAr}" (${top.outlet}، ${top.ageH} ساعة، انتشار ${top.virality}). يهم ${top.client}. افتحه من شريط الأخبار واضغط منشور عميل.`,
    );
  }

  if (/brief|today/.test(q) || q.includes('موجز')) {
    const now = room.inProgress;
    const next = room.calendar.find((e) => e.start > (now?.end ?? -1) && e.start >= (now?.start ?? 0));
    const open = room.tasks.filter((x) => !x.done && x.due && x.due <= dubaiDate());
    const todays = room.routines.filter((r) => runsToday(r.days));
    const doneR = todays.filter((r) => r.lastDone === dubaiDate()).length;
    const lines = ar
      ? [
          now ? `الحين: ${now.titleAr} (${fmtMin(now.start)}–${fmtMin(now.end)}).` : 'ما في اجتماع الحين.',
          next ? `الجاي: ${next.titleAr} الساعة ${fmtMin(next.start)}.` : '',
          'البريد: 4 رسائل تحتاجك من آخر يومين، منها تصعيد من سافرون إير.',
          `المهام المستحقة: ${open.length}. الروتين: ${doneR} من ${todays.length}.`,
          `أقوى خبر: "${top.headlineAr}".`,
        ]
      : [
          now ? `Now: ${now.title} (${fmtMin(now.start)}–${fmtMin(now.end)}).` : 'Nothing in progress.',
          next ? `Next: ${next.title} at ${fmtMin(next.start)}.` : '',
          'Inbox: 4 threads need you from the last 2 days, including a Saffron Air escalation.',
          `Tasks due: ${open.length}. Routines: ${doneR} of ${todays.length} done.`,
          `Top story: “${top.headline}”.`,
          `The one thing: ${open[0]?.title ?? 'clear the escalation before 11:00'}.`,
        ];
    return { text: lines.filter(Boolean).join('\n'), tools };
  }

  if (/pulse|index|gauge/.test(q) || q.includes('مؤشر')) {
    const a = room.pulse;
    const ig = room.channels[0];
    const prev = Object.values(room.metrics).sort((x, y) => x.date.localeCompare(y.date))[0];
    return say(
      `Pulse Index ${a.total}/100, from the last 14 days on ${ig.handle}:\n· Engagement rate ${ig.er}% → ${a.er} of 60 (full marks at 8%)\n· Follower growth ${ig.growth}% → ${a.growth} of 25 (full marks at 2%)\n· Reach consistency → ${a.consistency} of 15\n${prev && prev.date < dubaiDate() ? `vs 30 days ago: ${prev.pulse} → ${a.total}.` : ''}`,
      `مؤشر النبض ${a.total} من 100، من آخر 14 يوم على ${ig.handle}:\n· نسبة التفاعل ${ig.er}% ← ${a.er} من 60\n· نمو المتابعين ${ig.growth}% ← ${a.growth} من 25\n· ثبات الوصول ← ${a.consistency} من 15\n${prev ? `قبل 30 يوم: ${prev.pulse} ← ${a.total}.` : ''}`,
    );
  }

  return say(
    'I can see the whole board. Try: “Brief me on today”, “Add a task: …”, “Tick r02”, “Move the radar to the Marina”, “Mark Karim as replied”, or your privacy phrase.',
    'أشوف اللوحة كلها. جرّب: "عطني موجز اليوم"، "أضف مهمة: …"، "tick r02"، "حرّك الرادار إلى مارينا"، أو عبارة الخصوصية.',
  );
}
