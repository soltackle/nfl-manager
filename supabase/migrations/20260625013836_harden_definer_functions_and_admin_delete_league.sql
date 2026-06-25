-- Security hardening (applied to remote project rohvwsfivpnnmagzexam on 2026-06-25).
--
-- Findings addressed (Supabase security advisor):
--   * admin_delete_league had NO authorization check and was SECURITY DEFINER callable by
--     anon/authenticated -> ANY visitor could delete ANY league via /rest/v1/rpc/admin_delete_league.
--   * 6 functions had a mutable search_path (function_search_path_mutable).
--   * buy_free_agent / generate_fixtures / handle_new_user were SECURITY DEFINER and executable by
--     anon/authenticated even though only service-role edge functions / triggers ever call them.

-- 1) admin_delete_league: add an internal admin-role gate + pin search_path.
--    (authenticated execute is kept because the admin dashboard calls it with the admin's session;
--     non-admins now get 'unauthorized' instead of silently deleting leagues.)
CREATE OR REPLACE FUNCTION public.admin_delete_league(p_league_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  DELETE FROM public.leagues WHERE id = p_league_id;
  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_league(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_league(uuid) TO authenticated, service_role;

-- 2) Pin search_path on the remaining flagged functions (non-destructive).
ALTER FUNCTION public.buy_free_agent(uuid, uuid)        SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_fixtures(uuid)           SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user()                 SET search_path = public, pg_temp;
ALTER FUNCTION public.create_stadium_for_franchise()    SET search_path = public, pg_temp;
ALTER FUNCTION public.deduct_club_fund(uuid, integer)   SET search_path = public, pg_temp;

-- 3) Lock SECURITY DEFINER functions that only service-role edge functions / triggers invoke.
REVOKE EXECUTE ON FUNCTION public.buy_free_agent(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.buy_free_agent(uuid, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.generate_fixtures(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.generate_fixtures(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
