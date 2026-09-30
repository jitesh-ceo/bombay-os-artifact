// The Control Room's own database, mirrored to localStorage. Every write is pinned to the
// version last read, so two tabs or sessions never overwrite each other silently.

const PREFIX = 'bombay-os.room/';

interface Doc<T> {
  v: number;
  data: T;
}

const known: Record<string, number> = {};

export function read<T>(name: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw) {
      const doc = JSON.parse(raw) as Doc<T>;
      known[name] = doc.v;
      return doc.data;
    }
  } catch {
    // Corrupt or unavailable storage falls back to the seed.
  }
  const data = fallback();
  known[name] = 0;
  write(name, data);
  return data;
}

function write<T>(name: string, data: T) {
  const v = (known[name] ?? 0) + 1;
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify({ v, data } satisfies Doc<T>));
  } catch {
    // Storage full or blocked: the in-memory state still updates.
  }
  known[name] = v;
}

/** Applies `fn` to the latest stored version. Returns whether another session had written first. */
export function update<T>(name: string, current: T, fn: (data: T) => T): { data: T; conflict: boolean } {
  let base = current;
  let conflict = false;
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw) {
      const doc = JSON.parse(raw) as Doc<T>;
      conflict = doc.v !== known[name];
      base = doc.data;
      known[name] = doc.v;
    }
  } catch {
    // Fall through with the in-memory copy.
  }
  const data = fn(base);
  write(name, data);
  return { data, conflict };
}

export function onExternalChange(cb: (name: string) => void) {
  const handler = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) cb(e.key.slice(PREFIX.length));
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export function resetAll() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
