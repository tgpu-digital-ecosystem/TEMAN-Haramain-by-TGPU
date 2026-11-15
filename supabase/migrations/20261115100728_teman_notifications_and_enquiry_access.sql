-- Staging review only; apply after the three existing TEMAN migrations.
begin;
-- Visibility of historical records never grants a suspended provider mutation rights.
create function teman_private.enquiry_conversation_active(eid uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.teman_service_enquiries e
 join public.teman_services s on s.id=e.service_id
 join public.teman_businesses b on b.id=s.business_id
 where e.id=eid and e.status<>'closed' and b.status='approved'
 and (e.pilgrim_id=auth.uid() or b.owner_id=auth.uid()
 or exists(select 1 from public.teman_admins a where a.user_id=auth.uid())))
$$;
revoke all on function teman_private.enquiry_conversation_active(uuid) from public,anon;
grant execute on function teman_private.enquiry_conversation_active(uuid) to authenticated;
drop policy messages_insert on public.teman_enquiry_messages;
create policy messages_insert on public.teman_enquiry_messages for insert to authenticated
 with check(sender_id=auth.uid() and teman_private.enquiry_conversation_active(enquiry_id));

create table public.teman_notifications(
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id),
 event_type text not null check(event_type in ('application_received','application_submitted','application_approved','application_rejected','application_changes_requested','application_suspended','new_enquiry','new_reply','enquiry_status')),
 target_type text not null check(target_type in ('business','enquiry')),
 target_id uuid not null,
 created_at timestamptz not null default now(),
 read_at timestamptz
);
alter table public.teman_notifications enable row level security;
revoke all on public.teman_notifications from public,anon,authenticated;
grant select on public.teman_notifications to authenticated;
grant update(read_at) on public.teman_notifications to authenticated;
create policy notification_self_read on public.teman_notifications for select to authenticated using(recipient_id=(select auth.uid()));
create policy notification_self_update on public.teman_notifications for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));
create function teman_private.notification_read_time() returns trigger language plpgsql set search_path='' as $$
begin
 -- Clients select read/unread; timestamps are server generated.
 new.read_at:=case when new.read_at is null then null else now() end;return new;
end $$;
revoke all on function teman_private.notification_read_time() from public,anon,authenticated;
create trigger notification_read_time before update on public.teman_notifications for each row execute function teman_private.notification_read_time();
create index teman_notifications_recipient_created on public.teman_notifications(recipient_id,created_at desc,id desc);
create index teman_notifications_unread on public.teman_notifications(recipient_id) where read_at is null;

-- Only trigger code writes recipients and events. No arbitrary notification RPC.
-- Metadata only: no enquiry body, contact details, email or document paths.
create function teman_private.notify_business() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='INSERT' or (new.status='pending_review' and old.status is distinct from new.status) then
 insert into public.teman_notifications(recipient_id,event_type,target_type,target_id)
 select user_id,'application_received','business',new.id from public.teman_admins;
 insert into public.teman_notifications(recipient_id,event_type,target_type,target_id)
 values(new.owner_id,'application_submitted','business',new.id);
 elsif tg_op='UPDATE' and new.status is distinct from old.status then
 insert into public.teman_notifications(recipient_id,event_type,target_type,target_id)
 values(new.owner_id,'application_'||new.status,'business',new.id);
 end if;
 return new;
end $$;
revoke all on function teman_private.notify_business() from public,anon,authenticated;
create trigger notify_business after insert or update on public.teman_businesses for each row execute function teman_private.notify_business();

create table public.teman_enquiry_status_history(
 id uuid primary key default gen_random_uuid(),
 enquiry_id uuid not null references public.teman_service_enquiries(id),
 previous_status text, status text not null check(status in ('open','responded','closed')),
 created_at timestamptz not null default now()
);
alter table public.teman_enquiry_status_history enable row level security;
revoke all on public.teman_enquiry_status_history from public,anon,authenticated;
grant select on public.teman_enquiry_status_history to authenticated;
create policy enquiry_history_read on public.teman_enquiry_status_history for select to authenticated
 using(exists(select 1 from public.teman_service_enquiries e where e.id=enquiry_id));
create index teman_enquiry_history_created on public.teman_enquiry_status_history(enquiry_id,created_at,id);
create function teman_private.notify_enquiry() returns trigger language plpgsql security definer set search_path='' as $$
declare provider uuid;
begin
 select b.owner_id into provider from public.teman_services s join public.teman_businesses b on b.id=s.business_id where s.id=new.service_id;
 if tg_op='INSERT' then
 insert into public.teman_notifications(recipient_id,event_type,target_type,target_id)
 values(provider,'new_enquiry','enquiry',new.id);
 end if;
 if tg_op='INSERT' or new.status is distinct from old.status then
 insert into public.teman_enquiry_status_history(enquiry_id,previous_status,status)
 values(new.id,case when tg_op='UPDATE' then old.status else null end,new.status);
 if tg_op='UPDATE' then
 insert into public.teman_notifications(recipient_id,event_type,target_type,target_id)
 select r,'enquiry_status','enquiry',new.id from (select distinct unnest(array[provider,new.pilgrim_id]) r) recipients where r<>auth.uid();
 end if;
 end if;return new;
end $$;
revoke all on function teman_private.notify_enquiry() from public,anon,authenticated;
create trigger notify_enquiry after insert or update on public.teman_service_enquiries for each row execute function teman_private.notify_enquiry();
create function teman_private.notify_message() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.teman_notifications(recipient_id,event_type,target_type,target_id)
 select r,'new_reply','enquiry',e.id from public.teman_service_enquiries e
 join public.teman_services s on s.id=e.service_id join public.teman_businesses b on b.id=s.business_id,
 lateral (select distinct unnest(array[e.pilgrim_id,b.owner_id]) r) recipients
 where e.id=new.enquiry_id and r<>new.sender_id;
 return new;
end $$;
revoke all on function teman_private.notify_message() from public,anon,authenticated;
create trigger notify_message after insert on public.teman_enquiry_messages for each row execute function teman_private.notify_message();
commit;
