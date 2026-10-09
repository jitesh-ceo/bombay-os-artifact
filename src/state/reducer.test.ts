import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState, reducer } from './reducer';

describe('sound default', () => {
  beforeEach(() => localStorage.clear());

  it('is on the first time, so JARVIS can speak', () => {
    expect(createInitialState(0).sound).toBe(true);
  });

  it('remembers when the presenter turned it off', () => {
    localStorage.setItem('bombay-os.sound', 'off');
    expect(createInitialState(0).sound).toBe(false);
  });
});

describe('REBOOT', () => {
  it('returns to the boot screen and closes anything open, keeping the work', () => {
    const live = { ...createInitialState(0), bootDone: true, autonomy: 'autopilot' as const };
    const opened = { ...live, ui: { ...live.ui, overlay: 'roi' as const, viewer: 'x', drawer: true } };
    const s = reducer(opened, { type: 'REBOOT' });
    expect(s.bootDone).toBe(false);
    expect(s.ui.overlay).toBeNull();
    expect(s.ui.viewer).toBeNull();
    expect(s.ui.drawer).toBe(false);
    expect(s.autonomy).toBe('autopilot');
  });
});
