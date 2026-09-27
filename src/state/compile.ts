import { workflows, type Workflow } from '../data/workflows';
import { integrationById, restrictedResources } from '../data/integrations';
import type { WfEvent } from './types';

// Turns a declarative workflow into a flat, timed event script.
// Delays are in ms at 1x speed and represent the pause *before* the event fires.
function compile(wf: Workflow): WfEvent[] {
  const ev: WfEvent[] = [];
  const push = (e: WfEvent) => ev.push(e);

  // UNDERSTAND
  push({ type: 'stage', stage: 'understand', delay: 500, ledger: [{ text: `Signal accepted · ${wf.runLabel}`, tone: 'accent', stage: 'understand' }] });
  for (const src of wf.sources) {
    const facts = wf.facts.filter((f) => f.source === src);
    if (!facts.length) continue;
    push({ type: 'source', id: src, state: 'reading', delay: 450 });
    for (const f of facts) {
      push({ type: 'fact', delay: 950, ledger: [{ text: `Read · ${f.label}`, source: src, stage: 'understand' }] });
    }
    push({ type: 'source', id: src, state: 'done', delay: 250 });
  }

  // DECIDE
  push({
    type: 'stage',
    stage: 'decide',
    delay: 900,
    ledger: [{ text: `Context assembled · ${wf.facts.length} facts from ${wf.sources.length} sources`, stage: 'decide' }],
  });
  wf.plan.forEach(() => push({ type: 'plan', delay: 620 }));
  ev[ev.length - 1].ledger = [{ text: `Execution plan created · ${wf.plan.length} steps`, tone: 'accent', stage: 'decide' }];

  // EXECUTE
  push({
    type: 'stage',
    stage: 'execute',
    delay: 1000,
    ledger: [{ text: `${wf.lanes.length} tasks dispatched in parallel`, stage: 'execute' }],
  });
  push({ type: 'outputs', status: 'drafting', delay: 150 });
  const maxSteps = Math.max(...wf.lanes.map((l) => l.steps.length));
  let laneEvents = 0;
  for (let s = 1; s <= maxSteps; s++) {
    for (const lane of wf.lanes) {
      if (lane.steps.length < s) continue;
      const finished = s === lane.steps.length;
      push({
        type: 'lane',
        lane: lane.id,
        done: s,
        delay: 620,
        ledger: finished
          ? [{ text: `${lane.title} drafted`, source: lane.tool, stage: 'execute' }]
          : undefined,
      });
      laneEvents++;
      if (wf.block && laneEvents === wf.block.afterLaneEvent) {
        const res = restrictedResources[wf.block.resourceId];
        push({
          type: 'block',
          delay: 700,
          ledger: [
            {
              text: `Access required · ${integrationById[res.integrationId].name} / ${res.path.split(' / ').slice(-1)[0]}`,
              tone: 'flag',
              source: res.integrationId,
              stage: 'execute',
            },
          ],
        });
      }
    }
  }

  // VERIFY
  push({
    type: 'stage',
    stage: 'verify',
    delay: 1000,
    ledger: [{ text: `Verifying outputs against ${wf.checks.length} sources of truth`, stage: 'verify' }],
  });
  push({ type: 'outputs', status: 'verifying', delay: 150 });
  for (const c of wf.checks) {
    push({ type: 'check', id: c.id, state: 'checking', delay: 550 });
    if (c.flag) {
      push({
        type: 'check',
        id: c.id,
        state: 'flag',
        delay: 1300,
        ledger: [{ text: c.flag.ledger.detected, tone: 'flag', source: c.source, stage: 'verify' }],
      });
      push({
        type: 'check',
        id: c.id,
        state: 'fixing',
        delay: 2400,
        ledger: [{ text: c.flag.ledger.verified, source: c.source, stage: 'verify' }],
      });
      push({
        type: 'correct',
        delay: 1600,
        ledger: [{ text: c.flag.ledger.corrected, tone: 'ok', stage: 'verify' }],
      });
      push({ type: 'check', id: c.id, state: 'fixed', delay: 200 });
    } else {
      push({
        type: 'check',
        id: c.id,
        state: 'pass',
        delay: 850,
        ledger: [{ text: `${c.label} verified`, tone: 'ok', source: c.source, stage: 'verify' }],
      });
    }
  }

  // DELIVER
  push({ type: 'stage', stage: 'deliver', delay: 1100 });
  push({ type: 'outputs', status: 'staged', delay: 250 });
  for (const id of wf.outputs) {
    push({ type: 'output', id, status: 'ready', delay: 650 });
  }
  push({
    type: 'approval',
    delay: 800,
    ledger: [{ text: `${wf.outputs.length} deliverables ready for approval`, tone: 'accent', stage: 'deliver' }],
  });

  return ev;
}

const cache = new Map<string, WfEvent[]>();

export function getEvents(workflowId: string): WfEvent[] {
  let e = cache.get(workflowId);
  if (!e) {
    e = compile(workflows[workflowId]);
    cache.set(workflowId, e);
  }
  return e;
}
