import { ambientLedger, client, impactBaseline } from '../data/client';
import { deliverables } from '../data/deliverables';
import { integrationById, integrations, restrictedResources, type IntegrationId } from '../data/integrations';
import { signals } from '../data/signals';
import { workflows, workflowForSignal } from '../data/workflows';
import { AUTONOMY, autonomyLabel, effAutonomy, effHold, effInterrupt } from './autonomy';
import { getEvents } from './compile';
import type { Action, AppState, LedgerEntry, LedgerSeed, RunState, SourceState, WfEvent } from './types';

const SOUND_KEY = 'bombay-os.sound';

function savedSound() {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on';
  } catch {
    return false;
  }
}

export function persistSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable */
  }
}

let ledgerId = 1;

function makeLedger(seeds: LedgerSeed[], time: number): LedgerEntry[] {
  return seeds.map((s) => ({ ...s, id: ledgerId++, time }));
}

function pushLedger(state: AppState, seeds: LedgerSeed[] | undefined, time: number): AppState {
  if (!seeds || !seeds.length) return state;
  return { ...state, ledger: [...state.ledger, ...makeLedger(seeds, time)].slice(-60) };
}

export function createRun(signalId: string): RunState {
  const wf = workflowForSignal(signalId);
  return {
    signalId,
    workflowId: wf.id,
    status: 'idle',
    stage: null,
    cursor: 0,
    startedAt: 0,
    finishedAt: null,
    blockedMs: 0,
    sources: Object.fromEntries(wf.sources.map((s) => [s, 'standby'])),
    facts: 0,
    plan: 0,
    lanes: Object.fromEntries(wf.lanes.map((l) => [l.id, -1])),
    checks: Object.fromEntries(wf.checks.map((c) => [c.id, 'pending'])),
    activeCheck: null,
    corrected: false,
    outputs: Object.fromEntries(wf.outputs.map((o) => [o, 'potential'])),
    block: null,
    gate: null,
    planApproved: false,
    autoApproved: false,
  };
}

export function createInitialState(now: number): AppState {
  return {
    bootDone: false,
    run: createRun(signals[0].id),
    integrations: Object.fromEntries(integrations.map((i) => [i.id, i.initialStatus])) as AppState['integrations'],
    grants: Object.fromEntries(Object.keys(restrictedResources).map((k) => [k, 'restricted'])),
    ledger: ambientLedger.map((a) => ({
      id: ledgerId++,
      time: now - a.minutesAgo * 60_000,
      text: a.text,
      source: a.source,
      tone: a.tone,
    })),
    impact: { ...impactBaseline },
    handled: {},
    autonomy: 'approve',
    sound: savedSound(),
    timelapse: { active: false, index: 0, done: false },
    ui: { drawer: false, drawerFocus: null, viewer: null, view: 'map', overlay: null },
    presenter: { hud: false, speed: 1, hold: false, interrupt: true },
  };
}

function needsPlanGate(state: AppState, ev: WfEvent | undefined) {
  return ev?.type === 'stage' && ev.stage === 'execute' && effAutonomy(state) === 'suggest' && !state.run.planApproved;
}

function openPlanGate(state: AppState, now: number): AppState {
  return pushLedger(
    { ...state, run: { ...state.run, status: 'paused', gate: 'plan' } },
    [{ text: 'Plan ready · waiting for approval (Suggest mode)', tone: 'accent', stage: 'decide' }],
    now,
  );
}

// Marks the run complete, writes the delivery ledger and books the impact.
function finalize(state: AppState, now: number, mode: 'single' | 'auto' | 'afterDrafts'): AppState {
  const wf = workflows[state.run.workflowId];
  const run: RunState = {
    ...state.run,
    status: 'complete',
    autoApproved: mode === 'auto',
    outputs: Object.fromEntries(Object.keys(state.run.outputs).map((k) => [k, 'approved'])),
  };
  const lines = wf.approvalLedger.map((l, i) => ({
    text: i === 0 && mode === 'auto' ? 'Auto-approved · Autopilot policy' : l.text,
    source: l.source,
    tone: (i === 0 ? 'accent' : 'ok') as LedgerSeed['tone'],
    stage: 'deliver' as const,
  }));
  const seeds = mode === 'afterDrafts' ? lines.slice(1) : lines;
  const entries = seeds.map((s, i) => ({ ...s, id: ledgerId++, time: now + i * 1000 }));
  return {
    ...state,
    run,
    ledger: [...state.ledger, ...entries].slice(-60),
    impact: {
      hoursSaved: state.impact.hoursSaved + wf.impact.hours,
      pipelineLakhs: state.impact.pipelineLakhs + wf.impact.pipelineLakhs,
      tasksCompleted: state.impact.tasksCompleted + wf.impact.tasks,
    },
    handled: { ...state.handled, [state.run.signalId]: true },
  };
}

function settleSources(sources: RunState['sources'], keep?: IntegrationId): RunState['sources'] {
  const next: RunState['sources'] = {};
  for (const [k, v] of Object.entries(sources) as [IntegrationId, SourceState][]) {
    next[k] = k === keep ? v : v === 'standby' ? 'standby' : 'done';
  }
  return next;
}

function applyEvent(state: AppState, ev: WfEvent, now: number): AppState {
  const run = { ...state.run, cursor: state.run.cursor + 1 };
  const wf = workflows[run.workflowId];

  switch (ev.type) {
    case 'stage':
      run.stage = ev.stage;
      if (ev.stage === 'decide' || ev.stage === 'deliver') run.sources = settleSources(run.sources);
      if (ev.stage === 'execute') {
        run.lanes = Object.fromEntries(wf.lanes.map((l) => [l.id, 0]));
        run.sources = Object.fromEntries(wf.sources.map((s) => [s, 'done' as SourceState]));
      }
      if (ev.stage === 'verify') run.activeCheck = null;
      break;
    case 'source':
      run.sources = { ...run.sources, [ev.id]: ev.state };
      break;
    case 'fact':
      run.facts += 1;
      break;
    case 'plan':
      run.plan += 1;
      break;
    case 'lane':
      run.lanes = { ...run.lanes, [ev.lane]: ev.done };
      break;
    case 'outputs':
      run.outputs = Object.fromEntries(Object.keys(run.outputs).map((k) => [k, ev.status]));
      break;
    case 'output':
      run.outputs = { ...run.outputs, [ev.id]: ev.status };
      break;
    case 'block': {
      const blockDef = wf.block!;
      if (!effInterrupt(state) || state.grants[blockDef.resourceId] === 'granted') {
        return { ...state, run };
      }
      const res = restrictedResources[blockDef.resourceId];
      run.status = 'blocked';
      run.block = { resourceId: blockDef.resourceId, laneId: blockDef.laneId, status: 'required', since: now };
      run.sources = { ...run.sources, [res.integrationId]: 'blocked' };
      break;
    }
    case 'check': {
      run.checks = { ...run.checks, [ev.id]: ev.state };
      run.activeCheck = ev.id;
      const check = wf.checks.find((c) => c.id === ev.id)!;
      if (ev.state === 'checking') {
        run.sources = { ...settleSources(run.sources), [check.source]: 'reading' };
      }
      if (ev.state === 'pass' || ev.state === 'fixed') {
        run.sources = { ...run.sources, [check.source]: 'done' };
      }
      break;
    }
    case 'correct':
      run.corrected = true;
      break;
    case 'approval':
      run.status = 'awaitingApproval';
      run.finishedAt = now;
      break;
  }

  return pushLedger({ ...state, run }, ev.ledger, now);
}

function advanceToNextStage(state: AppState, now: number): AppState {
  const events = getEvents(state.run.workflowId);
  let s = state;
  const first = events[s.run.cursor];
  if (!first) return s;
  if (needsPlanGate(s, first)) return openPlanGate(s, now);
  s = applyEvent(s, first, now);
  if (first.type === 'stage') return s;
  while (s.run.status === 'running') {
    const ev = events[s.run.cursor];
    if (!ev) break;
    if (needsPlanGate(s, ev)) return openPlanGate(s, now);
    s = applyEvent(s, ev, now);
    if (ev.type === 'stage') break;
  }
  return s;
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'BOOT_DONE':
      return { ...state, bootDone: true };

    case 'SELECT_SIGNAL': {
      if (action.id === state.run.signalId && state.run.status !== 'complete') return state;
      return { ...state, run: createRun(action.id), ui: { ...state.ui, viewer: null } };
    }

    case 'START': {
      if (state.run.status !== 'idle' && state.run.status !== 'complete') return state;
      const run = { ...createRun(state.run.signalId), status: 'running' as const, startedAt: action.now };
      return { ...state, run, ui: { ...state.ui, viewer: null, drawer: false, view: 'stage', overlay: null } };
    }

    case 'RUN_SIGNAL': {
      const selected = reducer(state, { type: 'SELECT_SIGNAL', id: action.id });
      if (selected.run.status !== 'idle' && selected.run.status !== 'complete') {
        return { ...selected, ui: { ...selected.ui, view: 'stage', overlay: null } };
      }
      return reducer(selected, { type: 'START', now: action.now });
    }

    case 'TICK': {
      if (state.run.status !== 'running') return state;
      const ev = getEvents(state.run.workflowId)[state.run.cursor];
      if (!ev) return state;
      if (needsPlanGate(state, ev)) return openPlanGate(state, action.now);
      if (ev.type === 'stage' && effHold(state) && state.run.stage !== null) {
        return { ...state, run: { ...state.run, status: 'paused' } };
      }
      return applyEvent(state, ev, action.now);
    }

    case 'RESUME': {
      if (state.run.status !== 'paused') return state;
      const ev = getEvents(state.run.workflowId)[state.run.cursor];
      let s: AppState = { ...state, run: { ...state.run, status: 'running' as const } };
      if (state.run.gate === 'plan') {
        s = pushLedger(
          { ...s, run: { ...s.run, gate: null, planApproved: true } },
          [{ text: `Plan approved by ${client.approver}`, tone: 'ok', stage: 'decide' }],
          action.now,
        );
      }
      return ev ? applyEvent(s, ev, action.now) : s;
    }

    case 'ADVANCE': {
      if (state.run.status === 'paused') return reducer(state, { type: 'RESUME', now: action.now });
      if (state.run.status !== 'running') return state;
      return advanceToNextStage(state, action.now);
    }

    case 'REQUEST_RESOURCE': {
      if (state.grants[action.id] !== 'restricted') return state;
      const res = restrictedResources[action.id];
      const run = state.run.block?.resourceId === action.id
        ? { ...state.run, block: { ...state.run.block, status: 'requesting' as const } }
        : state.run;
      return pushLedger(
        { ...state, run, grants: { ...state.grants, [action.id]: 'requesting' } },
        [{ text: `Access requested · ${res.path.split(' / ').slice(-1)[0]}`, source: res.integrationId }],
        action.now,
      );
    }

    case 'GRANT_RESOURCE': {
      const res = restrictedResources[action.id];
      const run = state.run.block?.resourceId === action.id
        ? { ...state.run, block: { ...state.run.block, status: 'granted' as const } }
        : state.run;
      return pushLedger(
        { ...state, run, grants: { ...state.grants, [action.id]: 'granted' } },
        [{ text: `Access granted by ${res.owner}`, tone: 'ok', source: res.integrationId }],
        action.now,
      );
    }

    case 'RESUME_BLOCK': {
      const block = state.run.block;
      if (!block || state.run.status !== 'blocked') return state;
      const res = restrictedResources[block.resourceId];
      const run: RunState = {
        ...state.run,
        status: 'running',
        block: null,
        blockedMs: state.run.blockedMs + (action.now - block.since),
        sources: { ...state.run.sources, [res.integrationId]: 'done' },
      };
      return pushLedger({ ...state, run }, [{ text: 'Workflow resumed', tone: 'accent' }], action.now);
    }

    case 'OPEN_VIEWER':
      return { ...state, ui: { ...state.ui, viewer: action.id, drawer: false } };

    case 'CLOSE_VIEWER':
      return { ...state, ui: { ...state.ui, viewer: null } };

    case 'APPROVE': {
      if (state.run.status !== 'awaitingApproval') return state;
      return finalize(state, action.now, action.auto ? 'auto' : 'single');
    }

    case 'APPROVE_ONE': {
      if (state.run.status !== 'awaitingApproval' || state.run.outputs[action.id] === 'approved') return state;
      const outputs = { ...state.run.outputs, [action.id]: 'approved' as const };
      const s = pushLedger(
        { ...state, run: { ...state.run, outputs } },
        [{ text: `${deliverables[action.id].short} approved by ${client.approver}`, tone: 'ok', stage: 'deliver' }],
        action.now,
      );
      return Object.values(outputs).every((o) => o === 'approved') ? finalize(s, action.now + 400, 'afterDrafts') : s;
    }

    case 'SET_AUTONOMY': {
      if (action.level === state.autonomy) return state;
      const def = AUTONOMY.find((a) => a.id === action.level)!;
      return pushLedger(
        { ...state, autonomy: action.level },
        [{ text: `Autonomy set to ${autonomyLabel(action.level)} · ${def.line}`, tone: 'accent' }],
        action.now,
      );
    }

    case 'SET_VIEW':
      return { ...state, ui: { ...state.ui, view: action.view } };

    case 'OVERLAY':
      return { ...state, ui: { ...state.ui, overlay: action.overlay, drawer: false, viewer: action.overlay ? null : state.ui.viewer } };

    case 'TOGGLE_SOUND':
      return { ...state, sound: !state.sound };

    case 'TIMELAPSE_START': {
      const fresh = createInitialState(action.now);
      const base: AppState = pushLedger(
        {
          ...fresh,
          bootDone: true,
          presenter: state.presenter,
          autonomy: state.autonomy,
          sound: state.sound,
          timelapse: { active: true, index: 0, done: false },
        },
        [{ text: `Morning time-lapse · ${signals.length} signals queued on Autopilot`, tone: 'accent' }],
        action.now,
      );
      return reducer(base, { type: 'RUN_SIGNAL', id: signals[0].id, now: action.now });
    }

    case 'TIMELAPSE_NEXT': {
      if (!state.timelapse.active) return state;
      const index = state.timelapse.index + 1;
      const sig = signals[index];
      if (!sig) return reducer(state, { type: 'TIMELAPSE_DONE' });
      return reducer({ ...state, timelapse: { ...state.timelapse, index } }, { type: 'RUN_SIGNAL', id: sig.id, now: action.now });
    }

    case 'TIMELAPSE_DONE':
      return {
        ...state,
        timelapse: { active: false, index: state.timelapse.index, done: true },
        ui: { ...state.ui, overlay: 'morning', viewer: null, drawer: false },
      };

    case 'DRAWER':
      return { ...state, ui: { ...state.ui, drawer: action.open, drawerFocus: action.focus ?? null } };

    case 'CONNECT':
      return { ...state, integrations: { ...state.integrations, [action.id]: 'connecting' } };

    case 'CONNECT_DONE':
      return pushLedger(
        { ...state, integrations: { ...state.integrations, [action.id]: 'connected' } },
        [{ text: `${integrationById[action.id].name} connected · indexing started`, tone: 'ok' }],
        action.now,
      );

    case 'REQUEST_INTEGRATION':
      return pushLedger(
        { ...state, integrations: { ...state.integrations, [action.id]: 'pending' } },
        [{ text: `Access requested · ${integrationById[action.id].name} (${integrationById[action.id].accessOwner ?? 'admin'})` }],
        action.now,
      );

    case 'TOGGLE_HUD':
      return { ...state, presenter: { ...state.presenter, hud: !state.presenter.hud } };
    case 'SET_SPEED':
      return { ...state, presenter: { ...state.presenter, speed: action.speed } };
    case 'TOGGLE_HOLD':
      return { ...state, presenter: { ...state.presenter, hold: !state.presenter.hold } };
    case 'TOGGLE_INTERRUPT':
      return { ...state, presenter: { ...state.presenter, interrupt: !state.presenter.interrupt } };

    case 'RESET': {
      const fresh = createInitialState(action.now);
      return { ...fresh, bootDone: true, presenter: state.presenter, autonomy: state.autonomy, sound: state.sound };
    }
  }
}
