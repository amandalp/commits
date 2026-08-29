-- ============================================================================
--  Commit durations: "I'm going to X for 30 days" as an alternative to
--  "I'm going to X by <date>". The deadline is still the source of truth for
--  countdowns and nudges (it's derived from the duration at create time);
--  these columns only record how the commitment was framed so the card can
--  read "for 30 days" instead of a date.
-- ============================================================================

do $$ begin
  create type duration_unit as enum ('days', 'weeks', 'months', 'years');
exception when duplicate_object then null; end $$;

alter table commits add column if not exists duration_amount int
  check (duration_amount is null or duration_amount between 1 and 365);
alter table commits add column if not exists duration_unit duration_unit;

-- Both columns are set together or not at all.
do $$ begin
  alter table commits add constraint commits_duration_pair
    check ((duration_amount is null) = (duration_unit is null));
exception when duplicate_object then null; end $$;
