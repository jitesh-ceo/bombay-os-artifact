import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, ShieldCheck } from 'lucide-react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { Kbd, Spinner } from '../../components/primitives';
import { integrationById, restrictedResources } from '../../data/integrations';
import type { Lane } from '../../data/workflows';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { currentWorkflow, fillTokens } from '../../state/selectors';
import { t } from '../../motion/transitions';

function BlockBanner() {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const block = state.run.block;
  if (!block || !wf.block) return null;
  const res = restrictedResources[block.resourceId];
  const integ = integrationById[res.integrationId];

  return (
    <motion.div
      className={`blockcard blockcard--${block.status}`}
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -6, height: 0 }}
      transition={t.base}
    >
      <div className="blockcard__icon">{block.status === 'granted' ? <ShieldCheck size={18} /> : <Lock size={17} />}</div>
      <div className="blockcard__body">
        <div className="blockcard__title">
          <IntegrationMark id={res.integrationId} size="sm" />
          <span className="mono">{integ.name}</span>
          <span className="mono blockcard__state">
            {block.status === 'granted' ? 'Access granted ✓' : block.status === 'requesting' ? 'Request sent' : 'Access required'}
          </span>
        </div>
        <div className="blockcard__need">
          {block.status === 'granted' ? 'Access confirmed. Resuming the workflow from where it paused.' : wf.block.need}
        </div>
        <div className="blockcard__path mono-sm">
          {res.path} · Owner: {res.owner}
        </div>
      </div>
      <div className="blockcard__action">
        {block.status === 'required' && (
          <>
            <button className="btn btn--primary" onClick={() => dispatch({ type: 'REQUEST_RESOURCE', id: block.resourceId, now: Date.now() })}>
              Request access
            </button>
            <span className="mono-sm t-4">
              <Kbd>Space</Kbd>
            </span>
          </>
        )}
        {block.status === 'requesting' && (
          <span className="blockcard__wait mono-sm">
            <Spinner /> Waiting for {res.owner}
          </span>
        )}
        {block.status === 'granted' && (
          <span className="blockcard__wait mono-sm t-ok">
            <Spinner /> Resuming
          </span>
        )}
      </div>
    </motion.div>
  );
}

function LaneView({ lane, index }: { lane: Lane; index: number }) {
  const state = useAppState();
  const wf = currentWorkflow(state);
  const { run } = state;
  const done = Math.max(0, run.lanes[lane.id] ?? 0);
  const finished = done >= lane.steps.length;
  const blocked = run.status === 'blocked' && run.block?.laneId === lane.id;
  const linesShown = Math.ceil((done / lane.steps.length) * lane.preview.length) + (finished ? 0 : 1);

  return (
    <motion.div
      className={`lane ${finished ? 'is-done' : ''} ${blocked ? 'is-blocked' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...t.base, delay: index * 0.09 }}
    >
      <div className="lane__head">
        <IntegrationMark id={lane.tool} size="sm" />
        <span className="lane__title">{lane.title}</span>
        <span className={`lane__status mono-sm ${finished ? 't-ok' : blocked ? 't-bad' : 't-acc'}`}>
          {finished ? 'Drafted' : blocked ? 'Paused' : 'Working'}
        </span>
      </div>

      <div className="lane__doc">
        {lane.preview.map((line, i) => {
          const visible = i < linesShown;
          const text = fillTokens(line, wf, run.corrected);
          return (
            <div key={i} className={`lane__line ${i === 0 ? 'is-title' : ''} ${!visible ? 'is-pending' : ''}`}>
              {visible ? (
                <motion.span initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }} animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  {text}
                </motion.span>
              ) : (
                <span className="lane__ghost" style={{ width: `${55 + ((i * 23) % 35)}%` }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="lane__steps">
        {lane.steps.map((s, i) => {
          const st = i < done ? 'done' : i === done && !finished ? (blocked ? 'blocked' : 'running') : 'pending';
          return (
            <div key={s} className={`lstep lstep--${st}`}>
              <span className="lstep__icon">
                {st === 'done' ? <Check size={10} strokeWidth={3} /> : st === 'running' ? <Spinner /> : st === 'blocked' ? <Lock size={9} /> : null}
              </span>
              <span>{s}</span>
            </div>
          );
        })}
      </div>

      <div className="lane__bar">
        <motion.span animate={{ width: `${(done / lane.steps.length) * 100}%` }} transition={t.slow} />
      </div>
    </motion.div>
  );
}

export function ExecutePanel() {
  const state = useAppState();
  const wf = currentWorkflow(state);

  return (
    <div className="execute">
      <AnimatePresence>{state.run.block && <BlockBanner key="block" />}</AnimatePresence>
      <div className="lanes" style={{ gridTemplateColumns: `repeat(${wf.lanes.length}, 1fr)` }}>
        {wf.lanes.map((l, i) => (
          <LaneView key={l.id} lane={l} index={i} />
        ))}
      </div>
    </div>
  );
}
