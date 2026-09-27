import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { integrationById, type IntegrationId } from '../../data/integrations';
import { STAGES } from '../../data/workflows';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { currentWorkflow } from '../../state/selectors';
import type { SourceState } from '../../state/types';
import { easeInOut } from '../../motion/transitions';

interface Props {
  focus: IntegrationId | null;
  onFocus: (id: IntegrationId | null) => void;
}

export function SourceContext({ focus, onFocus }: Props) {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const { run } = state;
  const revealed = wf.facts.slice(0, run.facts);
  const stageIdx = run.stage ? STAGES.findIndex((s) => s.id === run.stage) : 0;

  const label = (id: IntegrationId, st: SourceState) => {
    const used = revealed.filter((f) => f.source === id).length;
    if (st === 'blocked') return 'Access required';
    if (st === 'reading') return run.stage === 'verify' ? 'Verifying against' : 'Reading';
    if (st === 'done') return `${used} item${used === 1 ? '' : 's'} in context`;
    return run.status === 'idle' ? 'Connected' : 'Standby';
  };

  return (
    <div className="ctx">
      <div className="ctx__label mono-sm t-4">Source context</div>
      <div className="ctx__row">
        {wf.sources.map((id) => {
          const st = run.sources[id] ?? 'standby';
          return (
            <button
              key={id}
              className={`src src--${st} ${focus && focus !== id ? 'is-dim' : ''}`}
              onMouseEnter={() => onFocus(id)}
              onMouseLeave={() => onFocus(null)}
              onClick={() => dispatch({ type: 'DRAWER', open: true, focus: id })}
            >
              <IntegrationMark id={id} size="md" />
              <span className="src__body">
                <span className="src__name">{integrationById[id].name}</span>
                <span className="src__state mono-sm">{label(id, st)}</span>
              </span>
              <span className="src__indicator" />
              {st === 'reading' && <span className="src__scan" />}
            </button>
          );
        })}
        <button className="src src--add" onClick={() => dispatch({ type: 'DRAWER', open: true })}>
          <Plus size={14} />
          <span className="mono-sm">Add source</span>
        </button>
      </div>

      <svg className="ctx__wires" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
        {wf.sources.map((id, i) => {
          const st = run.sources[id] ?? 'standby';
          const x0 = 12.5 + i * 25;
          const x1 = 10 + stageIdx * 20;
          const d = `M ${x0} 0 C ${x0} 22, ${x1} 18, ${x1} 40`;
          return (
            <g key={id}>
              <motion.path
                d={d}
                animate={{ d }}
                transition={{ duration: 0.9, ease: easeInOut }}
                className={`wire wire--${st}`}
                vectorEffect="non-scaling-stroke"
              />
              {st === 'reading' && (
                <motion.path d={d} animate={{ d }} className="wire-flow" vectorEffect="non-scaling-stroke" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
