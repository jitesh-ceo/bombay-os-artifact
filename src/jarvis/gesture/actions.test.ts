import { describe, expect, it } from 'vitest';
import { signals } from '../../data/signals';
import { createInitialState, reducer } from '../../state/reducer';
import type { AppState } from '../../state/types';
import { gestureActions } from './actions';

const booted = (): AppState => ({ ...createInitialState(0), bootDone: true });

describe('gestureActions', () => {
  it('pinch advances like Space', () => {
    expect(gestureActions('pinch', booted(), 5)).toEqual([{ type: 'START', now: 5 }]);
  });

  it('fist closes whatever is open, innermost first', () => {
    const s = booted();
    expect(gestureActions('fist', { ...s, ui: { ...s.ui, viewer: 'x', overlay: 'roi' } }, 1)).toEqual([{ type: 'CLOSE_VIEWER' }]);
    expect(gestureActions('fist', { ...s, ui: { ...s.ui, overlay: 'roi' } }, 1)).toEqual([{ type: 'OVERLAY', overlay: null }]);
    expect(gestureActions('fist', s, 1)).toEqual([]);
  });

  it('swipes between signals only when nothing is running', () => {
    const b = booted();
    const s: AppState = { ...b, ui: { ...b.ui, room: false } };
    expect(gestureActions('swipe-right', s, 1)).toEqual([{ type: 'SELECT_SIGNAL', id: signals[1].id }]);
    expect(gestureActions('swipe-left', s, 1)).toEqual([{ type: 'SELECT_SIGNAL', id: signals[2].id }]);
    const running = reducer(s, { type: 'START', now: 1 });
    expect(gestureActions('swipe-right', running, 2)).toEqual([]);
  });

  it('leaves the Control Room on a swipe', () => {
    const s = booted();
    expect(gestureActions('swipe-left', { ...s, ui: { ...s.ui, room: true } }, 1)).toEqual([{ type: 'ROOM', open: false }]);
  });
});
