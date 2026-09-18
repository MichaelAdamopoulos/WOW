-- Run this whole file once, via supabase db push --linked

-- ============ TABLES ============

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email text not null,
  created_at timestamptz default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table group_members (
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table bills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  description text not null,
  amount numeric not null,
  paid_by uuid references profiles(id),
  split_method text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table bill_splits (
  bill_id uuid references bills(id) on delete cascade,
  user_id uuid references profiles(id),
  amount numeric not null,
  primary key (bill_id, user_id)
);

-- ============ ROW LEVEL SECURITY ============

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table bills enable row level security;
alter table bill_splits enable row level security;

create policy "profiles viewable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');
create policy "users insert their own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "users update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "members can view their groups" on groups
  for select using (
    exists (select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid())
  );
create policy "authenticated users can create groups" on groups
  for insert with check (auth.uid() = created_by);

create policy "members can view group membership" on group_members
  for select using (
    exists (select 1 from group_members gm2 where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid())
  );
create policy "members or creator can add members" on group_members
  for insert with check (
    exists (select 1 from group_members gm2 where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid())
    or exists (select 1 from groups g where g.id = group_members.group_id and g.created_by = auth.uid())
  );
create policy "members can leave a group" on group_members
  for delete using (user_id = auth.uid());

create policy "group members can view bills" on bills
  for select using (
    exists (select 1 from group_members gm where gm.group_id = bills.group_id and gm.user_id = auth.uid())
  );
create policy "group members can insert bills" on bills
  for insert with check (
    exists (select 1 from group_members gm where gm.group_id = bills.group_id and gm.user_id = auth.uid())
  );
create policy "group members can delete bills" on bills
  for delete using (
    exists (select 1 from group_members gm where gm.group_id = bills.group_id and gm.user_id = auth.uid())
  );

create policy "group members can view splits" on bill_splits
  for select using (
    exists (
      select 1 from bills b join group_members gm on gm.group_id = b.group_id
      where b.id = bill_splits.bill_id and gm.user_id = auth.uid()
    )
  );
create policy "group members can insert splits" on bill_splits
  for insert with check (
    exists (
      select 1 from bills b join group_members gm on gm.group_id = b.group_id
      where b.id = bill_splits.bill_id and gm.user_id = auth.uid()
    )
  );

create or replace function public.get_email_by_username(uname text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from profiles where username = uname limit 1;
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

alter publication supabase_realtime add table bills, bill_splits, group_members;