revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- get_supporter_snapshot(text) intentionally remains executable by anon/authenticated.
-- It exposes only the limited supporter snapshot and requires a high-entropy bearer token.
