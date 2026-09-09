# YNS CARD — MASTER CODEX IMPLEMENTATION PROMPT

Project root: C:\YNS\card-app
App: YNS Card
Company: YUVARAJ NETWORKS & SOLUTIONS
Android package: online.ynscrm.card

Treat the complete specification below as the final product direction.

IMPORTANT:
- Audit the existing repository first.
- Preserve the working intro video and final auth UI reference.
- Preserve email/password auth, Google OAuth/PKCE, Supabase session persistence, roles, admin management, card approval workflow, CRM, pagination, analytics, CSV export, Android package, EAS project ID, environment variable names, and existing data.
- Do not rebuild the app from scratch.
- Do not execute Supabase SQL automatically. Create review-only SQL proposals under docs/ when database changes are required.
- Do not weaken RLS.
- Do not add service-role keys or private OAuth/webhook secrets to the mobile app.
- Do not claim Meta/WhatsApp Cloud API features are active until genuinely connected.
- Do not add payment gateway/billing implementation yet unless explicitly instructed later.
- Do not display fake analytics or fake readiness states.
- Do not commit or push automatically.

DESIGN TOKENS:
- Royal navy #061B36
- Deep navy #031326
- Metallic gold #D99A12
- Bright gold #F4B91F
- Warm ivory #FAF8F2
- White #FFFFFF
- Success green #16A36A
- Error red #D92D3A

Use a clean professional font system such as Manrope, Inter, or Plus Jakarta Sans where compatible.

TARGET MAIN TABS:
1. Home
2. Leads
3. Insights
4. Business
5. Profile

Rename the user-facing Connections tab to Leads and Meta tab to Business, while preserving internal compatibility where necessary.

IMPLEMENTATION ORDER:
Phase A — foundation/navigation/design system/states
Phase B — digital identity/card/QR
Phase C — Leads/CRM
Phase D — Insights/Analytics/Reports
Phase E — Business/WhatsApp/Meta/Webhooks/Notifications/Appointments foundations
Phase F — Profile/Security/Plans/Team/Admin
Phase G — Play Store readiness

For every phase:
1. Audit current code first.
2. Reuse existing working features.
3. State what exists and what is missing.
4. Make the smallest safe architecture changes.
5. Keep service/data logic out of large UI screens.
6. Paginate potentially large lists.
7. Protect role-gated screens independently.
8. Preserve compatible routes/aliases.
9. Do not execute SQL.
10. Do not commit/push unless explicitly instructed.

Validation after every phase:
- npm run format:check
- npx.cmd expo install --check
- npx.cmd expo-doctor
- git diff --check
- parse all live JavaScript
- run existing tests
- audit navigation targets
- Android Expo export when feasible
- never run npm audit fix --force

After each phase report:
1. architecture found
2. features reused
3. files modified
4. files added
5. UI changes
6. service/data changes
7. security/privacy findings
8. SQL/RPC proposals created but not executed
9. validation results
10. remaining risks
11. next recommended phase
Then show git status --short and git diff --stat.

Stop after the requested phase and wait for review.

---

# MASTER PRODUCT SPECIFICATION

## Final design direction

YNS Card will become a premium digital identity and business-networking app—not only a digital visiting card.

Brand style:

-  Royal navy: `#061B36` 
-  Deep navy: `#031326` 
-  Metallic gold: `#D99A12` 
-  Bright gold: `#F4B91F` 
-  Warm ivory: `#FAF8F2` 
-  White: `#FFFFFF` 
-  Success green: `#16A36A` 
-  Error red: `#D92D3A` 

Use clean professional fonts such as **Manrope**, **Inter**, or **Plus Jakarta Sans**. The playful font in the old application should be removed.

## Improved navigation

Keep five main tabs:

1. **Home** — card, quick actions and performance 
2. **Leads** — contacts, enquiries and pipeline 
3. **Insights** — views, clicks and conversions 
4. **Business** — WhatsApp, Meta and integrations 
5. **Profile** — cards, account, settings and subscription 

“Connections” should become **Leads**, and “Meta” should become **Business** because the app will eventually support more than Meta.

## Essential features

### Digital identity

-  Multiple digital cards 
-  Personal and business card types 
-  Custom profile photo and company logo 
-  Public card URL 
-  QR code with download and sharing 
-  Save contact as VCF 
-  NFC-ready sharing 
-  Social-media links 
-  Services, portfolio, gallery and documents 
-  Business hours and Google Maps 
-  Appointment-booking button 
-  Testimonials and enquiry form 
-  Card visibility controls 
-  Temporary card deactivation 
-  Custom themes and section ordering 
-  Live card preview while editing 

### Lead management

-  Automatically create leads from card enquiries 
-  Add leads manually 
-  New, contacted, follow-up, meeting, proposal, won and lost stages 
-  Call, WhatsApp and email actions 
-  Notes and activity history 
-  Follow-up date and reminders 
-  Lead source tracking 
-  Tags and priority 
-  Search and advanced filters 
-  Duplicate-lead detection 
-  CSV import and export 
-  Revenue and deal-value tracking 

### Analytics

-  Unique card visitors 
-  Total views and repeat views 
-  QR scans 
-  Link and button clicks 
-  WhatsApp, phone and email clicks 
-  Contact saves 
-  Enquiries and conversions 
-  Top-performing cards and links 
-  Traffic sources 
-  Location and device information 
-  Seven-day, 30-day, 90-day and custom reports 
-  Exportable performance reports 

### WhatsApp and business tools

-  One-tap WhatsApp conversation 
-  Reusable message templates 
-  Automatic welcome and follow-up messages 
-  Lead-ad synchronisation 
-  Webhook status 
-  Campaign source attribution 
-  Appointment reminders 
-  Integration connection status 

Some advanced WhatsApp automation requires the official Meta WhatsApp Cloud API and business verification. The interface should not claim that these features are active until the account is successfully connected.

## Premium features

-  Premium royal themes 
-  Custom domain 
-  Remove YNS branding 
-  Unlimited cards 
-  Team and employee cards 
-  Advanced analytics 
-  Lead automation 
-  WhatsApp Cloud API tools 
-  Custom QR designs 
-  Password-protected cards 
-  Expiring links 
-  Downloadable reports 
-  Priority support 

## Important new screens

-  Splash and onboarding 
-  Login, registration and password recovery 
-  Email/OTP verification 
-  Card-creation wizard 
-  Home dashboard 
-  Public-card preview 
-  Card editor 
-  Theme gallery 
-  QR centre 
-  Lead list and lead details 
-  CRM pipeline 
-  Insights dashboard 
-  Business integrations 
-  Notifications 
-  Subscription and plan comparison 
-  Profile and security settings 
-  Help, privacy policy and account deletion 
-  Loading, offline, empty, success and error states 

## Play Store requirements

Before publishing, the application should include:

-  Privacy policy 
-  Terms and conditions 
-  Account deletion inside the app 
-  Data-safety declaration 
-  Proper permissions explanation 
-  Secure authentication and storage 
-  No sample or fake analytics 
-  Responsive behaviour across Android devices 
-  Optimised app icon, splash screen and screenshots 
-  Crash reporting and production testing 
-  Correct versioning and signed Android App Bundle 

## Recommended next step

The next stage is to create the complete **screen-by-screen UI specification**, starting with:

1.  Splash screen 
2.  Onboarding 
3.  Login 
4.  Registration 
5.  Forgot password 
6.  Home dashboard 

After that, we can redesign Leads, Insights, Business and Profile.

Send me either your latest project ZIP/source code or screenshots from the first screen you want redesigned. I recommend starting with the **Splash, Onboarding and Login screens**.

## Phase 5: Insights, Analytics and Reports

The Insights area should explain what is working and what the owner should do next—not merely display counters.

## 1. Insights dashboard

Header:

- **Insights** 
-  Date-range selector 
-  Card selector 
-  Download report 
-  Compare-period toggle 

Date ranges:

-  Today 
-  7 days 
-  30 days 
-  90 days 
-  This year 
-  Custom range 

Card selection:

-  All cards 
-  Primary card 
-  Individual card 
-  Compare cards 

---

## 2. Performance overview

Show these primary metrics:

| MetricDefinition |                                        |
| ---------------- | -------------------------------------- |
| Unique visitors  | Estimated number of different visitors |
| Card views       | Total public-card openings             |
| Contact actions  | Calls, emails and WhatsApp clicks      |
| Contact saves    | VCF/contact downloads                  |
| New leads        | Completed enquiry submissions          |
| Conversion rate  | Leads divided by unique visitors       |

Each metric should display:

-  Current value 
-  Previous-period value 
-  Percentage difference 
-  Small trend line 
-  Information icon explaining the measurement 

If there is no previous data, show **New activity** instead of an inaccurate percentage.

---

## 3. Conversion funnel

Use one clear funnel:

**Visitors → Engaged visitors → Leads → Won customers**

Example:

-  1,000 visitors 
-  380 engaged visitors 
-  65 leads 
-  14 won customers 

Engaged visitors include people who:

-  Clicked a contact method 
-  Saved the contact 
-  Opened a service or portfolio item 
-  Submitted an enquiry 

Display conversion rates between every stage.

---

## 4. Views over time

Use an interactive line chart.

Options:

-  Views 
-  Unique visitors 
-  Contact actions 
-  Leads 
-  Conversions 

Chart behaviour:

-  Tap a point for exact data 
-  Compare with previous period 
-  Daily grouping for short ranges 
-  Weekly or monthly grouping for longer ranges 
-  Accessible labels and sufficient contrast 
-  Meaningful empty state when no data exists 

Do not start the chart at an artificial value that exaggerates changes.

---

## 5. Top-performing content

### Top links

Show:

-  Link name 
-  Clicks 
-  Unique clicks 
-  Click-through rate 
-  Trend 
-  Card containing the link 

### Top services

Show:

-  Service name 
-  Detail views 
-  Enquiries 
-  Conversion rate 

### Top portfolio items

Show:

-  Project name 
-  Views 
-  Link clicks 
-  Enquiries influenced 

This helps the owner improve actual card content.

---

## 6. Traffic sources

Record where visitors came from:

-  Direct link 
-  QR code 
-  WhatsApp share 
-  Facebook 
-  Instagram 
-  LinkedIn 
-  Email 
-  NFC 
-  Website 
-  Campaign link 
-  Unknown 

Use share-specific tracking links so sources are measured accurately.

Never label an unknown source as “direct” automatically.

---

## 7. Visitor insights

Privacy-safe data can include:

-  Country 
-  Region or city estimate 
-  Device type 
-  Operating system 
-  Browser 
-  Language 
-  New versus returning visitor 
-  Visit time and day 

Do not display:

-  Exact visitor address 
-  Exact GPS position without permission 
-  Personal identity inferred from browser data 
-  Individual cross-site activity 

Explain that location is approximate.

---

## 8. Contact-action analytics

Track:

-  WhatsApp clicks 
-  Phone clicks 
-  Email clicks 
-  Website clicks 
-  Directions opened 
-  Appointment requests 
-  Contact saves 
-  File downloads 
-  Social-link clicks 
-  Payment-link clicks 

Separate **clicks** from confirmed outcomes. Opening WhatsApp does not prove that a message was sent.

---

## 9. QR analytics

Each QR code can have an optional campaign label:

-  Business card 
-  Office banner 
-  Exhibition 
-  Product package 
-  Restaurant counter 
-  Social-media post 

Display:

-  Total scans 
-  Unique scans 
-  Date and time 
-  Approximate location 
-  Resulting actions 
-  Resulting leads 
-  Best-performing QR campaign 

Allow users to create multiple trackable QR codes for one card.

---

## 10. Lead and revenue analytics

Display:

-  Leads by source 
-  Leads by stage 
-  Leads by card 
-  Leads by service 
-  Won and lost deals 
-  Estimated pipeline value 
-  Won revenue 
-  Average deal value 
-  Average conversion time 
-  Common lost reasons 

Clearly distinguish estimated pipeline value from confirmed revenue.

---

## 11. Smart recommendations

Begin with transparent rule-based recommendations:

-  “Add WhatsApp to improve contact options.” 
-  “Your QR campaign generated the most leads this month.” 
-  “Five leads are waiting for follow-up.” 
-  “Your Services section receives views but no enquiries.” 
-  “Complete your profile to improve visitor confidence.” 
-  “Most visitors use mobile devices—check your mobile preview.” 

Each recommendation should include a direct action button.

Do not market these as AI recommendations until genuine AI analysis is implemented.

---

## 12. Reports

Report types:

-  Card-performance report 
-  Lead-conversion report 
-  Campaign/QR report 
-  CRM pipeline report 
-  Team-performance report 
-  Monthly business summary 

Export formats:

-  PDF 
-  CSV 
-  Excel for business accounts 
-  Shareable read-only report link 

Every report should show:

-  Date range 
-  Selected cards 
-  Generated date 
-  Metric definitions 
-  YNS or custom business branding 

---

## 13. Weekly and monthly summaries

Optional notifications:

**Weekly summary**

-  125 card views 
-  31 contact actions 
-  8 new leads 
-  2 customers won 
-  4 overdue follow-ups 

Delivery options:

-  In-app notification 
-  Email 
-  WhatsApp only through an approved WhatsApp API template 

Allow users to disable summaries or change frequency.

---

## 14. Analytics empty state

For new users:

**No insights yet**

“Share your digital card or QR code to begin tracking engagement.”

Actions:

-  Share Card 
-  Open QR Centre 
-  Preview Card 

Do not display fake graphs or sample values unless clearly labelled **Demo Data**.

---

## 15. Analytics data integrity

Use event names consistently:

- `card_view` 
- `qr_scan` 
- `link_click` 
- `contact_save` 
- `enquiry_submit` 
- `appointment_request` 
- `file_download` 
- `lead_created` 
- `stage_changed` 
- `deal_won` 

Each event should include:

-  Event time 
-  Card ID 
-  Anonymous session ID 
-  Source 
-  Campaign 
-  Device category 
-  Associated lead ID when consent permits 

Avoid storing unnecessary personal information.

---

## 16. Privacy and consent

Include:

-  Cookie/privacy notice on the public web card where required 
-  Analytics opt-out support 
-  Consent for enquiry submissions 
-  Data-retention settings 
-  Delete analytics data option 
-  Export personal data option 
-  Clear metric definitions 
-  Masked IP or no raw-IP retention 
-  Role-based access to reports 

## Important corrections to the old Insights screen

-  Prevent horizontally clipped metric cards 
-  Replace repeated Card View activity rows with daily summaries 
-  Separate views, clicks, leads and customers 
-  Explain every metric 
-  Show comparison periods accurately 
-  Add traffic-source and QR-campaign reporting 
-  Use consistent date formats 
-  Hide charts that contain insufficient data 
-  Make reports downloadable 
-  Keep anonymous visitor information privacy-safe 

The next phase is **WhatsApp Business, Meta integration, messaging templates, notifications and automation**.

next

## Phase 6: WhatsApp, Meta and Business Automations

Rename the existing **Meta** tab to **Business** because it will include WhatsApp, Meta Lead Ads, webhooks, notifications and future integrations.

## 1. Business dashboard

Header:

- **Business Tools** 
-  Subtitle: “Connect, communicate and automate” 
-  Help and setup guide 
-  System-status indicator 

Sections:

1.  Connections 
2.  Inbox 
3.  Templates 
4.  Automations 
5.  Lead Ads 
6.  Webhooks 
7.  Notifications 

Every integration must clearly show:

-  Not connected 
-  Setup required 
-  Connected 
-  Action required 
-  Temporarily unavailable 

Never display **Ready** before setup is completed and verified.

---

## 2. WhatsApp options

Offer two distinct modes.

### Basic WhatsApp

Available to all users:

-  Open WhatsApp from a lead 
-  Pre-filled message 
-  Share digital card 
-  Reusable personal templates 
-  Click tracking 
-  No automatic message sending 

This uses a standard WhatsApp link and does not require API integration.

### WhatsApp Business API

For eligible Business users:

-  Shared business inbox 
-  Approved templates 
-  Automated notifications 
-  Lead assignment 
-  Conversation history 
-  Delivery and read status 
-  Opt-in management 
-  Team access 

This requires Meta Business verification, a WhatsApp Business Account and an approved phone number.

---

## 3. Connection wizard

Use a guided setup:

1.  Explain requirements 
2.  Sign in with Meta 
3.  Select Business Portfolio 
4.  Select or create WhatsApp Business Account 
5.  Select phone number 
6.  Grant required permissions 
7.  Verify webhook 
8.  Send test message 
9.  Confirm connection 

Display only the permissions actually required.

After connection, show:

-  Business name 
-  Masked phone number 
-  Connection date 
-  Quality rating 
-  Messaging status 
-  Webhook status 
-  Disconnect button 

Disconnecting should require confirmation and explain what stops working.

---

## 4. WhatsApp inbox

Inbox layout:

-  Search conversations 
-  Filters 
-  Unread count 
-  Assigned team member 
-  Customer information 
-  Lead stage 
-  Conversation panel 
-  Notes and follow-up shortcuts 

Filters:

-  Unread 
-  Unassigned 
-  Mine 
-  Open 
-  Waiting 
-  Resolved 
-  High priority 

Conversation actions:

-  Send message 
-  Use template 
-  Add note 
-  Assign user 
-  Change lead stage 
-  Schedule follow-up 
-  Mark resolved 
-  Block/report contact 

Internal notes must never be sent to customers.

---

## 5. WhatsApp templates

Template categories:

-  Welcome 
-  Follow-up 
-  Appointment confirmation 
-  Appointment reminder 
-  Proposal follow-up 
-  Payment reminder 
-  Thank you 
-  Feedback request 
-  Re-engagement 

Each template includes:

-  Template name 
-  Language 
-  Category 
-  Header 
-  Message body 
-  Footer 
-  Variables 
-  Buttons 
-  Meta approval status 

Statuses:

-  Draft 
-  Submitted 
-  Approved 
-  Rejected 
-  Paused 

Provide a preview with sample variable values.

For Basic WhatsApp, label these as **Quick Messages**, not official WhatsApp API templates.

---

## 6. Automation builder

Use a simple structure:

**Trigger → Conditions → Action**

Example:

> When a new card enquiry arrives → if the selected service is Website Development → create a lead, assign Karthik and schedule a follow-up for tomorrow.

Triggers:

-  New enquiry 
-  New lead 
-  QR scan 
-  Appointment request 
-  Stage changed 
-  Follow-up overdue 
-  Deal won 
-  No response for selected days 
-  Card nearing expiration 

Conditions:

-  Card 
-  Lead source 
-  Service 
-  Stage 
-  Priority 
-  Assigned user 
-  Working hours 
-  Consent status 

Actions:

-  Create lead 
-  Assign lead 
-  Change stage 
-  Add tag 
-  Schedule follow-up 
-  Send in-app notification 
-  Send email 
-  Send approved WhatsApp template 
-  Create webhook event 

Include:

-  Active/inactive toggle 
-  Test automation 
-  Run history 
-  Failure reason 
-  Retry option 
-  Pause after repeated failures 

---

## 7. Meta Lead Ads

Setup flow:

1.  Connect Meta account 
2.  Select Facebook Page 
3.  Select lead form 
4.  Map fields 
5.  Choose CRM stage 
6.  Assign owner 
7.  Select follow-up automation 
8.  Submit a test lead 
9.  Activate sync 

Field mapping should support:

-  Full name 
-  Phone 
-  Email 
-  Company 
-  City 
-  Interested service 
-  Budget 
-  Custom questions 

Dashboard:

-  Synced leads 
-  Failed imports 
-  Form name 
-  Campaign 
-  Cost data when permission allows 
-  Last sync time 

Provide manual retry for failed leads.

---

## 8. Webhooks

For advanced users:

Events:

-  Lead created 
-  Lead updated 
-  Enquiry submitted 
-  Card viewed 
-  QR scanned 
-  Appointment requested 
-  Deal won 
-  Deal lost 

Controls:

-  Endpoint URL 
-  Secret signing key 
-  Selected events 
-  Test payload 
-  Delivery logs 
-  Retry failed delivery 
-  Rotate secret 
-  Disable endpoint 

Security:

-  HTTPS only 
-  Signed payloads 
-  Timestamp validation 
-  Secret masking 
-  Retry limits 
-  Rate limiting 

Do not expose internal database keys or service-role credentials.

---

## 9. Notifications centre

Categories:

-  New leads 
-  Follow-ups 
-  Meetings 
-  Card activity 
-  Integration status 
-  Subscription and billing 
-  Security 
-  Product updates 

Notification controls:

-  In-app 
-  Push 
-  Email 
-  WhatsApp, when approved 
-  Quiet hours 
-  Frequency 
-  Daily digest 
-  Weekly summary 

Allow individual notification types to be disabled.

Security alerts should remain enabled by default:

-  New device login 
-  Password changed 
-  Email changed 
-  Meta disconnected 
-  Suspicious account activity 

---

## 10. App notification inbox

Each notification should contain:

-  Icon and category 
-  Clear message 
-  Date and time 
-  Related card or lead 
-  Primary action 
-  Read/unread status 

Examples:

-  “A new lead requested Website Development.” 
-  “Your follow-up with Ravi is overdue.” 
-  “Your WhatsApp connection requires attention.” 
-  “Your card received 25 views today.” 

Group repeated low-priority activity into summaries.

---

## 11. Appointments

Booking settings:

-  Available days 
-  Working hours 
-  Meeting duration 
-  Break between meetings 
-  Daily booking limit 
-  Online or physical meeting 
-  Advance-booking period 
-  Cancellation policy 

Visitor flow:

1.  Choose service 
2.  Select date and time 
3.  Enter contact information 
4.  Provide consent 
5.  Confirm appointment 

Owner actions:

-  Confirm 
-  Reschedule 
-  Cancel 
-  Complete 
-  Mark no-show 
-  Convert to lead 

Calendar integration can be introduced after the core booking system is reliable.

---

## 12. Payments and invoices—later stage

Useful future capabilities:

-  UPI payment link 
-  Razorpay or another supported payment gateway 
-  Payment requests 
-  Basic quotations 
-  Invoice records 
-  Payment reminders 
-  Paid/pending status 

Do not store card numbers or sensitive payment credentials inside YNS Card.

---

## Free and paid structure

| FeatureFreeProBusiness |         |           |           |
| ---------------------- | ------- | --------- | --------- |
| WhatsApp click-to-chat | Yes     | Yes       | Yes       |
| Quick messages         | Limited | Unlimited | Unlimited |
| Lead reminders         | Limited | Yes       | Yes       |
| Meta Lead Ads          | No      | Optional  | Yes       |
| WhatsApp Cloud API     | No      | No        | Yes       |
| Shared inbox           | No      | No        | Yes       |
| Automation builder     | No      | Limited   | Full      |
| Team assignments       | No      | No        | Yes       |
| Webhooks               | No      | No        | Yes       |
| Delivery logs          | No      | No        | Yes       |

## Essential corrections to the old Meta screen

-  Replace premature **Ready** labels with genuine connection states 
-  Separate Basic WhatsApp from WhatsApp Cloud API 
-  Do not imply an inbox works before API connection 
-  Add guided onboarding and permission explanations 
-  Show webhook failures and last successful sync 
-  Add consent and unsubscribe management 
-  Distinguish Quick Messages from approved Meta templates 
-  Add connection health and troubleshooting 
-  Group all integrations under Business Tools 
-  Remove premium advertisements while the user is completing setup 

The next phase is **Profile, account security, subscriptions, administration and team management**.

next

## Phase 7: Profile, Security, Plans and Administration

The Profile screen should contain account-level settings. Card content should remain inside **My Cards** to avoid duplication.

## 1. Profile header

Display:

-  Profile photo 
-  Account owner’s name 
-  Email address 
-  Current plan 
-  Account status 
-  Manage account button 
-  Notification and settings buttons 

Do not place the complete digital card and analytics inside Profile. These belong on Home and Insights.

Suggested sections:

1.  Account 
2.  Cards and branding 
3.  Team 
4.  Subscription 
5.  Security and privacy 
6.  Application preferences 
7.  Help 
8.  Administration 
9.  Sign out 

---

## 2. Account information

Editable fields:

-  Full name 
-  Profile photo 
-  Mobile number 
-  Email address 
-  Preferred language 
-  Time zone 
-  Business name 
-  Industry 
-  GST number — optional 
-  Billing address — optional 

Sensitive changes should require password or OTP confirmation:

-  Email address 
-  Mobile number 
-  Password 
-  Account ownership 

---

## 3. Security centre

Include:

-  Change password 
-  Two-factor authentication 
-  Biometric application lock 
-  Active sessions 
-  Trusted devices 
-  Login history 
-  Security alerts 
-  Backup recovery codes 
-  Sign out from all devices 

Active-session details:

-  Device name 
-  Operating system 
-  Approximate location 
-  Last active time 
-  Current-device badge 
-  Revoke session 

Never display complete IP addresses to ordinary users.

---

## 4. Privacy and data controls

Provide:

-  Download my data 
-  Delete analytics history 
-  Manage communication consent 
-  Public-profile visibility 
-  Search-engine visibility 
-  Personalization preference 
-  Analytics opt-out where applicable 
-  Data-retention preference 
-  Blocked contacts 
-  Delete account 

Account deletion flow:

1.  Explain what will be deleted 
2.  Offer data download 
3.  Require password or OTP 
4.  Ask for optional reason 
5.  Provide a short cancellation period if supported 
6.  Confirm deletion status by email 

This feature is important for Play Store compliance.

---

## 5. Application preferences

Settings:

-  Light, dark or system theme 
-  Language 
-  Date format 
-  Currency 
-  Time zone 
-  Default digital card 
-  Default sharing channel 
-  Notification preferences 
-  Reduce motion 
-  Larger text 
-  Biometric lock 
-  Data-saving mode 

Recommended initial languages:

-  English 
-  Telugu 
-  Hindi 

---

## 6. Subscription plans

Use three clear plans.

### Free

-  One digital card 
-  Standard theme 
-  QR sharing 
-  Basic analytics 
-  Basic lead management 
-  YNS branding 

### Pro

-  Multiple cards 
-  Premium themes 
-  Custom QR styles 
-  Advanced analytics 
-  CRM exports 
-  Custom branding 
-  Appointment booking 
-  Additional storage 

### Business

-  Team members 
-  Employee cards 
-  Shared lead inbox 
-  Lead assignment 
-  Meta Lead Ads 
-  WhatsApp Cloud API tools 
-  Automations 
-  Webhooks 
-  Business reports 
-  Role-based permissions 

Show exact prices, taxes, billing periods and renewal terms before payment. Avoid fake countdown timers or misleading discounts.

---

## 7. Billing management

Display:

-  Current plan 
-  Billing cycle 
-  Next renewal 
-  Payment status 
-  Upgrade or downgrade 
-  Cancel renewal 
-  Restore purchase 
-  Billing history 
-  Download invoices 
-  Update billing information 

For Android digital subscriptions, implementation must follow the current Google Play Billing requirements. Do not unlock digital app features through an unsupported external payment flow.

---

## 8. Team management

Business accounts can:

-  Invite team members 
-  Assign roles 
-  Create employee cards 
-  Assign leads 
-  Remove access 
-  Transfer ownership 
-  View login and activity records 
-  Control exports and deletion rights 

Recommended roles:

| RoleMain permission |                                  |
| ------------------- | -------------------------------- |
| Owner               | Full account and billing control |
| Admin               | Team, cards and CRM management   |
| Manager             | Leads, reports and assignments   |
| Salesperson         | Assigned leads and activities    |
| Designer            | Card content and themes          |
| Viewer              | Read-only access                 |

Invitation statuses:

-  Pending 
-  Accepted 
-  Expired 
-  Revoked 

---

## 9. Employee digital cards

Business owners should be able to:

-  Create cards from a company template 
-  Lock logo, brand colours and legal information 
-  Let employees edit approved personal fields 
-  Bulk-create cards from CSV 
-  Pause a card when an employee leaves 
-  Transfer enquiries to the company 
-  View organisation-level analytics 

This can become one of YNS Card’s strongest Business features.

---

## 10. Card approval system

Use approvals only for teams or verified organisations.

Flow:

1.  Employee creates or edits a card 
2.  Card becomes **Pending Review** 
3.  Admin reviews changed fields 
4.  Admin approves or requests corrections 
5.  Approved version is published 

Statuses

## Phase 7: Profile, Security, Plans and Administration

The Profile section should contain only account-level settings. Card editing and business tools should remain in their respective sections to reduce duplication.

## 1. Profile overview

Header:

-  Profile photo 
-  Full name 
-  Account email 
-  Account type: Free, Pro, Business or Admin 
-  Verification status 
-  Edit profile 
-  Notifications 
-  Settings 

Account summary:

-  Number of digital cards 
-  Leads 
-  Team members 
-  Storage used 
-  Subscription renewal date 

Do not display the full QR code on the Profile screen. Keep it inside the QR Centre.

---

## 2. Profile menu structure

### Account

-  Personal information 
-  Login and security 
-  Language and region 
-  Notifications 
-  Connected accounts 

### Workspace

-  Digital cards 
-  Team members 
-  Roles and permissions 
-  Brand settings 
-  Custom fields 
-  CRM stages 

### Subscription

-  Current plan 
-  Usage and limits 
-  Upgrade plan 
-  Billing history 
-  Manage subscription 

### Support

-  Help centre 
-  Setup guides 
-  Contact support 
-  Report a problem 
-  Feature request 
-  App information 

### Legal

-  Privacy policy 
-  Terms and conditions 
-  Data and consent 
-  Open-source licences 
-  Delete account 

---

## 3. Personal information

Editable fields:

-  Profile photo 
-  Full name 
-  Mobile number 
-  Account email 
-  Job title 
-  Company 
-  Preferred language 
-  Time zone 
-  Date and number formats 

Changing email or mobile number should require verification.

Account details and public-card details must remain separate. Editing the account name should not automatically change every published card.

---

## 4. Security centre

Security features:

-  Change password 
-  Google sign-in connection 
-  Email verification 
-  Phone verification 
-  Two-factor authentication 
-  Active sessions 
-  Trusted devices 
-  Login history 
-  Security alerts 
-  Sign out from all devices 

Sensitive actions require recent authentication:

-  Change password 
-  Change email 
-  Export data 
-  Delete account 
-  Transfer workspace ownership 
-  Disconnect Meta 
-  Change billing details 

---

## 5. Two-factor authentication

Support:

-  Authenticator application 
-  Email OTP as a fallback 
-  Recovery codes 

Setup:

1.  Confirm password 
2.  Scan authentication QR 
3.  Enter six-digit code 
4.  Download recovery codes 
5.  Confirm activation 

Do not use SMS as the only two-factor method.

---

## 6. Sessions and devices

Each active session should show:

-  Device type 
-  Operating system 
-  Approximate location 
-  Last active time 
-  Current-device label 
-  Sign-out action 

Notify the user after a new-device login.

Location must be described as approximate.

---

## 7. Plans

### Free

Suitable for trying the service:

-  One digital card 
-  Essential contact fields 
-  Standard theme 
-  QR code 
-  Basic analytics 
-  Limited leads 
-  YNS branding 

### Pro

Suitable for professionals:

-  Multiple digital cards 
-  Premium themes 
-  Services and portfolio 
-  Advanced analytics 
-  Custom QR codes 
-  Card password and expiration 
-  More lead storage 
-  Remove some YNS branding 
-  Custom domain as an optional add-on 

### Business

Suitable for teams:

-  Employee cards 
-  Team roles 
-  Shared CRM 
-  Lead assignment 
-  WhatsApp Cloud API integration 
-  Meta Lead Ads 
-  Automations 
-  Webhooks 
-  Advanced reports 
-  Central brand controls 
-  Audit logs 

Do not advertise “unlimited” unless infrastructure and fair-use limits genuinely support it.

---

## 8. Subscription screen

Display:

-  Current plan 
-  Billing frequency 
-  Renewal date 
-  Included limits 
-  Current usage 
-  Upgrade or downgrade 
-  Cancel renewal 
-  Restore purchase 
-  Billing history 
-  Tax invoice 

Before purchasing:

-  Show exact price 
-  Show billing period 
-  Explain applicable taxes 
-  Explain auto-renewal 
-  Provide cancellation terms 
-  Display feature comparison 

For Android-distributed digital features, implement billing according to the current Google Play billing rules applicable at launch.

---

## 9. Usage limits

Show transparent counters:

-  Cards used 
-  Leads stored 
-  Team seats 
-  Storage 
-  Monthly automation runs 
-  WhatsApp usage 
-  Report exports 
-  Custom QR campaigns 

Warn at:

-  80% usage 
-  100% usage 

Do not delete user data immediately when a plan expires. Use a documented read-only or grace period.

---

## 10. Team management

Business workspace roles:

| RoleMain permissions |                                |
| -------------------- | ------------------------------ |
| Owner                | Complete control and billing   |
| Admin                | Workspace and team management  |
| Manager              | Leads, reports and assignments |
| Salesperson          | Assigned leads and activities  |
| Designer             | Card content and themes        |
| Viewer               | Read-only access               |

Team functions:

-  Invite by email 
-  Assign role 
-  Resend invitation 
-  Suspend access 
-  Transfer ownership 
-  Remove member 
-  Assign cards 
-  Assign leads 
-  View recent activity 

Never allow the last workspace owner to remove themselves without transferring ownership.

---

## 11. Employee-card management

Business accounts can:

-  Create cards for employees 
-  Apply a locked company template 
-  Control company logo and colours 
-  Control approved links 
-  Assign departments 
-  Update common company information centrally 
-  Deactivate cards when employees leave 
-  Export an employee QR package 
-  View card engagement by department 

Employees can edit only the fields allowed by the workspace administrator.

---

## 12. Brand settings

Workspace owners can manage:

-  Company logo 
-  Primary and secondary colours 
-  Approved fonts 
-  Default card template 
-  Company description 
-  Address 
-  Social links 
-  Legal footer 
-  Email signature 
-  Employee-card rules 

Include an accessibility check for colour contrast.

---

## 13. Administration

The Administration section must be visible only to authorized YNS administrators.

Admin modules:

-  User management 
-  Card review 
-  Reported content 
-  Subscription management 
-  Support tickets 
-  Feature flags 
-  Integration monitoring 
-  Notification broadcasts 
-  Audit logs 
-  Platform analytics 

Do not display **Card Approvals** to ordinary users.

---

## 14. Card verification and approval

Separate three concepts:

- **Email verified** — account email confirmed 
- **Business verified** — business identity reviewed 
- **Card approved** — card meets platform policies 

Verification process:

1.  Submit business information 
2.  Upload approved documents securely 
3.  Administrator review 
4.  Approve, reject or request changes 
5.  Notify the user 
6.  Maintain verification history 

The badge should explain what has actually been verified.

Never automatically label every card “Approved.”

---

## 15. Support centre

Support options:

-  Searchable help articles 
-  Getting-started checklist 
-  Video tutorials 
-  Submit support ticket 
-  Attach screenshot 
-  Report technical problem 
-  Check service status 
-  View ticket history 

Ticket fields:

-  Category 
-  Subject 
-  Description 
-  Related card 
-  Screenshot 
-  Device and app version 
-  Priority 

Collect device diagnostics only with user consent.

---

## 16. Account deletion

Required flow:

1.  Explain what will be deleted 
2.  Offer data export 
3.  Require recent authentication 
4.  Ask for reason—optional 
5.  Confirm using clear wording 
6.  Provide a short recovery/grace period if supported 
7.  Permanently delete or anonymize data according to policy 
8.  Send confirmation 

Deleting a card and deleting an account must be separate actions.

---

## 17. Sign-out experience

Use one standard sign-out option at the bottom of Profile.

Confirmation:

> Sign out of YNS Card on this device?

Actions:

-  Cancel 
-  Sign Out 

Also provide **Sign out from all devices** inside the Security Centre.

---

## Improvements to the old Profile screen

-  Remove duplicated card and CRM settings 
-  Move QR code to the QR Centre 
-  Hide administration from regular users 
-  Separate account information from card information 
-  Explain verification badges accurately 
-  Add security, sessions and two-factor authentication 
-  Add team and workspace controls 
-  Add plan usage and transparent limits 
-  Add data export and account deletion 
-  Reduce the extremely long settings page using grouped subpages