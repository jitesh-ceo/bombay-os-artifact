// Helpers shared by every preset's Control Room seed.
import { client } from '../../data/client';
import { prospect } from '../../data/prospect';
import { dubaiParts } from './time';

const slug = prospect.name.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'studio';

export const STUDIO = {
  name: prospect.name,
  handle: `@${slug}`,
  director: client.approver,
  directorRole: client.approverRole,
};

export const reachSeries = (base: number, wobble: number) =>
  Array.from({ length: 14 }, (_, i) => Math.round(base * (1 + Math.sin(i * 1.3) * wobble + (i % 4 === 0 ? wobble * 0.6 : 0))));

export function weekLabel() {
  const p = dubaiParts();
  const idx = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].indexOf(p.wd);
  const fmt = (offset: number) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', day: 'numeric', month: 'short' }).format(Date.now() + offset * 864e5);
  const start = new Date(Date.now() - idx * 864e5);
  const onejan = new Date(start.getFullYear(), 0, 1);
  const week = Math.ceil(((start.getTime() - onejan.getTime()) / 864e5 + onejan.getDay() + 1) / 7);
  return { week: `W${week}`, dates: `${fmt(-idx)} – ${fmt(4 - idx)}` };
}

/** Preset copy that the room's components and assistant would otherwise hard-code. */
export interface RoomCopy {
  tickerSource: string;
  tickerAlert: { en: string; ar: string };
  tickerNews: string;
  tickerPosts: string;
  tickerPipeline: { en: string; ar: string; unitEn: string; unitAr: string };
  inboxLine: { en: string; ar: string };
  taskExample: { en: string; ar: string };
  oneThing: string;
}
