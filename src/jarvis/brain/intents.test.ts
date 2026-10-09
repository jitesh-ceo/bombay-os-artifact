import { describe, expect, it } from 'vitest';
import { signals } from '../../data/signals';
import { createInitialState, reducer } from '../../state/reducer';
import type { Action, AppState } from '../../state/types';
import { advanceActions, intentToActions, matchIntent } from './intents';

// Tests run with no ?preset, so the creator preset (brand deal, viral reel, weekly pack) is active.
describe('matchIntent', () => {
  it('runs creator signals by name', () => {
    expect(matchIntent('run the brand deal')).toEqual({ kind: 'run', signalIndex: 0 });
    expect(matchIntent('Ride the viral reel')).toEqual({ kind: 'run', signalIndex: 1 });
    expect(matchIntent("build this week's upload pack")).toEqual({ kind: 'run', signalIndex: 2 });
    expect(matchIntent('run signal three')).toEqual({ kind: 'run', signalIndex: 2 });
  });

  it('extracts a Content Forge topic', () => {
    expect(matchIntent('make me a video about the new iPhone in Dubai')).toEqual({ kind: 'forge', topic: 'the new iPhone in Dubai' });
    expect(matchIntent('Jarvis, create a reel on desert camping.')).toEqual({ kind: 'forge', topic: 'desert camping' });
    expect(matchIntent('سوّ لي فيديو عن شاورما دبي')).toEqual({ kind: 'forge', topic: 'شاورما دبي' });
  });

  it('opens screens', () => {
    expect(matchIntent('show me the ROI')).toEqual({ kind: 'overlay', overlay: 'roi' });
    expect(matchIntent("what's trending")).toEqual({ kind: 'view', view: 'room' });
    expect(matchIntent('show the map')).toEqual({ kind: 'view', view: 'map' });
    expect(matchIntent('open integrations')).toEqual({ kind: 'integrations' });
    expect(matchIntent('play the morning time-lapse')).toEqual({ kind: 'timelapse' });
  });

  it('understands control phrases', () => {
    expect(matchIntent('switch to autopilot')).toEqual({ kind: 'autonomy', level: 'autopilot' });
    expect(matchIntent('next')).toEqual({ kind: 'advance' });
    expect(matchIntent('go ahead')).toEqual({ kind: 'advance' });
    expect(matchIntent('wake up')).toEqual({ kind: 'wake' });
    expect(matchIntent('what needs my attention?')).toEqual({ kind: 'briefing' });
    expect(matchIntent('turn on gestures')).toEqual({ kind: 'gestures', on: true });
    expect(matchIntent('gestures off')).toEqual({ kind: 'gestures', on: false });
    expect(matchIntent('mute')).toEqual({ kind: 'mute', on: true });
    expect(matchIntent('start over')).toEqual({ kind: 'reset' });
  });

  it('understands Arabic', () => {
    expect(matchIntent('اعرض العائد')).toEqual({ kind: 'overlay', overlay: 'roi' });
    expect(matchIntent('التالي')).toEqual({ kind: 'advance' });
  });

  it('leaves chit-chat for the AI brain', () => {
    expect(matchIntent('how are you feeling today')).toBeNull();
    expect(matchIntent('tell me a joke about Dubai traffic')).toBeNull();
    expect(matchIntent('')).toBeNull();
  });

  it('sends questions about a signal to the AI brain instead of running it', () => {
    expect(matchIntent('how much is the brand deal worth?')).toBeNull();
    expect(matchIntent('what did I post this week')).toBeNull();
  });
});

const apply = (s: AppState, actions: Action[]) => actions.reduce(reducer, s);

describe('intentToActions', () => {
  const booted = (): AppState => ({ ...createInitialState(1000), bootDone: true });

  it('starts a signal the same way the keyboard does', () => {
    const s = apply(booted(), intentToActions({ kind: 'run', signalIndex: 0 }, booted(), 2000));
    expect(s.run.signalId).toBe(signals[0].id);
    expect(s.run.status).toBe('running');
    expect(s.ui.view).toBe('stage');
  });

  it('does not restart a signal that is already running', () => {
    const running = apply(booted(), [{ type: 'RUN_SIGNAL', id: signals[0].id, now: 2000 }]);
    const again = apply(running, intentToActions({ kind: 'run', signalIndex: 0 }, running, 5000));
    expect(again.run.startedAt).toBe(2000);
    expect(again.run.status).toBe('running');
  });

  it('opens overlays and the Control Room', () => {
    expect(apply(booted(), intentToActions({ kind: 'overlay', overlay: 'roi' }, booted(), 1)).ui.overlay).toBe('roi');
    const roomed = apply(booted(), intentToActions({ kind: 'view', view: 'room' }, booted(), 1));
    expect(roomed.ui.room).toBe(true);
    const mapped = apply(roomed, intentToActions({ kind: 'view', view: 'map' }, roomed, 1));
    expect(mapped.ui.room).toBe(false);
    expect(mapped.ui.view).toBe('map');
  });

  it('cycles autonomy when no level is named', () => {
    const s = booted();
    expect(apply(s, intentToActions({ kind: 'autonomy' }, s, 1)).autonomy).toBe('autopilot');
  });
});

describe('advanceActions', () => {
  it('starts an idle signal and opens the deliverable when work is ready', () => {
    const idle: AppState = { ...createInitialState(1000), bootDone: true };
    expect(advanceActions(idle, 5)).toEqual([{ type: 'START', now: 5 }]);
    const ready: AppState = { ...idle, run: { ...idle.run, status: 'awaitingApproval' } };
    expect(advanceActions(ready, 5)[0]).toMatchObject({ type: 'OPEN_VIEWER' });
  });

  it('finishes the boot first', () => {
    expect(advanceActions(createInitialState(1000), 5)).toEqual([{ type: 'BOOT_DONE' }]);
  });
});
