import { describe, expect, it } from 'vitest';
import { signals } from '../data/signals';
import { workflows } from '../data/workflows';
import { createInitialState, reducer } from '../state/reducer';
import type { AppState } from '../state/types';
import { confirmFor, narrationFor } from './narration';

const running = (): AppState => reducer({ ...createInitialState(1000), bootDone: true }, { type: 'RUN_SIGNAL', id: signals[0].id, now: 2000 });

describe('narrationFor', () => {
  it('names the signal when work starts', () => {
    const prev = running();
    const next: AppState = { ...prev, run: { ...prev.run, stage: 'understand' } };
    expect(narrationFor(prev, next)).toContain(signals[0].kind);
  });

  it('announces a stage change', () => {
    const prev = running();
    const next: AppState = { ...prev, run: { ...prev.run, stage: 'verify' } };
    expect(narrationFor(prev, next)).toMatch(/source/i);
  });

  it('reads out the reason when verification flags something', () => {
    const prev = running();
    const wf = workflows[prev.run.workflowId];
    const flagged = wf.checks.find((c) => c.flag)!;
    const next: AppState = { ...prev, run: { ...prev.run, checks: { ...prev.run.checks, [flagged.id]: 'flag' } } };
    expect(narrationFor(prev, next)).toContain(flagged.flag!.reason);
  });

  it('asks for access when the run is blocked', () => {
    const prev = running();
    const wf = workflows[prev.run.workflowId];
    const next: AppState = {
      ...prev,
      run: { ...prev.run, status: 'blocked', block: { resourceId: wf.block!.resourceId, laneId: wf.block!.laneId, status: 'required', since: 3000 } },
    };
    expect(narrationFor(prev, next)).toMatch(/access/i);
  });

  it('stays quiet during the time-lapse', () => {
    const prev = running();
    const next: AppState = { ...prev, timelapse: { active: true, index: 0, done: false }, run: { ...prev.run, stage: 'verify' } };
    expect(narrationFor(prev, next)).toBeNull();
  });

  it('stays quiet when nothing changed', () => {
    const s = running();
    expect(narrationFor(s, s)).toBeNull();
    expect(narrationFor(s, { ...s, ledger: [] })).toBeNull();
  });
});

describe('confirmFor', () => {
  it('leaves runs and advance to the stage narration, so nothing gets cut off', () => {
    expect(confirmFor({ kind: 'run', signalIndex: 1 })).toBe('');
    expect(confirmFor({ kind: 'advance' })).toBe('');
  });

  it('confirms screens it opens', () => {
    expect(confirmFor({ kind: 'timelapse' })).toMatch(/three times/);
  });
});
