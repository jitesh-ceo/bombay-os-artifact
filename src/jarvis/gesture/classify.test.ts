import { describe, expect, it } from 'vitest';
import { classify, type HandFrame } from './classify';

type Pose = 'open' | 'fist' | 'pinch';

// A synthetic right hand in image coordinates (0–1, y grows downward), wrist at (x, 0.8).
function hand(pose: Pose, x = 0.5): { x: number; y: number }[] {
  const p = Array.from({ length: 21 }, () => ({ x, y: 0.8 }));
  const finger = (mcp: number, pip: number, dip: number, tip: number, fx: number, curled: boolean) => {
    p[mcp] = { x: x + fx, y: 0.6 };
    p[pip] = { x: x + fx, y: 0.5 };
    p[dip] = { x: x + fx, y: curled ? 0.56 : 0.42 };
    p[tip] = { x: x + fx, y: curled ? 0.6 : 0.35 };
  };
  finger(5, 6, 7, 8, -0.06, pose === 'fist');
  finger(9, 10, 11, 12, -0.02, pose === 'fist');
  finger(13, 14, 15, 16, 0.02, pose === 'fist');
  finger(17, 18, 19, 20, 0.06, pose === 'fist');
  p[1] = { x: x - 0.08, y: 0.72 };
  p[2] = { x: x - 0.11, y: 0.64 };
  p[3] = { x: x - 0.12, y: 0.56 };
  p[4] = pose === 'pinch' ? { x: x - 0.06 + 0.01, y: 0.36 } : { x: x - 0.14, y: 0.5 };
  return p;
}

const frames = (spec: [number, Pose, number?][]): HandFrame[] => spec.map(([t, pose, x]) => ({ t, landmarks: hand(pose, x) }));

describe('classify', () => {
  it('sees a pinch', () => {
    expect(classify(frames([[0, 'pinch']]))).toBe('pinch');
  });

  it('needs a fist held for half a second', () => {
    expect(classify(frames([[0, 'fist'], [300, 'fist'], [600, 'fist']]))).toBe('fist');
    expect(classify(frames([[0, 'fist'], [200, 'fist']]))).toBeNull();
    expect(classify(frames([[0, 'open'], [300, 'fist'], [600, 'fist']]))).toBeNull();
  });

  it('reads a fast open-palm swipe, mirrored like a selfie camera', () => {
    expect(classify(frames([[0, 'open', 0.75], [150, 'open', 0.6], [300, 'open', 0.4]]))).toBe('swipe-right');
    expect(classify(frames([[0, 'open', 0.3], [150, 'open', 0.45], [300, 'open', 0.62]]))).toBe('swipe-left');
  });

  it('ignores a slow drift and an idle open hand', () => {
    expect(classify(frames([[0, 'open', 0.7], [600, 'open', 0.55], [1200, 'open', 0.4]]))).toBeNull();
    expect(classify(frames([[0, 'open'], [200, 'open']]))).toBeNull();
    expect(classify([])).toBeNull();
  });

  it('does not mistake a fist for a pinch', () => {
    expect(classify(frames([[0, 'fist']]))).toBeNull();
  });
});
