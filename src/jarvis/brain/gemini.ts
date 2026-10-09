// The open-ended half of JARVIS's brain: Gemini through the local proxy, with a scripted fallback.
import { JARVIS_PERSONA } from './persona';

export const FALLBACK_REPLY = "I can run a brand deal, check what's trending, build a video package, or show you the numbers, sir. Which would you like?";

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
