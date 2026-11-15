-- Review only: apply after the two PR #38 migrations in an isolated test environment.
begin;
create table public.teman_provider_profiles(
 business_id uuid primary key references public.teman_businesses(id),
 display_name text not null check(length(trim(display_name)) between 2 and 120 and display_name !~ '[<>[:cntrl:]]' and lower(display_name) !~ '(verified|official|معتمد|rasmi|disahkan)'),
 description text not null default '' check(length(description)<=2000),
 category text not null default 'other' check(category in ('umrah_operator','transport','accommodation','accessibility','other')),
 updated_at timestamptz not null default now()
);
alter table public.teman_provider_profiles enable row level security;
create policy profile_read on public.teman_provider_profiles for select to authenticated using(teman_private.business_approved(business_id) or exists(select 1 from public.teman_businesses where id=business_id));
create policy profile_insert on public.teman_provider_profiles for insert to authenticated with check(exists(select 1 from public.teman_businesses where id=business_id and owner_id=auth.uid() and status='approved'));
create policy profile_update on public.teman_provider_profiles for update to authenticated using(exists(select 1 from public.teman_businesses where id=business_id and owner_id=auth.uid() and status='approved')) with check(exists(select 1 from public.teman_businesses where id=business_id and owner_id=auth.uid() and status='approved'));
revoke all on public.teman_provider_profiles from public,anon,authenticated;
grant select,insert on public.teman_provider_profiles to authenticated;
grant update(display_name,description,category) on public.teman_provider_profiles to authenticated;
create function teman_private.touch_profile() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at:=now();return new;end $$;
revoke all on function teman_private.touch_profile() from public;
create trigger touch_profile before insert or update on public.teman_provider_profiles for each row execute function teman_private.touch_profile();
alter table public.teman_services drop constraint teman_services_status_check;
alter table public.teman_services add constraint teman_services_status_check check(status in ('draft','pending_review','published','rejected','archived'));
alter table public.teman_services add column inclusions text not null default '' check(length(inclusions)<=2000),add column exclusions text not null default '' check(length(exclusions)<=2000),add column contact text not null default '' check(length(contact)<=500),add column updated_at timestamptz not null default now();
create or replace function teman_private.guard_service() returns trigger language plpgsql security invoker set search_path='' as $$
declare admin boolean;
begin
 select exists(select 1 from public.teman_admins where user_id=auth.uid()) into admin;
 if tg_op='INSERT' then new.created_at:=now(); end if;
 if tg_op='UPDATE' then
 if new.id<>old.id or new.business_id<>old.business_id or new.created_at<>old.created_at then raise exception 'Immutable service ownership'; end if;
 if admin then
 if new.status=old.status or new.status not in ('published','rejected','draft','archived') then raise exception 'Invalid moderation decision'; end if;
 if row(new.title,new.category,new.description,new.service_area,new.availability,new.pricing,new.terms,new.inclusions,new.exclusions,new.contact) is distinct from row(old.title,old.category,old.description,old.service_area,old.availability,old.pricing,old.terms,old.inclusions,old.exclusions,old.contact) then raise exception 'Moderators cannot edit provider content'; end if;
 else
 if new.status not in ('draft','pending_review','archived') then raise exception 'Founder moderation required'; end if;
 end if;
 end if;
 if new.status not in ('draft','archived') and not teman_private.business_approved(new.business_id) then raise exception 'Approved provider required'; end if;
 new.updated_at:=now();return new;
end $$;
-- Private metadata is not user-writable; all file operations go through the validated Worker.
create table public.teman_verification_documents(
 id uuid primary key,
 business_id uuid not null references public.teman_businesses(id),
 object_key text not null unique check(object_key like 'teman/verification/%'),
 filename text not null check(length(filename) between 1 and 120),
 mime text not null check(mime in ('application/pdf','image/jpeg','image/png')),
 size integer not null check(size between 1 and 5242880),
 kind text not null check(kind in ('registration','licence','supporting')),
 state text not null default 'quarantined' check(state='quarantined'),
 created_at timestamptz not null default now()
);
alter table public.teman_verification_documents enable row level security;
revoke all on public.teman_verification_documents from public,anon,authenticated;
grant select on public.teman_verification_documents to authenticated;
create policy documents_read on public.teman_verification_documents for select to authenticated using(exists(select 1 from public.teman_businesses b where b.id=business_id));
create function teman_private.document_quota() returns trigger language plpgsql set search_path='' as $$
declare s text;
begin
 -- Row lock serialises reservations and founder review to prevent quota races.
 select status into s from public.teman_businesses where id=new.business_id for update;
 if s not in ('pending_review','changes_requested') then raise exception 'Documents locked for review';end if;
 if (select count(*) from public.teman_verification_documents where business_id=new.business_id)>=10 then raise exception 'Document quota exceeded';end if;
 new.created_at:=now();return new;
end $$;
revoke all on function teman_private.document_quota() from public,anon,authenticated;
create trigger document_quota before insert on public.teman_verification_documents for each row execute function teman_private.document_quota();
create table public.teman_pilot_users(user_id uuid primary key references auth.users(id),created_at timestamptz not null default now());
alter table public.teman_pilot_users enable row level security;
revoke all on public.teman_pilot_users from public,anon,authenticated;
grant select on public.teman_pilot_users to authenticated;
create policy pilot_self_read on public.teman_pilot_users for select to authenticated using(user_id=auth.uid());
create table public.teman_pilot_feedback(
 id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id),
 user_role text not null check(user_role in ('pilgrim','provider','founder')),
 workflow text not null check(length(workflow) between 2 and 120),
 rating integer not null check(rating between 1 and 5),
 category text not null check(category in ('usability','reliability','translation','accessibility','other')),
 comments text not null check(length(trim(comments)) between 10 and 2000),suggestion text not null default '' check(length(suggestion)<=2000),
 is_test boolean not null default false,created_at timestamptz not null default now()
);
alter table public.teman_pilot_feedback enable row level security;
revoke all on public.teman_pilot_feedback from public,anon,authenticated;
grant select,insert on public.teman_pilot_feedback to authenticated;
create policy feedback_read on public.teman_pilot_feedback for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.teman_admins where user_id=auth.uid()));
create policy feedback_submit on public.teman_pilot_feedback for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.teman_pilot_users where user_id=auth.uid()) and teman_private.email_confirmed());
create function teman_private.guard_feedback() returns trigger language plpgsql set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if (select count(*) from public.teman_pilot_feedback where user_id=auth.uid() and created_at>now()-interval '1 day')>=10 then raise exception 'Feedback limit';end if;
 if new.user_role='founder' and not exists(select 1 from public.teman_admins where user_id=auth.uid()) then raise exception 'Invalid role';end if;
 if new.user_role='provider' and not exists(select 1 from public.teman_businesses where owner_id=auth.uid()) then raise exception 'Invalid role';end if;
 new.created_at:=now();return new;
end $$;
revoke all on function teman_private.guard_feedback() from public;
create trigger guard_feedback before insert on public.teman_pilot_feedback for each row execute function teman_private.guard_feedback();
-- First response is server-derived from the first provider message, not status clicks.
create function teman_private.first_response() returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.teman_service_enquiries e set first_response_at=coalesce(e.first_response_at,new.created_at),status=case when e.status='open' then 'responded' else e.status end
 from public.teman_services s,public.teman_businesses b
 where e.id=new.enquiry_id and s.id=e.service_id and b.id=s.business_id and b.owner_id=new.sender_id;
 return new;
end $$;
revoke all on function teman_private.first_response() from public,anon,authenticated;
-- Keep immutable-field protection, allow only the nested server message trigger to set first response.
create or replace function teman_private.guard_enquiry() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then
 if not teman_private.email_confirmed() then raise exception 'Verified email required';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if (select count(*) from public.teman_service_enquiries where pilgrim_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'Enquiry limit';end if;
 new.created_at:=now();
 else
 if row(new.id,new.service_id,new.pilgrim_id,new.body,new.is_test,new.created_at) is distinct from row(old.id,old.service_id,old.pilgrim_id,old.body,old.is_test,old.created_at) or (new.first_response_at is distinct from old.first_response_at and pg_trigger_depth()<2) then raise exception 'Only enquiry status can change';end if;
 end if;return new;
end $$;
create trigger first_response after insert on public.teman_enquiry_messages for each row execute function teman_private.first_response();
-- Aggregate RPC is invoker scoped plus explicit provider ownership; no identity fields returned.
create function public.teman_pilot_metrics(start_at timestamptz,end_at timestamptz,test_data boolean default false)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare founder boolean; bid uuid; result jsonb;
begin
 if auth.uid() is null or end_at<=start_at or end_at-start_at>interval '366 days' then raise exception 'Invalid report range or session';end if;
 select exists(select 1 from public.teman_admins where user_id=auth.uid()) into founder;
 select id into bid from public.teman_businesses where owner_id=auth.uid();
 if not founder and bid is null then raise exception 'Provider or founder required';end if;
 select jsonb_build_object(
 'applications',count(*),'pending',count(*) filter(where status in ('pending_review','changes_requested')),
 'approved',count(*) filter(where status='approved'),'rejected_suspended',count(*) filter(where status in ('rejected','suspended')))
 into result from public.teman_businesses where founder and is_test=test_data and created_at>=start_at and created_at<end_at;
 if not founder then result:='{}'::jsonb;end if;
 result:=result||jsonb_build_object('published_services',(select count(*) from public.teman_services s join public.teman_businesses b on b.id=s.business_id where (founder or s.business_id=bid) and b.is_test=test_data and s.status='published' and s.created_at>=start_at and s.created_at<end_at));
 return result||(select jsonb_build_object('enquiries',count(*),'awaiting_response',count(*) filter(where e.status='open'),'responded',count(*) filter(where e.status='responded'),'closed',count(*) filter(where e.status='closed'),'average_first_response_seconds',avg(extract(epoch from(e.first_response_at-e.created_at))) filter(where e.first_response_at is not null),'feedback',case when founder then (select count(*) from public.teman_pilot_feedback where is_test=test_data and created_at>=start_at and created_at<end_at) else null end)
 from public.teman_service_enquiries e join public.teman_services s on s.id=e.service_id
 where (founder or s.business_id=bid) and e.is_test=test_data and e.created_at>=start_at and e.created_at<end_at);
end $$;
revoke all on function public.teman_pilot_metrics(timestamptz,timestamptz,boolean) from public,anon;
grant execute on function public.teman_pilot_metrics(timestamptz,timestamptz,boolean) to authenticated;
create index teman_feedback_user_created on public.teman_pilot_feedback(user_id,created_at);
create index teman_documents_business on public.teman_verification_documents(business_id);
create function teman_private.guard_document_delete() returns trigger language plpgsql set search_path='' as $$
declare s text;
begin
 select status into s from public.teman_businesses where id=old.business_id for update;
 if s not in ('pending_review','changes_requested') then raise exception 'Review locked';end if;
 return old;
end $$;
revoke all on function teman_private.guard_document_delete() from public,anon,authenticated;
create trigger guard_document_delete before delete on public.teman_verification_documents for each row execute function teman_private.guard_document_delete();
do $$ begin
 if exists(select 1 from pg_roles where rolname='service_role') then
 grant select,insert,delete on public.teman_verification_documents to service_role;
 end if;
end $$;
create table teman_private.document_upload_events(business_id uuid not null,created_at timestamptz not null default now());
revoke all on teman_private.document_upload_events from public,anon,authenticated;
create or replace function teman_private.document_quota() returns trigger language plpgsql security definer set search_path='' as $$
declare s text;
begin
 perform pg_advisory_xact_lock(8191420);
 select status into s from public.teman_businesses where id=new.business_id for update;
 if s not in ('pending_review','changes_requested') then raise exception 'Documents locked for review';end if;
 if (select count(*) from public.teman_verification_documents where business_id=new.business_id)>=10
 or (select count(*) from teman_private.document_upload_events where business_id=new.business_id and created_at>now()-interval '1 day')>=20
 or (select coalesce(sum(size),0) from public.teman_verification_documents)+new.size>1073741824 then raise exception 'Document quota exceeded';end if;
 insert into teman_private.document_upload_events(business_id) values(new.business_id);
 new.created_at:=now();return new;
end $$;
revoke all on function teman_private.document_quota() from public,anon,authenticated;
create table public.teman_service_revisions(
 id uuid primary key default gen_random_uuid(),service_id uuid not null references public.teman_services(id),
 actor_id uuid not null references auth.users(id),snapshot jsonb not null,created_at timestamptz not null default now()
);
alter table public.teman_service_revisions enable row level security;
revoke all on public.teman_service_revisions from public,anon,authenticated;
grant select on public.teman_service_revisions to authenticated;
create policy revision_read on public.teman_service_revisions for select to authenticated using(exists(select 1 from public.teman_services s join public.teman_businesses b on b.id=s.business_id where s.id=service_id));
create function teman_private.service_revision() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.teman_service_revisions(service_id,actor_id,snapshot) values(new.id,auth.uid(),to_jsonb(new));return new;
end $$;
revoke all on function teman_private.service_revision() from public,anon,authenticated;
create trigger service_revision after insert or update on public.teman_services for each row execute function teman_private.service_revision();
commit;
