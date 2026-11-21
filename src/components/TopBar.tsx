// ─── Top bar: identitas, jam dunia, status live/demo, statistik ────────────
import { Bot, Clock3 } from 'lucide-react';
import { fmtClock, useWorld } from '../store';

export default function TopBar() {
  const mode = useWorld((s) => s.mode);
  const setMode = useWorld((s) => s.setMode);
  const clockMin = useWorld((s) => s.clockMin);
  const day = useWorld((s) => s.day);
  const agents = useWorld((s) => s.agents);
  const tasks = useWorld((s) => s.tasks);
  const online = agents.filter((a) => a.status !== 'offline').length;
  const running = tasks.filter((t) => t.status === 'running').length;
  const errors = tasks.filter((t) => t.status === 'failed').length;
  const cost = agents.reduce((s, a) => s + a.costTodayUsd, 0);

  return (
    <header className="h-14 shrink-0 glass flex items-center gap-3 px-3 md:px-4 z-30 relative">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-orange-400 flex items-center justify-center text-white shrink-0">
          <Bot size={20} />
        </div>
        <div className="leading-tight min-w-0">
          <div className="font-bold text-slate-800 truncate">AI Agent Living World</div>
          <div className="text-[11px] text-slate-500 truncate hidden sm:block">Kampus AI • Hari {day} • Demo Fase 1</div>
        </div>
      </div>

      <button
        onClick={() => setMode(mode === 'demo' ? 'live' : 'demo')}
        title="Klik untuk beralih mode. Live memblokir eksekusi sampai provider terhubung."
        className={`ml-1 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
          mode === 'demo' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
        }`}
      >
        {mode === 'demo' ? '● DEMO' : '● LIVE'}
      </button>

      <div className="flex-1" />

      <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-white/70 rounded-full px-3 py-1.5 border border-white">
        <Clock3 size={14} />
        <span className="font-semibold">{fmtClock(clockMin)} WIB virtual</span>
      </div>
      <div className="hidden md:flex items-center gap-3 text-xs">
        <span className="bg-white/70 rounded-full px-2.5 py-1 border border-white"><b>{online}</b>/{agents.length} agent aktif</span>
        <span className="bg-white/70 rounded-full px-2.5 py-1 border border-white"><b>{running}</b> tugas jalan</span>
        <span className={`rounded-full px-2.5 py-1 border border-white ${errors ? 'bg-red-100 text-red-700' : 'bg-white/70'}`}><b>{errors}</b> error</span>
        <span className="bg-white/70 rounded-full px-2.5 py-1 border border-white" title="Estimasi biaya demo, bukan tagihan nyata">Biaya hari ini <b>${cost.toFixed(2)}</b> (demo)</span>
      </div>
    </header>
  );
}
