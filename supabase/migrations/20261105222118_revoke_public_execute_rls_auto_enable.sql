-- rls_auto_enable() backs the ensure_rls event trigger (auto-enables RLS on new public tables).
-- Event triggers don't need EXECUTE grants, so remove API access to it.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
