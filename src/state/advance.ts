// "Advance whatever is next" as a pure function, shared by Space, voice ("next") and the pinch gesture.
import { signals } from '../data/signals';
import { workflows } from '../data/workflows';
import { effAutonomy } from './autonomy';
import type { Action, AppState } from './types';

export function firstUnapproved(state: AppState) {
  return Object.entries(state.run.outputs).find(([, s]) => s !== 'approved')?.[0] ?? null;
}

export function advanceActions(state: AppState, now: number): Action[] {
  if (!state.bootDone) return [{ type: 'BOOT_DONE' }];
  if (state.ui.overlay === 'morning') return [{ type: 'OVERLAY', overlay: 'roi' }];
  if (state.ui.viewer || state.ui.drawer || state.ui.overlay || state.timelapse.active) return [];
  const { run } = state;
  switch (run.status) {
    case 'idle':
      return [{ type: 'START', now }];
    case 'running':
    case 'paused':
      return [{ type: 'ADVANCE', now }];
    case 'blocked':
      return run.block?.status === 'required' ? [{ type: 'REQUEST_RESOURCE', id: run.block.resourceId, now }] : [];
    case 'awaitingApproval': {
      if (effAutonomy(state) === 'autopilot') return [];
      const wf = workflows[run.workflowId];
      const id = effAutonomy(state) === 'draft' ? (firstUnapproved(state) ?? wf.primaryOutput) : wf.primaryOutput;
      return [{ type: 'OPEN_VIEWER', id }];
    }
    case 'complete': {
      const next = signals.find((s) => !state.handled[s.id]);
      return next ? [{ type: 'SELECT_SIGNAL', id: next.id }] : [{ type: 'OVERLAY', overlay: 'roi' }];
    }
  }
}
