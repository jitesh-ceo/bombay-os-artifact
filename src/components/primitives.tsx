import type { ReactNode } from 'react';

export type Tone = 'neutral' | 'accent' | 'ok' | 'bad' | 'dim';

export function Pill({ tone = 'neutral', children, dot }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`pill pill--${tone}`}>
      {dot && <span className="pill__dot" />}
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Spinner() {
  return <span className="spinner" aria-hidden />;
}

// Decorative HUD dial: a ticked outer ring and a counter-rotating arc.
export function HudDial() {
  return (
    <svg className="hud-dial" viewBox="0 0 24 24" aria-hidden>
      <circle className="hud-dial__outer" cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.2 2.2" />
      <path className="hud-dial__inner" d="M12 5.5a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function BrandMark({ size = 1.375 }: { size?: number }) {
  return (
    // A miniature arc reactor: outer ring, ten coil segments, glowing core.
    <svg viewBox="0 0 22 22" style={{ width: `${size}rem`, height: `${size}rem`, filter: 'drop-shadow(0 0 0.2rem rgba(79,216,255,.6))' }} aria-hidden>
      <circle cx="11" cy="11" r="10" fill="none" stroke="var(--acc)" strokeOpacity="0.55" strokeWidth="0.8" />
      <circle cx="11" cy="11" r="7.2" fill="none" stroke="var(--acc)" strokeWidth="2.2" strokeDasharray="3.4 1.12" />
      <circle cx="11" cy="11" r="3.4" fill="var(--acc-2)" />
      <circle cx="11" cy="11" r="1.6" fill="#fff" />
    </svg>
  );
}
