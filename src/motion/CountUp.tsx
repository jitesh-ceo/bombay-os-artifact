import { animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function CountUp({ value, format, duration = 1.4 }: { value: number; format: (n: number) => string; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const controls = animate(from.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <>{format(display)}</>;
}
