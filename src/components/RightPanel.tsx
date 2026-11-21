// ─── Panel kanan kontekstual: agent / tugas / meeting / gedung / analitik ───
// Semua tombol berfungsi. Fitur yang belum ada (Live LLM, Build Mode) diberi
// status jujur "Integration Required" / "Backlog", bukan tombol palsu.

import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, Ban, Check, Download, Eye, MessageSquare, Pause, Pencil,
  Play, Plus, RotateCcw, Send, Video, X,
} from 'lucide-react';
import { fmtClock, useWorld } from '../store';
import { BUILDINGS } from '../data/seed';
import type { AgentProfile, TaskItem } from '../types';

const STATUS_LABEL: Record<string, string> = {
  online: 'Online', working: 'Bekerja', thinking: 'Berpikir', meeting: 'Meeting',
  leisure: 'Leisure', offline: 'Offline', error: 'Error',
};
const STATUS_COLOR: Record<string, string> = {
  online: 'bg-sky-100 text-sky-700', working: 'bg-emerald-100 text-emerald-700',
  thinking: 'bg-blue-100 text-blue-700', meeting: 'bg-purple-100 text-purple-700',
  leisure: 'bg-amber-100 text-amber-700', offline: 'bg-slate-200 text-slate-600',
  error: 'bg-red-100 text-red-700',
};
const TASK_COLOR: Record<string, string> = {
  queued: 'bg-slate-200 text-slate-600', running: 'bg-sky-100 text-sky-700',
  waiting_approval: 'bg-amber-100 text-amber-800', done: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-500',
};

function Badge({ children, cls }: { children: ReactNode; cls: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{children}</span>;
}

function Btn({ children, onClick, cls = '', title }: { children: ReactNode; onClick: () => void; cls?: string; title?: string }) {
  return (
    <button onClick={onClick} title={title} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${cls || 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
      {children}
    </button>
  );
}

function demoReply(text: string, agent: AgentProfile): string {
  const t = text.toLowerCase();
  if (t.includes('tugas') || t.includes('kerja') || t.includes('kerjakan'))
    return `Saya ${agent.name} (${agent.role}). Saat ini status saya: ${STATUS_LABEL[agent.status]}. Di mode DEMO, balasan ini disimulasikan dari skrip — bukan output LLM.`;
  if (t.includes('halo') || t.includes('hai') || t.includes('pagi'))
    return `Halo! Saya ${agent.name}, ${agent.role} di tim ${agent.team}. Ada tugas untuk saya? (balasan demo)`;
  if (t.includes('biaya') || t.includes('cost') || t.includes('token'))
    return `Penggunaan saya hari ini tercatat $${agent.costTodayUsd.toFixed(2)} — estimasi demo, bukan tagihan provider.`;
  if (t.includes('jadwal') || t.includes('jam'))
    return `Jadwal visual saya: kerja di meja, makan siang 12.00, olahraga 17.00, tidur 22.00. Ini simulasi kehidupan, bukan aturan kerja AI.`;
  return `Baik, saya catat: "${text}". Di mode DEMO saya menjawab dari skrip simulasi. Hubungkan provider di Settings untuk jawaban LLM nyata.`;
}

// ─── Detail agent ───
function AgentDetail({ agent }: { agent: AgentProfile }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{ from: 'me' | 'agent'; text: string }[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [editName, setEditName] = useState(agent.name);
  const [editRole, setEditRole] = useState(agent.role);
  const mode = useWorld((s) => s.mode);
  const assignTask = useWorld((s) => s.assignTask);
  const followAgent = useWorld((s) => s.followAgent);
  const pauseAgent = useWorld((s) => s.pauseAgent);
  const resumeAgent = useWorld((s) => s.resumeAgent);
  const updateAgent = useWorld((s) => s.updateAgent);
  const setNav = useWorld((s) => s.setNav);
  const currentTask = useWorld((s) => s.tasks.find((t) => t.id === agent.currentTaskId));

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatLog((l) => [...l, { from: 'me', text }, { from: 'agent', text: demoReply(text, agent) }]);
    setChatInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0" style={{ background: agent.color }}>
          {agent.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-800">{agent.name}</div>
          <div className="text-xs text-slate-500">{agent.role} · {agent.team}</div>
          <div className="mt-1 flex gap-1 flex-wrap">
            <Badge cls={STATUS_COLOR[agent.status]}>{STATUS_LABEL[agent.status]}</Badge>
            <Badge cls="bg-slate-100 text-slate-600">{agent.visual}</Badge>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-600 space-y-1 bg-white/70 rounded-xl p-3 border border-white">
        <div><b>Model:</b> {agent.model}</div>
        <div><b>Provider:</b> {agent.provider}</div>
        <div><b>Lokasi:</b> {agent.destLabel} · {agent.deskRoom} L{agent.deskFloor}</div>
        <div><b>Tugas saat ini:</b> {currentTask ? currentTask.title : '—'}</div>
        <div><b>Selesai:</b> {agent.tasksDone} · <b>Gagal:</b> {agent.tasksFailed} · <b>Biaya hari ini:</b> ${agent.costTodayUsd.toFixed(2)} (demo)</div>
        <div className="pt-1"><b>System prompt:</b> <span className="italic">{agent.systemPrompt}</span></div>
        <div className="flex gap-1 flex-wrap pt-1">
          {agent.skills.map((sk) => <span key={sk} className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[11px]">{sk}</span>)}
        </div>
        <div className="flex gap-1 flex-wrap">
          {agent.tools.map((tl) => <span key={tl} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-mono">{tl}</span>)}
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <Btn onClick={() => setChatOpen(!chatOpen)} cls="bg-sky-500 text-white"><span className="inline-flex items-center gap-1"><MessageSquare size={13} /> Chat</span></Btn>
        <Btn onClick={() => setAssignOpen(!assignOpen)}><span className="inline-flex items-center gap-1"><Plus size={13} /> Assign Task</span></Btn>
        <Btn onClick={() => followAgent(agent.id)}><span className="inline-flex items-center gap-1"><Eye size={13} /> Follow</span></Btn>
        <Btn onClick={() => setNav('tasks')}>View Work</Btn>
        {agent.paused
          ? <Btn onClick={() => resumeAgent(agent.id)} cls="bg-emerald-500 text-white"><span className="inline-flex items-center gap-1"><Play size={13} /> Resume</span></Btn>
          : <Btn onClick={() => pauseAgent(agent.id)} cls="bg-amber-500 text-white"><span className="inline-flex items-center gap-1"><Pause size={13} /> Pause</span></Btn>}
        <Btn onClick={() => { setEditOpen(!editOpen); setEditName(agent.name); setEditRole(agent.role); }}><span className="inline-flex items-center gap-1"><Pencil size={13} /> Edit</span></Btn>
      </div>

      {editOpen && (
        <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
          <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Nama agent" />
          <input value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Jabatan" />
          <Btn onClick={() => { updateAgent(agent.id, { name: editName.trim() || agent.name, role: editRole.trim() || agent.role }); setEditOpen(false); }} cls="bg-sky-500 text-white">Simpan perubahan</Btn>
        </div>
      )}

      {assignOpen && (
        <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
          <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Judul tugas, mis. Buatkan landing page…" />
          <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" rows={2} placeholder="Deskripsi tugas…" />
          <Btn
            cls="bg-sky-500 text-white"
            onClick={() => {
              if (!taskTitle.trim()) return;
              const r = assignTask(taskTitle.trim(), taskDesc.trim(), agent.id);
              if (r === 'ok') { setTaskTitle(''); setTaskDesc(''); setAssignOpen(false); }
            }}
          >
            {mode === 'live' ? 'Tugaskan (akan diblokir — Live belum terhubung)' : 'Tugaskan ke ' + agent.name}
          </Btn>
        </div>
      )}

      {chatOpen && (
        <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            {mode === 'live'
              ? '⛔ LIVE MODE — chat diblokir: "Integration Required". Hubungkan provider di Settings.'
              : '💬 Chat DEMO — balasan disimulasikan dari skrip, bukan output LLM.'}
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1.5">
            {chatLog.map((m, i) => (
              <div key={i} className={`text-xs rounded-lg px-2.5 py-1.5 max-w-[90%] ${m.from === 'me' ? 'bg-sky-500 text-white ml-auto' : 'bg-white border border-slate-200 text-slate-700'}`}>{m.text}</div>
            ))}
            {chatLog.length === 0 && <div className="text-xs text-slate-400">Belum ada pesan. Coba: "halo", "tugas apa yang kamu kerjakan?", "berapa biayamu?"</div>}
          </div>
          <div className="flex gap-1.5">
            <input
              value={chatInput}
              disabled={mode === 'live'}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm disabled:bg-slate-100"
              placeholder={mode === 'live' ? 'Chat dinonaktifkan (Live)' : 'Tulis pesan…'}
            />
            <button onClick={sendChat} disabled={mode === 'live'} className="px-3 rounded-lg bg-sky-500 text-white disabled:bg-slate-300"><Send size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tugas ───
function TasksView() {
  const tasks = useWorld((s) => s.tasks);
  const agents = useWorld((s) => s.agents);
  const assignTask = useWorld((s) => s.assignTask);
  const approveTask = useWorld((s) => s.approveTask);
  const cancelTask = useWorld((s) => s.cancelTask);
  const retryTask = useWorld((s) => s.retryTask);
  const failTask = useWorld((s) => s.failTask);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);

  const download = (t: TaskItem) => {
    if (!t.artifact) return;
    const blob = new Blob([t.artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = t.artifact.name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
        <div className="text-xs font-bold text-slate-700">Buat tugas baru</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Judul tugas…" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" rows={2} placeholder="Deskripsi (Manager Agent membagi ke agent yang relevan)…" />
        <Btn cls="bg-sky-500 text-white" onClick={() => { if (!title.trim()) return; assignTask(title.trim(), desc.trim()); setTitle(''); setDesc(''); }}>
          <span className="inline-flex items-center gap-1"><Plus size={13} /> Buat & tugaskan (DEMO)</span>
        </Btn>
        <div className="text-[11px] text-slate-500">Contoh: "Buatkan website company profile untuk perusahaan susu." — Manager membagi riset → desain → kode → QA.</div>
      </div>
      {tasks.map((t) => {
        const assignee = agents.find((a) => a.id === t.assigneeId);
        return (
          <div key={t.id} className="bg-white/80 rounded-xl p-3 border border-white space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm text-slate-800">{t.title}</div>
              <Badge cls={TASK_COLOR[t.status]}>{t.status.replace('_', ' ')}</Badge>
            </div>
            <div className="text-xs text-slate-500">{t.description}</div>
            <div className="text-xs text-slate-600">Assignee: <b>{assignee?.name ?? '—'}</b> · Prioritas: {t.priority} · Estimasi biaya: ${t.costUsd.toFixed(4)} (demo)</div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-sky-500 transition-all" style={{ width: `${t.progress}%` }} /></div>
            <div className="text-[11px] text-slate-500">{Math.round(t.progress)}% · {t.subtasks.filter((s) => s.done).length}/{t.subtasks.length} subtugas selesai</div>
            <ul className="text-xs space-y-0.5">
              {t.subtasks.map((st) => (
                <li key={st.id} className={st.done ? 'text-emerald-600 line-through' : 'text-slate-600'}>
                  {st.done ? '✓' : '○'} {st.title} <span className="text-slate-400">({agents.find((a) => a.id === st.agentId)?.name})</span>
                </li>
              ))}
            </ul>
            {t.error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 flex gap-1.5"><AlertTriangle size={14} className="shrink-0 mt-0.5" />{t.error}</div>}
            {t.artifact && (
              <div>
                <Btn onClick={() => setOpenArtifact(openArtifact === t.id ? null : t.id)} cls="bg-emerald-500 text-white">
                  <span className="inline-flex items-center gap-1"><Eye size={13} /> {openArtifact === t.id ? 'Tutup artefak' : 'Lihat artefak (DEMO)'}</span>
                </Btn>{' '}
                <Btn onClick={() => download(t)}><span className="inline-flex items-center gap-1"><Download size={13} /> Unduh .md</span></Btn>
                {openArtifact === t.id && <pre className="mt-2 text-[11px] bg-slate-900 text-slate-100 rounded-lg p-2.5 overflow-auto max-h-56 whitespace-pre-wrap">{t.artifact.content}</pre>}
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              {t.status === 'waiting_approval' && <Btn onClick={() => approveTask(t.id)} cls="bg-emerald-500 text-white"><span className="inline-flex items-center gap-1"><Check size={13} /> Approve</span></Btn>}
              {t.status === 'failed' && <Btn onClick={() => retryTask(t.id)} cls="bg-sky-500 text-white"><span className="inline-flex items-center gap-1"><RotateCcw size={13} /> Retry</span></Btn>}
              {(t.status === 'running' || t.status === 'queued' || t.status === 'waiting_approval') && (
                <>
                  <Btn onClick={() => cancelTask(t.id)}><span className="inline-flex items-center gap-1"><Ban size={13} /> Batalkan</span></Btn>
                  {t.status === 'running' && <Btn onClick={() => failTask(t.id)} title="Simulasikan kegagalan LLM (demo)"><span className="inline-flex items-center gap-1"><AlertTriangle size={13} /> Simulasikan gagal</span></Btn>}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Meeting ───
function MeetingsView() {
  const meetings = useWorld((s) => s.meetings);
  const agents = useWorld((s) => s.agents);
  const startMeeting = useWorld((s) => s.startMeeting);
  const endMeeting = useWorld((s) => s.endMeeting);
  const [topic, setTopic] = useState('Standup harian — progres website company profile');
  const [picked, setPicked] = useState<string[]>(['ag-bimo', 'ag-kirana', 'ag-lestari', 'ag-fajar']);

  return (
    <div className="space-y-3">
      <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
        <div className="text-xs font-bold text-slate-700">Buat rapat</div>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Topik rapat…" />
        <div className="flex gap-1 flex-wrap">
          {agents.map((a) => (
            <button key={a.id} onClick={() => setPicked((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]))}
              className={`px-2 py-1 rounded-full text-[11px] font-medium ${picked.includes(a.id) ? 'bg-purple-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {a.name}
            </button>
          ))}
        </div>
        <Btn cls="bg-purple-500 text-white" onClick={() => { if (topic.trim() && picked.length) startMeeting(topic.trim(), picked); }}>
          <span className="inline-flex items-center gap-1"><Video size={13} /> Mulai rapat ({picked.length} agent)</span>
        </Btn>
        <div className="text-[11px] text-slate-500">Agent berjalan ke Ruang Meeting L1, duduk, dan pembicara bergiliran. Transkrip DEMO dari skrip.</div>
      </div>
      {meetings.map((m) => (
        <div key={m.id} className="bg-white/80 rounded-xl p-3 border border-white space-y-2">
          <div className="flex justify-between gap-2">
            <div className="font-semibold text-sm text-slate-800">{m.topic}</div>
            <Badge cls={m.status === 'live' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}>{m.status === 'live' ? '● LIVE (demo)' : 'Selesai'}</Badge>
          </div>
          <div className="text-xs text-slate-500">{m.room} · {m.agentIds.map((id) => agents.find((a) => a.id === id)?.name).join(', ')}</div>
          <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-50 rounded-lg p-2">
            {m.transcript.map((line, i) => (
              <div key={i} className="text-xs"><b>{line.speaker}:</b> {line.text}</div>
            ))}
          </div>
          {m.minutes && <div className="text-xs text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2">{m.minutes}</div>}
          {m.status === 'live' && <Btn onClick={() => endMeeting(m.id)} cls="bg-slate-800 text-white">Akhiri rapat & buat notulen</Btn>}
        </div>
      ))}
      {meetings.length === 0 && <div className="text-xs text-slate-400">Belum ada rapat. Buat rapat pertama di atas.</div>}
    </div>
  );
}

// ─── Panel utama ───
const TITLES: Record<string, string> = {
  world: 'Dunia', agents: 'Agents', tasks: 'Tasks', meetings: 'Meetings',
  buildings: 'Buildings', analytics: 'Analytics', activity: 'Activity', settings: 'Settings',
};

export default function RightPanel() {
  const nav = useWorld((s) => s.nav);
  const panelOpen = useWorld((s) => s.panelOpen);
  const setPanelOpen = useWorld((s) => s.setPanelOpen);
  const agents = useWorld((s) => s.agents);
  const selectedAgentId = useWorld((s) => s.selectedAgentId);
  const selectAgent = useWorld((s) => s.selectAgent);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;
  const tasks = useWorld((s) => s.tasks);
  const logs = useWorld((s) => s.logs);
  const meetings = useWorld((s) => s.meetings);
  const clockMin = useWorld((s) => s.clockMin);
  const day = useWorld((s) => s.day);
  const mode = useWorld((s) => s.mode);
  const setMode = useWorld((s) => s.setMode);
  const quality = useWorld((s) => s.quality);
  const setQuality = useWorld((s) => s.setQuality);
  const setCamera = useWorld((s) => s.setCamera);
  const setFloor = useWorld((s) => s.setFloor);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const assignTask = useWorld((s) => s.assignTask);
  const startMeeting = useWorld((s) => s.startMeeting);
  const createAgent = useWorld((s) => s.createAgent);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Programmer Agent');
  const [newTeam, setNewTeam] = useState('Engineering');
  const [newModel, setNewModel] = useState('gpt-5-mini');
  const [providerHelp, setProviderHelp] = useState<string | null>(null);

  if (!panelOpen) return null;

  const done = tasks.filter((t) => t.status === 'done').length;
  const failed = tasks.filter((t) => t.status === 'failed').length;
  const running = tasks.filter((t) => t.status === 'running').length;
  const pendingApproval = tasks.filter((t) => t.status === 'waiting_approval').length;

  return (
    <aside className="fixed z-40 inset-x-0 bottom-0 max-h-[62vh] md:static md:z-20 md:max-h-none md:w-[360px] md:shrink-0 bg-white/85 backdrop-blur-xl border-t md:border-t-0 md:border-l border-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 shrink-0">
        <div className="font-bold text-slate-800">{nav === 'agents' && selectedAgent ? `Agent — ${selectedAgent.name}` : TITLES[nav]}</div>
        <button onClick={() => setPanelOpen(false)} className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-slate-500"><X size={16} /></button>
      </div>
      <div className="overflow-y-auto p-3 space-y-3">
        {nav === 'world' && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-sky-500 to-orange-400 text-white rounded-2xl p-4">
              <div className="text-lg font-bold">Kampus AI Agent</div>
              <div className="text-xs opacity-90">Hari {day} · {fmtClock(clockMin)} virtual · Cerah 28°C (simulasi cuaca)</div>
              <div className="text-xs opacity-90 mt-1">{agents.length} agent · {running} tugas berjalan · {done} selesai · {failed} gagal</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
              <b>Mode DEMO aktif.</b> Orkestrasi tugas disimulasikan secara deterministik dan dilabeli demo. Tidak ada panggilan LLM nyata sampai provider terhubung (Settings → Integration Required).
            </div>
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Aksi cepat</div>
              <Btn cls="bg-sky-500 text-white w-full" onClick={() => assignTask('Buatkan website company profile untuk perusahaan susu', 'Riset pasar, desain UI/UX, implementasi React, QA, lalu serahkan.')}>Contoh: website company profile susu</Btn>
              <Btn cls="bg-purple-500 text-white w-full" onClick={() => startMeeting('Standup harian — progres website company profile', ['ag-bimo', 'ag-kirana', 'ag-lestari', 'ag-fajar'])}>Mulai rapat standup</Btn>
              <Btn cls="bg-white border border-slate-200 w-full" onClick={() => { setCamera('cinematic'); }}>Tur sinematik kampus</Btn>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1.5">Gedung & area (klik untuk fokus)</div>
              <div className="space-y-1.5">
                {BUILDINGS.map((b) => (
                  <button key={b.id} onClick={() => { selectBuilding(b.id); setCamera('building'); }} className="w-full text-left bg-white/80 hover:bg-white border border-white rounded-xl px-3 py-2">
                    <div className="text-sm font-semibold text-slate-800">{b.name}</div>
                    <div className="text-[11px] text-slate-500">{b.kind}{b.floors ? ` · ${b.floors} lantai` : ''} · {b.rooms.slice(0, 3).join(', ')}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {nav === 'agents' && (
          <div className="space-y-3">
            {selectedAgent ? (
              <>
                <button onClick={() => selectAgent(null)} className="text-xs text-sky-600 font-semibold">← Semua agent</button>
                <AgentDetail agent={selectedAgent} />
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  {agents.map((a) => (
                    <button key={a.id} onClick={() => selectAgent(a.id)} className="w-full flex items-center gap-2.5 bg-white/80 hover:bg-white border border-white rounded-xl px-3 py-2 text-left">
                      <span className="w-9 h-9 rounded-xl text-white flex items-center justify-center text-xs font-bold shrink-0" style={{ background: a.color }}>{a.name.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-800 truncate">{a.name} · {a.role}</span>
                        <span className="block text-[11px] text-slate-500 truncate">{a.team} · {a.destLabel}</span>
                      </span>
                      <Badge cls={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                    </button>
                  ))}
                </div>
                <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
                  <div className="text-xs font-bold text-slate-700">Buat agent baru (DEMO)</div>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Nama agent, mis. Sinta" />
                  <input value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm" placeholder="Jabatan" />
                  <div className="flex gap-1.5">
                    <select value={newTeam} onChange={(e) => setNewTeam(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white">
                      {['Engineering', 'Design', 'Content', 'Research', 'Executive', 'Marketing'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <select value={newModel} onChange={(e) => setNewModel(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white">
                      {['gpt-5-mini', 'gpt-5', 'claude-sonnet', 'gemini-2.5-pro', 'gemini-2.5-flash'].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <Btn cls="bg-sky-500 text-white w-full" onClick={() => { if (!newName.trim()) return; createAgent({ name: newName.trim(), role: newRole.trim() || 'Agent', team: newTeam, model: newModel }); setNewName(''); }}>
                    <span className="inline-flex items-center gap-1"><Plus size={13} /> Buat agent</span>
                  </Btn>
                  <div className="text-[11px] text-slate-500">Agent baru mendapat meja kosong otomatis dan langsung muncul di dunia 3D.</div>
                </div>
              </>
            )}
          </div>
        )}

        {nav === 'tasks' && <TasksView />}
        {nav === 'meetings' && <MeetingsView />}

        {nav === 'buildings' && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((f) => (
                <Btn key={f} onClick={() => setFloor(f)} cls={f === 0 ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200'}>{f === 0 ? 'Semua lantai' : `Lantai ${f}`}</Btn>
              ))}
            </div>
            {BUILDINGS.map((b) => (
              <button key={b.id} onClick={() => { selectBuilding(b.id); setCamera('building'); }} className="w-full text-left bg-white/80 hover:bg-white border border-white rounded-xl px-3 py-2.5">
                <div className="text-sm font-semibold text-slate-800">{b.name}</div>
                <div className="text-[11px] text-slate-500">{b.description}</div>
                <div className="text-[11px] text-slate-500 mt-1">Ruangan: {b.rooms.join(' · ')}</div>
              </button>
            ))}
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">World Builder (tambah gedung/ruangan/furnitur) adalah Fase 6 — backlog, belum dibangun.</div>
          </div>
        )}

        {nav === 'analytics' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {[['Agent', String(agents.length)], ['Tugas selesai', String(done)], ['Tugas berjalan', String(running)], ['Tugas gagal', String(failed)], ['Approval pending', String(pendingApproval)], ['Rapat', String(meetings.length)]].map(([l, v]) => (
                <div key={l} className="bg-white/80 border border-white rounded-xl p-3">
                  <div className="text-xl font-bold text-slate-800">{v}</div>
                  <div className="text-[11px] text-slate-500">{l}</div>
                </div>
              ))}
            </div>
            <div className="bg-white/80 border border-white rounded-xl p-3">
              <div className="text-xs font-bold text-slate-700 mb-2">Kinerja per agent (tugas selesai)</div>
              {agents.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs py-1">
                  <span className="w-16 truncate font-medium">{a.name}</span>
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, a.tasksDone * 20)}%` }} /></div>
                  <span className="w-6 text-right">{a.tasksDone}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-slate-500 bg-white/70 border border-white rounded-lg p-2">Data dihitung langsung dari state demo (bukan database). Token & biaya API nyata baru tercatat setelah provider terhubung di Fase 3.</div>
          </div>
        )}

        {nav === 'activity' && (
          <div className="space-y-1.5">
            {logs.map((l) => (
              <div key={l.id} className="text-xs bg-white/80 border border-white rounded-lg px-3 py-2">
                <span className="text-slate-400 font-mono">{fmtClock(l.timeMin)}</span>{' '}
                <span className={`font-semibold ${l.kind === 'error' ? 'text-red-600' : l.kind === 'task' ? 'text-sky-600' : 'text-slate-600'}`}>[{l.kind}]</span>{' '}
                <span className="text-slate-700">{l.message}</span>
              </div>
            ))}
          </div>
        )}

        {nav === 'settings' && (
          <div className="space-y-3">
            <div className="bg-white/80 border border-white rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700">Mode operasi</div>
              <div className="flex gap-1.5">
                <Btn onClick={() => setMode('demo')} cls={mode === 'demo' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200'}>DEMO (simulasi)</Btn>
                <Btn onClick={() => setMode('live')} cls={mode === 'live' ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200'}>LIVE</Btn>
              </div>
              <div className="text-[11px] text-slate-500">LIVE memblokir chat, tugas, meeting, dan pembuatan agent sampai provider terhubung.</div>
            </div>
            <div className="bg-white/80 border border-white rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700">Kualitas render</div>
              <div className="flex gap-1.5">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <Btn key={q} onClick={() => setQuality(q)} cls={quality === q ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200'}>{q === 'low' ? 'Low' : q === 'medium' ? 'Medium' : 'High'}</Btn>
                ))}
              </div>
              <div className="text-[11px] text-slate-500">Low = pixel ratio 1, Medium = 1.75, High = 2. Target laptop menengah: Medium.</div>
            </div>
            <div className="bg-white/80 border border-white rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700">Koneksi provider AI — Integration Required</div>
              {['OpenAI', 'Gemini', 'Anthropic'].map((p) => (
                <div key={p} className="border border-slate-200 rounded-lg p-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">{p}</span>
                    <Badge cls="bg-red-100 text-red-700">Belum terhubung</Badge>
                  </div>
                  <button onClick={() => setProviderHelp(providerHelp === p ? null : p)} className="text-xs text-sky-600 font-semibold mt-1">Lihat cara menghubungkan →</button>
                  {providerHelp === p && (
                    <div className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                      1) Buat API key di dashboard {p}. 2) Isi <code>PROVIDER_API_KEY</code> di <code>server/.env</code> (backend saja — jangan pernah di browser). 3) Jalankan <code>node server/index.mjs</code> lalu set <code>VITE_ORCHESTRATOR_URL</code>. 4) Ubah mode ke LIVE. Secret tidak pernah disimpan di localStorage.
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="bg-white/80 border border-white rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-700">Status jujur Fase 1</div>
              <div>✅ Dunia 3D, kamera, 10 avatar, jadwal leisure, task engine demo, meeting demo.</div>
              <div>⏳ Belum: Supabase Auth/DB live, eksekusi LLM nyata, Build Mode, audio, mobile polish penuh.</div>
              <div>📄 Detail: lihat <code>TEST-REPORT.md</code> di repo.</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
