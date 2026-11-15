-- Review-only: not applied to production. No existing TEMAN tables are modified.
begin;
create schema if not exists teman_private;
revoke all on schema teman_private from public;
grant usage on schema teman_private to authenticated;
create function teman_private.email_confirmed() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null)
$$;
revoke all on function teman_private.email_confirmed() from public;
grant execute on function teman_private.email_confirmed() to authenticated;
create table public.teman_businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id),
 company_name text not null check (length(trim(company_name)) between 2 and 160),
 licence_number text not null check (length(trim(licence_number)) between 2 and 100),
 jurisdiction text not null check (length(trim(jurisdiction)) between 2 and 100),
 contact_email text not null check (length(contact_email) <= 254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 verification_notes text not null check (length(trim(verification_notes)) between 10 and 4000),
 consent_at timestamptz not null default now(),
 status text not null default 'pending_review' check(status in ('pending_review','changes_requested','approved','rejected','suspended')),
 is_test boolean not null default false,
 reviewer_id uuid references auth.users(id),
 review_notes text check(length(review_notes)<=4000),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(owner_id)
);
create table public.teman_business_reviews (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.teman_businesses(id),
 reviewer_id uuid not null references auth.users(id),
 previous_status text not null,
 decision text not null,
 notes text not null,
 created_at timestamptz not null default now()
);
alter table public.teman_businesses enable row level security;
alter table public.teman_business_reviews enable row level security;
create policy business_read on public.teman_businesses for select to authenticated
 using(owner_id=(select auth.uid()) or exists(select 1 from public.teman_admins where user_id=(select auth.uid())));
create policy business_apply on public.teman_businesses for insert to authenticated
 with check(owner_id=(select auth.uid()) and status='pending_review' and reviewer_id is null and reviewed_at is null and review_notes is null);
create policy business_update on public.teman_businesses for update to authenticated
 using(owner_id=(select auth.uid()) or exists(select 1 from public.teman_admins where user_id=(select auth.uid())))
 with check(owner_id=(select auth.uid()) or exists(select 1 from public.teman_admins where user_id=(select auth.uid())));
create policy review_read on public.teman_business_reviews for select to authenticated
 using(exists(select 1 from public.teman_businesses b where b.id=business_id));
revoke all on public.teman_businesses,public.teman_business_reviews from anon,authenticated;
grant select,insert,update on public.teman_businesses to authenticated;
grant select on public.teman_business_reviews to authenticated;
-- Invoker guard checks the existing RLS-protected admin registry. User metadata is never trusted.
create function teman_private.guard_business() returns trigger language plpgsql security invoker set search_path='' as $$
declare is_admin boolean;
begin
 if auth.uid() is null or not teman_private.email_confirmed() then raise exception 'Verified email sign-in required'; end if;
 if tg_op='INSERT' then
   if new.status<>'pending_review' or new.owner_id<>auth.uid() or new.reviewer_id is not null or new.reviewed_at is not null or new.review_notes is not null then raise exception 'Application must start pending review'; end if;
   new.created_at:=now(); new.consent_at:=now();
 else
   if new.id<>old.id or new.owner_id<>old.owner_id or new.is_test<>old.is_test or new.created_at<>old.created_at or new.consent_at<>old.consent_at then raise exception 'Immutable application fields'; end if;
   select exists(select 1 from public.teman_admins where user_id=auth.uid()) into is_admin;
   if is_admin then
     if row(new.company_name,new.licence_number,new.jurisdiction,new.contact_email,new.verification_notes) is distinct from row(old.company_name,old.licence_number,old.jurisdiction,old.contact_email,old.verification_notes) then raise exception 'Reviewers cannot edit applicant evidence'; end if;
     if new.status=old.status or new.status='pending_review' or length(trim(coalesce(new.review_notes,'')))<3 then raise exception 'A review decision and notes are required'; end if;
     new.reviewer_id:=auth.uid(); new.reviewed_at:=now();
   else
     if old.status not in ('pending_review','changes_requested') or new.status<>'pending_review' then raise exception 'Only pending or returned applications can be resubmitted'; end if;
     if row(new.reviewer_id,new.reviewed_at,new.review_notes) is distinct from row(old.reviewer_id,old.reviewed_at,old.review_notes) then raise exception 'Only founder may review'; end if;
   end if;
 end if;
 new.updated_at:=now(); return new;
end $$;
revoke all on function teman_private.guard_business() from public;
grant execute on function teman_private.guard_business() to authenticated;
create trigger guard_business before insert or update on public.teman_businesses for each row execute function teman_private.guard_business();
-- Narrow definer trigger can only append server-derived review events. Not an RPC.
create function teman_private.record_business_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status is distinct from old.status and new.reviewer_id=auth.uid() and exists(select 1 from public.teman_admins where user_id=auth.uid()) then
 insert into public.teman_business_reviews(business_id,reviewer_id,previous_status,decision,notes) values(new.id,auth.uid(),old.status,new.status,new.review_notes);
 end if;
 return new;
end $$;
revoke all on function teman_private.record_business_review() from public,anon,authenticated;
create trigger record_business_review after update on public.teman_businesses for each row execute function teman_private.record_business_review();
create index teman_businesses_status_created on public.teman_businesses(status,created_at);
create index teman_business_reviews_business on public.teman_business_reviews(business_id,created_at);
commit;
