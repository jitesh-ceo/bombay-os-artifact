// Hand tracking in the browser with MediaPipe, from files served by the app itself (no network).
// Loaded on demand the first time gestures are switched on.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { classify, type Gesture, type HandFrame } from './classify';

const HISTORY_MS = 1200;
const COOLDOWN_MS = 800;

let landmarker: Promise<HandLandmarker> | null = null;

function load(): Promise<HandLandmarker> {
  landmarker ??= FilesetResolver.forVisionTasks('/mediapipe/wasm').then(async (files) => {
    const opts = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: '/models/hand_landmarker.task', delegate },
      runningMode: 'VIDEO' as const,
      numHands: 1,
    });
    try {
      return await HandLandmarker.createFromOptions(files, opts('GPU'));
    } catch {
      return HandLandmarker.createFromOptions(files, opts('CPU'));
    }
  });
  // A failed load should not poison later attempts.
  landmarker.catch(() => (landmarker = null));
  return landmarker;
}

export type Landmarks = HandFrame['landmarks'] | null;

/** Watches `video` for gestures until the returned stop function is called. */
export async function startHands(video: HTMLVideoElement, onGesture: (g: Gesture) => void, onFrame?: (l: Landmarks) => void): Promise<() => void> {
  const lm = await load();
  let raf = 0;
  let stopped = false;
  let frames: HandFrame[] = [];
  let quietUntil = 0;
  let lastTime = -1;

  const loop = () => {
    if (stopped) return;
    if (video.readyState >= 2 && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      const now = performance.now();
      const hand = lm.detectForVideo(video, now).landmarks?.[0] ?? null;
      onFrame?.(hand);
      if (hand) {
        frames.push({ t: now, landmarks: hand });
        frames = frames.filter((f) => f.t > now - HISTORY_MS);
        if (now > quietUntil) {
          const g = classify(frames);
          if (g) {
            quietUntil = now + COOLDOWN_MS;
            frames = [];
            onGesture(g);
          }
        }
      } else frames = [];
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
  };
}
