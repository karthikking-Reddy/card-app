# Next architecture phase report

Implementation completed locally. No commit created and no SQL executed. Google provider configuration, database proposal review/application, and device acceptance testing remain manual deployment prerequisites.

1. **Existing auth architecture:** One Supabase client, direct email/password calls in AuthScreen, getSession plus onAuthStateChange in useAuth, and separate profiles role reads. Native persistent storage was absent. Google/Meta buttons were placeholders. No deployed trigger/RLS/approval function definitions were available locally.
2. **Files modified:** app.json; package.json; package-lock.json; lib/supabase.js; src/hooks/useAuth.js; src/navigation/RootNavigator.js; src/screens/AuthScreen.js; src/screens/Profile/ProfileScreen.js; src/screens/Admin/AdminApprovalsScreen.js; src/screens/Admin/AdminCardPreviewScreen.js; src/services/profileService.js; src/services/cardApprovalService.js.
3. **Files added:** lib/nativeCrypto.js; src/services/googleAuthService.js; src/services/adminManagementService.js; src/screens/Admin/ManagementScreens.js (five exported screens and shared management UI); docs/admin-management-supabase-proposal.sql; docs/google-and-management-setup.md; this report; tests/admin-phase.test.cjs. codex-next-phase.txt was already untracked and was not edited.
4. **Dependencies:** expo-web-browser ~15.0.11 and expo-crypto ~15.0.9, installed with Expo's SDK-aware installer. Reused AsyncStorage, Linking, Constants, icons and UI primitives. Expo, React and React Native versions unchanged.
5. **Google login:** Supabase browser OAuth with PKCE, native secure randomness/SHA-256, exact callback target checks, cancellation handling and code exchange. Existing Google placeholder replaced with Continue with Google. Removed the adjacent inactive Meta login placeholder; no Meta integration added. Existing email/password/signup/reset flows remain.
6. **Profile synchronization:** Auth restoration/sign-in triggers an independent profile check outside the auth event callback. Existing rows retain role/admin_id. Missing rows/null roles use ensure_current_profile with no client identity or role arguments. Google metadata can fill a missing display name through that server function. The existing signup trigger is preserved; ON CONFLICT avoids competing inserts. Deployment must verify the existing trigger defaults to user and ignores metadata role/admin_id.
7. **Super Admin dashboard:** Total admins/users and pending/approved/rejected card counts, plus navigation to admins, users and approvals, using existing UI primitives and theme.
8. **Admin management:** Searchable, paginated admins with assigned-user counts and pending workload. Promotion starts from the user directory; admin detail links to role management. Demotion with assigned users is rejected with an actionable message.
9. **User management:** Super admin gets name/email search, role filter, assigned-admin filter and unassigned filter. Admins receive only their assigned users from the proposed server RPC.
10. **Details:** User account data, assigned admin, creation time, total card count and paginated safe card/approval fields. Admin detail adds assigned-user count, pending workload and paginated roster. No auth internals are selected into management results.
11. **Assignment:** Super-admin assign/reassign/unassign actions use RPC only, with a searchable paginated admin picker and confirmation. Promotions clear former user assignment; demotions require prior reassignment/unassignment of every dependent user.
12. **Pagination:** Zero-based pages, default 25, extra sentinel row, project-standard data/page/pageSize/hasMore shape. Deterministic created_at plus ID order; explicit Previous/Next pages replace rather than append rows. Search/filters reset the page. Focus cleanup and request generations invalidate stale loads. As with the existing offset architecture, concurrent database inserts/deletes can move page boundaries; no snapshot consistency is claimed.
13. **Protection:** Management screens verify access on focus, service calls recheck current profile, and proposed SQL independently authorizes every call. Ordinary users have no management access. Existing approval actions now recheck admin role in the service. Preview no longer trusts route-supplied card content and fails closed on authorization/fetch errors. All literal navigation targets resolve; Card/CardEditor and existing CRM/WhatsApp/approval routes remain registered.
14. **SQL proposal:** Summary, directories, rosters, details, card pages, profile recovery, assignment and role mutation functions. Fixed empty search_path, qualified objects, auth.uid checks, explicit EXECUTE revokes/grants, safe pagination/search filters and allowlisted responses. Shared transaction advisory lock serializes role/assignment mutations. All super_admin mutations and caller self-mutations are prohibited, preserving the last super admin. Proposal also removes direct profile insert/update/delete privileges, including listed column grants. No deployed schema was altered. Review assumed column names/types (including text roles), existing grants/policies and trusted function owners before use.
15. **Supabase configuration:** Enable Google in the existing project, copy real callback, add exact app redirect allowlist entry, configure real provider credentials, review current signup trigger/RLS/RPCs, and manually deploy reviewed proposals. Missing management RPCs show a configuration error; no insecure direct-query fallback exists.
16. **Google Cloud:** Use the real Web application OAuth client for Supabase's browser flow. Register the callback copied from Supabase, configure branding/audience/test users and copy real credentials into Supabase only. Detailed steps are in the setup guide.
17. **Expo/EAS:** app.json registers the package-based scheme and browser config plugin. Copy the actual getGoogleRedirectUrl() result from the installed build into Supabase. New APK/AAB required for native modules/scheme; OTA alone is insufficient. Existing EAS ID, package, environments and Supabase variable names are unchanged. Browser OAuth does not require Android Google client IDs or SHA fingerprints. Expo Go and web Google sign-in are explicitly unavailable.
18. **Security findings:** No embedded service-role key, Google secret or JWT literal detected in mobile src/lib. No client role/admin_id writes added. Database defenses are proposed, not verified live. Existing profile policies or other privileged RPCs could bypass protection if misconfigured; deployment review must check them. Existing card approval/public-site server behavior cannot be proven from missing definitions. npm installation reported 26 dependency advisories (17 moderate, 9 high); no forced audit fixes or framework upgrades were performed.
19. **Validation:** Prettier check passed; Expo dependency compatibility passed; Expo Doctor 18/18 passed; all 65 live JavaScript/CJS files parsed; 30 registered routes inspected with all literal navigation targets resolving; seven mocked auth/service tests passed; Android Hermes export passed (1,358 modules); git diff --check passed. PowerShell script policy required npm.cmd/npx.cmd; network checks/installations needed approved network access. SQL was neither executed nor database-tested. Tests exercise local client behavior, not deployed authorization.
20. **Remaining risks:** Requires real Google setup, reviewed SQL deployment, new native build and manual account/device tests. Real Google sign-in, restart persistence, logout on device, role/assignment concurrency and RLS enforcement require the acceptance matrix in the setup guide. Existing approval/CRM/public-card regression checks require the deployed test environment. No claim of production readiness before these steps.

See [manual configuration and acceptance tests](google-and-management-setup.md) and [review-only SQL](admin-management-supabase-proposal.sql).

## Final working tree

`git status --short`:

```text
 M app.json
 M lib/supabase.js
 M package-lock.json
 M package.json
 M src/hooks/useAuth.js
 M src/navigation/RootNavigator.js
 M src/screens/Admin/AdminApprovalsScreen.js
 M src/screens/Admin/AdminCardPreviewScreen.js
 M src/screens/AuthScreen.js
 M src/screens/Profile/ProfileScreen.js
 M src/services/cardApprovalService.js
 M src/services/profileService.js
?? codex-next-phase.txt
?? docs/admin-management-supabase-proposal.sql
?? docs/admin-phase-report.md
?? docs/google-and-management-setup.md
?? lib/nativeCrypto.js
?? src/screens/Admin/ManagementScreens.js
?? src/services/adminManagementService.js
?? src/services/googleAuthService.js
?? tests/
```

`git diff --stat` (tracked files only; newly added files appear above as untracked):

```text
 app.json                                    | 13 ++---
 lib/supabase.js                             | 20 +++++++-
 package-lock.json                           | 24 +++++++++
 package.json                                |  2 +
 src/hooks/useAuth.js                        | 77 +++++++++++++----------------
 src/navigation/RootNavigator.js             | 12 +++++
 src/screens/Admin/AdminApprovalsScreen.js   |  2 +
 src/screens/Admin/AdminCardPreviewScreen.js | 56 ++++++++++++---------
 src/screens/AuthScreen.js                   | 52 +++++++------------
 src/screens/Profile/ProfileScreen.js        | 16 ++++++
 src/services/cardApprovalService.js         |  8 +++
 src/services/profileService.js              | 18 +++++--
 12 files changed, 188 insertions(+), 112 deletions(-)
```
