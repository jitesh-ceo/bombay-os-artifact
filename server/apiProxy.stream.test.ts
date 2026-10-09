import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxyMiddleware } from './apiProxy';

const env = { ELEVENLABS_API_KEY: 'k', ELEVENLABS_VOICE_ID: 'v', GEMINI_API_KEY: 'g' };
let server: Server;
const realFetch = globalThis.fetch;

afterEach(() => {
  vi.unstubAllGlobals();
  server?.close();
});

async function listen() {
  const mw = proxyMiddleware(env);
  server = createServer((req, res) => mw(req, res, () => ((res.statusCode = 404), res.end())));
  await new Promise<void>((r) => server.listen(0, r));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

describe('proxy middleware', () => {
  it('survives an ElevenLabs stream that fails half-way', async () => {
    const base = await listen();
    vi.stubGlobal('fetch', async () => {
      let n = 0;
      const body = new ReadableStream<Uint8Array>({
        pull(c) {
          if (n++ === 0) c.enqueue(new Uint8Array([1, 2, 3]));
          else c.error(new Error('connection reset'));
        },
      });
      return new Response(body, { headers: { 'content-type': 'audio/mpeg' } });
    });
    const r = await realFetch(`${base}/api/tts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"text":"hi"}' }).catch(() => null);
    await r?.arrayBuffer().catch(() => null);
    // The server must still answer afterwards.
    const h = await realFetch(`${base}/api/health`);
    expect(await h.json()).toEqual({ tts: true, chat: true });
  });

  it('rejects other methods and unconfigured services', async () => {
    const base = await listen();
    expect((await realFetch(`${base}/api/chat`)).status).toBe(405);
    const mw = proxyMiddleware({});
    server.close();
    server = createServer((req, res) => mw(req, res, () => res.end()));
    await new Promise<void>((r) => server.listen(0, r));
    const b2 = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const r = await realFetch(`${b2}/api/tts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"text":"hi"}' });
    expect(r.status).toBe(503);
  });
});
