# Phase B digital identity data gaps

This document is review-only. No Supabase SQL has been executed.

## Supported by the current schema and app

- Multiple cards, primary-card selection, personal/business card type, profile photo, slug, public/active controls, approval status, themes, contact fields, location, social links, services, portfolio and ordered custom blocks.
- Existing custom blocks cover image/gallery entries, PDF/Drive documents, video, maps and generic external links.
- The public website already requires `is_public = true`, `is_active = true` and `approval_status = 'approved'` before rendering or recording `card_view`.

## Schema-backed gaps

- Company logo: `digital_cards` has no dedicated company-logo field or owned storage convention.
- Business hours: no structured weekly schedule exists. A free-text block would not support reliable open/closed display.
- Testimonials: no structured, ordered testimonial records exist, and the current public renderer has no testimonial presentation.
- Appointment booking: a generic link block works today, but there is no dedicated card-level booking URL or appointment workflow.

The accompanying SQL proposal adds only nullable fields and a separate testimonial table. It does not change existing slugs, approvals, roles or data. The app intentionally does not reference these proposed fields until the migration and public renderer are reviewed and deployed together.

## Storage review required

If company logos are adopted, create or reuse a dedicated bucket and policies that restrict writes to a path owned by `auth.uid()` and the parent card. Do not make an unrestricted upload bucket. Public reads should be enabled only if the approved public-card rendering model requires them.

## Existing RLS to verify manually

The mobile services scope card reads and card updates by `user_id`. Child resources such as links, services, portfolio and blocks use their parent `card_id`/record ID and therefore depend on existing RLS correctly checking ownership through `digital_cards.user_id = auth.uid()`. Confirm those policies in the Supabase dashboard before production release.

## Deferred UI

Company-logo upload, structured hours, native testimonials and first-party appointment scheduling are not presented as working features. Implement them only after the proposed schema/storage policies and matching approved-card web rendering are reviewed.
