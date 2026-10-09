// What JARVIS says out loud as work moves through the stages, and when it acts on a command.
import { client } from '../data/client';
import { integrationById, restrictedResources } from '../data/integrations';
import { signalById } from '../data/signals';
import { workflows, type StageId } from '../data/workflows';
import { autonomyLabel } from '../state/autonomy';
import type { AppState } from '../state/types';
import type { JarvisIntent } from './brain/intents';

const names = (ids: string[]) => {
  const n = ids.map((id) => integrationById[id as keyof typeof integrationById]?.name ?? id);
  return n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : (n[0] ?? '');
};

function stageLine(stage: StageId, s: AppState): string {
  const wf = workflows[s.run.workflowId];
  switch (stage) {
    case 'understand':
      return `${signalById[s.run.signalId]?.kind ?? 'On it'}. Reading ${names(wf.sources)}.`;
    case 'decide':
      return `${wf.facts.length} facts gathered. Here is a ${wf.plan.length}-step plan.`;
    case 'execute':
      return `${wf.lanes.length === 1 ? 'One task' : `${wf.lanes.length} tasks`} running in parallel.`;
    case 'verify':
      return 'Checking every figure against its source.';
    case 'deliver':
      return `${wf.outputs.length} items ready for your approval.`;
  }
}

/** One line for the most important change between two states, or null. */
export function narrationFor(prev: AppState, next: AppState): string | null {
  if (next.timelapse.active || prev === next) return null;
  const a = prev.run;
  const b = next.run;
  const sameRun = a.signalId === b.signalId && a.startedAt === b.startedAt;
  if (!sameRun) return null;
  const wf = workflows[b.workflowId];

  for (const c of wf.checks) {
    if (c.flag && b.checks[c.id] === 'flag' && a.checks[c.id] !== 'flag') return `One moment. ${c.flag.reason}`;
  }
  if (b.status === 'blocked' && a.status !== 'blocked' && b.block) {
    const res = restrictedResources[b.block.resourceId];
    const folder = res?.path.split(' / ').slice(-1)[0] ?? 'that folder';
    return `I need access to ${folder} before I can continue. Shall I request it from ${res?.owner ?? 'the owner'}?`;
  }
  if (b.status === 'complete' && a.status !== 'complete') {
    return b.autoApproved ? 'Delivered on autopilot, within policy.' : 'Done. Everything is delivered.';
  }
  if (b.stage && b.stage !== a.stage) return stageLine(b.stage, next);
  return null;
}

/** A short spoken acknowledgement for a voice command. '' means stay quiet. */
export function confirmFor(intent: JarvisIntent): string {
  switch (intent.kind) {
    case 'view':
      return intent.view === 'room' ? 'The Control Room.' : intent.view === 'map' ? 'Live operations map.' : 'Execution view.';
    case 'overlay':
      return intent.overlay === 'roi' ? `Here is what this means for ${client.name}.` : '';
    case 'timelapse':
      return 'Running the whole morning at three times speed.';
    case 'autonomy':
      return intent.level ? `Autonomy set to ${autonomyLabel(intent.level)}.` : 'Changing autonomy.';
    case 'integrations':
      return 'Your connected tools.';
    case 'reset':
      return 'Resetting the board.';
    case 'gestures':
      return intent.on ? 'Hand tracking online.' : 'Hand tracking off.';
    default:
      return '';
  }
}
