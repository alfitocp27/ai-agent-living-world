// ─── Top bar ramping: identitas, mode, lonceng laporan, jam WIB ──────────
import { Bell, Bot, Clock3 } from 'lucide-react';
import { fmtWIB, selectLatestUnreadReport, selectUnreadReportCount, useWorld } from '../store';

export default function TopBar({ onOpenReport }: { onOpenReport: (id: string) => void }) {
  const mode = useWorld((s) => s.mode);
  const setMode = useWorld((s) => s.setMode);
  const wibNow = useWorld((s) => s.wibNow);
  const day = useWorld((s) => s.day);
  const agents = useWorld((s) => s.agents);
  const tasks = useWorld((s) => s.tasks);
  const unread = useWorld(selectUnreadReportCount);
  const latestUnread = useWorld(selectLatestUnreadReport);
  const setNav = useWorld((s) => s.setNav);
  const markReportRead = useWorld((s) => s.markReportRead);

  const online = agents.filter((a) => a.status !== 'offline').length;
  const running = tasks.filter((t) => t.status === 'running').length;
  const errors = tasks.filter((t) => t.status === 'failed').length;
  const cost = agents.reduce((s, a) => s + a.costTodayUsd, 0);

  const openBell = () => {
    setNav('results');
    if (latestUnread) {
      markReportRead(latestUnread.id);
      onOpenReport(latestUnread.id);
    }
  };

  return (
    <header className="shrink-0 glass z-30 relative px-3 md:px-4 py-1.5">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-orange-400 flex items-center justify-center text-white shrink-0">
            <Bot size={18} />
          </div>
          <div className="leading-tight min-w-0">
            <div className="font-bold text-slate-800 truncate text-sm">AI Agent Living World</div>
            <div className="text-[11px] text-slate-500 truncate hidden sm:block">Kampus AI · Tgl {day}</div>
          </div>
        </div>

        <button
          onClick={() => setMode(mode === 'demo' ? 'live' : 'demo')}
          title="Klik untuk beralih mode. Live memblokir eksekusi sampai provider terhubung."
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 border ${
            mode === 'demo' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          {mode === 'demo' ? 'DEMO — Muse (muse.ai)' : 'Live — Muse AI'}
        </button>

        <div className="flex-1" />

        {/* kartu jam WIB berbingkai — berdetak tiap detik lewat tick */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-700 bg-white rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
          <Clock3 size={14} className="text-slate-500" />
          <span className="font-bold tabular-nums">{fmtWIB(wibNow)}</span>
        </div>

        {/* lonceng laporan manager belum dibaca */}
        <button
          onClick={openBell}
          title={unread > 0 ? `${unread} laporan manager belum dibaca — klik untuk membuka` : 'Hasil Kerja — belum ada laporan baru'}
          className="relative w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="bg-white rounded-full px-2.5 py-1 border border-slate-200"><b>{online}</b>/{agents.length} agent aktif</span>
          <span className="bg-white rounded-full px-2.5 py-1 border border-slate-200"><b>{running}</b> tugas jalan</span>
          <span className={`rounded-full px-2.5 py-1 border ${errors ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white border-slate-200'}`}><b>{errors}</b> error</span>
          <span className="bg-white rounded-full px-2.5 py-1 border border-slate-200" title="Estimasi biaya demo, bukan tagihan nyata">Biaya hari ini <b>${cost.toFixed(2)}</b> (demo)</span>
        </div>
      </div>

      {/* mobile: strip status baris kedua, selalu terlihat */}
      <div className="flex lg:hidden items-center gap-1.5 mt-1.5 overflow-x-auto text-[11px] whitespace-nowrap">
        <span className="bg-white rounded-full px-2 py-0.5 border border-slate-200 flex items-center gap-1 sm:hidden">
          <Clock3 size={12} className="text-slate-500" />
          <b className="tabular-nums">{fmtWIB(wibNow)}</b>
        </span>
        <span className="bg-white rounded-full px-2 py-0.5 border border-slate-200"><b>{online}</b>/{agents.length} agent aktif</span>
        <span className="bg-white rounded-full px-2 py-0.5 border border-slate-200"><b>{running}</b> tugas jalan</span>
        <span className={`rounded-full px-2 py-0.5 border ${errors ? 'bg-red-100 text-red-700 border-red-200' : 'bg-white border-slate-200'}`}><b>{errors}</b> error</span>
        <span className="bg-white rounded-full px-2 py-0.5 border border-slate-200">Biaya hari ini <b>${cost.toFixed(2)}</b> (demo)</span>
        {unread > 0 && (
          <button onClick={openBell} className="bg-red-50 text-red-700 rounded-full px-2 py-0.5 border border-red-200 font-semibold">
            {unread} laporan baru
          </button>
        )}
      </div>
    </header>
  );
}
