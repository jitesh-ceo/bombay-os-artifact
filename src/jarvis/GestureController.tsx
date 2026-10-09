// Tony Stark mode: the webcam watches one hand. Pinch = advance, fist (hold) = close, swipe = switch.
// Off by default; G or "turn on gestures". If the camera is unavailable it says so and stays off.
import { AnimatePresence, motion } from 'framer-motion';
import { Hand } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sfx } from '../sound/sound';
import { useAppState, useDispatch } from '../state/AppProvider';
import { gestureActions } from './gesture/actions';
import type { Gesture } from './gesture/classify';
import type { Landmarks } from './gesture/hands';
import { useJarvis } from './JarvisProvider';

// MediaPipe's 21-point hand skeleton.
const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const LABEL: Record<Gesture, string> = { pinch: 'Pinch · next', fist: 'Fist · close', 'swipe-left': 'Swipe · previous', 'swipe-right': 'Swipe · next' };

export function GestureController() {
  const state = useAppState();
  const dispatch = useDispatch();
  const jarvis = useJarvis();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [last, setLast] = useState<{ g: Gesture; n: number } | null>(null);
  const live = useRef({ state, jarvis });
  live.current = { state, jarvis };
  const session = useRef<{ stop: () => void; stream: MediaStream } | null>(null);
  const attempt = useRef(0);

  useEffect(() => {
    const stop = () => {
      // Invalidates any start still waiting on the camera or the model.
      attempt.current++;
      session.current?.stop();
      session.current?.stream.getTracks().forEach((t) => t.stop());
      session.current = null;
      setActive(false);
    };

    const draw = (l: Landmarks) => {
      const c = canvas.current;
      const ctx = c?.getContext('2d');
      if (!c || !ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      if (!l) return;
      // Mirror horizontally so the preview moves like a mirror.
      const p = (i: number) => [(1 - l[i].x) * c.width, l[i].y * c.height] as const;
      ctx.strokeStyle = '#4fd8ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#4fd8ff';
      ctx.shadowBlur = 6;
      for (const [a, b] of BONES) {
        ctx.beginPath();
        ctx.moveTo(...p(a));
        ctx.lineTo(...p(b));
        ctx.stroke();
      }
      ctx.fillStyle = '#e8f7ff';
      for (let i = 0; i < 21; i++) {
        ctx.beginPath();
        ctx.arc(...p(i), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const start = async () => {
      if (session.current) return;
      const mine = ++attempt.current;
      const cancelled = () => mine !== attempt.current;
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360, facingMode: 'user' }, audio: false });
        if (cancelled()) return stream.getTracks().forEach((t) => t.stop());
        const v = video.current!;
        v.srcObject = stream;
        await v.play();
        const { startHands } = await import('./gesture/hands');
        if (cancelled()) return stream.getTracks().forEach((t) => t.stop());
        const stopHands = await startHands(
          v,
          (g) => {
            const s = live.current.state;
            if (s.sound) sfx.softTick();
            setLast((p) => ({ g, n: (p?.n ?? 0) + 1 }));
            gestureActions(g, s, Date.now()).forEach(dispatch);
          },
          draw,
        );
        if (cancelled()) {
          stopHands();
          return stream.getTracks().forEach((t) => t.stop());
        }
        session.current = { stop: stopHands, stream };
        setActive(true);
      } catch (err) {
        if (cancelled()) return stream?.getTracks().forEach((t) => t.stop());
        console.warn('[gestures] camera or hand tracking failed', err);
        stream?.getTracks().forEach((t) => t.stop());
        live.current.jarvis.say('The camera is unavailable, so gestures stay off.');
        live.current.jarvis.setGestures(false);
      }
    };

    const off = jarvis.register({ gestures: (on) => (on ? void start() : stop()) });
    return () => {
      off();
      stop();
    };
  }, [jarvis.register, dispatch]);

  useEffect(() => {
    if (!last) return;
    const t = window.setTimeout(() => setLast(null), 1400);
    return () => window.clearTimeout(t);
  }, [last]);

  return (
    <div className={`hands ${jarvis.gestures ? 'is-on' : ''} ${active ? 'is-live' : ''}`} aria-hidden={!jarvis.gestures}>
      <video ref={video} className="hands__video" muted playsInline />
      <canvas ref={canvas} className="hands__canvas" width={320} height={180} />
      <div className="hands__label mono-sm">
        <Hand size={11} /> {active ? 'Hand tracking' : 'Starting camera…'}
      </div>
      <AnimatePresence>
        {last && (
          <motion.div key={last.n} className="hands__hit mono-sm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {LABEL[last.g]}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
