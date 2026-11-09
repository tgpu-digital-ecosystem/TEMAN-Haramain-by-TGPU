-- Founder-approved investor access; no public self-service grant.
create table if not exists public.teman_demo_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 approved_at timestamptz not null default now(),
 expires_at timestamptz,
 revoked_at timestamptz
);
alter table public.teman_demo_access enable row level security;
revoke all on public.teman_demo_access from anon,authenticated;
grant select on public.teman_demo_access to authenticated;
drop policy if exists teman_demo_self_read on public.teman_demo_access;
create policy teman_demo_self_read on public.teman_demo_access
for select to authenticated using (user_id=(select auth.uid()));
-- Grant/revoke only through privileged backend operations after founder approval.
