import { useEffect, useRef } from 'react';
import type { AppState } from '../state/types';
import { sfx } from './sound';

// Plays a cue when the state crosses a meaningful boundary.
export function useSoundCues(state: AppState) {
  const prev = useRef(state);

  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (state.sound && !p.sound) sfx.on();
    if (!state.sound) return;

    const run = state.run;
    const sameRun = p.run.signalId === run.signalId && p.run.startedAt === run.startedAt;
    if (!sameRun) return;

    if (run.facts > p.run.facts) sfx.tick();
    else if (run.plan > p.run.plan) sfx.softTick();

    for (const [id, st] of Object.entries(run.checks)) {
      const before = p.run.checks[id];
      if (st === before) continue;
      if (st === 'flag') sfx.flag();
      else if (st === 'fixed') sfx.verified();
      else if (st === 'pass') sfx.softTick();
    }

    if (run.status === 'blocked' && p.run.status !== 'blocked') sfx.block();
    if (run.status === 'complete' && p.run.status !== 'complete') sfx.chime();
  }, [state]);
}
