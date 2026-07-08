-- Crafted Digital Mini OS — Phase 2 Supabase Schema
-- Run this in the Supabase SQL editor after creating a new project.

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

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.prospects enable row level security;
alter table public.activities enable row level security;


-- Safe re-run: remove old policy definitions before recreating them.
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Members can read their workspaces" on public.workspaces;
drop policy if exists "Owners can update their workspaces" on public.workspaces;
drop policy if exists "Users can create owned workspaces" on public.workspaces;
drop policy if exists "Members can read workspace membership" on public.workspace_members;
drop policy if exists "Owners can add workspace members" on public.workspace_members;
drop policy if exists "Owners can remove workspace members" on public.workspace_members;
drop policy if exists "Members can read prospects" on public.prospects;
drop policy if exists "Members can create prospects" on public.prospects;
drop policy if exists "Members can update prospects" on public.prospects;
drop policy if exists "Owners can delete prospects" on public.prospects;
drop policy if exists "Members can read activities" on public.activities;
drop policy if exists "Members can create activities" on public.activities;
drop policy if exists "Members can update activities" on public.activities;
drop policy if exists "Owners can delete activities" on public.activities;

-- Profiles
create policy "Users can read their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

-- Workspaces
create policy "Members can read their workspaces" on public.workspaces for select using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = workspaces.id and wm.user_id = auth.uid())
);
create policy "Owners can update their workspaces" on public.workspaces for update using (owner_id = auth.uid());
create policy "Users can create owned workspaces" on public.workspaces for insert with check (owner_id = auth.uid());

-- Workspace members
create policy "Members can read workspace membership" on public.workspace_members for select using (
  exists (select 1 from public.workspace_members viewer where viewer.workspace_id = workspace_members.workspace_id and viewer.user_id = auth.uid())
);
create policy "Owners can add workspace members" on public.workspace_members for insert with check (
  exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.owner_id = auth.uid()) or user_id = auth.uid()
);
create policy "Owners can remove workspace members" on public.workspace_members for delete using (
  exists (select 1 from public.workspaces w where w.id = workspace_members.workspace_id and w.owner_id = auth.uid())
);

-- Prospects
create policy "Members can read prospects" on public.prospects for select using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can create prospects" on public.prospects for insert with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can update prospects" on public.prospects for update using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid())
);
create policy "Owners can delete prospects" on public.prospects for delete using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = prospects.workspace_id and wm.user_id = auth.uid() and wm.role = 'owner')
);

-- Activities
create policy "Members can read activities" on public.activities for select using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can create activities" on public.activities for insert with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid())
);
create policy "Members can update activities" on public.activities for update using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid())
);
create policy "Owners can delete activities" on public.activities for delete using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id = activities.workspace_id and wm.user_id = auth.uid() and wm.role = 'owner')
);
