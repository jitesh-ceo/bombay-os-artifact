import { Command, Plus, Sunrise, UserRound, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IntegrationMark } from '../../components/IntegrationMark';
import { BrandMark } from '../../components/primitives';
import { client, os } from '../../data/client';
import type { IntegrationId } from '../../data/integrations';
import { morning } from '../../data/signals';
import { useAppState, useDispatch } from '../../state/AppProvider';
import type { AppState } from '../../state/types';
import { fmtClock, systemState } from '../../state/selectors';

function useClock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(i);
  }, []);
  return now;
}

// During the time-lapse one real second stands for one minute of the morning.
function simClock(state: AppState, now: number) {
  const [h, m] = (morning.lines[state.timelapse.index]?.[0] ?? '06:10').split(':').map(Number);
  const running = state.run.startedAt ? (state.run.finishedAt ?? now) - state.run.startedAt : 0;
  const total = h * 60 + m + Math.floor(running / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function TopBar() {
  const state = useAppState();
  const dispatch = useDispatch();
  const now = useClock();
  const sys = systemState(state);
  const connected = (Object.entries(state.integrations) as [IntegrationId, string][]).filter(([, s]) => s === 'connected');
  const lapse = state.timelapse.active;

  return (
    <header className="topbar">
      <div className="topbar__id">
        <BrandMark />
        <span className="topbar__os">{os.name}</span>
        <span className="topbar__sep" />
        <span className="topbar__client-mark">{client.initials}</span>
        <div className="topbar__client">
          <span className="topbar__client-name">{client.name}</span>
          <span className="mono-sm t-3">{client.descriptor}</span>
        </div>
      </div>

      <div className={`topbar__state topbar__state--${sys.tone} ${lapse ? 'topbar__state--lapse' : ''}`}>
        {lapse ? (
          <span className="live topbar__lapse">
            <Sunrise size={12} />
            <span className="mono">Time-lapse 3×</span>
          </span>
        ) : (
          <span className="live">
            <span className="live__dot" />
            <span className="mono">Live</span>
          </span>
        )}
        <span className="topbar__state-label mono">{sys.label}</span>
        <span className={`topbar__clock mono ${lapse ? 't-acc' : 't-3'}`}>{lapse ? simClock(state, now) : fmtClock(now)}</span>
      </div>

      <div className="topbar__right">
        <button className="chip-btn" onClick={() => dispatch({ type: 'OVERLAY', overlay: 'palette' })} title="Commands (⌘K)">
          <Command size={12} />
          <span className="mono">K</span>
        </button>
        <button className="chip-btn" onClick={() => dispatch({ type: 'OVERLAY', overlay: 'setup' })} title="Prospect setup (P)">
          <UserRound size={12} />
          <span className="mono">Setup</span>
        </button>
        <button
          className={`chip-btn ${lapse ? 'is-on' : ''}`}
          onClick={() => dispatch({ type: 'TIMELAPSE_START', now: Date.now() })}
          title="Morning time-lapse (T)"
        >
          <Sunrise size={12} />
          <span className="mono">AM</span>
        </button>
        <button className={`chip-btn ${state.sound ? 'is-on' : ''}`} onClick={() => dispatch({ type: 'TOGGLE_SOUND' })} title="Sound (S)" aria-pressed={state.sound}>
          {state.sound ? <Volume2 size={12} /> : <VolumeX size={12} />}
          <span className="mono">Sound</span>
        </button>
        <button className="topbar__integrations" onClick={() => dispatch({ type: 'DRAWER', open: true })} title="Integrations (I)">
          <span className="topbar__marks">
            {connected.slice(0, 5).map(([id]) => (
              <IntegrationMark key={id} id={id} size="sm" />
            ))}
          </span>
          <span className="mono t-2">{connected.length} connected</span>
        </button>
        <button className="topbar__add" onClick={() => dispatch({ type: 'DRAWER', open: true })} aria-label="Add integration" title="Add integration">
          <Plus size={15} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
