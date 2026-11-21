// ─── Gedung Kantor Pusat — 3 lantai, interior detail (Fase B-3D) ──────────
// L1: lobby/reception + ruang meeting (tanpa meja kerja). L2: SATU lantai
// kerja — 22 meja (Workspace 8, Programmer 8, Desain 6) + Ruang Manager di
// sudut tenggara. L3: kosong/cadangan (hanya pelat lantai). Atap disembunyi-
// kan saat memilih lantai tertentu (store.selectedFloor) atau Buka Atap.

import { Html } from '@react-three/drei';
import { useWorld } from '../store';

const WOOD = '#b08954';
const WOOD_DARK = '#8a6d3b';
const WALL = '#f5efe4';
const GLASS = '#a8c8e8';
const WHITE = '#ffffff';

function Desk({ x, z, y = 0, rot = 0 }: { x: number; z: number; y?: number; rot?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh castShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[1.7, 0.08, 0.85]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      <mesh position={[-0.75, 0.2, 0]}><boxGeometry args={[0.07, 0.4, 0.75]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      <mesh position={[0.75, 0.2, 0]}><boxGeometry args={[0.07, 0.4, 0.75]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      {/* monitor */}
      <mesh castShadow position={[0, 0.72, -0.18]}>
        <boxGeometry args={[0.62, 0.4, 0.05]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.72, -0.15]}>
        <boxGeometry args={[0.56, 0.34, 0.01]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.48, 0.05]}><boxGeometry args={[0.5, 0.03, 0.22]} /><meshStandardMaterial color="#334155" /></mesh>
      {/* kursi */}
      <group position={[0, 0, 0.85]}>
        <mesh castShadow position={[0, 0.32, 0]}><boxGeometry args={[0.5, 0.08, 0.5]} /><meshStandardMaterial color="#475569" /></mesh>
        <mesh position={[0, 0.62, 0.24]}><boxGeometry args={[0.5, 0.6, 0.07]} /><meshStandardMaterial color="#475569" /></mesh>
        <mesh position={[0, 0.15, 0]}><boxGeometry args={[0.07, 0.3, 0.07]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      </group>
    </group>
  );
}

/** Meja eksekutif: top lebih lebar, dual monitor + laptop + kursi eksekutif. */
function ExecDesk({ x, z, y = 0, rot = 0 }: { x: number; z: number; y?: number; rot?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[2.4, 0.1, 1.1]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      <mesh position={[-1.05, 0.22, 0]}><boxGeometry args={[0.09, 0.45, 1]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      <mesh position={[1.05, 0.22, 0]}><boxGeometry args={[0.09, 0.45, 1]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      {/* dual monitor */}
      {[-0.55, 0.55].map((mx) => (
        <group key={mx} position={[mx, 0, 0]}>
          <mesh castShadow position={[0, 0.8, -0.3]}>
            <boxGeometry args={[0.62, 0.4, 0.05]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.8, -0.27]}>
            <boxGeometry args={[0.56, 0.34, 0.01]} />
            <meshStandardMaterial color="#7dd3fc" emissive="#38bdf8" emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}
      {/* laptop */}
      <mesh position={[0, 0.53, 0.18]}><boxGeometry args={[0.42, 0.03, 0.3]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0, 0.62, 0.05]} rotation={[-0.35, 0, 0]}><boxGeometry args={[0.42, 0.28, 0.02]} /><meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.5} /></mesh>
      {/* kursi eksekutif */}
      <group position={[0, 0, 1]}>
        <mesh castShadow position={[0, 0.35, 0]}><boxGeometry args={[0.6, 0.09, 0.55]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        <mesh position={[0, 0.85, 0.26]}><boxGeometry args={[0.6, 0.95, 0.08]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        <mesh position={[0, 0.16, 0]}><boxGeometry args={[0.08, 0.32, 0.08]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      </group>
    </group>
  );
}

function Plant({ x, z, y = 0, s = 1 }: { x: number; z: number; y?: number; s?: number }) {
  return (
    <group position={[x, y, z]} scale={s}>
      <mesh castShadow position={[0, 0.18, 0]}><cylinderGeometry args={[0.16, 0.12, 0.36, 10]} /><meshStandardMaterial color="#c2703d" /></mesh>
      <mesh castShadow position={[0, 0.62, 0]}><sphereGeometry args={[0.32, 10, 8]} /><meshStandardMaterial color="#4d9e57" /></mesh>
      <mesh position={[0.18, 0.45, 0.1]}><sphereGeometry args={[0.2, 8, 6]} /><meshStandardMaterial color="#5cb85f" /></mesh>
    </group>
  );
}

function CeilingLight({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <mesh position={[x, y, z]}>
      <boxGeometry args={[1.4, 0.06, 0.35]} />
      <meshStandardMaterial color="#fff7d6" emissive="#fef08a" emissiveIntensity={0.9} />
    </mesh>
  );
}

/** Meja meeting — 4 kursi (2 per sisi). */
function MeetingTable({ x, z, y = 0 }: { x: number; z: number; y?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0.45, 0]}><boxGeometry args={[3.2, 0.1, 1.5]} /><meshStandardMaterial color={WOOD} /></mesh>
      <mesh position={[-1.4, 0.22, 0]}><boxGeometry args={[0.1, 0.45, 1.3]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      <mesh position={[1.4, 0.22, 0]}><boxGeometry args={[0.1, 0.45, 1.3]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      {[[-1, -1.05], [1, -1.05], [-1, 1.05], [1, 1.05]].map(([cx, cz], i) => (
        <group key={i} position={[cx, 0, cz]}>
          <mesh position={[0, 0.32, 0]}><boxGeometry args={[0.45, 0.07, 0.45]} /><meshStandardMaterial color="#64748b" /></mesh>
          <mesh position={[0, 0.6, cz > 0 ? 0.2 : -0.2]}><boxGeometry args={[0.45, 0.55, 0.06]} /><meshStandardMaterial color="#64748b" /></mesh>
        </group>
      ))}
      {/* layar meeting */}
      <mesh position={[0, 1.1, -0.85]}><boxGeometry args={[1.8, 1, 0.06]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0, 1.1, -0.81]}><boxGeometry args={[1.7, 0.9, 0.01]} /><meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.5} /></mesh>
    </group>
  );
}

function FloorSlab({ y, visible }: { y: number; visible: boolean }) {
  return (
    <group visible={visible}>
      <mesh receiveShadow position={[-8, y, -10]}>
        <boxGeometry args={[22, 0.3, 14]} />
        <meshStandardMaterial color="#e8ddc9" />
      </mesh>
    </group>
  );
}

/** Ruang Manager — sudut tenggara L2 (x -2..2.7, z -6.5..-3.2). */
function ManagerRoom() {
  return (
    <group>
      {/* dinding utara (z=-6.5) */}
      <mesh castShadow position={[0.35, 4.85, -6.5]}><boxGeometry args={[4.7, 3, 0.15]} /><meshStandardMaterial color={WALL} /></mesh>
      {/* dinding barat (x=-2) dengan celah pintu z -5.6..-4.6 */}
      <mesh castShadow position={[-2, 4.85, -6.05]}><boxGeometry args={[0.15, 3, 0.9]} /><meshStandardMaterial color={WALL} /></mesh>
      <mesh castShadow position={[-2, 4.85, -3.9]}><boxGeometry args={[0.15, 3, 1.4]} /><meshStandardMaterial color={WALL} /></mesh>
      {/* daun pintu terbuka */}
      <mesh position={[-1.55, 4.3, -5.15]} rotation={[0, 0.9, 0]}><boxGeometry args={[0.06, 2.2, 0.95]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      {/* karpet */}
      <mesh receiveShadow position={[0.35, 3.22, -4.8]}><boxGeometry args={[3.6, 0.04, 2.4]} /><meshStandardMaterial color="#991b1b" /></mesh>
      {/* papan perencanaan (whiteboard besar) di dinding utara */}
      <mesh position={[0.35, 4.9, -6.4]}><boxGeometry args={[2.8, 1.3, 0.06]} /><meshStandardMaterial color={WHITE} /></mesh>
      <mesh position={[0.35, 4.9, -6.36]}><boxGeometry args={[2.4, 0.95, 0.02]} /><meshStandardMaterial color="#dbeafe" /></mesh>
      {/* coretan rencana di whiteboard */}
      <mesh position={[-0.3, 5.05, -6.34]}><boxGeometry args={[0.9, 0.06, 0.01]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[-0.3, 4.85, -6.34]}><boxGeometry args={[0.6, 0.06, 0.01]} /><meshStandardMaterial color="#2563eb" /></mesh>
      <mesh position={[0.9, 4.95, -6.34]}><boxGeometry args={[0.5, 0.5, 0.01]} /><meshStandardMaterial color="#16a34a" /></mesh>
      {/* meja eksekutif manager (Bimo) menghadap whiteboard */}
      <ExecDesk x={0.5} z={-4.8} y={3.2} />
    </group>
  );
}

export default function Headquarters() {
  const selectedFloor = useWorld((s) => s.selectedFloor);
  const hideRoof = useWorld((s) => s.hideRoof);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const show = (f: number) => selectedFloor === 0 || selectedFloor === f;
  const roofVisible = !hideRoof && selectedFloor === 0;

  const wall = (x: number, y: number, z: number, w: number, d: number, key: string, mat: string = WALL) => (
    <mesh key={key} castShadow position={[x, y, z]}>
      <boxGeometry args={[w, 3, d]} />
      <meshStandardMaterial color={mat} />
    </mesh>
  );

  const click = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectBuilding('hq');
  };

  return (
    <group
      onClick={click}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* badge nama gedung — rapat di atas atap (±11.6, puncak atap ±10.4) */}
      <Html position={[-8, 11.6, -10]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(15,23,42,0.88)', color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          Kantor Pusat
        </div>
      </Html>

      {/* ── Lantai 1 — Lobby + Ruang Meeting (tanpa meja kerja) ── */}
      <FloorSlab y={-0.15} visible />
      <group visible={show(1)}>
        {wall(-8, 1.65, -16.85, 22, 0.3, 'w1b')}
        {wall(-18.85, 1.65, -10, 0.3, 14, 'w1w')}
        {wall(2.85, 1.65, -10, 0.3, 14, 'w1e')}
        {/* fasad kaca depan */}
        <mesh position={[-8, 1.6, -3.05]}>
          <boxGeometry args={[22, 2.7, 0.1]} />
          <meshStandardMaterial color={GLASS} transparent opacity={0.3} roughness={0.1} metalness={0.2} />
        </mesh>
        {[-16, -11, -6, -1].map((mx) => (
          <mesh key={mx} position={[mx, 1.6, -3.05]}><boxGeometry args={[0.18, 2.7, 0.16]} /><meshStandardMaterial color={WHITE} /></mesh>
        ))}
        {/* pintu masuk + kanopi */}
        <mesh position={[-8, 1.1, -2.9]}><boxGeometry args={[2.4, 2.2, 0.12]} /><meshStandardMaterial color="#334155" transparent opacity={0.6} /></mesh>
        <mesh castShadow position={[-8, 2.5, -2.2]}><boxGeometry args={[4, 0.15, 1.6]} /><meshStandardMaterial color={WOOD} /></mesh>
        {/* partisi ruang meeting (kaca) */}
        <mesh position={[-2, 1.65, -6]}><boxGeometry args={[0.12, 3, 4.6]} /><meshStandardMaterial color={GLASS} transparent opacity={0.35} /></mesh>
        {/* reception */}
        <mesh castShadow position={[-15, 0.55, -5]}><boxGeometry args={[3.4, 1.1, 0.8]} /><meshStandardMaterial color={WHITE} /></mesh>
        <mesh position={[-15, 1.15, -5]}><boxGeometry args={[3.5, 0.08, 0.9]} /><meshStandardMaterial color={WOOD} /></mesh>
        <mesh position={[-11.5, 0.4, -5]}><boxGeometry args={[1.8, 0.8, 0.8]} /><meshStandardMaterial color="#f59e0b" /></mesh>
        <mesh position={[-11.5, 0.85, -5]}><boxGeometry args={[1.7, 0.12, 0.7]} /><meshStandardMaterial color="#fde68a" /></mesh>
        <Plant x={-18} z={-4.5} />
        <Plant x={2} z={-4.5} />
        <Plant x={-18} z={-15.5} />
        <MeetingTable x={0.8} z={-6.5} />
        <CeilingLight x={-12} z={-8} y={3.05} />
        <CeilingLight x={-4} z={-8} y={3.05} />
        <CeilingLight x={-12} z={-14} y={3.05} />
      </group>

      {/* ── Lantai 2 — SATU lantai kerja: 22 meja ──
          Programmer 8 (barat, z -14 & -11) · Desain 6 (tengah-timur, z -14 & -11)
          Workspace 8 (selatan, z -7.5 & -4.8; Nara di meja eksekutif -4.5,-7.5)
          Ruang Manager di sudut tenggara. Jarak antar meja ≥ 2 m. */}
      <FloorSlab y={3.05} visible={show(2)} />
      <group visible={show(2)}>
        {wall(-8, 4.85, -16.85, 22, 0.3, 'w2b')}
        {wall(-18.85, 4.85, -10, 0.3, 14, 'w2w')}
        {wall(2.85, 4.85, -10, 0.3, 14, 'w2e')}
        <mesh position={[-8, 4.8, -3.05]}>
          <boxGeometry args={[22, 2.7, 0.1]} />
          <meshStandardMaterial color={GLASS} transparent opacity={0.3} roughness={0.1} metalness={0.2} />
        </mesh>
        {/* Programmer — 8 meja */}
        {[-17, -14.5, -12, -9.5].map((dx) => (
          <Desk key={`p1-${dx}`} x={dx} z={-14} y={3.2} />
        ))}
        {[-17, -14.5, -12, -9.5].map((dx) => (
          <Desk key={`p2-${dx}`} x={dx} z={-11} y={3.2} rot={Math.PI} />
        ))}
        {/* Desain — 6 meja */}
        {[-3.5, -1, 1.5].map((dx) => (
          <Desk key={`d1-${dx}`} x={dx} z={-14} y={3.2} />
        ))}
        {[-3.5, -1, 1.5].map((dx) => (
          <Desk key={`d2-${dx}`} x={dx} z={-11} y={3.2} rot={Math.PI} />
        ))}
        {/* Workspace — 7 meja biasa + 1 meja eksekutif (Nara) */}
        {[-17, -14.5, -12, -9.5, -7].map((dx) => (
          <Desk key={`w1-${dx}`} x={dx} z={-7.5} y={3.2} />
        ))}
        <ExecDesk x={-4.5} z={-7.5} y={3.2} />
        {[-17, -14.5].map((dx) => (
          <Desk key={`w2-${dx}`} x={dx} z={-4.8} y={3.2} rot={Math.PI} />
        ))}
        {/* layar command center (pindah dari L3) di dinding belakang */}
        <mesh position={[-5.5, 5, -16.6]}><boxGeometry args={[4, 1.6, 0.08]} /><meshStandardMaterial color="#0f172a" /></mesh>
        <mesh position={[-5.5, 5, -16.55]}><boxGeometry args={[3.8, 1.4, 0.02]} /><meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.6} /></mesh>
        <ManagerRoom />
        <Plant x={2} z={-15.5} y={3.2} />
        <Plant x={-18} z={-4.5} y={3.2} />
        <CeilingLight x={-12} z={-10} y={6.25} />
        <CeilingLight x={-3} z={-10} y={6.25} />
      </group>

      {/* ── Lantai 3 — kosong/cadangan: hanya pelat lantai (teras) ── */}
      <FloorSlab y={6.25} visible={show(3)} />
      <group visible={show(3)}>
        <Plant x={-16} z={-14} y={6.4} />
        <Plant x={0} z={-5} y={6.4} />
      </group>

      {/* ── Atap + rooftop ── */}
      <group visible={roofVisible}>
        <mesh castShadow position={[-8, 9.6, -10]}><boxGeometry args={[22.6, 0.35, 14.6]} /><meshStandardMaterial color="#d6cfc0" /></mesh>
        <mesh position={[-8, 9.95, -10]}><boxGeometry args={[22.6, 0.5, 0.25]} /><meshStandardMaterial color="#b8ad94" /></mesh>
        <mesh position={[-16, 10, -14]}><boxGeometry args={[1.6, 0.9, 1.2]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        <mesh position={[-12, 10, -14]}><boxGeometry args={[1.6, 0.9, 1.2]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        <mesh position={[0, 9.95, -6]}><boxGeometry args={[3, 0.5, 2]} /><meshStandardMaterial color="#4d9e57" /></mesh>
        <mesh position={[0, 10.4, -6]}><sphereGeometry args={[0.7, 8, 6]} /><meshStandardMaterial color="#5cb85f" /></mesh>
      </group>

      {/* lift shaft dekoratif */}
      <mesh castShadow position={[-18, 4.8, -15.5]}><boxGeometry args={[2, 9.6, 2]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
      <mesh position={[-17, 1.2, -14.45]}><boxGeometry args={[1.2, 2, 0.08]} /><meshStandardMaterial color="#64748b" /></mesh>
    </group>
  );
}
