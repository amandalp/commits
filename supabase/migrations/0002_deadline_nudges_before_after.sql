-- ============================================================================
--  Migration: Deadline nudges — "how's it going?" 12h before AND 12h after
--  Apply once in the Supabase SQL editor. Safe to re-run (idempotent).
--
--  This change is already folded into schema.sql; this file is the minimal
--  additive delta so you don't have to re-run the whole schema. It only
--  redefines one function — no table, column, or enum changes.
--
--  Before: fired once per commit due within the next 24h.
--  After:  fires ~12h BEFORE the deadline, and again ~12h AFTER it if the
--          commit is still open. Both are the owner-facing 'deadline' type.
--          De-dup keys on whether an existing nudge was written before vs.
--          after the deadline, so no new column/enum is needed.
--
--  Drive it hourly from Vercel Cron (GET /api/cron/deadline-nudges) or pg_cron:
--     select cron.schedule('deadline-nudges', '0 * * * *',
--       $$ select generate_deadline_notifications() $$);
-- ============================================================================

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
