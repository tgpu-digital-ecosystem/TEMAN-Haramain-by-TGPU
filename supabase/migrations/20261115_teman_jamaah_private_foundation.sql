-- TEMAN private jamaah foundation. REVIEW ONLY: do not apply without
-- checking existing schema, security and migration history in Supabase.
-- No public group browsing; no open joining by guessing a group code.
create table if not exists public.teman_jamaah_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  organiser_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.teman_jamaah_members (
  group_id uuid not null references public.teman_jamaah_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('organiser','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id,user_id)
);
create table if not exists public.teman_jamaah_announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.teman_jamaah_groups(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists teman_jamaah_members_user_idx on public.teman_jamaah_members(user_id);
create index if not exists teman_jamaah_announcements_group_idx on public.teman_jamaah_announcements(group_id,created_at desc);
alter table public.teman_jamaah_groups enable row level security;
alter table public.teman_jamaah_members enable row level security;
alter table public.teman_jamaah_announcements enable row level security;
revoke all on public.teman_jamaah_groups,public.teman_jamaah_members,public.teman_jamaah_announcements from anon;
grant select,insert on public.teman_jamaah_groups to authenticated;
grant select,insert,delete on public.teman_jamaah_members to authenticated;
grant select,insert on public.teman_jamaah_announcements to authenticated;

-- Membership lookups only expose the current user's membership.
create policy teman_jamaah_member_self_read on public.teman_jamaah_members
  for select to authenticated using (user_id = (select auth.uid()));
-- Organisers can invite members, but cannot grant organiser role.
create policy teman_jamaah_member_organiser_invite on public.teman_jamaah_members
  for insert to authenticated with check (
    role = 'member' and exists (
      select 1 from public.teman_jamaah_groups g
      where g.id = group_id and g.organiser_id = (select auth.uid())
    )
  );
-- Members may leave, but organisers cannot be removed via this policy.
create policy teman_jamaah_member_leave on public.teman_jamaah_members
  for delete to authenticated using (user_id = (select auth.uid()) and role = 'member');

create policy teman_jamaah_group_create on public.teman_jamaah_groups
  for insert to authenticated with check (organiser_id = (select auth.uid()));
create policy teman_jamaah_group_read on public.teman_jamaah_groups
  for select to authenticated using (
    organiser_id = (select auth.uid()) or exists (
      select 1 from public.teman_jamaah_members m
      where m.group_id = id and m.user_id = (select auth.uid())
    )
  );
create policy teman_jamaah_announcement_read on public.teman_jamaah_announcements
  for select to authenticated using (
    exists (select 1 from public.teman_jamaah_groups g
      where g.id = group_id and (g.organiser_id = (select auth.uid())
        or exists (select 1 from public.teman_jamaah_members m
          where m.group_id = g.id and m.user_id = (select auth.uid()))))
  );
create policy teman_jamaah_announcement_organiser_write on public.teman_jamaah_announcements
  for insert to authenticated with check (
    author_id = (select auth.uid()) and exists (
      select 1 from public.teman_jamaah_groups g
      where g.id = group_id and g.organiser_id = (select auth.uid())
    )
  );
-- This initial foundation intentionally excludes invitation tokens, chat,
-- acknowledgements, image uploads, public posts and location sharing.
-- Before production: validate RLS using two distinct authenticated users,
-- ensure invite acceptance requires consent, and audit group capacity/rate limits.
