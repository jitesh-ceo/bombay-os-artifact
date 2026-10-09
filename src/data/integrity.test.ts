import { describe, expect, it } from 'vitest';
import { clientByPreset, os } from './client';
import { deliverablesByPreset } from './deliverables';
import { integrationById, restrictedByPreset } from './integrations';
import { newsByPreset } from './news';
import type { PresetId } from './prospect';
import { packsByPreset } from './signals';
import { workflowsByPreset } from './workflows';

const PRESET_IDS: PresetId[] = ['creator', 'studio', 'realestate'];
const tokensIn = (value: unknown) => [...JSON.stringify(value).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);

describe.each(PRESET_IDS)('%s content', (preset) => {
  const wfs = workflowsByPreset[preset];
  const dels = deliverablesByPreset[preset];
  const pack = packsByPreset[preset];
  const restricted = restrictedByPreset[preset];

  it('has exactly three signals, each with a matching workflow', () => {
    expect(pack.signals).toHaveLength(3);
    for (const sig of pack.signals) {
      const wf = Object.values(wfs).find((w) => w.signalId === sig.id);
      expect(wf, sig.id).toBeDefined();
      expect(sig.workflowId).toBe(wf!.id);
    }
  });

  it('only runs intents against its own signals', () => {
    const ids = new Set(pack.signals.map((s) => s.id));
    for (const it of pack.intents) if (it.action.type === 'run') expect(ids.has(it.action.signalId), it.id).toBe(true);
  });

  it('wires every workflow to real outputs, lanes, sources and corrections', () => {
    for (const wf of Object.values(wfs)) {
      expect(wf.outputs.length, wf.id).toBeGreaterThan(0);
      expect(wf.outputs).toContain(wf.primaryOutput);
      for (const o of wf.outputs) expect(dels[o], `${wf.id} → ${o}`).toBeDefined();
      for (const lane of wf.lanes) for (const o of lane.outputIds) expect(wf.outputs, `${wf.id} lane ${lane.id}`).toContain(o);
      for (const f of wf.facts) expect(wf.sources, `${wf.id} fact ${f.label}`).toContain(f.source);
      for (const c of wf.checks) {
        expect(wf.sources, `${wf.id} check ${c.id}`).toContain(c.source);
        if (c.flag) expect(wf.corrections[c.flag.token], `${wf.id} flag token ${c.flag.token}`).toBeDefined();
      }
      if (wf.block) {
        expect(restricted[wf.block.resourceId], `${wf.id} block`).toBeDefined();
        expect(wf.lanes.map((l) => l.id)).toContain(wf.block.laneId);
      }
      const used = [...tokensIn(wf.lanes), ...wf.outputs.flatMap((o) => tokensIn(dels[o]))];
      for (const t of used) expect(wf.corrections[t], `${wf.id} uses {{${t}}}`).toBeDefined();
    }
  });

  it('only references integrations that exist', () => {
    const ids = new Set<string>();
    for (const wf of Object.values(wfs)) {
      wf.sources.forEach((s) => ids.add(s));
      wf.lanes.forEach((l) => ids.add(l.tool));
    }
    for (const d of Object.values(dels)) {
      ids.add(d.destination);
      d.refs.forEach((r) => ids.add(r.source));
    }
    pack.signals.forEach((s) => ids.add(s.source));
    for (const id of ids) expect(integrationById[id as keyof typeof integrationById], id).toBeDefined();
  });

  it('never names the maker as a client', () => {
    const all = JSON.stringify([wfs, dels, pack, restricted, clientByPreset[preset], newsByPreset[preset]]);
    expect(all).not.toContain(os.maker);
  });
});
