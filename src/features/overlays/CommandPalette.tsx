import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Command,
  CornerDownLeft,
  LayoutDashboard,
  Map as MapIcon,
  Play,
  Plug,
  Sparkles,
  Sunrise,
  TrendingUp,
  UserRound,
  Volume2,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Kbd } from '../../components/primitives';
import { client } from '../../data/client';
import { prospect } from '../../data/prospect';
import { briefing, intents, signals } from '../../data/signals';
import { TypeOn } from '../../motion/TypeOn';
import { t } from '../../motion/transitions';
import { useAppState, useDispatch } from '../../state/AppProvider';
import type { Action } from '../../state/types';

type Item = { id: string; group: 'Intents' | 'Go to'; label: string; hint: string; icon: LucideIcon; run: () => void };

function Briefing({ onRunTop, onClose }: { onRunTop: (() => void) | null; onClose: () => void }) {
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= briefing.length) return;
    const id = window.setTimeout(() => setShown((n) => n + 1), briefing[shown - 1].length * 14 + 260);
    return () => window.clearTimeout(id);
  }, [shown]);
  const done = shown >= briefing.length;

  return (
    <motion.div className="pal__brief" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={t.base}>
      <div className="pal__brief-head mono-sm t-acc">
        <Sparkles size={12} /> Briefing · composed from Gmail, Drive and Notion just now
      </div>
      <div className="pal__brief-lines">
        {briefing.slice(0, shown).map((line, i) => {
          const numbered = /^\d\d\s/.test(line);
          return (
            <p key={i} className={`pal__line ${i === 0 ? 'is-lead display' : ''} ${numbered ? 'is-item' : ''}`}>
              {numbered && <span className="pal__line-n mono-sm">{line.slice(0, 2)}</span>}
              <span>{i === shown - 1 ? <TypeOn text={numbered ? line.slice(4) : line} speed={14} /> : numbered ? line.slice(4) : line}</span>
            </p>
          );
        })}
      </div>
      <AnimatePresence>
        {done && (
          <motion.div className="pal__brief-cta" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={t.base}>
            {onRunTop && (
              <button className="btn btn--primary" onClick={onRunTop}>
                <Play size={13} fill="currentColor" /> Run top priority
              </button>
            )}
            <button className="btn btn--ghost" onClick={onClose}>
              Back to operations
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function CommandPalette() {
  const state = useAppState();
  const dispatch = useDispatch();
  const open = state.ui.overlay === 'palette';
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<'list' | 'briefing'>('list');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setMode('list');
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const go = (a: Action) => dispatch(a);
  const close = () => dispatch({ type: 'OVERLAY', overlay: null });
  const topPriority = signals.find((s) => !state.handled[s.id]);

  const items: Item[] = (() => {
    const list: Item[] = intents.map((it) => ({
      id: it.id,
      group: 'Intents' as const,
      label: it.label,
      hint: it.hint,
      icon: it.action.type === 'briefing' ? Sparkles : Play,
      run: () => {
        if (it.action.type === 'briefing') setMode('briefing');
        else go({ type: 'RUN_SIGNAL', id: it.action.signalId, now: Date.now() });
      },
    }));
    list.push(
      { id: 'map', group: 'Go to', label: 'Live operations map', hint: 'M', icon: MapIcon, run: () => { go({ type: 'ROOM', open: false }); go({ type: 'SET_VIEW', view: 'map' }); close(); } },
      ...(prospect.preset === 'agency'
        ? [{ id: 'room', group: 'Go to' as const, label: state.ui.room ? 'Open Execution' : 'Back to the Control Room', hint: 'C', icon: state.ui.room ? Workflow : LayoutDashboard, run: () => go({ type: 'ROOM', open: !state.ui.room }) }]
        : []),
      { id: 'timelapse', group: 'Go to', label: 'Play the morning time-lapse', hint: 'T', icon: Sunrise, run: () => go({ type: 'TIMELAPSE_START', now: Date.now() }) },
      { id: 'roi', group: 'Go to', label: `What this means for ${client.name}`, hint: 'O', icon: TrendingUp, run: () => go({ type: 'OVERLAY', overlay: 'roi' }) },
      { id: 'tools', group: 'Go to', label: 'Connected tools', hint: 'I', icon: Plug, run: () => { close(); go({ type: 'DRAWER', open: true }); } },
      { id: 'setup', group: 'Go to', label: 'Set up for a prospect', hint: 'P', icon: UserRound, run: () => go({ type: 'OVERLAY', overlay: 'setup' }) },
      { id: 'sound', group: 'Go to', label: state.sound ? 'Turn sound off' : 'Turn sound on', hint: 'S', icon: Volume2, run: () => { go({ type: 'TOGGLE_SOUND' }); close(); } },
    );
    return list;
  })();

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q)) : items;
  const safeActive = Math.min(active, Math.max(0, filtered.length - 1));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[safeActive]?.run();
    }
  };

  let lastGroup = '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="pal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t.fast}>
          <div className="pal__backdrop" onClick={close} />
          <motion.div
            className="pal__box"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={t.base}
          >
            {mode === 'list' ? (
              <>
                <div className="pal__input">
                  <Command size={15} className="t-acc" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActive(0);
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="What should Bombay OS do?"
                    aria-label="Command"
                  />
                  <Kbd>Esc</Kbd>
                </div>
                <div className="pal__list">
                  {filtered.map((it, i) => {
                    const header = it.group !== lastGroup ? it.group : null;
                    lastGroup = it.group;
                    const Icon = it.icon;
                    const sigId = intents.find((x) => x.id === it.id)?.action;
                    const handled = sigId && sigId.type === 'run' && state.handled[sigId.signalId];
                    return (
                      <div key={it.id}>
                        {header && <div className="pal__group mono-sm">{header}</div>}
                        <button
                          className={`pal__item ${i === safeActive ? 'is-active' : ''}`}
                          onMouseEnter={() => setActive(i)}
                          onClick={it.run}
                        >
                          <span className="pal__icon">
                            <Icon size={14} />
                          </span>
                          <span className="pal__text">
                            <span className="pal__label">{it.label}</span>
                            {it.group === 'Intents' && (
                              <span className="pal__hint">
                                {handled ? 'Handled this morning · run again' : it.hint}
                              </span>
                            )}
                          </span>
                          {it.group === 'Go to' ? <Kbd>{it.hint}</Kbd> : i === safeActive ? <CornerDownLeft size={13} className="t-3" /> : <ArrowRight size={12} className="t-4" />}
                        </button>
                      </div>
                    );
                  })}
                  {!filtered.length && <div className="pal__empty t-3">No matching command. Bombay OS runs defined workflows, not free-form chat.</div>}
                </div>
                <div className="pal__foot mono-sm t-4">
                  <span>
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd> choose
                  </span>
                  <span>
                    <Kbd>↵</Kbd> run
                  </span>
                  <span className="pal__foot-note">Every command runs a governed workflow · no free-form chat</span>
                </div>
              </>
            ) : (
              <Briefing
                onRunTop={topPriority ? () => go({ type: 'RUN_SIGNAL', id: topPriority.id, now: Date.now() }) : null}
                onClose={() => {
                  close();
                  go({ type: 'SET_VIEW', view: 'map' });
                }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
