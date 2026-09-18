-- INSERT ... RETURNING (supabase-js .insert().select()) requires the new row to pass
-- the SELECT policy. At insert time the creator isn't in group_members yet, so
-- is_group_member(id) is false and the insert was rejected with a 403.
-- Letting creators see their own groups also makes the creator clause in the
-- group_members INSERT policy work (its subquery on groups is subject to RLS).
drop policy if exists "members can view their groups" on groups;
create policy "members can view their groups" on groups
  for select using (created_by = auth.uid() or is_group_member(id));
