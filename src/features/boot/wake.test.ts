import { describe, expect, it } from 'vitest';
import { wakeDecision } from './wake';

describe('wakeDecision', () => {
  it('ignites when the browser already allows sound', () => {
    expect(wakeDecision(true)).toBe('ignite');
  });

  it('asks for one click first, so the briefing is never silent', () => {
    expect(wakeDecision(false)).toBe('ask-click');
  });

  it('ignites when the browser cannot tell', () => {
    expect(wakeDecision(undefined)).toBe('ignite');
  });
});
