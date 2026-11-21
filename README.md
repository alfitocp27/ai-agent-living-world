# AI Agent Living World 3D

Dunia virtual 3D interaktif — gabungan The Sims, SimCity, dan kantor AI Agent modern.
Pemilik kampus AI dapat melihat, mengelola, memperbesar, memutar 360°, dan
mengustomisasi dunia. Avatar 3D merepresentasikan AI Agent sungguhan: status
kerja backend menggerakkan animasi mereka (jalan ke meja → mengetik → selebrasi
saat tugas selesai).

> **Fase 1 (saat ini):** dunia 3D + 10 avatar + task engine **DEMO** + meeting demo.
> Semua hasil demo dilabeli DEMO. Mode **LIVE memblokir eksekusi** sampai provider
> AI terhubung ("Integration Required"). Tidak ada klaim palsu bahwa LLM berjalan.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck (tsc) + build produksi
npm run preview    # sajikan hasil build
```

Backend orchestrator (opsional di Fase 1, tanpa dependensi):

```bash
node server/index.mjs                      # DEMO di http://localhost:8787
PROVIDER=muse node server/index.mjs        # pakai Muse (muse.ai): tugas masuk
                                           # antrean asisten, dikerjakan Muse,
                                           # hasil dikirim via /api/tasks/:id/submit
PROVIDER_API_KEY=sk-... node server/index.mjs   # LIVE OpenAI-compatible
```

## Yang bisa dilakukan sekarang (Fase 1)

- **Kamera:** Isometric, Orbit 360° (drag), Top-down, Follow Agent, Gedung,
  Cinematic. Wheel = zoom. Klik gedung/agent = fokus & panel detail.
  Pilih lantai L1–L3 → atap & lantai atas disembunyikan.
- **Dunia:** HQ 3 lantai (lobby, open workspace, meeting, programmer, UI/UX,
  CEO, PM, command center), Research Lab, apartemen, kantin & coffee shop,
  gym, kolam renang (air bergerak), lapangan bola mini (bola + skor),
  danau + jembatan, jalan, mobil (1 bergerak), lampu, pepohonan, plaza air mancur.
- **Agent (10):** CEO, Manager, 2 Programmer, UI/UX, Graphic, Copywriter,
  Research, Data Analyst, QA. Klik avatar → panel: profil, model, tools,
  statistik, chat (demo), assign task, follow, pause/resume, edit.
- **Tugas (demo):** buat tugas → Manager membagi subtugas (riset → desain →
  kode → QA) → agent berjalan ke meja & mengetik → artefak `.md` bisa dilihat
  & diunduh. Prioritas tinggi butuh approval. Ada retry, cancel, dan
  "simulasikan gagal" (timeout demo — avatar menampilkan error, tidak ada
  klaim selesai).
- **Meeting (demo):** buat rapat → agent berjalan ke ruang meeting, duduk,
  pembicara bergiliran, transkrip demo, notulen saat rapat diakhiri.
- **Life simulation (visual):** jam virtual 08.00 → makan siang 12.00 di
  kantin → olahraga 17.00 (kolam/lapangan/gym) → tidur 22.00 di apartemen.
  Play/pause, kecepatan 1x/2x/4x.
- **Analytics & Activity:** statistik dihitung dari state demo; log aktivitas
  real-time di ticker bawah.

## Struktur folder

```
src/
  App.tsx                 layout + error boundary + tick simulasi (1 dtk)
  main.tsx / index.css    entry + Tailwind v4
  types.ts                tipe bersama (agent, task, meeting, ...)
  store.ts                Zustand: state dunia + task engine demo + jadwal
  data/seed.ts            10 agent, gedung, tugas contoh
  engine/
    runtime.ts            posisi avatar per-frame + daftar halangan
    pathfinding.ts        A* grid 1 m (8 arah, tanpa potong sudut)
  three/
    WorldCanvas.tsx       Canvas, cahaya, CameraRig (6 mode kamera)
    Headquarters.tsx      HQ 3 lantai + interior detail
    Campus.tsx            tanah, jalan, kolam, lapangan, gedung pendukung
    AgentAvatar.tsx       avatar procedural + state machine animasi
  components/
    TopBar.tsx  Sidebar.tsx  BottomBar.tsx  RightPanel.tsx
server/index.mjs          orchestrator Node tanpa dependensi (queue, retry,
                          idempotency, SSE, adapter demo + OpenAI-compatible)
supabase/migrations/001_init.sql   skema + RLS (DRAFT, belum di-apply)
```

## Arsitektur & roadmap

Lihat `ARCHITECTURE.md` (scene graph, state flow, DB, roadmap Fase 1–7) dan
`TEST-REPORT.md` (hasil pengujian jujur PASS/FAIL/NOT TESTED).

## Batasan yang diketahui (Fase 1)

- Interior HQ: avatar bergerak lurus dari pintu ke meja (tanpa collision
  furnitur di dalam ruangan) — collision interior penuh di Fase 6.
- Renang: avatar berpose berenang di tepi kolam (belum masuk ke air).
- Belum ada: Supabase live, eksekusi LLM nyata, Build Mode, audio, auth.
  Semuanya tercatat sebagai backlog di `TEST-REPORT.md`, bukan disembunyikan.
