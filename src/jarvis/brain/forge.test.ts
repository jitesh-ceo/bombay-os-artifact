import { afterEach, describe, expect, it, vi } from 'vitest';
import { deliverables } from '../../data/deliverables';
import { integrationById } from '../../data/integrations';
import { signalById } from '../../data/signals';
import { workflows } from '../../data/workflows';
import { getEvents } from '../../state/compile';
import { buildForgePackage, cleanTopic, fallbackForge, FORGE_SIGNAL, forgeToWorkflow, parseForge, registerForge, type ForgePackage } from './forge';

afterEach(() => vi.useRealTimers());

const tokensIn = (v: unknown) => [...JSON.stringify(v).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);

describe('cleanTopic', () => {
  it('trims, collapses spaces and caps at 80 characters', () => {
    expect(cleanTopic('   ')).toBe('');
    expect(cleanTopic('  the   new  iPhone ')).toBe('the new iPhone');
    expect(cleanTopic('x'.repeat(300))).toHaveLength(80);
  });
});

describe('fallbackForge', () => {
  it('picks the closest sample and puts the topic in the titles', () => {
    const p = fallbackForge('the best shawarma in Deira');
    expect(p.topic).toBe('the best shawarma in Deira');
    expect(JSON.stringify(p.thumbnails)).toContain('shawarma');
  });

  it('always returns a valid package, including for empty and Arabic topics', () => {
    for (const t of ['', 'شاورما في دبي', 'x'.repeat(300), 'camping in the desert']) {
      const p = fallbackForge(t);
      expect(parseForge(JSON.stringify(p), p.topic), t).not.toBeNull();
      expect(p.topic.length).toBeGreaterThan(0);
    }
  });
});

describe('parseForge', () => {
  const good = fallbackForge('a phone review');
  const raw = JSON.stringify(good);

  it('accepts raw JSON and JSON in a code fence', () => {
    expect(parseForge(raw, 'a phone review')).not.toBeNull();
    expect(parseForge('```json\n' + raw + '\n```', 'a phone review')).not.toBeNull();
  });

  it('rejects prose and packages that break the shape', () => {
    expect(parseForge('Sure! Here is your video plan…', 't')).toBeNull();
    expect(parseForge(JSON.stringify({ ...good, thumbnails: good.thumbnails.slice(0, 2) }), 't')).toBeNull();
    const { issue: _issue, ...noIssue } = good;
    expect(parseForge(JSON.stringify(noIssue), 't')).toBeNull();
    expect(parseForge(JSON.stringify({ ...good, format: 'podcast' }), 't')).toBeNull();
  });

  it('keeps the topic it was asked for and adds missing # to hashtags', () => {
    const p = parseForge(JSON.stringify({ ...good, topic: 'something else', hashtags: ['dubai', '#tech', 'review', 'uae', 'phones'] }), 'a phone review')!;
    expect(p.topic).toBe('a phone review');
    expect(p.hashtags.every((h) => h.startsWith('#'))).toBe(true);
  });
});

describe('buildForgePackage', () => {
  it('uses Gemini when it answers with a valid package', async () => {
    const pkg = { ...fallbackForge('desert camping'), hook: 'Gemini wrote this hook' };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ text: JSON.stringify(pkg) })));
    const r = await buildForgePackage('desert camping', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.source).toBe('gemini');
    expect(r.pkg.hook).toBe('Gemini wrote this hook');
    const body = JSON.parse(String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.json).toBe(true);
  });

  it('falls back when the brain is unavailable', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"error":"not-configured"}', { status: 503 }));
    const r = await buildForgePackage('desert camping', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.source).toBe('fallback');
    expect(r.pkg.topic).toBe('desert camping');
  });

  it('falls back when Gemini is too slow', async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn(
      (_u: string, init?: RequestInit) => new Promise<Response>((_, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('abort')))),
    );
    const pending = buildForgePackage('desert camping', { fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 12000 });
    await vi.advanceTimersByTimeAsync(12001);
    expect((await pending).source).toBe('fallback');
  });
});

describe('forgeToWorkflow', () => {
  const { workflow: wf, deliverables: dels, signal } = forgeToWorkflow(fallbackForge('a phone review'));
  const byId = Object.fromEntries(dels.map((d) => [d.id, d]));

  it('builds a complete five-lane workflow', () => {
    expect(wf.id).toBe('wf-forge');
    expect(signal.id).toBe(FORGE_SIGNAL);
    expect(wf.signalId).toBe(FORGE_SIGNAL);
    expect(wf.lanes).toHaveLength(5);
    expect(wf.outputs).toContain(wf.primaryOutput);
    for (const o of wf.outputs) expect(byId[o], o).toBeDefined();
    for (const lane of wf.lanes) for (const o of lane.outputIds) expect(wf.outputs).toContain(o);
    for (const f of wf.facts) expect(wf.sources).toContain(f.source);
    for (const c of wf.checks) expect(wf.sources).toContain(c.source);
  });

  it('flags exactly one issue and corrects it in the primary document', () => {
    const flagged = wf.checks.filter((c) => c.flag);
    expect(flagged).toHaveLength(1);
    expect(wf.corrections[flagged[0].flag!.token]).toBeDefined();
    expect(tokensIn(byId[wf.primaryOutput])).toContain(flagged[0].flag!.token);
    for (const t of [...tokensIn(wf.lanes), ...dels.flatMap(tokensIn)]) expect(wf.corrections[t], t).toBeDefined();
  });

  it('only uses integrations that exist', () => {
    for (const id of [...wf.sources, ...wf.lanes.map((l) => l.tool), ...dels.map((d) => d.destination)]) {
      expect(integrationById[id], id).toBeDefined();
    }
  });
});

describe('registerForge', () => {
  it('makes the Forge runnable and keeps the event timeline identical when a richer package arrives', () => {
    registerForge(fallbackForge('a phone review'));
    expect(signalById[FORGE_SIGNAL]).toBeDefined();
    expect(workflows['wf-forge']).toBeDefined();
    const before = getEvents('wf-forge').map((e) => e.type);

    const rich: ForgePackage = {
      ...fallbackForge('a phone review'),
      hook: 'A different hook',
      trend: Array.from({ length: 6 }, (_, i) => ({ label: `Trend ${i}`, score: 50 + i })),
      script: Array.from({ length: 8 }, (_, i) => `Beat ${i}`),
      shots: Array.from({ length: 8 }, (_, i) => `Shot ${i}`),
    };
    registerForge(rich);
    expect(getEvents('wf-forge').map((e) => e.type)).toEqual(before);
    expect(deliverables[workflows['wf-forge'].primaryOutput].doc.blocks.some((b) => JSON.stringify(b).includes('A different hook'))).toBe(true);
  });
});
