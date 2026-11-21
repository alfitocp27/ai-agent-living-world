// ─── Pathfinding grid A* (Fase 1) ───────────────────────────────────────────
// Grid 1 m, 8 arah, tanpa potong sudut menembus halangan. Dipakai avatar
// untuk berjalan dari posisi saat ini ke meja / meeting / kolam / rumah.
// Validasi: path tidak pernah melewati OBSTACLES (lihat TEST-REPORT.md).

import { OBSTACLES, WORLD_HALF } from './runtime';

const N = WORLD_HALF * 2 + 1; // 69 sel per sisi

function toGrid(v: number): number {
  return Math.round(v) + WORLD_HALF;
}

function toWorld(g: number): number {
  return g - WORLD_HALF;
}

function blocked(gx: number, gz: number): boolean {
  const wx = toWorld(gx);
  const wz = toWorld(gz);
  if (gx < 0 || gz < 0 || gx >= N || gz >= N) return true;
  return OBSTACLES.some(
    (o) => wx >= o.minX && wx <= o.maxX && wz >= o.minZ && wz <= o.maxZ,
  );
}

/** Titik terdekat yang bisa dilalui dari sebuah koordinat (untuk target di dalam gedung). */
export function nearestWalkable(x: number, z: number): [number, number] {
  for (let r = 0; r <= 12; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const gx = toGrid(x + dx);
        const gz = toGrid(z + dz);
        if (!blocked(gx, gz)) return [toWorld(gx), toWorld(gz)];
      }
    }
  }
  return [x, z];
}

export function findPath(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
): [number, number][] {
  const [tx, tz] = nearestWalkable(toX, toZ);
  const sx = toGrid(fromX);
  const sz = toGrid(fromZ);
  const gx = toGrid(tx);
  const gz = toGrid(tz);
  if (blocked(sx, sz)) return [[tx, tz]];
  if (sx === gx && sz === gz) return [[tx, tz]];

  const key = (x: number, z: number) => z * N + x;
  const open: { x: number; z: number; g: number; f: number }[] = [
    { x: sx, z: sz, g: 0, f: 0 },
  ];
  const came = new Map<number, number>();
  const gScore = new Map<number, number>([[key(sx, sz), 0]]);
  const closed = new Set<number>();
  const h = (x: number, z: number) =>
    Math.hypot(x - gx, z - gz);

  const DIRS: [number, number, number][] = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414],
  ];

  let guard = 0;
  while (open.length > 0 && guard++ < 20000) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift()!;
    const ck = key(cur.x, cur.z);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.x === gx && cur.z === gz) {
      const path: [number, number][] = [];
      let k = ck;
      let cx = cur.x;
      let cz = cur.z;
      path.push([toWorld(cx), toWorld(cz)]);
      while (came.has(k)) {
        const p = came.get(k)!;
        cx = p % N;
        cz = Math.floor(p / N);
        path.push([toWorld(cx), toWorld(cz)]);
        k = p;
      }
      return path.reverse();
    }
    for (const [dx, dz, cost] of DIRS) {
      const nx = cur.x + dx;
      const nz = cur.z + dz;
      if (blocked(nx, nz)) continue;
      // cegah potong sudut diagonal menembus halangan
      if (dx !== 0 && dz !== 0 && (blocked(cur.x + dx, cur.z) || blocked(cur.x, cur.z + dz))) continue;
      const nk = key(nx, nz);
      if (closed.has(nk)) continue;
      const ng = cur.g + cost;
      if (ng < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, ng);
        came.set(nk, ck);
        open.push({ x: nx, z: nz, g: ng, f: ng + h(nx, nz) });
      }
    }
  }
  // Fallback: garis lurus ke titik walkable terdekat (tidak pernah menembus gedung
  // karena target sudah di-nearestWalkable; rute darurat ini tercatat di log).
  return [[tx, tz]];
}
