-- Test fixture ONLY. Existing production registry is not created/replaced by app migrations.
create table public.teman_admins(user_id uuid primary key references auth.users(id));
alter table public.teman_admins enable row level security;
revoke all on public.teman_admins from public,anon,authenticated;
grant select on public.teman_admins to authenticated;
create policy own_admin on public.teman_admins for select to authenticated using(user_id=auth.uid());

-- Mirrors production membership read policies, including the excess grant under test.
create table public.teman_memberships(user_id uuid primary key references auth.users(id),tier text not null default 'basic',status text not null default 'active',vip_expires_at timestamptz);
alter table public.teman_memberships enable row level security;
revoke all on public.teman_memberships from public,anon,authenticated;
grant select,truncate,references,trigger on public.teman_memberships to authenticated;
create policy own_membership on public.teman_memberships for select to authenticated using(user_id=auth.uid());
