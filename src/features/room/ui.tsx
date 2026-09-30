import { Plug } from 'lucide-react';
import type { ReactNode } from 'react';
import { CONNECTOR_NAMES } from './i18n';
import { useRoom } from './store';
import type { ConnectorId, PanelId } from './types';

/** Masked values are replaced, not blurred: the real text never reaches the DOM. */
export function M({ on, children, w = 4 }: { on: boolean; children: ReactNode; w?: number }) {
  if (!on) return <>{children}</>;
  return (
    <span className="rm-mask" aria-label="masked">
      {'▮'.repeat(w)}
    </span>
  );
}

export function Panel({
  id,
  title,
  source,
  fresh,
  connector,
  right,
  children,
}: {
  id: PanelId;
  title: string;
  source: string;
  fresh?: string;
  connector?: ConnectorId | ConnectorId[];
  right?: ReactNode;
  children: ReactNode;
}) {
  const room = useRoom();
  const mode = room.panelMasked(id);
  const needs = connector ? (Array.isArray(connector) ? connector : [connector]) : [];
  const missing = needs.find((c) => !room.settings.connectors[c]);

  return (
    <section className={`rm-panel rm-panel--${id} ${mode === 'full' ? 'is-masked' : ''}`}>
      <header className="rm-panel__head">
        <span className="rm-panel__title">{title}</span>
        <span className="rm-panel__right">{right}</span>
      </header>
      <div className="rm-panel__body scroll-y">
        {mode === 'full' ? (
          <MaskedPanel />
        ) : missing ? (
          <div className="rm-missing">
            <Plug size={16} />
            <span>{room.t('connectorMissing', { name: CONNECTOR_NAMES[missing] })}</span>
            <button className="btn btn--ghost btn--sm" onClick={() => room.openIntegrations(missing)}>
              {room.t('openIntegrations')}
            </button>
          </div>
        ) : (
          children
        )}
      </div>
      <footer className="rm-panel__foot mono-sm">
        <span>{source}</span>
        <span>{mode === 'full' ? room.t('maskedPanel') : fresh}</span>
      </footer>
    </section>
  );
}

function MaskedPanel() {
  const room = useRoom();
  return (
    <div className="rm-masked">
      <div className="rm-masked__bars">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} style={{ width: `${40 + ((i * 37) % 55)}%` }} />
        ))}
      </div>
      <span className="mono-sm t-bad">{room.t('masked')}</span>
    </div>
  );
}

export function Spark({ data, h = 28, w = 120 }: { data: number[]; h?: number; w?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / (max - min || 1)) * (h - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return (
    <svg className="rm-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={`${line} L${w},${h} L0,${h} Z`} className="rm-spark__fill" />
      <path d={line} className="rm-spark__line" />
    </svg>
  );
}

export function ago(ms: number, lang: 'en' | 'ar') {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (lang === 'ar') return m < 1 ? 'الحين' : m < 60 ? `قبل ${m} د` : `قبل ${Math.round(m / 60)} س`;
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}
