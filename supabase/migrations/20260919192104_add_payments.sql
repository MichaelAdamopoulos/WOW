-- Direct payments between group members ("Mike gave Zack $50 cash").
-- Separate from bills: no splitting, just a from -> to transfer that reduces what one owes the other.

create table payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_user uuid not null references profiles(id),
  to_user uuid not null references profiles(id),
  amount numeric not null check (amount > 0),
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  check (from_user <> to_user)
);

alter table payments enable row level security;

create policy "group members can view payments" on payments
  for select using (is_group_member(group_id));

create policy "group members can insert payments" on payments
  for insert with check (is_group_member(group_id));

create policy "group members can delete payments" on payments
  for delete using (is_group_member(group_id));

alter publication supabase_realtime add table payments;
