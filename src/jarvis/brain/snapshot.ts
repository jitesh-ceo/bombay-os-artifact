// What JARVIS can see when Gemini answers: a compact, factual summary of the board.
import { client } from '../../data/client';
import { prospect } from '../../data/prospect';
import { signalById, signals } from '../../data/signals';
import { workflows } from '../../data/workflows';
import { CHANNELS } from '../../features/room/seed';
import { fmtCrore } from '../../state/selectors';
import type { AppState } from '../../state/types';

const MAX = 2000;

export function buildSnapshot(state: AppState): string {
  const sig = signalById[state.run.signalId];
  const wf = workflows[state.run.workflowId];
  const data = {
    preset: prospect.preset,
    client: client.name,
    about: client.descriptor,
    approver: `${client.approver}, ${client.approverRole}`,
    current: {
      signal: sig ? `${sig.kind}: ${sig.headline}` : null,
      from: sig ? `${sig.from} (${sig.fromRole})` : null,
      detail: sig?.excerpt ?? null,
      stage: state.run.stage,
      status: state.run.status,
      goal: wf?.brief.goal ?? null,
    },
    waiting: signals.map((s) => `${s.kind}: ${s.headline}${state.handled[s.id] ? ' (done)' : ''}`),
    impactToday: {
      hoursSaved: state.impact.hoursSaved,
      valueHandled: fmtCrore(state.impact.pipelineLakhs),
      tasksCompleted: state.impact.tasksCompleted,
    },
    autonomy: state.autonomy,
    channels: CHANNELS.filter((c) => c.owner === 'studio' && c.followers > 0)
      .slice(0, 3)
      .map((c) => `${c.platform} ${c.handle}: ${c.followers.toLocaleString('en-US')} followers${c.er ? `, ${c.er}% engagement` : ''}`),
  };
  let json = JSON.stringify(data);
  // Long excerpts are the only variable-length field; trim them before anything else.
  if (json.length > MAX && data.current.detail) {
    data.current.detail = `${data.current.detail.slice(0, Math.max(0, data.current.detail.length - (json.length - MAX) - 1))}…`;
    json = JSON.stringify(data);
  }
  return json.slice(0, MAX);
}
