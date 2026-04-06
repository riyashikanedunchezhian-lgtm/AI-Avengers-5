-- ============================================================
-- AI Patient Assistant — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- Team: AI Avengers | Medathon'26
-- ============================================================

-- 1. Chat History
create table if not exists chat_history (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade,
  message      text not null,
  response     text not null,
  condition    text,
  sources      text[]  default '{}',
  is_emergency boolean default false,
  severity     text    default 'low',
  created_at   timestamptz default now()
);

-- 2. Medicine Reminders
create table if not exists reminders (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  medicine   text    not null,
  dose       text    not null,
  frequency  text    not null,
  times      text[]  default '{}',
  active     boolean default true,
  created_at timestamptz default now()
);

-- 3. Symptom Logs
create table if not exists symptom_logs (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  condition  text    not null,
  answers    jsonb   default '[]',
  severity   text    default 'low',
  created_at timestamptz default now()
);

-- ── Row Level Security (RLS) — users only see their own data ──────────────────
alter table chat_history  enable row level security;
alter table reminders     enable row level security;
alter table symptom_logs  enable row level security;

create policy "Users see own chat"     on chat_history  for all using (auth.uid() = user_id);
create policy "Users see own reminder" on reminders     for all using (auth.uid() = user_id);
create policy "Users see own symptoms" on symptom_logs  for all using (auth.uid() = user_id);
