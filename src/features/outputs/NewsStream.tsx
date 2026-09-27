import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { newsFeed, type NewsItem } from '../../data/news';

const SLOTS = 5;

type Tone = 'acc' | 'bad' | 'muted';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scanStatus(next: NewsItem | undefined, found: number): { text: string; tone: Tone } {
  if (!next || found >= SLOTS) return { text: '5 fresh · < 48h', tone: 'muted' };
  if (next.tier === 'T2') return { text: 'Widening · GCC', tone: 'acc' };
  if (next.tier === 'T3') return { text: 'Widening · world · UAE', tone: 'acc' };
  return { text: `Scanning UAE · ${found}/${SLOTS}`, tone: 'acc' };
}

function TypedLine({ text, run }: { text: string; run: boolean }) {
  const [n, setN] = useState(run ? 0 : text.length);

  useEffect(() => {
    if (!run) {
      setN(text.length);
      return;
    }
    setN(0);
    const id = window.setInterval(() => {
      setN((v) => (v >= text.length ? v : v + 2));
    }, 16);
    return () => window.clearInterval(id);
  }, [run, text]);

  const done = n >= text.length;
  return (
    <span className="news__headline">
      {text.slice(0, Math.min(n, text.length))}
      {run && !done && <span className="type-caret" />}
    </span>
  );
}

export function NewsStream() {
  const { items, incoming } = newsFeed;
  const [shown, setShown] = useState<NewsItem[]>(() => (prefersReducedMotion() ? items : []));
  const [status, setStatus] = useState(() => (prefersReducedMotion() ? '5 fresh · < 48h' : 'Scanning UAE · 0/5'));
  const [tone, setTone] = useState<Tone>(prefersReducedMotion() ? 'muted' : 'acc');
  const [typingId, setTypingId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [staleId, setStaleId] = useState<string | null>(null);
  const [reading, setReading] = useState<{ id: string; list: NewsItem[] } | null>(null);
  const hold = useRef(false);
  hold.current = reading !== null;

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let alive = true;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        let left = ms;
        const tick = () => {
          if (!alive) {
            resolve();
            return;
          }
          if (hold.current) {
            timers.push(window.setTimeout(tick, 80));
            return;
          }
          if (left <= 0) {
            resolve();
            return;
          }
          const slice = Math.min(80, left);
          left -= slice;
          timers.push(window.setTimeout(tick, slice));
        };
        tick();
      });

    const set = (text: string, nextTone: Tone) => {
      if (!alive) return;
      setStatus(text);
      setTone(nextTone);
    };

    async function pass() {
      while (alive) {
        setShown([]);
        setTypingId(null);
        setFocusId(null);
        setStaleId(null);
        set(`Scanning UAE · 0/${SLOTS}`, 'acc');
        await wait(650);
        if (!alive) return;

        for (let i = 0; i < items.length; i++) {
          const next = items[i];
          const label = scanStatus(next, i);
          set(label.text, label.tone);
          await wait(420);
          if (!alive) return;
          setShown(items.slice(0, i + 1));
          setTypingId(next.id);
          setFocusId(next.id);
          await wait(980);
          if (!alive) return;
        }

        setTypingId(null);
        set('5 fresh · < 48h', 'muted');
        for (const item of items) {
          if (!alive) return;
          setFocusId(item.id);
          await wait(1400);
        }
        if (!alive) return;

        const oldest = items[items.length - 1];
        setFocusId(oldest.id);
        setStaleId(oldest.id);
        set('Past 48h · dropped', 'bad');
        await wait(1100);
        if (!alive) return;

        setShown(items.slice(0, SLOTS - 1));
        setStaleId(null);
        setTypingId(null);
        setFocusId(items[SLOTS - 2].id);
        set('Replacing · UAE', 'acc');
        await wait(520);
        if (!alive) return;

        setShown([...items.slice(0, SLOTS - 1), incoming]);
        setTypingId(incoming.id);
        setFocusId(incoming.id);
        await wait(1200);
        if (!alive) return;

        setTypingId(null);
        set('5 fresh · < 48h', 'muted');
        await wait(2800);
      }
    }

    void pass();
    return () => {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [incoming, items]);

  const slots: Array<NewsItem | null> = [...shown];
  while (slots.length < SLOTS) slots.push(null);
  const scanningAt = shown.length < SLOTS ? shown.length : -1;

  return (
    <section className="news" aria-label="Morning news stream">
      <div className="news__head">
        <span className="mono t-3 news__title">
          <span className="live__dot" />
          News
        </span>
        <span className="news__status">
          <AnimatePresence mode="wait">
            <motion.span
              key={status}
              className={`news__status-text t-${tone === 'muted' ? '3' : tone}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {status}
            </motion.span>
          </AnimatePresence>
        </span>
      </div>
      <div className={`news__list ${focusId ? 'has-focus' : ''}`}>
        {slots.map((item, i) => (
          <div className={`news__cell ${item?.id === focusId ? 'is-focus' : ''}`} key={i}>
            <AnimatePresence mode="wait">
              {item ? (
                <motion.button
                  type="button"
                  key={item.id}
                  className={`news__row ${item.id === typingId ? 'is-live' : ''} ${item.id === staleId ? 'is-stale' : ''}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => setReading({ id: item.id, list: shown })}
                >
                  <span className="news__tier mono-sm">{item.tier}</span>
                  <span className="news__body">
                    <TypedLine text={item.headline} run={item.id === typingId} />
                    <span className="news__meta">
                      {item.id === staleId
                        ? '48h · dropped'
                        : `${item.scope} · ${item.source} · ${item.ageHours}h`}
                      {item.id === focusId && <span className="news__open">Read</span>}
                    </span>
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  key={`scan-${i}`}
                  className={`news__slot ${i === scanningAt ? 'is-scan' : ''}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {i === scanningAt && <span className="mono-sm">Listening</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {reading && (
          <NewsReader
            key="news-reader"
            item={reading.list.find((story) => story.id === reading.id) ?? reading.list[0]}
            list={reading.list}
            onPick={(id) => setReading({ id, list: reading.list })}
            onClose={() => setReading(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function NewsReader({
  item,
  list,
  onPick,
  onClose,
}: {
  item: NewsItem;
  list: NewsItem[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <motion.div
      className="newsread"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsread-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="newsread__backdrop" onClick={onClose} />
      <motion.div
        className="newsread__frame"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <button type="button" className="roi__close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <article className="newsread__article">
          <div className="mono-sm t-acc">
            {item.tier} · {item.scope}
          </div>
          <h2 className="display newsread__title" id="newsread-title">
            {item.headline}
          </h2>
          <p className="newsread__by">
            {item.source} · {item.ageHours}h ago · inside 48 hours
          </p>
          <p className="newsread__deck">{item.deck}</p>
          <p className="newsread__body">{item.body}</p>
          <div className="newsread__why">
            <span className="mono-sm t-acc">For the desk</span>
            <p>{item.why}</p>
          </div>
        </article>
        <aside className="newsread__list">
          <span className="mono t-3">This pass · {list.length}</span>
          {list.map((story) => (
            <button
              type="button"
              key={story.id}
              className={`newsread__item ${story.id === item.id ? 'is-on' : ''}`}
              onClick={() => onPick(story.id)}
            >
              <span className="mono-sm t-4">{story.tier}</span>
              <span className="newsread__item-title">{story.headline}</span>
            </button>
          ))}
        </aside>
      </motion.div>
    </motion.div>
  );
}
