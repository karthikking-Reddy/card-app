# Google Sign-In and management setup

No SQL was executed. No commit was created. Management RPCs below are proposed, not deployed.

## A. Supabase Dashboard

1. Open the existing project (the one matching EXPO_PUBLIC_SUPABASE_URL). In Authentication > Sign In / Providers > Google, enable Google.
2. Copy the provider's displayed callback URL directly from this page. Use this exact value in Google Cloud; do not substitute the app deep link.
3. Paste the real Web application client ID and secret from Google Cloud into the Google provider settings. The secret belongs only in Supabase, never Expo environment variables or source.
4. In Authentication > URL Configuration > Redirect URLs, add the exact installed-app return URL obtained in section C. Keep the existing Site URL and public card domain unchanged.
5. Review the existing auth.users signup trigger: it must derive profile id/email from the auth user, assign role=user by default, and never derive role/admin_id from user metadata. Preserve it. Existing Google-linked accounts retain their profile role and assignment.
6. Review docs/admin-management-supabase-proposal.sql against the deployed schema before manually applying. It adds recovery and management RPCs and proposes removing direct client profile writes. No SQL is applied by this app.
7. Review all existing profiles RLS policies, table/column grants, trigger owners, and callable SECURITY DEFINER functions. Users should read only their profile; admins should directly read only their own profile and assigned users where needed. Broader management reads go through the proposed scoped RPCs. Audit existing card policies and approval RPC authorization independently; their definitions are absent from this repository.

## B. Google Cloud Console

1. Select the company's real Google Cloud project. Configure Google Auth Platform branding, audience and data access (openid, email, profile); add actual test users if the app is in testing.
2. In Google Auth Platform > Clients (or APIs & Services > Credentials), create/select an OAuth 2.0 client of type Web application for Supabase's browser OAuth flow.
3. Add the exact Supabase Google callback URL copied in A to Authorized redirect URIs. Copy this client's real client ID and secret into Supabase's Google provider settings.
4. Complete any Google-required publishing/verification for the actual audience. No Google credentials were invented or embedded in this implementation.

## C. Expo OAuth Redirect URLs

The app now explicitly registers scheme `online.ynscrm.card` in app.json. The source of truth is `getGoogleRedirectUrl()` in src/services/googleAuthService.js, which calls Expo Linking.createURL with that scheme and path `auth/callback`.

Copy the actual returned string from a debugger in the installed build (evaluate getGoogleRedirectUrl()); add that exact string to Supabase Redirect URLs. This avoids guessing development hostnames or redirect formats. Do not copy an exp:// Expo Go URL. Do not place this app URL in Google's web-client callback field. OAuth uses PKCE with Expo Crypto providing secure randomness and SHA-256 on native, with a code exchanged through the existing Supabase client. Only matching scheme/host/path callbacks are accepted. Cancellation leaves email/password login available. Cold-start callbacks are also handled.

## D. Android-specific configuration

Package remains `online.ynscrm.card`. Install a newly built APK containing the scheme and expo-web-browser and expo-crypto native modules. Test opening the copied return URL into this installed app and then test a complete Google login.

This browser/Supabase flow uses a Google Web application client; it does not require an Android Google client, google-services.json or SHA fingerprints. If a future native Google SDK flow is chosen, obtain real fingerprints from Play Console > App integrity > App signing and the actual EAS signing certificate; never use fabricated values. That native SDK flow is not implemented here.

## E. EAS Build considerations

The existing EAS project ID, package, preview/production profiles and Supabase variable names are preserved. Ensure both existing EAS environments contain the same project's EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. No Google secret is an EAS variable.

Build a fresh preview APK using the existing preview profile, then a production binary after testing. An OTA-only update cannot add these native modules or scheme. Expo Go is intentionally rejected for Google login. Native Android/iOS browser OAuth is implemented; web Google login is explicitly unavailable rather than using an unconfigured web callback. Email/password UI remains available.

## Manual acceptance tests after configuration

- Email signup (including email confirmation), sign-in, reset email and logout still work.
- Google cancel/error, new Google user, and an existing linked Google account work. Existing admin/super_admin profiles retain roles and assignments.
- Kill/restart app: session restores; logout/restart remains signed out; cold-start OAuth callback completes or reports a retryable error.
- Missing-profile recovery creates only the caller's row; concurrent trigger/recovery causes no duplicate. Existing non-null roles/admin_id remain unchanged.
- As anon/user, call every management RPC directly: denied. Direct role/admin_id insert/update must be denied by deployed grants/RLS.
- As admin A, request admin B roster, unrelated user detail/cards, promotion and assignment: denied. Assigned users remain visible.
- As super admin, search/filter/page, promote a user, assign/reassign/unassign, and demote an admin with no assigned users. Demotion with assigned users must fail until reassigned. No super_admin role mutation or self-mutation is allowed.
- Race assignment against demotion: serialized mutations must never assign to a demoted admin.
- Change search/filter while a request is pending and navigate away/back: older results cannot reappear.
- Recheck existing public-card approval restrictions, approvals, CRM, CSV export and preserved route aliases on device.

## Sources

- [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/)
- [Expo SDK 54 WebBrowser](https://docs.expo.dev/versions/v54.0.0/sdk/webbrowser/)
- [Supabase native deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google)
