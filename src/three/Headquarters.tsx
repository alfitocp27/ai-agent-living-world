// ─── Gedung Kantor Pusat — 3 lantai, interior detail (Fase 1) ──────────────
// L1: lobby/reception, open workspace, ruang meeting. L2: programmer, UI/UX.
// L3: CEO, PM, command center. Atap & lantai atas disembunyikan saat memilih
// lantai tertentu (store.selectedFloor) agar interior terlihat.

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

function MeetingTable({ x, z, y = 0 }: { x: number; z: number; y?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 0.45, 0]}><boxGeometry args={[3.2, 0.1, 1.5]} /><meshStandardMaterial color={WOOD} /></mesh>
      <mesh position={[-1.4, 0.22, 0]}><boxGeometry args={[0.1, 0.45, 1.3]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      <mesh position={[1.4, 0.22, 0]}><boxGeometry args={[0.1, 0.45, 1.3]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
      {[[-1, -1.05], [0, -1.05], [1, -1.05], [-1, 1.05], [0, 1.05], [1, 1.05]].map(([cx, cz], i) => (
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

function ServerRack({ x, z, y = 0 }: { x: number; z: number; y?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh castShadow position={[0, 1, 0]}><boxGeometry args={[0.8, 2, 0.7]} /><meshStandardMaterial color="#1e293b" /></mesh>
      {[0.5, 0.9, 1.3, 1.7].map((hy) => (
        <mesh key={hy} position={[0, hy, 0.36]}><boxGeometry args={[0.6, 0.08, 0.02]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} /></mesh>
      ))}
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
      {/* ── Lantai 1 — Lobby, Open Workspace, Meeting ── */}
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
        <Desk x={-14} z={-11} rot={Math.PI} />
        <Desk x={-8} z={-11} rot={Math.PI} />
        <Desk x={-4} z={-11} rot={Math.PI} />
        <Desk x={-1} z={-11} rot={Math.PI} />
        <Desk x={-11} z={-14} />
        <Desk x={-6} z={-14} />
        <MeetingTable x={0.8} z={-6.5} />
        <CeilingLight x={-12} z={-8} y={3.05} />
        <CeilingLight x={-4} z={-8} y={3.05} />
        <CeilingLight x={-12} z={-14} y={3.05} />
      </group>

      {/* ── Lantai 2 — Programmer & UI/UX ── */}
      <FloorSlab y={3.05} visible={show(2)} />
      <group visible={show(2)}>
        {wall(-8, 4.85, -16.85, 22, 0.3, 'w2b')}
        {wall(-18.85, 4.85, -10, 0.3, 14, 'w2w')}
        {wall(2.85, 4.85, -10, 0.3, 14, 'w2e')}
        <mesh position={[-8, 4.8, -3.05]}>
          <boxGeometry args={[22, 2.7, 0.1]} />
          <meshStandardMaterial color={GLASS} transparent opacity={0.3} roughness={0.1} metalness={0.2} />
        </mesh>
        <mesh position={[-8, 4.85, -10]}><boxGeometry args={[0.15, 3, 7]} /><meshStandardMaterial color={WALL} /></mesh>
        <Desk x={-16} z={-12} y={3.2} />
        <Desk x={-13} z={-12} y={3.2} />
        <Desk x={-16} z={-8} y={3.2} rot={Math.PI} />
        <Desk x={-13} z={-8} y={3.2} rot={Math.PI} />
        <Desk x={-3} z={-12} y={3.2} />
        <Desk x={0} z={-12} y={3.2} />
        <Desk x={-3} z={-8} y={3.2} rot={Math.PI} />
        <Desk x={0} z={-8} y={3.2} rot={Math.PI} />
        {/* whiteboard desain */}
        <mesh position={[-5, 4.6, -16.6]}><boxGeometry args={[3, 1.4, 0.06]} /><meshStandardMaterial color={WHITE} /></mesh>
        <mesh position={[-5, 4.6, -16.56]}><boxGeometry args={[2.6, 1, 0.02]} /><meshStandardMaterial color="#dbeafe" /></mesh>
        <Plant x={2} z={-15.5} y={3.2} />
        <Plant x={-18} z={-4.5} y={3.2} />
        <CeilingLight x={-12} z={-10} y={6.25} />
        <CeilingLight x={-3} z={-10} y={6.25} />
      </group>

      {/* ── Lantai 3 — CEO, PM, Command Center ── */}
      <FloorSlab y={6.25} visible={show(3)} />
      <group visible={show(3)}>
        {wall(-8, 8.05, -16.85, 22, 0.3, 'w3b')}
        {wall(-18.85, 8.05, -10, 0.3, 14, 'w3w')}
        {wall(2.85, 8.05, -10, 0.3, 14, 'w3e')}
        <mesh position={[-8, 8, -3.05]}>
          <boxGeometry args={[22, 2.7, 0.1]} />
          <meshStandardMaterial color={GLASS} transparent opacity={0.3} roughness={0.1} metalness={0.2} />
        </mesh>
        {/* balkon L3 */}
        <mesh receiveShadow position={[-8, 6.45, -1.9]}><boxGeometry args={[22, 0.2, 2.2]} /><meshStandardMaterial color="#d9c9a8" /></mesh>
        {[-18, -8, 2].map((bx) => (
          <mesh key={bx} position={[bx, 7.05, -0.85]}><boxGeometry args={[0.12, 1, 0.12]} /><meshStandardMaterial color="#64748b" /></mesh>
        ))}
        <mesh position={[-8, 7.5, -0.85]}><boxGeometry args={[22, 0.08, 0.08]} /><meshStandardMaterial color="#64748b" /></mesh>
        {/* CEO */}
        <mesh castShadow position={[-16, 6.85, -14]}><boxGeometry args={[2.6, 0.12, 1.2]} /><meshStandardMaterial color={WOOD_DARK} /></mesh>
        <mesh position={[-16, 6.85, -12.6]}><boxGeometry args={[2.2, 0.9, 0.9]} /><meshStandardMaterial color="#7c2d12" /></mesh>
        <Desk x={-6} z={-14} y={6.4} />
        <Desk x={-2} z={-14} y={6.4} />
        <ServerRack x={1.2} z={-15.5} y={6.4} />
        <ServerRack x={1.2} z={-14.2} y={6.4} />
        {/* layar command center */}
        <mesh position={[-8, 7.9, -16.6]}><boxGeometry args={[4, 1.6, 0.08]} /><meshStandardMaterial color="#0f172a" /></mesh>
        <mesh position={[-8, 7.9, -16.55]}><boxGeometry args={[3.8, 1.4, 0.02]} /><meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.6} /></mesh>
        <Plant x={2} z={-4.5} y={6.4} />
        <Plant x={-18} z={-4.5} y={6.4} />
        <CeilingLight x={-12} z={-10} y={9.45} />
        <CeilingLight x={-3} z={-10} y={9.45} />
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
