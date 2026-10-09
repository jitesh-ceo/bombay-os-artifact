// What each gesture does on the current screen. Pure, so it is tested without a camera.
import { signals } from '../../data/signals';
import { advanceActions } from '../../state/advance';
import type { Action, AppState } from '../../state/types';
import type { Gesture } from './classify';

/** The app actions for a gesture, given the current screen. */
export function gestureActions(g: Gesture, s: AppState, now: number): Action[] {
  if (g === 'pinch') return advanceActions(s, now);
  if (g === 'fist') {
    if (s.ui.viewer) return [{ type: 'CLOSE_VIEWER' }];
    if (s.ui.overlay) return [{ type: 'OVERLAY', overlay: null }];
    if (s.ui.drawer) return [{ type: 'DRAWER', open: false }];
    return [];
  }
  if (s.ui.room) return [{ type: 'ROOM', open: false }];
  // Swiping between signals never abandons work in progress.
  if (s.run.status !== 'idle' && s.run.status !== 'complete') return [];
  const i = Math.max(0, signals.findIndex((x) => x.id === s.run.signalId));
  const next = signals[(i + (g === 'swipe-right' ? 1 : -1) + signals.length) % signals.length];
  return [{ type: 'SELECT_SIGNAL', id: next.id }];
}
