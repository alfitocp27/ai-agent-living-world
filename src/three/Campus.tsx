// ─── Lingkungan kampus: jalan, taman, kolam, lapangan, gedung pendukung ────
// Semua aset procedural (box/cylinder/sphere + InstancedMesh pohon). Klik
// gedung mana pun untuk membuka detailnya di panel kanan.
//
// Penataan Fase B-3D (diaudit skrip /tmp/check-layout.mjs):
// - Gym pindah ke (28, 9.5): sebaris kafe (garis tengah z 9.5), bebas jalan.
// - Lapangan bola geser ke barat (-6, -24): bebas jalan vertikal.
// - Parkir aspal bermarkah di selatan kolam (17, 27) + jalan setapak paving
//   dari jalan vertikal utama ke parkir.
// - Warung Madura di (32, 5), timur gym, menghadap jalan utama.
// - Pohon: TIDAK ADA di jalan horizontal/vertikal, trotoar plaza, setapak.

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorld } from '../store';

const TREES: [number, number][] = [
  [-28, -22], [-24, -26], [12, -28], [14, -26], [-28, -8], [-30, 6],
  [-28, 26], [-24, 28], [2, 28], [-2, 30], [26, 6], [28, -6],
  [26, -26], [-20, -28], [-2, -32], [22, 31], [24, 14], [-30, -14],
  [12, -30], [-20, 28], [4, 30], [4, 16], [26, 16], [-28, 24],
  [33, 14], [14, 31],
];

function Trees() {
  const trunk = useRef<THREE.InstancedMesh>(null!);
  const leaves = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    TREES.forEach(([x, z], i) => {
      const s = 0.85 + ((i * 37) % 10) / 25;
      o.position.set(x, 0.7 * s, z);
      o.scale.setScalar(s);
      o.updateMatrix();
      trunk.current.setMatrixAt(i, o.matrix);
      o.position.set(x, 2.1 * s, z);
      o.updateMatrix();
      leaves.current.setMatrixAt(i, o.matrix);
    });
    trunk.current.instanceMatrix.needsUpdate = true;
    leaves.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group>
      <instancedMesh ref={trunk} args={[undefined, undefined, TREES.length]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.5, 7]} />
        <meshStandardMaterial color="#8a6d3b" />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, TREES.length]} castShadow>
        <sphereGeometry args={[1.05, 10, 8]} />
        <meshStandardMaterial color="#4d9e57" />
      </instancedMesh>
    </group>
  );
}

function Car({ x, z, color, rot = 0 }: { x: number; z: number; color: string; rot?: number }) {
  return (
    <group position={[x, 0.35, z]} rotation={[0, rot, 0]}>
      <mesh castShadow position={[0, 0.15, 0]}><boxGeometry args={[2, 0.55, 1]} /><meshStandardMaterial color={color} metalness={0.3} roughness={0.4} /></mesh>
      <mesh castShadow position={[-0.15, 0.55, 0]}><boxGeometry args={[1.1, 0.5, 0.9]} /><meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.3} /></mesh>
      {[[-0.7, 0.51], [0.7, 0.51], [-0.7, -0.51], [0.7, -0.51]].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, -0.05, cz]}><cylinderGeometry args={[0.28, 0.28, 0.15, 10]} /><meshStandardMaterial color="#111827" /></mesh>
      ))}
    </group>
  );
}

function MovingCar() {
  const ref = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.06;
    const z = ((t % 2) - 1) * 30;
    ref.current.position.set(8, 0.35, z);
    ref.current.rotation.y = t % 2 < 1 ? Math.PI / 2 : -Math.PI / 2;
  });
  return (
    <group ref={ref}>
      <mesh castShadow position={[0, 0.15, 0]}><boxGeometry args={[2, 0.55, 1]} /><meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} /></mesh>
      <mesh castShadow position={[-0.15, 0.55, 0]}><boxGeometry args={[1.1, 0.5, 0.9]} /><meshStandardMaterial color="#1e293b" /></mesh>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.5, 0]}><cylinderGeometry args={[0.07, 0.09, 3, 8]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0, 3.05, 0]}><sphereGeometry args={[0.22, 10, 8]} /><meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.8} /></mesh>
    </group>
  );
}

function Pool() {
  const water = useRef<THREE.Mesh>(null!);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    water.current.position.y = 0.34 + Math.sin(t * 1.4) * 0.02;
  });
  return (
    <group
      position={[18, 0, 19]}
      onClick={(e) => { e.stopPropagation(); selectBuilding('pool'); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh receiveShadow position={[0, 0.12, 0]}><boxGeometry args={[12, 0.25, 8]} /><meshStandardMaterial color="#e7d8b8" /></mesh>
      <mesh ref={water} position={[0, 0.34, 0]}><boxGeometry args={[10, 0.18, 6]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.85} roughness={0.15} /></mesh>
      {/* kursi santai + payung */}
      {[[-4.5, -2.8], [-4.5, 2.8], [4.5, -2.8], [4.5, 2.8]].map(([lx, lz], i) => (
        <group key={i} position={[lx, 0.3, lz]} rotation={[0, i % 2 ? 0.4 : -0.4, 0]}>
          <mesh><boxGeometry args={[1.8, 0.15, 0.7]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[0.9, 0.7, 0]}><cylinderGeometry args={[0.04, 0.04, 1.4, 6]} /><meshStandardMaterial color="#94a3b8" /></mesh>
          <mesh position={[0.9, 1.45, 0]}><coneGeometry args={[0.9, 0.4, 8]} /><meshStandardMaterial color="#fb923c" /></mesh>
        </group>
      ))}
    </group>
  );
}

const FIELD = { x: -6, z: -24 };

function FootballField() {
  const ball = useRef<THREE.Mesh>(null!);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ball.current.position.set(FIELD.x + Math.sin(t * 0.45) * 7, 0.25 + Math.abs(Math.sin(t * 1.8)) * 0.35, FIELD.z + Math.cos(t * 0.3) * 4);
  });
  const goal = (x: number) => (
    <group position={[x, 0, FIELD.z]}>
      <mesh position={[0, 1.1, -2.2]}><boxGeometry args={[0.12, 2.2, 0.12]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 1.1, 2.2]}><boxGeometry args={[0.12, 2.2, 0.12]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 2.2, 0]}><boxGeometry args={[0.12, 0.12, 4.5]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </group>
  );
  return (
    <group
      onClick={(e) => { e.stopPropagation(); selectBuilding('field'); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh receiveShadow position={[FIELD.x, 0.03, FIELD.z]}><boxGeometry args={[20, 0.06, 12]} /><meshStandardMaterial color="#5da24a" /></mesh>
      <mesh position={[FIELD.x, 0.07, FIELD.z]}><boxGeometry args={[0.15, 0.02, 12]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[FIELD.x, 0.07, FIELD.z - 5.9]}><boxGeometry args={[20, 0.02, 0.15]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[FIELD.x, 0.07, FIELD.z + 5.9]}><boxGeometry args={[20, 0.02, 0.15]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[FIELD.x, 0.07, FIELD.z]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.6, 0.07, 6, 24]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      {goal(FIELD.x - 9.9)}
      {goal(FIELD.x + 9.9)}
      <mesh ref={ball} castShadow><sphereGeometry args={[0.25, 12, 10]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </group>
  );
}

/** Air mancur plaza BERTINGKAT DUA — basin berbibir, pedestal, mangkuk atas
 *  dengan tirai air jatuh + percikan tersusun dalam cincin. */
function Fountain() {
  const water = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.04;
    water.current.scale.set(s, 1, s);
  });
  const dropsRing = (n: number, r: number, y: number, size: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return (
        <mesh key={`${r}-${i}`} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
          <sphereGeometry args={[size, 8, 6]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.9} />
        </mesh>
      );
    });
  return (
    <group position={[2, 0, 8.5]}>
      {/* basin bawah berbibir */}
      <mesh receiveShadow position={[0, 0.25, 0]}><cylinderGeometry args={[2.6, 2.8, 0.5, 24]} /><meshStandardMaterial color="#d6cfc0" /></mesh>
      <mesh position={[0, 0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[2.6, 0.12, 8, 24]} /><meshStandardMaterial color="#e8ddc9" /></mesh>
      <mesh ref={water} position={[0, 0.45, 0]}><cylinderGeometry args={[2.3, 2.3, 0.18, 24]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.85} /></mesh>
      {/* pedestal */}
      <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.35, 0.5, 1, 12]} /><meshStandardMaterial color="#e8ddc9" /></mesh>
      {/* mangkuk atas + tirai air jatuh */}
      <mesh position={[0, 1.65, 0]}><cylinderGeometry args={[1.3, 0.9, 0.35, 20]} /><meshStandardMaterial color="#d6cfc0" /></mesh>
      <mesh position={[0, 1.82, 0]}><cylinderGeometry args={[1.1, 1.1, 0.1, 20]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.85} /></mesh>
      <mesh position={[0, 1.15, 0]}><cylinderGeometry args={[1.15, 1.15, 0.9, 20, 1, true]} /><meshStandardMaterial color="#7dd3fc" transparent opacity={0.45} side={THREE.DoubleSide} /></mesh>
      {/* pancuran tengah + percikan cincin */}
      <mesh position={[0, 2.1, 0]}><sphereGeometry args={[0.3, 10, 8]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.9} /></mesh>
      {dropsRing(8, 1.95, 0.75, 0.09)}
      {dropsRing(6, 0.95, 2.0, 0.08)}
    </group>
  );
}

function SimpleBuilding({ id, x, z, w, h, d, color, roof }: { id: string; x: number; z: number; w: number; h: number; d: number; color: string; roof: string }) {
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const hideRoof = useWorld((s) => s.hideRoof);
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => { e.stopPropagation(); selectBuilding(id); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh castShadow position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} /></mesh>
      <mesh visible={!hideRoof} position={[0, h + 0.15, 0]}><boxGeometry args={[w + 0.4, 0.3, d + 0.4]} /><meshStandardMaterial color={roof} /></mesh>
    </group>
  );
}

function ServerRackMini({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 1, z]}>
      <mesh castShadow position={[0, 0, 0]}><boxGeometry args={[0.8, 2, 0.7]} /><meshStandardMaterial color="#1e293b" /></mesh>
      {[0.5, 0.9, 1.3, 1.7].map((hy) => (
        <mesh key={hy} position={[0, hy - 1, 0.36]}><boxGeometry args={[0.6, 0.08, 0.02]} /><meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} /></mesh>
      ))}
    </group>
  );
}

/** Gedung Server — menggantikan Research & Innovation Lab, posisi sama
 *  (17, -13). Dinding kaca depan: rak server menyala terlihat dari luar. */
function ServerBuilding() {
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const hideRoof = useWorld((s) => s.hideRoof);
  return (
    <group
      position={[17, 0, -13]}
      onClick={(e) => { e.stopPropagation(); selectBuilding('server'); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* pelat lantai + dinding (fasad depan kaca) */}
      <mesh receiveShadow position={[0, 0.1, 0]}><boxGeometry args={[12, 0.2, 10]} /><meshStandardMaterial color="#e8ddc9" /></mesh>
      <mesh castShadow position={[0, 3, -4.85]}><boxGeometry args={[12, 6, 0.3]} /><meshStandardMaterial color="#dbeafe" /></mesh>
      <mesh castShadow position={[-5.85, 3, 0]}><boxGeometry args={[0.3, 6, 10]} /><meshStandardMaterial color="#dbeafe" /></mesh>
      <mesh castShadow position={[5.85, 3, 0]}><boxGeometry args={[0.3, 6, 10]} /><meshStandardMaterial color="#dbeafe" /></mesh>
      <mesh position={[0, 3, 4.95]}><boxGeometry args={[12, 6, 0.1]} /><meshStandardMaterial color="#a8c8e8" transparent opacity={0.3} roughness={0.1} metalness={0.2} /></mesh>
      <mesh position={[0, 3, 4.98]}><boxGeometry args={[0.18, 6, 0.14]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[-3, 1.1, 5]}><boxGeometry args={[2.4, 2.2, 0.12]} /><meshStandardMaterial color="#334155" transparent opacity={0.6} /></mesh>
      {/* atap — ikut Buka Atap */}
      <mesh visible={!hideRoof} position={[0, 6.15, 0]}><boxGeometry args={[12.4, 0.3, 10.4]} /><meshStandardMaterial color="#64748b" /></mesh>
      {/* ventilasi atap */}
      <mesh visible={!hideRoof} position={[-3, 6.5, -2]}><boxGeometry args={[1.6, 0.6, 1.2]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh visible={!hideRoof} position={[3, 6.5, -2]}><boxGeometry args={[1.6, 0.6, 1.2]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      {/* dua baris rak server menyala */}
      {[-4, -2, 0, 2, 4].map((rx) => (
        <ServerRackMini key={`r1-${rx}`} x={rx} z={-3.2} />
      ))}
      {[-4, -2, 0, 2, 4].map((rx) => (
        <ServerRackMini key={`r2-${rx}`} x={rx} z={-1.2} />
      ))}
      {/* konsol monitoring — layar menyala di dinding timur */}
      <mesh position={[4.6, 1.6, 2]}><boxGeometry args={[0.08, 1.6, 2.4]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[4.55, 1.6, 2]}><boxGeometry args={[0.02, 1.4, 2.2]} /><meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.7} /></mesh>
      <mesh position={[3.8, 0.5, 2]}><boxGeometry args={[1.2, 0.9, 0.6]} /><meshStandardMaterial color="#334155" /></mesh>
      {/* unit pendingin di luar dinding timur + kipas */}
      {[-1, 1.5].map((az) => (
        <group key={az} position={[6.35, 1, az]}>
          <mesh castShadow><boxGeometry args={[0.7, 1.6, 1.4]} /><meshStandardMaterial color="#e2e8f0" /></mesh>
          <mesh position={[0.36, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}><cylinderGeometry args={[0.45, 0.45, 0.06, 16]} /><meshStandardMaterial color="#475569" /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Warung Madura — kios kelontong 24 jam di (32, 5), menghadap jalan utama.
 *  Papan nama + lampu gantung emissive tinggi dan TIDAK terikat isNight. */
function Warung() {
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const hideRoof = useWorld((s) => s.hideRoof);
  const goodsColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a855f7'];
  return (
    <group
      position={[32, 0, 5]}
      onClick={(e) => { e.stopPropagation(); selectBuilding('warung'); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh receiveShadow position={[0, 0.08, 0]}><boxGeometry args={[4, 0.15, 3]} /><meshStandardMaterial color="#d6cfc0" /></mesh>
      {/* dinding belakang + samping (depan terbuka menghadap jalan) */}
      <mesh castShadow position={[0, 1.3, 1.45]}><boxGeometry args={[4, 2.6, 0.15]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      <mesh castShadow position={[-1.95, 1.3, 0]}><boxGeometry args={[0.15, 2.6, 3]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      <mesh castShadow position={[1.95, 1.3, 0]}><boxGeometry args={[0.15, 2.6, 3]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      {/* atap — ikut Buka Atap */}
      <mesh visible={!hideRoof} castShadow position={[0, 2.7, 0]}><boxGeometry args={[4.4, 0.2, 3.4]} /><meshStandardMaterial color="#b45309" /></mesh>
      {/* papan nama menyala terus */}
      <mesh position={[0, 3.15, -1.45]}><boxGeometry args={[3.6, 0.7, 0.1]} /><meshStandardMaterial color="#7c2d12" emissive="#f97316" emissiveIntensity={1.6} /></mesh>
      <Html position={[0, 3.15, -1.38]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#fff7ed', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
          WARUNG MADURA<br />BUKA 24 JAM
        </div>
      </Html>
      {/* lampu gantung — tidak pernah padam */}
      <mesh position={[0, 2.45, -1.2]}><cylinderGeometry args={[0.02, 0.02, 0.5, 6]} /><meshStandardMaterial color="#334155" /></mesh>
      <mesh position={[0, 2.15, -1.2]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2.5} /></mesh>
      {/* etalase kaca berisi barang warna-warni */}
      <mesh position={[-0.8, 1.05, -0.6]}><boxGeometry args={[2.2, 1, 0.8]} /><meshStandardMaterial color="#bae6fd" transparent opacity={0.3} roughness={0.1} /></mesh>
      {goodsColors.map((c, i) => (
        <mesh key={i} position={[-1.6 + (i % 3) * 0.7, 0.85 + Math.floor(i / 3) * 0.35, -0.6]}>
          <boxGeometry args={[0.4, 0.28, 0.4]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
      {/* rak mie instan & camilan di dinding belakang */}
      {[1.2, 1.8].map((sy) => (
        <group key={sy}>
          <mesh position={[0, sy, 1.25]}><boxGeometry args={[3.2, 0.06, 0.4]} /><meshStandardMaterial color="#b08954" /></mesh>
          {goodsColors.slice(0, 5).map((c, i) => (
            <mesh key={i} position={[-1.2 + i * 0.6, sy + 0.2, 1.25]}>
              <boxGeometry args={[0.45, 0.32, 0.25]} />
              <meshStandardMaterial color={c} />
            </mesh>
          ))}
        </group>
      ))}
      {/* rentengan camilan menggantung di depan */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((hx, i) => (
        <group key={hx} position={[hx, 2.05, -1.35]}>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.015, 0.015, 0.4, 6]} /><meshStandardMaterial color="#94a3b8" /></mesh>
          {[0, -0.28, -0.56].map((dy) => (
            <mesh key={dy} position={[0, dy, 0]}>
              <boxGeometry args={[0.3, 0.24, 0.06]} />
              <meshStandardMaterial color={goodsColors[(i + Math.round(-dy * 10)) % goodsColors.length]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* kulkas minuman */}
      <mesh position={[1.5, 0.95, 1]}><boxGeometry args={[0.9, 1.9, 0.7]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[1.5, 0.95, 0.63]}><boxGeometry args={[0.7, 1.6, 0.04]} /><meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.5} /></mesh>
      {/* konter */}
      <mesh castShadow position={[0, 0.45, -1.2]}><boxGeometry args={[3.6, 0.9, 0.5]} /><meshStandardMaterial color="#b08954" /></mesh>
      {/* bangku bundar + bangku panjang di depan */}
      <group position={[-1.2, 0, -2]}>
        <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.28, 0.28, 0.06, 12]} /><meshStandardMaterial color="#f59e0b" /></mesh>
        <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.05, 0.05, 0.45, 8]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      </group>
      <group position={[1.1, 0, -2.1]}>
        <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.6, 0.08, 0.4]} /><meshStandardMaterial color="#b08954" /></mesh>
        <mesh position={[-0.6, 0.22, 0]}><boxGeometry args={[0.08, 0.45, 0.35]} /><meshStandardMaterial color="#8a6d3b" /></mesh>
        <mesh position={[0.6, 0.22, 0]}><boxGeometry args={[0.08, 0.45, 0.35]} /><meshStandardMaterial color="#8a6d3b" /></mesh>
      </group>
    </group>
  );
}

/** Badge nama melayang di atas gedung (Html, pointer-events none → klik lolos). */
function Badge({ x, y, z, label }: { x: number; y: number; z: number; label: string }) {
  return (
    <Html position={[x, y, z]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div style={{ background: 'rgba(15,23,42,0.88)', color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        {label}
      </div>
    </Html>
  );
}

export default function Campus() {
  const hideRoof = useWorld((s) => s.hideRoof);
  return (
    <group>
      {/* tanah */}
      <mesh receiveShadow position={[0, -0.28, 0]}><boxGeometry args={[70, 0.55, 70]} /><meshStandardMaterial color="#79a85b" /></mesh>
      {/* jalan */}
      <mesh receiveShadow position={[0, 0.02, 1]}><boxGeometry args={[68, 0.05, 4]} /><meshStandardMaterial color="#4b5563" /></mesh>
      <mesh receiveShadow position={[8, 0.02, 0]}><boxGeometry args={[5, 0.05, 68]} /><meshStandardMaterial color="#4b5563" /></mesh>
      <mesh position={[0, 0.05, 1]}><boxGeometry args={[68, 0.02, 0.18]} /><meshStandardMaterial color="#fde68a" /></mesh>
      {/* trotoar plaza */}
      <mesh receiveShadow position={[0, 0.04, 9]}><boxGeometry args={[14, 0.06, 8]} /><meshStandardMaterial color="#e8ddc9" /></mesh>

      <Trees />
      <Fountain />
      <Pool />
      <FootballField />

      {/* danau + jembatan */}
      <mesh position={[28, 0.05, 25]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[5.5, 24]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.9} /></mesh>
      <mesh castShadow position={[22.5, 0.35, 25]}><boxGeometry args={[2.2, 0.18, 4]} /><meshStandardMaterial color="#b08954" /></mesh>
      <mesh position={[22.5, 0.7, 23.2]}><boxGeometry args={[0.1, 0.7, 4]} /><meshStandardMaterial color="#8a6d3b" /></mesh>
      <mesh position={[22.5, 0.7, 26.8]}><boxGeometry args={[0.1, 0.7, 4]} /><meshStandardMaterial color="#8a6d3b" /></mesh>

      {/* gedung pendukung */}
      <ServerBuilding />
      <SimpleBuilding id="gym" x={28} z={9.5} w={8} h={4} d={6} color="#fef3c7" roof="#f59e0b" />
      <SimpleBuilding id="cafe" x={16} z={9.5} w={10} h={3.5} d={7} color="#fff7ed" roof="#fb923c" />
      {/* teras kafe */}
      {[14, 17, 20].map((tx) => (
        <group key={tx} position={[tx, 0, 14.5]}>
          <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.55, 0.55, 0.06, 12]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.05, 0.05, 0.75, 8]} /><meshStandardMaterial color="#94a3b8" /></mesh>
        </group>
      ))}

      {/* apartemen A & B */}
      <group position={[-20, 0, 15]}>
        <mesh castShadow position={[0, 4.5, 0]}><boxGeometry args={[12, 9, 10]} /><meshStandardMaterial color="#fde68a" /></mesh>
        <mesh visible={!hideRoof} position={[0, 9.15, 0]}><boxGeometry args={[12.4, 0.3, 10.4]} /><meshStandardMaterial color="#b45309" /></mesh>
        {[-4, 0, 4].map((wx) => [1.8, 4.8, 7.8].map((wy) => (
          <mesh key={`${wx}-${wy}`} position={[wx, wy, 5.05]}><boxGeometry args={[1.6, 1.2, 0.06]} /><meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.35} /></mesh>
        )))}
      </group>
      <group position={[-5, 0, 16]}>
        <mesh castShadow position={[0, 4, 0]}><boxGeometry args={[12, 8, 8]} /><meshStandardMaterial color="#e0e7ff" /></mesh>
        <mesh visible={!hideRoof} position={[0, 8.15, 0]}><boxGeometry args={[12.4, 0.3, 8.4]} /><meshStandardMaterial color="#4338ca" /></mesh>
        {[-4, 0, 4].map((wx) => [1.8, 4.5, 7].map((wy) => (
          <mesh key={`${wx}-${wy}`} position={[wx, wy, 4.05]}><boxGeometry args={[1.6, 1.2, 0.06]} /><meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.35} /></mesh>
        )))}
      </group>

      {/* warung Madura */}
      <Warung />

      {/* lahan parkir aspal bermarkah di selatan kolam (17, 27) */}
      <group>
        <mesh receiveShadow position={[17, 0.03, 27]}><boxGeometry args={[10, 0.06, 6]} /><meshStandardMaterial color="#374151" /></mesh>
        {[13.5, 16, 18.5, 21].map((lx) => (
          <mesh key={lx} position={[lx, 0.07, 27]}><boxGeometry args={[0.12, 0.02, 5]} /><meshStandardMaterial color="#f8fafc" /></mesh>
        ))}
        <Car x={14.75} z={27} color="#ef4444" rot={Math.PI / 2} />
        <Car x={17.25} z={27} color="#3b82f6" rot={Math.PI / 2} />
        <Car x={19.75} z={27} color="#22c55e" rot={Math.PI / 2} />
      </group>
      {/* jalan setapak paving: jalan vertikal utama → lahan parkir */}
      <mesh receiveShadow position={[8.75, 0.05, 26.5]}><boxGeometry args={[6.5, 0.05, 2]} /><meshStandardMaterial color="#d6cfc0" /></mesh>

      {/* kendaraan bergerak di jalan vertikal */}
      <MovingCar />

      {/* lampu jalan */}
      <Lamp x={-20} z={3.6} /><Lamp x={-10} z={3.6} /><Lamp x={0} z={3.6} />
      <Lamp x={14} z={3.6} /><Lamp x={24} z={3.6} /><Lamp x={10.8} z={-14} />

      {/* pagar & gerbang selatan */}
      <mesh position={[-18, 0.6, 32]}><boxGeometry args={[32, 1.1, 0.15]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      <mesh position={[18, 0.6, 32]}><boxGeometry args={[32, 1.1, 0.15]} /><meshStandardMaterial color="#94a3b8" /></mesh>
      {[[-2.2, 32], [2.2, 32]].map(([gx, gz]) => (
        <mesh key={gx} position={[gx, 1, gz]}><boxGeometry args={[0.4, 2, 0.4]} /><meshStandardMaterial color="#475569" /></mesh>
      ))}

      {/* badge nama gedung — tetap terlihat saat atap dibuka */}
      <Badge x={17} y={7.6} z={-13} label="Gedung Server" />
      <Badge x={-12.5} y={11.2} z={15.5} label="Apartemen" />
      <Badge x={16} y={5.2} z={9.5} label="Kafe & Resto" />
      <Badge x={28} y={5.7} z={9.5} label="Gym" />
      <Badge x={18} y={2.2} z={19} label="Kolam Renang" />
      <Badge x={-6} y={2.2} z={-24} label="Lapangan Bola" />
      <Badge x={32} y={4.8} z={5} label="Warung Madura" />
    </group>
  );
}
