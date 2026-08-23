-- ============================================================================
--  Check-ins — the lightweight tracker inside a repeating Commit.
--
--  A commit opts in by storing the weekdays it repeats on (ISO 1=Mon..7=Sun);
--  `null` means it isn't tracked at all, and {1,2,3,4,5,6,7} means every day.
--  Each scheduled day can hold at most one check-in, done or skipped. The
--  commit's deadline still decides when it's over — this only records how the
--  days went along the way.
-- ============================================================================

do $$ begin
  create type check_in_status as enum ('done', 'skipped');
exception when duplicate_object then null; end $$;

alter table commits add column if not exists repeat_days smallint[];
do $$ begin
  alter table commits add constraint commits_repeat_days_valid check (
    repeat_days is null or (
      array_length(repeat_days, 1) between 1 and 7
      and repeat_days <@ array[1,2,3,4,5,6,7]::smallint[]
    )
  );
exception when duplicate_object then null; end $$;

create table if not exists check_ins (
  id         uuid primary key default gen_random_uuid(),
  commit_id  uuid not null references commits(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  day        date not null,
  status     check_in_status not null default 'done',
  -- the optional note/photo posted alongside the check-in, if there was one
  update_id  uuid references updates(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (commit_id, day)
);
create index if not exists check_ins_commit_idx on check_ins(commit_id, day);

alter table check_ins enable row level security;

-- Check-ins are as public as the commit they belong to; only its author writes.
drop policy if exists "check_ins read"   on check_ins;
drop policy if exists "check_ins write"  on check_ins;
drop policy if exists "check_ins update" on check_ins;
drop policy if exists "check_ins delete" on check_ins;
create policy "check_ins read"  on check_ins for select using (true);
create policy "check_ins write" on check_ins for insert with check (
  auth.uid() = user_id and
  exists (select 1 from commits c where c.id = commit_id and c.user_id = auth.uid())
);
create policy "check_ins update" on check_ins for update using (auth.uid() = user_id);
create policy "check_ins delete" on check_ins for delete using (auth.uid() = user_id);
