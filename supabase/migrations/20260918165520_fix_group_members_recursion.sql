create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from group_members where group_id = gid and user_id = auth.uid()
  );
$$;

grant execute on function public.is_group_member(uuid) to authenticated;

drop policy if exists "members can view group membership" on group_members;
create policy "members can view group membership" on group_members
  for select using (is_group_member(group_id));

drop policy if exists "members or creator can add members" on group_members;
create policy "members or creator can add members" on group_members
  for insert with check (
    is_group_member(group_id)
    or exists (select 1 from groups g where g.id = group_members.group_id and g.created_by = auth.uid())
  );

drop policy if exists "members can view their groups" on groups;
create policy "members can view their groups" on groups
  for select using (is_group_member(id));

drop policy if exists "group members can view bills" on bills;
create policy "group members can view bills" on bills
  for select using (is_group_member(group_id));

drop policy if exists "group members can insert bills" on bills;
create policy "group members can insert bills" on bills
  for insert with check (is_group_member(group_id));

drop policy if exists "group members can delete bills" on bills;
create policy "group members can delete bills" on bills
  for delete using (is_group_member(group_id));