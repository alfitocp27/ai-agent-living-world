// ─── Sidebar navigasi (desktop vertikal, mobile horizontal) ────────────────
import { useState } from 'react';
import {
  Activity, BarChart3, Building2, CalendarClock, Globe, Hammer,
  ListChecks, Settings, Users,
} from 'lucide-react';
import type { NavKey } from '../types';
import { useWorld } from '../store';

const ITEMS: { key: NavKey; label: string; icon: typeof Globe }[] = [
  { key: 'world', label: 'World', icon: Globe },
  { key: 'agents', label: 'Agents', icon: Users },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'meetings', label: 'Meetings', icon: CalendarClock },
  { key: 'buildings', label: 'Buildings', icon: Building2 },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const nav = useWorld((s) => s.nav);
  const setNav = useWorld((s) => s.setNav);
  const addLog = useWorld((s) => s.addLog);
  const [buildNote, setBuildNote] = useState(false);

  const buildClick = () => {
    setBuildNote(true);
    addLog('system', 'Build Mode diklik — status: BACKLOG Fase 6 (belum dibangun).');
    setTimeout(() => setBuildNote(false), 4000);
  };

  return (
    <>
      {/* desktop */}
      <nav className="hidden md:flex flex-col gap-1 w-[76px] shrink-0 py-3 px-2 bg-white/70 backdrop-blur border-r border-white z-20">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setNav(key)}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-medium transition ${
              nav === key ? 'bg-sky-500 text-white shadow' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Icon size={19} />
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={buildClick}
          className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-medium text-slate-600 hover:bg-white"
          title="World Builder — Fase 6 (backlog)"
        >
          <Hammer size={19} />
          Build
        </button>
        {buildNote && (
          <div className="text-[10px] leading-tight text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-1.5">
            Build Mode: backlog Fase 6, belum dibangun.
          </div>
        )}
      </nav>
      {/* mobile */}
      <nav className="md:hidden shrink-0 flex gap-1 overflow-x-auto px-2 py-1.5 bg-white/80 backdrop-blur border-b border-white z-20">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setNav(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              nav === key ? 'bg-sky-500 text-white' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
        <button onClick={buildClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-white text-slate-600 border border-slate-200">
          <Hammer size={15} /> Build
        </button>
      </nav>
    </>
  );
}
