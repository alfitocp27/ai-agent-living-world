// ─── AI Agent Living World — Orchestrator backend (Fase 1 stub, runnable) ───
// Node.js TANPA dependensi eksternal. Jalankan:  node server/index.mjs
//   POST /api/tasks            { title, description, idempotencyKey? }
//   GET  /api/tasks            daftar job + status
//   GET  /api/tasks/:id        detail job + artefak
//   POST /api/tasks/:id/cancel
//   POST /api/tasks/:id/approve   (approval gate untuk tugas prioritas tinggi)
//   GET  /events               SSE: task.created / task.progress / task.done /
//                              task.failed — sumber event untuk avatar 3D.
// MODE (env PROVIDER):
//   - demo  (default, tanpa API key): adapter DEMO menjawab deterministik
//     dan setiap respons dilabeli demo:true. TIDAK PERNAH mengklaim itu
//     output LLM.
//   - muse  (tanpa API key, provider pilihan pengguna 21 Nov 2026): tugas
//     masuk antrean `waiting_assistant` dan dikerjakan oleh Muse (asisten
//     pribadi pengguna) lewat antrean ini — Muse membaca antrean, mengerjakan
//     tugas, lalu mengirim hasilnya kembali via POST /api/tasks/:id/submit.
//     Tidak ada panggilan LLM eksternal dan tidak ada simulasi yang
//     mengaku sebagai hasil kerja.
//   - openai (butuh PROVIDER_API_KEY + PROVIDER_BASE_URL OpenAI-compatible):
//     adapter nyata memanggil model. Secret hanya di env server, tidak
//     pernah dikirim ke browser.
// Job queue: FIFO in-memory, retry max 2x dengan backoff, idempotency key
// mencegah duplikasi aksi. Persistensi Postgres/Supabase: Fase 3 (lihat
// supabase/migrations/001_init.sql).

import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8787);
const PROVIDER = process.env.PROVIDER ?? (process.env.PROVIDER_API_KEY ? 'openai' : 'demo');
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY ?? '';
const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL ?? 'https://api.openai.com/v1';
const PROVIDER_MODEL = process.env.PROVIDER_MODEL ?? (PROVIDER === 'muse' ? 'Muse (asisten pribadi)' : 'gpt-5-mini');
const LIVE = PROVIDER !== 'demo';

const jobs = new Map(); // id -> job
const sseClients = new Set();
const seenKeys = new Map(); // idempotencyKey -> jobId
const audit = [];

function logAudit(event, jobId, detail) {
  const entry = { at: new Date().toISOString(), event, jobId, detail };
  audit.push(entry);
  if (audit.length > 500) audit.shift();
  console.log(JSON.stringify(entry));
}

function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) res.write(payload);
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

// ── Provider adapter ─────────────────────────────────────────────────────────
async function callLLM(prompt) {
  if (!LIVE) {
    // DEMO adapter: deterministik, dilabeli demo — bukan LLM.
    await new Promise((r) => setTimeout(r, 400));
    return { demo: true, text: `[DEMO — bukan output LLM]\nRingkasan tugas: ${prompt.slice(0, 200)}\n\nLangkah: riset → rancangan → implementasi → QA. Hubungkan PROVIDER_API_KEY untuk eksekusi nyata.` };
  }
  const r = await fetch(`${PROVIDER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PROVIDER_API_KEY}` },
    body: JSON.stringify({
      model: PROVIDER_MODEL,
      messages: [
        { role: 'system', content: 'Kamu adalah AI Agent di kampus AI Agent Living World. Jawab ringkas dan terstruktur.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!r.ok) throw new Error(`Provider ${r.status}: ${await r.text()}`.slice(0, 500));
  const j = await r.json();
  return { demo: false, text: j.choices?.[0]?.message?.content ?? '' };
}

// ── Job processing ───────────────────────────────────────────────────────────
const STEPS = ['Riset kebutuhan', 'Rancangan', 'Implementasi / penulisan', 'QA & review'];

async function processJob(job) {
  job.status = 'running';
  broadcast('task.progress', { id: job.id, progress: 0 });
  logAudit('task.started', job.id, job.title);
  try {
    for (let i = 0; i < STEPS.length; i++) {
      if (job.status === 'cancelled') return;
      const out = await callLLM(`${job.title}\n${job.description}\nLangkah ${i + 1}/${STEPS.length}: ${STEPS[i]}`);
      job.steps[i].done = true;
      job.steps[i].output = out.text;
      job.progress = Math.round(((i + 1) / STEPS.length) * 100);
      job.costUsd = +(job.costUsd + (out.demo ? 0.001 : 0.01)).toFixed(4);
      broadcast('task.progress', { id: job.id, progress: job.progress, step: STEPS[i] });
    }
    job.status = 'done';
    job.artifact = {
      name: `${job.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`,
      content: `# ${job.title}\n\n${job.steps.map((s) => `## ${s.title}\n\n${s.output}\n`).join('\n')}\n_Mode: ${LIVE ? 'LIVE (' + PROVIDER_MODEL + ')' : 'DEMO (simulasi)'}._\n`,
    };
    broadcast('task.done', { id: job.id, artifact: job.artifact.name });
    logAudit('task.done', job.id, job.artifact.name);
  } catch (err) {
    job.retries += 1;
    if (job.retries <= 2 && job.status !== 'cancelled') {
      logAudit('task.retry', job.id, `percobaan ${job.retries}/2: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000 * job.retries));
      return processJob(job);
    }
    job.status = 'failed';
    job.error = String(err.message ?? err).slice(0, 500);
    broadcast('task.failed', { id: job.id, error: job.error });
    logAudit('task.failed', job.id, job.error);
  }
}

function createJob({ title, description, idempotencyKey }) {
  if (idempotencyKey && seenKeys.has(idempotencyKey)) {
    return jobs.get(seenKeys.get(idempotencyKey));
  }
  const job = {
    id: randomUUID(),
    title, description: description ?? '',
    status: PROVIDER === 'muse'
      ? 'waiting_assistant'
      : /mendesak|urgent|penting/i.test(`${title} ${description}`) ? 'waiting_approval' : 'queued',
    progress: 0, costUsd: 0, retries: 0,
    steps: STEPS.map((t) => ({ title: t, done: false, output: '' })),
    artifact: null, error: null,
    createdAt: new Date().toISOString(),
  };
  jobs.set(job.id, job);
  if (idempotencyKey) seenKeys.set(idempotencyKey, job.id);
  broadcast('task.created', { id: job.id, title: job.title, status: job.status });
  logAudit('task.created', job.id, job.title);
  if (job.status === 'queued') void processJob(job);
  if (job.status === 'waiting_assistant') {
    logAudit('task.waiting_assistant', job.id, 'menunggu Muse mengerjakan via antrean asisten');
    broadcast('task.progress', { id: job.id, progress: 0, note: 'Menunggu Muse (asisten pribadi) mengerjakan tugas ini.' });
  }
  return job;
}

// ── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN ?? 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const body = await new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
  });

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { ok: true, mode: PROVIDER, model: PROVIDER_MODEL, jobs: jobs.size });
  }
  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/api/assistant-queue') {
    return sendJson(res, 200, { provider: 'muse', tasks: [...jobs.values()].filter((j) => j.status === 'waiting_assistant') });
  }
  if (req.method === 'GET' && url.pathname === '/api/tasks') {
    return sendJson(res, 200, { mode: PROVIDER, tasks: [...jobs.values()] });
  }
  if (req.method === 'POST' && url.pathname === '/api/tasks') {
    if (!body.title || typeof body.title !== 'string') return sendJson(res, 400, { error: 'title wajib diisi' });
    const job = createJob(body);
    return sendJson(res, 201, job);
  }
  const m = url.pathname.match(/^\/api\/tasks\/([^/]+)(?:\/(cancel|approve|submit))?$/);
  if (m) {
    const job = jobs.get(m[1]);
    if (!job) return sendJson(res, 404, { error: 'task tidak ditemukan' });
    if (req.method === 'GET' && !m[2]) return sendJson(res, 200, job);
    if (req.method === 'POST' && m[2] === 'cancel') {
      job.status = 'cancelled';
      broadcast('task.failed', { id: job.id, error: 'dibatalkan pengguna' });
      logAudit('task.cancelled', job.id, job.title);
      return sendJson(res, 200, job);
    }
    if (req.method === 'POST' && m[2] === 'approve') {
      if (job.status !== 'waiting_approval') return sendJson(res, 409, { error: `status saat ini ${job.status}, bukan waiting_approval` });
      job.status = 'queued';
      logAudit('task.approved', job.id, job.title);
      void processJob(job);
      return sendJson(res, 200, job);
    }
    if (req.method === 'POST' && m[2] === 'submit') {
      // Dipakai Muse (asisten pribadi) untuk menyerahkan hasil kerja nyata.
      if (job.status !== 'waiting_assistant' && job.status !== 'running') return sendJson(res, 409, { error: `status saat ini ${job.status}, bukan waiting_assistant` });
      if (!body.artifact || typeof body.artifact !== 'string') return sendJson(res, 400, { error: 'artifact (string markdown) wajib diisi' });
      job.steps.forEach((s) => { s.done = true; });
      job.progress = 100;
      job.status = 'done';
      job.artifact = { name: `${job.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`, content: body.artifact };
      job.completedBy = 'Muse (asisten pribadi)';
      broadcast('task.done', { id: job.id, artifact: job.artifact.name });
      logAudit('task.done', job.id, `${job.artifact.name} (oleh Muse)`);
      return sendJson(res, 200, job);
    }
  }
  if (req.method === 'GET' && url.pathname === '/api/audit') {
    return sendJson(res, 200, { audit: audit.slice(-100) });
  }
  return sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`AI Agent Living World orchestrator — mode: ${PROVIDER} (${PROVIDER_MODEL})${PROVIDER === 'muse' ? ' — tugas menunggu Muse via GET /api/assistant-queue' : PROVIDER === 'demo' ? ' (tanpa API key, hasil dilabeli demo)' : ''}`);
  console.log(`Listening on http://localhost:${PORT} — /health, /api/tasks, /events (SSE)`);
});
