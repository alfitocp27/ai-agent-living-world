// ─── Zustand store + simulation / task engine (Fase A) ─────────────────────
// SUMBER KEBENARAN: status task & agent di sini (dan kelak backend/Supabase).
// Mode DEMO = orkestrasi disimulasikan secara deterministik di browser dan
// DILABELI demo di semua tempat. Mode LIVE memblokir eksekusi sampai provider
// terhubung (lihat Settings → "Integration Required"). Tidak ada klaim palsu
// bahwa LLM berjalan padahal tidak.
//
// Fase A: provider "Muse (muse.ai)", jam WIB nyata, avatar santai otomatis
// (tanpa jadwal kehidupan terjadwal), gender + gaya rambut, manager sebagai
// orkestrator (delegasi → review demo → laporan manager), chat persisten.

import { create } from 'zustand';
import type {
  AgentProfile, AgentStatus, Artifact, CameraMode, ChatSession, HairStyle, LogEntry,
  Meeting, NavKey, Report, TaskItem, TaskSource, VisualActivity,
} from './types';
import { LEISURE_SPOTS, MEETING_ROOM, SEED_AGENTS, SEED_MEETINGS, SEED_TASKS } from './data/seed';

export const fmtClock = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;

// ─── Jam WIB nyata (Asia/Jakarta) ────────────────────────────────────────────
const wibFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit',
  day: '2-digit', month: '2-digit', year: 'numeric', hourCycle: 'h23',
});

export interface WibParts {
  hour: number;
  minute: number;
  clockMin: number; // menit sejak 00:00 WIB
  day: number; // tanggal WIB (1–31)
  month: number;
  year: number;
  dateKey: string; // YYYY-MM-DD WIB
}

export function wibParts(ms: number): WibParts {
  const parts = wibFmt.formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const hour = get('hour');
  const minute = get('minute');
  const day = get('day');
  const month = get('month');
  const year = get('year');
  return {
    hour, minute, clockMin: hour * 60 + minute, day, month, year,
    dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

export const fmtWIB = (ms: number) => {
  const p = wibParts(ms);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')} WIB`;
};

/** Malam WIB 19.00–05.00 — dipakai pencahayaan 3D. */
export const isNightWIB = (ms: number) => {
  const h = wibParts(ms).hour;
  return h >= 19 || h < 5;
};

/** Selector turunan untuk komponen: true bila sekarang malam WIB. */
export const selectIsNight = (s: { isNight: boolean }) => s.isNight;
export const selectUnreadReportCount = (s: { unreadReportCount: number }) => s.unreadReportCount;
export const selectLatestUnreadReport = (s: { latestUnreadReport: Report | null }) => s.latestUnreadReport;

// ─── Gender & gaya rambut ────────────────────────────────────────────────────
const MALE_HAIR: HairStyle[] = ['short', 'buzz', 'undercut', 'curly', 'bald', 'cap'];
const FEMALE_HAIR: HairStyle[] = ['long', 'shoulder', 'bangs', 'bun', 'long-curly', 'curly'];

/** Bila gender & gaya rambut tidak cocok, kembalikan gaya default gender itu. */
export function normalizeHairStyle(gender: 'male' | 'female', style: HairStyle): HairStyle {
  const allowed = gender === 'male' ? MALE_HAIR : FEMALE_HAIR;
  return allowed.includes(style) ? style : gender === 'male' ? 'short' : 'long';
}

// ─── plainText: markdown → teks biasa (wajib untuk laporan manager) ─────────
export function plainText(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      let l = line.replace(/^\s*[#>*`_]+/, ''); // hapus penanda markdown di awal baris
      l = l.replace(/^\s*-\s+/, '• '); // list "- " menjadi "• "
      l = l.replace(/[*#`]/g, ''); // jangan sisakan karakter markdown di mana pun
      return l.trim();
    })
    .filter((l) => l.length > 0)
    .join('\n');
}

// ─── Avatar santai otomatis ──────────────────────────────────────────────────
/** Pilih satu tujuan santai dari LEISURE_SPOTS (bukan tujuan saat ini). */
export function pickLeisureDest(agent: AgentProfile): { dest: { x: number; y: number; z: number }; destLabel: string; visual: VisualActivity } {
  const others = LEISURE_SPOTS.filter(
    (sp) => !(sp.pos.x === agent.dest.x && sp.pos.z === agent.dest.z),
  );
  const pool = others.length > 0 ? others : LEISURE_SPOTS;
  const spot = pool[Math.floor(Math.random() * pool.length)];
  return { dest: { ...spot.pos }, destLabel: spot.label, visual: spot.visual };
}

// ─── Balasan demo chat (dipindah dari RightPanel agar komponen memakai store) ─
const STATUS_LABEL: Record<AgentStatus, string> = {
  online: 'Online', working: 'Bekerja', thinking: 'Berpikir', meeting: 'Meeting',
  leisure: 'Leisure', offline: 'Offline', error: 'Error',
};

export function demoReply(text: string, agent: AgentProfile): string {
  const t = text.toLowerCase();
  if (t.includes('tugas') || t.includes('kerja') || t.includes('kerjakan'))
    return `Saya ${agent.name} (${agent.role}). Saat ini status saya: ${STATUS_LABEL[agent.status]}. Di mode DEMO, balasan ini disimulasikan dari skrip — bukan output LLM.`;
  if (t.includes('halo') || t.includes('hai') || t.includes('pagi'))
    return `Halo! Saya ${agent.name}, ${agent.role} di tim ${agent.team}. Ada tugas untuk saya? (balasan demo)`;
  if (t.includes('biaya') || t.includes('cost') || t.includes('token'))
    return `Penggunaan saya hari ini tercatat $${agent.costTodayUsd.toFixed(2)} — estimasi demo, bukan tagihan provider.`;
  if (t.includes('jadwal') || t.includes('jam'))
    return `Saya bekerja saat ada tugas; kalau tidak ada tugas saya istirahat sendiri ke kafe, kolam, atau lapangan, lalu kembali ke meja. Ini perilaku avatar otomatis, bukan aturan kerja AI.`;
  return `Baik, saya catat: "${text}". Di mode DEMO saya menjawab dari skrip simulasi. Hubungkan provider di Settings untuk jawaban LLM nyata.`;
}

// ─── Orkestrasi: pilih bawahan terbaik ───────────────────────────────────────
const SYNONYMS: Record<string, string[]> = {
  riset: ['research'], penelitian: ['research'], pasar: ['research'],
  desain: ['design', 'figma'], rancang: ['design'], ui: ['figma', 'design'], ux: ['figma', 'design'],
  tulis: ['copywriting', 'writing'], artikel: ['copywriting'], copy: ['copywriting'], konten: ['copywriting'],
  data: ['sql', 'statistics', 'dashboard'], analisis: ['statistics', 'sql'], laporan: ['statistics', 'dashboard'],
  uji: ['testing', 'qa'], test: ['testing'], qa: ['testing'],
  kode: ['typescript', 'python', 'react', 'node'], program: ['typescript', 'python'], aplikasi: ['typescript', 'react'],
  resep: ['kuliner', 'copywriting'], kuliner: ['copywriting', 'resep'], masak: ['kuliner'],
  gambar: ['illustration'], branding: ['branding'], video: ['illustration'],
};

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);
}

function expandTokens(tokens: string[]): string[] {
  const out = new Set<string>(tokens);
  for (const t of tokens) for (const s of SYNONYMS[t] ?? []) out.add(s);
  return [...out];
}

function matchesWord(hay: string, token: string): boolean {
  const words = hay.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(Boolean);
  return words.some((w) => w.includes(token) || token.includes(w));
}

/**
 * Pilih TEPAT SATU bawahan langsung `managerId` dengan skor kecocokan kata
 * kunci (skills +3, role +2, team +1). Tie-break: tasksDone terbanyak.
 * Kembalikan null bila manager tidak punya bawahan.
 */
export function pickBestAssignee(
  managerId: string,
  title: string,
  description: string,
  agents: AgentProfile[],
): { agentId: string; reason: string } | null {
  const subs = agents.filter((a) => a.managerId === managerId);
  if (subs.length === 0) return null;
  const tokens = expandTokens(tokenize(`${title} ${description}`));
  let best: AgentProfile | null = null;
  let bestScore = -1;
  let bestMatched: string[] = [];
  for (const a of subs) {
    let score = 0;
    const matched: string[] = [];
    for (const tok of tokens) {
      const skillHit = a.skills.some((sk) => matchesWord(sk, tok));
      const roleHit = matchesWord(a.role, tok);
      const teamHit = matchesWord(a.team, tok);
      if (skillHit) { score += 3; matched.push(tok); }
      else if (roleHit) { score += 2; matched.push(tok); }
      else if (teamHit) { score += 1; matched.push(tok); }
    }
    const better = score > bestScore || (score === bestScore && best !== null && a.tasksDone > best.tasksDone);
    if (better || best === null) { best = a; bestScore = score; bestMatched = matched; }
  }
  if (!best) return null;
  const reason = bestScore > 0
    ? `Dipilih karena keahlian '${[...new Set(bestMatched)].slice(0, 3).join(', ')}' cocok dengan tugas ini.`
    : `Tidak ada kecocokan kata kunci yang kuat — dipilih ${best.name} (${best.role}) sebagai bawahan yang tersedia.`;
  return { agentId: best.id, reason };
}

// ─── Statistik turunan ───────────────────────────────────────────────────────
export interface ManagerStats {
  tasksManaged: number;
  tasksManagedCompleted: number;
  reportsWritten: number;
  meetingsAttended: number;
}

export function computeManagerStats(agentId: string, tasks: TaskItem[], reports: Report[], meetings: Meeting[]): ManagerStats {
  const managed = tasks.filter((t) => t.delegatedByAgentId === agentId);
  return {
    tasksManaged: managed.length,
    tasksManagedCompleted: managed.filter((t) => t.status === 'done').length,
    reportsWritten: reports.filter((r) => r.managerId === agentId).length,
    meetingsAttended: meetings.filter((m) => m.agentIds.includes(agentId)).length,
  };
}

export interface AgentPerf {
  done: number;
  failed: number;
  successPct: number;
  last7Days: { date: string; done: number; failed: number }[];
}

export function computeAgentPerf(agentId: string, tasks: TaskItem[]): AgentPerf {
  const mine = tasks.filter((t) => t.assigneeId === agentId);
  const done = mine.filter((t) => t.status === 'done').length;
  const failed = mine.filter((t) => t.status === 'failed').length;
  const finished = done + failed;
  const last7Days: AgentPerf['last7Days'] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const key = wibParts(now - i * 86_400_000).dateKey;
    const dayTasks = mine.filter((t) => t.createdAtMs > 0 && wibParts(t.createdAtMs).dateKey === key);
    last7Days.push({
      date: key,
      done: dayTasks.filter((t) => t.status === 'done').length,
      failed: dayTasks.filter((t) => t.status === 'failed').length,
    });
  }
  return { done, failed, successPct: finished > 0 ? Math.round((done / finished) * 100) : 0, last7Days };
}

// ─── Store ───────────────────────────────────────────────────────────────────
const SPARE_DESKS: { x: number; y: number; z: number; floor: number; room: string }[] = [
  { x: -12, y: 3.2, z: -11, floor: 2, room: 'Ruang Programmer' },
  { x: 1.5, y: 3.2, z: -14, floor: 2, room: 'Ruang UI/UX & Desain' },
  { x: -7, y: 3.2, z: -7.5, floor: 2, room: 'Workspace' },
  { x: -17, y: 3.2, z: -4.8, floor: 2, room: 'Workspace' },
];

// Visual yang dipakai avatar SETELAH sampai di tujuan (disimpan di luar state
// React agar tidak memicu render per frame).
const pendingVisual = new Map<string, VisualActivity>();
// Cooldown avatar santai: kapan terakhir piknik & sampai kapan menikmatinya.
const lastLeisureAt = new Map<string, number>();
const leisureUntil = new Map<string, number>();
for (const a of SEED_AGENTS) lastLeisureAt.set(a.id, Date.now());
let logSeq = 100;
let tickCount = 0;

const LEISURE_COOLDOWN_MS = 45_000; // jeda idle sebelum pergi santai lagi
const LEISURE_DURATION_MS = 60_000; // lama menikmati satu tujuan santai

export function setPendingVisual(id: string, v: VisualActivity) {
  pendingVisual.set(id, v);
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

function artifactFor(task: TaskItem): Artifact {
  const lines = task.subtasks.map((s) => `- [x] ${s.title}`).join('\n');
  return {
    name: `${task.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`,
    kind: 'document',
    content: `# ${task.title}\n\n> ARTEFAK DEMO — dihasilkan oleh simulasi task engine Fase A.\n> Bukan output LLM nyata. Hubungkan provider di Settings untuk Live Mode.\n\n## Ringkasan\n${task.description}\n\n## Subtugas selesai\n${lines}\n\n## Catatan\nDokumen ini dibuat dari template deterministik demo. Di Fase 3, isi ini\ndiganti hasil nyata model + tool execution dengan audit log.\n`,
  };
}

const MEETING_LINES: Record<string, string[]> = {
  'ag-nara': ['Kita fokus ke hasil minggu ini, bukan sekadar aktivitas.', 'Keputusan saya: prioritaskan kualitas di atas kecepatan.'],
  'ag-bimo': ['Saya sudah petakan tugasnya ke tiap tim.', 'Blokir terbesar ada di QA, saya minta Fajar duluan.'],
  'ag-kirana': ['Implementasinya butuh dua hari kalau API sudah stabil.', 'Saya akan pecah jadi komponen kecil biar mudah diuji.'],
  'ag-lestari': ['Desainnya saya buat konsisten dengan design system kita.', 'Saya butuh copy final dari Rani sebelum handoff.'],
  'ag-rani': ['Copy sudah saya siapkan tiga varian headline.', 'Tone-nya hangat dan sederhana, sesuai brand.'],
  'ag-yoga': ['Riset saya menemukan tiga kompetitor utama.', 'Datanya saya rangkum di dokumen riset.'],
  'ag-maya': ['Angka konversinya naik 12% dibanding bulan lalu.', 'Saya sarankan kita uji varian kedua.'],
  'ag-fajar': ['Saya menemukan dua bug kritis di alur checkout.', 'Saya sudah tulis skenario ujinya.'],
};

interface WorldState {
  mode: 'demo' | 'live';
  paused: boolean;
  wibNow: number; // epoch ms saat tick terakhir
  clockMin: number; // menit WIB hari ini (turunan wibNow, dipakai komponen lama)
  day: number; // tanggal WIB (1–31)
  isNight: boolean; // true 19.00–05.00 WIB
  cameraMode: CameraMode;
  selectedFloor: number; // 0 = semua lantai
  hideRoof: boolean;
  followAgentId: string | null;
  selectedAgentId: string | null;
  selectedBuildingId: string | null;
  nav: NavKey;
  panelOpen: boolean;
  quality: 'low' | 'medium' | 'high';
  agents: AgentProfile[];
  tasks: TaskItem[];
  logs: LogEntry[];
  meetings: Meeting[];
  reports: Report[];
  chatSessions: ChatSession[];
  unreadReportCount: number;
  latestUnreadReport: Report | null;
  matchScore: { a: number; b: number };
  // actions
  tick: () => void;
  agentArrived: (id: string) => void;
  setNav: (n: NavKey) => void;
  setPanelOpen: (v: boolean) => void;
  setCamera: (m: CameraMode) => void;
  setFloor: (f: number) => void;
  setHideRoof: (v: boolean) => void;
  togglePause: () => void;
  setQuality: (q: 'low' | 'medium' | 'high') => void;
  setMode: (m: 'demo' | 'live') => void;
  selectAgent: (id: string | null) => void;
  followAgent: (id: string | null) => void;
  selectBuilding: (id: string | null) => void;
  addLog: (kind: LogEntry['kind'], message: string) => void;
  assignTask: (title: string, description: string, assigneeId?: string, opts?: { source?: TaskSource; delegatedByAgentId?: string | null; routingReason?: string; inReplyToReportId?: string }) => 'ok' | 'live-blocked';
  approveTask: (id: string) => void;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  failTask: (id: string) => void;
  requestRevision: (taskId: string, feedback: string) => 'ok' | 'max-revisions' | 'not-found';
  replyToReport: (reportId: string, text: string) => string | null;
  markReportRead: (id: string) => void;
  markAllReportsRead: () => void;
  managerStats: (agentId: string) => ManagerStats;
  agentPerf: (agentId: string) => AgentPerf;
  createChatSession: (agentId: string) => string;
  sendChatMessage: (sessionId: string, text: string) => void;
  deleteChatSession: (sessionId: string) => void;
  createAgent: (p: { name: string; role: string; team: string; model: string; gender?: 'male' | 'female'; hairStyle?: HairStyle }) => void;
  updateAgent: (id: string, patch: Partial<Pick<AgentProfile, 'name' | 'role' | 'team' | 'model' | 'gender' | 'hairStyle' | 'managerId'>>) => void;
  pauseAgent: (id: string) => void;
  resumeAgent: (id: string) => void;
  startMeeting: (topic: string, agentIds: string[]) => void;
  endMeeting: (id: string) => void;
}

export const useWorld = create<WorldState>()((set, get) => {
  const log = (kind: LogEntry['kind'], message: string) =>
    set((s) => ({
      logs: [{ id: `log-${logSeq++}`, timeMin: s.clockMin, kind, message }, ...s.logs].slice(0, 120),
    }));

  const sendToDesk = (a: AgentProfile): AgentProfile => {
    pendingVisual.set(a.id, 'typing');
    return { ...a, dest: { x: a.desk.x, y: a.desk.y, z: a.desk.z }, destLabel: a.deskRoom, visual: 'walking', status: a.currentTaskId ? 'working' : 'online' };
  };

  const withReports = (reports: Report[]) => ({
    reports,
    unreadReportCount: reports.filter((r) => !r.read).length,
    latestUnreadReport: reports.find((r) => !r.read) ?? null,
  });

  const buildReport = (
    t: TaskItem, managerId: string, executorId: string,
    reviewFeedback: string, revisionCount: number, inReplyToReportId?: string,
  ): Report => {
    const s = get();
    const mgr = s.agents.find((a) => a.id === managerId);
    const exe = s.agents.find((a) => a.id === executorId);
    const doneSubs = t.subtasks.filter((st) => st.done).length;
    const md = [
      `Laporan Manager ${mgr?.name ?? managerId}`,
      `Tugas ${t.title}`,
      `Pelaksana ${exe?.name ?? executorId} (${exe?.role ?? ''})`,
      `Dipilih karena ${t.routingReason ?? 'Penugasan langsung.'}`,
      `Hasil review Disetujui. ${reviewFeedback}`,
      `Revisi ${revisionCount} kali`,
      `Ringkasan ${t.artifact ? `Artefak ${t.artifact.name} selesai dengan ${doneSubs} dari ${t.subtasks.length} subtugas selesai.` : t.description}`,
    ].join('\n');
    return {
      id: uid('rep'), taskId: t.id, managerId, executorId,
      title: `Laporan: ${t.title}`, content: plainText(md),
      createdAt: Date.now(), read: false, revisionCount,
      reviewStatus: 'approved', routingReason: t.routingReason ?? '',
      ...(inReplyToReportId ? { inReplyToReportId } : {}),
    };
  };

  /** Inti pembuatan tugas (dipakai assignTask, chat, replyToReport). */
  const createTaskInternal = (
    title: string,
    description: string,
    assigneeId?: string,
    opts?: { source?: TaskSource; delegatedByAgentId?: string | null; routingReason?: string; inReplyToReportId?: string },
  ): { status: 'ok' | 'live-blocked'; taskId: string | null } => {
    const s = get();
    if (s.mode === 'live') {
      log('error', '⛔ LIVE MODE: tugas ditolak — "Integration Required". Belum ada provider LLM terhubung.');
      return { status: 'live-blocked', taskId: null };
    }
    const nameOf = (id: string) => s.agents.find((a) => a.id === id)?.name ?? id;
    let assignee: string | null = assigneeId ?? null;
    let delegatedBy: string | null = opts?.delegatedByAgentId ?? null;
    let routingReason: string | undefined = opts?.routingReason;
    let source: TaskSource = opts?.source ?? 'direct';

    if (delegatedBy) {
      // Revisi atas perintah manager: pelaksana tetap executor asli.
      if (!routingReason) routingReason = `Tugas revisi dari ${nameOf(delegatedBy)} — dikerjakan ulang oleh pelaksana yang sama.`;
      source = opts?.source ?? 'direct';
    } else {
      const target = assignee ?? 'ag-bimo'; // tanpa assignee → manager default Bimo
      const targetAgent = s.agents.find((a) => a.id === target);
      const isManager = s.agents.some((a) => a.managerId === target);
      if (isManager && targetAgent) {
        const pick = pickBestAssignee(target, title, description, s.agents);
        if (pick) {
          assignee = pick.agentId;
          delegatedBy = target;
          routingReason = pick.reason;
          source = opts?.source ?? 'orchestrated';
        } else {
          assignee = target;
          routingReason = 'Tidak ada bawahan yang cocok — dikerjakan langsung oleh manager.';
        }
      } else {
        assignee = target;
      }
    }

    const executor = s.agents.find((a) => a.id === assignee);
    const subs: { title: string; agentId: string }[] = [
      { title: `Riset & analisis kebutuhan`, agentId: 'ag-yoga' },
      { title: `Rancangan oleh ${executor?.name ?? 'tim'}`, agentId: assignee ?? 'ag-bimo' },
      { title: `Implementasi / penulisan draf`, agentId: assignee === 'ag-kirana' || assignee === 'ag-saka' ? assignee : 'ag-kirana' },
      { title: `QA & review akhir`, agentId: 'ag-fajar' },
    ];
    const isHigh = /mendesak|urgent|penting|deadline/i.test(title + description);
    const task: TaskItem = {
      id: uid('task'), title, description, assigneeId: assignee,
      managerId: delegatedBy ?? executor?.managerId ?? 'ag-bimo',
      status: isHigh ? 'waiting_approval' : 'queued', priority: isHigh ? 'high' : 'medium',
      progress: 0, createdAtMin: s.clockMin, createdAtMs: Date.now(), costUsd: 0, demo: true,
      delegatedByAgentId: delegatedBy, routingReason,
      reviewStatus: 'pending', revisionCount: 0, source,
      ...(opts?.inReplyToReportId ? { inReplyToReportId: opts.inReplyToReportId } : {}),
      subtasks: subs.map((sb, i) => ({ id: uid('st') + i, title: sb.title, agentId: sb.agentId, done: false })),
    };
    set({ tasks: [task, ...get().tasks] });
    log('task', delegatedBy
      ? `📝 Tugas dibuat (DEMO): "${title}" → ${nameOf(assignee ?? '')} (didelegasikan oleh ${nameOf(delegatedBy)}: ${routingReason})`
      : isHigh
        ? `📝 Tugas prioritas tinggi dibuat — menunggu approval kamu: "${title}"`
        : `📝 Tugas dibuat (DEMO): "${title}" → ${nameOf(assignee ?? '')}`);
    return { status: 'ok', taskId: task.id };
  };

  /** Bersihkan penanda manager-menunggu; bila manager masih menunggu tugas
   *  delegasi lain yang sedang running, arahkan currentTaskId ke tugas itu. */
  const clearManagerWaiting = (task: TaskItem, agents: AgentProfile[], allTasks: TaskItem[]): AgentProfile[] => {
    if (!task.delegatedByAgentId) return agents;
    const mgrId = task.delegatedByAgentId;
    const other = allTasks.find((t) => t.id !== task.id && t.delegatedByAgentId === mgrId && t.status === 'running');
    return agents.map((a) => {
      if (a.id !== mgrId || a.currentTaskId !== task.id) return a;
      if (other) {
        const exeName = agents.find((x) => x.id === other.assigneeId)?.name ?? other.assigneeId ?? '';
        return { ...a, currentTaskId: other.id, destLabel: `Bekerja di meja, menunggu hasil ${exeName}` };
      }
      return { ...a, currentTaskId: null, status: 'online' as const, destLabel: a.deskRoom };
    });
  };

  const nowParts = wibParts(Date.now());

  return {
    mode: 'demo',
    paused: false,
    wibNow: Date.now(),
    clockMin: nowParts.clockMin,
    day: nowParts.day,
    isNight: isNightWIB(Date.now()),
    cameraMode: 'iso',
    selectedFloor: 0,
    hideRoof: false,
    followAgentId: null,
    selectedAgentId: null,
    selectedBuildingId: null,
    nav: 'world',
    panelOpen: true,
    quality: 'medium',
    agents: SEED_AGENTS,
    tasks: SEED_TASKS,
    logs: [{ id: 'log-0', timeMin: nowParts.clockMin, kind: 'system', message: 'Dunia dimulai — Mode DEMO. 10 agent siap di kampus.' }],
    meetings: SEED_MEETINGS,
    reports: [],
    chatSessions: [],
    unreadReportCount: 0,
    latestUnreadReport: null,
    matchScore: { a: 0, b: 0 },

    addLog: (kind, message) => log(kind, message),

    tick: () => {
      const s = get();
      if (s.paused) return;
      tickCount++;
      const now = Date.now();
      const wib = wibParts(now);
      const clockMin = wib.clockMin;
      const day = wib.day;
      const isNight = isNightWIB(now);

      // ── 1. Task engine (demo, deterministik) ──
      let tasks = s.tasks.map((t) => ({ ...t, subtasks: t.subtasks.map((st) => ({ ...st })) }));
      let agents = s.agents.map((a) => ({ ...a }));
      let reports = s.reports;

      // mulai task yang queued bila assignee bebas
      for (const t of tasks) {
        if (t.status !== 'queued' || !t.assigneeId) continue;
        const ai = agents.findIndex((a) => a.id === t.assigneeId);
        if (ai < 0 || agents[ai].currentTaskId || agents[ai].paused) continue;
        t.status = 'running';
        agents[ai] = { ...agents[ai], currentTaskId: t.id, status: 'working', visual: 'walking', dest: { x: agents[ai].desk.x, y: agents[ai].desk.y, z: agents[ai].desk.z }, destLabel: agents[ai].deskRoom };
        pendingVisual.set(agents[ai].id, 'typing');
        log('task', `▶ ${t.title} — dimulai oleh ${agents[ai].name} (DEMO)`);
        // manager menunggu hasil bawahan (tetap status working di meja)
        if (t.delegatedByAgentId) {
          const mi = agents.findIndex((a) => a.id === t.delegatedByAgentId);
          if (mi >= 0 && !agents[mi].paused && !agents[mi].currentTaskId) {
            pendingVisual.set(agents[mi].id, 'typing');
            agents[mi] = {
              ...agents[mi], currentTaskId: t.id, status: 'working', visual: 'walking',
              dest: { x: agents[mi].desk.x, y: agents[mi].desk.y, z: agents[mi].desk.z },
              destLabel: `Bekerja di meja, menunggu hasil ${agents[ai].name}`,
            };
          }
          t.managerWaiting = true;
        }
      }
      // progres task berjalan
      for (const t of tasks) {
        if (t.status !== 'running') continue;
        t.progress = Math.min(100, t.progress + 2);
        const n = t.subtasks.length;
        t.subtasks.forEach((st, i) => {
          if (!st.done && t.progress >= ((i + 1) / n) * 100) {
            st.done = true;
            log('task', `✓ Subtugas selesai: ${st.title} (${t.title})`);
          }
        });
        t.costUsd = +(t.progress * 0.0006).toFixed(4);
        if (t.progress >= 100) {
          t.status = 'done';
          t.managerWaiting = false;
          const art = artifactFor(t);
          t.artifact = art;
          const ai = agents.findIndex((a) => a.id === t.assigneeId);
          if (ai >= 0) {
            agents[ai] = { ...agents[ai], currentTaskId: null, tasksDone: agents[ai].tasksDone + 1, costTodayUsd: +(agents[ai].costTodayUsd + t.costUsd).toFixed(4), visual: 'celebrating', status: 'working' };
            pendingVisual.set(agents[ai].id, 'celebrating');
            setTimeout(() => {
              const cur = get().agents.find((a) => a.id === agents[ai].id);
              if (cur && cur.visual === 'celebrating') {
                set((st) => ({ agents: st.agents.map((a) => (a.id === cur.id ? sendToDesk(a) : a)) }));
              }
            }, 6000);
          }
          // bersihkan currentTaskId manager yang menunggu (atau arahkan ke delegasi lain)
          agents = clearManagerWaiting(t, agents, tasks);
          log('task', `🎉 SELESAI (DEMO): ${t.title} — artefak "${art.name}" tersedia di panel Task.`);
          // ── Review demo oleh manager + laporan manager ──
          if (t.delegatedByAgentId && t.assigneeId) {
            const allDone = t.subtasks.every((st) => st.done);
            if (t.artifact && allDone) {
              t.reviewStatus = 'approved';
              t.reviewFeedback = 'Review demo: artefak lengkap, semua subtugas selesai.';
            } else {
              t.reviewStatus = 'needs_revision';
              t.reviewFeedback = 'Review demo: artefak atau subtugas belum lengkap.';
            }
            if (t.reviewStatus === 'approved') {
              const prev = reports.find((r) => r.taskId === t.id);
              const rep = buildReport(t, t.delegatedByAgentId, t.assigneeId, t.reviewFeedback, t.revisionCount ?? 0, t.inReplyToReportId ?? prev?.id);
              reports = [rep, ...reports];
              const mgrName = agents.find((a) => a.id === t.delegatedByAgentId)?.name ?? t.delegatedByAgentId;
              log('task', `📋 Laporan manager ditulis oleh ${mgrName}: "${t.title}" — disetujui${(t.revisionCount ?? 0) > 0 ? ` setelah ${t.revisionCount} revisi` : ''}.`);
            }
          }
        }
      }

      // ── 2. Meeting live: transcript demo berurutan ──
      let meetings = s.meetings.map((m) => ({ ...m, transcript: [...m.transcript] }));
      for (const m of meetings) {
        if (m.status !== 'live') continue;
        if (tickCount % 6 === 0 && m.agentIds.length > 0) {
          const spk = m.agentIds[(Math.floor(tickCount / 6) - 1) % m.agentIds.length];
          const lines = MEETING_LINES[spk] ?? ['Setuju, lanjut.'];
          const text = lines[Math.floor(tickCount / 6 / m.agentIds.length) % lines.length];
          const name = agents.find((a) => a.id === spk)?.name ?? spk;
          m.transcript.push({ speaker: name, text, demo: true });
          // pembicara bergiliran: visual talking
          agents = agents.map((a) => (a.id === spk ? { ...a, visual: 'talking' as VisualActivity } : a.id === m.agentIds[0] ? { ...a, visual: 'presenting' as VisualActivity } : a));
        }
      }

      // ── 3. Avatar otomatis (bukan jadwal kehidupan terjadwal) ──
      // Agent idle (tanpa tugas, tidak meeting): setelah jeda idle, pergi
      // santai sendiri lalu kembali ke meja. Agent di-pause pulang & tidur.
      agents = agents.map((a) => {
        if (a.paused) {
          if (a.dest.x === a.home.x && a.dest.z === a.home.z) return a;
          pendingVisual.set(a.id, 'sleeping');
          return { ...a, dest: { ...a.home }, destLabel: 'Apartemen — tidur', visual: 'walking', status: 'offline' };
        }
        if (a.currentTaskId) return a; // bekerja / manager menunggu bawahan
        if (meetings.some((m) => m.status === 'live' && m.agentIds.includes(a.id))) return a;
        const until = leisureUntil.get(a.id) ?? 0;
        if (now < until) return a; // masih menikmati tujuan santai
        if (a.status === 'leisure') {
          leisureUntil.delete(a.id);
          lastLeisureAt.set(a.id, now);
          return sendToDesk(a);
        }
        const last = lastLeisureAt.get(a.id) ?? 0;
        if (now - last < LEISURE_COOLDOWN_MS) {
          const atDesk = a.dest.x === a.desk.x && a.dest.z === a.desk.z;
          return atDesk ? a : sendToDesk(a);
        }
        const spot = pickLeisureDest(a);
        lastLeisureAt.set(a.id, now);
        leisureUntil.set(a.id, now + LEISURE_DURATION_MS);
        pendingVisual.set(a.id, spot.visual);
        return { ...a, dest: { ...spot.dest }, destLabel: spot.destLabel, visual: 'walking', status: 'leisure' };
      });

      // ── 4. Skor bola (simulasi visual) ──
      let matchScore = s.matchScore;
      if (agents.some((a) => a.visual === 'playing') && tickCount % 14 === 0) {
        matchScore = tickCount % 28 === 0 ? { ...matchScore, b: matchScore.b + 1 } : { ...matchScore, a: matchScore.a + 1 };
        log('info', `⚽ Gol! Skor pertandingan persahabatan ${matchScore.a} – ${matchScore.b} (simulasi visual).`);
      }

      set({ wibNow: now, clockMin, day, isNight, tasks, agents, meetings, matchScore, ...withReports(reports) });
    },

    agentArrived: (id) => {
      const v = pendingVisual.get(id) ?? 'idle';
      set((s) => ({
        agents: s.agents.map((a) => {
          if (a.id !== id) return a;
          const status: AgentProfile['status'] =
            v === 'typing' ? 'working'
            : v === 'sleeping' || v === 'eating' || v === 'swimming' || v === 'playing' || v === 'exercising' ? 'leisure'
            : v === 'talking' || v === 'presenting' ? 'meeting'
            : a.status === 'leisure' ? 'leisure' : 'online';
          return { ...a, visual: v, status };
        }),
      }));
    },

    setNav: (n) => set({ nav: n, panelOpen: true }),
    setPanelOpen: (v) => set({ panelOpen: v }),
    setCamera: (m) => set({ cameraMode: m, followAgentId: m === 'follow' ? get().followAgentId ?? get().selectedAgentId : get().followAgentId }),
    setFloor: (f) => set({ selectedFloor: f, hideRoof: f > 0 ? true : get().hideRoof }),
    setHideRoof: (v) => set({ hideRoof: v }),
    togglePause: () => set((s) => ({ paused: !s.paused })),
    setQuality: (q) => set({ quality: q }),
    setMode: (m) => {
      set({ mode: m });
      if (m === 'live') log('system', '⚠ LIVE MODE: eksekusi LLM diblokir — "Integration Required". Hubungkan provider & API key di Settings (backend-only).');
      else log('system', 'Mode DEMO aktif — orkestrasi disimulasikan dan dilabeli demo.');
    },
    selectAgent: (id) => set({ selectedAgentId: id, panelOpen: id ? true : get().panelOpen, nav: id ? 'agents' : get().nav }),
    followAgent: (id) => set({ followAgentId: id, cameraMode: id ? 'follow' : 'iso' }),
    selectBuilding: (id) => set({ selectedBuildingId: id, panelOpen: id ? true : get().panelOpen, nav: id ? 'buildings' : get().nav }),

    assignTask: (title, description, assigneeId, opts) => createTaskInternal(title, description, assigneeId, opts).status,

    approveTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'queued' as const } : t)) }));
      log('task', `✅ Approval diberikan untuk tugas ${id} — masuk antrean.`);
    },
    cancelTask: (id) => {
      const s = get();
      const t = s.tasks.find((x) => x.id === id);
      set((st) => ({
        tasks: st.tasks.map((x) => (x.id === id ? { ...x, status: 'cancelled' as const, managerWaiting: false } : x)),
        agents: clearManagerWaiting(
          t ?? { delegatedByAgentId: null } as TaskItem,
          st.agents.map((a) => (a.currentTaskId === id && a.id !== t?.delegatedByAgentId ? sendToDesk({ ...a, currentTaskId: null }) : a)),
          st.tasks,
        ),
      }));
      if (t) log('task', `🚫 Tugas dibatalkan: "${t.title}".`);
    },
    retryTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'queued' as const, progress: 0, error: undefined, reviewStatus: 'pending' as const, reviewFeedback: undefined, artifact: undefined, subtasks: t.subtasks.map((st) => ({ ...st, done: false })) } : t)) }));
      log('task', `🔁 Retry tugas ${id} — antrean dimulai ulang dari 0%.`);
    },
    failTask: (id) => {
      const s = get();
      const t = s.tasks.find((x) => x.id === id);
      set((st) => ({
        tasks: st.tasks.map((x) => (x.id === id ? { ...x, status: 'failed' as const, managerWaiting: false, error: 'LLM timeout setelah 30 dtk — simulasi kegagalan (DEMO). Tidak ada artefak yang dibuat.' } : x)),
        agents: clearManagerWaiting(
          t ?? { delegatedByAgentId: null } as TaskItem,
          st.agents.map((a) => (a.currentTaskId === id && a.id !== t?.delegatedByAgentId ? { ...a, currentTaskId: null, status: 'error' as const, visual: 'waiting' as VisualActivity, tasksFailed: a.tasksFailed + 1 } : a)),
          st.tasks,
        ),
      }));
      if (t) log('error', `❌ Tugas GAGAL (simulasi): "${t.title}" — LLM timeout. Avatar menampilkan indikator error; tidak ada klaim selesai.`);
    },

    requestRevision: (taskId, feedback) => {
      const s = get();
      const t = s.tasks.find((x) => x.id === taskId);
      if (!t) return 'not-found';
      const count = t.revisionCount ?? 0;
      if (count >= 2) {
        const fb = `${feedback} (masih ada catatan setelah 2 revisi)`;
        set((st) => ({ tasks: st.tasks.map((x) => (x.id === taskId ? { ...x, reviewStatus: 'approved' as const, reviewFeedback: fb } : x)) }));
        // laporkan sisa catatan sebagai laporan lanjutan
        const mgrId = t.delegatedByAgentId ?? t.managerId;
        if (t.assigneeId) {
          const rep = buildReport({ ...t, reviewFeedback: fb }, mgrId, t.assigneeId, fb, count, undefined);
          set((st) => withReports([rep, ...st.reports]));
        }
        log('task', `✏️ Batas 2 revisi tercapai untuk "${t.title}" — masih ada catatan: ${feedback}`);
        return 'max-revisions';
      }
      const n = count + 1;
      set((st) => ({
        tasks: st.tasks.map((x) => (x.id === taskId
          ? { ...x, status: 'queued' as const, progress: 0, reviewStatus: 'needs_revision' as const, reviewFeedback: feedback, revisionCount: n, artifact: undefined, subtasks: x.subtasks.map((sb) => ({ ...sb, done: false })) }
          : x)),
      }));
      log('task', `✏️ Revisi #${n} diminta untuk "${t.title}": ${feedback}`);
      return 'ok';
    },

    replyToReport: (reportId, text) => {
      const s = get();
      const rep = s.reports.find((r) => r.id === reportId);
      if (!rep) return null;
      const origTask = s.tasks.find((t) => t.id === rep.taskId);
      if (!origTask || !rep.executorId) return null;
      const mgrName = s.agents.find((a) => a.id === rep.managerId)?.name ?? rep.managerId;
      const exeName = s.agents.find((a) => a.id === rep.executorId)?.name ?? rep.executorId;
      log('task', `💬 Balasan laporan dari ${mgrName}: "${text}" (verbatim) — tugas revisi dibuat untuk ${exeName}.`);
      const r = createTaskInternal(
        `Revisi: ${origTask.title}`,
        `${text}\n\nKonteks laporan "${rep.title}": ${rep.content}`,
        rep.executorId,
        { source: 'report_reply', delegatedByAgentId: rep.managerId, inReplyToReportId: reportId },
      );
      return r.taskId;
    },

    markReportRead: (id) => {
      set((s) => withReports(s.reports.map((r) => (r.id === id ? { ...r, read: true } : r))));
    },
    markAllReportsRead: () => {
      set((s) => withReports(s.reports.map((r) => ({ ...r, read: true }))));
    },
    managerStats: (agentId) => computeManagerStats(agentId, get().tasks, get().reports, get().meetings),
    agentPerf: (agentId) => computeAgentPerf(agentId, get().tasks),

    createChatSession: (agentId) => {
      const id = uid('chat');
      const sess: ChatSession = { id, agentId, title: 'Chat baru', createdAt: Date.now(), messages: [] };
      set((s) => ({ chatSessions: [sess, ...s.chatSessions] }));
      return id;
    },
    sendChatMessage: (sessionId, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const s0 = get();
      const sess0 = s0.chatSessions.find((c) => c.id === sessionId);
      if (!sess0) return;
      const agent = s0.agents.find((a) => a.id === sess0.agentId);
      if (!agent) return;
      const isFirst = sess0.messages.length === 0;
      const title = isFirst ? trimmed.split(/\s+/).slice(0, 6).join(' ') : sess0.title;
      const userMsg = { id: uid('msg'), from: 'me' as const, text: trimmed, at: Date.now() };
      set((s) => ({
        chatSessions: s.chatSessions.map((c) => (c.id === sessionId ? { ...c, title, messages: [...c.messages, userMsg] } : c)),
      }));
      if (get().mode === 'live') {
        const errMsg = { id: uid('msg'), from: 'agent' as const, text: '⛔ LIVE MODE: chat diblokir — "Integration Required". Belum ada provider LLM terhubung.', at: Date.now() };
        set((s) => ({ chatSessions: s.chatSessions.map((c) => (c.id === sessionId ? { ...c, messages: [...c.messages, errMsg] } : c)) }));
        log('error', '⛔ LIVE MODE: chat diblokir — "Integration Required".');
        return;
      }
      const isCommand = /buatkan|kerjakan|tulis|riset|analisis|cari|tolong/i.test(trimmed);
      let reply: string;
      if (isCommand) {
        const r = createTaskInternal(trimmed.slice(0, 80), trimmed, sess0.agentId, { source: 'chat' });
        if (r.status === 'ok' && r.taskId) {
          const task = get().tasks.find((t) => t.id === r.taskId);
          const exeName = get().agents.find((a) => a.id === task?.assigneeId)?.name ?? agent.name;
          reply = task?.delegatedByAgentId
            ? `Tugas dibuat (DEMO): "${task.title}" → ${exeName} (id: ${r.taskId}). Didelegasikan oleh ${get().agents.find((a) => a.id === task.delegatedByAgentId)?.name ?? 'manager'}. Pantau progresnya di panel Tugas.`
            : `Tugas dibuat (DEMO): "${trimmed.slice(0, 80)}" → ${exeName} (id: ${r.taskId}). Pantau progresnya di panel Tugas.`;
        } else {
          reply = 'Tugas tidak dapat dibuat saat ini.';
        }
      } else {
        reply = demoReply(trimmed, agent);
      }
      const agentMsg = { id: uid('msg'), from: 'agent' as const, text: reply, at: Date.now() };
      set((s) => ({ chatSessions: s.chatSessions.map((c) => (c.id === sessionId ? { ...c, messages: [...c.messages, agentMsg] } : c)) }));
    },
    deleteChatSession: (sessionId) => {
      set((s) => ({ chatSessions: s.chatSessions.filter((c) => c.id !== sessionId) }));
    },

    createAgent: ({ name, role, team, model, gender, hairStyle }) => {
      const s = get();
      if (s.mode === 'live') { log('error', '⛔ LIVE MODE: pembuatan agent diblokir — "Integration Required".'); return; }
      const desk = SPARE_DESKS[s.agents.length % SPARE_DESKS.length];
      const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
      const c = colors[s.agents.length % colors.length];
      const g = gender ?? 'male';
      const a: AgentProfile = {
        id: uid('ag'), name, role, team,
        model: 'Muse (muse.ai)', provider: 'Muse (muse.ai)',
        systemPrompt: `Kamu adalah ${role} di kampus AI Agent Living World.`, skills: [role.toLowerCase()], tools: ['web_search', 'file_read', 'file_write'],
        color: c, shirt: c, pants: '#334155', skin: '#f1c27d', hair: '#1f2937',
        hairStyle: normalizeHairStyle(g, hairStyle ?? 'short'), gender: g, managerId: 'ag-bimo',
        desk: { x: desk.x, y: desk.y, z: desk.z }, deskFloor: desk.floor, deskRoom: desk.room,
        home: { x: -8 + (s.agents.length % 5) * 4, y: 0, z: 23.5 },
        costTodayUsd: 0, tasksDone: 0, tasksFailed: 0, status: 'online', visual: 'idle',
        dest: { x: desk.x, y: desk.y, z: desk.z }, destLabel: desk.room, currentTaskId: null, paused: false,
      };
      void model; // label provider selalu "Muse (muse.ai)" (Fase A); param dipertahankan untuk kompatibilitas pemanggil lama
      set({ agents: [...s.agents, a], selectedAgentId: a.id, nav: 'agents' });
      log('agent', `👤 Agent baru dibuat (DEMO): ${name} — ${role}. Meja: ${desk.room} L${desk.floor}.`);
    },
    updateAgent: (id, patch) => {
      set((s) => ({
        agents: s.agents.map((a) => {
          if (a.id !== id) return a;
          const next = { ...a, ...patch };
          if (patch.model !== undefined) { next.model = 'Muse (muse.ai)'; next.provider = 'Muse (muse.ai)'; }
          const gender = patch.gender ?? a.gender;
          const style = patch.hairStyle ?? a.hairStyle;
          next.gender = gender;
          next.hairStyle = normalizeHairStyle(gender, style);
          return next;
        }),
      }));
      log('agent', `✏️ Agent ${id} diperbarui: ${Object.keys(patch).join(', ')}.`);
    },
    pauseAgent: (id) => {
      pendingVisual.set(id, 'sleeping');
      set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, paused: true, status: 'offline' as const, currentTaskId: null, dest: { ...a.home }, destLabel: 'Apartemen — istirahat', visual: 'walking' as VisualActivity } : a)) }));
      log('agent', `⏸ Agent ${id} di-pause — avatar kembali ke apartemen.`);
    },
    resumeAgent: (id) => {
      set((s) => ({ agents: s.agents.map((a) => (a.id === id ? sendToDesk({ ...a, paused: false }) : a)) }));
      log('agent', `▶ Agent ${id} aktif kembali — menuju meja kerja.`);
    },
    startMeeting: (topic, agentIds) => {
      const s = get();
      if (s.mode === 'live') { log('error', '⛔ LIVE MODE: meeting diblokir — "Integration Required".'); return; }
      const m: Meeting = { id: uid('meet'), topic, room: 'Ruang Meeting L1', agentIds, status: 'live', transcript: [{ speaker: 'Sistem', text: `Rapat "${topic}" dimulai. Transkrip DEMO — dialog disimulasikan dari skrip, bukan output LLM.`, demo: true }] };
      pendingVisual.set(agentIds[0], 'presenting');
      set((st) => ({
        meetings: [m, ...st.meetings],
        agents: st.agents.map((a) => (agentIds.includes(a.id) ? { ...a, status: 'meeting' as const, visual: 'walking' as VisualActivity, dest: { ...MEETING_ROOM }, destLabel: 'Ruang Meeting L1' } : a)),
      }));
      log('meeting', `📣 Rapat dimulai: "${topic}" — ${agentIds.length} agent menuju ruang meeting.`);
    },
    endMeeting: (id) => {
      const s = get();
      const m = s.meetings.find((x) => x.id === id);
      if (!m) return;
      const minutes = `Notulen (DEMO) — "${m.topic}": ${m.transcript.length} pesan. Keputusan: lanjutkan sesuai rencana ${m.agentIds.length} agent yang hadir. Action items diteruskan ke Manager Agent (Bimo).`;
      set((st) => ({
        meetings: st.meetings.map((x) => (x.id === id ? { ...x, status: 'done' as const, minutes } : x)),
        agents: st.agents.map((a) => (m.agentIds.includes(a.id) ? sendToDesk(a) : a)),
      }));
      log('meeting', `✅ Rapat selesai: "${m.topic}" — notulen demo tersimpan.`);
    },
  };
});
