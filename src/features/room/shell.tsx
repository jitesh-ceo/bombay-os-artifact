import { animate } from 'framer-motion';
import { Bot, EyeOff, Globe2, Pencil, RefreshCw, Settings as Cog, Tv } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Kbd } from '../../components/primitives';
import { useRoom } from './store';
import { compact, dubaiDate, fmtClock, fmtLongDate, runsToday } from './time';
import { M } from './ui';

/* ───────── Header ───────── */

export function RoomHeader() {
  const room = useRoom();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const mission = room.lang === 'ar' ? room.settings.missionAr : room.settings.mission;
  const d = new Date(room.clock);

  return (
    <header className="rm-head">
      <div className="rm-head__id">
        <div>
          <div className="rm-head__title display">{room.t('title')}</div>
          <div className="mono-sm t-3">
            {room.t('demoData')} · {room.t('dubai')} <span className="t-acc">{fmtClock(d)}</span> · {fmtLongDate(room.lang, d)}
          </div>
        </div>
      </div>

      <div className="rm-head__mission">
        <span className="mono-sm t-acc">{room.t('mission')}</span>
        {editing ? (
          <form
            className="rm-head__edit"
            onSubmit={(e) => {
              e.preventDefault();
              room.saveSettings(room.lang === 'ar' ? { missionAr: draft } : { mission: draft });
              setEditing(false);
            }}
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus onBlur={() => setEditing(false)} dir="auto" />
          </form>
        ) : (
          <p>
            {mission}
            <button
              className="rm-inline-edit"
              onClick={() => {
                setDraft(mission);
                setEditing(true);
              }}
              aria-label={room.t('editMission')}
            >
              <Pencil size={10} />
            </button>
          </p>
        )}
      </div>

      <div className="rm-head__ctrl">
        <button className={`chip-btn rm-private ${room.privacy ? 'is-armed' : ''}`} onClick={() => room.setPrivacy(!room.privacy)} title={room.t('holdN')}>
          <EyeOff size={12} />
          <span className="mono">{room.privacy ? room.t('standDown') : room.t('privacy')}</span>
        </button>
        <button className={`chip-btn ${room.tv ? 'is-on' : ''}`} onClick={() => room.setTv(!room.tv)}>
          <Tv size={12} />
          <span className="mono">{room.t('tv')}</span>
        </button>
        <button className="chip-btn" onClick={() => room.setLang(room.lang === 'ar' ? 'en' : 'ar')}>
          <Globe2 size={12} />
          <span className={room.lang === 'ar' ? 'mono' : 'rm-ar-label'}>{room.t('langToggle')}</span>
        </button>
        <button className={`chip-btn ${room.sweeping ? 'is-on' : ''}`} onClick={room.sweep} disabled={room.privacy}>
          <RefreshCw size={12} className={room.sweeping ? 'rm-spin' : ''} />
          <span className="mono">{room.t('refresh')}</span>
        </button>
        <button className="chip-btn rm-icon-btn" onClick={() => room.setOverlay({ kind: 'settings' })} aria-label={room.t('settings')}>
          <Cog size={12} />
        </button>
        <button className="chip-btn rm-ai-btn" onClick={() => room.openDrawer(null)}>
          <Bot size={12} />
          <span className="mono">AI</span>
          <Kbd>/</Kbd>
        </button>
      </div>
    </header>
  );
}

/* ───────── Pulse Index ───────── */

function Gauge({ value, masked }: { value: number; masked: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (masked) return;
    const c = animate(0, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setShown(v) });
    return () => c.stop();
  }, [value, masked]);

  const r = 78;
  const sweep = 270;
  const len = (2 * Math.PI * r * sweep) / 360;
  const ticks = Array.from({ length: 28 }, (_, i) => {
    const a = ((135 + (sweep * i) / 27) * Math.PI) / 180;
    const long = i % 3 === 0;
    return { x1: 100 + Math.cos(a) * 90, y1: 100 + Math.sin(a) * 90, x2: 100 + Math.cos(a) * (long ? 97 : 94), y2: 100 + Math.sin(a) * (long ? 97 : 94), long };
  });

  return (
    <div className="rm-gauge">
      <svg viewBox="0 0 200 200">
        {ticks.map((tk, i) => (
          <line key={i} {...tk} className={tk.long ? 'rm-gauge__tick is-long' : 'rm-gauge__tick'} />
        ))}
        <circle cx="100" cy="100" r={r} className="rm-gauge__track" strokeDasharray={`${len} 999`} transform="rotate(135 100 100)" />
        {!masked && (
          <circle cx="100" cy="100" r={r} className="rm-gauge__arc" strokeDasharray={`${(len * shown) / 100} 999`} transform="rotate(135 100 100)" />
        )}
      </svg>
      <div className="rm-gauge__value">{masked ? '— —' : Math.round(shown)}</div>
    </div>
  );
}

export function PulseCard() {
  const room = useRoom();
  const a = room.pulse;
  const ledger = Object.values(room.metrics).sort((x, y) => x.date.localeCompare(y.date));
  const past = ledger.find((m) => m.date <= dubaiDate(-30));
  const masked = room.masks.gauge;

  return (
    <section className="rm-panel rm-pulse">
      <header className="rm-panel__head">
        <span className="rm-panel__title">{room.t('pulse')}</span>
        <span className="mono-sm t-4">{room.channels[0].handle}</span>
      </header>
      <div className="rm-pulse__body">
        <Gauge value={a.total} masked={masked} />
        <div className="mono-sm t-3 rm-center">{room.t('pulseOf')}</div>
        <div className="rm-parts">
          {(
            [
              ['partEr', a.er, 60],
              ['partGrowth', a.growth, 25],
              ['partConsistency', a.consistency, 15],
            ] as const
          ).map(([k, v, max]) => (
            <div key={k} className="rm-part">
              <span>{room.t(k)}</span>
              <span className="rm-part__bar">
                <i style={{ width: masked ? '0%' : `${(v / max) * 100}%` }} />
              </span>
              <span className="rm-num">
                <M on={masked} w={3}>
                  {v}
                </M>
                <span className="t-4">/{max}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      {past && (
        <footer className="rm-panel__foot mono-sm">
          <span>{room.t('vs30')}</span>
          <span>
            <M on={masked} w={5}>
              {past.pulse} → {a.total}{' '}
              <b className={a.total >= past.pulse ? 't-ok' : 't-bad'}>
                {a.total >= past.pulse ? '+' : ''}
                {a.total - past.pulse}
              </b>
            </M>
          </span>
        </footer>
      )}
    </section>
  );
}

/* ───────── Ticker ───────── */

export function Ticker() {
  const room = useRoom();
  const ig = room.channels[0];
  const todays = room.routines.filter((r) => runsToday(r.days));
  const done = todays.filter((r) => r.lastDone === dubaiDate()).length;
  const ar = room.lang === 'ar';
  const lines = [
    `META · ${ig.handle} · ${ar ? 'وصول 14 يوم' : '14D REACH'} ${compact(ig.reach14 ?? 0)}`,
    `META · URBAN BREW · ROAS 2.9× → 1.8× · ${ar ? 'إرهاق إعلان' : 'CREATIVE FATIGUE'}`,
    `${ar ? 'مؤشر النبض' : 'PULSE INDEX'} ${room.pulse.total}/100`,
    `NEWSWIRE · ${room.stories.length} ${ar ? 'أخبار داخل 48 ساعة' : 'STORIES INSIDE 48H'}`,
    `${ar ? 'الروتين' : 'ROUTINES'} · ${done}/${todays.length}`,
    `BUFFER · 126 ${ar ? 'منشور' : 'POSTS'} · 30D`,
    `${ar ? 'عملاء جدد' : 'NEW BUSINESS'} · ${room.pipeline.booked} ${ar ? 'مكالمات محجوزة' : 'CALLS BOOKED'}`,
    `RADAR · ${room.places.find((p) => p.id === room.radarCentre)?.name.toUpperCase()}`,
  ];
  return (
    <div className={`rm-ticker ${room.masks.ticker ? 'is-masked' : ''}`}>
      <div className="rm-ticker__track mono-sm">
        {room.masks.ticker
          ? Array.from({ length: 12 }, (_, i) => <span key={i}>▮▮▮▮▮▮ ▮▮▮▮ ▮▮▮</span>)
          : [...lines, ...lines].map((l, i) => <span key={i}>{l}</span>)}
      </div>
    </div>
  );
}
