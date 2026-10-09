// Local proxy for ElevenLabs (voice) and Gemini (brain). Runs inside the Vite dev / preview
// server so the API keys stay in .env on the presenter's machine and never reach the browser.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Readable } from 'node:stream';
import type { Plugin } from 'vite';

export interface ProxyEnv {
  ELEVENLABS_API_KEY?: string;
  ELEVENLABS_VOICE_ID?: string;
  ELEVENLABS_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

export interface ChatBody {
  system: string;
  messages: { role: 'user' | 'model'; text: string }[];
  json?: boolean;
}

interface Upstream {
  url: string;
  init: RequestInit;
}

const TTS_MAX_CHARS = 600;
const UPSTREAM_TIMEOUT_MS = 15_000;

export function health(env: ProxyEnv) {
  return {
    tts: Boolean(env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID),
    chat: Boolean(env.GEMINI_API_KEY),
  };
}

export function ttsRequest(env: ProxyEnv, text: string): Upstream | null {
  if (!env.ELEVENLABS_API_KEY || !env.ELEVENLABS_VOICE_ID) return null;
  const voice = encodeURIComponent(env.ELEVENLABS_VOICE_ID);
  return {
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`,
    init: {
      method: 'POST',
      headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
      body: JSON.stringify({
        text: text.slice(0, TTS_MAX_CHARS),
        model_id: env.ELEVENLABS_MODEL || 'eleven_flash_v2_5',
        voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.15 },
      }),
    },
  };
}

export function chatRequest(env: ProxyEnv, chat: ChatBody): Upstream | null {
  if (!env.GEMINI_API_KEY) return null;
  const model = encodeURIComponent(env.GEMINI_MODEL || 'gemini-flash-latest');
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    init: {
      method: 'POST',
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: chat.system }] },
        contents: chat.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        ...(chat.json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
      }),
    },
  };
}

export function parseGeminiText(json: unknown): string {
  const parts = (json as { candidates?: { content?: { parts?: { text?: unknown }[] } }[] } | null)?.candidates?.[0]?.content
    ?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('');
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    return null;
  }
}

function isChatBody(b: unknown): b is ChatBody {
  const c = b as ChatBody | null;
  return Boolean(
    c &&
      typeof c.system === 'string' &&
      Array.isArray(c.messages) &&
      c.messages.every((m) => (m.role === 'user' || m.role === 'model') && typeof m.text === 'string'),
  );
}

type Middleware = (req: IncomingMessage, res: ServerResponse, next: () => void) => void;

function middleware(env: ProxyEnv): Middleware {
  return (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];
    if (path === '/api/health') return send(res, 200, health(env));
    if (path !== '/api/tts' && path !== '/api/chat') return next();
    if (req.method !== 'POST') return send(res, 405, { error: 'method-not-allowed' });

    void (async () => {
      const body = await readJson(req);
      if (path === '/api/tts') {
        const text = (body as { text?: unknown } | null)?.text;
        if (typeof text !== 'string' || !text.trim()) return send(res, 400, { error: 'bad-request' });
        const up = ttsRequest(env, text);
        if (!up) return send(res, 503, { error: 'not-configured' });
        const r = await fetch(up.url, { ...up.init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
        if (!r.ok || !r.body) return send(res, 502, { error: 'upstream', status: r.status });
        res.statusCode = 200;
        res.setHeader('content-type', 'audio/mpeg');
        Readable.fromWeb(r.body as import('node:stream/web').ReadableStream).pipe(res);
        return;
      }
      if (!isChatBody(body)) return send(res, 400, { error: 'bad-request' });
      const up = chatRequest(env, body);
      if (!up) return send(res, 503, { error: 'not-configured' });
      const r = await fetch(up.url, { ...up.init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
      if (!r.ok) return send(res, 502, { error: 'upstream', status: r.status });
      send(res, 200, { text: parseGeminiText(await r.json()) });
    })().catch(() => {
      if (!res.headersSent) send(res, 502, { error: 'upstream' });
      else res.end();
    });
  };
}

export function apiProxy(env: ProxyEnv): Plugin {
  return {
    name: 'jarvis-api-proxy',
    configureServer(server) {
      server.middlewares.use(middleware(env));
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware(env));
    },
  };
}
