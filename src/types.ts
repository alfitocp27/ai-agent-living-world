// ─── AI Agent Living World — shared types (Fase 1) ─────────────────────────
// Avatar hanyalah representasi visual. Sumber kebenaran status kerja adalah
// task engine di store.ts / backend (server/). Animasi TIDAK membuktikan
// pekerjaan AI benar-benar berjalan.

export type VisualActivity =
  | 'idle'
  | 'walking'
  | 'sitting'
  | 'typing'
  | 'thinking'
  | 'talking'
  | 'presenting'
  | 'eating'
  | 'drinking'
  | 'sleeping'
  | 'swimming'
  | 'exercising'
  | 'playing'
  | 'celebrating'
  | 'waiting';

export type AgentStatus =
  | 'online'
  | 'working'
  | 'thinking'
  | 'meeting'
  | 'leisure'
  | 'offline'
  | 'error';

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'done'
  | 'failed'
  | 'cancelled';

export type CameraMode =
  | 'iso'
  | 'orbit'
  | 'top'
  | 'follow'
  | 'building'
  | 'cinematic';

export type NavKey =
  | 'world'
  | 'agents'
  | 'tasks'
  | 'meetings'
  | 'buildings'
  | 'analytics'
  | 'activity'
  | 'settings';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  team: string;
  model: string;
  provider: string;
  systemPrompt: string;
  skills: string[];
  tools: string[];
  color: string; // warna aksen
  shirt: string;
  pants: string;
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'bun' | 'cap';
  desk: Vec3; // posisi meja kerja (lantai HQ)
  deskFloor: number;
  deskRoom: string;
  home: Vec3; // posisi apartemen
  costTodayUsd: number;
  tasksDone: number;
  tasksFailed: number;
  // ── runtime (diubah oleh simulation tick, bukan config) ──
  status: AgentStatus;
  visual: VisualActivity;
  dest: Vec3; // tujuan jalan saat ini
  destLabel: string;
  currentTaskId: string | null;
  paused: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  agentId: string;
  done: boolean;
}

export interface Artifact {
  name: string;
  kind: 'document' | 'code' | 'report';
  content: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  managerId: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  progress: number; // 0..100
  subtasks: Subtask[];
  createdAtMin: number; // jam virtual (menit sejak 00:00)
  costUsd: number;
  error?: string;
  artifact?: Artifact;
  /** true = hasil simulasi DEMO, bukan eksekusi LLM nyata */
  demo: boolean;
}

export interface LogEntry {
  id: string;
  timeMin: number;
  kind: 'info' | 'task' | 'agent' | 'error' | 'meeting' | 'system';
  message: string;
}

export interface Meeting {
  id: string;
  topic: string;
  room: string;
  agentIds: string[];
  status: 'scheduled' | 'live' | 'done';
  transcript: { speaker: string; text: string; demo: boolean }[];
  minutes?: string;
}

export interface BuildingInfo {
  id: string;
  name: string;
  kind: string;
  pos: Vec3;
  floors: number;
  rooms: string[];
  description: string;
}
