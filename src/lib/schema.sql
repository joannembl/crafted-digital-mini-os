-- Crafted Digital Mini OS — Phase 7 Supabase Schema
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

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  code text not null unique,
  role public.workspace_role not null default 'member',
  created_by uuid references public.profiles(id) on delete set null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_name text not null,
  slug text,
  owner_name text,
  category text,
  phone text,
  email text,
  website text,
  address text,
  instagram text,
  facebook text,
  google_place_id text,
  google_maps_url text,
  google_rating numeric(3,2),
  google_review_count integer,
  google_types text[],
  google_opening_hours text[],
  google_imported_at timestamptz,
  status text not null default 'research',
  demo_status text not null default 'not_started',
  deployment_status text not null default 'idle',
  deployment_checked_at timestamptz,
  preview_url text,
  live_url text,
  demo_brief text,
  demo_copy text,
  demo_notes text,
  demo_last_sent timestamptz,
  ai_research_summary text,
  ai_source_links text,
  ai_generated_at timestamptz,
  demo_site_html text,
  demo_site_css text,
  demo_design_summary text,
  demo_style text,
  brand_logo_url text,
  brand_profile jsonb,
  generation_provider text,
  generation_error text,
  package_type text,
  monthly_price numeric(10,2),
  setup_fee numeric(10,2),
  add_ons text,
  client_notes text,
  proposal_status text not null default 'not_started',
  proposal_notes text,
  proposal_sent_at timestamptz,
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

create table if not exists public.business_research (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  provider text not null default 'google_places',
  google_json jsonb,
  website_content jsonb,
  brand_profile jsonb,
  logo_url text,
  ai_summary text,
  source_links text,
  created_at timestamptz not null default now()
);


-- Safe Phase 3/4 upgrade columns for existing projects.
alter table public.prospects add column if not exists slug text;
alter table public.prospects add column if not exists live_url text;
alter table public.prospects add column if not exists facebook text;
alter table public.prospects add column if not exists address text;
alter table public.prospects add column if not exists google_place_id text;
alter table public.prospects add column if not exists google_maps_url text;
alter table public.prospects add column if not exists google_rating numeric(3,2);
alter table public.prospects add column if not exists google_review_count integer;
alter table public.prospects add column if not exists google_types text[];
alter table public.prospects add column if not exists google_opening_hours text[];
alter table public.prospects add column if not exists google_imported_at timestamptz;
alter table public.prospects add column if not exists deployment_status text not null default 'idle';
alter table public.prospects add column if not exists deployment_checked_at timestamptz;
alter table public.prospects add column if not exists demo_brief text;
alter table public.prospects add column if not exists demo_copy text;
alter table public.prospects add column if not exists demo_notes text;
alter table public.prospects add column if not exists demo_last_sent timestamptz;
alter table public.prospects add column if not exists ai_research_summary text;
alter table public.prospects add column if not exists ai_source_links text;
alter table public.prospects add column if not exists ai_generated_at timestamptz;
alter table public.prospects add column if not exists demo_site_html text;
alter table public.prospects add column if not exists demo_site_css text;
alter table public.prospects add column if not exists demo_design_summary text;
alter table public.prospects add column if not exists demo_style text;
alter table public.prospects add column if not exists brand_logo_url text;
alter table public.prospects add column if not exists brand_profile jsonb;
alter table public.prospects add column if not exists generation_provider text;
alter table public.prospects add column if not exists generation_error text;
alter table public.prospects add column if not exists package_type text;
alter table public.prospects add column if not exists monthly_price numeric(10,2);
alter table public.prospects add column if not exists setup_fee numeric(10,2);
alter table public.prospects add column if not exists add_ons text;
alter table public.prospects add column if not exists client_notes text;
alter table public.prospects add column if not exists proposal_status text not null default 'not_started';
alter table public.prospects add column if not exists proposal_notes text;
alter table public.prospects add column if not exists proposal_sent_at timestamptz;
alter table public.prospects add column if not exists converted_at timestamptz;

alter table public.business_research add column if not exists brand_profile jsonb;
alter table public.business_research add column if not exists logo_url text;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invites enable row level security;
alter table public.prospects enable row level security;
alter table public.activities enable row level security;
alter table public.business_research enable row level security;


-- Backfill readable slugs for existing prospects. The app also falls back to a generated slug if this is empty.
update public.prospects
set slug = regexp_replace(lower(trim(business_name)), '[^a-z0-9]+', '-', 'g')
where slug is null or slug = '';

create index if not exists prospects_workspace_slug_idx on public.prospects(workspace_id, slug);

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.workspace_invites to authenticated;
grant select, insert, update, delete on public.prospects to authenticated;
grant select, insert, update, delete on public.activities to authenticated;
grant select, insert, update, delete on public.business_research to authenticated;


-- Helper functions avoid self-referencing RLS recursion.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
  );
$$;

grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

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
drop policy if exists "Workspace members can read workspace membership" on public.workspace_members;
drop policy if exists "Users can join a workspace as themselves" on public.workspace_members;
drop policy if exists "Owners can read workspace invites" on public.workspace_invites;
drop policy if exists "Authenticated users can read active invite codes" on public.workspace_invites;
drop policy if exists "Owners can create workspace invites" on public.workspace_invites;
drop policy if exists "Owners can update workspace invites" on public.workspace_invites;
drop policy if exists "Owners can delete workspace invites" on public.workspace_invites;

drop policy if exists "Members can read prospects" on public.prospects;
drop policy if exists "Members can create prospects" on public.prospects;
drop policy if exists "Members can update prospects" on public.prospects;
drop policy if exists "Owners can delete prospects" on public.prospects;

drop policy if exists "Members can read business research" on public.business_research;
drop policy if exists "Members can create business research" on public.business_research;
drop policy if exists "Members can update business research" on public.business_research;
drop policy if exists "Owners can delete business research" on public.business_research;

drop policy if exists "Members can read activities" on public.activities;
drop policy if exists "Members can create activities" on public.activities;
drop policy if exists "Members can update activities" on public.activities;
drop policy if exists "Owners can delete activities" on public.activities;

-- Profiles
create policy "Users can read their own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Workspaces
create policy "Users can create owned workspaces" on public.workspaces for insert to authenticated with check (owner_id = auth.uid());
create policy "Owners can read their workspaces" on public.workspaces for select to authenticated using (owner_id = auth.uid() or public.is_workspace_member(id));
create policy "Owners can update their workspaces" on public.workspaces for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Workspace members: helper functions avoid recursive policies.
create policy "Workspace members can read workspace membership" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Users can join a workspace as themselves" on public.workspace_members for insert to authenticated with check (
  user_id = auth.uid() and (role = 'member' or public.is_workspace_owner(workspace_id))
);
create policy "Users can update own workspace membership" on public.workspace_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can delete own workspace membership" on public.workspace_members for delete to authenticated using (user_id = auth.uid() or public.is_workspace_owner(workspace_id));

-- Workspace invites
create policy "Owners can read workspace invites" on public.workspace_invites for select to authenticated using (public.is_workspace_owner(workspace_id));
create policy "Authenticated users can read active invite codes" on public.workspace_invites for select to authenticated using (revoked = false);
create policy "Owners can create workspace invites" on public.workspace_invites for insert to authenticated with check (public.is_workspace_owner(workspace_id));
create policy "Owners can update workspace invites" on public.workspace_invites for update to authenticated using (public.is_workspace_owner(workspace_id)) with check (public.is_workspace_owner(workspace_id));
create policy "Owners can delete workspace invites" on public.workspace_invites for delete to authenticated using (public.is_workspace_owner(workspace_id));

-- Prospects
create policy "Members can read prospects" on public.prospects for select to authenticated using (
  public.is_workspace_member(prospects.workspace_id)
);
create policy "Members can create prospects" on public.prospects for insert to authenticated with check (
  public.is_workspace_member(prospects.workspace_id)
);
create policy "Members can update prospects" on public.prospects for update to authenticated using (
  public.is_workspace_member(prospects.workspace_id)
) with check (
  public.is_workspace_member(prospects.workspace_id)
);
create policy "Owners can delete prospects" on public.prospects for delete to authenticated using (
  public.is_workspace_owner(prospects.workspace_id)
);

-- Business research
create policy "Members can read business research" on public.business_research for select to authenticated using (
  public.is_workspace_member(business_research.workspace_id)
);
create policy "Members can create business research" on public.business_research for insert to authenticated with check (
  public.is_workspace_member(business_research.workspace_id)
);
create policy "Members can update business research" on public.business_research for update to authenticated using (
  public.is_workspace_member(business_research.workspace_id)
) with check (
  public.is_workspace_member(business_research.workspace_id)
);
create policy "Owners can delete business research" on public.business_research for delete to authenticated using (
  public.is_workspace_owner(business_research.workspace_id)
);

-- Activities
create policy "Members can read activities" on public.activities for select to authenticated using (
  public.is_workspace_member(activities.workspace_id)
);
create policy "Members can create activities" on public.activities for insert to authenticated with check (
  public.is_workspace_member(activities.workspace_id)
);
create policy "Members can update activities" on public.activities for update to authenticated using (
  public.is_workspace_member(activities.workspace_id)
) with check (
  public.is_workspace_member(activities.workspace_id)
);
create policy "Owners can delete activities" on public.activities for delete to authenticated using (
  public.is_workspace_owner(activities.workspace_id)
);
