// JARVIS's face: an arc reactor that breathes when idle, opens up to your voice, spins while
// thinking and pulses with its own speech. Loudness is written straight to CSS variables.
import { useEffect, useId, useRef } from 'react';
import { useJarvis } from '../JarvisProvider';

const COILS = Array.from({ length: 10 }, (_, i) => i * 36);

export function ArcReactor({ size = 2.25, onClick }: { size?: number; onClick?: () => void }) {
  const { mode, levels } = useJarvis();
  const ref = useRef<HTMLButtonElement>(null);
  const core = `rc${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    let raf = 0;
    let mic = 0;
    let out = 0;
    const tick = () => {
      const l = levels();
      // Fast attack, slow release, so the rings move like a meter rather than flicker.
      mic = Math.max(l.mic, mic * 0.88);
      out = Math.max(l.out, out * 0.86);
      const el = ref.current;
      if (el) {
        el.style.setProperty('--mic', mic.toFixed(3));
        el.style.setProperty('--out', out.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [levels]);

  return (
    <button
      ref={ref}
      type="button"
      className={`reactor reactor--${mode}`}
      style={{ width: `${size}rem`, height: `${size}rem` }}
      onClick={onClick}
      aria-label={`JARVIS · ${mode}`}
      title="Hold V to talk · click to type"
    >
      <svg viewBox="0 0 100 100" aria-hidden>
        <defs>
          <radialGradient id={core}>
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#bff3ff" />
            <stop offset="0.7" stopColor="#4fd8ff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#4fd8ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="reactor__scale">
          <g className="reactor__outer">
            <circle cx="50" cy="50" r="46" />
            <circle cx="50" cy="50" r="42" className="reactor__ticks" />
          </g>
        </g>
        <g className="reactor__coils">
          {COILS.map((a) => (
            <rect key={a} x="46" y="14" width="8" height="13" rx="1.5" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
        <circle cx="50" cy="50" r="30" className="reactor__ring" />
        <circle cx="50" cy="50" r="20" className="reactor__core" fill={`url(#${core})`} />
      </svg>
    </button>
  );
}
