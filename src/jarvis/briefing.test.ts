import { describe, expect, it } from 'vitest';
import { signals } from '../data/signals';
import { morningBriefing } from './briefing';

describe('morningBriefing', () => {
  const text = morningBriefing();

  it('greets and ends on a question', () => {
    expect(text.startsWith('Good morning')).toBe(true);
    expect(text.trim().endsWith('?')).toBe(true);
  });

  it('mentions the first signal', () => {
    expect(text).toContain(signals[0].headline.split(' · ')[0]);
  });

  it('is short enough to speak in about 20 seconds', () => {
    expect(text.length).toBeLessThanOrEqual(600);
  });

  it('reads naturally aloud, without on-screen numbering', () => {
    expect(text).not.toMatch(/\b0[1-3]\s{2}/);
  });
});
