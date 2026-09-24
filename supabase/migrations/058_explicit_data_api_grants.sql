-- Supabase is changing default Data API privileges on Oct 30, 2026.
-- By default, new tables (and tables created during 'supabase db reset')
-- will no longer automatically get anon/authenticated/service_role grants.
-- This migration explicitly restores the legacy default grants for all
-- existing tables in the public schema to ensure local dev, CI/CD, and
-- new preview environments don't break.
--
-- NOTE: For any future tables created after this migration, you MUST
-- explicitly include these GRANT statements in that specific migration file.

-- Grant access to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant access to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- We also apply this to sequences so that auto-incrementing IDs work
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
