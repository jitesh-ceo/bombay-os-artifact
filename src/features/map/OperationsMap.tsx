import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Eye, Play, Radar } from 'lucide-react';
import { useMemo, useState } from 'react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { Kbd, Spinner } from '../../components/primitives';
import { client } from '../../data/client';
import { accounts, signalById, signals, type Signal } from '../../data/signals';
import { STAGES } from '../../data/workflows';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { currentWorkflow } from '../../state/selectors';
import { arcPath, bearing, DOTS, KM_PER_UNIT, project, sweepSlices, VIEW } from './geo';

const PERIOD = 6;
const HQ = project(client.hq.lon, client.hq.lat);
const SLICES = sweepSlices(HQ, 175, 64, 22);
const RINGS = [40, 80, 120, 160, 200];

const pct = (p: { x: number; y: number }) => ({ left: `${(p.x / VIEW.w) * 100}%`, top: `${(p.y / VIEW.h) * 100}%` });

const blipDelay = (p: { x: number; y: number }) => `${((bearing(HQ, p) / 360) * PERIOD - PERIOD).toFixed(2)}s`;

type Tone = 'brief' | 'alert' | 'steady' | 'done';

function signalTone(sig: Signal, handled: boolean): Tone {
  if (handled) return 'done';
  if (sig.urgency === 'Alert') return 'alert';
  if (sig.urgency === 'Scheduled') return 'steady';
  return 'brief';
}

function signalPoint(sig: Signal) {
  const p = project(sig.place.lon, sig.place.lat);
  // Scheduled work happens at HQ; nudge it so both marks stay readable.
  return Math.hypot(p.x - HQ.x, p.y - HQ.y) < 6 ? { x: p.x + 9, y: p.y + 8 } : p;
}

type Hover = { kind: 'signal'; id: string } | { kind: 'account'; i: number } | { kind: 'hq' } | null;

function MapCanvas() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run, handled } = state;
  const [hover, setHover] = useState<Hover>(null);
  const selected = signalById[run.signalId];
  const selPoint = signalPoint(selected);
  const active = run.status !== 'idle' && run.status !== 'complete';

  const accountPts = useMemo(() => accounts.map((a) => ({ ...a, p: project(a.lon, a.lat) })), []);

  const tooltip = (() => {
    if (!hover) return null;
    if (hover.kind === 'hq')
      return { p: HQ, title: `${client.name} · HQ`, sub: `${client.hq.city} · ${client.hq.lat.toFixed(2)}°N ${client.hq.lon.toFixed(2)}°E` };
    if (hover.kind === 'account') {
      const a = accountPts[hover.i];
      return { p: a.p, title: a.name, sub: `${a.city} · ${a.detail}` };
    }
    const s = signalById[hover.id];
    return { p: signalPoint(s), title: `${s.index} · ${s.kind}`, sub: `${s.from} · ${s.place.city}` };
  })();

  return (
    <div className="omap__canvas">
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="omap__svg" aria-label="Live operations map of the UAE">
        <defs>
          <radialGradient id="omap-hq-glow">
            <stop offset="0%" stopColor="rgba(242,169,59,0.28)" />
            <stop offset="100%" stopColor="rgba(242,169,59,0)" />
          </radialGradient>
        </defs>

        {RINGS.map((km) => {
          const r = km / KM_PER_UNIT;
          return (
            <g key={km} className="omap__ring">
              <circle cx={HQ.x} cy={HQ.y} r={r} />
              <text x={HQ.x + r * 0.707 + 2} y={HQ.y - r * 0.707 - 2}>
                {km} km
              </text>
            </g>
          );
        })}
        <line className="omap__axis" x1={HQ.x} y1={0} x2={HQ.x} y2={VIEW.h} />
        <line className="omap__axis" x1={0} y1={HQ.y} x2={VIEW.w} y2={HQ.y} />

        <g className="omap__dots">
          {DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={0.95} />
          ))}
        </g>

        <g className="omap__sweep" style={{ transformOrigin: `${HQ.x}px ${HQ.y}px`, animationDuration: `${PERIOD}s` }}>
          {SLICES.map((s, i) => (
            <path key={i} d={s.d} fill={`rgba(242,169,59,${s.o.toFixed(3)})`} />
          ))}
          <line x1={HQ.x} y1={HQ.y} x2={HQ.x} y2={HQ.y - 175} className="omap__beam" />
        </g>

        {signals.map((s) => {
          if (s.id === selected.id) return null;
          return <path key={s.id} d={arcPath(HQ, signalPoint(s))} className="omap__arc omap__arc--idle" />;
        })}
        <AnimatePresence>
          <motion.path
            key={selected.id}
            d={arcPath(HQ, selPoint)}
            className={`omap__arc omap__arc--sel ${active ? 'is-live' : ''}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>

        {accountPts.map((a, i) => (
          <g key={a.name + i} onMouseEnter={() => setHover({ kind: 'account', i })} onMouseLeave={() => setHover(null)} className="omap__acct">
            <circle cx={a.p.x} cy={a.p.y} r={5} fill="transparent" />
            <circle cx={a.p.x} cy={a.p.y} r={1.9} className="omap__blip" style={{ animationDelay: blipDelay(a.p), animationDuration: `${PERIOD}s` }} />
          </g>
        ))}

        <g onMouseEnter={() => setHover({ kind: 'hq' })} onMouseLeave={() => setHover(null)}>
          <circle cx={HQ.x} cy={HQ.y} r={16} fill="url(#omap-hq-glow)" />
          <rect x={HQ.x - 3} y={HQ.y - 3} width={6} height={6} className="omap__hq" transform={`rotate(45 ${HQ.x} ${HQ.y})`} />
          <circle cx={HQ.x} cy={HQ.y} r={1.3} className="omap__hq-core" />
        </g>

        {signals.map((s) => {
          const p = signalPoint(s);
          const tone = signalTone(s, !!handled[s.id]);
          const isSel = s.id === selected.id;
          return (
            <g
              key={s.id}
              className={`omap__sig omap__sig--${tone} ${isSel ? 'is-sel' : ''}`}
              onClick={() => dispatch({ type: 'SELECT_SIGNAL', id: s.id })}
              onMouseEnter={() => setHover({ kind: 'signal', id: s.id })}
              onMouseLeave={() => setHover(null)}
            >
              <circle cx={p.x} cy={p.y} r={11} fill="transparent" />
              {tone !== 'done' && tone !== 'steady' && (
                <>
                  <circle cx={p.x} cy={p.y} r={3} className="omap__ripple" />
                  <circle cx={p.x} cy={p.y} r={3} className="omap__ripple omap__ripple--2" />
                </>
              )}
              {tone === 'steady' && <circle cx={p.x} cy={p.y} r={6} className="omap__halo" />}
              {isSel && <circle cx={p.x} cy={p.y} r={8} className="omap__target" />}
              <circle cx={p.x} cy={p.y} r={3} className="omap__sig-core" />
            </g>
          );
        })}
      </svg>

      {signals.map((s) => {
        const p = signalPoint(s);
        const tone = signalTone(s, !!handled[s.id]);
        return (
          <div key={s.id} className={`omap__label omap__label--${tone} ${s.id === selected.id ? 'is-sel' : ''}`} style={pct(p)}>
            <span className="mono-sm">{s.index}</span>
            <span>{s.place.city}</span>
          </div>
        );
      })}
      <div className="omap__label omap__label--hq" style={pct(HQ)}>
        <span className="mono-sm">HQ</span>
        <span>{client.hq.city}</span>
      </div>

      <AnimatePresence>
        {tooltip && (
          <motion.div
            className="omap__tip"
            style={pct(tooltip.p)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={t.fast}
          >
            <span className="omap__tip-title">{tooltip.title}</span>
            <span className="mono-sm t-3">{tooltip.sub}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MapSide() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { run, handled } = state;
  const wf = currentWorkflow(state);
  const sig = signalById[run.signalId];
  const stage = STAGES.find((s) => s.id === run.stage);
  const done = run.status === 'complete' || handled[sig.id];
  const active = !done && run.status !== 'idle';

  return (
    <div className="omap__side">
      <AnimatePresence mode="wait">
        <motion.div
          key={sig.id}
          className="mside"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={t.base}
        >
          <div className="mside__eyebrow mono-sm">
            <span className={`mside__dot mside__dot--${signalTone(sig, !!done)}`} />
            Signal {sig.index} · {sig.kind}
          </div>
          <div className="mside__from">
            <IntegrationMark id={sig.source} size="md" />
            <div>
              <div className="mside__name">{sig.from}</div>
              <div className="mono-sm t-3">{sig.fromRole}</div>
            </div>
          </div>
          <p className="mside__quote display">“{sig.excerpt}”</p>
          <div className="mside__facts">
            <span>
              <span className="mono-sm t-4">Priority</span>
              <span className={sig.urgency === 'Alert' ? 't-bad' : sig.urgency === 'High' ? 't-acc' : ''}>{sig.urgency}</span>
            </span>
            <span>
              <span className="mono-sm t-4">Received</span>
              <span>{sig.time}</span>
            </span>
            {sig.value && (
              <span>
                <span className="mono-sm t-4">Value</span>
                <span>{sig.value}</span>
              </span>
            )}
          </div>

          <div className="mside__cta">
            {done ? (
              <div className="mside__status t-ok">
                <Check size={14} strokeWidth={2.5} /> Handled · {wf.outputs.length} deliverables sent
              </div>
            ) : active ? (
              <>
                <div className="mside__status t-acc">
                  <Spinner /> {run.status === 'blocked' ? 'Waiting for access' : run.status === 'awaitingApproval' ? 'Awaiting approval' : `Working · ${stage?.label ?? 'starting'}`}
                </div>
                <button className="btn btn--ghost btn--sm" onClick={() => dispatch({ type: 'SET_VIEW', view: 'stage' })}>
                  <Eye size={12} /> Watch it work <Kbd>M</Kbd>
                </button>
              </>
            ) : (
              <>
                <button className="btn btn--primary btn--lg mside__run" onClick={() => dispatch({ type: 'START', now: Date.now() })}>
                  <Play size={14} fill="currentColor" /> {wf.runLabel}
                </button>
                <div className="mside__estimate mono-sm">
                  <span className="t-1">{wf.brief.estimate}</span>
                  <span className="t-4">vs {wf.brief.manual}</span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mside__next">
        {signals
          .filter((s) => s.id !== sig.id)
          .map((s) => (
            <button key={s.id} className="mside__alt" onClick={() => dispatch({ type: 'SELECT_SIGNAL', id: s.id })}>
              <span className={`mside__dot mside__dot--${signalTone(s, !!handled[s.id])}`} />
              <span className="mside__alt-text">
                <span>{s.kind}</span>
                <span className="mono-sm t-4">
                  {s.place.city} · {handled[s.id] ? 'handled' : s.time}
                </span>
              </span>
              <ArrowRight size={12} className="t-4" />
            </button>
          ))}
      </div>
    </div>
  );
}

export function OperationsMap() {
  const state = useAppState();
  const open = signals.filter((s) => !state.handled[s.id]).length;
  return (
    <div className="omap">
      <div className="omap__stage">
        <div className="omap__hud omap__hud--tl">
          <span className="mono-sm t-acc omap__hud-title">
            <Radar size={12} /> Live operations map · UAE
          </span>
          <span className="mono-sm t-3">
            {accounts.length} accounts watched · {open} signal{open === 1 ? '' : 's'} open
          </span>
        </div>
        <div className="omap__hud omap__hud--bl">
          <span className="omap__key"><i className="omap__key-dot omap__key-dot--brief" /> New brief</span>
          <span className="omap__key"><i className="omap__key-dot omap__key-dot--alert" /> Alert</span>
          <span className="omap__key"><i className="omap__key-dot omap__key-dot--steady" /> Scheduled</span>
          <span className="omap__key"><i className="omap__key-dot omap__key-dot--acct" /> Account healthy</span>
        </div>
        <div className="omap__hud omap__hud--br mono-sm t-4">
          Sweep {PERIOD}s · HQ {client.hq.lat.toFixed(2)}°N {client.hq.lon.toFixed(2)}°E
        </div>
        <MapCanvas />
      </div>
      <MapSide />
    </div>
  );
}
