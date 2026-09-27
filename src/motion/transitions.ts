import type { Transition, Variants } from 'framer-motion';

export const ease = [0.22, 1, 0.36, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

export const t = {
  fast: { duration: 0.2, ease } as Transition,
  base: { duration: 0.42, ease } as Transition,
  slow: { duration: 0.7, ease } as Transition,
  spring: { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 } as Transition,
  layout: { type: 'spring', stiffness: 170, damping: 26, mass: 1 } as Transition,
};

export const arrive: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: t.base },
  exit: { opacity: 0, y: -4, transition: t.fast },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: t.base },
  exit: { opacity: 0, transition: t.fast },
};

export const stagger = (gap = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});
