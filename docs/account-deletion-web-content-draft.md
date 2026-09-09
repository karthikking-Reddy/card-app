# YNS Card Account Deletion Web Page

> **DRAFT — REQUIRES BUSINESS/LEGAL AND BACKEND REVIEW**

Page title: **Delete your YNS Card account**

This page must be hosted at a stable, public HTTPS URL associated with YNS Card and entered in Google Play Console. It must remain available even when the app is uninstalled.

## Required page content

1. Clearly identify **YNS Card** and the verified developer/business name.
2. Provide a functional deletion-request form or authenticated web flow—not only instructions to email support.
3. Ask only for information needed to locate and securely verify the account.
4. Explain what is deleted: Supabase Auth identity, profile, owned cards, leads, follow-ups, notifications, analytics ownership data, integration configuration and stored images, subject to verified schema/RLS behavior.
5. Explain any data retained for legal, fraud-prevention or backup reasons and the retention period. These details require business/legal confirmation.
6. Confirm receipt, expected processing time and how the requester is notified.
7. Link to the final Privacy Policy and support contact.

Suggested user-facing opening:

> Use this page to request deletion of your YNS Card account and associated data. We will verify that you control the account before processing the request. If you can still sign in, you can also open Profile → Privacy & Data → Delete Account in the YNS Card app.

## Not yet available

The repository contains a review-only Phase F backend proposal, but no confirmed deployed deletion endpoint. Do not publish this page as functional until the secure server-side operation, recent-authentication checks, rate limiting, audit trail and completion notification are deployed and tested.
