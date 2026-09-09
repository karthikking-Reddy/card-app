# Google Play Release Checklist

Status meanings: **PASS** repository evidence verified; **BLOCKED** must be resolved; **MANUAL** external/device verification; **NOT APPLICABLE** not part of current product.

| Area                                     | Status  | Evidence / next action                                                                                  |
| ---------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| App name/package/scheme/EAS ID           | PASS    | YNS Card / `online.ynscrm.card`; existing EAS project preserved                                         |
| Version                                  | PASS    | App config 0.1.1, Android versionCode 2                                                                 |
| Target API                               | PASS    | Expo SDK 54 targets Android API 36                                                                      |
| Launcher/adaptive icon                   | BLOCKED | Current files are Expo placeholder artwork; supply approved YNS production icon/safe-area assets        |
| Native splash                            | BLOCKED | Current splash is placeholder and conflicts with branded intro; supply approved YNS splash asset/colors |
| Permission minimization                  | MANUAL  | Config blocks unused sensitive permissions; confirm merged preview/release manifest                     |
| Privacy Policy                           | BLOCKED | Draft exists; legal review, support/controller details and hosted public URL required                   |
| Terms                                    | BLOCKED | Draft exists; legal review/details and hosted URL required                                              |
| Account deletion                         | BLOCKED | Secure backend and functional external request URL are not deployed/confirmed                           |
| Data Safety                              | MANUAL  | Repository inventory drafted; business/provider answers and Play submission required                    |
| Email auth/session restore/logout        | MANUAL  | Code preserved; installed-build regression required                                                     |
| Google OAuth/deep link                   | MANUAL  | Preview APK, Supabase allow-list and production browser flow required                                   |
| Public-card security                     | PASS    | Mobile requires approved/public/active; web query independently verified                                |
| Admin/RLS security                       | MANUAL  | Client gates/RPC usage audited; production grants/RLS and adversarial tests required                    |
| Embedded secrets                         | PASS    | No secret-class credential found in tracked mobile source audit; rotate if repository history differs   |
| Crash reporting                          | BLOCKED | No production crash provider; decision/configuration/privacy review required                            |
| Preview APK                              | MANUAL  | EAS profile correctly requests internal APK; build only after approval                                  |
| Production AAB                           | MANUAL  | EAS profile correctly requests app bundle; build after preview sign-off                                 |
| Device/accessibility/responsive tests    | MANUAL  | Execute `android-preview-test-plan.md`                                                                  |
| Store listing/screenshots/release notes  | MANUAL  | Drafts exist; capture real build and approve copy                                                       |
| Support contact                          | BLOCKED | Confirm monitored support/privacy contact and publish it                                                |
| Play Console declarations/content rating | MANUAL  | Complete in console from confirmed business facts                                                       |
