-- ============================================================================
--  Migration: "Put someone in the loop" + @mentions
--  Apply once in the Supabase SQL editor. Safe to re-run (idempotent).
--
--  These changes are already folded into schema.sql; this file is the minimal
--  additive delta so you don't have to re-run the whole schema.
--
--  NOTE: if your SQL editor wraps the whole script in one transaction and
--  errors on the enum additions, run STEP 1 on its own first (adding an enum
--  value can't be used in the same transaction it's created in), then STEP 2.
-- ============================================================================

-- STEP 1 — new notification kinds ------------------------------------------
alter type notification_type add value if not exists 'loop_in';
alter type notification_type add value if not exists 'mention';

-- STEP 2 — table, trigger, RLS, mention fan-out -----------------------------

-- loop_ins: the author CCs a person on a commit ("put someone in the loop").
create table if not exists loop_ins (
  id         uuid primary key default gen_random_uuid(),
  commit_id  uuid not null references commits(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,  -- the tagged person
  created_at timestamptz not null default now(),
  unique (commit_id, user_id)
);
create index if not exists loop_ins_commit_idx on loop_ins(commit_id);
create index if not exists loop_ins_user_idx   on loop_ins(user_id);

-- Looping someone in notifies that person; the actor is the commit's author.
create or replace function on_loop_in() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from commits where id = new.commit_id;
  perform notify(new.user_id, owner, new.commit_id, 'loop_in');
  return new;
end $$;

drop trigger if exists trg_loop_in on loop_ins;
create trigger trg_loop_in after insert on loop_ins
  for each row execute function on_loop_in();

-- Parse @username mentions out of free text and notify each real profile once.
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

-- Re-create the comment + commit-insert triggers so they also fan out @mentions.
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
  perform notify_mentions(
    coalesce(new.text, '') || ' ' || coalesce(new.context, ''),
    new.user_id, new.id
  );
  return new;
end $$;

-- RLS: anyone reads (avatars are public); only the commit's author writes.
alter table loop_ins enable row level security;
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
