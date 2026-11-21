# AI Agent Living World 3D

Dunia virtual 3D interaktif — gabungan The Sims, SimCity, dan kantor AI Agent modern.
Pemilik kampus AI dapat melihat, mengelola, memperbesar, memutar 360°, dan
mengustomisasi dunia. Avatar 3D merepresentasikan AI Agent sungguhan: status
kerja backend menggerakkan animasi mereka (jalan ke meja → mengetik → selebrasi
saat tugas selesai).

> **Status saat ini (22 Nov 2026):** Fase 1 + **port penuh dari Space**
> (semua perubahan Space 21 Nov 2026 yang dibuat setelah push GitHub pertama
> dibangun ulang di repo ini). Task engine **DEMO** — semua hasil demo dilabeli
> DEMO. Mode **LIVE memblokir eksekusi** sampai provider AI terhubung
> ("Integration Required"). Tidak ada klaim palsu bahwa LLM berjalan.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck (tsc) + build produksi
npm run preview    # sajikan hasil build
```

Backend orchestrator (tanpa dependensi):

```bash
node server/index.mjs                      # DEMO di http://localhost:8787
PROVIDER=muse node server/index.mjs        # pakai Muse (muse.ai): tugas masuk
                                           # antrean asisten, dikerjakan Muse,
                                           # hasil dikirim via /api/tasks/:id/submit
PROVIDER_API_KEY=sk-... node server/index.mjs   # LIVE OpenAI-compatible
```

## Yang bisa dilakukan sekarang

- **Kamera:** Isometric, Orbit 360° (drag), Top-down, Follow Agent, Gedung,
  Cinematic. Wheel = zoom. Klik gedung/agent = fokus & panel detail.
  Pilih lantai → atap & lantai atas disembunyikan; "Buka Atap" membuka atap
  SEMUA gedung sekaligus.
- **Dunia:** HQ (semua agent bekerja di lantai 2: 22 meja — Workspace 8,
  Programmer 8, Desain 6 — + Ruang Manager khusus), Gedung Server (rak
  menyala, konsol monitoring, pendingin), apartemen, kafe & resto, gym,
  kolam renang (air bergerak), lapangan bola mini (bola + skor), danau +
  jembatan, jalan, lahan parkir aspal bermarkah + jalan setapak, lampu,
  pepohonan (tidak ada di jalan), plaza air mancur bertingkat dua, dan
  **Warung Madura buka 24 jam** (papan nama menyala terus). Setiap gedung
  punya badge nama melayang di atasnya. Pencahayaan siang/malam mengikuti
  jam WIB nyata.
- **Jam WIB nyata:** jam dunia = jam Asia/Jakarta yang berdetak tiap detik
  (topbar + Pengaturan). Tidak ada lagi jam virtual atau kontrol kecepatan
  1x/2x/4x; hanya "Jalankan simulasi / Jeda simulasi".
- **Avatar otomatis:** tidak ada jadwal kehidupan terjadwal. Ada tugas → ke
  meja & bekerja; rapat → ruang rapat; nganggur → jalan-jalan/plaza/kafe/
  warung/tidur sendiri; agent nonaktif pulang & tidur. Avatar 3D berbeda
  per gender (perempuan: rambut panjang/sanggul, siluet rok, torso ramping).
- **Agent (10):** CEO, Manager, 2 Programmer, UI/UX, Graphic, Copywriter,
  Research, Data Analyst, QA — masing-masing punya gender + gaya rambut
  (dibatasi per gender). Klik avatar → profil + grafik kinerja agent
  (donut status, % sukses, bar 7 hari), chat mengambang, tugaskan, follow,
  pause/resume, edit.
- **Manager sebagai orkestrator:** tugas yang diberikan ke manager dipilihkan
  TEPAT SATU bawahan yang peran & keahliannya paling cocok (+ alasan
  pemilihan tampil di tugas); tidak pernah dibagikan ke semua agent. Manager
  mereview hasil bawahan terhadap brief dulu; bila belum sesuai, menugaskan
  revisi (maks. 2x) dengan catatan konkret; hanya hasil final yang
  dilaporkan — laporan manager teks biasa per poin ("• "), menyebut siapa
  yang dipilih, kenapa, dan hasil reviewnya.
- **Tugas (demo):** buat tugas → Manager membagi subtugas (riset → desain →
  kode → QA) → agent berjalan ke meja & mengetik → artefak `.md` bisa dilihat
  & diunduh. Prioritas tinggi butuh approval. Ada retry, cancel, dan
  "simulasikan gagal" (timeout demo — avatar menampilkan error, tidak ada
  klaim selesai). Review demo adalah checklist deterministik (artefak +
  subtugas), bukan penilaian LLM — ditulis jujur di laporan.
- **Chat persisten:** panel Chat/Tugaskan mengambang (desktop kanan, mobile
  bottom sheet), dunia 3D tetap terlihat. Sesi + pesan tersimpan, pemilih
  riwayat, "+ Chat baru", hapus sesi. Perintah kerja lewat chat menjadi
  tugas nyata (mis. "buatkan…", "riset…").
- **Hasil Kerja:** laporan manager sebagai bacaan utama, dokumen mentah =
  "Dokumen pendukung", notulen terpisah. Tab dengan jumlah, strip ringkasan,
  kotak cari, label "Baru", konten penuh saat diketuk, status baca berfungsi.
  Laporan bisa dibalas — balasan menjadi tugas revisi nyata ke pelaksana
  asli, lalu manager melapor lagi.
- **Notifikasi:** lonceng di topbar dengan jumlah laporan belum dibaca; klik
  → membuka laporan terbaru yang belum dibaca.
- **Meeting (demo):** buat rapat → agent berjalan ke ruang meeting, duduk
  (4 kursi), pembicara bergiliran, transkrip demo, notulen saat rapat
  diakhiri.
- **Statistik:** kartu ringkasan + completion ring, donut status tugas,
  bar aktivitas 7 hari (WIB), bar per-agent — semua dari data nyata,
  dengan empty state jujur.
- **Provider:** label "Muse (muse.ai)" di mana-mana; agent baru otomatis
  berlabel itu. Provider eksternal tetap "Integration Required".
- **Analytics & Activity:** statistik dihitung dari state demo; log aktivitas
  real-time di ticker bawah (bisa diklik → Aktivitas).

## Struktur folder

```
src/
  App.tsx                 layout + error boundary + tick simulasi (1 dtk)
  main.tsx / index.css    entry + Tailwind v4
  types.ts                tipe bersama (agent, task, meeting, report, chat, ...)
  store.ts                Zustand: state dunia + task engine demo + orkestrator
                          manager (routing, review, laporan) + chat persisten
                          + notifikasi + jam WIB nyata + avatar otomatis
  data/seed.ts            10 agent, gedung, tugas contoh, LEISURE_SPOTS
  engine/
    runtime.ts            posisi avatar per-frame + daftar halangan
    pathfinding.ts        A* grid 1 m (8 arah, tanpa potong sudut)
  three/
    WorldCanvas.tsx       Canvas, cahaya siang/malam WIB, CameraRig (6 mode)
    Headquarters.tsx      HQ: L1 lobby+meeting, L2 22 meja + Ruang Manager,
                          L3 deck kosong, atap
    Campus.tsx            tanah, jalan, kolam, lapangan, Gedung Server,
                          warung, parkir, air mancur 2 tingkat, badge gedung
    AgentAvatar.tsx       avatar procedural (gender) + state machine animasi
  components/
    TopBar.tsx  Sidebar.tsx  BottomBar.tsx  RightPanel.tsx  ChatPanel.tsx
server/index.mjs          orchestrator Node tanpa dependensi (queue, retry,
                          idempotency, SSE, review endpoint, adapter demo +
                          Muse antrean asisten + OpenAI-compatible)
supabase/migrations/001_init.sql   skema + RLS (DRAFT, belum di-apply)
```

## Arsitektur & roadmap

Lihat `ARCHITECTURE.md` (scene graph, state flow, DB, roadmap) dan
`TEST-REPORT.md` (hasil pengujian jujur PASS/FAIL/NOT TESTED).

## Batasan yang diketahui

- Interior HQ: avatar bergerak lurus dari pintu ke meja (tanpa collision
  furnitur di dalam ruangan) — collision interior penuh di Fase 6.
- Renang: avatar berpose berenang di tepi kolam (belum masuk ke air).
- Lantai 3 HQ kini deck kosong (semua kerja pindah ke L2); tombol L3 masih
  ada di BottomBar.
- Slab parkir bukan halangan pathfinding — avatar bisa memotong lewat area
  parkir.
- Jalan setapak parkir berbentuk L dari jalan vertikal (kolam & danau
  memblokir rute lurus utara-selatan dari jalan horizontal).
- Review manager mode DEMO adalah checklist deterministik, bukan penilaian
  LLM; review sungguhan terjadi di alur PROVIDER=muse via server.
- Belum ada: Supabase live, eksekusi LLM nyata, Build Mode, audio, auth.
  Semuanya tercatat sebagai backlog di `TEST-REPORT.md`, bukan disembunyikan.
