# Phase D insights and analytics data gaps

Review-only documentation. No Supabase SQL was executed.

## Existing trustworthy data

- `card_view` records approved public-card openings and includes `card_id`, time, `source = public_card`, an anonymous `visitor_token` where available, and slug metadata.
- Public link/contact actions record click events with card, link/block IDs where applicable, visitor token and origin metadata.
- Successful public enquiries currently record `lead_submit` after the `connections` insert succeeds.
- Owner-scoped `connections` and dynamic `lead_stages.is_won/is_lost` support lead, stage, card, won/lost and estimated-pipeline analysis.
- Card links and custom blocks can be attributed when the event includes `link_id` or `block_id`.

## Event-name compatibility

Historical names are preserved and normalized only for presentation:

- Target `enquiry_submit` currently appears as `lead_submit`.
- Target `contact_save` currently appears as `save_contact_click`.
- File interactions may appear as `pdf_click` or `drive_click`, not `file_download`.
- Standard contact/social actions use specific names such as `phone_click`, `whatsapp_click`, `instagram_click` rather than only generic `link_click`.
- `card_view`, `appointment_request` and click suffixes are compatible where present.
- No real `qr_scan` was found.
- `lead_created`, `stage_changed` and `deal_won` are CRM activities, not public `card_events`.

No destructive event migration was performed.

## Metrics intentionally unavailable

- Unique visitors are unavailable for any period containing card views without anonymous visitor tokens; total views are never substituted.
- Won-customer funnel attribution is unavailable because enquiry events do not identify the resulting connection/lead ID.
- Acquisition source is normally absent. `source = public_card` describes the event producer, not whether the visitor arrived by QR, WhatsApp or direct link; these views display as Unknown.
- Service and portfolio interactions are not recorded with their item IDs, so detail views, influenced enquiries, CTR and conversion are unavailable.
- Static QR codes do not emit scan or campaign events.
- Country, approximate region/city, device category, OS, browser, language and new/returning classification are not reliably captured.
- Authoritative won revenue is not stored. `estimated_value` is shown only as estimated pipeline.

## Privacy and consent gaps

Backend/product review is required for public analytics notice, analytics opt-out, enquiry consent evidence, retention configuration, user analytics export/delete, role-scoped reports and a documented no-raw-IP policy. The mobile app does not display non-functional privacy controls. Exact location, inferred identity, cross-site activity and raw IP are not shown.

The public website inserts analytics as an anonymous visitor. Manually verify that its RLS policy accepts events only for existing approved/public/active cards, restricts allowed event fields/types, and is protected by suitable abuse controls. The policy definition is not present in the mobile repository and was not changed.

## Performance

The Phase D mobile query is bounded to the selected period, its equal comparison period and at most the rolling-summary window. It never requests lifetime analytics. Secure aggregate RPCs are still recommended before event volume grows substantially.

## Reports and summaries

Card Performance CSV is supported locally from the already loaded owner-scoped snapshot. PDF, Campaign/QR, Team Performance and authoritative revenue reports remain deferred. Weekly/monthly summaries are in-app calculations only; no delivery channel is claimed.
