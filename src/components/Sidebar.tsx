// ─── Sidebar berkelompok (desktop) + bottom nav mobile ────────────────────
import { useState } from 'react';
import {
  Activity, BarChart3, Building2, CalendarClock, FileText, Globe, Hammer,
  LayoutGrid, ListChecks, Settings, Users, X,
} from 'lucide-react';
import type { NavKey } from '../types';
import { selectUnreadReportCount, useWorld } from '../store';

interface Item {
  key: NavKey;
  label: string;
  desc: string;
  icon: typeof Globe;
}

const UTAMA: Item[] = [
  { key: 'world', label: 'Beranda', desc: 'Ringkasan kampus & perintah cepat', icon: Globe },
  { key: 'agents', label: 'Agent', desc: 'Daftar, profil & buat agent', icon: Users },
  { key: 'tasks', label: 'Tugas', desc: 'Tugas, delegasi & review', icon: ListChecks },
  { key: 'meetings', label: 'Rapat', desc: 'Rapat & notulen', icon: CalendarClock },
  { key: 'results', label: 'Hasil Kerja', desc: 'Laporan manager & dokumen', icon: FileText },
];

const KELOLA: Item[] = [
  { key: 'buildings', label: 'Gedung', desc: 'Gedung & ruangan kampus', icon: Building2 },
  { key: 'analytics', label: 'Statistik', desc: 'Kinerja tugas & agent', icon: BarChart3 },
  { key: 'activity', label: 'Aktivitas', desc: 'Log semua kejadian', icon: Activity },
  { key: 'settings', label: 'Pengaturan', desc: 'Mode, kualitas & provider AI', icon: Settings },
];

export default function Sidebar() {
  const nav = useWorld((s) => s.nav);
  const setNav = useWorld((s) => s.setNav);
  const addLog = useWorld((s) => s.addLog);
  const tasks = useWorld((s) => s.tasks);
  const meetings = useWorld((s) => s.meetings);
  const agents = useWorld((s) => s.agents);
  const unread = useWorld(selectUnreadReportCount);
  const [buildNote, setBuildNote] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const running = tasks.filter((t) => t.status === 'running').length;
  const liveMeetings = meetings.filter((m) => m.status === 'live').length;

  const badgeFor = (key: NavKey): string | null => {
    if (key === 'tasks') return running > 0 ? `${running} jalan` : null;
    if (key === 'meetings') return liveMeetings > 0 ? `${liveMeetings} live` : null;
    if (key === 'results') return unread > 0 ? `${unread} baru` : null;
    if (key === 'agents') return `${agents.length} agent`;
    return null;
  };

  const buildClick = () => {
    setBuildNote(true);
    addLog('system', 'Build Mode diklik — status: BACKLOG Fase 6 (belum dibangun).');
    setTimeout(() => setBuildNote(false), 4000);
  };

  const renderItem = (it: Item, compact = false) => {
    const Icon = it.icon;
    const active = nav === it.key;
    const badge = badgeFor(it.key);
    return (
      <button
        key={it.key}
        onClick={() => { setNav(it.key); setMoreOpen(false); }}
        className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
          active ? 'bg-sky-500 text-white shadow' : 'text-slate-700 hover:bg-white'
        }`}
      >
        <Icon size={18} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className={`block text-[13px] font-semibold leading-tight ${compact ? '' : ''}`}>{it.label}</span>
          {!compact && <span className={`block text-[11px] leading-tight truncate ${active ? 'text-sky-100' : 'text-slate-500'}`}>{it.desc}</span>}
        </span>
        {badge && (
          <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            it.key === 'results' && unread > 0
              ? 'bg-red-500 text-white'
              : active ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  const MOBILE_MAIN: Item[] = [
    UTAMA[0], // Beranda
    UTAMA[1], // Agent
    UTAMA[2], // Tugas
    UTAMA[4], // Hasil Kerja
  ];

  return (
    <>
      {/* desktop: lebar berkelompok */}
      <nav className="hidden md:flex flex-col gap-1 w-[264px] shrink-0 py-3 px-2.5 bg-white/70 backdrop-blur border-r border-white z-20 overflow-y-auto">
        <div className="px-2 pt-1 pb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Utama — untuk bekerja</div>
        {UTAMA.map((it) => renderItem(it))}
        <div className="px-2 pt-3 pb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Kelola — atur dunia</div>
        {KELOLA.map((it) => renderItem(it))}
        <button
          onClick={buildClick}
          className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 hover:bg-white transition"
          title="World Builder — Fase 6 (backlog)"
        >
          <Hammer size={18} className="shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold leading-tight">Bangun</span>
            <span className="block text-[11px] leading-tight truncate text-slate-500">World Builder (backlog)</span>
          </span>
        </button>
        {buildNote && (
          <div className="text-[11px] leading-tight text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            Build Mode: backlog Fase 6, belum dibangun.
          </div>
        )}
        <div className="flex-1" />
        <div className="px-2 pt-2 text-[11px] text-slate-400 leading-snug">
          {agents.length} agent · {tasks.length} tugas · {unread > 0 ? `${unread} laporan baru` : 'tidak ada laporan baru'}
        </div>
      </nav>

      {/* mobile: bottom nav 4 menu utama + Lainnya */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white/90 backdrop-blur border-t border-slate-200 flex items-stretch">
        {MOBILE_MAIN.map((it) => {
          const Icon = it.icon;
          const active = nav === it.key;
          const badge = badgeFor(it.key);
          return (
            <button
              key={it.key}
              onClick={() => setNav(it.key)}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? 'text-sky-600' : 'text-slate-500'}`}
            >
              <Icon size={19} />
              {it.label}
              {it.key === 'results' && unread > 0 && (
                <span className="absolute top-1 right-[calc(50%-20px)] min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unread}
                </span>
              )}
              {badge && it.key !== 'results' && <span className="text-[9px] text-slate-400">{badge}</span>}
            </button>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-slate-500"
        >
          <LayoutGrid size={19} />
          Lainnya
        </button>
      </nav>

      {/* mobile: sheet "Lainnya" — semua menu (mirror desktop) */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <button aria-label="Tutup menu" onClick={() => setMoreOpen(false)} className="absolute inset-0 bg-slate-900/40" />
          <div className="relative w-full bg-white rounded-t-2xl p-4 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-slate-800">Semua menu</div>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"><X size={17} /></button>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 px-1 pb-1">Utama — untuk bekerja</div>
            <div className="space-y-1">{UTAMA.map((it) => renderItem(it))}</div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 px-1 pt-3 pb-1">Kelola — atur dunia</div>
            <div className="space-y-1">
              {KELOLA.map((it) => renderItem(it))}
              <button
                onClick={() => { buildClick(); setMoreOpen(false); }}
                className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-slate-700 hover:bg-slate-50 transition"
              >
                <Hammer size={18} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-tight">Bangun</span>
                  <span className="block text-[11px] leading-tight truncate text-slate-500">World Builder (backlog)</span>
                </span>
              </button>
            </div>
            <div className="mt-3 text-[11px] text-slate-400 px-1">
              {agents.length} agent · {tasks.length} tugas · {unread > 0 ? `${unread} laporan baru` : 'tidak ada laporan baru'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
