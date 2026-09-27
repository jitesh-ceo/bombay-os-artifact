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

export function BrandMark({ size = 1.375 }: { size?: number }) {
  return (
    <svg viewBox="0 0 22 22" style={{ width: `${size}rem`, height: `${size}rem` }} aria-hidden>
      <rect x="0.5" y="0.5" width="21" height="21" rx="5" fill="none" stroke="rgba(244,236,224,.2)" />
      <rect x="5" y="5.5" width="12" height="2.2" rx="1.1" fill="var(--acc)" />
      <rect x="5" y="9.9" width="8" height="2.2" rx="1.1" fill="var(--tx-1)" />
      <rect x="5" y="14.3" width="12" height="2.2" rx="1.1" fill="var(--tx-1)" />
    </svg>
  );
}
