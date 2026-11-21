// ─── Zustand store + simulation / task engine (Fase 1) ─────────────────────
// SUMBER KEBENARAN: status task & agent di sini (dan kelak backend/Supabase).
// Mode DEMO = orkestrasi disimulasikan secara deterministik di browser dan
// DILABELI demo di semua tempat. Mode LIVE memblokir eksekusi sampai provider
// terhubung (lihat Settings → "Integration Required"). Tidak ada klaim palsu
// bahwa LLM berjalan padahal tidak.

import { create } from 'zustand';
import type {
  AgentProfile, Artifact, CameraMode, LogEntry, Meeting, NavKey, TaskItem, VisualActivity,
} from './types';
import { CAFE_TERRACE, FIELD_CENTER, GYM_DOOR, MEETING_ROOM, POOL_DECK, SEED_AGENTS, SEED_MEETINGS, SEED_TASKS } from './data/seed';

export const fmtClock = (min: number) =>
  `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(Math.floor(min % 60)).padStart(2, '0')}`;

const SPARE_DESKS: { x: number; y: number; z: number; floor: number; room: string }[] = [
  { x: -11, y: 0, z: -14, floor: 1, room: 'Open Workspace' },
  { x: -6, y: 3.2, z: -8, floor: 2, room: 'Ruang Programmer' },
  { x: 1, y: 3.2, z: -8, floor: 2, room: 'Ruang UI/UX & Desain' },
  { x: -2, y: 6.4, z: -8, floor: 3, room: 'Command Center' },
];

// Visual yang dipakai avatar SETELAH sampai di tujuan (disimpan di luar state
// React agar tidak memicu render per frame).
const pendingVisual = new Map<string, VisualActivity>();
const lastBlock = new Map<string, string>();
let logSeq = 100;
let tickCount = 0;

export function setPendingVisual(id: string, v: VisualActivity) {
  pendingVisual.set(id, v);
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;

function artifactFor(task: TaskItem): Artifact {
  const lines = task.subtasks.map((s) => `- [x] ${s.title}`).join('\n');
  return {
    name: `${task.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`,
    kind: 'document',
    content: `# ${task.title}\n\n> ARTEFAK DEMO — dihasilkan oleh simulasi task engine Fase 1.\n> Bukan output LLM nyata. Hubungkan provider di Settings untuk Live Mode.\n\n## Ringkasan\n${task.description}\n\n## Subtugas selesai\n${lines}\n\n## Catatan\nDokumen ini dibuat dari template deterministik demo. Di Fase 3, isi ini\ndiganti hasil nyata model + tool execution dengan audit log.\n`,
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
  speed: 1 | 2 | 4;
  clockMin: number;
  day: number;
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
  matchScore: { a: number; b: number };
  // actions
  tick: () => void;
  agentArrived: (id: string) => void;
  setNav: (n: NavKey) => void;
  setPanelOpen: (v: boolean) => void;
  setCamera: (m: CameraMode) => void;
  setFloor: (f: number) => void;
  setHideRoof: (v: boolean) => void;
  setSpeed: (s: 1 | 2 | 4) => void;
  togglePause: () => void;
  setQuality: (q: 'low' | 'medium' | 'high') => void;
  setMode: (m: 'demo' | 'live') => void;
  selectAgent: (id: string | null) => void;
  followAgent: (id: string | null) => void;
  selectBuilding: (id: string | null) => void;
  addLog: (kind: LogEntry['kind'], message: string) => void;
  assignTask: (title: string, description: string, assigneeId?: string) => 'ok' | 'live-blocked';
  approveTask: (id: string) => void;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  failTask: (id: string) => void;
  createAgent: (p: { name: string; role: string; team: string; model: string }) => void;
  updateAgent: (id: string, patch: Partial<Pick<AgentProfile, 'name' | 'role' | 'team' | 'model'>>) => void;
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

  return {
    mode: 'demo',
    paused: false,
    speed: 1,
    clockMin: 480, // 08:00
    day: 1,
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
    logs: [{ id: 'log-0', timeMin: 480, kind: 'system', message: 'Dunia dimulai — Mode DEMO. 10 agent siap di kampus.' }],
    meetings: SEED_MEETINGS,
    matchScore: { a: 0, b: 0 },

    addLog: (kind, message) => log(kind, message),

    tick: () => {
      const s = get();
      if (s.paused) return;
      tickCount++;
      let clockMin = s.clockMin + s.speed;
      let day = s.day;
      if (clockMin >= 1440) { clockMin -= 1440; day++; }
      const hour = Math.floor(clockMin / 60);

      // ── 1. Task engine (demo, deterministik) ──
      let tasks = s.tasks.map((t) => ({ ...t, subtasks: t.subtasks.map((st) => ({ ...st })) }));
      let agents = s.agents.map((a) => ({ ...a }));

      // mulai task yang queued bila assignee bebas
      for (const t of tasks) {
        if (t.status !== 'queued' || !t.assigneeId) continue;
        const ai = agents.findIndex((a) => a.id === t.assigneeId);
        if (ai < 0 || agents[ai].currentTaskId || agents[ai].paused) continue;
        t.status = 'running';
        agents[ai] = { ...agents[ai], currentTaskId: t.id, status: 'working', visual: 'walking', dest: { x: agents[ai].desk.x, y: agents[ai].desk.y, z: agents[ai].desk.z }, destLabel: agents[ai].deskRoom };
        pendingVisual.set(agents[ai].id, 'typing');
        log('task', `▶ ${t.title} — dimulai oleh ${agents[ai].name} (DEMO)`);
      }
      // progres task berjalan
      for (const t of tasks) {
        if (t.status !== 'running') continue;
        t.progress = Math.min(100, t.progress + 2 * s.speed);
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
          log('task', `🎉 SELESAI (DEMO): ${t.title} — artefak "${art.name}" tersedia di panel Task.`);
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

      // ── 3. Jadwal kehidupan visual (bukan kerja AI) ──
      const block = hour >= 22 || hour < 7 ? 'night' : hour >= 12 && hour < 13 ? 'lunch' : hour >= 17 && hour < 18 ? 'sport' : 'work';
      agents = agents.map((a, idx) => {
        if (a.paused || a.currentTaskId) return a;
        if (meetings.some((m) => m.status === 'live' && m.agentIds.includes(a.id))) return a;
        if (lastBlock.get(a.id) === block) return a;
        lastBlock.set(a.id, block);
        if (block === 'night') {
          pendingVisual.set(a.id, 'sleeping');
          return { ...a, dest: { ...a.home }, destLabel: 'Apartemen — tidur', visual: 'walking', status: 'leisure' };
        }
        if (block === 'lunch') {
          pendingVisual.set(a.id, 'eating');
          return { ...a, dest: { ...CAFE_TERRACE }, destLabel: 'Kantin — makan siang', visual: 'walking', status: 'leisure' };
        }
        if (block === 'sport') {
          const pick = idx % 3;
          if (pick === 0) { pendingVisual.set(a.id, 'swimming'); return { ...a, dest: { ...POOL_DECK }, destLabel: 'Kolam renang', visual: 'walking', status: 'leisure' }; }
          if (pick === 1) { pendingVisual.set(a.id, 'playing'); return { ...a, dest: { ...FIELD_CENTER }, destLabel: 'Lapangan bola', visual: 'walking', status: 'leisure' }; }
          pendingVisual.set(a.id, 'exercising');
          return { ...a, dest: { ...GYM_DOOR }, destLabel: 'Gym', visual: 'walking', status: 'leisure' };
        }
        return sendToDesk(a);
      });

      // ── 4. Skor bola (simulasi visual) ──
      let matchScore = s.matchScore;
      if (agents.some((a) => a.visual === 'playing') && tickCount % 14 === 0) {
        matchScore = tickCount % 28 === 0 ? { ...matchScore, b: matchScore.b + 1 } : { ...matchScore, a: matchScore.a + 1 };
        log('info', `⚽ Gol! Skor pertandingan persahabatan ${matchScore.a} – ${matchScore.b} (simulasi visual).`);
      }

      set({ clockMin, day, tasks, agents, meetings, matchScore });
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
    setSpeed: (sp) => set({ speed: sp }),
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

    assignTask: (title, description, assigneeId) => {
      const s = get();
      if (s.mode === 'live') {
        log('error', '⛔ LIVE MODE: tugas ditolak — "Integration Required". Belum ada provider LLM terhubung.');
        return 'live-blocked';
      }
      const low = `${title} ${description}`.toLowerCase();
      const pick = (kw: string[], id: string) => (kw.some((k) => low.includes(k)) ? id : null);
      const lead = pick(['riset', 'research', 'pasar'], 'ag-yoga') ?? pick(['desain', 'design', 'ui', 'ux', 'figma'], 'ag-lestari') ?? pick(['copy', 'tulis', 'artikel', 'konten'], 'ag-rani') ?? pick(['data', 'analisis', 'laporan keuangan'], 'ag-maya') ?? pick(['qa', 'uji', 'test'], 'ag-fajar') ?? 'ag-bimo';
      const assignee = assigneeId ?? lead;
      const subs: { title: string; agentId: string }[] = [
        { title: `Riset & analisis kebutuhan`, agentId: 'ag-yoga' },
        { title: `Rancangan oleh ${s.agents.find((a) => a.id === assignee)?.name ?? 'tim'}`, agentId: assignee },
        { title: `Implementasi / penulisan draf`, agentId: assignee === 'ag-kirana' || assignee === 'ag-saka' ? assignee : 'ag-kirana' },
        { title: `QA & review akhir`, agentId: 'ag-fajar' },
      ];
      const isHigh = /mendesak|urgent|penting|deadline/i.test(title + description);
      const task: TaskItem = {
        id: uid('task'), title, description, assigneeId: assignee, managerId: 'ag-bimo',
        status: isHigh ? 'waiting_approval' : 'queued', priority: isHigh ? 'high' : 'medium',
        progress: 0, createdAtMin: s.clockMin, costUsd: 0, demo: true,
        subtasks: subs.map((sb, i) => ({ id: uid('st') + i, title: sb.title, agentId: sb.agentId, done: false })),
      };
      set({ tasks: [task, ...s.tasks] });
      log('task', isHigh ? `📝 Tugas prioritas tinggi dibuat — menunggu approval kamu: "${title}"` : `📝 Tugas dibuat (DEMO): "${title}" → ${s.agents.find((a) => a.id === assignee)?.name ?? assignee}`);
      return 'ok';
    },

    approveTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'queued' as const } : t)) }));
      log('task', `✅ Approval diberikan untuk tugas ${id} — masuk antrean.`);
    },
    cancelTask: (id) => {
      const s = get();
      const t = s.tasks.find((x) => x.id === id);
      set((st) => ({
        tasks: st.tasks.map((x) => (x.id === id ? { ...x, status: 'cancelled' as const } : x)),
        agents: st.agents.map((a) => (a.currentTaskId === id ? sendToDesk({ ...a, currentTaskId: null }) : a)),
      }));
      if (t) log('task', `🚫 Tugas dibatalkan: "${t.title}".`);
    },
    retryTask: (id) => {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: 'queued' as const, progress: 0, error: undefined, subtasks: t.subtasks.map((st) => ({ ...st, done: false })) } : t)) }));
      log('task', `🔁 Retry tugas ${id} — antrean dimulai ulang dari 0%.`);
    },
    failTask: (id) => {
      const s = get();
      const t = s.tasks.find((x) => x.id === id);
      set((st) => ({
        tasks: st.tasks.map((x) => (x.id === id ? { ...x, status: 'failed' as const, error: 'LLM timeout setelah 30 dtk — simulasi kegagalan (DEMO). Tidak ada artefak yang dibuat.' } : x)),
        agents: st.agents.map((a) => (a.currentTaskId === id ? { ...a, currentTaskId: null, status: 'error' as const, visual: 'waiting' as VisualActivity, tasksFailed: a.tasksFailed + 1 } : a)),
      }));
      if (t) log('error', `❌ Tugas GAGAL (simulasi): "${t.title}" — LLM timeout. Avatar menampilkan indikator error; tidak ada klaim selesai.`);
    },
    createAgent: ({ name, role, team, model }) => {
      const s = get();
      if (s.mode === 'live') { log('error', '⛔ LIVE MODE: pembuatan agent diblokir — "Integration Required".'); return; }
      const desk = SPARE_DESKS[s.agents.length % SPARE_DESKS.length];
      const colors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777'];
      const c = colors[s.agents.length % colors.length];
      const a: AgentProfile = {
        id: uid('ag'), name, role, team, model: `${model} (demo)`, provider: 'Belum terhubung',
        systemPrompt: `Kamu adalah ${role} di kampus AI Agent Living World.`, skills: [role.toLowerCase()], tools: ['web_search', 'file_read', 'file_write'],
        color: c, shirt: c, pants: '#334155', skin: '#f1c27d', hair: '#1f2937', hairStyle: 'short',
        desk: { x: desk.x, y: desk.y, z: desk.z }, deskFloor: desk.floor, deskRoom: desk.room,
        home: { x: -8 + (s.agents.length % 5) * 4, y: 0, z: 23.5 },
        costTodayUsd: 0, tasksDone: 0, tasksFailed: 0, status: 'online', visual: 'idle',
        dest: { x: desk.x, y: desk.y, z: desk.z }, destLabel: desk.room, currentTaskId: null, paused: false,
      };
      set({ agents: [...s.agents, a], selectedAgentId: a.id, nav: 'agents' });
      log('agent', `👤 Agent baru dibuat (DEMO): ${name} — ${role}. Meja: ${desk.room} L${desk.floor}.`);
    },
    updateAgent: (id, patch) => {
      set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
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
