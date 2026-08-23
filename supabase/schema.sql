-- ============================================================================
--  Commits — database schema
--  Run this in the Supabase SQL editor (or `supabase db push`) once per project.
--  Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type commit_status as enum ('active', 'shipped', 'overdue', 'closed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type update_kind as enum ('update', 'ship', 'not_yet');
exception when duplicate_object then null; end $$;

do $$ begin
  create type duration_unit as enum ('hours', 'days', 'weeks', 'months', 'years');
exception when duplicate_object then null; end $$;

do $$ begin
  create type check_in_status as enum ('done', 'skipped');
exception when duplicate_object then null; end $$;
-- backfill for the enum created before short commitments existed
alter type duration_unit add value if not exists 'hours' before 'days';

do $$ begin
  create type notification_type as enum (
    'cheer', 'watch', 'join', 'comment', 'comment_reply',
    'follow', 'deadline', 'shipped', 'update', 'not_yet', 'loop_in', 'mention'
  );
exception when duplicate_object then null; end $$;
-- backfill values for enums created before these existed
alter type notification_type add value if not exists 'loop_in';
alter type notification_type add value if not exists 'mention';

-- ---------------------------------------------------------------------------
--  profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  username    text not null unique,
  avatar_url  text,
  bio         text,
  location    text,
  website     text,
  instagram   text,
  tiktok      text,
  x           text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  commits
-- ---------------------------------------------------------------------------
create table if not exists commits (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  text              text not null check (char_length(text) between 1 and 280),
  context           text check (char_length(context) <= 600),
  media_url         text,
  media_urls        text[] not null default '{}',
  deadline          timestamptz not null,
  -- How the commitment was framed: null = "by <deadline>", set = "for 30 days"
  -- (the deadline is derived from the duration at create time).
  duration_amount   int check (duration_amount is null or duration_amount between 1 and 365),
  duration_unit     duration_unit,
  -- Weekdays this commit repeats on (ISO 1=Mon..7=Sun). Null = not tracked;
  -- {1..7} = every day. Opting in turns on the check-in strip.
  repeat_days       smallint[],
  status            commit_status not null default 'active',
  original_deadline timestamptz not null,
  parent_commit_id  uuid references commits(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  shipped_at        timestamptz,
  closed_at         timestamptz
);
-- backfill for tables created before media_url existed
alter table commits add column if not exists media_url text;
-- commits can now carry several attachments; keep media_url as the first item.
alter table commits add column if not exists media_urls text[] not null default '{}';
update commits
  set media_urls = array[media_url]
  where media_url is not null and (media_urls is null or media_urls = '{}');
-- commits can be framed as a duration ("for 30 days") instead of a date.
alter table commits add column if not exists duration_amount int
  check (duration_amount is null or duration_amount between 1 and 365);
alter table commits add column if not exists duration_unit duration_unit;
do $$ begin
  alter table commits add constraint commits_duration_pair
    check ((duration_amount is null) = (duration_unit is null));
exception when duplicate_object then null; end $$;
-- repeating commits track check-ins on the weekdays they're scheduled for.
alter table commits add column if not exists repeat_days smallint[];
do $$ begin
  alter table commits add constraint commits_repeat_days_valid check (
    repeat_days is null or (
      array_length(repeat_days, 1) between 1 and 7
      and repeat_days <@ array[1,2,3,4,5,6,7]::smallint[]
    )
  );
exception when duplicate_object then null; end $$;
create index if not exists commits_user_idx    on commits(user_id, created_at desc);
create index if not exists commits_created_idx  on commits(created_at desc);
create index if not exists commits_parent_idx   on commits(parent_commit_id);
create index if not exists commits_deadline_idx on commits(deadline);

-- ---------------------------------------------------------------------------
--  follows
-- ---------------------------------------------------------------------------
create table if not exists follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on follows(following_id);

-- ---------------------------------------------------------------------------
--  cheers / watches
-- ---------------------------------------------------------------------------
create table if not exists cheers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  commit_id  uuid not null references commits(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, commit_id)
);
create index if not exists cheers_commit_idx on cheers(commit_id);

create table if not exists watches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  commit_id  uuid not null references commits(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, commit_id)
);
create index if not exists watches_commit_idx on watches(commit_id);

-- ---------------------------------------------------------------------------
--  loop_ins  ("put someone in the loop" — the author CCs a person on a commit)
--  Unlike watches, the *author* creates these rows to tag someone; being
--  looped in is purely informational (it doesn't make you a watcher).
-- ---------------------------------------------------------------------------
create table if not exists loop_ins (
  id         uuid primary key default gen_random_uuid(),
  commit_id  uuid not null references commits(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,  -- the tagged person
  created_at timestamptz not null default now(),
  unique (commit_id, user_id)
);
create index if not exists loop_ins_commit_idx on loop_ins(commit_id);
create index if not exists loop_ins_user_idx   on loop_ins(user_id);

-- ---------------------------------------------------------------------------
--  comments (+ likes)
-- ---------------------------------------------------------------------------
create table if not exists comments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  commit_id         uuid not null references commits(id) on delete cascade,
  parent_comment_id uuid references comments(id) on delete cascade,
  text              text not null check (char_length(text) between 1 and 1000),
  created_at        timestamptz not null default now()
);
create index if not exists comments_commit_idx on comments(commit_id, created_at);

create table if not exists comment_likes (
  user_id    uuid not null references profiles(id) on delete cascade,
  comment_id uuid not null references comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

-- ---------------------------------------------------------------------------
--  updates  (progress posts, ship posts, not-yet notes)
-- ---------------------------------------------------------------------------
create table if not exists updates (
  id         uuid primary key default gen_random_uuid(),
  commit_id  uuid not null references commits(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  text       text check (char_length(text) <= 1000),
  media_url  text,
  link_url   text,
  kind       update_kind not null default 'update',
  created_at timestamptz not null default now()
);
create index if not exists updates_commit_idx on updates(commit_id, created_at);

-- ---------------------------------------------------------------------------
--  check_ins  (the tracker inside a repeating commit — one row per day)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
--  notifications
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,  -- recipient
  actor_id   uuid references profiles(id) on delete cascade,           -- who did it
  commit_id  uuid references commits(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  type       notification_type not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(user_id, created_at desc);

-- ============================================================================
--  Notification fan-out — SECURITY DEFINER triggers keep this consistent
--  without needing permissive insert policies or a service role at runtime.
-- ============================================================================
create or replace function notify(
  p_user uuid, p_actor uuid, p_commit uuid, p_type notification_type,
  p_comment uuid default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user is null or p_user = p_actor then return; end if;
  insert into notifications(user_id, actor_id, commit_id, comment_id, type)
  values (p_user, p_actor, p_commit, p_comment, p_type);
end $$;

-- Parse @username mentions out of free text and notify each real profile once.
-- Used by commit context and comment bodies. The actor is the writer.
create or replace function notify_mentions(
  p_text text, p_actor uuid, p_commit uuid
) returns void language plpgsql security definer set search_path = public as $$
declare handle text; uid uuid;
begin
  if p_text is null then return; end if;
  for handle in
    select distinct lower((regexp_matches(p_text, '@([A-Za-z0-9_]{1,30})', 'g'))[1])
  loop
    select id into uid from profiles where lower(username) = handle;
    if uid is not null then
      perform notify(uid, p_actor, p_commit, 'mention');
    end if;
  end loop;
end $$;

create or replace function on_cheer() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from commits where id = new.commit_id;
  perform notify(owner, new.user_id, new.commit_id, 'cheer');
  return new;
end $$;

create or replace function on_watch() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from commits where id = new.commit_id;
  perform notify(owner, new.user_id, new.commit_id, 'watch');
  return new;
end $$;

-- Looping someone in notifies that person; the actor is the commit's author.
create or replace function on_loop_in() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from commits where id = new.commit_id;
  perform notify(new.user_id, owner, new.commit_id, 'loop_in');
  return new;
end $$;

create or replace function on_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform notify(new.following_id, new.follower_id, null, 'follow');
  return new;
end $$;

create or replace function on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid; parent_author uuid;
begin
  select user_id into owner from commits where id = new.commit_id;
  perform notify(owner, new.user_id, new.commit_id, 'comment', new.id);
  if new.parent_comment_id is not null then
    select user_id into parent_author from comments where id = new.parent_comment_id;
    perform notify(parent_author, new.user_id, new.commit_id, 'comment_reply', new.id);
  end if;
  perform notify_mentions(new.text, new.user_id, new.commit_id);
  return new;
end $$;

create or replace function on_commit_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare parent_owner uuid;
begin
  if new.parent_commit_id is not null then
    select user_id into parent_owner from commits where id = new.parent_commit_id;
    perform notify(parent_owner, new.user_id, new.parent_commit_id, 'join');
  end if;
  -- @mentions written into the commitment or its context note.
  perform notify_mentions(
    coalesce(new.text, '') || ' ' || coalesce(new.context, ''),
    new.user_id, new.id
  );
  return new;
end $$;

-- Updates notify watchers (+ joiners on ship). Owner is excluded by notify().
create or replace function on_update_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid; n_type notification_type; w record;
begin
  select user_id into owner from commits where id = new.commit_id;
  n_type := case new.kind
    when 'ship' then 'shipped'::notification_type
    when 'not_yet' then 'not_yet'::notification_type
    else 'update'::notification_type end;

  for w in select user_id from watches where commit_id = new.commit_id loop
    perform notify(w.user_id, owner, new.commit_id, n_type);
  end loop;

  -- On ship, also celebrate with people who joined this commit.
  if new.kind = 'ship' then
    for w in select user_id from commits
             where parent_commit_id = new.commit_id and user_id <> owner loop
      perform notify(w.user_id, owner, new.commit_id, 'shipped');
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists trg_cheer on cheers;
create trigger trg_cheer after insert on cheers
  for each row execute function on_cheer();

drop trigger if exists trg_watch on watches;
create trigger trg_watch after insert on watches
  for each row execute function on_watch();

drop trigger if exists trg_loop_in on loop_ins;
create trigger trg_loop_in after insert on loop_ins
  for each row execute function on_loop_in();

drop trigger if exists trg_follow on follows;
create trigger trg_follow after insert on follows
  for each row execute function on_follow();

drop trigger if exists trg_comment on comments;
create trigger trg_comment after insert on comments
  for each row execute function on_comment();

drop trigger if exists trg_commit_insert on commits;
create trigger trg_commit_insert after insert on commits
  for each row execute function on_commit_insert();

drop trigger if exists trg_update_insert on updates;
create trigger trg_update_insert after insert on updates
  for each row execute function on_update_insert();

-- keep commits.updated_at fresh
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_touch_commit on commits;
create trigger trg_touch_commit before update on commits
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
--  New-user bootstrap: create a profile row from auth signup metadata.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New Committer'),
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
--  Deadline nudges — call from pg_cron / a scheduled route (hourly).
--  Prompts the creator "how's it going?" twice per commit:
--    · ~12h BEFORE the deadline (the run-up)
--    · ~12h AFTER  the deadline, if still unresolved (the gentle "did you do it?")
--  Both are the owner-facing 'deadline' type (actor_id null). De-dup keys on
--  whether an existing nudge was written before vs. after the deadline, so no
--  extra column or enum value is needed.
-- ---------------------------------------------------------------------------
create or replace function generate_deadline_notifications() returns int
language plpgsql security definer set search_path = public as $$
declare c record; cnt int := 0;
begin
  -- ~12h before: the deadline is coming up.
  for c in
    select id, user_id from commits
    where status in ('active','overdue')
      and deadline between now() and now() + interval '12 hours'
      and not exists (
        select 1 from notifications n
        where n.commit_id = commits.id and n.type = 'deadline'
          and n.created_at < commits.deadline)      -- no pre-deadline nudge yet
  loop
    insert into notifications(user_id, actor_id, commit_id, type)
    values (c.user_id, null, c.id, 'deadline');
    cnt := cnt + 1;
  end loop;

  -- ~12h after: the deadline passed and it's still open.
  for c in
    select id, user_id from commits
    where status in ('active','overdue')
      and now() >= deadline + interval '12 hours'
      and deadline > now() - interval '30 days'     -- don't wake ancient commits
      and not exists (
        select 1 from notifications n
        where n.commit_id = commits.id and n.type = 'deadline'
          and n.created_at >= commits.deadline)      -- no post-deadline nudge yet
  loop
    insert into notifications(user_id, actor_id, commit_id, type)
    values (c.user_id, null, c.id, 'deadline');
    cnt := cnt + 1;
  end loop;

  return cnt;
end $$;

-- ============================================================================
--  Row Level Security
-- ============================================================================
alter table profiles       enable row level security;
alter table commits        enable row level security;
alter table follows        enable row level security;
alter table cheers         enable row level security;
alter table watches        enable row level security;
alter table loop_ins       enable row level security;
alter table comments       enable row level security;
alter table comment_likes  enable row level security;
alter table updates        enable row level security;
alter table check_ins      enable row level security;
alter table notifications  enable row level security;

-- profiles: world-readable; you manage your own row
drop policy if exists "profiles read"   on profiles;
drop policy if exists "profiles insert" on profiles;
drop policy if exists "profiles update" on profiles;
create policy "profiles read"   on profiles for select using (true);
create policy "profiles insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles update" on profiles for update using (auth.uid() = id);

-- commits: all public; author writes their own
drop policy if exists "commits read"   on commits;
drop policy if exists "commits insert" on commits;
drop policy if exists "commits update" on commits;
drop policy if exists "commits delete" on commits;
create policy "commits read"   on commits for select using (true);
create policy "commits insert" on commits for insert with check (auth.uid() = user_id);
create policy "commits update" on commits for update using (auth.uid() = user_id);
create policy "commits delete" on commits for delete using (auth.uid() = user_id);

-- follows
drop policy if exists "follows read"   on follows;
drop policy if exists "follows write"  on follows;
drop policy if exists "follows delete" on follows;
create policy "follows read"   on follows for select using (true);
create policy "follows write"  on follows for insert with check (auth.uid() = follower_id);
create policy "follows delete" on follows for delete using (auth.uid() = follower_id);

-- cheers
drop policy if exists "cheers read"   on cheers;
drop policy if exists "cheers write"  on cheers;
drop policy if exists "cheers delete" on cheers;
create policy "cheers read"   on cheers for select using (true);
create policy "cheers write"  on cheers for insert with check (auth.uid() = user_id);
create policy "cheers delete" on cheers for delete using (auth.uid() = user_id);

-- watches
drop policy if exists "watches read"   on watches;
drop policy if exists "watches write"  on watches;
drop policy if exists "watches delete" on watches;
create policy "watches read"   on watches for select using (true);
create policy "watches write"  on watches for insert with check (auth.uid() = user_id);
create policy "watches delete" on watches for delete using (auth.uid() = user_id);

-- loop_ins: anyone can read (avatars are public); only the commit's author
-- can loop people in or remove them.
drop policy if exists "loop_ins read"   on loop_ins;
drop policy if exists "loop_ins write"  on loop_ins;
drop policy if exists "loop_ins delete" on loop_ins;
create policy "loop_ins read"  on loop_ins for select using (true);
create policy "loop_ins write" on loop_ins for insert with check (
  exists (select 1 from commits c where c.id = commit_id and c.user_id = auth.uid())
);
create policy "loop_ins delete" on loop_ins for delete using (
  exists (select 1 from commits c where c.id = commit_id and c.user_id = auth.uid())
);

-- comments
drop policy if exists "comments read"   on comments;
drop policy if exists "comments write"  on comments;
drop policy if exists "comments delete" on comments;
create policy "comments read"   on comments for select using (true);
create policy "comments write"  on comments for insert with check (auth.uid() = user_id);
create policy "comments delete" on comments for delete using (auth.uid() = user_id);

-- comment_likes
drop policy if exists "clikes read"   on comment_likes;
drop policy if exists "clikes write"  on comment_likes;
drop policy if exists "clikes delete" on comment_likes;
create policy "clikes read"   on comment_likes for select using (true);
create policy "clikes write"  on comment_likes for insert with check (auth.uid() = user_id);
create policy "clikes delete" on comment_likes for delete using (auth.uid() = user_id);

-- updates: readable by all; only the commit's author can post
drop policy if exists "updates read"   on updates;
drop policy if exists "updates write"  on updates;
drop policy if exists "updates delete" on updates;
create policy "updates read"  on updates for select using (true);
create policy "updates write" on updates for insert with check (
  auth.uid() = user_id and
  exists (select 1 from commits c where c.id = commit_id and c.user_id = auth.uid())
);
create policy "updates delete" on updates for delete using (auth.uid() = user_id);

-- check_ins: as public as the commit they belong to; only its author writes
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

-- notifications: only the recipient can read / mark read
drop policy if exists "notifs read"   on notifications;
drop policy if exists "notifs update" on notifications;
create policy "notifs read"   on notifications for select using (auth.uid() = user_id);
create policy "notifs update" on notifications for update using (auth.uid() = user_id);

-- ============================================================================
--  Storage bucket for media (avatars, update photos, ship proof)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media read"   on storage.objects;
drop policy if exists "media write"  on storage.objects;
drop policy if exists "media delete" on storage.objects;
create policy "media read" on storage.objects
  for select using (bucket_id = 'media');
create policy "media write" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');
create policy "media delete" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and owner = auth.uid());
