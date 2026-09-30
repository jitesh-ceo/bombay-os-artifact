import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Check, Copy, ExternalLink, MessageSquare, Send, ShieldCheck, Sparkles, Wand2, X, Zap } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pill } from '../../components/primitives';
import { respond } from './agent';
import { resetAll } from './db';
import { CONNECTOR_NAMES } from './i18n';
import { STUDIO } from './seed';
import { useRoom, type ToolCall } from './store';
import { fmtStamp } from './time';
import type { ConnectorId, Lang, OutreachStatus, Person, PrivacyProfile, Story } from './types';

const EASE = [0.22, 1, 0.36, 1] as const;

function Layer({ onClose, children, tone }: { onClose: () => void; children: ReactNode; tone?: 'bad' }) {
  return (
    <motion.div className={`rm-layer ${tone === 'bad' ? 'rm-layer--bad' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="rm-layer__backdrop" onClick={onClose} />
      <motion.div className="rm-card scroll-y" initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
        <button className="rm-card__close" onClick={onClose} aria-label="close">
          <X size={14} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: (text: string) => {
      void navigator.clipboard?.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    },
  };
}

function Typed({ lines, dir }: { lines: string[]; dir?: 'rtl' | 'ltr' }) {
  const [n, setN] = useState(0);
  const full = lines.join('\n');
  useEffect(() => {
    setN(0);
    const id = window.setInterval(() => setN((v) => (v >= full.length ? v : v + 4)), 14);
    return () => window.clearInterval(id);
  }, [full]);
  return (
    <pre className="rm-script" dir={dir}>
      {full.slice(0, n)}
      {n < full.length && <span className="type-caret" />}
    </pre>
  );
}

/* ───────── Story card ───────── */

function StoryCard({ story }: { story: Story }) {
  const room = useRoom();
  const ar = room.lang === 'ar';
  const [mode, setMode] = useState<'none' | 'ar' | 'en' | 'take'>('none');
  const { copied, copy } = useCopy();
  const lines = mode === 'ar' ? story.postAr : mode === 'en' ? story.post : mode === 'take' ? [`EN · ${story.take[0]}`, '', `AR · ${story.take[1]}`] : [];

  return (
    <Layer onClose={() => room.setOverlay(null)}>
      <div className="rm-story">
        <div className="rm-row">
          <span className={`rm-outlet ${story.approved ? 'is-approved' : ''}`}>{story.outlet}</span>
          <Pill tone={story.approved ? 'ok' : 'dim'}>{story.approved ? room.t('approved') : room.t('context')}</Pill>
          <Pill tone="neutral">
            <ShieldCheck size={10} /> {room.t('sourceCheck')}
          </Pill>
        </div>
        <h2 className="rm-story__title display" dir="auto">
          {ar ? story.headlineAr : story.headline}
        </h2>
        <p className="t-2" dir="auto">
          {ar ? story.summaryAr : story.summary}
        </p>
        <div className="rm-why" dir="auto">
          <span className="mono-sm t-acc">
            {room.t('forClient')} · {story.client}
          </span>
          <span>{ar ? story.whyAr : story.why}</span>
        </div>
        <div className="rm-scores mono-sm">
          <span>
            <b>{story.ageH}h</b> {room.t('fresh')} · 48h gate
          </span>
          <span>
            {room.t('virality')} <b>{story.virality}</b>
          </span>
          <span>
            {room.t('laneMatch')} <b>{story.laneMatch}</b>
          </span>
        </div>
        <div className="rm-actions">
          <a className="btn btn--ghost btn--sm" href={story.url} target="_blank" rel="noreferrer">
            <ExternalLink size={12} /> {room.t('openSource')}
          </a>
          <button className={`btn btn--ghost btn--sm ${mode === 'ar' ? 'is-on' : ''}`} onClick={() => setMode('ar')}>
            <Wand2 size={12} /> {room.t('rescript')}
          </button>
          <button className={`btn btn--ghost btn--sm ${mode === 'en' ? 'is-on' : ''}`} onClick={() => setMode('en')}>
            <Wand2 size={12} /> {room.t('rescriptEn')}
          </button>
          <button className={`btn btn--ghost btn--sm ${mode === 'take' ? 'is-on' : ''}`} onClick={() => setMode('take')}>
            <Zap size={12} /> {room.t('rapidTake')}
          </button>
          <button className="btn btn--ghost btn--sm" disabled={!lines.length} onClick={() => copy(lines.join('\n'))}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? room.t('copied') : room.t('copy')}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => room.openDrawer(story.id)}>
            <MessageSquare size={12} /> {room.t('continueChat')}
          </button>
        </div>
        {mode !== 'none' && (
          <div className="rm-output">
            <div className="rm-row">
              <span className="mono-sm t-acc">{mode === 'take' ? room.t('takeLen') : room.t('postLen')}</span>
              <Pill tone="bad">{room.t('noClaims')}</Pill>
              <span className="mono-sm t-4">{room.t('pageNeverPosts')}</span>
            </div>
            <Typed key={mode} lines={lines} dir={mode === 'ar' ? 'rtl' : 'ltr'} />
          </div>
        )}
      </div>
    </Layer>
  );
}

/* ───────── DM card ───────── */

function draftDm(p: Person, lang: Lang, personal: boolean) {
  const first = p.n.split(' ')[0];
  if (lang === 'ar') {
    return [
      `هلا ${first}،`,
      `متابع شغل ${p.c} من فترة.${personal ? ` الطريقة اللي تتكلم فيها عن النمو في ${p.sector} بالضبط نوع الإشارة اللي يدوّر عليها التدقيق.` : ''}`,
      `في ${STUDIO.name} نسوي تدقيق نمو مجاني لمدة 20 دقيقة للعلامات في الإمارات: وين يروح صرف الإعلانات، شو الإعلانات المستهلكة، وثلاث خطوات تفرق هالشهر.`,
      'مكالمة قصيرة، والتدقيق لك تحتفظ فيه. يناسبك الثلاثاء أو الخميس؟',
      `— ${STUDIO.director}`,
    ].join('\n');
  }
  return [
    `Hi ${first},`,
    `I've been following what ${p.c} is building.${personal ? ` The way you talk about growth in ${p.sector} is exactly the signal the audit looks at.` : ''}`,
    `At ${STUDIO.name} we run a free 20-minute growth audit for UAE brands: where the ad spend is going, which creatives are tired, and three moves that would pay off this month.`,
    "It's a short call and you keep the audit. Would Tuesday or Thursday suit you?",
    `— ${STUDIO.director}`,
  ].join('\n');
}

function DmCard({ person }: { person: Person }) {
  const room = useRoom();
  const [lang, setLang] = useState<Lang>(room.lang);
  const [personal, setPersonal] = useState(false);
  const [thinking, setThinking] = useState(false);
  const { copied, copy } = useCopy();
  const text = draftDm(person, lang, personal);
  const log = room.dmlog.filter((l) => l.name === person.n);
  const stamp = (s: OutreachStatus) => room.setOutreachStatus(person.n, s, s === 'dm' ? text : '', lang);

  return (
    <Layer onClose={() => room.setOverlay(null)}>
      <div className="rm-dm">
        <div className="rm-row">
          <span className="rm-avatar rm-avatar--lg">{person.n.slice(0, 1)}</span>
          <div>
            <h2 className="rm-dm__name display">{person.n}</h2>
            <div className="t-3">
              {person.r} · {person.c} · {person.sector}
            </div>
          </div>
          <span className={`rm-status is-${person.s}`}>{person.s}</span>
        </div>
        <div className="rm-row">
          <div className="rm-tabs">
            <button className={lang === 'en' ? 'is-on' : ''} onClick={() => setLang('en')}>
              English
            </button>
            <button className={lang === 'ar' ? 'is-on' : ''} onClick={() => setLang('ar')}>
              <span className="rm-ar-label">العربية</span>
            </button>
          </div>
          <span className="mono-sm t-4">{room.t('neverPrice')}</span>
        </div>
        <pre className="rm-script rm-script--box" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {thinking ? room.t('drafting') : text}
        </pre>
        <div className="rm-actions">
          <button className="btn btn--ghost btn--sm" onClick={() => copy(text)}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? room.t('copied') : room.t('copyDm')}
          </button>
          <a className="btn btn--ghost btn--sm" href={person.u} target="_blank" rel="noreferrer">
            <ExternalLink size={12} /> {room.t('openProfile')}
          </a>
          <button
            className={`btn btn--ghost btn--sm ${personal ? 'is-on' : ''}`}
            onClick={() => {
              setThinking(true);
              window.setTimeout(() => {
                setPersonal(true);
                setThinking(false);
              }, 900);
            }}
          >
            <Sparkles size={12} /> {room.t('personalise')}
          </button>
        </div>
        <div className="rm-actions rm-actions--stamp">
          <button className={`btn btn--sm ${person.s === 'dm' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => stamp('dm')}>
            <Send size={12} /> {room.t('sentDm')}
          </button>
          <button className={`btn btn--sm ${person.s === 'replied' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => stamp('replied')}>
            {room.t('theyReplied')}
          </button>
          <button className={`btn btn--sm ${person.s === 'booked' ? 'btn--primary' : 'btn--ghost'}`} onClick={() => stamp('booked')}>
            {room.t('callBooked')}
          </button>
        </div>
        {log.length > 0 && (
          <div className="rm-dmlog">
            <span className="mono-sm t-acc">{room.t('dmLog')}</span>
            {log.map((l) => (
              <div key={l.id} className="mono-sm t-3">
                {fmtStamp(l.at, room.lang)} · {l.status} · {l.lang.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layer>
  );
}

/* ───────── AI drawer ───────── */

interface Msg {
  role: 'you' | 'ai';
  text: string;
  tools?: ToolCall[];
}

export function AiDrawer() {
  const room = useRoom();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seed = room.drawerSeed ? room.story(room.drawerSeed) : null;

  useEffect(() => {
    if (!room.drawer) return;
    inputRef.current?.focus();
    if (seed) {
      const r = respond('', room, seed);
      setMsgs((m) => [...m, { role: 'you', text: `↳ ${room.lang === 'ar' ? seed.headlineAr : seed.headline}` }, { role: 'ai', text: r.text }]);
    }
    // Only when the drawer opens or its story seed changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.drawer, room.drawerSeed]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    setMsgs((m) => [...m, { role: 'you', text }]);
    setInput('');
    setBusy(true);
    window.setTimeout(() => {
      const r = respond(text, room, null);
      setMsgs((m) => [...m, { role: 'ai', text: r.text, tools: r.tools }]);
      setBusy(false);
      room.cue('ding');
    }, 550);
  };

  const quick = ['qPost', 'qBrief', 'qPulse', 'qTask', 'qPrivacy'] as const;
  const side = room.lang === 'ar' ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {room.drawer && (
        <motion.aside className="rm-drawer" initial={{ x: side }} animate={{ x: 0 }} exit={{ x: side }} transition={{ duration: 0.4, ease: EASE }}>
          <header className="rm-drawer__head">
            <Bot size={15} className="t-acc" />
            <div>
              <div className="rm-strong">{room.t('aiTitle')}</div>
              <div className="mono-sm t-4">{room.t('aiSees')}</div>
            </div>
            <button className="rm-card__close" onClick={() => room.setDrawer(false)} aria-label="close">
              <X size={14} />
            </button>
          </header>
          <div className="rm-drawer__list scroll-y" ref={listRef}>
            {msgs.length === 0 && <div className="mono-sm t-4">/ · {room.t('aiPlaceholder')}</div>}
            {msgs.map((m, i) => (
              <div key={i} className={`rm-msg rm-msg--${m.role}`} dir="auto">
                {m.tools?.map((tc, j) => (
                  <span key={j} className="rm-tool">
                    ⚙ {tc.name}({Object.entries(tc.args).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(', ')})
                  </span>
                ))}
                <span className="rm-msg__text">{m.text}</span>
              </div>
            ))}
            {busy && (
              <div className="rm-msg rm-msg--ai">
                <span className="rm-typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
          </div>
          <div className="rm-quick">
            {quick.map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (k === 'qTask') {
                    setInput(room.lang === 'ar' ? 'أضف مهمة: ' : 'Add a task: ');
                    inputRef.current?.focus();
                  } else if (k === 'qPrivacy') send(room.settings.triggerWord);
                  else send(room.t(k));
                }}
              >
                {room.t(k)}
              </button>
            ))}
          </div>
          <form
            className="rm-drawer__input"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={room.t('aiPlaceholder')} dir="auto" />
            <button className="btn btn--primary btn--sm" type="submit" aria-label="send">
              <Send size={12} />
            </button>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ───────── Settings ───────── */

function SettingsSheet() {
  const room = useRoom();
  const [f, setF] = useState(room.settings);
  return (
    <Layer onClose={() => room.setOverlay(null)}>
      <form
        className="rm-settings"
        onSubmit={(e) => {
          e.preventDefault();
          room.saveSettings(f);
          room.setOverlay(null);
        }}
      >
        <h2 className="rm-dm__name display">{room.t('settings')}</h2>
        <label>
          <span className="mono-sm t-3">{room.t('setMission')}</span>
          <textarea rows={2} value={f.mission} onChange={(e) => setF({ ...f, mission: e.target.value })} />
        </label>
        <label>
          <span className="mono-sm t-3">{room.t('setMissionAr')}</span>
          <textarea rows={2} dir="rtl" value={f.missionAr} onChange={(e) => setF({ ...f, missionAr: e.target.value })} />
        </label>
        <div className="rm-grid2">
          <label>
            <span className="mono-sm t-3">{room.t('setProfile')}</span>
            <select value={f.privacyProfile} onChange={(e) => setF({ ...f, privacyProfile: e.target.value as PrivacyProfile })}>
              <option value="full">{room.t('profFull')}</option>
              <option value="demo">{room.t('profDemo')}</option>
            </select>
          </label>
          <label>
            <span className="mono-sm t-3">{room.t('setRadar')}</span>
            <select value={f.radar} onChange={(e) => setF({ ...f, radar: e.target.value as typeof f.radar })}>
              {room.places.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mono-sm t-3">{room.t('setTrigger')}</span>
            <input value={f.triggerWord} onChange={(e) => setF({ ...f, triggerWord: e.target.value })} />
          </label>
          <label>
            <span className="mono-sm t-3">{room.t('setReply')}</span>
            <input value={f.replyLine} onChange={(e) => setF({ ...f, replyLine: e.target.value })} />
          </label>
        </div>
        <label>
          <span className="mono-sm t-3">
            {room.t('setThreshold')} · {f.breakingThreshold}
          </span>
          <input type="range" min={50} max={100} value={f.breakingThreshold} onChange={(e) => setF({ ...f, breakingThreshold: Number(e.target.value) })} />
        </label>
        <div>
          <span className="mono-sm t-3">{room.t('setConnectors')}</span>
          <div className="rm-connectors">
            {(Object.keys(CONNECTOR_NAMES) as ConnectorId[]).map((c) => (
              <button
                type="button"
                key={c}
                className={`chip-btn ${f.connectors[c] ? 'is-on' : ''}`}
                onClick={() => setF({ ...f, connectors: { ...f.connectors, [c]: !f.connectors[c] } })}
              >
                {f.connectors[c] ? <Check size={11} /> : <X size={11} />}
                <span className="mono">{CONNECTOR_NAMES[c]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rm-actions">
          <button className="btn btn--primary btn--sm" type="submit">
            {room.t('save')}
          </button>
          <button className="btn btn--ghost btn--sm" type="button" onClick={() => room.setOverlay(null)}>
            {room.t('cancel')}
          </button>
          <button
            className="btn btn--ghost btn--sm rm-reset"
            type="button"
            onClick={() => {
              resetAll();
              window.location.reload();
            }}
          >
            {room.t('resetDemo')}
          </button>
        </div>
      </form>
    </Layer>
  );
}

/* ───────── Breaking ───────── */

function Breaking({ story }: { story: Story }) {
  const room = useRoom();
  const ar = room.lang === 'ar';
  return (
    <Layer onClose={() => room.setOverlay(null)} tone="bad">
      <div className="rm-story">
        <div className="rm-row">
          <span className="rm-pulse-dot" />
          <span className="mono-sm t-bad">{room.t('breaking')}</span>
          <span className="mono-sm t-4">
            {room.t('virality')} {story.virality} ≥ {room.settings.breakingThreshold}
          </span>
        </div>
        <h2 className="rm-story__title display" dir="auto">
          {ar ? story.headlineAr : story.headline}
        </h2>
        <div className="rm-row">
          <span className="rm-outlet is-approved">{story.outlet}</span>
          <span className="mono-sm t-4">
            {story.ageH}h · 48h gate · {room.t('forClient')} {story.client}
          </span>
        </div>
        <div className="rm-actions">
          <button className="btn btn--primary btn--sm" onClick={() => room.setOverlay({ kind: 'story', id: story.id })}>
            <Wand2 size={12} /> {room.t('rescriptEn')}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={() => room.setOverlay(null)}>
            {room.t('close')}
          </button>
        </div>
      </div>
    </Layer>
  );
}

/* ───────── Router ───────── */

export function Overlays() {
  const room = useRoom();
  const o = room.overlay;
  const person = o?.kind === 'dm' ? room.outreach.find((p) => p.n === o.n) : undefined;
  return (
    <AnimatePresence>
      {o?.kind === 'story' && <StoryCard key={`s-${o.id}`} story={room.story(o.id)} />}
      {o?.kind === 'breaking' && <Breaking key={`b-${o.id}`} story={room.story(o.id)} />}
      {o?.kind === 'dm' && person && <DmCard key={`d-${o.n}`} person={person} />}
      {o?.kind === 'settings' && <SettingsSheet key="settings" />}
    </AnimatePresence>
  );
}

/* ───────── Privacy transition ───────── */

export function PrivacyFx() {
  const room = useRoom();
  const arm = room.privacyFx === 'arm';
  return (
    <AnimatePresence>
      {room.privacyFx && (
        <motion.div className={`rm-fx ${arm ? 'rm-fx--arm' : 'rm-fx--disarm'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="rm-fx__blade" initial={{ x: arm ? '-120%' : '120%' }} animate={{ x: arm ? '120%' : '-120%' }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }} />
          <motion.div className="rm-fx__text" initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15 }}>
            <span className="display">{arm ? room.t('privateOn') : room.t('privateOff')}</span>
            <small className="mono-sm t-3">{arm ? (room.settings.privacyProfile === 'full' ? room.t('profFull') : room.t('profDemo')) : room.t('live')}</small>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
