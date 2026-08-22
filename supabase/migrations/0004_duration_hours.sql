-- ============================================================================
--  Short commitments — "I'm going to X for 24 hours". Adds 'hours' to the
--  duration units introduced in 0003.
-- ============================================================================

alter type duration_unit add value if not exists 'hours' before 'days';
