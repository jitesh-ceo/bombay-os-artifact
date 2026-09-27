import { prospect } from '../data/prospect';
import { signals } from '../data/signals';
import { workflows, type Workflow } from '../data/workflows';
import type { AppState } from './types';

export const currentWorkflow = (s: AppState): Workflow => workflows[s.run.workflowId];

export function fillTokens(text: string, wf: Workflow, corrected: boolean): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const c = wf.corrections[key];
    if (!c) return '';
    return corrected ? c.verified : c.generated;
  });
}

export function systemState(s: AppState): { label: string; tone: 'idle' | 'accent' | 'bad' | 'ok' } {
  const { run } = s;
  switch (run.status) {
    case 'idle': {
      const open = signals.filter((sig) => !s.handled[sig.id]).length;
      return { label: open ? `Monitoring · ${open} signal${open === 1 ? '' : 's'}` : 'Monitoring · all clear', tone: 'idle' };
    }
    case 'running':
      return { label: `Executing · ${run.stage ?? 'starting'}`, tone: 'accent' };
    case 'paused':
      return { label: `Holding · ${run.stage}`, tone: 'accent' };
    case 'blocked':
      return { label: 'Blocked · access required', tone: 'bad' };
    case 'awaitingApproval':
      return { label: 'Awaiting approval', tone: 'accent' };
    case 'complete':
      return { label: 'Delivered · monitoring', tone: 'ok' };
  }
}

export const fmtClock = (t: number, seconds = true) =>
  new Date(t).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: seconds ? '2-digit' : undefined,
    hour12: false,
  });

const INR_PER_USD = 83;

export const fmtCrore = (lakhs: number) => {
  if (prospect.preset === 'agency') {
    const usd = (lakhs * 100_000) / INR_PER_USD;
    if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
    if (usd >= 10_000) return `$${Math.round(usd / 1000)}K`;
    return `$${Math.round(usd).toLocaleString('en-US')}`;
  }
  return lakhs < 100 ? `₹${lakhs.toFixed(1).replace(/\.0$/, '')}L` : `₹${(lakhs / 100).toFixed(2)} Cr`;
};

export const fmtDuration = (ms: number) => {
  const s = Math.max(1, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
};
