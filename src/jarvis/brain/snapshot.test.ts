import { describe, expect, it } from 'vitest';
import { signals } from '../../data/signals';
import { createInitialState } from '../../state/reducer';
import { buildSnapshot } from './snapshot';

describe('buildSnapshot', () => {
  const state = { ...createInitialState(1000), bootDone: true };

  it('is compact JSON the model can read', () => {
    const s = buildSnapshot(state);
    expect(s.length).toBeLessThanOrEqual(2000);
    const data = JSON.parse(s);
    expect(data.preset).toBe('creator');
    expect(data.current.signal).toContain(signals[0].kind);
    expect(data.waiting).toHaveLength(3);
    expect(data.channels.length).toBeGreaterThan(0);
  });
});
