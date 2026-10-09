import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialState } from './reducer';

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
