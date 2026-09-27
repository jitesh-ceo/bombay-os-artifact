import { useEffect, useState } from 'react';

// Reveals text character by character. Used sparingly for "being written" moments.
export function TypeOn({ text, speed = 18, delay = 0 }: { text: string; speed?: number; delay?: number }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    setN(0);
    let i = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        i += 1;
        setN(i);
        if (i >= text.length) window.clearInterval(interval);
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [text, speed, delay]);

  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="type-caret" />}
    </>
  );
}
