// ─── AI Agent Living World — shared types (Fase A) ─────────────────────────
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
  | 'settings'
  | 'results';

export type HairStyle =
  | 'short'
  | 'buzz'
  | 'undercut'
  | 'curly'
  | 'bald'
  | 'long'
  | 'shoulder'
  | 'bangs'
  | 'bun'
  | 'long-curly'
  | 'cap';

export type TaskSource = 'direct' | 'chat' | 'quick' | 'report_reply' | 'orchestrated';

export type ReviewStatus = 'pending' | 'approved' | 'needs_revision';

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
  hairStyle: HairStyle;
  /** 'male' | 'female' — menentukan gaya rambut & avatar 3D */
  gender: 'male' | 'female';
  /** manager langsung agent ini (null = puncak, mis. CEO) */
  managerId?: string | null;
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
  createdAtMin: number; // menit WIB hari itu (kompatibilitas log lama)
  createdAtMs: number; // epoch ms saat tugas dibuat
  costUsd: number;
  error?: string;
  artifact?: Artifact;
  /** true = hasil simulasi DEMO, bukan eksekusi LLM nyata */
  demo: boolean;
  /** manager yang mendelegasikan tugas ini (bila ada) */
  delegatedByAgentId?: string | null;
  /** alasan pemilihan pelaksana, kalimat Indonesia */
  routingReason?: string;
  reviewStatus?: ReviewStatus;
  reviewFeedback?: string;
  revisionCount?: number;
  source?: TaskSource;
  /** true = manager sedang menunggu bawahan menyelesaikan tugas ini */
  managerWaiting?: boolean;
  /** laporan asal yang memicu tugas revisi ini (bila ada) */
  inReplyToReportId?: string;
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

/** Laporan manager — ditulis otomatis saat tugas delegasi selesai & direview.
 *  Konten selalu teks biasa (tanpa markdown), lihat plainText di store.ts. */
export interface Report {
  id: string;
  taskId: string;
  managerId: string;
  executorId: string;
  title: string;
  content: string;
  createdAt: number; // epoch ms
  read: boolean;
  revisionCount: number;
  reviewStatus: ReviewStatus;
  routingReason: string;
  /** laporan asal yang ditindaklanjuti laporan ini (bila ada) */
  inReplyToReportId?: string;
}

export interface ChatMessage {
  id: string;
  from: 'me' | 'agent';
  text: string;
  at: number; // epoch ms
}

export interface ChatSession {
  id: string;
  agentId: string;
  title: string;
  createdAt: number; // epoch ms
  messages: ChatMessage[];
}
