begin;
create table public.teman_services (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.teman_businesses(id),
 title text not null check(length(trim(title)) between 3 and 160),
 category text not null check(category in ('umrah_operator','transport','accommodation','accessibility','other')),
 description text not null check(length(trim(description)) between 10 and 4000),
 service_area text not null check(length(trim(service_area)) between 2 and 200),
 availability text not null check(length(trim(availability)) between 2 and 500),
 pricing text not null check(length(trim(pricing)) between 2 and 500),
 terms text not null check(length(trim(terms)) between 10 and 2000),
 status text not null default 'draft' check(status in ('draft','pending_review','published','rejected')),
 created_at timestamptz not null default now()
);
-- This helper exposes only publication eligibility, never private verification evidence.
create function teman_private.business_approved(bid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.teman_businesses where id=bid and status='approved')
$$;
revoke all on function teman_private.business_approved(uuid) from public;
grant execute on function teman_private.business_approved(uuid) to authenticated;
alter table public.teman_services enable row level security;
create policy services_read on public.teman_services for select to authenticated using(
 (status='published' and teman_private.business_approved(business_id)) or
 exists(select 1 from public.teman_businesses b where b.id=business_id));
create policy services_insert on public.teman_services for insert to authenticated with check(
 status in ('draft','pending_review') and exists(select 1 from public.teman_businesses b where b.id=business_id and b.owner_id=auth.uid() and b.status='approved'));
create policy services_update on public.teman_services for update to authenticated using(exists(select 1 from public.teman_businesses b where b.id=business_id)) with check(exists(select 1 from public.teman_businesses b where b.id=business_id));
create function teman_private.guard_service() returns trigger language plpgsql security invoker set search_path='' as $$
declare admin boolean;
begin
 select exists(select 1 from public.teman_admins where user_id=auth.uid()) into admin;
 if tg_op='INSERT' then new.created_at:=now(); end if;
 if tg_op='UPDATE' then
 if new.id<>old.id or new.business_id<>old.business_id or new.created_at<>old.created_at then raise exception 'Immutable service ownership'; end if;
 if admin then
 if new.status=old.status or new.status not in ('published','rejected','draft') then raise exception 'Invalid moderation decision'; end if;
 if row(new.title,new.category,new.description,new.service_area,new.availability,new.pricing,new.terms) is distinct from row(old.title,old.category,old.description,old.service_area,old.availability,old.pricing,old.terms) then raise exception 'Moderators cannot edit provider content'; end if;
 else
 if new.status not in ('draft','pending_review') then raise exception 'Founder moderation required'; end if;
 end if;
 end if;
 if not teman_private.business_approved(new.business_id) then raise exception 'Approved provider required'; end if;
 return new;
end $$;
revoke all on function teman_private.guard_service() from public;
grant execute on function teman_private.guard_service() to authenticated;
create trigger guard_service before insert or update on public.teman_services for each row execute function teman_private.guard_service();
create table public.teman_service_enquiries (
 id uuid primary key default gen_random_uuid(),
 service_id uuid not null references public.teman_services(id),
 pilgrim_id uuid not null default auth.uid() references auth.users(id),
 body text not null check(length(trim(body)) between 10 and 4000),
 is_test boolean not null default false,
 status text not null default 'open' check(status in ('open','responded','closed')),
 created_at timestamptz not null default now(),
 first_response_at timestamptz
);
alter table public.teman_service_enquiries enable row level security;
create policy enquiries_read on public.teman_service_enquiries for select to authenticated using(pilgrim_id=auth.uid() or exists(select 1 from public.teman_services s join public.teman_businesses b on b.id=s.business_id where s.id=service_id));
create policy enquiries_insert on public.teman_service_enquiries for insert to authenticated with check(pilgrim_id=auth.uid() and status='open' and first_response_at is null and exists(select 1 from public.teman_services s where s.id=service_id and s.status='published' and teman_private.business_approved(s.business_id)));
create policy enquiries_update on public.teman_service_enquiries for update to authenticated using(exists(select 1 from public.teman_services s join public.teman_businesses b on b.id=s.business_id where s.id=service_id)) with check(exists(select 1 from public.teman_services s join public.teman_businesses b on b.id=s.business_id where s.id=service_id));
create function teman_private.guard_enquiry() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then
 if not teman_private.email_confirmed() then raise exception 'Verified email required'; end if;
 -- Account-bound rolling cap: concurrent submissions serialize for this user.
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if (select count(*) from public.teman_service_enquiries where pilgrim_id=auth.uid() and created_at>now()-interval '1 hour')>=10 then raise exception 'Enquiry limit reached; try later'; end if;
 new.created_at:=now();
 else
 if row(new.id,new.service_id,new.pilgrim_id,new.body,new.is_test,new.created_at,new.first_response_at) is distinct from row(old.id,old.service_id,old.pilgrim_id,old.body,old.is_test,old.created_at,old.first_response_at) then raise exception 'Only enquiry status can change'; end if;
 end if;
 return new;
end $$;
revoke all on function teman_private.guard_enquiry() from public;
grant execute on function teman_private.guard_enquiry() to authenticated;
create trigger guard_enquiry before insert or update on public.teman_service_enquiries for each row execute function teman_private.guard_enquiry();
create table public.teman_enquiry_messages (
 id uuid primary key default gen_random_uuid(),
 enquiry_id uuid not null references public.teman_service_enquiries(id),
 sender_id uuid not null default auth.uid() references auth.users(id),
 body text not null check(length(trim(body)) between 1 and 4000),
 created_at timestamptz not null default now()
);
alter table public.teman_enquiry_messages enable row level security;
create policy messages_read on public.teman_enquiry_messages for select to authenticated using(exists(select 1 from public.teman_service_enquiries e where e.id=enquiry_id));
create policy messages_insert on public.teman_enquiry_messages for insert to authenticated with check(sender_id=auth.uid() and exists(select 1 from public.teman_service_enquiries e where e.id=enquiry_id and e.status<>'closed'));
revoke all on public.teman_services,public.teman_service_enquiries,public.teman_enquiry_messages from anon,authenticated;
grant select,insert,update on public.teman_services,public.teman_service_enquiries to authenticated;
grant select,insert on public.teman_enquiry_messages to authenticated;
create function teman_private.guard_message() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not teman_private.email_confirmed() then raise exception 'Verified email required'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if (select count(*) from public.teman_enquiry_messages where sender_id=auth.uid() and created_at>now()-interval '1 hour')>=60 then raise exception 'Reply limit reached; try later'; end if;
 new.created_at:=now(); return new;
end $$;
revoke all on function teman_private.guard_message() from public;
grant execute on function teman_private.guard_message() to authenticated;
create trigger guard_message before insert on public.teman_enquiry_messages for each row execute function teman_private.guard_message();
create index teman_messages_sender on public.teman_enquiry_messages(sender_id,created_at);
create index teman_services_business on public.teman_services(business_id,status);
create index teman_enquiries_service on public.teman_service_enquiries(service_id);
create index teman_enquiries_pilgrim on public.teman_service_enquiries(pilgrim_id,created_at);
create index teman_messages_enquiry on public.teman_enquiry_messages(enquiry_id,created_at);
create table public.teman_audit_events (
 id uuid primary key default gen_random_uuid(), entity_table text not null, entity_id uuid not null,
 actor_id uuid not null references auth.users(id), action text not null, previous_status text, new_status text,
 created_at timestamptz not null default now()
);
alter table public.teman_audit_events enable row level security;
revoke all on public.teman_audit_events from anon,authenticated;
grant select on public.teman_audit_events to authenticated;
create policy audit_owner_read on public.teman_audit_events for select to authenticated using(exists(select 1 from public.teman_admins where user_id=auth.uid()));
create function teman_private.record_workflow_event() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.teman_audit_events(entity_table,entity_id,actor_id,action,previous_status,new_status)
 values(tg_table_name,new.id,auth.uid(),tg_op,case when tg_op='UPDATE' then old.status else null end,new.status);
 return new;
end $$;
revoke all on function teman_private.record_workflow_event() from public,anon,authenticated;
create trigger audit_service after insert or update on public.teman_services for each row execute function teman_private.record_workflow_event();
create trigger audit_enquiry after insert or update on public.teman_service_enquiries for each row execute function teman_private.record_workflow_event();
create index teman_audit_created on public.teman_audit_events(created_at);
commit;
