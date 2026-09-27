import { Activity, Boxes, Briefcase, CalendarDays, Cloud, Hash, MessageCircle, Orbit, PenTool, ShoppingBag, SquareKanban, Target } from 'lucide-react';
import type { IntegrationId } from '../data/integrations';

// Simplified, recognisable marks. Not official logos; enough for a non-technical audience to read instantly.
function Glyph({ id }: { id: IntegrationId }) {
  switch (id) {
    case 'gmail':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M3 7.2V18a1 1 0 0 0 1 1h3v-8.4L3 7.2z" fill="#4285F4" />
          <path d="M21 7.2V18a1 1 0 0 1-1 1h-3v-8.4l4-3.4z" fill="#34A853" />
          <path d="M3 7.2 12 14l9-6.8V6a1 1 0 0 0-1.6-.8L12 10.8 4.6 5.2A1 1 0 0 0 3 6v1.2z" fill="#EA4335" />        </svg>
      );
    case 'drive':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M8.4 3.5h7.2l6.2 10.8h-7.2L8.4 3.5z" fill="#FFBA00" />
          <path d="M8.4 3.5 2.2 14.3l3.6 6.2L12 9.7 8.4 3.5z" fill="#0F9D58" />
          <path d="M5.8 20.5h12.4l3.6-6.2H9.4l-3.6 6.2z" fill="#4285F4" />
        </svg>
      );
    case 'notion':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="#f4efe7" />
          <path d="M8.6 7.6v8.8M8.6 7.6l6.8 8.8M15.4 7.6v8.8" stroke="#1d1b18" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    case 'calendar':
      return <CalendarDays color="#6ea0f5" strokeWidth={1.8} />;
    case 'metaads':
      return <Target color="#66b3ff" strokeWidth={1.8} />;
    case 'googleads':
      return (
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="8.2" cy="15.4" r="4.2" fill="#4285F4" />
          <path d="M11.6 8.2 16.8 4.4a2.4 2.4 0 0 1 3.4.7l.6 1.1a2.4 2.4 0 0 1-.7 3.3L14.9 13.3 11.6 8.2z" fill="#FBBC05" />
          <path d="M10.6 16.8 16.2 7.2l2.4 1.4-5.6 9.6a2.2 2.2 0 1 1-2.4-1.4z" fill="#34A853" />
        </svg>
      );
    case 'ga4':
      return <Activity color="#f0b43c" strokeWidth={1.8} />;
    case 'slack':
      return <Hash color="#e8739b" strokeWidth={2.2} />;
    case 'hubspot':
      return <Orbit color="#ff8a66" strokeWidth={1.8} />;
    case 'jira':
      return <SquareKanban color="#4c9aff" strokeWidth={1.8} />;
    case 'figma':
      return <PenTool color="#f24e1e" strokeWidth={1.8} />;
    case 'linkedin':
      return <Briefcase color="#5b9bd5" strokeWidth={1.8} />;
    case 'shopify':
      return <ShoppingBag color="#95bf47" strokeWidth={1.8} />;
    case 'whatsapp':
      return <MessageCircle color="#4cd384" strokeWidth={1.8} />;
    case 'salesforce':
      return <Cloud color="#3fb4ea" strokeWidth={1.8} />;
    case 'sheets':
      return <SquareKanban color="#3cba73" strokeWidth={1.8} />;
    case 'zoho':
      return <Boxes color="#f0b43c" strokeWidth={1.8} />;
  }
}

export function IntegrationMark({ id, size = 'md' }: { id: IntegrationId; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`imark imark--${size}`}>
      <Glyph id={id} />
    </span>
  );
}
