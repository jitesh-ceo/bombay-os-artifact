import { AnimatePresence, motion } from 'framer-motion';
import { Check, PenLine, Send, ShieldCheck, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { Spinner } from '../../components/primitives';
import { client } from '../../data/client';
import { deliverables, type Block } from '../../data/deliverables';
import { integrationById } from '../../data/integrations';
import type { Workflow } from '../../data/workflows';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { effAutonomy } from '../../state/autonomy';
import { currentWorkflow, fillTokens } from '../../state/selectors';
import { kindIcon } from './OutputTray';

function Ref({ n }: { n?: number }) {
  if (!n) return null;
  return <sup className="doc__ref">{n}</sup>;
}

function renderBlock(b: Block, i: number, wf: Workflow, corrected: boolean): ReactNode {
  const f = (s: string) => fillTokens(s, wf, corrected);
  switch (b.t) {
    case 'h':
      return (
        <h3 key={i} className="doc__h">
          {b.text}
          <Ref n={b.ref} />
        </h3>
      );
    case 'lead':
      return (
        <p key={i} className="doc__lead">
          {f(b.text)}
          <Ref n={b.ref} />
        </p>
      );
    case 'p':
      return (
        <p key={i} className="doc__p">
          {f(b.text)}
          <Ref n={b.ref} />
        </p>
      );
    case 'list':
      return (
        <ul key={i} className="doc__list">
          {b.items.map((it) => (
            <li key={it}>{f(it)}</li>
          ))}
        </ul>
      );
    case 'kv':
      return (
        <div key={i} className="doc__kv">
          {b.items.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <span>{f(v)}</span>
            </div>
          ))}
          <Ref n={b.ref} />
        </div>
      );
    case 'steps':
      return (
        <div key={i} className="doc__steps">
          {b.items.map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <span>{f(v)}</span>
            </div>
          ))}
        </div>
      );
    case 'table':
      return (
        <div key={i} className="doc__table-wrap" data-watch={b.watchToken ? 'true' : undefined}>
          <table className="doc__table">
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, ci) => (
                    <td key={ci}>{f(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            {b.total && (
              <tfoot>
                <tr>
                  <td>{b.total[0]}</td>
                  <td>
                    {f(b.total[1])}
                    <Ref n={b.ref} />
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          {b.watchToken && corrected && (
            <div className="doc__margin">
              <ShieldCheck size={11} /> Verified against source · corrected from {wf.corrections[b.watchToken].generated}
            </div>
          )}
        </div>
      );
  }
}

function ViewerInner({ id }: { id: string }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const wf = currentWorkflow(state);
  const { run } = state;
  const [current, setCurrent] = useState(id);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState<'idle' | 'sending' | 'sent'>('idle');
  const d = deliverables[current];
  const approved = run.outputs[current] === 'approved';
  const canApprove = run.status === 'awaitingApproval';
  const index = wf.outputs.indexOf(current);
  const flagged = wf.checks.filter((c) => c.flag);

  useEffect(() => setCurrent(id), [id]);

  const paperRef = useRef<HTMLDivElement>(null);
  const showCorrection = () => {
    const scroll = () => {
      const wrap = paperRef.current;
      const target = wrap?.querySelector<HTMLElement>('[data-watch]');
      if (wrap && target) wrap.scrollTo({ top: target.offsetTop - 120, behavior: 'smooth' });
    };
    if (current !== wf.primaryOutput) {
      setCurrent(wf.primaryOutput);
      window.setTimeout(scroll, 500);
    } else scroll();
  };

  const draftMode = effAutonomy(state) === 'draft';
  const approvedCount = wf.outputs.filter((o) => run.outputs[o] === 'approved').length;
  const nextDraft = wf.outputs.find((o) => o !== current && run.outputs[o] !== 'approved') ?? null;

  const approve = () => {
    setEditing(false);
    if (draftMode) {
      dispatch({ type: 'APPROVE_ONE', id: current, now: Date.now() });
      if (nextDraft) window.setTimeout(() => setCurrent(nextDraft), 650);
      else {
        setSending('sent');
        window.setTimeout(() => dispatch({ type: 'CLOSE_VIEWER' }), 1600);
      }
      return;
    }
    setSending('sending');
    window.setTimeout(() => {
      dispatch({ type: 'APPROVE', now: Date.now() });
      setSending('sent');
      window.setTimeout(() => dispatch({ type: 'CLOSE_VIEWER' }), 1500);
    }, 1000);
  };

  const allDone = run.status === 'complete' || sending === 'sent';

  return (
    <motion.div className="viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t.base}>
      <div className="viewer__backdrop" onClick={() => dispatch({ type: 'CLOSE_VIEWER' })} />

      <motion.div className="viewer__frame" initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }} transition={t.slow}>
        <div className="viewer__tabs">
          {wf.outputs.map((o) => {
            const Icon = kindIcon[deliverables[o].kind];
            const available = run.outputs[o] === 'ready' || run.outputs[o] === 'approved';
            return (
              <button key={o} disabled={!available} className={`vtab ${o === current ? 'is-active' : ''}`} onClick={() => setCurrent(o)}>
                <Icon size={13} strokeWidth={1.7} />
                {deliverables[o].short}
                {run.outputs[o] === 'approved' && <Check size={11} strokeWidth={2.6} className="t-ok" />}
              </button>
            );
          })}
          <button className="viewer__close" onClick={() => dispatch({ type: 'CLOSE_VIEWER' })} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="viewer__body">
          <div className="viewer__paper-wrap scroll-y" ref={paperRef}>
            <AnimatePresence mode="wait">
              <motion.article
                key={current}
                className={`doc doc--${d.kind} ${editing ? 'is-editing' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={t.base}
                contentEditable={editing}
                suppressContentEditableWarning
                spellCheck={false}
              >
                <header className="doc__brand">
                  <span className="doc__mark">{client.initials}</span>
                  <span className="doc__brand-name">{client.name}</span>
                  <span className="doc__eyebrow">{d.doc.eyebrow}</span>
                </header>
                <h2 className="doc__title">{d.doc.title}</h2>
                <div className="doc__meta">
                  {d.doc.meta.map(([k, v]) => (
                    <div key={k}>
                      <span>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <div className="doc__content">{d.doc.blocks.map((b, i) => renderBlock(b, i, wf, run.corrected))}</div>
                {d.refs.length > 0 && (
                  <footer className="doc__sources">
                    <span>Sources</span>
                    {d.refs.map((r) => (
                      <span key={r.n}>
                        <sup>{r.n}</sup> {integrationById[r.source].name} — {r.label}
                      </span>
                    ))}
                  </footer>
                )}
              </motion.article>
            </AnimatePresence>
          </div>

          <aside className="viewer__side">
            <div>
              <div className="mono-sm t-4">
                Deliverable {index + 1} / {wf.outputs.length}
              </div>
              <div className="display viewer__title">{d.title}</div>
              <div className="viewer__dest">
                <IntegrationMark id={d.destination} size="sm" />
                <span className="mono-sm t-2">{approved ? d.approvedLabel : `Will go to ${d.destinationLabel}`}</span>
              </div>
            </div>

            <div className="viewer__section">
              <div className="mono-sm t-4">Built from</div>
              {d.refs.map((r) => (
                <div key={r.n} className="viewer__ref">
                  <span className="viewer__ref-n mono-sm">{r.n}</span>
                  <IntegrationMark id={r.source} size="sm" />
                  <span>{r.label}</span>
                </div>
              ))}
            </div>

            <div className="viewer__section">
              <div className="mono-sm t-4">Verification</div>
              <div className="viewer__verify">
                <ShieldCheck size={14} className="t-ok" />
                <span>{wf.checks.length} checks passed against source</span>
              </div>
              {run.corrected &&
                flagged.map((c) => (
                  <button key={c.id} className="viewer__fix" onClick={showCorrection}>
                    <span className="mono-sm t-acc">1 correction · show in document</span>
                    <span>
                      <s className="t-4">{c.flag!.generated}</s> → <span className="t-1">{c.flag!.verified}</span>
                    </span>
                    <span className="t-3">{c.label} matched to {c.against.split(' / ').slice(-1)[0]}</span>
                  </button>
                ))}
            </div>

            <div className="viewer__actions">
              <AnimatePresence mode="wait">
                {allDone ? (
                  <motion.div key="done" className="viewer__done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={t.base}>
                    <span className="viewer__done-mark">
                      <Check size={16} strokeWidth={2.6} />
                    </span>
                    <div>
                      <div className="t-1">{run.autoApproved ? 'Delivered on Autopilot' : 'Approved & delivered'}</div>
                      <div className="mono-sm t-3">{wf.completion.join(' · ')}</div>
                    </div>
                  </motion.div>
                ) : approved ? (
                  <motion.div key={`ok-${current}`} className="viewer__done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={t.base}>
                    <span className="viewer__done-mark">
                      <Check size={16} strokeWidth={2.6} />
                    </span>
                    <div>
                      <div className="t-1">Draft approved</div>
                      <div className="mono-sm t-3">
                        {approvedCount} / {wf.outputs.length} approved{nextDraft ? ' · opening next draft' : ''}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="act" className="viewer__buttons" exit={{ opacity: 0 }}>
                    <button className={`btn btn--ghost ${editing ? 'is-on' : ''}`} onClick={() => setEditing((e) => !e)} disabled={sending !== 'idle'}>
                      <PenLine size={14} /> {editing ? 'Done editing' : 'Edit'}
                    </button>
                    <button className="btn btn--primary btn--lg" onClick={approve} disabled={!canApprove || sending !== 'idle'}>
                      {sending === 'sending' ? (
                        <>
                          <Spinner /> Sending…
                        </>
                      ) : draftMode ? (
                        <>
                          <Check size={14} strokeWidth={2.4} /> Approve draft {index + 1} of {wf.outputs.length}
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Approve & send
                        </>
                      )}
                    </button>
                    <span className="mono-sm t-4 viewer__approver">
                      {draftMode
                        ? `Draft mode · each deliverable approved individually · ${approvedCount} / ${wf.outputs.length} done`
                        : `One approval sends all ${wf.outputs.length} deliverables · ${client.approver}`}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DeliverableViewer() {
  const { ui } = useAppState();
  return <AnimatePresence>{ui.viewer && <ViewerInner key="viewer" id={ui.viewer} />}</AnimatePresence>;
}
