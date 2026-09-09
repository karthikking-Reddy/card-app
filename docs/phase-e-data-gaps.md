# Phase E business data gaps

Review only. No SQL in the companion proposal has been executed.

## What the mobile app can truthfully use today

- Basic WhatsApp opens a standard `wa.me` URL with optional encoded text. An open/click may be recorded; send, delivery and read outcomes are not inferred.
- Existing owner-scoped `whatsapp_conversations`, conversation-scoped `whatsapp_messages`, and owner-scoped `whatsapp_templates` records remain usable. The app presents the latter as personal **Quick Messages**.
- Existing owner-scoped `notifications` records support 25-row pagination and read state.
- Existing integration status is fetched from the authenticated YNS server endpoint. Only an explicit server response of `connected` is shown as Connected.
- A generic active card link can point to a real external booking service. A dedicated `appointment_url` field and scheduling engine are not assumed to be deployed.

## Provider-dependent gaps

1. Meta OAuth and durable provider tokens need a server-side connection service. Long-lived access tokens, app secrets, phone-number credentials and webhook signing secrets must never be returned to the mobile client or stored in mobile-readable tables.
2. WhatsApp Cloud API onboarding needs verified Business Portfolio, WABA, phone, permission and webhook state plus a safe test-message endpoint.
3. Official Meta templates need provider IDs, language/category metadata, synchronized approval state and provider error history. Personal Quick Messages must remain separate.
4. Meta Lead Ads needs Page/form discovery, field mapping, owner/stage assignment, test-lead validation, idempotent ingestion and retry logs.
5. Automations require a server worker/queue, supported trigger/action registry, consent checks, bounded retries, run history and automatic pausing after repeated failures. The mobile app must not execute automations in the background.
6. Webhooks require a server dispatcher with HTTPS validation, encrypted or vault-held signing secrets, timestamped signatures, rate limits, retry policy and delivery logs.
7. Push, email and WhatsApp notification delivery require configured server providers. Phase E treats only stored in-app notifications as available.
8. Notification preferences need persisted category/channel choices that the server actually enforces. Security-critical policy must be defined separately.
9. Appointment scheduling needs availability rules, time-zone handling, conflict-safe booking, consent, cancellation/reschedule controls and owner-scoped records. Public card rendering must expose a CTA only for a real URL or supported booking configuration.
10. Integration audit logs should record safe identifiers and state transitions without tokens, message contents or unnecessary PII.

## Manual security review

- Confirm RLS enforces `auth.uid() = user_id` for integrations, conversations, Quick Messages and notifications.
- Confirm message policies allow access only when the parent conversation belongs to `auth.uid()`.
- Confirm connection/lead foreign keys cannot be used to cross owner boundaries.
- Confirm authenticated integration APIs derive the user from the validated JWT rather than request parameters.
- Confirm server logs redact provider tokens, phone-number IDs, webhook signatures and OAuth payloads.
- Confirm all provider callbacks validate state, signatures, replay windows and ownership.

The companion SQL is an architecture proposal, not a deployment migration. It intentionally stores credential **references**, never provider secrets.
