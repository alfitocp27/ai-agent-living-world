# Arsitektur — AI Agent Living World 3D

## 1. Gambaran sistem

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser (React + Vite + TS)                                     │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ UI Layer │  │ Zustand store    │  │ R3F Scene             │  │
│  │ TopBar / │  │ - agents, tasks  │  │ WorldCanvas           │  │
│  │ Sidebar /│◄─►│ - meetings, logs │◄─►│  ├─ Headquarters (HQ) │  │
│  │ RightPanel│  │ - reports, chat  │  │  ├─ Campus (outdoor)  │  │
│  │ BottomBar│  │ - clock WIB, cam │  │  └─ AgentAvatar × 10  │  │
│  │ ChatPanel│  │ - mode demo/live │  │                       │  │
│  └──────────┘  └──────────────────┘  └───────────────────────┘  │
│        │ tick 1 dtk (simulasi)      ▲ posisi per-frame (ref)    │
└────────┼────────────────────────────┼──────────────────────────┘
         │ (Fase 3)                   │
         ▼                            │
┌─────────────────────────────────────────────────────────────────┐
│ Backend: server/index.mjs (Node, tanpa dependensi)              │
│  HTTP /api/tasks · SSE /events · queue FIFO · retry max 2x      │
│  idempotency key · approval gate · audit log · adapter LLM      │
│  review endpoint (POST /api/tasks/:id/review, revisi maks 2x)  │
│  (DEMO deterministik | MUSE antrean asisten | LIVE OpenAI via env)  │
└─────────────────────────────────────────────────────────────────┘
         │ (Fase 3)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Supabase: Auth · Postgres (001_init.sql) · Realtime · Storage  │
│ RLS per organisasi · secrets hanya di backend (secret_ref)      │
└─────────────────────────────────────────────────────────────────┘
```

**Prinsip sumber kebenaran:** status task/agent di store (Fase 1) / backend+DB
(Fase 3). Avatar hanya representasi visual: event `task.started` → jalan ke
meja; `task.progress` → mengetik; `task.done` → selebrasi; `task.failed` →
indikator error. Animasi tidak pernah membuktikan pekerjaan AI berjalan.

## 2. Scene graph (Fase 1)

```
Canvas (dpr by quality, shadows, fog, cahaya siang/malam WIB)
├─ Lights: ambient + hemisphere + directional (sun, shadow 2048;
│  intensitas & warna mengikuti isNight 19.00–05.00 WIB)
├─ Campus
│  ├─ Ground 70×70, Roads (H z=1, V x=8), Plaza, Fountain 2 tingkat
│  ├─ Trees (InstancedMesh ×2: trunk + foliage, 26 pohon — tidak ada di jalan)
│  ├─ Pool (air animasi sinus) + loungers + payung
│  ├─ FootballField (bola animasi, gawang, garis) + skor (store)
│  ├─ Lake + Bridge, Gedung Server (rak + konsol + pendingin), Gym,
│  │  Cafe (+teras), Apartemen A/B, Warung Madura 24 jam
│  ├─ Parking (slab aspal + marka, selatan kolam) + jalan setapak paving
│  ├─ Badges (drei Html, 8 gedung — badge HQ 1,2 m di atas atap)
│  ├─ Cars (3 di lahan parkir + 1 bergerak di jalan vertikal), Lamps ×6
│  └─ Fence + Gate selatan
├─ Headquarters (klik → panel gedung)
│  ├─ L1: lobby/reception, ruang meeting (meja 4 kursi + layar)
│  ├─ L2: 22 meja kerja (Workspace 8, Programmer 8, Desain 6) + Ruang
│  │  Manager (pintu, karpet, whiteboard, meja eksekutif dual monitor)
│  ├─ L3: deck kosong (semua kerja pindah ke L2)
│  ├─ Roof (disembunyikan saat pilih lantai / hideRoof — berlaku semua gedung)
│  └─ Lift shaft dekoratif
└─ AgentAvatar × N (procedural: badan/kepala/rambut/lengan/kaki,
   siluet berbeda per gender, indikator status melayang,
   ring oranye saat dipilih)
```

## 3. State & event flow

- **Zustand store** (`store.ts`): satu sumber state UI+dunia. Tick 1 detik:
  jam WIB nyata (`wibNow`, turunan `clockMin`/`day`/`isNight`); task engine
  (queued → running → subtask selesai → done + artefak demo); **orkestrator
  manager**: tugas ke manager di-routing ke tepat satu bawahan
  (`pickBestAssignee`, skor skills +3/role +2/team +1 + sinonim ID→EN)
  dengan `routingReason`; saat selesai, manager mereview (demo: checklist
  deterministik) → laporan manager teks biasa (`plainText`) → `reports`
  (baca/belum dibaca, `unreadReportCount`); `requestRevision` maks 2x;
  `replyToReport` membuat tugas revisi (`source: 'report_reply'`); chat
  persisten (`chatSessions`, perintah kerja → tugas nyata source `'chat'`);
  avatar otomatis: agent idle memilih tujuan santai dari `LEISURE_SPOTS`
  (cooldown 45 dtk, nikmati 60 dtk) lalu kembali ke meja; manager yang
  delegasinya menunggu bawahan tetap di meja (`managerWaiting`); meeting
  live (transkrip demo bergiliran); skor bola.
- **Runtime positions** (`engine/runtime.ts`): `agentPos` mutable ditulis
  avatar per-frame, dibaca CameraRig (follow) — Zustand tidak di-update
  per-frame.
- **Pathfinding** (`engine/pathfinding.ts`): A* grid 1 m, 8 arah, halangan =
  `OBSTACLES` (gedung, kolam, danau, air mancur, warung). Target di dalam
  gedung di-`nearestWalkable`-kan ke pintu; interior HQ ditempuh lurus
  pintu → meja.
- **Animasi** (`AgentAvatar.tsx`): state machine berbasis `agent.visual` +
  fase gerak (`path` → `indoor`/`exit` → `done` → `agentArrived()`), dengan
  guard bila path kosong. Pose dihitung per-frame dari `useFrame` (ayunan
  kaki/tangan, mengetik, tidur horizontal, berenang, selebrasi lompat).
  Siluet berbeda per gender (`agent.gender`).
- **Kamera** (`WorldCanvas.tsx` CameraRig): preset dil-lerp tiap frame
  (iso/top/building/follow/cinematic); drag manual → mode `orbit` bebas.
- **Server review** (`server/index.mjs`): `POST /api/tasks/:id/review`
  (`approved` | `needs_revision` + feedback); revisi < 2x → job kembali
  `waiting_assistant` (muse) / `queued` (demo) dengan `revisionCount`+1;
  revisi ke-3 → 409. Job membawa metadata routing/review
  (`assigneeId`, `delegatedByAgentId`, `routingReason`, `reviewStatus`,
  `reviewFeedback`, `revisionCount`, `source`).

## 4. Database (Fase 1: skema, belum live)

`supabase/migrations/001_init.sql` — 26 tabel ternormalisasi: organizations,
worlds, world_settings, buildings, floors, rooms, placed_objects, teams,
agent_profiles, agent_configs, agent_positions, agent_schedules,
knowledge_sources, provider_connections, tasks, subtasks, task_dependencies,
task_events, agent_runs, tool_calls, approvals, artifacts, meetings,
meeting_messages, usage_records, activity_logs. RLS aktif; kebijakan
owner-based (contoh lengkap untuk organizations/worlds/tasks, pola sama
untuk sisanya di Fase 3).

## 5. Aset 3D

Semua aset procedural (Three.js geometry + material standar): tidak ada
GLB/GLTF eksternal di Fase 1 — dipilih agar build ringan, tanpa unduhan
aset, dan tetap konsisten stylized. GLB opsional di Fase 2+ (karakter
detail, furnitur). Palet: putih hangat, krem, kayu, hijau taman, biru
lembut, oranye. Instancing dipakai untuk pohon; LOD & pooling penuh di
Fase 7 (target 3 → 100 agent).

## 6. Roadmap fase

| Fase | Isi | Status |
|---|---|---|
| 1 | Core 3D world, kamera, HQ 1 gedung, 10 avatar, state, task engine demo | ✅ SELESAI (repo ini) |
| 1b | Port Space 21 Nov 2026: orkestrator manager + review, chat persisten, Hasil Kerja + balasan revisi, notifikasi, gender, WIB nyata, avatar otomatis, L2 HQ + Ruang Manager, Gedung Server, warung, badge, penataan kampus | ✅ SELESAI 22 Nov 2026 (repo ini) |
| 2 | World expansion: lantai 4–6, area sosial & rekreasi lengkap, cuaca | Backlog |
| 3 | Agent engine: Supabase Auth/DB/Realtime, provider live, artifacts nyata | Backlog (server stub + skema siap) |
| 4 | Real-time visual connection via SSE backend → avatar | Backlog (SSE sudah ada di server) |
| 5 | Life simulation: jadwal custom, mode Realistic/Fast/Always Working | DIBATALKAN — diganti avatar otomatis (tanpa jadwal terjadwal) + jam WIB nyata |
| 6 | World editor: build mode, undo/redo, simpan layout, validasi navmesh | Backlog |
| 7 | Performance, security, QA: 3/10/40/80/100 agent, mobile, FPS | Backlog (kualitas Low/Med/High sudah ada) |

## 7. Keamanan (yang sudah diterapkan Fase 1)

- Secret API tidak ada di repo & tidak pernah di browser (`.env.example`
  hanya placeholder; server membaca env).
- Live Mode memblokir semua eksekusi sampai provider terhubung.
- Tugas prioritas tinggi butuh approval manusia sebelum jalan.
- Idempotency key di server mencegah duplikasi aksi; retry max 2x.
- RLS + isolasi organisasi disiapkan di skema (belum diuji live).
