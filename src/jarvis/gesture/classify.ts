// Turns a short history of hand landmarks into one of four presenter gestures.
// Landmarks follow MediaPipe's 21-point hand model in image coordinates (0–1, y grows downward).

export type Gesture = 'swipe-left' | 'swipe-right' | 'pinch' | 'fist';

export interface HandFrame {
  t: number;
  landmarks: { x: number; y: number }[];
}

const TIPS = [8, 12, 16, 20];
const PIPS = [6, 10, 14, 18];

const PINCH_DIST = 0.05;
const FIST_HOLD_MS = 500;
const SWIPE_MS = 400;
const SWIPE_DIST = 0.25;

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const extended = (l: HandFrame['landmarks'], i: number) => l[TIPS[i]].y < l[PIPS[i]].y;
const isOpen = (l: HandFrame['landmarks']) => [0, 1, 2, 3].every((i) => extended(l, i));
const isFist = (l: HandFrame['landmarks']) => [0, 1, 2, 3].every((i) => !extended(l, i));
// An "OK" pinch: thumb meets index while the other fingers stay up, so a fist never counts.
const isPinch = (l: HandFrame['landmarks']) => dist(l[4], l[8]) < PINCH_DIST && [1, 2, 3].filter((i) => extended(l, i)).length >= 2;

export function classify(frames: HandFrame[]): Gesture | null {
  const last = frames[frames.length - 1];
  if (!last || last.landmarks.length < 21) return null;
  const l = last.landmarks;

  if (isPinch(l)) return 'pinch';

  if (isFist(l)) {
    const from = last.t - FIST_HOLD_MS;
    const before = [...frames].reverse().find((f) => f.t <= from);
    const held = before && isFist(before.landmarks) && frames.filter((f) => f.t >= from).every((f) => isFist(f.landmarks));
    return held ? 'fist' : null;
  }

  if (isOpen(l)) {
    const recent = frames.filter((f) => f.t >= last.t - SWIPE_MS && isOpen(f.landmarks));
    if (recent.length < 2) return null;
    const dx = l[0].x - recent[0].landmarks[0].x;
    // The camera image is not mirrored: a hand moving to the presenter's right moves left in the image.
    if (dx <= -SWIPE_DIST) return 'swipe-right';
    if (dx >= SWIPE_DIST) return 'swipe-left';
  }
  return null;
}
