// ─── Lingkungan kampus: jalan, taman, kolam, lapangan, gedung pendukung ────
// Semua aset procedural (box/cylinder/sphere + InstancedMesh pohon). Klik
// gedung mana pun untuk membuka detailnya di panel kanan.

import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../store';

const TREES: [number, number][] = [
  [-28, -22], [-24, -26], [8, -28], [14, -26], [-28, -8], [-30, 6],
  [-28, 26], [-24, 28], [6, 26], [10, 28], [26, 6], [28, -2],
  [26, -26], [-14, -28], [-6, -30], [20, 26], [24, 10], [-30, -14],
  [12, -30], [-20, 28], [4, 30], [4, 16], [26, 16], [-28, 24],
  [30, 12], [14, 30],
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

function FootballField() {
  const ball = useRef<THREE.Mesh>(null!);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ball.current.position.set(Math.sin(t * 0.45) * 7, 0.25 + Math.abs(Math.sin(t * 1.8)) * 0.35, -24 + Math.cos(t * 0.3) * 4);
  });
  const goal = (x: number) => (
    <group position={[x, 0, -24]}>
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
      <mesh receiveShadow position={[0, 0.03, -24]}><boxGeometry args={[20, 0.06, 12]} /><meshStandardMaterial color="#5da24a" /></mesh>
      <mesh position={[0, 0.07, -24]}><boxGeometry args={[0.15, 0.02, 12]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 0.07, -18.1]}><boxGeometry args={[20, 0.02, 0.15]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 0.07, -29.9]}><boxGeometry args={[20, 0.02, 0.15]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 0.07, -24]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.6, 0.07, 6, 24]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      {goal(-9.9)}
      {goal(9.9)}
      <mesh ref={ball} castShadow><sphereGeometry args={[0.25, 12, 10]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </group>
  );
}

function Fountain() {
  const water = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.04;
    water.current.scale.set(s, 1, s);
  });
  return (
    <group position={[2, 0, 8.5]}>
      <mesh receiveShadow position={[0, 0.25, 0]}><cylinderGeometry args={[2.6, 2.8, 0.5, 20]} /><meshStandardMaterial color="#d6cfc0" /></mesh>
      <mesh ref={water} position={[0, 0.45, 0]}><cylinderGeometry args={[2.3, 2.3, 0.18, 20]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.85} /></mesh>
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.3, 0.45, 1, 12]} /><meshStandardMaterial color="#e8ddc9" /></mesh>
      <mesh position={[0, 1.55, 0]}><sphereGeometry args={[0.35, 10, 8]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.9} /></mesh>
    </group>
  );
}

function SimpleBuilding({ id, x, z, w, h, d, color, roof }: { id: string; x: number; z: number; w: number; h: number; d: number; color: string; roof: string }) {
  const selectBuilding = useWorld((s) => s.selectBuilding);
  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => { e.stopPropagation(); selectBuilding(id); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <mesh castShadow position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, h + 0.15, 0]}><boxGeometry args={[w + 0.4, 0.3, d + 0.4]} /><meshStandardMaterial color={roof} /></mesh>
    </group>
  );
}

export default function Campus() {
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
      <SimpleBuilding id="research" x={17} z={-13} w={12} h={6} d={10} color="#dbeafe" roof="#64748b" />
      <mesh position={[17, 3.2, -8.05]}><boxGeometry args={[3, 2.2, 0.12]} /><meshStandardMaterial color="#334155" transparent opacity={0.55} /></mesh>
      <SimpleBuilding id="gym" x={17} z={-2} w={8} h={4} d={6} color="#fef3c7" roof="#f59e0b" />
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
        <mesh position={[0, 9.15, 0]}><boxGeometry args={[12.4, 0.3, 10.4]} /><meshStandardMaterial color="#b45309" /></mesh>
        {[-4, 0, 4].map((wx) => [1.8, 4.8, 7.8].map((wy) => (
          <mesh key={`${wx}-${wy}`} position={[wx, wy, 5.05]}><boxGeometry args={[1.6, 1.2, 0.06]} /><meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.35} /></mesh>
        )))}
      </group>
      <group position={[-5, 0, 16]}>
        <mesh castShadow position={[0, 4, 0]}><boxGeometry args={[12, 8, 8]} /><meshStandardMaterial color="#e0e7ff" /></mesh>
        <mesh position={[0, 8.15, 0]}><boxGeometry args={[12.4, 0.3, 8.4]} /><meshStandardMaterial color="#4338ca" /></mesh>
        {[-4, 0, 4].map((wx) => [1.8, 4.5, 7].map((wy) => (
          <mesh key={`${wx}-${wy}`} position={[wx, wy, 4.05]}><boxGeometry args={[1.6, 1.2, 0.06]} /><meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.35} /></mesh>
        )))}
      </group>

      {/* kendaraan */}
      <Car x={-24} z={1.2} color="#ef4444" />
      <Car x={-16} z={1.2} color="#3b82f6" />
      <Car x={16} z={1.2} color="#22c55e" />
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
    </group>
  );
}
