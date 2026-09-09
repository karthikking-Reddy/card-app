# Production Supabase Security Checklist

No SQL was executed during Phase G. Complete each item against the production project manually.

## Mobile/client verification

- [x] Mobile configuration uses only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [x] No service-role key or `supabase.auth.admin` call is present in live mobile source.
- [x] Card public-link exposure requires approved, public and active state.
- [x] Administration uses role checks plus protected RPCs; hidden navigation is not treated as authorization.
- [x] Approval changes use protected approval RPCs.
- [x] Card, lead, follow-up, notification and WhatsApp services pass signed-in ownership identifiers or use owner-scoped relationships.
- [ ] Confirm every production table has RLS enabled and deny-by-default policies.
- [ ] Confirm RPC `SECURITY DEFINER` functions pin a safe `search_path`, validate `auth.uid()`, and revoke public execution where inappropriate.
- [ ] Confirm Storage bucket policies restrict card owners and prevent path traversal/overwrite across accounts.
- [ ] Confirm public-card queries expose only visitor-safe fields and analytics inserts cannot forge privileged data.

## Manual proposal queue

Review the individual files listed in `pending-backend-migrations.md`. Do not merge proposals blindly: compare them to the live schema, functions, grants, triggers and policies first. Account deletion, complete data export, analytics retention/opt-out and provider integrations remain release decisions requiring backend verification.

## Production evidence to retain

- RLS/policy export, function definitions and grants (without secrets).
- Test evidence for normal user, assigned admin and super-admin access boundaries.
- Public-card negative tests for draft, pending, rejected, private, inactive and invalid slugs.
- Backup/retention/deletion documentation and incident/support ownership.
