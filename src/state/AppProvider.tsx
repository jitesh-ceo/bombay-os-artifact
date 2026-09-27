import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react';
import { signals } from '../data/signals';
import { workflows } from '../data/workflows';
import { useSoundCues } from '../sound/useSoundCues';
import { AUTONOMY, effAutonomy, effSpeed } from './autonomy';
import { getEvents } from './compile';
import { createInitialState, persistSound, reducer } from './reducer';
import type { Action, AppState } from './types';

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(Date.now()));
  const { run, bootDone, timelapse } = state;
  const speed = effSpeed(state);
  const autonomy = effAutonomy(state);

  // Workflow timeline runner.
  useEffect(() => {
    if (!bootDone || run.status !== 'running') return;
    const ev = getEvents(run.workflowId)[run.cursor];
    if (!ev) return;
    const t = window.setTimeout(() => dispatch({ type: 'TICK', now: Date.now() }), ev.delay / speed);
    return () => window.clearTimeout(t);
  }, [bootDone, run.status, run.cursor, run.workflowId, speed]);

  // Autopilot: verified outputs deliver without a human approval step.
  useEffect(() => {
    if (run.status !== 'awaitingApproval' || autonomy !== 'autopilot') return;
    const t = window.setTimeout(() => dispatch({ type: 'APPROVE', now: Date.now(), auto: true }), 1500 / speed);
    return () => window.clearTimeout(t);
  }, [run.status, autonomy, speed]);

  // Morning time-lapse: chain the next signal once the current one is delivered.
  useEffect(() => {
    if (!timelapse.active || run.status !== 'complete') return;
    const t = window.setTimeout(() => dispatch({ type: 'TIMELAPSE_NEXT', now: Date.now() }), 1300);
    return () => window.clearTimeout(t);
  }, [timelapse.active, run.status]);

  // Simulated access grants for restricted resources.
  useEffect(() => {
    const requesting = Object.entries(state.grants).filter(([, g]) => g === 'requesting');
    if (!requesting.length) return;
    const timers = requesting.map(([id]) =>
      window.setTimeout(() => dispatch({ type: 'GRANT_RESOURCE', id, now: Date.now() }), 1600),
    );
    return () => timers.forEach(clearTimeout);
  }, [state.grants]);

  useEffect(() => {
    if (run.block?.status !== 'granted') return;
    const t = window.setTimeout(() => dispatch({ type: 'RESUME_BLOCK', now: Date.now() }), 1200);
    return () => window.clearTimeout(t);
  }, [run.block?.status]);

  // Simulated OAuth handshake.
  useEffect(() => {
    const connecting = Object.entries(state.integrations).filter(([, s]) => s === 'connecting');
    if (!connecting.length) return;
    const timers = connecting.map(([id]) =>
      window.setTimeout(() => dispatch({ type: 'CONNECT_DONE', id: id as never, now: Date.now() }), 1400),
    );
    return () => timers.forEach(clearTimeout);
  }, [state.integrations]);

  useEffect(() => persistSound(state.sound), [state.sound]);

  // Setup link: ?setup opens the prospect screen straight away.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('setup')) {
      dispatch({ type: 'BOOT_DONE' });
      dispatch({ type: 'OVERLAY', overlay: 'setup' });
    }
  }, []);

  useSoundCues(state);
  usePresenterKeys(state, dispatch);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function firstUnapproved(state: AppState) {
  return Object.entries(state.run.outputs).find(([, s]) => s !== 'approved')?.[0] ?? null;
}

// Presenter-first keyboard control. Space / Right advances whatever is next.
export function presenterAdvance(state: AppState, dispatch: Dispatch<Action>) {
  const now = Date.now();
  if (!state.bootDone) return dispatch({ type: 'BOOT_DONE' });
  if (state.ui.overlay === 'morning') return dispatch({ type: 'OVERLAY', overlay: 'roi' });
  if (state.ui.viewer || state.ui.drawer || state.ui.overlay || state.timelapse.active) return;
  const { run } = state;
  switch (run.status) {
    case 'idle':
      return dispatch({ type: 'START', now });
    case 'running':
    case 'paused':
      return dispatch({ type: 'ADVANCE', now });
    case 'blocked':
      if (run.block?.status === 'required') dispatch({ type: 'REQUEST_RESOURCE', id: run.block.resourceId, now });
      return;
    case 'awaitingApproval': {
      if (effAutonomy(state) === 'autopilot') return;
      const wf = workflows[run.workflowId];
      const id = effAutonomy(state) === 'draft' ? (firstUnapproved(state) ?? wf.primaryOutput) : wf.primaryOutput;
      return dispatch({ type: 'OPEN_VIEWER', id });
    }
    case 'complete': {
      const next = signals.find((s) => !state.handled[s.id]);
      if (next) dispatch({ type: 'SELECT_SIGNAL', id: next.id });
      else dispatch({ type: 'OVERLAY', overlay: 'roi' });
      return;
    }
  }
}

function usePresenterKeys(state: AppState, dispatch: Dispatch<Action>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!state.bootDone) dispatch({ type: 'BOOT_DONE' });
        dispatch({ type: 'OVERLAY', overlay: state.ui.overlay === 'palette' ? null : 'palette' });
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.isContentEditable);
      if (e.key === 'Escape') {
        if (state.ui.overlay) dispatch({ type: 'OVERLAY', overlay: null });
        else if (state.ui.viewer) dispatch({ type: 'CLOSE_VIEWER' });
        else if (state.ui.drawer) dispatch({ type: 'DRAWER', open: false });
        (document.activeElement as HTMLElement | null)?.blur?.();
        return;
      }
      if (typing) return;
      // The palette handles its own arrow / enter keys.
      if (state.ui.overlay === 'palette' || state.ui.overlay === 'setup') return;
      const k = e.key.toLowerCase();
      const now = Date.now();
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        presenterAdvance(state, dispatch);
      } else if (k === 'r') {
        dispatch({ type: 'RESET', now });
      } else if (k === 'i') {
        dispatch({ type: 'DRAWER', open: !state.ui.drawer });
      } else if (k === 'h') {
        dispatch({ type: 'TOGGLE_HUD' });
      } else if (k === 'm') {
        dispatch({ type: 'SET_VIEW', view: state.ui.view === 'map' ? 'stage' : 'map' });
      } else if (k === 'a') {
        const i = AUTONOMY.findIndex((a) => a.id === state.autonomy);
        dispatch({ type: 'SET_AUTONOMY', level: AUTONOMY[(i + 1) % AUTONOMY.length].id, now });
      } else if (k === 't') {
        if (!state.bootDone) dispatch({ type: 'BOOT_DONE' });
        dispatch({ type: 'TIMELAPSE_START', now });
      } else if (k === 'o') {
        dispatch({ type: 'OVERLAY', overlay: state.ui.overlay === 'roi' ? null : 'roi' });
      } else if (k === 'p') {
        dispatch({ type: 'OVERLAY', overlay: 'setup' });
      } else if (k === 's') {
        dispatch({ type: 'TOGGLE_SOUND' });
      } else if (k === '1' || k === '2' || k === '3') {
        const sig = signals[Number(k) - 1];
        if (sig) {
          if (!state.bootDone) dispatch({ type: 'BOOT_DONE' });
          dispatch({ type: 'SELECT_SIGNAL', id: sig.id });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, dispatch]);
}

export function useAppState() {
  const s = useContext(StateCtx);
  if (!s) throw new Error('useAppState outside provider');
  return s;
}

export function useDispatch() {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error('useDispatch outside provider');
  return d;
}
