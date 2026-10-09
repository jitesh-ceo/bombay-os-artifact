import { afterEach, describe, expect, it, vi } from 'vitest';
import { askJarvis, FALLBACK_REPLY } from './gemini';

const ok = (text: string) => new Response(JSON.stringify({ text }), { headers: { 'content-type': 'application/json' } });

afterEach(() => vi.useRealTimers());

describe('askJarvis', () => {
  it('returns the Gemini answer and sends the persona with the board snapshot', async () => {
    const fetchImpl = vi.fn(async () => ok('Three items need you, sir.'));
    const r = await askJarvis('What needs me?', '{"preset":"creator"}', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ text: 'Three items need you, sir.', source: 'gemini' });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/chat');
    const body = JSON.parse(String(init.body));
    expect(body.system).toContain('JARVIS');
    expect(body.system).toContain('{"preset":"creator"}');
    expect(body.messages).toEqual([{ role: 'user', text: 'What needs me?' }]);
  });

  it('falls back when the request fails', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('offline');
    });
    expect(await askJarvis('hi', '{}', { fetchImpl: fetchImpl as unknown as typeof fetch })).toEqual({ text: FALLBACK_REPLY, source: 'fallback' });
  });

  it('falls back when the brain is not configured', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"error":"not-configured"}', { status: 503 }));
    expect((await askJarvis('hi', '{}', { fetchImpl: fetchImpl as unknown as typeof fetch })).source).toBe('fallback');
  });

  it('falls back on an empty answer', async () => {
    const fetchImpl = vi.fn(async () => ok('   '));
    expect((await askJarvis('hi', '{}', { fetchImpl: fetchImpl as unknown as typeof fetch })).source).toBe('fallback');
  });

  it('falls back when Gemini is too slow', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    );
    const pending = askJarvis('hi', '{}', { fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 8000 });
    await vi.advanceTimersByTimeAsync(8001);
    expect((await pending).source).toBe('fallback');
  });
});
