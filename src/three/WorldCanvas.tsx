// ─── Kanvas 3D utama: kamera, cahaya, kontrol ───────────────────────────────
// Mode kamera: iso / orbit bebas / top-down / follow agent / gedung /
// cinematic. OrbitControls: drag = orbit, wheel = zoom, klik gedung/agent =
// fokus. Drag manual otomatis beralih ke mode orbit bebas.

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useWorld } from '../store';
import { getAgentPos } from '../engine/runtime';
import { BUILDINGS } from '../data/seed';
import Headquarters from './Headquarters';
import Campus from './Campus';
import AgentAvatar from './AgentAvatar';

function CameraRig() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as {
    target: THREE.Vector3;
    update: () => void;
  } | null;
  const mode = useWorld((s) => s.cameraMode);
  const followId = useWorld((s) => s.followAgentId);
  const selectedFloor = useWorld((s) => s.selectedFloor);
  const selectedBuildingId = useWorld((s) => s.selectedBuildingId);
  const angle = useRef(0);

  useFrame((_, dt) => {
    if (!controls || mode === 'orbit') return;
    const pos = new THREE.Vector3();
    const tgt = new THREE.Vector3();
    const b = BUILDINGS.find((x) => x.id === selectedBuildingId);

    if (mode === 'follow' && followId) {
      const [ax, ay, az] = getAgentPos(followId);
      pos.set(ax + 7, ay + 5.5, az + 7);
      tgt.set(ax, ay + 1, az);
    } else if (mode === 'top') {
      pos.set(0.5, 48, 0.5);
      tgt.set(0, 0, -2);
    } else if (mode === 'cinematic') {
      angle.current += dt * 0.07;
      pos.set(Math.cos(angle.current) * 26, 11, Math.sin(angle.current) * 26 - 4);
      tgt.set(0, 1, -4);
    } else if (mode === 'building' || selectedFloor > 0) {
      const focus = b ?? BUILDINGS[0];
      const fy = selectedFloor > 0 ? (selectedFloor - 1) * 3.2 : 0;
      pos.set(focus.pos.x + 18, 10 + fy, focus.pos.z + 18);
      tgt.set(focus.pos.x, 1 + fy, focus.pos.z);
    } else {
      pos.set(26, 24, 26);
      tgt.set(0, 0, -4);
    }
    const k = 1 - Math.exp(-2.2 * dt);
    camera.position.lerp(pos, k);
    controls.target.lerp(tgt, k);
    controls.update();
  });
  return null;
}

export default function WorldCanvas() {
  const quality = useWorld((s) => s.quality);
  const setCamera = useWorld((s) => s.setCamera);
  const selectAgent = useWorld((s) => s.selectAgent);
  const selectBuilding = useWorld((s) => s.selectBuilding);
  const agents = useWorld((s) => s.agents);

  return (
    <Canvas
      shadows
      dpr={quality === 'low' ? [1, 1] : quality === 'high' ? [1, 2] : [1, 1.75]}
      camera={{ position: [26, 24, 26], fov: 45, near: 0.1, far: 200 }}
      onPointerMissed={() => {
        selectAgent(null);
        selectBuilding(null);
      }}
    >
      <color attach="background" args={['#bfe3f0']} />
      <fog attach="fog" args={['#cfe8f2', 70, 140]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#bfe3f0', '#7fae62', 0.5]} />
      <directionalLight
        castShadow
        position={[22, 32, 12]}
        intensity={1.6}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-far={90}
      />
      <Suspense fallback={null}>
        <Campus />
        <Headquarters />
        {agents.map((a) => (
          <AgentAvatar key={a.id} agent={a} />
        ))}
      </Suspense>
      <CameraRig />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={1.45}
        minDistance={5}
        maxDistance={65}
        target={[0, 0, -2]}
        onStart={() => setCamera('orbit')}
      />
    </Canvas>
  );
}
