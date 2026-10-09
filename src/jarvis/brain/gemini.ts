// The open-ended half of JARVIS's brain: Gemini through the local proxy, with a scripted fallback.
import { pick } from '../../data/prospect';
import { JARVIS_PERSONA } from './persona';

// What JARVIS offers when it cannot answer freely. No honorific: the user may be anyone.
export const FALLBACK_REPLY = pick({
  creator: "I can answer the brand deal, ride the viral reel, build this week’s uploads, make a video package, or show you the numbers. Which would you like?",
  studio: "I can answer the client brief, fix the campaign performance, prepare the client reports, make a video package, or show you the numbers. Which would you like?",
  realestate: "I can answer the new enquiry, follow up the stalled deal, prepare the leadership report, or show you the numbers. Which would you like?",
});

export interface JarvisReply {
  text: string;
  source: 'gemini' | 'fallback';
}

interface Options {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** Calls /api/chat with a timeout. Resolves to the reply text, or '' on any failure. */
export async function chat(
  system: string,
  user: string,
  { fetchImpl = (...a) => fetch(...a), timeoutMs = 8000, json = false }: Options & { json?: boolean } = {},
): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ system, messages: [{ role: 'user', text: user }], ...(json ? { json: true } : {}) }),
      signal: ctrl.signal,
    });
    if (!r.ok) return '';
    const data = (await r.json()) as { text?: unknown };
    return typeof data.text === 'string' ? data.text.trim() : '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

export async function askJarvis(question: string, snapshot: string, opts: Options = {}): Promise<JarvisReply> {
  const text = await chat(`${JARVIS_PERSONA}\n\nBoard snapshot (JSON):\n${snapshot}`, question, opts);
  return text ? { text, source: 'gemini' } : { text: FALLBACK_REPLY, source: 'fallback' };
}
