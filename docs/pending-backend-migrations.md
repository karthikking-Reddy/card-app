# Pending Backend Migration Review Queue

> Review-only inventory. Phase G did not execute, combine or deploy SQL.

| Proposal                                         | Purpose                                  |                                     Required before launch? | Risk                                   | Manual review | Dependencies                                   |
| ------------------------------------------------ | ---------------------------------------- | ----------------------------------------------------------: | -------------------------------------- | ------------: | ---------------------------------------------- |
| `admin-management-supabase-proposal.sql`         | Secure roles and assignments             |                                   Confirm deployed behavior | Critical privilege escalation risk     |           Yes | Existing profiles/RPC grants                   |
| `pagination-supabase-proposal.sql`               | Bounded admin/list access                |                            Recommended at production volume | Query/grant compatibility              |           Yes | Current schema/indexes                         |
| `phase-b-digital-identity-supabase-proposal.sql` | Multi-card identity/block foundations    |                              Confirm deployed features only | Data migration/RLS                     |           Yes | Cards, storage, approvals                      |
| `phase-c-leads-supabase-proposal.sql`            | Lead CRM stages/follow-ups               |                              Confirm deployed features only | Ownership/RLS/data migration           |           Yes | Profiles/cards/leads                           |
| `phase-d-insights-supabase-proposal.sql`         | Analytics/report scaling                 | Not required while bounded client queries remain acceptable | Aggregation/privacy/grants             |           Yes | Analytics event model                          |
| `phase-e-business-supabase-proposal.sql`         | Business/WhatsApp foundations            |         Only for provider features represented as connected | Provider secrets/webhooks/RLS          |           Yes | Secure server runtime/provider account         |
| `phase-f-profile-security-supabase-proposal.sql` | Profile/security and deletion foundation |                         **Yes for secure account deletion** | Irreversible deletion/auth-admin scope |           Yes | Recent auth, service backend, retention policy |

Before any deployment: take a schema/grant backup, diff against production, review transaction/rollback behavior, test with normal/admin/super-admin identities, verify `search_path` and execute grants, and obtain explicit human approval. Never place service-role credentials in the mobile application.
