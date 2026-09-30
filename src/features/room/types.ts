export type Lang = 'en' | 'ar';
export type PrivacyProfile = 'full' | 'demo';
export type ConnectorId = 'metaads' | 'linkedin' | 'calendar' | 'gmail' | 'notion' | 'buffer' | 'firecrawl';
export type PlaceId = 'hq' | 'media' | 'difc' | 'quoz' | 'dafz' | 'marina' | 'sharjah';
export type PanelId = 'wall' | 'today' | 'cmd' | 'radar' | 'buffer' | 'news' | 'pipeline' | 'rivals';

export interface Place {
  id: PlaceId;
  name: string;
  nameAr: string;
  lat: number;
  lon: number;
}

export interface Channel {
  id: string;
  handle: string;
  owner: 'studio' | 'client';
  platform: 'Instagram' | 'LinkedIn profile' | 'LinkedIn page' | 'TikTok' | 'Facebook' | 'YouTube';
  source: 'metaads' | 'linkedin' | 'manual';
  followers: number;
  reach14?: number;
  newFollowers?: number;
  er?: number;
  growth?: number;
  dailyReach?: number[];
}

export interface CalEvent {
  id: string;
  start: number;
  end: number;
  title: string;
  titleAr: string;
  with: string;
  place?: PlaceId;
}

export interface InboxThread {
  id: string;
  from: string;
  subject: string;
  subjectAr: string;
  ageH: number;
}

export interface MeetingNote {
  id: string;
  title: string;
  when: string;
  points: string[];
  pointsAr: string[];
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  doneAt: number | null;
  due: string | null;
  account: string;
  priority: 'high' | 'normal';
  createdAt: number;
}

export interface Routine {
  id: string;
  title: string;
  titleAr: string;
  days: string;
  time: string;
  account: string;
  streak: number;
  lastDone: string | null;
  prevLastDone?: string | null;
}

export type NewsLane = 'uae' | 'gcc' | 'world';

export interface Story {
  id: string;
  headline: string;
  headlineAr: string;
  outlet: string;
  approved: boolean;
  lane: NewsLane;
  ageH: number;
  virality: number;
  laneMatch: number;
  url: string;
  summary: string;
  summaryAr: string;
  why: string;
  whyAr: string;
  client: string;
  post: string[];
  postAr: string[];
  take: [string, string];
}

export type OutreachStatus = 'shortlist' | 'invited' | 'dm' | 'replied' | 'booked';

export interface Person {
  n: string;
  r: string;
  c: string;
  sector: string;
  u: string;
  s: OutreachStatus;
  dmAt: number | null;
}

export interface DmLog {
  id: string;
  name: string;
  company: string;
  status: OutreachStatus;
  at: number;
  lang: Lang;
  text: string;
}

export interface PackSlot {
  day: string;
  lang: 'EN' | 'AR';
  pillar: string;
  slot: string;
  status: 'ready' | 'gap' | 'routine' | 'scheduled';
}

export interface ContentPack {
  week: string;
  theme: string;
  dates: string;
  offer: string;
  decisionsOpen: number;
  slots: PackSlot[];
}

export interface Competitor {
  id: string;
  name: string;
  handle: string;
  lane: 'performance' | 'creative' | 'b2b';
  platform: string;
  followers: number;
  eng: number;
  growth: number;
  asOf: string;
  url: string;
  published: { hook: string; format: string; views: number };
}

export interface MetricsRecord {
  date: string;
  reach14: number;
  er: number;
  followers: number;
  pulse: number;
}

export interface Settings {
  mission: string;
  missionAr: string;
  privacyProfile: PrivacyProfile;
  triggerWord: string;
  replyLine: string;
  radar: PlaceId;
  liProfileFollowers: number;
  liProfileAt: string;
  tiktokFollowers: number;
  tiktokAt: string;
  breakingThreshold: number;
  connectors: Record<ConnectorId, boolean>;
}

export type Overlay =
  | { kind: 'story'; id: string }
  | { kind: 'dm'; n: string }
  | { kind: 'settings' }
  | { kind: 'breaking'; id: string }
  | null;
