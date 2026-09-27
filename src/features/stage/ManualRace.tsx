import { motion } from 'framer-motion';
import { Hourglass } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppState } from '../../state/AppProvider';
import { effSpeed } from '../../state/autonomy';
import { currentWorkflow, fmtDuration } from '../../state/selectors';

// One real second of the demo stands in for 0.8 minutes of a person doing the same job by hand.
const MANUAL_MIN_PER_SEC = 0.8;

export function ManualRace() {
  const state = useAppState();
  const { run } = state;
  const wf = currentWorkflow(state);
  const [now, setNow] = useState(() => Date.now());
  const running = run.status !== 'idle' && run.finishedAt === null;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);

  // Normalised to 1× so the comparison stays honest at any playback speed.
  const speed = effSpeed(state);
  const total = wf.manual.reduce((a, [, m]) => a + m, 0);
  const end = run.finishedAt ?? now;
  const elapsedMs = run.status === 'idle' ? 0 : Math.max(0, end - run.startedAt) * speed;
  const manualMin = Math.min(total, (elapsedMs / 1000) * MANUAL_MIN_PER_SEC);

  let acc = 0;
  let stepIdx = 0;
  for (let i = 0; i < wf.manual.length; i++) {
    if (manualMin >= acc + wf.manual[i][1]) {
      acc += wf.manual[i][1];
      stepIdx = i + 1;
    } else break;
  }
  stepIdx = Math.min(stepIdx, wf.manual.length - 1);
  const finished = run.finishedAt !== null;
  const stepName = wf.manual[stepIdx][0];

  return (
    <div className={`race ${finished ? 'race--done' : ''} ${run.status === 'idle' ? 'race--idle' : ''}`}>
      <span className="race__label mono-sm">
        <Hourglass size={11} /> Without Bombay OS
      </span>
      <div className="race__bar">
        {wf.manual.map(([name, min], i) => {
          const start = wf.manual.slice(0, i).reduce((a, [, m]) => a + m, 0);
          const p = Math.max(0, Math.min(1, (manualMin - start) / min));
          return (
            <span key={name} className={`race__seg ${i === stepIdx && run.status !== 'idle' ? 'is-current' : ''}`} style={{ flexGrow: min }} title={`${name} · ${min}m`}>
              <motion.span className="race__segfill" animate={{ scaleX: p }} transition={{ duration: 0.25, ease: 'linear' }} />
            </span>
          );
        })}
      </div>
      <span className="race__status mono-sm">
        {run.status === 'idle' ? (
          <>
            {wf.manual.length} manual steps · {Math.round(total / 6) / 10}h
          </>
        ) : finished ? (
          <>
            <span className="t-ok">Bombay OS done in {fmtDuration((run.finishedAt! - run.startedAt - run.blockedMs) * speed)}</span>
            <span className="t-4"> · </span>
            <span className="t-2">
              Manual still on step {stepIdx + 1} of {wf.manual.length}
            </span>
          </>
        ) : (
          <>
            <span className="t-2">
              Step {stepIdx + 1}/{wf.manual.length} · {stepName}
            </span>
            <span className="t-4"> · {Math.floor(manualMin)}m in</span>
          </>
        )}
      </span>
    </div>
  );
}
