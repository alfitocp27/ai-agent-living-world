// ─── Bottom bar: toolbar tersegmentasi (simulasi | kamera | atap/lantai) ───
// Kontrol kecepatan 1x/2x/4x DIHAPUS (Fase B) — jam berjalan WIB nyata.
import { Box, Clapperboard, EyeOff, Home, Pause, Play, User, Video } from 'lucide-react';
import { fmtClock, useWorld } from '../store';
import type { CameraMode } from '../types';

const CAMERAS: { key: CameraMode; label: string; icon: typeof Box }[] = [
  { key: 'iso', label: 'Isometric', icon: Box },
  { key: 'orbit', label: 'Orbit 360°', icon: Video },
  { key: 'top', label: 'Top-down', icon: Home },
  { key: 'follow', label: 'Follow Agent', icon: User },
  { key: 'building', label: 'Gedung', icon: Home },
  { key: 'cinematic', label: 'Cinematic', icon: Clapperboard },
];

export default function BottomBar() {
  const paused = useWorld((s) => s.paused);
  const togglePause = useWorld((s) => s.togglePause);
  const cameraMode = useWorld((s) => s.cameraMode);
  const setCamera = useWorld((s) => s.setCamera);
  const hideRoof = useWorld((s) => s.hideRoof);
  const setHideRoof = useWorld((s) => s.setHideRoof);
  const selectedFloor = useWorld((s) => s.selectedFloor);
  const setFloor = useWorld((s) => s.setFloor);
  const setNav = useWorld((s) => s.setNav);
  const logs = useWorld((s) => s.logs);
  const latest = logs[0];

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-[4.5rem] md:bottom-3 z-20 w-[min(96%,940px)]">
      <div className="glass rounded-2xl px-2.5 py-2 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {/* segmen: simulasi */}
          <button
            onClick={togglePause}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold shadow ${
              paused ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-sky-500 text-white hover:bg-sky-600'
            }`}
            title={paused ? 'Lanjutkan simulasi' : 'Jeda simulasi'}
          >
            {paused ? <Play size={15} /> : <Pause size={15} />}
            <span>{paused ? 'Jalankan simulasi' : 'Jeda simulasi'}</span>
          </button>
          <span className="w-px h-6 bg-slate-300 mx-1 hidden sm:block" />
          {/* segmen: kamera */}
          {CAMERAS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCamera(key)}
              className={`flex items-center gap-1 px-2.5 h-9 rounded-xl text-xs font-medium ${
                cameraMode === key ? 'bg-sky-500 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'
              }`}
              title={label}
            >
              <Icon size={14} />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
          <span className="w-px h-6 bg-slate-300 mx-1 hidden sm:block" />
          {/* segmen: atap / lantai */}
          <button
            onClick={() => setHideRoof(!hideRoof)}
            className={`flex items-center gap-1 px-2.5 h-9 rounded-xl text-xs font-medium ${hideRoof ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            title="Sembunyikan / tampilkan atap"
          >
            <EyeOff size={14} />
            <span className="hidden lg:inline">Atap</span>
          </button>
          {[0, 1, 2, 3].map((f) => (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={`px-2.5 h-9 rounded-xl text-xs font-bold ${selectedFloor === f ? 'bg-orange-500 text-white shadow' : 'bg-white text-slate-600 border border-slate-200'}`}
              title={f === 0 ? 'Semua lantai' : `Lantai ${f} saja`}
            >
              {f === 0 ? 'Semua' : `L${f}`}
            </button>
          ))}
        </div>
        {latest && (
          <button
            key={latest.id}
            onClick={() => setNav('activity')}
            title="Klik untuk membuka Aktivitas"
            className="ticker-in text-[11px] text-slate-600 truncate px-1 text-left hover:text-sky-700"
          >
            <span className="text-slate-400 font-mono">{fmtClock(latest.timeMin)}</span> · {latest.message}
            <span className="text-sky-600 font-semibold"> — lihat aktivitas →</span>
          </button>
        )}
      </div>
    </div>
  );
}
