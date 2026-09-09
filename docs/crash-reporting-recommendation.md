# Crash Reporting Recommendation

Real remote crash reporting is not configured. Phase G adds only a production-safe React error boundary; it does not claim telemetry or crash delivery.

Before general release, evaluate an Expo-compatible provider such as Sentry using the provider’s current Expo SDK 54 guidance. Business/privacy owners must first decide:

- data region, retention, access roles and processor terms;
- whether user identifiers, emails, breadcrumbs, network bodies or screenshots are captured;
- redaction rules for tokens, callback URLs, card/lead data, phone numbers and messages;
- consent/notice requirements and environment separation;
- release/version mapping and source-map upload secret handling in EAS—not in mobile source.

Recommended minimum: fatal JS/native crash capture, app version/build number, device/OS class, release environment, aggressive PII scrubbing, no session replay initially, alerts for new high-impact crashes, and a documented deletion/retention process. Validate in a preview build before production.
