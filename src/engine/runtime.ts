// ─── Runtime 3D bersama (mutable, di luar React state) ─────────────────────
// Posisi avatar per-frame ditulis ke sini oleh AgentAvatar dan dibaca oleh
// CameraRig (follow mode). Zustand TIDAK di-update per frame (performa).

export const agentPos: Record<string, [number, number, number]> = {};

export function setAgentPos(id: string, x: number, y: number, z: number) {
  agentPos[id] = [x, y, z];
}

export function getAgentPos(id: string): [number, number, number] {
  return agentPos[id] ?? [0, 0, 0];
}

/** Persegi halangan untuk pathfinding: [minX, minZ, maxX, maxZ] (meter). */
export interface Obstacle {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
  label: string;
}

export const OBSTACLES: Obstacle[] = [
  { minX: -19, minZ: -17, maxX: 3, maxZ: -3, label: 'HQ Kantor Pusat' },
  { minX: 11, minZ: -18, maxX: 23, maxZ: -8, label: 'Research & Innovation' },
  { minX: -26, minZ: 10, maxX: -14, maxZ: 20, label: 'Apartemen A' },
  { minX: -11, minZ: 12, maxX: 1, maxZ: 20, label: 'Apartemen B' },
  { minX: 11, minZ: 6, maxX: 21, maxZ: 13, label: 'Kantin & Coffee Shop' },
  { minX: 13, minZ: -5, maxX: 21, maxZ: 1, label: 'Gym' },
  { minX: 12, minZ: 15, maxX: 24, maxZ: 23, label: 'Kolam Renang' },
  { minX: 24, minZ: 20, maxX: 32, maxZ: 30, label: 'Danau' },
  { minX: -0.5, minZ: 6, maxX: 4.5, maxZ: 11, label: 'Air Mancur Plaza' },
];

export const WORLD_HALF = 34; // dunia 68 x 68 m
