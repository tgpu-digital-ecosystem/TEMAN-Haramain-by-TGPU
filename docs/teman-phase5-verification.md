# TEMAN Phase 5 — staged integration checkpoint

Continue existing draft PR #39 on e171ccbe56f102871f0e9924dc1c52fafeb77c36. No production merge, migration, permissions change or deployment. Existing founder-only read-only preview remains unchanged. This document describes staged changes; final commit/check outcomes are recorded on the PR and existing Notion/Drive records.

## Independent baseline and live read-only preflight

Previous final-head CI 43701914105 was re-read SUCCESS. All previous tests remain in the suite. New local results: 82 Vitest tests, 69 SQL checks, six synthetic PGlite engine snapshot/restore checks, TypeScript/Vite build and safe-preview packaging pass. Browser/mobile and real local service acceptance require the CI runner; do not infer success from this checkpoint.

Production Supabase read-only inventory still contains only teman_admins, teman_profiles, teman_memberships and teman_demo_access. New business/services/document/notification tables are NOT applied. Existing policies scope those records to their own user. There is no TEMAN Supabase Storage bucket. Existing R2 tgpu-digital-private-files managed public domain is disabled (re-read); no storage configuration changed.

scripts/verify-hosted-readonly.py passed four GET-only groups against production: email Auth enabled/confirmation required/anonymous signup disabled; missing and invalid bearer rejected; anonymous founder registry unavailable/empty; anonymous private profiles unavailable/empty. These are real hosted negative preflights, NOT account lifecycle, tenant workflow, mail delivery or file acceptance.

Connected organisation is Free and both Digital/Gulf projects are active. No spare connected hosted test project was found. Current official billing documentation limits active Free projects to two across owner/admin organisations. Local workspace has no Docker runtime. A separate disposable GitHub Actions stack is therefore staged, rather than pausing another application or buying a branch/project.

## Implemented changes

- Migration 20261115100728_teman_notifications_and_enquiry_access.sql was created using Supabase CLI 3.1.0 migration new. Apply only after the three existing TEMAN migrations in isolated staging. No destructive migration or production mapping changes.
- Fix: historical enquiry visibility formerly allowed a suspended provider to keep sending messages. A private, narrow server-side participant/active-business helper now gates message inserts. Suspended businesses and closed enquiries reject provider and pilgrim replies. Revocation, two-provider ownership, unconfirmed-user and founder escalation checks are included.
- Transactional in-app notifications cover application received/submitted, approval/rejection/changes requested/suspension, new enquiry, reply and status changes. Only private trigger functions create events/recipients. Users can read their own notices and change only read_at (server timestamp). No message bodies, documents or contact details are duplicated into notifications. New status history is append-only and visible through parent enquiry RLS; no invented historical backfill.
- Business/services/pilot pages include a private inbox with translated EN/MS/AR labels, read/unread controls, bounded pages, local validated links and logout-race cleanup. It polls at most once per visible minute plus explicit refresh/focus. These are in-app notices, NOT email/push delivery. No real emails were sent.
- Services use server-side title/category search and stable 50-record pages (51-row lookahead) rather than a fixed first 100. Search values are encoded; private service visibility still depends on existing RLS. Enquiry inbox remains capped at 100 and needs pagination for larger pilots.

## Real local Supabase integration runner

A new CI job starts only an ephemeral local Supabase Docker stack on the GitHub runner, applies the actual migrations after a test-only admin-registry prerequisite, and uses real GoTrue/PostgREST/Postgres. It never uses hosted credentials/project links. The runner refuses non-loopback API/database hosts. CLI startup/status logs and local credentials remain private temporary files, never printed or uploaded. Containers are stopped without backups at job end. CLI is pinned to 3.1.0; no application dependencies added.

Acceptance script covers pending registration, real one-time signup confirmation, password login, refresh rotation, founder registry, forged user metadata/self-promotion, provider application and self-approval denial, founder approval, moderated service visibility, cross-provider edits, private enquiries/replies/notifications, suspension, recovery password change, logout/refresh revocation and actual JWT expiry. Confirmation/recovery proofs are obtained through the local admin API; registration mail goes only to the local SMTP catcher. This does NOT test Zoho delivery or production callbacks.

Document integration invokes the actual Worker against real local Auth/PostgREST metadata with a clearly labelled in-memory object adapter. It tests authorisation and metadata persistence/deletion; it is NOT native Cloudflare R2 acceptance. Hosted configuration parity and founder browser login remain separate release gates. CI must pass before any integration result is claimed.

## Recovery evidence and limitations

Six local checks export a synthetic PGlite engine snapshot, reopen it in a fresh instance and verify record/message persistence, status history, notification RLS and write grants. This is an engine-specific PGlite image, NOT a portable PostgreSQL dump, Supabase Auth backup or storage backup. Production database and R2 recoverability remain UNVERIFIED.

Official Supabase documentation recommends manual database exports for Free projects; automated backups/PITR are not assumed. Database backups exclude object bytes. Before production: take encrypted/private schema+data exports using verified CLI/pg_dump tooling, separately copy private object bytes with a checksum manifest into an authorised protected destination, restore both in isolation, verify identities/RLS/object paths and reconcile changes since the backup. Keep credentials and real personal data out of GitHub, CI artifacts and shared staging. Expected loss is everything since the last verified export; RPO/RTO are unmeasured. No export destination or verified production restore exists yet. Do not enable a paid backup product.

## Feature acceptance matrix

| Requirement | Status | Evidence / gap |
| --- | --- | --- |
| Real Auth | PARTIAL | Four hosted negative preflight groups pass; real local service runner staged. Hosted lifecycle and Zoho callback delivery unverified. |
| Provider document storage | PARTIAL | Existing validated endpoint and metadata/quota tests; real local Auth/metadata integration staged with object adapter. Native R2, signed download URLs, retention/reconciliation unverified. Existing downloads require active Auth per request. |
| Pilgrim private uploads | NOT STARTED | No safe live backend yet; provider evidence API does not grant pilgrim access. |
| Provider onboarding | PARTIAL | Application/founder decision code and SQL tests exist; real local journey staged; founder staging acceptance pending. |
| Service management | PARTIAL | Create/edit/moderate/draft/archive, price/availability text and ownership checks; service image uploads not implemented. |
| Discovery | PARTIAL | Authenticated approved/published listing, title/category search and pagination; no fictional providers. |
| Enquiries | PARTIAL | Persistent messages/status/first response, new status history and recipient notifications; local real integration pending CI. No booking/payment. |
| Notifications | PARTIAL | In-app events implemented/tested. Existing Zoho account function remains deployed v10 with canonical TEMAN links; rendered code is not delivery evidence. Business/enquiry/security email events not implemented. |
| Multilingual | PARTIAL | Business dictionaries and new inbox/search labels EN/MS/AR; unchanged full Account/Owner/confirmation and composite error/status gaps remain. |
| Safety features | PARTIAL | Existing code/tests preserved. No new Saudi integration/rescue claims; actual Family Link backend, consent, offline and device acceptance still unverified. |
| Analytics | PARTIAL | Existing scoped application/service/enquiry/feedback metrics; registered-pilgrim/language/error analytics still absent. |
| Mobile | PARTIAL | Existing CI synthetic mobile/RTL harness preserved; new inbox/discovery runtime tests added. Android physical-device acceptance pending. |
| Security | PARTIAL | New notification RLS/column grants, suspension fix, two-provider negative tests, logout-race UI cleanup; hosted multi-user/security acceptance pending. |
| Recovery | PARTIAL | Six synthetic engine restore checks; production schema/data/object recovery UNVERIFIED. |
| Functional founder staging | BLOCKED | Protected preview remains read-only with no backend bindings. No separate hosted Supabase/R2 staging has been established. |

## Release and rollback

Recommendation: DO NOT RELEASE. Keep PR #39/#38 staged. Preserve the existing read-only preview Access policy and immutable source f33dd1a. Do not turn on mutations or connect it to production as a shortcut. The new CI local stack is disposable, not a persistent founder preview.

Code changes can be reverted on the feature branch. New notifications/history have no destructive down migration: prefer reverting application code and disabling routes while preserving audit records. Production remains unchanged; no rollback is currently necessary. A future production migration requires compatibility mapping, verified private backup/restore, native R2 acceptance, real hosted Auth/mail/provider/pilgrim/founder journeys, full critical multilingual/mobile checks and explicit founder release approval.

References: https://supabase.com/docs/guides/platform/billing-on-supabase ; https://supabase.com/docs/guides/platform/backups ; https://supabase.com/docs/guides/local-development/cli-workflows .
