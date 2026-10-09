// Content Forge: "JARVIS, make me a video about…" → a publish-ready package, run through the same
// five-stage engine as every signal. Gemini writes it when available; a matching sample otherwise.
import { client } from '../../data/client';
import { deliverables, type Deliverable } from '../../data/deliverables';
import { signalById, type Signal } from '../../data/signals';
import { workflows, type Workflow } from '../../data/workflows';
import { invalidate } from '../../state/compile';
import { chat } from './gemini';
import { FORGE_SAMPLES } from './forgeSamples';

export interface ForgePackage {
  topic: string;
  angle: string;
  format: 'reel' | 'short' | 'youtube';
  trend: { label: string; score: number }[];
  hook: string;
  script: string[];
  thumbnails: { title: string; visual: string }[];
  shots: string[];
  captions: { en: string; ar: string };
  hashtags: string[];
  postTime: string;
  issue: { field: string; generated: string; verified: string; reason: string };
}

export const FORGE_SIGNAL = 'sig-forge';
export const FORGE_WORKFLOW = 'wf-forge';
const TOPIC_MAX = 80;

const FORMAT_LABEL: Record<ForgePackage['format'], string> = {
  reel: 'Instagram Reel · 45 s',
  short: 'YouTube Short · 50 s',
  youtube: 'YouTube video · 8–10 min',
};

export function cleanTopic(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, TOPIC_MAX).trim();
}

/* ───────── Parsing what Gemini returns ───────── */

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);
const str = (v: unknown, max: number): string | null => (typeof v === 'string' && v.trim() ? clip(v.trim(), max) : null);
const strs = (v: unknown, min: number, max: number, len: number): string[] | null => {
  if (!Array.isArray(v) || v.length < min) return null;
  const out = v.slice(0, max).map((x) => str(x, len));
  return out.every((x): x is string => x !== null) ? out : null;
};

/** Validates and normalises a Forge package. Accepts raw JSON or JSON in a ``` fence. */
export function parseForge(text: string, topic: string): ForgePackage | null {
  let data: Record<string, unknown>;
  try {
    const body = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    data = JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object') return null;

  const format = data.format;
  if (format !== 'reel' && format !== 'short' && format !== 'youtube') return null;

  const trendRaw = Array.isArray(data.trend) ? data.trend : [];
  if (trendRaw.length < 3) return null;
  const trend = trendRaw.slice(0, 6).map((t) => {
    const label = str((t as { label?: unknown })?.label, 80);
    const score = Number((t as { score?: unknown })?.score);
    return label && Number.isFinite(score) ? { label, score: Math.round(Math.min(100, Math.max(0, score))) } : null;
  });
  if (trend.some((t) => !t)) return null;

  const thumbsRaw = data.thumbnails;
  if (!Array.isArray(thumbsRaw) || thumbsRaw.length !== 3) return null;
  const thumbnails = thumbsRaw.map((t) => {
    const title = str((t as { title?: unknown })?.title, 40);
    const visual = str((t as { visual?: unknown })?.visual, 160);
    return title && visual ? { title, visual } : null;
  });
  if (thumbnails.some((t) => !t)) return null;

  const cap = data.captions as { en?: unknown; ar?: unknown } | undefined;
  const en = str(cap?.en, 300);
  const ar = str(cap?.ar, 300);
  const iss = data.issue as Record<string, unknown> | undefined;
  const issue = iss && {
    field: str(iss.field, 40),
    generated: str(iss.generated, 160),
    verified: str(iss.verified, 160),
    reason: str(iss.reason, 400),
  };
  const tags = strs(data.hashtags, 3, 8, 40)?.map((h) => `#${h.replace(/^#+/, '').replace(/\s+/g, '')}`);
  const angle = str(data.angle, 200);
  const hook = str(data.hook, 160);
  const script = strs(data.script, 4, 8, 160);
  const shots = strs(data.shots, 4, 8, 120);
  const postTime = str(data.postTime, 40);

  if (!angle || !hook || !script || !shots || !en || !ar || !tags || !postTime || !issue) return null;
  if (!issue.field || !issue.generated || !issue.verified || !issue.reason) return null;

  return {
    topic: cleanTopic(topic) || cleanTopic(String(data.topic ?? '')) || 'your next video',
    angle,
    format,
    trend: trend as ForgePackage['trend'],
    hook,
    script,
    thumbnails: thumbnails as ForgePackage['thumbnails'],
    shots,
    captions: { en, ar },
    hashtags: tags,
    postTime,
    issue: issue as ForgePackage['issue'],
  };
}

/* ───────── Fallback ───────── */

function fill<T>(v: T, topic: string): T {
  if (typeof v === 'string') return v.replaceAll('{topic}', topic) as T;
  if (Array.isArray(v)) return v.map((x) => fill(x, topic)) as T;
  if (v && typeof v === 'object' && !(v instanceof RegExp)) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x, topic)])) as T;
  }
  return v;
}

export function fallbackForge(raw: string): ForgePackage {
  const topic = cleanTopic(raw);
  const sample = (topic && FORGE_SAMPLES.find((s) => s.match.test(topic))) || FORGE_SAMPLES[0];
  const { match: _match, defaultTopic, ...rest } = sample;
  const t = topic || defaultTopic;
  return { topic: t, ...fill(rest, t) };
}

/* ───────── Gemini ───────── */

const FORGE_SYSTEM = `You are JARVIS, building a short-form video package for ${client.name} (${client.descriptor}).
Return ONLY one JSON object, no prose, matching this TypeScript type:
{ "topic": string, "angle": string, "format": "reel" | "short" | "youtube",
  "trend": { "label": string, "score": number }[],        // 3 to 6 items, score 0-100, why the topic is hot now
  "hook": string,                                         // first line spoken on camera, under 120 characters
  "script": string[],                                     // 4 to 8 beats, each under 120 characters
  "thumbnails": { "title": string, "visual": string }[],  // exactly 3; title under 25 characters, upper case
  "shots": string[],                                      // 4 to 8 shots
  "captions": { "en": string, "ar": string },             // ar in natural Gulf Arabic
  "hashtags": string[],                                   // 5 to 8, each starting with #
  "postTime": string,                                     // e.g. "Thu 20:30 Gulf time"
  "issue": { "field": string, "generated": string, "verified": string, "reason": string } }
"issue" is one realistic problem a first draft would have, caught before posting: a missing #ad or #gifted disclosure,
an unverifiable claim, or a location that needs a permit. "generated" is the flawed text, "verified" the fix,
"reason" one sentence. Audience: UAE and Saudi Arabia. Never invent statistics about real brands.`;

export async function buildForgePackage(
  topic: string,
  opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<{ pkg: ForgePackage; source: 'gemini' | 'fallback' }> {
  const t = cleanTopic(topic) || fallbackForge('').topic;
  const text = await chat(FORGE_SYSTEM, `Make a video package about: ${t}`, { ...opts, timeoutMs: opts.timeoutMs ?? 12000, json: true });
  const pkg = text ? parseForge(text, t) : null;
  return pkg ? { pkg, source: 'gemini' } : { pkg: fallbackForge(t), source: 'fallback' };
}

/* ───────── Package → workflow ───────── */

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// The event timeline depends only on counts, which are fixed here, so a richer package can replace
// the fallback mid-run without moving the reducer's cursor: 4 facts, 5 plan steps, 5 lanes × 3 steps,
// 3 checks, 4 outputs.
export function forgeToWorkflow(pkg: ForgePackage): { workflow: Workflow; deliverables: Deliverable[]; signal: Signal } {
  const fmt = FORMAT_LABEL[pkg.format];
  const [t1, t2, t3] = pkg.trend;
  const outputs = ['forge-package', 'forge-thumbnails', 'forge-captions', 'forge-schedule'];

  const workflow: Workflow = {
    id: FORGE_WORKFLOW,
    signalId: FORGE_SIGNAL,
    runLabel: `Content Forge · ${clip(pkg.topic, 40)}`,
    sources: ['youtube', 'instagram', 'notion'],
    brief: {
      goal: `Turn “${pkg.topic}” into a publish-ready ${fmt} package.`,
      estimate: '~60 seconds',
      manual: '1–2 days manually',
    },
    facts: [
      { source: 'youtube', label: t1.label, value: `Interest ${t1.score} / 100 and rising`, ref: 'Trend radar · last 7 days' },
      { source: 'instagram', label: t2.label, value: `Interest ${t2.score} / 100`, ref: 'Reels trends · UAE + KSA' },
      { source: 'instagram', label: t3.label, value: `Interest ${t3.score} / 100`, ref: 'Comments and saves · last 30 days' },
      { source: 'notion', label: 'Angle that fits the channel', value: pkg.angle, ref: 'Content / Brand voice & past winners' },
    ],
    plan: [
      { title: 'Pick the angle', detail: pkg.angle, sources: ['notion', 'youtube'] },
      { title: 'Choose the format', detail: fmt, sources: ['instagram', 'youtube'] },
      { title: 'Write the hook', detail: pkg.hook, sources: ['notion'] },
      { title: 'Plan the shoot', detail: `${pkg.shots.length} shots, ${pkg.script.length} beats`, sources: ['youtube'] },
      { title: 'Package for posting', detail: `Captions EN / AR · ${pkg.hashtags.length} hashtags · ${pkg.postTime}`, sources: ['instagram'] },
    ],
    lanes: [
      {
        id: 'script',
        title: 'Hook & script',
        tool: 'notion',
        outputIds: ['forge-package'],
        steps: ['Writing the hook', 'Drafting the beats', 'Timing the script'],
        preview: [`Hook  ${pkg.hook}`, pkg.script[0], pkg.script[1], `${pkg.issue.field}  {{forgeFix}}`],
        watchLine: 3,
      },
      {
        id: 'thumbs',
        title: 'Thumbnails',
        tool: 'drive',
        outputIds: ['forge-thumbnails'],
        steps: ['Sketching 3 concepts', 'Writing title text', 'Checking contrast'],
        preview: pkg.thumbnails.map((th) => th.title),
      },
      {
        id: 'shots',
        title: 'Shot list',
        tool: 'youtube',
        outputIds: ['forge-package'],
        steps: ['Breaking down scenes', 'Choosing locations', 'Ordering the shoot'],
        preview: pkg.shots.slice(0, 4),
      },
      {
        id: 'captions',
        title: 'Captions EN / AR',
        tool: 'instagram',
        outputIds: ['forge-captions'],
        steps: ['Writing English', 'Writing Arabic', 'Adding hashtags'],
        preview: [`EN  ${pkg.captions.en}`, `AR  ${pkg.captions.ar}`, pkg.hashtags.slice(0, 4).join(' ')],
      },
      {
        id: 'post',
        title: 'Post plan',
        tool: 'instagram',
        outputIds: ['forge-schedule'],
        steps: ['Checking best times', 'Planning cross-posts', 'Scheduling'],
        preview: [`Best time  ${pkg.postTime}`, `Format  ${fmt}`, 'Cross-post  Shorts + TikTok'],
      },
    ],
    checks: [
      { id: 'c-trend', label: 'Trend data', against: 'YouTube Studio / Trend radar', source: 'youtube' },
      {
        id: 'c-forge',
        label: pkg.issue.field,
        against: 'Notion / Brand & compliance rules',
        source: 'notion',
        flag: {
          field: pkg.issue.field,
          generated: pkg.issue.generated,
          verified: pkg.issue.verified,
          reason: pkg.issue.reason,
          token: 'forgeFix',
          lineLabel: pkg.issue.field,
          ledger: {
            detected: `${pkg.issue.field} issue detected`,
            verified: 'Source verified · Brand & compliance rules',
            corrected: `${pkg.issue.field} corrected before posting`,
          },
        },
      },
      { id: 'c-timing', label: 'Posting time', against: 'Instagram / Insights', source: 'instagram' },
    ],
    outputs,
    primaryOutput: 'forge-package',
    corrections: { forgeFix: { generated: pkg.issue.generated, verified: pkg.issue.verified } },
    impact: { hours: 6, pipelineLakhs: 0, tasks: 4 },
    approvalLedger: [
      { text: `Package approved by ${client.approver}` },
      { text: 'Script and shot list filed', source: 'notion' },
      { text: 'Thumbnail concepts sent to the designer', source: 'drive' },
      { text: `Post scheduled · ${pkg.postTime}`, source: 'instagram' },
    ],
    completion: ['Package approved', 'Thumbnails briefed', 'Post scheduled'],
    manual: [
      ['Research the trend', 90],
      ['Write hook and script', 120],
      ['Plan the shoot', 60],
      ['Brief thumbnails', 45],
      ['Write captions EN / AR', 60],
      ['Pick the posting time', 15],
    ],
  };

  const docs: Deliverable[] = [
    {
      id: 'forge-package',
      kind: 'plan',
      title: 'Video Package',
      short: 'Video package',
      destination: 'notion',
      destinationLabel: 'Notion · Content / Forge',
      approvedLabel: 'Sent to the editor',
      doc: {
        eyebrow: `Content Forge · ${fmt}`,
        title: title(pkg.topic),
        meta: [
          ['Format', fmt],
          ['Post', pkg.postTime],
          ['Prepared by', 'JARVIS'],
        ],
        blocks: [
          { t: 'h', text: 'Angle' },
          { t: 'lead', text: pkg.angle, ref: 1 },
          { t: 'h', text: 'Hook' },
          { t: 'p', text: pkg.hook },
          { t: 'h', text: 'Script' },
          { t: 'steps', items: pkg.script.map((b, i) => [`Beat ${i + 1}`, b] as [string, string]) },
          { t: 'h', text: 'Shot list' },
          { t: 'list', items: pkg.shots },
          { t: 'h', text: 'Checks before posting' },
          {
            t: 'table',
            head: ['Check', 'Result'],
            rows: [
              ['Trend fit', 'Verified'],
              ['Posting time', 'Verified'],
            ],
            total: [pkg.issue.field, '{{forgeFix}}'],
            ref: 2,
            watchToken: 'forgeFix',
          },
        ],
      },
      refs: [
        { n: 1, source: 'youtube', label: 'Trend radar · last 7 days' },
        { n: 2, source: 'notion', label: 'Brand & compliance rules (verified)' },
      ],
    },
    {
      id: 'forge-thumbnails',
      kind: 'recommendation',
      title: 'Thumbnail Concepts',
      short: 'Thumbnails',
      destination: 'drive',
      destinationLabel: 'Drive · Thumbnails',
      approvedLabel: 'Sent to the designer',
      doc: {
        eyebrow: 'Thumbnail concepts',
        title: 'Three directions to test',
        meta: [['Topic', clip(pkg.topic, 40)]],
        blocks: [{ t: 'kv', items: pkg.thumbnails.map((th) => [th.title, th.visual] as [string, string]) }],
      },
      refs: [],
    },
    {
      id: 'forge-captions',
      kind: 'recommendation',
      title: 'Captions EN / AR',
      short: 'Captions',
      destination: 'instagram',
      destinationLabel: 'Instagram · Drafts',
      approvedLabel: 'Saved as drafts',
      doc: {
        eyebrow: 'Captions · English and Arabic',
        title: 'Ready to paste',
        meta: [['Hashtags', String(pkg.hashtags.length)]],
        blocks: [
          {
            t: 'kv',
            items: [
              ['English', pkg.captions.en],
              ['Arabic', pkg.captions.ar],
              ['Hashtags', pkg.hashtags.join(' ')],
            ],
          },
        ],
      },
      refs: [],
    },
    {
      id: 'forge-schedule',
      kind: 'plan',
      title: 'Post Plan',
      short: 'Post plan',
      destination: 'instagram',
      destinationLabel: 'Instagram · Scheduler',
      approvedLabel: 'Scheduled',
      doc: {
        eyebrow: 'Post plan',
        title: `Live ${pkg.postTime}`,
        meta: [['Format', fmt]],
        blocks: [
          {
            t: 'steps',
            items: [
              [pkg.postTime, `Post the ${fmt}`],
              ['+1 hour', 'Reply to the first 20 comments'],
              ['+24 hours', 'Cross-post to Shorts and TikTok'],
              ['+48 hours', 'Compare against the trend benchmark'],
            ],
          },
        ],
      },
      refs: [],
    },
  ];

  const signal: Signal = {
    id: FORGE_SIGNAL,
    index: 'F',
    kind: 'Content Forge',
    headline: clip(title(pkg.topic), 40),
    time: 'Now',
    source: 'youtube',
    urgency: 'High',
    workflowId: FORGE_WORKFLOW,
    from: client.name,
    fromRole: 'Voice command',
    excerpt: `“Make me a video about ${pkg.topic}.”`,
    place: client.hq,
  };

  return { workflow, deliverables: docs, signal };
}

/** Installs (or replaces) the Forge workflow so RUN_SIGNAL sig-forge runs it. */
export function registerForge(pkg: ForgePackage) {
  const { workflow, deliverables: docs, signal } = forgeToWorkflow(pkg);
  current = pkg;
  workflows[FORGE_WORKFLOW] = workflow;
  for (const d of docs) deliverables[d.id] = d;
  signalById[FORGE_SIGNAL] = signal;
  invalidate(FORGE_WORKFLOW);
}

let current: ForgePackage | null = null;

/** The package on the Forge stage right now, for the holographic view. */
export function getForgePackage(): ForgePackage | null {
  return current;
}
