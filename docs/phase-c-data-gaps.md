# Phase C leads and CRM data gaps

Review-only documentation. No Supabase SQL was executed.

## Confirmed current architecture

- Public-card enquiries already write to the existing `connections` CRM model.
- `connections` supports owner, card, contact details, requirement, stage, source/source detail, priority, estimated value, next follow-up, notes and contact timestamps as used by the current app/export.
- `lead_stages` provides user-owned dynamic stages with `is_won` and `is_lost`; customized stages are preserved.
- `lead_activities` records real timeline events. It is reused for notes, stage changes and follow-up events.
- `followup_tasks` supports user ownership, lead association, due time, priority, pending/completed state and completion time.
- CSV export reads all leads explicitly scoped to the signed-in owner and uses the SDK 54 legacy FileSystem UTF-8 API.

## Gaps requiring backend review

- Tags are not confirmed as a persisted `connections` field. No local-only tags were added.
- Assigned CRM owner is not confirmed. The existing `profiles.admin_id` administration relationship must not be reused as lead assignment.
- Structured `lost_reason`, authoritative `won_value`/revenue and `converted_at` are not confirmed. Estimated value remains labelled as pipeline only.
- Normalized phone/email columns or an ownership-checked duplicate RPC are needed for reliable duplicate detection across punctuation and international formatting. The mobile check is deliberately advisory and never merges.
- Efficient pipeline-value and won-revenue totals require an aggregate RPC; downloading the full CRM solely for totals would undermine pagination.
- Safe CSV import needs robust parsing, preview/mapping and an ownership-checked transactional bulk RPC. It is deferred instead of performing fragile row-by-row writes.
- Native/push reminder delivery is not represented as configured. Follow-up states are accurate in-app only.

## Existing RLS to verify manually

Confirm ownership policies for `connections`, `lead_activities`, `followup_tasks` and `lead_stages`. The mobile services now add explicit owner filters where the current columns support them, but RLS remains the final authorization boundary. In particular, validate that activity inserts/selects verify ownership through the parent connection.

## Compatibility

Historical source and priority values are not rewritten. Presentation mapping converts known legacy values such as `mobile_app`/`manual` and `normal`/`medium` into consistent user-facing labels.
