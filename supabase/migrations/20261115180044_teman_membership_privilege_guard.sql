-- Removes unused privileges only; no data mutation or role assignment.
-- Existing production membership table may be absent in an isolated test fixture.
do $$ begin
 if to_regclass('public.teman_memberships') is not null then
  revoke truncate, references, trigger on public.teman_memberships from public, anon, authenticated;
 end if;
end $$;
