-- Applied to TGPU Digital Supabase project mpidjwjghtpeybedmbkd on 2026-11-09
-- Isolated TEMAN pilgrim profiles: do not reuse Academy, OPTIC or Gulf tables.
create table if not exists public.teman_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 preferred_language text not null default 'ms' check (preferred_language in ('ms','en','ar')),
 pilgrim_details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.teman_profiles enable row level security;
revoke all on public.teman_profiles from anon;
grant select,insert,update on public.teman_profiles to authenticated;
create policy "teman_read_own" on public.teman_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "teman_insert_own" on public.teman_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "teman_update_own" on public.teman_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create index if not exists teman_profiles_created_at_idx on public.teman_profiles(created_at);
