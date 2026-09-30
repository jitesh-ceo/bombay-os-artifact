import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { IntegrationId } from '../../data/integrations';
import { useAppState, useDispatch } from '../../state/AppProvider';
import { onExternalChange, read, update } from './db';
import { translate, type Key } from './i18n';
import { pulseIndex } from './metrics';
import {
  buildCalendar,
  CHANNELS,
  COMPETITORS,
  INCOMING,
  OUTREACH,
  PIPELINE_STATS,
  PLACES,
  seedMetrics,
  seedRoutines,
  seedSettings,
  seedTasks,
  STORIES,
} from './seed';
import { sfx, speak } from './sound';
import { dubaiDate, minutesNow } from './time';
import type {
  CalEvent,
  ConnectorId,
  DmLog,
  Lang,
  MetricsRecord,
  Overlay,
  OutreachStatus,
  PanelId,
  Person,
  PlaceId,
  PrivacyProfile,
  Routine,
  Settings,
  Story,
  Task,
} from './types';

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

const UI_KEY = 'bombay-os.room.ui';

function readLang(): Lang {
  try {
    return JSON.parse(localStorage.getItem(UI_KEY) ?? '{}').lang === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export const PANELS: PanelId[] = ['wall', 'today', 'news', 'radar', 'cmd', 'buffer', 'pipeline', 'rivals'];
const SIX_HOURS = 6 * 36e5;
const IN_DRAWER: ConnectorId[] = ['metaads', 'linkedin', 'calendar', 'gmail', 'notion'];

export function useRoomState() {
  const app = useAppState();
  const dispatch = useDispatch();
  const sound = app.sound;
  const [lang, setLangState] = useState<Lang>(readLang);
  const [tv, setTv] = useState(false);
  const [tvIndex, setTvIndex] = useState(0);
  const [privacy, setPrivacyState] = useState(false);
  const [privacyFx, setPrivacyFx] = useState<'arm' | 'disarm' | null>(null);
  const [settings, setSettings] = useState<Settings>(() => read('settings', seedSettings));
  const [tasks, setTasks] = useState<Task[]>(() => read('tasks', seedTasks));
  const [routines, setRoutines] = useState<Routine[]>(() => read('routines', seedRoutines));
  const [outreach, setOutreach] = useState<Person[]>(() => read('pipeline/outreach', () => OUTREACH));
  const [pipeline, setPipeline] = useState(() => read('pipeline/stats', () => PIPELINE_STATS));
  const [dmlog, setDmlog] = useState<DmLog[]>(() => read('dmlog', () => [] as DmLog[]));
  const [metrics, setMetrics] = useState<Record<string, MetricsRecord>>(() => read('metrics', seedMetrics));
  const [stories, setStories] = useState<Story[]>(STORIES);
  const [sweptAt, setSweptAt] = useState(Date.now());
  const [sweeping, setSweeping] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState(Date.now());
  const [calendar, setCalendar] = useState<CalEvent[]>(buildCalendar);
  const [radarPick, setRadarPick] = useState<PlaceId | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [drawer, setDrawer] = useState(false);
  const [drawerSeed, setDrawerSeed] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [breakingSeen, setBreakingSeen] = useState(false);
  const [clock, setClock] = useState(Date.now());

  const t = useCallback((key: Key, vars?: Record<string, string>) => translate(lang, key, vars), [lang]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 2600);
  }, []);

  const persist = useCallback(
    <T,>(name: string, current: T, set: (v: T) => void, fn: (d: T) => T) => {
      const { data, conflict } = update(name, current, fn);
      set(data);
      if (conflict) flash(translate(lang, 'syncConflict', { c: name }));
    },
    [flash, lang],
  );

  useEffect(() => localStorage.setItem(UI_KEY, JSON.stringify({ lang })), [lang]);

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(
    () =>
      onExternalChange((name) => {
        if (name === 'tasks') setTasks(read('tasks', seedTasks));
        if (name === 'routines') setRoutines(read('routines', seedRoutines));
        if (name === 'settings') setSettings(read('settings', seedSettings));
        if (name === 'pipeline/outreach') setOutreach(read('pipeline/outreach', () => OUTREACH));
        if (name === 'dmlog') setDmlog(read('dmlog', () => [] as DmLog[]));
      }),
    [],
  );

  const studio = CHANNELS[0];
  const pulse = useMemo(() => pulseIndex(studio), [studio]);

  // Daily metrics ledger: one record per day, written the first time the room opens.
  useEffect(() => {
    const today = dubaiDate();
    if (metrics[today]) return;
    persist('metrics', metrics, setMetrics, (m) => ({
      ...m,
      [today]: { date: today, reach14: studio.reach14 ?? 0, er: studio.er ?? 0, followers: studio.followers, pulse: pulse.total },
    }));
  }, [metrics, persist, studio, pulse.total]);

  const cue = useCallback((kind: keyof typeof sfx) => sound && sfx[kind](), [sound]);

  useEffect(() => {
    if (sound) speak(lang === 'ar' ? 'غرفة التحكم جاهزة' : 'Control room online', lang);
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sweep = useCallback(() => {
    setSweeping(true);
    window.setTimeout(() => {
      setStories((list) => (list.some((s) => s.id === INCOMING.id) ? list : [INCOMING, ...list]));
      setSweptAt(Date.now());
      setRefreshedAt(Date.now());
      setCalendar(buildCalendar());
      setSweeping(false);
    }, 1600);
  }, []);

  useEffect(() => {
    const id = window.setInterval(sweep, SIX_HOURS);
    return () => window.clearInterval(id);
  }, [sweep]);

  const privacyRef = useRef(false);
  const setPrivacy = useCallback(
    (on: boolean) => {
      if (privacyRef.current === on) return;
      privacyRef.current = on;
      setPrivacyState(on);
      setPrivacyFx(on ? 'arm' : 'disarm');
      window.setTimeout(() => setPrivacyFx(null), 1400);
      if (sound) {
        if (on) {
          sfx.arm();
          speak(lang === 'ar' ? 'تم. الوضع الخاص مفعّل' : `${settings.replyLine}. Private mode on.`, lang);
        } else {
          sfx.disarm();
          speak(lang === 'ar' ? 'رجعت البيانات' : 'Data restored', lang);
        }
      }
      if (on) setOverlay((o) => (o?.kind === 'settings' ? o : null));
    },
    [lang, settings.replyLine, sound],
  );

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setSound = useCallback(
    (on: boolean) => {
      if (on !== sound) dispatch({ type: 'TOGGLE_SOUND' });
    },
    [dispatch, sound],
  );

  const saveSettings = useCallback(
    (patch: Partial<Settings>) => persist('settings', settings, setSettings, (s) => ({ ...s, ...patch })),
    [persist, settings],
  );

  const addTask = useCallback(
    (title: string, due: string | null, account: string) => {
      const task: Task = { id: `t-${Date.now().toString(36)}`, title, done: false, doneAt: null, due, account, priority: 'normal', createdAt: Date.now() };
      persist('tasks', tasks, setTasks, (list) => [task, ...list]);
      cue('ding');
      return task;
    },
    [cue, persist, tasks],
  );

  const toggleTask = useCallback(
    (id: string, done?: boolean) => {
      persist('tasks', tasks, setTasks, (list) =>
        list.map((x) => {
          if (x.id !== id) return x;
          const next = done ?? !x.done;
          return { ...x, done: next, doneAt: next ? Date.now() : null };
        }),
      );
      cue('confirm');
    },
    [cue, persist, tasks],
  );

  const editTask = useCallback(
    (id: string, patch: Partial<Task>) => persist('tasks', tasks, setTasks, (list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [persist, tasks],
  );

  const deleteTask = useCallback((id: string) => persist('tasks', tasks, setTasks, (list) => list.filter((x) => x.id !== id)), [persist, tasks]);

  const tickRoutine = useCallback(
    (id: string) => {
      const today = dubaiDate();
      const yesterday = dubaiDate(-1);
      let streak = 0;
      persist('routines', routines, setRoutines, (list) =>
        list.map((r) => {
          if (r.id !== id) return r;
          if (r.lastDone === today) {
            streak = Math.max(0, r.streak - 1);
            return { ...r, streak, lastDone: r.prevLastDone ?? null, prevLastDone: null };
          }
          streak = r.lastDone === yesterday ? r.streak + 1 : 1;
          return { ...r, streak, prevLastDone: r.lastDone, lastDone: today };
        }),
      );
      cue('confirm');
      return streak;
    },
    [cue, persist, routines],
  );

  const setOutreachStatus = useCallback(
    (name: string, status: OutreachStatus, text = '', dmLang: Lang = lang) => {
      const person = outreach.find((p) => p.n === name);
      if (!person) return false;
      persist('pipeline/outreach', outreach, setOutreach, (list) =>
        list.map((p) => (p.n === name ? { ...p, s: status, dmAt: status === 'dm' ? Date.now() : p.dmAt } : p)),
      );
      persist('dmlog', dmlog, setDmlog, (log) => [
        { id: `dm-${Date.now().toString(36)}`, name, company: person.c, status, at: Date.now(), lang: dmLang, text },
        ...log,
      ]);
      const key = ({ dm: 'dm', replied: 'replied', booked: 'booked', invited: 'invitesSent', shortlist: 'shortlist' } as const)[status];
      persist('pipeline/stats', pipeline, setPipeline, (st) => ({ ...st, [key]: st[key] + 1 }));
      cue('confirm');
      return true;
    },
    [cue, dmlog, lang, pipeline, outreach, persist],
  );

  const updateManual = useCallback(
    (which: 'li' | 'tiktok', value: number) => {
      const today = dubaiDate();
      saveSettings(which === 'li' ? { liProfileFollowers: value, liProfileAt: today } : { tiktokFollowers: value, tiktokAt: today });
      cue('ding');
    },
    [cue, saveSettings],
  );

  const setRadar = useCallback(
    (id: PlaceId) => {
      setRadarPick(id);
      saveSettings({ radar: id });
    },
    [saveSettings],
  );

  const setProfile = useCallback((p: PrivacyProfile) => saveSettings({ privacyProfile: p }), [saveSettings]);

  const openDrawer = useCallback((seed: string | null = null) => {
    setDrawerSeed(seed);
    setDrawer(true);
    setOverlay(null);
  }, []);

  const openIntegrations = useCallback(
    (c: ConnectorId) => dispatch({ type: 'DRAWER', open: true, focus: IN_DRAWER.includes(c) ? (c as IntegrationId) : null }),
    [dispatch],
  );

  const nowMin = minutesNow();
  const inProgress = calendar.find((e) => e.start <= nowMin && e.end > nowMin) ?? null;
  const radarCentre: PlaceId = radarPick ?? inProgress?.place ?? settings.radar;

  const full = privacy && settings.privacyProfile === 'full';
  const masks = { numbers: full, gauge: full, ticker: full, names: privacy };

  const panelMasked = (id: PanelId): 'none' | 'numbers' | 'full' | 'names' => {
    if (!privacy) return 'none';
    if (id === 'today' || id === 'cmd' || id === 'pipeline') return 'full';
    if (id === 'radar' || id === 'rivals') return 'names';
    if (id === 'wall' || id === 'buffer') return full ? 'numbers' : 'none';
    return 'none';
  };

  useEffect(() => {
    if (!tv) return;
    const id = window.setInterval(() => setTvIndex((i) => (i + 1) % PANELS.length), 20_000);
    return () => window.clearInterval(id);
  }, [tv]);

  const story = (id: string) => stories.find((s) => s.id === id)!;
  const breaking = stories.filter((s) => s.virality >= settings.breakingThreshold && s.approved);

  return {
    lang,
    setLang,
    sound,
    setSound,
    tv,
    setTv,
    tvIndex,
    setTvIndex,
    privacy,
    privacyFx,
    setPrivacy,
    setProfile,
    settings,
    saveSettings,
    tasks,
    addTask,
    toggleTask,
    editTask,
    deleteTask,
    routines,
    tickRoutine,
    outreach,
    setOutreachStatus,
    pipeline,
    dmlog,
    metrics,
    stories,
    story,
    breaking,
    breakingSeen,
    setBreakingSeen,
    sweptAt,
    sweeping,
    sweep,
    refreshedAt,
    calendar,
    inProgress,
    radarCentre,
    radarPick,
    setRadar,
    setRadarPick,
    overlay,
    setOverlay,
    drawer,
    setDrawer,
    drawerSeed,
    openDrawer,
    openIntegrations,
    toast,
    flash,
    clock,
    t,
    masks,
    panelMasked,
    pulse,
    updateManual,
    cue,
    channels: CHANNELS,
    competitors: COMPETITORS,
    places: PLACES,
  };
}

export type Room = ReturnType<typeof useRoomState>;

const Ctx = createContext<Room | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const room = useRoomState();
  return <Ctx.Provider value={room}>{children}</Ctx.Provider>;
}

export function useRoom() {
  const r = useContext(Ctx);
  if (!r) throw new Error('useRoom outside RoomProvider');
  return r;
}
