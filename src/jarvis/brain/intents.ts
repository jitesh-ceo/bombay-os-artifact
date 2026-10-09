// The scripted half of JARVIS's brain: fast, predictable commands for the pitch flow.
// Anything that does not match goes to Gemini (see gemini.ts).
import { hasRoom, prospect, type PresetId } from '../../data/prospect';
import { signals } from '../../data/signals';
import { advanceActions } from '../../state/advance';
import { AUTONOMY } from '../../state/autonomy';
import type { Action, AppState, Autonomy } from '../../state/types';

export { advanceActions };

export type JarvisIntent =
  | { kind: 'run'; signalIndex: 0 | 1 | 2 }
  | { kind: 'view'; view: 'map' | 'stage' | 'room' }
  | { kind: 'overlay'; overlay: 'roi' | 'setup' | 'palette' }
  | { kind: 'timelapse' }
  | { kind: 'autonomy'; level?: Autonomy }
  | { kind: 'integrations' }
  | { kind: 'advance' }
  | { kind: 'reset' }
  | { kind: 'briefing' }
  | { kind: 'forge'; topic: string }
  | { kind: 'gestures'; on: boolean }
  | { kind: 'wake' }
  | { kind: 'mute'; on: boolean }
  | { kind: 'lang'; lang: 'en' | 'ar' };

/** Lower-case, strip Arabic diacritics and accents, collapse spaces, rejoin spelled-out letters. */
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[ً-ٟ̀-ͯ]/g, '')
    .replace(/[’']/g, "'")
    // Speech recognition often spells acronyms out: "R O I", "r.o.i." → "roi".
    .replace(/\b[a-z](?:[.\s]+[a-z]\b)+\.?/g, (m) => m.replace(/[^a-z]/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

// Words that pick each preset's three signals, in signal order.
const SIGNAL_WORDS: Record<PresetId, string[][]> = {
  creator: [
    ['brand deal', 'lumiere', 'the deal', 'the offer', 'sponsorship', 'صفقة', 'لوميير', 'العرض'],
    ['viral', 'the reel', 'metro reel', 'spike', 'jacket', 'منتشر', 'الريل', 'المترو'],
    ['upload pack', 'weekly', 'this week', 'captions', 'calendar', 'الأسبوع', 'الكابشن', 'التقويم'],
  ],
  studio: [
    ['client brief', 'the brief', 'lumiere', 'proposal', 'الموجز', 'لوميير'],
    ['performance', 'roas', 'urban brew', 'the ads', 'الأداء', 'اوربان'],
    ['client reports', 'monday', 'reports', 'التقارير'],
  ],
  realestate: [
    ['enquiry', 'rahul', 'mehta', 'proposal', 'الاستفسار'],
    ['stalled', 'nair', 'follow up', 'follow-up', 'المتعثرة'],
    ['leadership', 'report', 'التقرير'],
  ],
};

const NUM: Record<string, 0 | 1 | 2> = { '1': 0, one: 0, first: 0, '2': 1, two: 1, second: 1, '3': 2, three: 2, third: 2 };

const FORGE_EN = /\b(?:make|create|build|film|shoot|plan|script|write)\s+(?:me\s+)?(?:a\s+|an\s+)?(?:new\s+)?(?:video|reel|short|tiktok|youtube video|content|post)\s+(?:about|on|for)\s+(.+)$/i;
// Tolerates diacritics (سوّ) so the topic can be taken from the raw text, spelling intact.
const FORGE_AR = /(?:سو|اعمل|جهز)[ً-ٟ]*ي?\s*(?:لي)?\s*(?:فيديو|ريل|مقطع)\s*عن\s+(.+)$/;

// Keywords are normalised like the input, so hamza and diacritics never block a match.
const has = (q: string, words: string[]) =>
  words.some((w) => {
    const k = norm(w);
    return /^[a-z]/.test(k) ? new RegExp(`\\b${k}\\b`).test(q) : q.includes(k);
  });

export function matchIntent(text: string): JarvisIntent | null {
  const raw = text.trim().replace(/^(?:hey |ok |okay )?jarvis[\s,.!?]*/i, '');
  const q = norm(raw);
  if (!q) return null;

  // Content Forge first: its topic can contain any other keyword.
  const forge = raw.match(FORGE_EN) ?? raw.match(FORGE_AR);
  if (forge) {
    const topic = forge[1].trim().replace(/[.!?؟]+$/, '').trim();
    if (topic) return { kind: 'forge', topic };
  }

  if (has(q, ['wake up', 'اصحى', 'اصح'])) return { kind: 'wake' };
  // Language before mute: "تكلم انجليزي" means speak English, not unmute.
  if (/\b(switch to|speak|talk in|use) arabic\b/.test(q) || has(q, ['بالعربي', 'عربي'])) return { kind: 'lang', lang: 'ar' };
  if (/\b(switch to|speak|talk in|use) english\b/.test(q) || has(q, ['انجليزي', 'إنجليزي', 'بالانجليزي'])) return { kind: 'lang', lang: 'en' };
  if (has(q, ['unmute', 'sound on', 'speak up', 'تكلم'])) return { kind: 'mute', on: false };
  if (has(q, ['mute', 'be quiet', 'silence', 'stop talking', 'اسكت'])) return { kind: 'mute', on: true };
  if (/\bgestures?\b|hand control|الإيماءات|الايماءات/.test(q)) {
    return { kind: 'gestures', on: !/\b(off|disable|stop)\b|اطفي|وقف/.test(q) };
  }

  const auto = AUTONOMY.find((a) => q.includes(`${a.id} mode`) || (a.id === 'autopilot' && q.includes('autopilot')));
  if (auto) return { kind: 'autonomy', level: auto.id };
  if (has(q, ['autonomy', 'الاستقلالية'])) return { kind: 'autonomy' };

  const sig = q.match(/\bsignal (1|2|3|one|two|three)\b/) ?? q.match(/\b(first|second|third) signal\b/);
  if (sig) return { kind: 'run', signalIndex: NUM[sig[1]] };
  // A question about a signal ("how much is the deal worth?") is for the AI brain, not a command to run it.
  const isQuestion = /^(what|how|why|who|when|where|which|is|are|was|does|did|do you|can you tell|tell me|explain)\b/.test(q) || /[?؟]$/.test(q);
  const words = SIGNAL_WORDS[prospect.preset];
  const idx = isQuestion ? -1 : words.findIndex((w) => has(q, w));
  if (idx >= 0) return { kind: 'run', signalIndex: idx as 0 | 1 | 2 };

  // "Roy" is how Chrome often hears a spoken "ROI".
  if (has(q, ['roi', 'roy', 'return on investment', 'what this means', 'the value', 'results', 'the numbers', 'savings', 'العائد'])) {
    return { kind: 'overlay', overlay: 'roi' };
  }
  if (has(q, ['set up', 'setup', 'prospect', 'الإعداد'])) return { kind: 'overlay', overlay: 'setup' };
  if (has(q, ['command palette', 'commands', 'الأوامر'])) return { kind: 'overlay', overlay: 'palette' };
  if (has(q, ['time lapse', 'time-lapse', 'timelapse', 'fast forward'])) return { kind: 'timelapse' };
  if (has(q, ['integrations', 'connected tools', 'connections', 'الربط'])) return { kind: 'integrations' };
  if (has(q, ['control room', 'trending', 'dashboard', 'the board', 'غرفة التحكم', 'الترند'])) return { kind: 'view', view: 'room' };
  if (has(q, ['map', 'الخريطة'])) return { kind: 'view', view: 'map' };
  if (has(q, ['execution', 'the stage', 'التنفيذ'])) return { kind: 'view', view: 'stage' };
  if (has(q, ['attention', 'brief me', 'briefing', "what's on", 'what is on', 'شو يحتاجني', 'الموجز'])) return { kind: 'briefing' };
  if (has(q, ['reset', 'start over', 'من البداية'])) return { kind: 'reset' };
  if (/^(next|continue|go ahead|proceed|approve|do it|run it|carry on|send it)\b/.test(q) || has(q, ['التالي', 'كمل', 'يلا'])) {
    return { kind: 'advance' };
  }
  return null;
}

/** The app actions an intent stands for. Intents the provider handles itself return []. */
export function intentToActions(intent: JarvisIntent, state: AppState, now: number): Action[] {
  switch (intent.kind) {
    case 'run': {
      const sig = signals[intent.signalIndex];
      return sig ? [{ type: 'RUN_SIGNAL', id: sig.id, now }] : [];
    }
    case 'view':
      if (intent.view === 'room') return hasRoom() ? [{ type: 'ROOM', open: true }] : [];
      return [
        { type: 'ROOM', open: false },
        { type: 'SET_VIEW', view: intent.view },
      ];
    case 'overlay':
      return [{ type: 'OVERLAY', overlay: intent.overlay }];
    case 'timelapse':
      return [{ type: 'TIMELAPSE_START', now }];
    case 'autonomy': {
      const i = AUTONOMY.findIndex((a) => a.id === state.autonomy);
      const level = intent.level ?? AUTONOMY[(i + 1) % AUTONOMY.length].id;
      return [{ type: 'SET_AUTONOMY', level, now }];
    }
    case 'integrations':
      return [{ type: 'DRAWER', open: true }];
    case 'advance':
      return advanceActions(state, now);
    case 'reset':
      return [{ type: 'RESET', now }];
    default:
      return [];
  }
}
