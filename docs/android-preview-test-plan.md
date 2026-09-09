# Android Preview APK Test Plan

Record device model, Android version, app version/code, tester, date, network and result for every case. Google OAuth, deep links and final permissions must be tested in the installed preview APK, not treated as proven by Expo Go.

## Install / update

- Fresh install; verify branded native launch handoff, intro, no permission bundle at startup.
- Install over versionCode 1; verify session/data preservation and navigation.

## Auth and intro

- Signup, email login, wrong password inline error, logout, restored session and password change.
- Google login success, cancel, browser failure, malformed callback, repeated callback and returning to app.
- First launch intro, returning launch behavior and Skip; intro video remains intact.

## Cards

- Create/edit primary and secondary card; choose/deny/permanently deny photo access; background/restart during picker.
- Draft → request → pending → admin approve/reject → rejected reason → resubmit.
- Approved/public/active share, copy, open, QR PNG and VCF.
- Verify draft/pending/rejected/private/inactive cards expose no public URL or QR.
- Delete confirmation and last-card protection.

## CRM and follow-ups

- Create lead, duplicate warning, stages/reorder, notes, international phone, malformed email/URL, deal-value validation.
- Create/update/delete follow-ups with confirmations; overdue states; WhatsApp/tel/mail actions.
- Paginate beyond 25 leads/follow-ups; export CSV and inspect escaping/content.

## Insights

- Every range, card filter, empty data, bounded queries and CSV report.

## Business

- Basic WhatsApp, Quick Messages create/edit/delete confirmation, Inbox pagination, truthful disconnected provider states and in-app Notifications.

## Profile and administration

- Profile name/security, Privacy & Data → Delete Account truthful blocked state, sign-out confirmation.
- Normal user cannot directly open any admin route.
- Assigned admin sees only assigned users and authorized approvals.
- Super admin manages roles/assignments and approvals; test cancel/failure/double-tap paths.

## Network and lifecycle

- Offline at cold start and on each main tab; slow/drop/reconnect; retry preserves typed form data where applicable.
- Background/foreground session refresh, process restart, expired session and revoked account.

## Device / layout

- Small Android, standard Android and tall 20:9; keyboard, hardware back, rotation lock, font scale 1.0/1.3/1.5, TalkBack primary flows.
- Confirm only Internet is present in final release manifest; photo selection uses system flow and no camera/contacts/audio/storage request appears.
- QR scanning is not implemented, so scanner-specific camera/malformed-scan cases are not applicable.
