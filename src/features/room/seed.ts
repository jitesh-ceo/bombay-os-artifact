// Demo snapshot for the Control Room, chosen by preset. In a live build every value comes from a
// connector or a dated manual snapshot; here they are fixed sample values, labelled as such.
import { prospect } from '../../data/prospect';
import * as creator from './seed.creator';
import * as studio from './seed.studio';

export { STUDIO } from './seedUtil';

const seed: typeof studio = prospect.preset === 'creator' ? creator : studio;

export const {
  ACCOUNTS,
  PLACES,
  CHANNELS,
  buildCalendar,
  INBOX,
  NOTES,
  seedTasks,
  seedRoutines,
  BUFFER,
  STORIES,
  INCOMING,
  PIPELINE_STATS,
  PACK,
  OUTREACH,
  COMPETITORS,
  seedSettings,
  seedMetrics,
  COPY,
} = seed;

export const GATE = { dropped: 2, blocked: 1, blockedOutlet: 'Khaleej Times (paywall)' };
