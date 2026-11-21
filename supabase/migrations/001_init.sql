# ── AI Agent Living World — Supabase schema (Fase 1: migrasi, BELUM di-apply) ──
# Terapkan di proyek Supabase:  supabase db push  (atau jalankan di SQL Editor).
# RLS aktif di semua tabel; isolasi per pengguna/organisasi via auth.uid().
# Status: DRAFT Fase 1 — skema ditulis & dicek sintaksisnya, belum diuji
# terhadap instance Supabase live (lihat TEST-REPORT.md).

create extension if not exists pgcrypto;

-- ── Organisasi & dunia ───────────────────────────────────────────────────────
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  template text not null default 'campus-starter',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.world_settings (
  world_id uuid primary key references public.worlds (id) on delete cascade,
  clock_min int not null default 480,
  speed int not null default 1,
  mode text not null default 'demo' check (mode in ('demo','live')),
  quality text not null default 'medium',
  updated_at timestamptz not null default now()
);

-- ── Bangunan & layout ────────────────────────────────────────────────────────
create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds (id) on delete cascade,
  name text not null, kind text not null,
  pos_x numeric not null, pos_y numeric not null default 0, pos_z numeric not null,
  floors int not null default 1,
  created_at timestamptz not null default now()
);
create table if not exists public.floors (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings (id) on delete cascade,
  level int not null, unique (building_id, level)
);
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors (id) on delete cascade,
  name text not null, kind text not null,
  pos_x numeric not null, pos_z numeric not null,
  width numeric not null, depth numeric not null
);
create table if not exists public.placed_objects (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms (id) on delete cascade,
  world_id uuid not null references public.worlds (id) on delete cascade,
  kind text not null, name text,
  pos_x numeric not null, pos_y numeric not null default 0, pos_z numeric not null,
  rot_y numeric not null default 0,
  props jsonb not null default '{}'::jsonb
);

-- ── Agent ────────────────────────────────────────────────────────────────────
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds (id) on delete cascade,
  name text not null, unique (world_id, name)
);
create table if not exists public.agent_profiles (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  name text not null, role text not null,
  personality text, avatar jsonb not null default '{}'::jsonb,
  desk_room_id uuid references public.rooms (id) on delete set null,
  home_room_id uuid references public.rooms (id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.agent_configs (
  agent_id uuid primary key references public.agent_profiles (id) on delete cascade,
  provider text not null, model text not null,
  system_prompt text not null default '',
  tools jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '{}'::jsonb,
  cost_limit_usd numeric, token_limit int,
  updated_at timestamptz not null default now()
);
create table if not exists public.agent_positions (
  agent_id uuid primary key references public.agent_profiles (id) on delete cascade,
  pos_x numeric not null, pos_y numeric not null default 0, pos_z numeric not null,
  status text not null default 'online',
  visual text not null default 'idle',
  updated_at timestamptz not null default now()
);
create table if not exists public.agent_schedules (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agent_profiles (id) on delete cascade,
  mode text not null default 'realistic' check (mode in ('realistic','fast','always-working','custom')),
  entries jsonb not null default '[]'::jsonb
);
create table if not exists public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds (id) on delete cascade,
  name text not null, kind text not null, uri text,
  created_at timestamptz not null default now()
);
create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null,
  -- API key TIDAK disimpan plain: hanya referensi ke vault/secret backend.
  secret_ref text,
  status text not null default 'disconnected',
  created_at timestamptz not null default now(),
  unique (organization_id, provider)
);

-- ── Tugas & orkestrasi ───────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds (id) on delete cascade,
  title text not null, description text not null default '',
  manager_id uuid references public.agent_profiles (id) on delete set null,
  assignee_id uuid references public.agent_profiles (id) on delete set null,
  status text not null default 'queued'
    check (status in ('queued','running','waiting_approval','done','failed','cancelled')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  progress int not null default 0 check (progress between 0 and 100),
  cost_usd numeric not null default 0,
  error text,
  demo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  title text not null, agent_id uuid references public.agent_profiles (id) on delete set null,
  done boolean not null default false, position int not null default 0
);
create table if not exists public.task_dependencies (
  task_id uuid not null references public.tasks (id) on delete cascade,
  depends_on uuid not null references public.tasks (id) on delete cascade,
  primary key (task_id, depends_on)
);
create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  kind text not null, message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks (id) on delete set null,
  agent_id uuid references public.agent_profiles (id) on delete set null,
  model text, status text not null default 'running',
  tokens_in int not null default 0, tokens_out int not null default 0,
  cost_usd numeric not null default 0,
  started_at timestamptz not null default now(), ended_at timestamptz
);
create table if not exists public.tool_calls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs (id) on delete cascade,
  tool text not null, args jsonb not null default '{}'::jsonb,
  result jsonb, status text not null default 'ok',
  created_at timestamptz not null default now()
);
create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks (id) on delete cascade,
  kind text not null, status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  decided_by uuid references auth.users (id),
  decided_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks (id) on delete set null,
  name text not null, kind text not null,
  storage_path text, content text,
  created_at timestamptz not null default now()
);

-- ── Meeting, usage, log ──────────────────────────────────────────────────────
create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds (id) on delete cascade,
  topic text not null, room_id uuid references public.rooms (id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled','live','done')),
  minutes text, created_at timestamptz not null default now()
);
create table if not exists public.meeting_messages (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  speaker text not null, text text not null, demo boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  agent_id uuid references public.agent_profiles (id) on delete set null,
  provider text not null, model text not null,
  tokens_in int not null default 0, tokens_out int not null default 0,
  cost_usd numeric not null default 0,
  recorded_at timestamptz not null default now()
);
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  world_id uuid not null references public.worlds (id) on delete cascade,
  kind text not null, message text not null,
  created_at timestamptz not null default now()
);

-- ── RLS: aktif di semua tabel; kebijakan owner-based ─────────────────────────
alter table public.organizations enable row level security;
alter table public.worlds enable row level security;
alter table public.world_settings enable row level security;
alter table public.buildings enable row level security;
alter table public.floors enable row level security;
alter table public.rooms enable row level security;
alter table public.placed_objects enable row level security;
alter table public.teams enable row level security;
alter table public.agent_profiles enable row level security;
alter table public.agent_configs enable row level security;
alter table public.agent_positions enable row level security;
alter table public.agent_schedules enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.provider_connections enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.task_events enable row level security;
alter table public.agent_runs enable row level security;
alter table public.tool_calls enable row level security;
alter table public.approvals enable row level security;
alter table public.artifacts enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_messages enable row level security;
alter table public.usage_records enable row level security;
alter table public.activity_logs enable row level security;

-- Kebijakan dasar: pemilik organisasi melihat/mengubah datanya sendiri.
-- (Kebijakan per tabel dunia mengikuti rantai worlds → organizations.)
create policy "org owner all" on public.organizations
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "world via org" on public.worlds
  for all using (exists (select 1 from public.organizations o where o.id = worlds.organization_id and o.owner_id = auth.uid()))
  with check (exists (select 1 from public.organizations o where o.id = worlds.organization_id and o.owner_id = auth.uid()));
create policy "tasks via world" on public.tasks
  for all using (exists (select 1 from public.worlds w join public.organizations o on o.id = w.organization_id where w.id = tasks.world_id and o.owner_id = auth.uid()))
  with check (exists (select 1 from public.worlds w join public.organizations o on o.id = w.organization_id where w.id = tasks.world_id and o.owner_id = auth.uid()));
-- TODO Fase 3: kebijakan setara untuk tabel turunan lainnya (buildings,
-- agent_profiles, meetings, artifacts, dst.) mengikuti pola yang sama.
