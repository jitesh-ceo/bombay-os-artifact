import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { BrandMark } from '../../components/primitives';
import { boot, client, os } from '../../data/client';
import { useAppState, useDispatch } from '../../state/AppProvider';

const LINE_MS = 420;

export function BootSequence() {
  const { bootDone } = useAppState();
  const dispatch = useDispatch();
  const [n, setN] = useState(0);

  useEffect(() => {
    if (bootDone) return;
    if (n >= boot.lines.length) {
      const done = window.setTimeout(() => dispatch({ type: 'BOOT_DONE' }), 700);
      return () => window.clearTimeout(done);
    }
    const tm = window.setTimeout(() => setN((v) => v + 1), n === 0 ? 700 : LINE_MS);
    return () => window.clearTimeout(tm);
  }, [n, bootDone, dispatch]);

  return (
    <AnimatePresence>
      {!bootDone && (
        <motion.div
          className="boot"
          onClick={() => dispatch({ type: 'BOOT_DONE' })}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }}
        >
          <div className="boot__center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
              <BrandMark size={3} />
            </motion.div>
            <motion.div className="boot__title display" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
              {os.name}
            </motion.div>
            <motion.div className="mono t-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              Operating layer for {client.name}
            </motion.div>
          </div>

          <div className="boot__log">
            {boot.lines.slice(0, n).map((l, i) => (
              <motion.div key={l} className="boot__line mono" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <span className="t-4">{String(i + 1).padStart(2, '0')}</span>
                <span className="t-2">{l}</span>
                <span className="boot__dots" />
                <span className="t-ok">OK</span>
              </motion.div>
            ))}
            <div className="boot__bar">
              <motion.span animate={{ scaleX: n / boot.lines.length }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
            </div>
            <div className="mono-sm t-4 boot__skip">Click or press Space to skip</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
