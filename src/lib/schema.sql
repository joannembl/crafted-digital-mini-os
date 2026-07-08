-- Crafted Digital Mini OS — Phase 4 Supabase Schema
-- Safe to run multiple times in Supabase SQL Editor.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.workspace_role as enum ('owner', 'member');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Crafted Digital',
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_name text not null,
  owner_name text,
  category text,
  phone text,
  email text,
  website text,
  instagram text,
  status text not null default 'research',
  demo_status text not null default 'not_started',
  preview_url text,
  live_url text,
  demo_brief text,
  demo_copy text,
  demo_notes text,
  demo_last_sent timestamptz,
  package_type text,
  monthly_price numeric(10,2),
  setup_fee numeric(10,2),
  add_ons text,
  client_notes text,
  converted_at timestamptz,
  next_follow_up date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  type text not null default 'Note',
  note text not null,
  created_at timestamptz not null default now()
);

-- Safe Phase 3/4 upgrade columns for existing projects.
alter table public.prospects add column if not exists live_url text;
alter table public.prospects add column if not exists demo_brief text;
alter table public.prospects add column if not exists demo_copy text;
alter table public.prospects add column if not exists demo_notes text;
alter table public.prospects add column if not exists demo_last_sent timestamptz;
alter table public.prospects add column if not exists package_type text;
alter table public.prospects add column if not exists monthly_price numeric(10,2);
alter table public.prospects add column if not exists setup_fee numeric(10,2);
alter table public.prospects add column if not exists add_ons text;
alter table public.prospects add column if not exists client_notes text;
alter table public.prospects add column if not exists converted_at timestamptz;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.prospects enable row level security;
alter table public.activities enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.prospects to authenticated;
grant select, insert, update, delete on public.activities to authenticated;

-- Safe re-run: remove old policy definitions before recreating them.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;

drop policy if exists "Members can read their workspaces" on public.workspaces;
drop policy if exists "Owners can read their workspaces" on public.workspaces;
drop policy if exists "Owners can update their workspaces" on public.workspaces;
drop policy if exists "Users can create owned workspaces" on public.workspaces;

drop policy if exists "Members can read workspace membership" on public.workspace_members;
drop policy if exists "Owners can add workspace members" on public.workspace_members;
drop policy if exists "Owners can remove workspace members" on public.workspace_members;
drop policy if exists "Users can view own workspace memberships" on public.workspace_members;
drop policy if exists "Users can create own workspace membership" on public.workspace_members;
drop policy if exists "Users can update own workspace membership" on public.workspace_members;
drop policy if exists "Users can delete own workspace membership" on public.workspace_members;

drop policy if exists "Members can read prospects" on public.prospects;
drop policy if exists "Members can create prospects" on public.prospects;
drop policy if exists "Members can update prospects" on public.prospects;
drop policy if exists "Owners can delete prospects" on public.prospects;

drop policy if exists "Members can read activities" on public.activities;
drop policy if exists "Members can create activities" on public.activities;
drop policy if exists "Members can update activities" on public.activities;
drop policy if exists "Owners can delete activities" on public.activities;

-- Profiles
create policy "Users can read their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Workspaces: owner-first policies to avoid workspace_members recursion during bootstrap.
create policy "Users can create owned workspaces" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners can read their workspaces" on public.workspaces for select to authenticated using (owner_id = auth.uid());
create policy "Owners can update their workspaces" on public.workspaces for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Workspace members: intentionally non-recursive.
create policy "Users can view own workspace memberships" on public.workspace_members for select to authenticated using (user_id = auth.uid());
create policy "Users can create own workspace membership" on public.workspace_members for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own workspace membership" on public.workspace_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own workspace membership" on public.workspace_members for delete to authenticated using (user_id = auth.uid());

-- Prospects
create policy "Members can read prospects" on public.prospects for select to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can create prospects" on public.prospects for insert to authenticated with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can update prospects" on public.prospects for update to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid())
) with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid())
);
create policy "Owners can delete prospects" on public.prospects for delete to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid() and wm.role = 'owner')
);

-- Activities
create policy "Members can read activities" on public.activities for select to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can create activities" on public.activities for insert to authenticated with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can update activities" on public.activities for update to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid())
) with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid())
);
create policy "Owners can delete activities" on public.activities for delete to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid() and wm.role = 'owner')
);
