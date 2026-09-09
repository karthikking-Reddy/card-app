# Phase F profile and security data gaps

Review only. No SQL from the companion proposal has been executed.

## Truthfully supported now

- Account profile reads use the authenticated user ID and expose only `id`, `role`, `full_name`, `email`, `admin_id` and timestamps.
- Full-name updates target only `profiles.id = auth.user.id`; they never update `role`, `admin_id`, email or digital-card fields.
- Password changes use `supabase.auth.updateUser()` for the current authenticated session. Password values are not stored or logged.
- Real email verification comes from `auth.users.email_confirmed_at` exposed through the authenticated Auth user.
- Google is shown as connected only when Auth provider/identity metadata includes `google`.
- Card and lead usage figures are exact owner-scoped counts with no invented quotas.
- Existing platform administration remains `super_admin`, `admin` and `user` with `profiles.admin_id`. Secure management RPCs and pagination remain authoritative.
- CRM CSV remains a CRM export, not a complete account-data export.

## Backend/security work still required

1. **Recent authentication:** define and enforce a recent-authentication requirement for password/email and other sensitive actions. OAuth-only accounts need an appropriate reauthentication path.
2. **Email/mobile changes:** use verified Supabase Auth flows; never update only `profiles.email` and claim the identity changed.
3. **MFA:** configure supported factors, enrollment/challenge/verification, recovery and assurance-level checks before showing Enabled.
4. **Sessions/devices:** Supabase client session state does not provide an authoritative account-wide device list, approximate locations, trusted devices or individual revocation. Build a privacy-reviewed server registry if required; never expose complete IP addresses.
5. **Account export:** create an asynchronous, owner-authorized export job with retention and expiring download links. Scope every included dataset and privacy rule explicitly.
6. **Account deletion:** create a secure server-side request/process with recent authentication, optional grace period, audit trail and Auth-user deletion. Never use `auth.admin` or a service-role credential in the mobile app.
7. **Preferences:** persist and enforce language, region, accessibility, sharing and privacy choices. Avoid local switches that do not affect actual behavior.
8. **Entitlements and usage:** define plans, feature entitlements, counters and limits before showing a current paid plan, quota or upgrade checkout. No payment system exists in Phase F.
9. **Business workspaces:** keep commercial roles separate from current platform administration. Future Owner/Manager/Salesperson/Designer/Viewer roles need workspace membership, invitations and resource ownership.
10. **Support:** tickets, attachments and diagnostics require owner scoping, consent, storage policies and safe operator access.
11. **Business verification:** email verification and card approval exist independently. Business verification needs its own reviewed evidence and status model.
12. **Legal/privacy:** final Privacy Policy, Terms, consent text, retention behavior and hosted URLs require Phase G product/legal review.

## Manual checks before deploying the proposal

- Confirm `profiles` RLS permits an owner to update only allowed fields; column grants or an RPC should prevent changes to `role` and `admin_id`.
- Confirm management and approval RPCs internally derive authorization from `auth.uid()` and preserve assigned-admin scope.
- Confirm the last super administrator cannot be removed through role-management RPCs.
- Confirm deletion/export workers hold secrets only in server-side infrastructure and return redacted status.
- Confirm security logs minimize PII and apply a defined retention period.
