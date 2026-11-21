// ─── Chat / Tugaskan sebagai panel mengambang (bukan full-screen, bukan inline)
// Dunia 3D tetap terlihat di sekitarnya. Menutup panel kembali ke profil agent
// (nav agents + selectedAgentId tetap). Riwayat sesi persisten via store.
import { useMemo, useState } from 'react';
import { MessageSquare, Plus, Send, Trash2, X } from 'lucide-react';
import { useWorld } from '../store';
import type { AgentProfile } from '../types';

export default function ChatPanel({
  agent,
  initialTab,
  onClose,
}: {
  agent: AgentProfile;
  initialTab: 'chat' | 'assign';
  onClose: () => void;
}) {
  const mode = useWorld((s) => s.mode);
  const agents = useWorld((s) => s.agents);
  const chatSessions = useWorld((s) => s.chatSessions);
  const createChatSession = useWorld((s) => s.createChatSession);
  const sendChatMessage = useWorld((s) => s.sendChatMessage);
  const deleteChatSession = useWorld((s) => s.deleteChatSession);
  const assignTask = useWorld((s) => s.assignTask);

  const [tab, setTab] = useState<'chat' | 'assign'>(initialTab);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [assignMode, setAssignMode] = useState<'auto' | 'direct-sub' | 'direct'>('auto');
  const [subId, setSubId] = useState('');
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  const mySessions = useMemo(
    () => chatSessions.filter((c) => c.agentId === agent.id),
    [chatSessions, agent.id],
  );
  const session = mySessions.find((c) => c.id === sessionId) ?? mySessions[0] ?? null;
  const subordinates = useMemo(() => agents.filter((a) => a.managerId === agent.id), [agents, agent.id]);
  const isManager = subordinates.length > 0;

  const ensureSession = (): string => {
    if (session) return session.id;
    const id = createChatSession(agent.id);
    setSessionId(id);
    return id;
  };

  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    sendChatMessage(ensureSession(), text);
    setChatInput('');
  };

  const submitTask = () => {
    if (!taskTitle.trim()) return;
    let result: 'ok' | 'live-blocked';
    let targetLabel: string;
    if (isManager && assignMode === 'direct-sub' && subId) {
      result = assignTask(taskTitle.trim(), taskDesc.trim(), subId, { source: 'chat' });
      targetLabel = agents.find((a) => a.id === subId)?.name ?? subId;
    } else if (isManager && assignMode === 'auto') {
      // tanpa assigneeId → store mengorkestrasikan via pickBestAssignee
      result = assignTask(taskTitle.trim(), taskDesc.trim(), agent.id, { source: 'chat' });
      targetLabel = `${agent.name} (orkestrasi otomatis ke bawahan yang paling cocok)`;
    } else {
      result = assignTask(taskTitle.trim(), taskDesc.trim(), agent.id, { source: 'chat' });
      targetLabel = agent.name;
    }
    if (result === 'ok') {
      setAssignMsg(`Tugas dibuat → ${targetLabel}. Pantau progresnya di panel Tugas.`);
      setTaskTitle('');
      setTaskDesc('');
    } else {
      setAssignMsg('⛔ LIVE MODE: tugas diblokir — "Integration Required". Belum ada provider LLM terhubung.');
    }
  };

  return (
    <div className="absolute z-30 inset-x-3 bottom-[4.5rem] max-h-[72vh] md:inset-x-auto md:bottom-auto md:right-3 md:top-3 md:w-[380px] md:max-h-[calc(100%-1.5rem)] flex flex-col bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-2xl overflow-hidden">
      {/* header */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-slate-200/70 shrink-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: agent.color }}>
          {agent.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-slate-800 text-sm truncate">{agent.name}</div>
          <div className="text-[11px] text-slate-500 truncate">{agent.role} · {agent.team}</div>
        </div>
        <button onClick={onClose} title="Tutup — kembali ke profil agent" className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
          <X size={17} />
        </button>
      </div>

      {/* tab */}
      <div className="flex gap-1 px-3 pt-2.5 shrink-0">
        {(['chat', 'assign'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              tab === t ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t === 'chat' ? 'Chat' : 'Tugaskan'}
          </button>
        ))}
      </div>

      {tab === 'chat' ? (
        <div className="flex flex-col min-h-0 flex-1 p-3 gap-2">
          {mode === 'live' && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 shrink-0">
              ⛔ LIVE MODE — chat diblokir: "Integration Required". Hubungkan provider di Pengaturan.
            </div>
          )}
          {mode === 'demo' && (
            <div className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2 shrink-0">
              💬 Chat DEMO — balasan disimulasikan dari skrip, bukan output LLM. Perintah kerja (mis. "buatkan…", "riset…") menjadi tugas nyata.
            </div>
          )}
          {/* pemilih riwayat sesi */}
          <div className="flex items-center gap-1.5 shrink-0">
            <select
              value={session?.id ?? ''}
              onChange={(e) => setSessionId(e.target.value || null)}
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
            >
              {mySessions.length === 0 && <option value="">Belum ada sesi chat</option>}
              {mySessions.map((c) => (
                <option key={c.id} value={c.id}>{c.title} · {c.messages.length} pesan</option>
              ))}
            </select>
            <button
              onClick={() => setSessionId(createChatSession(agent.id))}
              title="Chat baru"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500 text-white text-xs font-semibold shrink-0"
            >
              <Plus size={13} /> Chat baru
            </button>
            {session && (
              <button
                onClick={() => { deleteChatSession(session.id); setSessionId(null); }}
                title="Hapus sesi ini"
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-red-500 flex items-center justify-center shrink-0"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {/* riwayat pesan */}
          <div className="flex-1 min-h-[140px] overflow-y-auto space-y-1.5 bg-slate-50 rounded-xl p-2">
            {session?.messages.map((m) => (
              <div key={m.id} className={`text-xs rounded-lg px-2.5 py-1.5 max-w-[92%] whitespace-pre-wrap break-words ${m.from === 'me' ? 'bg-sky-500 text-white ml-auto' : 'bg-white border border-slate-200 text-slate-700'}`}>
                {m.text}
              </div>
            ))}
            {!session && <div className="text-xs text-slate-400 p-1">Belum ada sesi. Klik "+ Chat baru" atau langsung tulis pesan — sesi dibuat otomatis.</div>}
            {session && session.messages.length === 0 && <div className="text-xs text-slate-400 p-1">Belum ada pesan. Coba: "halo", "buatkan riset resep bakpao", "tugas apa yang kamu kerjakan?"</div>}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <input
              value={chatInput}
              disabled={mode === 'live'}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
              className="flex-1 min-w-0 px-2.5 py-2 rounded-lg border border-slate-200 text-sm disabled:bg-slate-100"
              placeholder={mode === 'live' ? 'Chat dinonaktifkan (Live)' : 'Tulis pesan…'}
            />
            <button onClick={sendChat} disabled={mode === 'live'} className="px-3 rounded-lg bg-sky-500 text-white disabled:bg-slate-300 shrink-0" title="Kirim">
              <Send size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm"
            placeholder="Judul tugas, mis. Riset resep bakpao"
          />
          <textarea
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm"
            rows={3}
            placeholder="Deskripsi tugas…"
          />
          {isManager ? (
            <div className="space-y-1.5">
              <label className={`flex items-start gap-2 text-xs rounded-lg border p-2.5 cursor-pointer ${assignMode === 'auto' ? 'border-sky-400 bg-sky-50' : 'border-slate-200'}`}>
                <input type="radio" checked={assignMode === 'auto'} onChange={() => setAssignMode('auto')} className="mt-0.5" />
                <span><b>Otomatis — manager pilih yang paling cocok</b><br /><span className="text-slate-500">{agent.name} mendelegasikan ke satu bawahan yang keahliannya paling cocok.</span></span>
              </label>
              <label className={`flex items-start gap-2 text-xs rounded-lg border p-2.5 cursor-pointer ${assignMode === 'direct-sub' ? 'border-sky-400 bg-sky-50' : 'border-slate-200'}`}>
                <input type="radio" checked={assignMode === 'direct-sub'} onChange={() => setAssignMode('direct-sub')} className="mt-0.5" />
                <span><b>Pilih bawahan langsung</b><br /><span className="text-slate-500">Tugas langsung ke bawahan yang kamu pilih.</span></span>
              </label>
              {assignMode === 'direct-sub' && (
                <select value={subId} onChange={(e) => setSubId(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                  <option value="">— Pilih bawahan —</option>
                  {subordinates.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              Tugas langsung ke <b>{agent.name}</b> ({agent.role}).
            </div>
          )}
          <button
            onClick={submitTask}
            disabled={!taskTitle.trim() || (isManager && assignMode === 'direct-sub' && !subId)}
            className="w-full px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold disabled:bg-slate-300"
          >
            {mode === 'live' ? 'Tugaskan (akan diblokir — Live belum terhubung)' : `Tugaskan ke ${isManager && assignMode === 'auto' ? agent.name + ' (orkestrasi)' : isManager && assignMode === 'direct-sub' ? agents.find((a) => a.id === subId)?.name ?? 'bawahan' : agent.name}`}
          </button>
          {assignMsg && <div className="text-xs text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">{assignMsg}</div>}
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <MessageSquare size={11} /> Atau beri perintah lewat tab Chat — perintah kerja juga menjadi tugas.
          </div>
        </div>
      )}
    </div>
  );
}
