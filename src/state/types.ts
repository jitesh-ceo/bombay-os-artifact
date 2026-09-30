import type { IntegrationId, IntegrationStatus } from '../data/integrations';
import type { StageId } from '../data/workflows';

export type RunStatus = 'idle' | 'running' | 'paused' | 'blocked' | 'awaitingApproval' | 'complete';
export type SourceState = 'standby' | 'reading' | 'done' | 'blocked';
export type CheckState = 'pending' | 'checking' | 'pass' | 'flag' | 'fixing' | 'fixed';
export type OutputStatus = 'potential' | 'drafting' | 'verifying' | 'staged' | 'ready' | 'approved';
export type GrantState = 'restricted' | 'requesting' | 'granted';
export type LedgerTone = 'default' | 'accent' | 'ok' | 'flag';

export interface LedgerSeed {
  text: string;
  tone?: LedgerTone;
  source?: IntegrationId;
  stage?: StageId;
}

export interface LedgerEntry extends LedgerSeed {
  id: number;
  time: number;
}

type EventBody =
  | { type: 'stage'; stage: StageId }
  | { type: 'source'; id: IntegrationId; state: SourceState }
  | { type: 'fact' }
  | { type: 'plan' }
  | { type: 'lane'; lane: string; done: number }
  | { type: 'outputs'; status: OutputStatus }
  | { type: 'output'; id: string; status: OutputStatus }
  | { type: 'block' }
  | { type: 'check'; id: string; state: CheckState }
  | { type: 'correct' }
  | { type: 'approval' };

export type WfEvent = EventBody & { delay: number; ledger?: LedgerSeed[] };

export interface BlockState {
  resourceId: string;
  laneId: string;
  status: 'required' | 'requesting' | 'granted';
  since: number;
}

export interface RunState {
  signalId: string;
  workflowId: string;
  status: RunStatus;
  stage: StageId | null;
  cursor: number;
  startedAt: number;
  finishedAt: number | null;
  blockedMs: number;
  sources: Partial<Record<IntegrationId, SourceState>>;
  facts: number;
  plan: number;
  lanes: Record<string, number>;
  checks: Record<string, CheckState>;
  activeCheck: string | null;
  corrected: boolean;
  outputs: Record<string, OutputStatus>;
  block: BlockState | null;
  // Suggest mode: the run pauses before EXECUTE until the plan is approved.
  gate: 'plan' | null;
  planApproved: boolean;
  autoApproved: boolean;
}

export type Autonomy = 'suggest' | 'draft' | 'approve' | 'autopilot';
export type Overlay = 'palette' | 'roi' | 'setup' | 'morning' | null;

export interface AppState {
  bootDone: boolean;
  run: RunState;
  integrations: Record<IntegrationId, IntegrationStatus>;
  grants: Record<string, GrantState>;
  ledger: LedgerEntry[];
  impact: { hoursSaved: number; pipelineLakhs: number; tasksCompleted: number };
  handled: Record<string, boolean>;
  autonomy: Autonomy;
  sound: boolean;
  timelapse: { active: boolean; index: number; done: boolean };
  ui: {
    drawer: boolean;
    drawerFocus: IntegrationId | null;
    viewer: string | null;
    view: 'map' | 'stage';
    overlay: Overlay;
    room: boolean;
  };
  presenter: { hud: boolean; speed: number; hold: boolean; interrupt: boolean };
}

export type Action =
  | { type: 'BOOT_DONE' }
  | { type: 'SELECT_SIGNAL'; id: string }
  | { type: 'START'; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'ADVANCE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'REQUEST_RESOURCE'; id: string; now: number }
  | { type: 'GRANT_RESOURCE'; id: string; now: number }
  | { type: 'RESUME_BLOCK'; now: number }
  | { type: 'OPEN_VIEWER'; id: string }
  | { type: 'CLOSE_VIEWER' }
  | { type: 'APPROVE'; now: number; auto?: boolean }
  | { type: 'APPROVE_ONE'; id: string; now: number }
  | { type: 'SET_AUTONOMY'; level: Autonomy; now: number }
  | { type: 'SET_VIEW'; view: 'map' | 'stage' }
  | { type: 'OVERLAY'; overlay: Overlay }
  | { type: 'ROOM'; open: boolean }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TIMELAPSE_START'; now: number }
  | { type: 'TIMELAPSE_NEXT'; now: number }
  | { type: 'TIMELAPSE_DONE' }
  | { type: 'RUN_SIGNAL'; id: string; now: number }
  | { type: 'DRAWER'; open: boolean; focus?: IntegrationId | null }
  | { type: 'CONNECT'; id: IntegrationId }
  | { type: 'CONNECT_DONE'; id: IntegrationId; now: number }
  | { type: 'REQUEST_INTEGRATION'; id: IntegrationId; now: number }
  | { type: 'TOGGLE_HUD' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'TOGGLE_HOLD' }
  | { type: 'TOGGLE_INTERRUPT' }
  | { type: 'RESET'; now: number };
