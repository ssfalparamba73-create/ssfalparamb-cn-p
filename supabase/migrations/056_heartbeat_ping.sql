-- Heartbeat Ping Function
--
-- A minimal, safe function for automated database activity checks.
-- Returns the current timestamp via SELECT now().
--
-- Security model:
--   SECURITY INVOKER — runs with caller's permissions, not elevated
--   No table access — cannot read, write, or modify any data
--   EXECUTE granted only to anon — minimum privilege
--
-- Purpose:
--   Provides a lightweight database query endpoint callable via
--   PostgREST RPC (POST /rest/v1/rpc/heartbeat_ping) to generate
--   legitimate database activity.

CREATE OR REPLACE FUNCTION public.heartbeat_ping()
RETURNS timestamptz
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$ SELECT now(); $$;

-- Follow project convention: revoke from everyone, then grant selectively
REVOKE EXECUTE ON FUNCTION public.heartbeat_ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.heartbeat_ping() TO anon;
