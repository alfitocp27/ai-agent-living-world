# TEST REPORT — AI Agent Living World 3D (Fase 1)

Tanggal: 21 Nov 2026. Lingkungan: VM Linux, Node v24.22.1, npm 10.9.4.
Perintah: `npm run build`, `node /tmp/test-store.mjs`, `node /tmp/test-pf.mjs`,
`node server/index.mjs` + curl, `npm run preview` + curl, dan cek render
browser (cloud browser).

## Ringkasan

| Area | Hasil |
|---|---|
| Build + typecheck (`tsc -b && vite build`) | **PASS** — 2693 modul, `dist/` jadi, JS 1,25 MB (gzip 342 KB) |
| Task engine (store, 23 asersi) | **PASS 23/23** |
| Pathfinding A* (9 asersi) | **PASS 9/9** |
| Orchestrator server (demo) | **PASS** (health, create→done+artefak, approval gate) |
| Preview HTTP 200 | **PASS** |
| Render 3D di browser | **PENDING** — pengecekan browser cloud sedang berjalan saat laporan ini ditulis |
| Supabase live / RLS | **NOT TESTED** — skema ditulis, belum di-apply ke instance live |
| Eksekusi LLM nyata | **NOT TESTED** — tidak ada API key; Live Mode sengaja memblokir |
| Performa 3/10/40/80/100 agent, FPS, mobile | **NOT TESTED** — Fase 7 |

## Detail

### 1. Build & typecheck — PASS
`npm run build` selesai tanpa error setelah 3 perbaikan (unused var,
`artifact` possibly undefined). Output: `dist/index.html` +
`dist/assets/index-Dep6MHIU.js` (1.254 kB, gzip 342 kB — ada warning chunk
> 500 kB karena Three.js; code-splitting dicatat untuk Fase 7).
TypeScript strict (`noUnusedLocals`, `verbatimModuleSyntax`) lolos.

### 2. Task engine (Zustand store) — PASS 23/23
Skrip `/tmp/test-store.mjs` (bundle store via esbuild, dijalankan di Node):
- Seed 10 agent, mode awal demo, jam awal 08:00.
- `assignTask` → tugas berjalan → selesai (progress 100, semua subtugas
  done, artefak `.md` dibuat dan berisi label "ARTEFAK DEMO", biaya demo > 0).
- Tugas prioritas tinggi → `waiting_approval`, setelah `approveTask` → queued.
- `failTask` → status failed + error tercatat + **tidak ada artefak**.
- `retryTask` → queued, progress kembali 0.
- Mode live → `assignTask` mengembalikan `live-blocked`.
- Meeting: live, transkrip demo bertambah & semua baris berlabel demo,
  `endMeeting` → done + notulen.
- Jam virtual maju; `createAgent` → 11 agent.

### 3. Pathfinding A* — PASS 9/9
Skrip `/tmp/test-pf.mjs`: rute plaza→pintu HQ, apartemen→kantin,
lapangan→kolam — semuanya ada, berakhir di tujuan, dan **tidak ada waypoint
di dalam halangan** (gedung/kolam/danau/air mancur). `nearestWalkable` untuk
titik di dalam gedung mengembalikan titik di luar gedung. Satu temuan awal:
titik mulai tes pertama berada di dalam rect air mancur — itu kesalahan
titik tes, bukan pathfinding (diperbaiki, lalu lolos).

### 4. Orchestrator server — PASS
`node server/index.mjs` (tanpa dependensi):
- `GET /health` → `{"ok":true,"mode":"demo","jobs":0}`.
- `POST /api/tasks` (idempotencyKey `uji-1`) → job selesai dalam ±4 dtk,
  status `done`, progress 100, artefak `uji-server-demo.md`.
- Tugas "Mendesak" → status `waiting_approval` (approval gate bekerja).
- SSE `/events` tersedia di kode; **belum diuji end-to-end dengan klien**
  (NOT TESTED).

### 5. Preview HTTP — PASS
`npm run preview -- --port 4173` → `HTTP 200`, `index.html` berisi judul
"AI Agent Living World 3D" dan bundle JS.

### 6. Render 3D di browser — NOT TESTED (bukan kegagalan aplikasi)
Cloud browser tidak bisa membuka `http://127.0.0.1:4173/` sama sekali
("invalid_request" di setiap percobaan, termasuk `localhost`; sebagai
kontrol, `example.com` terbuka normal). Penyebab: browser remote tersebut
tidak menjangkau loopback VM ini — `127.0.0.1` di sana bukan mesin yang
menjalankan Vite preview. Halaman aplikasi tidak pernah dimuat, jadi tidak
ada yang bisa dilaporkan soal kanvas WebGL, panel, atau console error.
Ini BUKAN bukti preview mati: dari VM yang sama, `curl` ke preview
mengembalikan HTTP 200 dan `index.html` + bundle termuat.
Rute verifikasi alternatif: tidak ada binary browser headless di VM ini
(`chromium`/`google-chrome`/`firefox`/Playwright tidak ditemukan), jadi
screenshot lokal tidak bisa dibuat tanpa mengunduh browser utuh. Verifikasi
visual akan dilakukan lewat Space/artifact yang sedang dibangun (hosted,
bisa dibuka dari aplikasi) — hasilnya menyusul.

### 7. Provider Muse (muse.ai) — PASS 14/14
Tambahan 21 Nov 2026, pilihan pengguna: pakai Muse (muse.ai), tanpa API key
eksternal. Skrip `/tmp/test-muse-provider.mjs` terhadap server
`PROVIDER=muse`:
- `GET /health` → `mode: muse`, model `Muse (asisten pribadi)`.
- `POST /api/tasks` → 201, status `waiting_assistant`; tugas TIDAK
  auto-selesai dan TIDAK punya artefak sebelum dikerjakan (bukan simulasi).
- Idempotency: key sama → job yang sama.
- `GET /api/assistant-queue` memuat tugas; setelah submit, antrean kosong.
- `POST /submit` tanpa artifact → 400; dengan artifact markdown → 200,
  status `done`, progress 100, `completedBy: Muse (asisten pribadi)`,
  artefak `uji-tugas-muse.md`. Submit kedua → 409.
- Batasan jujur: antrean asisten diproses oleh Muse saat diminta (bukan
  worker latar otonom 24/7); task engine demo di frontend masih simulasi
  sampai wiring Fase 3 menghubungkannya ke orchestrator.

## NOT TESTED (jujur, sesuai §21 master prompt)

- Login Supabase, RLS terhadap instance live, Storage upload artefak.
- Panggilan model nyata (OpenAI/Gemini/Anthropic) — tidak ada credential.
- Meeting dengan orkestrasi nyata; Build Mode; audio; cuaca dinamis.
- Desktop vs mobile (layout responsif ditulis, belum diuji di perangkat).
- FPS/memori/loading dan jumlah agent 3/10/40/80/100.
- Camera follow/cinematic di browser (kode ada, belum dilihat merender).

## Bug & batasan yang diketahui (Fase 1)

1. Avatar bergerak lurus pintu → meja di dalam HQ (tanpa collision furnitur
   interior). Collision interior penuh: Fase 6.
2. Pose berenang dilakukan di tepi kolam, avatar belum masuk ke air.
3. Plaza (visual) tumpang tindih 1 m dengan footprint Apartemen B di sumbu z
   — hanya slab di bawah gedung, tidak terlihat.
4. Bundle JS 1,25 MB belum di-code-split (peringatan Vite).
5. `npx esbuild` saat pengujian mengunduh esbuild 0.28.2 dari network
   (bukan dari node_modules lokal) — tidak memengaruhi build aplikasi.
