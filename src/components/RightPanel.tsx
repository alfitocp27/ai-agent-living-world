// ─── Panel kanan kontekstual (Fase B) — kartu mengambang, header standar ───
// Semua tombol berfungsi. Fitur yang belum ada (Live LLM, Build Mode) diberi
// status jujur "Integration Required" / "Backlog", bukan tombol palsu.

import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity, AlertTriangle, ArrowLeft, Ban, BarChart3, Building2,
  CalendarClock, Check, ChevronDown, Download, Eye, FileText, Globe,
  ListChecks, MessageSquare, NotebookPen, Pause, Pencil, Play, Plus,
  RotateCcw, Search, Send, Settings, StickyNote, Users, Video, X,
} from 'lucide-react';
import { fmtClock, fmtWIB, useWorld, wibParts } from '../store';
import { BUILDINGS } from '../data/seed';
import type { AgentProfile, HairStyle, Meeting, NavKey, Report, TaskItem } from '../types';

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
const TASK_LABEL: Record<string, string> = {
  queued: 'Antre', running: 'Berjalan', waiting_approval: 'Menunggu approval',
  done: 'Selesai', failed: 'Gagal', cancelled: 'Dibatalkan',
};

function Badge({ children, cls }: { children: ReactNode; cls: string }) {
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>{children}</span>;
}

function Btn({ children, onClick, cls = '', title, disabled }: { children: ReactNode; onClick: () => void; cls?: string; title?: string; disabled?: boolean }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${cls || 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
      {children}
    </button>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm ${className}`} />;
}

function TextArea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm ${className}`} />;
}

/** Header panel terstandarisasi: ikon + judul + subjudul + tutup + aksi. */
function PanelHeader({ icon: Icon, title, subtitle, action, onClose }: {
  icon: typeof Globe; title: string; subtitle: string;
  action?: ReactNode; onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-3 border-b border-slate-200/70 shrink-0">
      <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-800 text-sm leading-tight">{title}</div>
        <div className="text-[11px] text-slate-500 leading-tight mt-0.5">{subtitle}</div>
      </div>
      {action}
      <button onClick={onClose} title="Tutup panel" className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <X size={16} />
      </button>
    </div>
  );
}

const fmtDay = (ms: number) => {
  const p = wibParts(ms);
  return `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')} ${fmtWIB(ms)}`;
};

/** Label status agent yang BENAR + judul tugas aktif bila ada. */
function AgentStatusLine({ agent }: { agent: AgentProfile }) {
  const tasks = useWorld((s) => s.tasks);
  if (agent.paused) return <span className="text-[11px] text-slate-500">Jeda</span>;
  const current = tasks.find((t) => t.id === agent.currentTaskId);
  if (current) return <span className="text-[11px] text-slate-500 truncate">{STATUS_LABEL[agent.status]} — {current.title}</span>;
  const assigned = tasks.find((t) => t.assigneeId === agent.id && (t.status === 'running' || t.status === 'queued'));
  if (assigned) return <span className="text-[11px] text-slate-500 truncate">Ditugaskan — {assigned.title}</span>;
  return <span className="text-[11px] text-slate-500 truncate">{STATUS_LABEL[agent.status]} · {agent.destLabel}</span>;
}

// ─── Beranda ───
function WorldView({ onPrefillTask, onPrefillMeeting }: { onPrefillTask: (t: string) => void; onPrefillMeeting: (t: string) => void }) {
  const agents = useWorld((s) => s.agents);
  const tasks = useWorld((s) => s.tasks);
  const wibNow = useWorld((s) => s.wibNow);
  const day = useWorld((s) => s.day);
  const mode = useWorld((s) => s.mode);
  const assignTask = useWorld((s) => s.assignTask);
  const setCamera = useWorld((s) => s.setCamera);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const setNav = useWorld((s) => s.setNav);

  const [cmd, setCmd] = useState('');
  const managers = agents.filter((a) => agents.some((x) => x.managerId === a.id));
  const [cmdAgentId, setCmdAgentId] = useState(managers.find((a) => a.id === 'ag-bimo')?.id ?? managers[0]?.id ?? agents[0]?.id ?? '');
  const [cmdMsg, setCmdMsg] = useState<string | null>(null);

  const running = tasks.filter((t) => t.status === 'running').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const failed = tasks.filter((t) => t.status === 'failed').length;

  const sendCommand = () => {
    if (!cmd.trim()) return;
    const r = assignTask(cmd.trim(), cmd.trim(), cmdAgentId || undefined, { source: 'quick' });
    if (r === 'ok') {
      const target = agents.find((a) => a.id === cmdAgentId);
      setCmdMsg(`Perintah dikirim ke ${target?.name ?? 'manager'} (orkestrasi otomatis bila manager). Pantau di panel Tugas.`);
      setCmd('');
    } else {
      setCmdMsg('⛔ LIVE MODE: perintah diblokir — "Integration Required". Belum ada provider LLM terhubung.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-sky-500 to-orange-400 text-white rounded-2xl p-4">
        <div className="text-lg font-bold">Selamat datang di Kampus AI Agent</div>
        <div className="text-xs opacity-90">Tgl {day} · {fmtWIB(wibNow)} · {mode === 'demo' ? 'Mode DEMO — Muse (muse.ai)' : 'Mode LIVE — Muse AI'}</div>
        <div className="text-xs opacity-90 mt-1">{agents.length} agent · {running} tugas berjalan · {done} selesai · {failed} gagal</div>
      </div>

      <div className="bg-white/80 rounded-xl p-3 border border-white space-y-2">
        <div className="text-xs font-bold text-slate-700">Perintah cepat</div>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendCommand(); }}
          className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm"
          placeholder="Perintah, mis. Riset resep bakpao untuk usaha rumahan"
        />
        <div className="flex gap-1.5">
          <select value={cmdAgentId} onChange={(e) => setCmdAgentId(e.target.value)} className="flex-1 min-w-0 px-2 py-2 rounded-lg border border-slate-200 text-sm bg-white">
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.role}{managers.some((m) => m.id === a.id) ? ' (orkestrasi otomatis)' : ''}
              </option>
            ))}
          </select>
          <Btn cls="bg-sky-500 text-white shrink-0" onClick={sendCommand}>
            <span className="inline-flex items-center gap-1"><Send size={13} /> Kirim</span>
          </Btn>
        </div>
        {cmdMsg && <div className="text-[11px] text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2">{cmdMsg}</div>}
        <div className="text-[11px] text-slate-500">Default: Manager — perintah ke manager didelegasikan otomatis ke bawahan yang paling cocok.</div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-700">Aksi cepat</div>
        <div className="grid grid-cols-2 gap-1.5">
          <Btn cls="bg-sky-500 text-white w-full" onClick={() => { onPrefillTask('Buatkan website company profile untuk perusahaan susu'); setNav('tasks'); }}>
            <span className="inline-flex items-center gap-1"><Plus size={13} /> Buat tugas</span>
          </Btn>
          <Btn cls="bg-purple-500 text-white w-full" onClick={() => { onPrefillMeeting('Standup harian — progres website company profile'); setNav('meetings'); }}>
            <span className="inline-flex items-center gap-1"><Video size={13} /> Mulai rapat</span>
          </Btn>
          <Btn cls="bg-white border border-slate-200 w-full" onClick={() => setCamera('cinematic')}>Tur sinematik kampus</Btn>
          <Btn cls="bg-white border border-slate-200 w-full" onClick={() => setNav('results')}>Lihat Hasil Kerja</Btn>
        </div>
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
  );
}

// ─── Template peran untuk form buat agent ───
const ROLE_TEMPLATES: { role: string; team: string; skills: string[]; color: string; desc: string }[] = [
  { role: 'Manager Agent', team: 'Executive', skills: ['planning', 'coordination', 'reporting'], color: '#0f766e', desc: 'Mengelola & mendelegasikan tugas ke bawahan.' },
  { role: 'Programmer Agent', team: 'Engineering', skills: ['typescript', 'react', 'node'], color: '#1d4ed8', desc: 'Menulis & menguji kode aplikasi.' },
  { role: 'UI/UX Designer Agent', team: 'Design', skills: ['figma', 'design-system', 'prototyping'], color: '#be185d', desc: 'Merancang antarmuka & prototipe.' },
  { role: 'Copywriter Agent', team: 'Content', skills: ['copywriting', 'seo', 'storytelling'], color: '#7c3aed', desc: 'Menulis copy & konten.' },
  { role: 'Research Agent', team: 'Research', skills: ['research', 'summarizing', 'citation'], color: '#047857', desc: 'Riset, ringkasan & sitasi.' },
  { role: 'Data Analyst Agent', team: 'Research', skills: ['sql', 'statistics', 'dashboard'], color: '#0e7490', desc: 'Analisis data & dashboard.' },
  { role: 'Quality Assurance Agent', team: 'Engineering', skills: ['testing', 'qa', 'automation'], color: '#b91c1c', desc: 'Pengujian & penjaminan mutu.' },
];

const MALE_HAIR: { value: HairStyle; label: string }[] = [
  { value: 'short', label: 'Pendek' }, { value: 'buzz', label: 'Cepak' },
  { value: 'undercut', label: 'Undercut' }, { value: 'curly', label: 'Keriting' },
  { value: 'bald', label: 'Botak' }, { value: 'cap', label: 'Topi' },
];
const FEMALE_HAIR: { value: HairStyle; label: string }[] = [
  { value: 'long', label: 'Panjang' }, { value: 'shoulder', label: 'Sebahu' },
  { value: 'bangs', label: 'Poni' }, { value: 'bun', label: 'Sanggul' },
  { value: 'long-curly', label: 'Panjang keriting' }, { value: 'curly', label: 'Keriting' },
];

const DESK_OPTIONS = ['Workspace L2', 'Programmer L2', 'Desain L2', 'Ruang Manager L2'];

function CreateAgentForm({ onDone }: { onDone: () => void }) {
  const createAgent = useWorld((s) => s.createAgent);
  const mode = useWorld((s) => s.mode);
  const [template, setTemplate] = useState(ROLE_TEMPLATES[1]);
  const [name, setName] = useState('');
  const [team, setTeam] = useState(ROLE_TEMPLATES[1].team);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [hairStyle, setHairStyle] = useState<HairStyle>('long');
  const [deskPref, setDeskPref] = useState(DESK_OPTIONS[1]);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const hairOptions = gender === 'male' ? MALE_HAIR : FEMALE_HAIR;

  const pickTemplate = (t: (typeof ROLE_TEMPLATES)[number]) => {
    setTemplate(t);
    setTeam(t.team);
  };

  const pickGender = (g: 'male' | 'female') => {
    setGender(g);
    setHairStyle(g === 'male' ? 'short' : 'long');
  };

  const save = () => {
    if (!name.trim()) return;
    createAgent({ name: name.trim(), role: template.role, team, model: 'Muse (muse.ai)', gender, hairStyle });
    onDone();
  };

  return (
    <div className="bg-white/70 rounded-xl border border-white overflow-hidden">
      <div className="p-3 space-y-3">
        {/* 1 Pilih peran */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">1</span>
            <span className="text-xs font-bold text-slate-700">Pilih peran</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {ROLE_TEMPLATES.map((t) => (
              <button
                key={t.role}
                onClick={() => pickTemplate(t)}
                className={`text-left rounded-xl p-2.5 border-2 transition ${template.role === t.role ? 'border-sky-500 bg-white shadow-sm' : 'border-slate-200 bg-white/60 hover:border-slate-300'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-xs font-bold text-slate-800 leading-tight">{t.role.replace(' Agent', '')}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 leading-snug">{t.desc}</div>
                <div className="text-[10px] text-slate-400 mt-1">{t.team} · {t.skills.join(', ')}</div>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5">Keahlian pada kartu adalah referensi template — sistem menyimpan keahlian mengikuti peran yang dipilih.</div>
        </div>

        {/* 2 Identitas */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">2</span>
            <span className="text-xs font-bold text-slate-700">Identitas</span>
          </div>
          <div className="space-y-1.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama agent, mis. Sinta" />
            <select value={team} onChange={(e) => setTeam(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm bg-white">
              {['Engineering', 'Design', 'Content', 'Research', 'Executive', 'Marketing'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <div className="text-[11px] text-slate-500">Peran: <b>{template.role}</b> · Tim: <b>{team}</b></div>
          </div>
        </div>

        {/* 3 Cara kerja */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">3</span>
            <span className="text-xs font-bold text-slate-700">Cara kerja</span>
          </div>
          <div className="text-xs text-slate-600 bg-white/80 border border-white rounded-lg p-2.5">
            Model / provider: <b>Muse (muse.ai)</b> — provider aktif untuk semua agent.
          </div>
        </div>

        {/* Penampilan */}
        <div>
          <div className="text-xs font-bold text-slate-700 mb-1.5">Penampilan</div>
          <div className="flex gap-1.5 mb-1.5">
            {(['male', 'female'] as const).map((g) => (
              <button key={g} onClick={() => pickGender(g)} className={`flex-1 px-2.5 py-2 rounded-lg text-xs font-semibold border ${gender === g ? 'bg-sky-500 text-white border-sky-500' : 'bg-white border-slate-200 text-slate-600'}`}>
                {g === 'male' ? 'Laki-laki' : 'Perempuan'}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 mb-1">Gaya rambut ({gender === 'male' ? 'laki-laki' : 'perempuan'}):</div>
          <div className="flex gap-1 flex-wrap">
            {hairOptions.map((h) => (
              <button key={h.value} onClick={() => setHairStyle(h.value)} className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium border ${hairStyle === h.value ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detail lanjutan (collapsible) */}
        <div>
          <button onClick={() => setAdvancedOpen(!advancedOpen)} className="flex items-center gap-1 text-xs font-bold text-slate-700">
            Detail lanjutan <ChevronDown size={14} className={`transition ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>
          {advancedOpen && (
            <div className="mt-1.5 space-y-1.5">
              <div className="text-[11px] text-slate-500">Meja — preferensi area lantai 2 HQ:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {DESK_OPTIONS.map((d) => (
                  <button key={d} onClick={() => setDeskPref(d)} className={`px-2.5 py-2 rounded-lg text-xs font-medium border text-left ${deskPref === d ? 'bg-sky-50 border-sky-400 text-sky-700' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {d}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500">Meja akhir ditetapkan otomatis ke meja kosong berikutnya (preferensi "{deskPref}" dicatat sebagai area yang diinginkan). Agent baru langsung muncul di dunia 3D.</div>
            </div>
          )}
        </div>
      </div>
      {/* sticky action bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2.5 flex gap-1.5">
        <button
          onClick={save}
          disabled={!name.trim() || mode === 'live'}
          className="flex-1 px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:bg-slate-300"
        >
          {mode === 'live' ? 'Simpan (diblokir — Live belum terhubung)' : 'Simpan agent'}
        </button>
        <button onClick={onDone} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold text-slate-700">Batal</button>
      </div>
    </div>
  );
}

// ─── Detail agent ───
function AgentDetail({ agent, onOpenChat }: { agent: AgentProfile; onOpenChat: (agentId: string, tab: 'chat' | 'assign') => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(agent.name);
  const [editRole, setEditRole] = useState(agent.role);
  const mode = useWorld((s) => s.mode);
  const followAgent = useWorld((s) => s.followAgent);
  const pauseAgent = useWorld((s) => s.pauseAgent);
  const resumeAgent = useWorld((s) => s.resumeAgent);
  const updateAgent = useWorld((s) => s.updateAgent);
  const setNav = useWorld((s) => s.setNav);
  const agents = useWorld((s) => s.agents);
  const managerStats = useWorld((s) => s.managerStats);
  const agentPerf = useWorld((s) => s.agentPerf);
  const currentTask = useWorld((s) => s.tasks.find((t) => t.id === agent.currentTaskId));
  const isManager = agents.some((a) => a.managerId === agent.id);
  const stats = isManager ? managerStats(agent.id) : null;
  const perf = agentPerf(agent.id);

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
            <Badge cls="bg-slate-100 text-slate-600">{agent.gender === 'male' ? 'Laki-laki' : 'Perempuan'} · {agent.hairStyle}</Badge>
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

      {/* statistik manager + grafik kinerja */}
      <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
        <div className="text-xs font-bold text-slate-700">Grafik kinerja agent</div>
        {stats && (
          <div className="text-xs text-slate-600">Dikelola <b>{stats.tasksManaged}</b> · Laporan <b>{stats.reportsWritten}</b> · Rapat <b>{stats.meetingsAttended}</b></div>
        )}
        <div className="flex items-center gap-2 text-xs">
          <span className="w-14 text-slate-500">Sukses</span>
          <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${perf.successPct}%` }} />
          </div>
          <span className="font-bold text-slate-700">{perf.successPct}%</span>
          <span className="text-slate-500">{perf.done} selesai · {perf.failed} gagal</span>
        </div>
        <div className="flex items-end gap-1 h-10 pt-1">
          {perf.last7Days.map((d) => {
            const max = Math.max(1, ...perf.last7Days.map((x) => x.done + x.failed));
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: ${d.done} selesai, ${d.failed} gagal`}>
                <div className="w-full flex flex-col justify-end h-8">
                  <div className="w-full bg-emerald-400 rounded-t-sm" style={{ height: `${(d.done / max) * 100}%`, minHeight: d.done > 0 ? 3 : 0 }} />
                  <div className="w-full bg-red-400 rounded-b-sm" style={{ height: `${(d.failed / max) * 100}%`, minHeight: d.failed > 0 ? 3 : 0 }} />
                </div>
                <span className="text-[9px] text-slate-400">{d.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-slate-400">7 hari terakhir (WIB) — hijau selesai, merah gagal. Dihitung dari tugas nyata.</div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <Btn onClick={() => onOpenChat(agent.id, 'chat')} cls="bg-sky-500 text-white"><span className="inline-flex items-center gap-1"><MessageSquare size={13} /> Chat</span></Btn>
        <Btn onClick={() => onOpenChat(agent.id, 'assign')}><span className="inline-flex items-center gap-1"><Plus size={13} /> Tugaskan</span></Btn>
        <Btn onClick={() => followAgent(agent.id)}><span className="inline-flex items-center gap-1"><Eye size={13} /> Follow</span></Btn>
        <Btn onClick={() => setNav('tasks')}>Lihat Tugas</Btn>
        {agent.paused
          ? <Btn onClick={() => resumeAgent(agent.id)} cls="bg-emerald-500 text-white"><span className="inline-flex items-center gap-1"><Play size={13} /> Aktifkan</span></Btn>
          : <Btn onClick={() => pauseAgent(agent.id)} cls="bg-amber-500 text-white"><span className="inline-flex items-center gap-1"><Pause size={13} /> Jeda</span></Btn>}
        <Btn onClick={() => { setEditOpen(!editOpen); setEditName(agent.name); setEditRole(agent.role); }}><span className="inline-flex items-center gap-1"><Pencil size={13} /> Edit</span></Btn>
      </div>

      {editOpen && (
        <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nama agent" />
          <Input value={editRole} onChange={(e) => setEditRole(e.target.value)} placeholder="Jabatan" />
          <Btn onClick={() => { updateAgent(agent.id, { name: editName.trim() || agent.name, role: editRole.trim() || agent.role }); setEditOpen(false); }} cls="bg-sky-500 text-white">Simpan perubahan</Btn>
          <div className="text-[11px] text-slate-500">Catatan: perubahan nama/jabatan saja yang didukung di sini.</div>
        </div>
      )}
      {mode === 'live' && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          ⛔ LIVE MODE — chat, tugas, dan pembuatan agent diblokir: "Integration Required".
        </div>
      )}
    </div>
  );
}

// ─── Daftar agent ───
function AgentsView({ onOpenChat, createOpen, setCreateOpen }: { onOpenChat: (agentId: string, tab: 'chat' | 'assign') => void; createOpen: boolean; setCreateOpen: (v: boolean) => void }) {
  const agents = useWorld((s) => s.agents);
  const selectedAgentId = useWorld((s) => s.selectedAgentId);
  const selectAgent = useWorld((s) => s.selectAgent);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;

  if (selectedAgent) {
    return (
      <div className="space-y-3">
        <button onClick={() => selectAgent(null)} className="text-xs text-sky-600 font-semibold inline-flex items-center gap-1"><ArrowLeft size={13} /> Semua agent</button>
        <AgentDetail agent={selectedAgent} onOpenChat={onOpenChat} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {createOpen && <CreateAgentForm onDone={() => setCreateOpen(false)} />}
      <div className="space-y-1.5">
        {agents.map((a) => (
          <div key={a.id} className="w-full flex items-center gap-2.5 bg-white/80 hover:bg-white border border-white rounded-xl px-3 py-2">
            <button onClick={() => selectAgent(a.id)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left">
              <span className="w-9 h-9 rounded-xl text-white flex items-center justify-center text-xs font-bold shrink-0" style={{ background: a.color }}>{a.name.slice(0, 2).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 truncate">{a.name} · {a.role}</span>
                <AgentStatusLine agent={a} />
              </span>
              <Badge cls={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
            </button>
            <button onClick={() => onOpenChat(a.id, 'chat')} title={`Chat dengan ${a.name}`} className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <MessageSquare size={15} />
            </button>
          </div>
        ))}
      </div>
      {!createOpen && (
        <Btn cls="bg-sky-500 text-white w-full" onClick={() => setCreateOpen(true)}>
          <span className="inline-flex items-center gap-1"><Plus size={13} /> Buat agent baru</span>
        </Btn>
      )}
    </div>
  );
}

// ─── Tugas ───
function TasksView({ prefillTitle, onPrefillUsed, createOpen, setCreateOpen }: { prefillTitle: string; onPrefillUsed: () => void; createOpen: boolean; setCreateOpen: (v: boolean) => void }) {
  const tasks = useWorld((s) => s.tasks);
  const agents = useWorld((s) => s.agents);
  const assignTask = useWorld((s) => s.assignTask);
  const approveTask = useWorld((s) => s.approveTask);
  const cancelTask = useWorld((s) => s.cancelTask);
  const retryTask = useWorld((s) => s.retryTask);
  const failTask = useWorld((s) => s.failTask);
  const requestRevision = useWorld((s) => s.requestRevision);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [openArtifact, setOpenArtifact] = useState<string | null>(null);
  const [revFor, setRevFor] = useState<string | null>(null);
  const [revText, setRevText] = useState('');
  const [revMsg, setRevMsg] = useState<string | null>(null);

  useEffect(() => {
    if (prefillTitle) {
      setTitle(prefillTitle);
      setCreateOpen(true);
      onPrefillUsed();
    }
  }, [prefillTitle, onPrefillUsed, setCreateOpen]);

  const download = (t: TaskItem) => {
    if (!t.artifact) return;
    const blob = new Blob([t.artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = t.artifact.name; a.click();
    URL.revokeObjectURL(url);
  };

  const reviewLabel = (t: TaskItem) => {
    if (t.reviewStatus === 'approved') return 'Review: DISETUJUI';
    if (t.reviewStatus === 'needs_revision') return `Review: REVISI ke-${t.revisionCount ?? 1}`;
    return 'Review: Menunggu review';
  };

  return (
    <div className="space-y-3">
      {createOpen && (
        <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
          <div className="text-xs font-bold text-slate-700">Buat tugas baru</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul tugas…" />
          <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Deskripsi (Manager membagi ke agent yang relevan)…" />
          <Btn cls="bg-sky-500 text-white" onClick={() => { if (!title.trim()) return; assignTask(title.trim(), desc.trim()); setTitle(''); setDesc(''); }}>
            <span className="inline-flex items-center gap-1"><Plus size={13} /> Buat & tugaskan (DEMO)</span>
          </Btn>
          <div className="text-[11px] text-slate-500">Tanpa memilih agent, tugas masuk ke Manager (Bimo) dan didelegasikan otomatis. Contoh: "Buatkan website company profile untuk perusahaan susu."</div>
        </div>
      )}
      {tasks.map((t) => {
        const assignee = agents.find((a) => a.id === t.assigneeId);
        const delegator = agents.find((a) => a.id === t.delegatedByAgentId);
        return (
          <div key={t.id} className="bg-white/80 rounded-xl p-3 border border-white space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm text-slate-800">{t.title}</div>
              <Badge cls={TASK_COLOR[t.status]}>{TASK_LABEL[t.status]}</Badge>
            </div>
            <div className="text-xs text-slate-500">{t.description}</div>
            <div className="text-xs text-slate-600">Pelaksana: <b>{assignee?.name ?? '—'}</b> · Prioritas: {t.priority} · Biaya: ${t.costUsd.toFixed(4)} (demo)</div>
            {t.delegatedByAgentId && (
              <div className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg p-2">
                Didelegasikan ke {assignee?.name ?? '—'} oleh {delegator?.name ?? t.delegatedByAgentId}{t.routingReason ? ` — ${t.routingReason}` : ''}
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap items-center">
              <Badge cls={t.reviewStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : t.reviewStatus === 'needs_revision' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}>
                {reviewLabel(t)}
              </Badge>
              {(t.revisionCount ?? 0) > 0 && <span className="text-[11px] text-slate-500">Revisi: {t.revisionCount}x (maks 2x)</span>}
              {t.source && <span className="text-[11px] text-slate-400">sumber: {t.source}</span>}
            </div>
            {t.reviewFeedback && (
              <div className="text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                <b>Hasil review manager:</b> {t.reviewFeedback}
              </div>
            )}
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
              {t.status === 'done' && t.delegatedByAgentId && (
                <Btn onClick={() => { setRevFor(revFor === t.id ? null : t.id); setRevMsg(null); }}>
                  <span className="inline-flex items-center gap-1"><RotateCcw size={13} /> Minta revisi</span>
                </Btn>
              )}
            </div>
            {revFor === t.id && (
              <div className="bg-white/70 rounded-xl p-2.5 border border-white space-y-2">
                <TextArea value={revText} onChange={(e) => setRevText(e.target.value)} rows={2} placeholder="Catatan revisi untuk pelaksana, mis. Tambahkan bagian harga di landing page…" />
                <Btn
                  cls="bg-amber-500 text-white"
                  onClick={() => {
                    if (!revText.trim()) return;
                    const r = requestRevision(t.id, revText.trim());
                    if (r === 'ok') { setRevMsg(`Revisi #${(t.revisionCount ?? 0) + 1} diminta — tugas kembali ke antrean.`); setRevText(''); setRevFor(null); }
                    else if (r === 'max-revisions') setRevMsg('Batas 2 revisi sudah tercapai — catatanmu tetap diteruskan sebagai laporan lanjutan, tugas tidak dikerjakan ulang.');
                    else setRevMsg('Tugas tidak ditemukan.');
                  }}
                >
                  Kirim permintaan revisi
                </Btn>
                {revMsg && <div className="text-[11px] text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-2">{revMsg}</div>}
              </div>
            )}
          </div>
        );
      })}
      {tasks.length === 0 && <div className="text-xs text-slate-400">Belum ada tugas. Buat tugas pertama di atas.</div>}
    </div>
  );
}

// ─── Rapat ───
function MeetingsView({ prefillTopic, onPrefillUsed, createOpen, setCreateOpen }: { prefillTopic: string; onPrefillUsed: () => void; createOpen: boolean; setCreateOpen: (v: boolean) => void }) {
  const meetings = useWorld((s) => s.meetings);
  const agents = useWorld((s) => s.agents);
  const startMeeting = useWorld((s) => s.startMeeting);
  const endMeeting = useWorld((s) => s.endMeeting);
  const [topic, setTopic] = useState('Standup harian — progres website company profile');
  const [picked, setPicked] = useState<string[]>(['ag-bimo', 'ag-kirana', 'ag-lestari', 'ag-fajar']);

  useEffect(() => {
    if (prefillTopic) {
      setTopic(prefillTopic);
      setCreateOpen(true);
      onPrefillUsed();
    }
  }, [prefillTopic, onPrefillUsed, setCreateOpen]);

  return (
    <div className="space-y-3">
      {createOpen && (
      <div className="bg-white/70 rounded-xl p-3 border border-white space-y-2">
        <div className="text-xs font-bold text-slate-700">Buat rapat</div>
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topik rapat…" />
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
      )}
      {!createOpen && (
        <Btn cls="bg-purple-500 text-white w-full" onClick={() => setCreateOpen(true)}>
          <span className="inline-flex items-center gap-1"><Video size={13} /> Buat rapat baru</span>
        </Btn>
      )}
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

// ─── Statistik (data nyata, tanpa library chart) ───
function AnalyticsView() {
  const tasks = useWorld((s) => s.tasks);
  const agents = useWorld((s) => s.agents);
  const agentPerf = useWorld((s) => s.agentPerf);

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const running = tasks.filter((t) => t.status === 'running' || t.status === 'queued' || t.status === 'waiting_approval').length;
  const failed = tasks.filter((t) => t.status === 'failed').length;
  const cancelled = tasks.filter((t) => t.status === 'cancelled').length;
  const finished = done + failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // donut status tugas (SVG murni)
  const segs = [
    { label: 'Selesai', value: done, color: '#10b981' },
    { label: 'Berjalan', value: running, color: '#0ea5e9' },
    { label: 'Gagal', value: failed, color: '#ef4444' },
    { label: 'Dibatalkan', value: cancelled, color: '#94a3b8' },
  ];
  const R = 15.9155; // r agar keliling = 100
  let offset = 25;
  const donutSegs = segs.map((s) => {
    const len = total > 0 ? (s.value / total) * 100 : 0;
    const seg = { ...s, dash: `${Math.max(0, len - (len > 0 ? 0.8 : 0))} ${100 - Math.max(0, len - (len > 0 ? 0.8 : 0))}`, offset };
    offset -= len;
    return seg;
  });

  // bar aktivitas 7 hari (WIB): dibuat vs selesai per hari
  const days: { key: string; label: string; created: number; done: number }[] = [];
  const now = Date.now();
  for (let i = 6; i >= 0; i--) {
    const ms = now - i * 86_400_000;
    const key = wibParts(ms).dateKey;
    days.push({
      key,
      label: key.slice(5),
      created: tasks.filter((t) => wibParts(t.createdAtMs).dateKey === key).length,
      done: tasks.filter((t) => t.status === 'done' && wibParts(t.createdAtMs).dateKey === key).length,
    });
  }
  const maxDay = Math.max(1, ...days.map((d) => Math.max(d.created, d.done)));

  if (total === 0) {
    return (
      <div className="bg-white/80 border border-white rounded-2xl p-6 text-center space-y-2">
        <BarChart3 size={28} className="mx-auto text-slate-300" />
        <div className="font-bold text-slate-700">Belum ada tugas — buat tugas pertama untuk melihat grafik.</div>
        <div className="text-xs text-slate-500">Statistik, donut status, aktivitas 7 hari, dan kinerja per agent dihitung dari tugas nyata setelah ada data.</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* kartu ringkasan + completion ring */}
      <div className="bg-white/80 border border-white rounded-2xl p-4 flex items-center gap-4">
        <div className="relative w-[92px] h-[92px] shrink-0">
          <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90">
            <circle cx="21" cy="21" r={R} fill="none" stroke="#e2e8f0" strokeWidth="4" />
            <circle cx="21" cy="21" r={R} fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-slate-800 leading-none">{pct}%</span>
            <span className="text-[10px] text-slate-500">selesai</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1">
          {([['Total tugas', total], ['Selesai', done], ['Berjalan', running], ['Gagal', failed]] as [string, number][]).map(([l, v]) => (
            <div key={l}>
              <div className="text-xl font-bold text-slate-800 leading-none">{v}</div>
              <div className="text-[11px] text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* donut status tugas */}
      <div className="bg-white/80 border border-white rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-700 mb-2">Status tugas</div>
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 42 42" className="w-[92px] h-[92px] shrink-0 -rotate-90">
            <circle cx="21" cy="21" r={R} fill="none" stroke="#e2e8f0" strokeWidth="7" />
            {donutSegs.filter((s) => s.value > 0).map((s) => (
              <circle key={s.label} cx="21" cy="21" r={R} fill="none" stroke={s.color} strokeWidth="7" strokeDasharray={s.dash} strokeDashoffset={s.offset} />
            ))}
          </svg>
          <div className="space-y-1.5 text-xs flex-1">
            {segs.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-slate-600 flex-1">{s.label}</span>
                <b className="text-slate-800">{s.value}</b>
              </div>
            ))}
            <div className="text-[11px] text-slate-400 pt-1">Selesai {done} dari {finished} tugas yang berakhir ({finished > 0 ? Math.round((done / finished) * 100) : 0}% sukses).</div>
          </div>
        </div>
      </div>

      {/* bar aktivitas 7 hari */}
      <div className="bg-white/80 border border-white rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-700">Aktivitas 7 hari (WIB)</div>
        <div className="text-[11px] text-slate-500 mb-2">Biru = dibuat, hijau = selesai (per tanggal dibuat).</div>
        <div className="flex items-end gap-2 h-24">
          {days.map((d) => (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1 min-w-0" title={`${d.key}: ${d.created} dibuat, ${d.done} selesai`}>
              <div className="w-full flex items-end justify-center gap-0.5 h-16">
                <div className="w-3 bg-sky-400 rounded-t-sm" style={{ height: `${(d.created / maxDay) * 100}%`, minHeight: d.created > 0 ? 4 : 0 }} />
                <div className="w-3 bg-emerald-400 rounded-t-sm" style={{ height: `${(d.done / maxDay) * 100}%`, minHeight: d.done > 0 ? 4 : 0 }} />
              </div>
              <span className="text-[9px] text-slate-400">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* bar per-agent */}
      <div className="bg-white/80 border border-white rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-700 mb-2">Kinerja per agent</div>
        <div className="space-y-2">
          {agents.map((a) => {
            const p = agentPerf(a.id);
            const max = Math.max(1, p.done, p.failed);
            return (
              <div key={a.id} className="text-xs">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-slate-700 truncate">{a.name} <span className="text-slate-400 font-normal">· {a.role}</span></span>
                  <span className="text-slate-500 shrink-0">{p.done} selesai · {p.failed} gagal · {p.successPct}% sukses</span>
                </div>
                <div className="flex gap-1 h-2.5 mt-1">
                  <div className="bg-emerald-400 rounded-full" style={{ width: `${(p.done / max) * 100}%`, minWidth: p.done > 0 ? 8 : 0 }} />
                  <div className="bg-red-400 rounded-full" style={{ width: `${(p.failed / max) * 100}%`, minWidth: p.failed > 0 ? 8 : 0 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-500 mt-2">Data dihitung langsung dari tugas nyata (bukan database). Token & biaya API nyata baru tercatat setelah provider terhubung.</div>
      </div>
    </div>
  );
}

// ─── Hasil Kerja ───
type ResultTab = 'reports' | 'docs' | 'notes' | 'all';
type ResultRow =
  | { kind: 'report'; id: string; title: string; agentName: string; at: number; report: Report }
  | { kind: 'doc'; id: string; title: string; agentName: string; at: number; task: TaskItem }
  | { kind: 'note'; id: string; title: string; agentName: string; at: number; meeting: Meeting };

function ResultsView({ openReportId, onOpenReportUsed }: { openReportId: string | null; onOpenReportUsed: () => void }) {
  const reports = useWorld((s) => s.reports);
  const tasks = useWorld((s) => s.tasks);
  const meetings = useWorld((s) => s.meetings);
  const agents = useWorld((s) => s.agents);
  const markReportRead = useWorld((s) => s.markReportRead);
  const markAllReportsRead = useWorld((s) => s.markAllReportsRead);
  const replyToReport = useWorld((s) => s.replyToReport);
  const [tab, setTab] = useState<ResultTab>('reports');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyMsg, setReplyMsg] = useState<string | null>(null);

  useEffect(() => {
    if (openReportId) {
      setOpenId(openReportId);
      setTab('reports');
      onOpenReportUsed();
    }
  }, [openReportId, onOpenReportUsed]);

  const nameOf = (id: string) => agents.find((a) => a.id === id)?.name ?? id;
  const docs = tasks.filter((t) => t.status === 'done' && t.artifact);
  const notes = meetings.filter((m) => m.status === 'done' && m.minutes);
  const unread = reports.filter((r) => !r.read).length;

  const rows: ResultRow[] = [
    ...reports.map((r): ResultRow => ({ kind: 'report', id: `rep-${r.id}`, title: r.title, agentName: nameOf(r.managerId), at: r.createdAt, report: r })),
    ...docs.map((t): ResultRow => ({ kind: 'doc', id: `doc-${t.id}`, title: t.artifact?.name ?? t.title, agentName: nameOf(t.assigneeId ?? ''), at: t.createdAtMs, task: t })),
    ...notes.map((m): ResultRow => ({ kind: 'note', id: `note-${m.id}`, title: `Notulen: ${m.topic}`, agentName: m.agentIds.map(nameOf).slice(0, 2).join(', '), at: 0, meeting: m })),
  ].sort((a, b) => b.at - a.at);

  const filtered = rows.filter((r) => {
    if (tab === 'reports' && r.kind !== 'report') return false;
    if (tab === 'docs' && r.kind !== 'doc') return false;
    if (tab === 'notes' && r.kind !== 'note') return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!`${r.title} ${r.agentName}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const openRow = filtered.find((r) => r.id === openId) ?? null;
  const originOf = (r: Report) => reports.find((x) => x.id === r.inReplyToReportId);

  const TABS: { key: ResultTab; label: string; count: number }[] = [
    { key: 'reports', label: 'Laporan manager', count: reports.length },
    { key: 'docs', label: 'Dokumen', count: docs.length },
    { key: 'notes', label: 'Notulen', count: notes.length },
    { key: 'all', label: 'Semua', count: rows.length },
  ];

  const openReport = (r: Report) => {
    setOpenId(`rep-${r.id}`);
    if (!r.read) markReportRead(r.id);
    setReplyText('');
    setReplyMsg(null);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-slate-600 bg-white/80 border border-white rounded-xl px-3 py-2">
        {unread} laporan baru · {reports.length} laporan manager · {docs.length} dokumen pendukung · {notes.length} notulen
      </div>
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari judul / agent…" className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-slate-200 text-sm" />
        </div>
        {unread > 0 && <Btn onClick={() => markAllReportsRead()}>Tandai semua terbaca</Btn>}
      </div>
      <div className="flex gap-1 flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setOpenId(null); }} className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold ${tab === t.key ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {openRow?.kind === 'report' && (
        <div className="bg-white rounded-2xl border border-sky-200 p-3.5 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-sm text-slate-800">{openRow.report.title}</div>
            <button onClick={() => setOpenId(null)} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><X size={15} /></button>
          </div>
          <div className="text-[11px] text-slate-500">
            Manager {openRow.report.managerId ? nameOf(openRow.report.managerId) : '—'} · Pelaksana {nameOf(openRow.report.executorId)} · {fmtDay(openRow.report.createdAt)}
            {openRow.report.reviewStatus === 'approved' ? ' · Review: DISETUJUI' : ''}
            {openRow.report.revisionCount > 0 ? ` · Revisi ${openRow.report.revisionCount}x` : ''}
          </div>
          {openRow.report.inReplyToReportId && originOf(openRow.report) && (
            <button onClick={() => openReport(originOf(openRow.report)!)} className="text-[11px] text-sky-600 font-semibold bg-sky-50 border border-sky-200 rounded-lg px-2 py-1">
              Revisi dari laporan "{originOf(openRow.report)!.title}" — ketuk untuk melihat laporan asal
            </button>
          )}
          <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-2.5">{openRow.report.content}</div>
          <div className="border-t border-slate-200 pt-2.5 space-y-2">
            <div className="text-xs font-bold text-slate-700">Balas laporan ini — minta revisi</div>
            <TextArea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} placeholder={`Catatan revisi untuk ${nameOf(openRow.report.managerId)}…`} />
            <Btn
              cls="bg-amber-500 text-white"
              onClick={() => {
                if (!replyText.trim()) return;
                const taskId = replyToReport(openRow.report.id, replyText.trim());
                if (taskId) { setReplyMsg(`Terkirim — tugas revisi dibuat dengan id ${taskId}. Pelaksana mengerjakan ulang dan laporan lanjutan akan muncul di sini.`); setReplyText(''); }
                else setReplyMsg('Gagal — laporan atau tugas asal tidak ditemukan.');
              }}
            >
              Kirim revisi ke {nameOf(openRow.report.managerId)}
            </Btn>
            {replyMsg && <div className="text-[11px] text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2">{replyMsg}</div>}
          </div>
        </div>
      )}

      {openRow?.kind === 'doc' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-sm text-slate-800">{openRow.task.artifact?.name}</div>
            <button onClick={() => setOpenId(null)} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><X size={15} /></button>
          </div>
          <div className="text-[11px] text-slate-500">Dokumen pendukung · dari tugas "{openRow.task.title}" · {nameOf(openRow.task.assigneeId ?? '')}</div>
          <pre className="text-[11px] bg-slate-900 text-slate-100 rounded-lg p-2.5 overflow-auto max-h-72 whitespace-pre-wrap">{openRow.task.artifact?.content}</pre>
        </div>
      )}

      {openRow?.kind === 'note' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="font-bold text-sm text-slate-800">Notulen: {openRow.meeting.topic}</div>
            <button onClick={() => setOpenId(null)} className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"><X size={15} /></button>
          </div>
          <div className="text-[11px] text-slate-500">{openRow.meeting.room} · {openRow.meeting.agentIds.map(nameOf).join(', ')}</div>
          <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-2.5">{openRow.meeting.minutes}</div>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map((r) => {
          const isOpen = openId === r.id;
          const isNew = r.kind === 'report' && !r.report.read;
          const Icon = r.kind === 'report' ? FileText : r.kind === 'doc' ? StickyNote : NotebookPen;
          return (
            <button
              key={r.id}
              onClick={() => {
                if (r.kind === 'report') openReport(r.report);
                else setOpenId(isOpen ? null : r.id);
              }}
              className={`w-full flex items-center gap-2.5 text-left rounded-xl px-3 py-2.5 border ${isOpen ? 'bg-sky-50 border-sky-300' : 'bg-white/80 border-white hover:bg-white'}`}
            >
              <Icon size={16} className="text-slate-400 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800 truncate">{r.title}</span>
                <span className="block text-[11px] text-slate-500 truncate">{r.agentName}{r.at > 0 ? ` · ${fmtDay(r.at)}` : ''}{r.kind === 'report' && r.report.inReplyToReportId ? ' · Revisi laporan' : ''}</span>
              </span>
              {isNew && <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">Baru</span>}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-xs text-slate-400 bg-white/70 border border-white rounded-xl p-3 text-center">
            {tab === 'reports' && reports.length === 0
              ? 'Belum ada laporan manager. Laporan ditulis otomatis saat tugas delegasi selesai & direview.'
              : tab === 'docs' && docs.length === 0
                ? 'Belum ada dokumen pendukung. Dokumen muncul saat tugas selesai.'
                : tab === 'notes' && notes.length === 0
                  ? 'Belum ada notulen. Notulen dibuat saat rapat diakhiri.'
                  : 'Tidak ada hasil yang cocok dengan pencarian.'}
          </div>
        )}
      </div>
      <div className="text-[11px] text-slate-500 bg-white/70 border border-white rounded-lg p-2">
        Laporan manager adalah bacaan utama — ditulis otomatis setelah review. Dokumen mentah agent adalah "Dokumen pendukung", notulen rapat terpisah.
      </div>
    </div>
  );
}

// ─── Panel utama ───
const TITLES: Record<NavKey, { title: string; subtitle: string; icon: typeof Globe }> = {
  world: { title: 'Beranda', subtitle: 'Ringkasan kampus & perintah cepat', icon: Globe },
  agents: { title: 'Agent', subtitle: 'Daftar agent, profil & buat agent baru', icon: Users },
  tasks: { title: 'Tugas', subtitle: 'Buat, pantau & review tugas', icon: ListChecks },
  meetings: { title: 'Rapat', subtitle: 'Rapat, transkrip & notulen', icon: CalendarClock },
  results: { title: 'Hasil Kerja', subtitle: 'Laporan manager, dokumen & notulen', icon: FileText },
  buildings: { title: 'Gedung', subtitle: 'Gedung & ruangan kampus', icon: Building2 },
  analytics: { title: 'Statistik', subtitle: 'Kinerja tugas & agent dari data nyata', icon: BarChart3 },
  activity: { title: 'Aktivitas', subtitle: 'Log semua kejadian di dunia', icon: Activity },
  settings: { title: 'Pengaturan', subtitle: 'Mode, kualitas & koneksi AI', icon: Settings },
};

export default function RightPanel({
  onOpenChat,
  openReportId,
  onOpenReportUsed,
}: {
  onOpenChat: (agentId: string, tab: 'chat' | 'assign') => void;
  openReportId: string | null;
  onOpenReportUsed: () => void;
}) {
  const nav = useWorld((s) => s.nav);
  const panelOpen = useWorld((s) => s.panelOpen);
  const setPanelOpen = useWorld((s) => s.setPanelOpen);
  const agents = useWorld((s) => s.agents);
  const selectedAgentId = useWorld((s) => s.selectedAgentId);
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;
  const tasks = useWorld((s) => s.tasks);
  const logs = useWorld((s) => s.logs);
  const meetings = useWorld((s) => s.meetings);
  const mode = useWorld((s) => s.mode);
  const setMode = useWorld((s) => s.setMode);
  const quality = useWorld((s) => s.quality);
  const setQuality = useWorld((s) => s.setQuality);
  const setFloor = useWorld((s) => s.setFloor);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const setCamera = useWorld((s) => s.setCamera);
  const [providerHelp, setProviderHelp] = useState<string | null>(null);
  const [prefillTask, setPrefillTask] = useState('');
  const [prefillMeeting, setPrefillMeeting] = useState('');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(true);
  const [showMeetingForm, setShowMeetingForm] = useState(true);

  if (!panelOpen) return null;

  const done = tasks.filter((t) => t.status === 'done').length;
  const failed = tasks.filter((t) => t.status === 'failed').length;
  const running = tasks.filter((t) => t.status === 'running').length;

  const meta = TITLES[nav];
  const headerTitle = nav === 'agents' && selectedAgent ? `Agent — ${selectedAgent.name}` : meta.title;
  const headerAction =
    nav === 'agents' && !selectedAgent ? (
      <Btn onClick={() => setShowAgentForm(!showAgentForm)} cls="bg-sky-500 text-white"><span className="inline-flex items-center gap-1"><Plus size={13} /> Agent</span></Btn>
    ) : nav === 'tasks' ? (
      <Btn onClick={() => setShowTaskForm(!showTaskForm)} cls="bg-sky-500 text-white"><span className="inline-flex items-center gap-1"><Plus size={13} /> Tugas</span></Btn>
    ) : nav === 'meetings' ? (
      <Btn onClick={() => setShowMeetingForm(!showMeetingForm)} cls="bg-purple-500 text-white"><span className="inline-flex items-center gap-1"><Plus size={13} /> Rapat</span></Btn>
    ) : undefined;

  return (
    <aside className="fixed z-40 inset-x-0 bottom-0 max-h-[62vh] md:static md:z-20 md:max-h-none md:w-[360px] md:shrink-0 md:m-3 md:rounded-2xl md:overflow-hidden bg-white/85 backdrop-blur-xl border-t md:border border-white flex flex-col shadow-xl">
      <PanelHeader icon={meta.icon} title={headerTitle} subtitle={meta.subtitle} action={headerAction} onClose={() => setPanelOpen(false)} />
      <div className="overflow-y-auto p-3 space-y-3">
        {nav === 'world' && (
          <WorldView onPrefillTask={(t) => setPrefillTask(t)} onPrefillMeeting={(t) => setPrefillMeeting(t)} />
        )}

        {nav === 'agents' && <AgentsView onOpenChat={onOpenChat} createOpen={showAgentForm} setCreateOpen={setShowAgentForm} />}

        {nav === 'tasks' && (
          <TasksView
            prefillTitle={prefillTask}
            onPrefillUsed={() => setPrefillTask('')}
            createOpen={showTaskForm}
            setCreateOpen={setShowTaskForm}
          />
        )}
        {nav === 'meetings' && (
          <MeetingsView prefillTopic={prefillMeeting} onPrefillUsed={() => setPrefillMeeting('')} createOpen={showMeetingForm} setCreateOpen={setShowMeetingForm} />
        )}

        {nav === 'results' && <ResultsView openReportId={openReportId} onOpenReportUsed={onOpenReportUsed} />}

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

        {nav === 'analytics' && <AnalyticsView />}

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
              <div className="text-xs font-bold text-slate-700">Koneksi AI — Muse</div>
              <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Muse (built-in)</span>
                  <Badge cls="bg-emerald-100 text-emerald-700">Provider aktif</Badge>
                </div>
                <div className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                  Provider AI pilihan untuk dunia ini. Saat server berjalan dengan <code>PROVIDER=muse</code>, tugas dialihkan ke antrean asisten (<code>GET /api/assistant-queue</code>) dan dikerjakan Muse, lalu hasilnya dikirim kembali lewat <code>POST /api/tasks/:id/submit</code>. Di repo lokal ini belum ada wiring klien → server, jadi mode DEMO memakai simulasi deterministik dan mode LIVE memblokir eksekusi.
                </div>
              </div>
              <div className="text-xs font-bold text-slate-700 pt-1">Provider eksternal — Integration Required</div>
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
              <div className="font-bold text-slate-700">Avatar otomatis:</div>
              <div>Agent tanpa tugas bergerak sendiri — jalan-jalan, istirahat, lalu kembali ke meja. Agent yang sedang bertugas tetap bekerja di mejanya. Tidak ada jadwal kehidupan terjadwal; perilaku ini otomatis dari status kerja agent.</div>
            </div>
            <div className="bg-white/80 border border-white rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-700">Status jujur Fase 1</div>
              <div>✅ Dunia 3D, kamera, 10 avatar, avatar santai otomatis, task engine demo, meeting demo.</div>
              <div>⏳ Belum: Supabase Auth/DB live, eksekusi LLM nyata, Build Mode, audio, mobile polish penuh.</div>
              <div>📄 Detail: lihat <code>TEST-REPORT.md</code> di repo.</div>
            </div>
            <div className="text-[11px] text-slate-500 bg-white/70 border border-white rounded-lg p-2">
              Statistik: {agents.length} agent · {done} tugas selesai · {failed} gagal · {running} berjalan · {meetings.length} rapat.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
