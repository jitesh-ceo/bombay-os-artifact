import { AnimatePresence, motion } from 'framer-motion';
import { EyeOff } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useAppState } from '../../state/AppProvider';
import type { Key } from './i18n';
import { AiDrawer, Overlays, PrivacyFx } from './overlays';
import { CommandList, LiveWall, Newswire, PipelineAgent, Publishing, Rivals, Today } from './panels';
import { Radar } from './radar';
import { PulseCard, RoomHeader, Ticker } from './shell';
import { PANELS, RoomProvider, useRoom } from './store';
import type { PanelId } from './types';

const VIEWS: Record<PanelId, () => ReactElement> = {
  wall: LiveWall,
  today: Today,
  cmd: CommandList,
  radar: Radar,
  buffer: Publishing,
  news: Newswire,
  pipeline: PipelineAgent,
  rivals: Rivals,
};

const TITLES: Record<PanelId, Key> = {
  wall: 'pWall',
  today: 'pToday',
  cmd: 'pCmd',
  radar: 'pRadar',
  buffer: 'pBuffer',
  news: 'pNews',
  pipeline: 'pPipeline',
  rivals: 'pRivals',
};

function useKeys() {
  const room = useRoom();
  const app = useAppState();
  const hold = useRef<number | null>(null);
  const ref = useRef({ room, app });
  ref.current = { room, app };

  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
    };
    const down = (e: KeyboardEvent) => {
      const { room: r, app: a } = ref.current;
      // The app's own overlays sit above the room and handle their own keys.
      if (a.ui.overlay || a.ui.drawer || a.ui.viewer) return;
      if (e.key === 'Escape') {
        if (r.overlay) r.setOverlay(null);
        else if (r.drawer) r.setDrawer(false);
        else if (r.tv) r.setTv(false);
        return;
      }
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        r.openDrawer(null);
      }
      if ((e.key === 'n' || e.key === 'N') && !e.repeat && hold.current === null) {
        hold.current = window.setTimeout(() => {
          ref.current.room.setPrivacy(!ref.current.room.privacy);
          hold.current = null;
        }, 1000);
      }
    };
    const up = (e: KeyboardEvent) => {
      if ((e.key === 'n' || e.key === 'N') && hold.current !== null) {
        window.clearTimeout(hold.current);
        hold.current = null;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
}

function useBreaking() {
  const room = useRoom();
  const ref = useRef(room);
  ref.current = room;
  const storyId = room.breaking[0]?.id;
  useEffect(() => {
    if (room.breakingSeen || room.privacy || room.tv || !storyId) return;
    const id = window.setTimeout(() => {
      const r = ref.current;
      r.setBreakingSeen(true);
      r.setOverlay((o) => o ?? { kind: 'breaking', id: storyId });
      r.cue('ding');
    }, 4200);
    return () => window.clearTimeout(id);
  }, [room.breakingSeen, room.privacy, room.tv, storyId]);
}

function TvStage() {
  const room = useRoom();
  const id = PANELS[room.tvIndex];
  const View = VIEWS[id];
  const [left, setLeft] = useState(20);
  useEffect(() => {
    setLeft(20);
    const t = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(t);
  }, [room.tvIndex]);
  return (
    <div className="rm-tv">
      <div className="rm-tv__bar mono-sm">
        <span className="t-acc">
          TV · {room.tvIndex + 1}/{PANELS.length} · {room.t(TITLES[id])}
        </span>
        <span className="rm-tv__dots">
          {PANELS.map((p, i) => (
            <button key={p} className={i === room.tvIndex ? 'is-on' : ''} onClick={() => room.setTvIndex(i)} aria-label={room.t(TITLES[p])} />
          ))}
        </span>
        <span className="t-4">
          {room.t('tvNext')} {left}s
        </span>
        <span className="rm-tv__progress">
          <i key={room.tvIndex} />
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={id} className="rm-tv__panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45 }}>
          <View />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Room() {
  const room = useRoom();
  useKeys();
  useBreaking();

  return (
    <motion.main
      className={`room ${room.privacy ? 'is-private' : ''} ${room.lang === 'ar' ? 'is-ar' : ''}`}
      dir={room.lang === 'ar' ? 'rtl' : 'ltr'}
      lang={room.lang}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <RoomHeader />
      <AnimatePresence>
        {room.privacy && (
          <motion.div className="rm-privacy-strip mono-sm" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <EyeOff size={11} />
            {room.settings.privacyProfile === 'full' ? room.t('privacyStrip') : room.t('privacyDemoStrip')}
          </motion.div>
        )}
      </AnimatePresence>
      <Ticker />
      {room.tv ? (
        <TvStage />
      ) : (
        <div className="rm-body scroll-y">
          <div className="rm-grid">
            <PulseCard />
            <LiveWall />
            <Today />
            <Newswire />
            <Radar />
            <CommandList />
            <PipelineAgent />
            <Rivals />
            <Publishing />
          </div>
        </div>
      )}
      <AiDrawer />
      <Overlays />
      <PrivacyFx />
      <AnimatePresence>
        {room.toast && (
          <motion.div className="rm-toast" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}>
            {room.toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}

export function ControlRoom() {
  return (
    <RoomProvider>
      <Room />
    </RoomProvider>
  );
}
