// ─── Avatar AI Agent 3D (procedural) + animation state machine ─────────────
// Gerakan: pathfinding A* di luar ruangan → pintu HQ → lerp interior ke meja.
// Animasi: idle / jalan / duduk / mengetik / berpikir / bicara / presentasi /
// makan / tidur / berenang / olahraga / main bola / selebrasi / menunggu.
// Avatar adalah REPRESENTASI visual; status kerja nyata berasal dari store.

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentProfile } from '../types';
import { useWorld } from '../store';
import { findPath } from '../engine/pathfinding';
import { setAgentPos } from '../engine/runtime';
import { HQ_DOOR } from '../data/seed';

const HQ = { minX: -19, minZ: -17, maxX: 3, maxZ: -3 };
const inHQ = (x: number, z: number) => x >= HQ.minX && x <= HQ.maxX && z >= HQ.minZ && z <= HQ.maxZ;

const STATUS_COLOR: Record<string, string> = {
  working: '#22c55e', thinking: '#3b82f6', meeting: '#a855f7',
  leisure: '#f59e0b', online: '#38bdf8', offline: '#94a3b8', error: '#ef4444',
};

export default function AgentAvatar({ agent }: { agent: AgentProfile }) {
  const group = useRef<THREE.Group>(null!);
  const legL = useRef<THREE.Mesh>(null!);
  const legR = useRef<THREE.Mesh>(null!);
  const armL = useRef<THREE.Mesh>(null!);
  const armR = useRef<THREE.Mesh>(null!);
  const body = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Mesh>(null!);

  const agentArrived = useWorld((s) => s.agentArrived);
  const selectAgent = useWorld((s) => s.selectAgent);
  const selectedAgentId = useWorld((s) => s.selectedAgentId);
  const selected = selectedAgentId === agent.id;

  const pathRef = useRef<[number, number][]>([]);
  const phaseRef = useRef<'path' | 'indoor' | 'exit' | 'done'>('done');
  const indoorTargetRef = useRef<[number, number, number] | null>(null);
  const walkPhase = useRef(0);
  const arrivedRef = useRef(false);
  const posRef = useRef<[number, number, number]>([agent.desk.x, agent.desk.y, agent.desk.z]);

  // ── tujuan berubah → hitung rute baru ──
  useEffect(() => {
    const [px, py, pz] = posRef.current;
    const dest = agent.dest;
    arrivedRef.current = false;
    const destIndoor = inHQ(dest.x, dest.z);
    const curIndoor = py > 0.1 || inHQ(px, pz);
    if (destIndoor) {
      if (curIndoor) {
        phaseRef.current = 'indoor';
        indoorTargetRef.current = [dest.x, dest.y, dest.z];
        pathRef.current = [];
      } else {
        phaseRef.current = 'path';
        indoorTargetRef.current = [dest.x, dest.y, dest.z];
        pathRef.current = findPath(px, pz, HQ_DOOR.x, HQ_DOOR.z);
      }
    } else if (curIndoor) {
      phaseRef.current = 'exit';
      indoorTargetRef.current = [HQ_DOOR.x, 0, HQ_DOOR.z];
      pathRef.current = [];
    } else {
      phaseRef.current = 'path';
      indoorTargetRef.current = null;
      pathRef.current = findPath(px, pz, dest.x, dest.z);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent.dest.x, agent.dest.y, agent.dest.z]);

  // posisi awal
  useEffect(() => {
    setAgentPos(agent.id, agent.desk.x, agent.desk.y, agent.desk.z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const v = agent.visual;
    const t = state.clock.elapsedTime;
    const speed = 2.4;
    let moving = false;

    const stepToward = (tx: number, ty: number, tz: number, sp: number) => {
      const [px, py, pz] = posRef.current;
      const dx = tx - px;
      const dy = ty - py;
      const dz = tz - pz;
      const dist = Math.hypot(dx, dz);
      const dyAbs = Math.abs(dy);
      if (dist < 0.12 && dyAbs < 0.12) return true;
      const step = Math.min(sp * dt, dist || 0.001);
      const nx = px + (dist > 0 ? (dx / dist) * step : 0);
      const nz = pz + (dist > 0 ? (dz / dist) * step : 0);
      const ny = py + THREE.MathUtils.clamp(dy, -sp * dt, sp * dt);
      posRef.current = [nx, ny, nz];
      if (dist > 0.05) {
        const targetRot = Math.atan2(dx, dz);
        let diff = targetRot - g.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        g.rotation.y += diff * Math.min(1, dt * 8);
      }
      return false;
    };

    if (phaseRef.current === 'path' && pathRef.current.length > 0) {
      const [wx, wz] = pathRef.current[0];
      if (stepToward(wx, 0, wz, speed)) pathRef.current.shift();
      moving = true;
      if (pathRef.current.length === 0) {
        if (indoorTargetRef.current) {
          phaseRef.current = 'indoor';
        } else {
          phaseRef.current = 'done';
          if (!arrivedRef.current) { arrivedRef.current = true; agentArrived(agent.id); }
        }
      }
    } else if (phaseRef.current === 'indoor' && indoorTargetRef.current) {
      const [tx, ty, tz] = indoorTargetRef.current;
      moving = true;
      if (stepToward(tx, ty, tz, speed)) {
        phaseRef.current = 'done';
        indoorTargetRef.current = null;
        if (!arrivedRef.current) { arrivedRef.current = true; agentArrived(agent.id); }
      }
    } else if (phaseRef.current === 'exit' && indoorTargetRef.current) {
      const [tx, ty, tz] = indoorTargetRef.current;
      moving = true;
      if (stepToward(tx, ty, tz, speed)) {
        indoorTargetRef.current = null;
        const [px, , pz] = posRef.current;
        pathRef.current = findPath(px, pz, agent.dest.x, agent.dest.z);
        phaseRef.current = 'path';
      }
    }

    // ── terapkan posisi + animasi pose ──
    const [px, py, pz] = posRef.current;
    let bobY = 0;
    if (moving) {
      walkPhase.current += dt * 9;
      const s = Math.sin(walkPhase.current);
      legL.current.rotation.x = s * 0.65;
      legR.current.rotation.x = -s * 0.65;
      armL.current.rotation.x = -s * 0.5;
      armR.current.rotation.x = s * 0.5;
      bobY = Math.abs(Math.cos(walkPhase.current)) * 0.05;
      body.current.rotation.x = 0.06;
    } else {
      legL.current.rotation.x = 0;
      legR.current.rotation.x = 0;
      body.current.rotation.x = 0;
      head.current.rotation.x = 0;
      head.current.rotation.z = 0;
      switch (v) {
        case 'typing':
          armL.current.rotation.x = -1.15 + Math.sin(t * 9) * 0.08;
          armR.current.rotation.x = -1.15 + Math.cos(t * 8) * 0.08;
          head.current.rotation.x = 0.25;
          body.current.position.y = -0.28;
          break;
        case 'sitting':
          armL.current.rotation.x = -0.4;
          armR.current.rotation.x = -0.4;
          body.current.position.y = -0.28;
          legL.current.rotation.x = -1.3;
          legR.current.rotation.x = -1.3;
          break;
        case 'thinking':
          armR.current.rotation.x = -1.9;
          armL.current.rotation.x = -0.2;
          head.current.rotation.z = 0.18;
          break;
        case 'talking':
          armR.current.rotation.x = -0.9 + Math.sin(t * 5) * 0.35;
          armL.current.rotation.x = -0.5 + Math.cos(t * 4) * 0.25;
          break;
        case 'presenting':
          armR.current.rotation.x = -2.6;
          armL.current.rotation.x = -0.6;
          break;
        case 'eating':
        case 'drinking':
          armR.current.rotation.x = -1.5 + Math.sin(t * 2.2) * 0.45;
          armL.current.rotation.x = -0.4;
          body.current.position.y = -0.28;
          legL.current.rotation.x = -1.3;
          legR.current.rotation.x = -1.3;
          break;
        case 'sleeping':
          body.current.rotation.x = -1.45;
          body.current.position.y = -0.15;
          head.current.rotation.x = 0;
          armL.current.rotation.x = 0;
          armR.current.rotation.x = 0;
          break;
        case 'swimming':
          body.current.rotation.x = -1.25;
          body.current.position.y = 0.1;
          armL.current.rotation.x = Math.sin(t * 3) * 0.9;
          armR.current.rotation.x = -Math.sin(t * 3) * 0.9;
          legL.current.rotation.x = Math.sin(t * 3) * 0.5;
          legR.current.rotation.x = -Math.sin(t * 3) * 0.5;
          break;
        case 'exercising':
          armL.current.rotation.x = -2.4 + Math.sin(t * 2.5) * 0.5;
          armR.current.rotation.x = -2.4 + Math.cos(t * 2.5) * 0.5;
          bobY = Math.abs(Math.sin(t * 2.5)) * 0.08;
          break;
        case 'playing': {
          walkPhase.current += dt * 11;
          const s = Math.sin(walkPhase.current);
          legL.current.rotation.x = s * 0.9;
          legR.current.rotation.x = -s * 0.9;
          armL.current.rotation.x = -s * 0.6;
          armR.current.rotation.x = s * 0.6;
          bobY = Math.abs(Math.cos(walkPhase.current)) * 0.07;
          break;
        }
        case 'celebrating':
          armL.current.rotation.x = -2.8;
          armR.current.rotation.x = -2.8;
          bobY = Math.abs(Math.sin(t * 6)) * 0.18;
          break;
        case 'waiting':
          armL.current.rotation.x = -0.9;
          armR.current.rotation.x = -0.9;
          head.current.rotation.z = 0.12;
          break;
        default:
          armL.current.rotation.x = Math.sin(t * 1.2) * 0.06;
          armR.current.rotation.x = -Math.sin(t * 1.2) * 0.06;
          body.current.position.y = Math.sin(t * 1.2) * 0.015;
      }
      if (v !== 'typing' && v !== 'sitting' && v !== 'eating' && v !== 'drinking') {
        body.current.position.y = v === 'sleeping' ? -0.15 : 0;
      }
    }
    if (v !== 'sleeping' && v !== 'swimming') body.current.rotation.x = moving ? 0.06 : 0;
    g.position.set(px, py + bobY, pz);
    setAgentPos(agent.id, px, py, pz);
  });

  const hair =
    agent.hairStyle === 'long' ? (
      <mesh position={[0, 1.62, -0.06]}><boxGeometry args={[0.42, 0.5, 0.14]} /><meshStandardMaterial color={agent.hair} /></mesh>
    ) : agent.hairStyle === 'bun' ? (
      <>
        <mesh position={[0, 1.78, 0]}><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color={agent.hair} /></mesh>
        <mesh position={[0, 1.86, -0.12]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color={agent.hair} /></mesh>
      </>
    ) : agent.hairStyle === 'cap' ? (
      <mesh position={[0, 1.8, 0]}><sphereGeometry args={[0.21, 10, 8]} /><meshStandardMaterial color="#f59e0b" /></mesh>
    ) : (
      <mesh position={[0, 1.8, 0]}><sphereGeometry args={[0.2, 10, 8]} /><meshStandardMaterial color={agent.hair} /></mesh>
    );

  return (
    <group
      ref={group}
      position={[agent.desk.x, agent.desk.y, agent.desk.z]}
      onClick={(e) => { e.stopPropagation(); selectAgent(agent.id); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      {/* indikator status */}
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color={STATUS_COLOR[agent.status] ?? '#38bdf8'} emissive={STATUS_COLOR[agent.status] ?? '#38bdf8'} emissiveIntensity={1.4} />
      </mesh>
      {/* ring saat dipilih */}
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.6, 24]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.6} />
        </mesh>
      )}
      <group ref={body}>
        {/* badan */}
        <mesh castShadow position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.21, 0.26, 0.62, 12]} />
          <meshStandardMaterial color={agent.shirt} />
        </mesh>
        {/* kepala */}
        <mesh ref={head} castShadow position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.21, 14, 12]} />
          <meshStandardMaterial color={agent.skin} />
        </mesh>
        {hair}
        {/* mata */}
        <mesh position={[-0.07, 1.64, 0.19]}><sphereGeometry args={[0.025, 6, 6]} /><meshStandardMaterial color="#111827" /></mesh>
        <mesh position={[0.07, 1.64, 0.19]}><sphereGeometry args={[0.025, 6, 6]} /><meshStandardMaterial color="#111827" /></mesh>
        {/* lengan */}
        <mesh ref={armL} position={[-0.3, 1.28, 0]}>
          <boxGeometry args={[0.11, 0.55, 0.11]} />
          <meshStandardMaterial color={agent.shirt} />
        </mesh>
        <mesh ref={armR} position={[0.3, 1.28, 0]}>
          <boxGeometry args={[0.11, 0.55, 0.11]} />
          <meshStandardMaterial color={agent.shirt} />
        </mesh>
      </group>
      {/* kaki */}
      <mesh ref={legL} position={[-0.11, 0.32, 0]}>
        <boxGeometry args={[0.14, 0.62, 0.14]} />
        <meshStandardMaterial color={agent.pants} />
      </mesh>
      <mesh ref={legR} position={[0.11, 0.32, 0]}>
        <boxGeometry args={[0.14, 0.62, 0.14]} />
        <meshStandardMaterial color={agent.pants} />
      </mesh>
    </group>
  );
}
