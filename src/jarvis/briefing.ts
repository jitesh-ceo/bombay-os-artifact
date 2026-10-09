// The spoken morning briefing, built from the preset's on-screen briefing lines.
import { briefing } from '../data/signals';

export function morningBriefing(): string {
  // On screen the items are numbered ("01  Lumière…"); spoken, the numbers go.
  const lines = briefing.map((l) => l.replace(/^\d+\s+/, '').trim());
  return `${lines.join(' ')} Shall we begin?`;
}
