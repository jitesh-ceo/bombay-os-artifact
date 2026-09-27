import type { AppState, Autonomy } from './types';

export const AUTONOMY: { id: Autonomy; label: string; line: string }[] = [
  { id: 'suggest', label: 'Suggest', line: 'Bombay OS plans; a person approves before any work starts.' },
  { id: 'draft', label: 'Draft', line: 'Bombay OS drafts everything; each deliverable is approved one by one.' },
  { id: 'approve', label: 'Approve', line: 'Bombay OS does the work; one approval sends everything.' },
  { id: 'autopilot', label: 'Autopilot', line: 'Bombay OS delivers verified work automatically, within policy.' },
];

export const autonomyLabel = (a: Autonomy) => AUTONOMY.find((x) => x.id === a)!.label;

// The morning time-lapse runs hands-free, so it overrides presenter settings.
export const effAutonomy = (s: AppState): Autonomy => (s.timelapse.active ? 'autopilot' : s.autonomy);
export const effSpeed = (s: AppState) => (s.timelapse.active ? 3 : s.presenter.speed);
export const effInterrupt = (s: AppState) => (s.timelapse.active ? false : s.presenter.interrupt);
export const effHold = (s: AppState) => (s.timelapse.active ? false : s.presenter.hold);
