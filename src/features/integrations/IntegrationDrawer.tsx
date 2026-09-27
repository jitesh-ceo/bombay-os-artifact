import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Lock, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { Spinner } from '../../components/primitives';
import { os } from '../../data/client';
import { integrations, restrictedResources, type IntegrationDef, type IntegrationStatus } from '../../data/integrations';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';

type Filter = 'all' | 'connected' | 'available' | 'access';

const statusMeta: Record<IntegrationStatus, { label: string; tone: string }> = {
  connected: { label: 'Connected', tone: 'ok' },
  available: { label: 'Available', tone: 'neutral' },
  accessRequired: { label: 'Access required', tone: 'bad' },
  pending: { label: 'Pending', tone: 'accent' },
  connecting: { label: 'Connecting', tone: 'accent' },
};

function Row({ def, open, onToggle }: { def: IntegrationDef; open: boolean; onToggle: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const status = state.integrations[def.id];
  const meta = statusMeta[status];
  const restricted = Object.values(restrictedResources).filter((r) => r.integrationId === def.id);

  return (
    <div className={`irow ${open ? 'is-open' : ''}`}>
      <button className="irow__head" onClick={onToggle}>
        <IntegrationMark id={def.id} size="md" />
        <span className="irow__main">
          <span className="irow__name">{def.name}</span>
          <span className="mono-sm t-4">{def.category}</span>
        </span>
        <span className={`pill pill--${meta.tone}`}>
          {status === 'connecting' && <Spinner />}
          {status === 'connected' && <Check size={10} strokeWidth={3} />}
          {status === 'accessRequired' && <Lock size={9} strokeWidth={2.4} />}
          {meta.label}
        </span>
        <ChevronDown size={14} className="irow__chev t-4" />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="irow__detail" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={t.base}>
            <div className="irow__inner">
              <p className="t-2">{def.description}</p>
              {status === 'connected' && def.stats && <div className="mono-sm t-ok">{def.stats}</div>}

              <div className="irow__caps">
                <span className="mono-sm t-4">
                  {status === 'accessRequired' || status === 'pending' ? 'Access required to' : status === 'connected' ? `${os.name} can` : `With access, ${os.name} can`}
                </span>
                {def.capabilities.map((c) => (
                  <span key={c} className="irow__cap">
                    <span className={`irow__cap-dot ${status === 'connected' ? 'is-on' : ''}`} />
                    {c}
                  </span>
                ))}
              </div>

              {restricted.map((r) => {
                const g = state.grants[r.id];
                return (
                  <div key={r.id} className={`irow__resource irow__resource--${g}`}>
                    <Lock size={12} />
                    <span className="irow__res-body">
                      <span className="mono-sm">{r.path}</span>
                      <span className="t-3">{r.reason}</span>
                    </span>
                    {g === 'restricted' && (
                      <button className="btn btn--sm btn--ghost" onClick={() => dispatch({ type: 'REQUEST_RESOURCE', id: r.id, now: Date.now() })}>
                        Request access
                      </button>
                    )}
                    {g === 'requesting' && (
                      <span className="mono-sm t-acc irow__inline">
                        <Spinner /> Pending
                      </span>
                    )}
                    {g === 'granted' && (
                      <span className="mono-sm t-ok irow__inline">
                        <Check size={11} strokeWidth={3} /> Granted
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="irow__actions">
                {status === 'available' && (
                  <button className="btn btn--primary" onClick={() => dispatch({ type: 'CONNECT', id: def.id })}>
                    Connect {def.name}
                  </button>
                )}
                {status === 'connecting' && (
                  <span className="mono-sm t-acc irow__inline">
                    <Spinner /> Authorising securely…
                  </span>
                )}
                {status === 'accessRequired' && (
                  <>
                    <button className="btn btn--primary" onClick={() => dispatch({ type: 'REQUEST_INTEGRATION', id: def.id, now: Date.now() })}>
                      Request access
                    </button>
                    <span className="mono-sm t-4">Approval from {def.accessOwner ?? 'admin'}</span>
                  </>
                )}
                {status === 'pending' && (
                  <motion.span className="irow__sent" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={t.base}>
                    <Check size={13} strokeWidth={2.6} /> Request sent · waiting for {def.accessOwner ?? 'admin'}
                  </motion.span>
                )}
                {status === 'connected' && (
                  <span className="mono-sm t-3 irow__inline">
                    <span className="live__dot live__dot--ok" /> Read access · actions require approval
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DrawerInner() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(state.ui.drawerFocus ?? 'calendar');

  useEffect(() => {
    if (state.ui.drawerFocus) setOpen(state.ui.drawerFocus);
  }, [state.ui.drawerFocus]);

  const counts = useMemo(() => {
    const v = Object.values(state.integrations);
    return {
      all: v.length,
      connected: v.filter((s) => s === 'connected').length,
      available: v.filter((s) => s === 'available' || s === 'connecting').length,
      access: v.filter((s) => s === 'accessRequired' || s === 'pending').length,
    };
  }, [state.integrations]);

  const list = integrations.filter((i) => {
    const s = state.integrations[i.id];
    if (q && !`${i.name} ${i.category}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'connected') return s === 'connected';
    if (filter === 'available') return s === 'available' || s === 'connecting';
    if (filter === 'access') return s === 'accessRequired' || s === 'pending';
    return true;
  });

  const filters: [Filter, string][] = [
    ['all', 'All'],
    ['connected', 'Connected'],
    ['available', 'Available'],
    ['access', 'Access required'],
  ];

  return (
    <motion.div className="drawer-layer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t.base}>
      <div className="drawer-layer__backdrop" onClick={() => dispatch({ type: 'DRAWER', open: false })} />
      <motion.aside className="drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <div className="drawer__head">
          <div>
            <div className="mono t-acc">Add integration</div>
            <h2 className="display drawer__title">Connect the tools your business already uses.</h2>
            <p className="t-3 drawer__sub">{os.name} reads context from these tools and only acts with your approval.</p>
          </div>
          <button className="drawer__close" onClick={() => dispatch({ type: 'DRAWER', open: false })} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <label className="drawer__search">
          <Search size={14} className="t-4" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search integrations…" />
        </label>

        <div className="drawer__filters">
          {filters.map(([k, label]) => (
            <button key={k} className={`chip ${filter === k ? 'is-on' : ''}`} onClick={() => setFilter(k)}>
              {label}
              <span className="chip__n">{counts[k]}</span>
            </button>
          ))}
        </div>

        <div className="drawer__list scroll-y">
          {list.map((def) => (
            <Row key={def.id} def={def} open={open === def.id} onToggle={() => setOpen(open === def.id ? null : def.id)} />
          ))}
          {!list.length && <div className="drawer__empty t-3">No integrations match “{q}”.</div>}
        </div>
      </motion.aside>
    </motion.div>
  );
}

export function IntegrationDrawer() {
  const { ui } = useAppState();
  return <AnimatePresence>{ui.drawer && <DrawerInner key="drawer" />}</AnimatePresence>;
}
