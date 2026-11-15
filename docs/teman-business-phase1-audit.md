# TEMAN operational workflow checkpoint — 15 November 2026

## Evidence and boundaries

Base main: `44ebf15697598eae2e121733df84731d5cce21be`.
Inspected Notion HQ `411f7c2e3c0e8194be6fdd2c899adc7a` and existing Google technical handover. Open PR #35 covers unrelated community/Jamaah/marketplace pure models; #36 covers owner/account access; #37 covers permanent imagery release tests. This branch reuses the four account/owner files from #36 and adds operational pages. Reconcile those overlapping files before merging either PR. No PR was blindly merged.

Live Supabase read-only inspection found exactly four public TEMAN tables: admins, profiles, memberships, demo_access. All have RLS. Existing admin self-read policy was inspected; this branch does not change founder identity or cross-app role tables. Business/service/enquiry migrations are NOT APPLIED to production.

Cloudflare deployments/Access inventory was read. Existing HQ records identify production rollback version `6355c047-9f2a-4ffc-9f83-adc95d0a67eb`; re-read deployment state immediately before any release. No deployment, DNS, Access or live authentication configuration was changed in this task. Protected preview is not verified. Deployed asset provenance remains unverified.

Live browser: production homepage loaded, English language selector changed the visible navigation, hero and feature text. This verifies landing rendering/language interaction only; not login, maps, Family Link or emergency delivery. New business pages have not been deployed and were not exercised in this browser.

## Inventory and gap register

| Workstream | Previous state | Changes implemented | Verification | Remaining blocker |
|---|---|---|---|---|
| Provider application | NOT IMPLEMENTED | Business application, licence references, consent, immutable test flag, owner-scoped RLS | Local SQL and DOM tests | Live migration/auth testing; secure documents upload |
| Founder review | PARTIAL OR BROKEN (placeholder HQ) | Review queue, changes requested/resubmit, approval/rejection/suspension, immutable review history; HQ navigation | Local real Postgres role tests | Protected staging, real founder/nonowner sessions |
| Services | NOT IMPLEMENTED | Approved-provider creation, founder moderation, provider unpublishing, suspension removes discoverability | Local SQL tests | Provider display name, edit UI, pagination and live QA |
| Enquiries/replies | NOT IMPLEMENTED | Persisted reference UUID, tenant-scoped inbox, append-only messages, status updates, rate caps | Local SQL tests | Notification delivery; response metrics; live authentication/RLS |
| Audit trail | NOT IMPLEMENTED | Server-derived append-only service/enquiry events and business-review records | Local SQL tests | Founder audit UI and retention policy |
| Pilgrim landing | IMPLEMENTED BUT UNVERIFIED | Existing UI preserved | VERIFIED WORKING: live English switch | Broader safety/mobile/browser checks |
| Family Link | IMPLEMENTED BUT UNVERIFIED | No business dependency added | Existing regression suite passed | Real backend regression against Cloudflare hosting |
| Pilot measurement | NOT IMPLEMENTED | Test flags, timestamps and recorded status foundation | Schema tests | Aggregate metrics, provider response-time computation, feedback capture |
| Languages/accessibility | PARTIAL | Labelled controls, live status messages, single-column forms | DOM gating/XSS tests | New pages currently English only; Malay/Arabic/RTL, mobile visual QA |
| Preview/release | PARTIAL | CI-only workflow, repeatable local SQL test command, lockfile | Local build/tests | Remote CI, protected preview, deployed bytes parity and approval |

## Security details

No service-role key is shipped. Existing publishable API key is reused. Every new public table has RLS and explicit grants; anonymous access denied. Existing `teman_admins` is the sole authority. User metadata never grants a role. Review documents are not uploaded to insecure storage: this version accepts issuer/reference text only and explicitly tells users not to provide sensitive documents. One application per authenticated user. Server-side verified-email checks protect application/enquiry/message writes. Enquiries are capped at 10/user/hour and messages at 60/user/hour under advisory locks. These are account caps, not comprehensive network/anti-bot protection.

Private definer helpers expose only a boolean or append server-derived audit events; execute is revoked from PUBLIC. Trigger functions are not exposed as public RPCs. New tables do not read or change other apps. Raw licence details are never included in service discovery. Service discovery currently requires sign-in.

Local PGlite runs Postgres with synthetic auth.users/auth.uid() and authenticated/anon roles. This validates SQL/RLS behavior in an actual local engine, NOT Supabase JWT issuance, PostgREST grants/schema exposure, storage, email or real cross-app account isolation. Existing shared TGPU Digital auth is retained; per-app auth separation remains a separate architectural gate.

## Neon decision

Read connected Neon project and branch inventories. Digital sandbox `rough-water-08647913` exists; branches are main, community-security-20261115 and autocare-mvp-dev. No TEMAN database exists there. No branch/project created, no existing workload altered, no auth migration. Existing Supabase integration plus local SQL tests avoids extra compute/branch usage. Neon remains available for a future isolated compatibility test if required. No paid service enabled.

## Reproduce

`npm ci`, `npm test`, `npm run test:business-db`, `npm run build`.
Local result at checkpoint: 25 Vitest tests passed; 27 SQL checks passed; Vite/TypeScript build passed. Build warns about the existing large offline-map chunk.

Local visual test attempt failed because Chromium process sockets were denied (`socket() failed: Operation not permitted`); Vite's host discovery also failed with `uv_interface_addresses`. No mobile screenshot is claimed. Cloud browser was used only for production landing interaction. DOM tests are not a substitute for mobile visual or real-auth tests.

## Next release gates

1. Review both SQL files; test against a Supabase nonproduction environment with the actual auth schema and REST API.
2. Complete secure verification-document handling, privacy/retention policy, service provider identity, multilingual/RTL, feedback/analytics and missing UI operations.
3. Reconcile #35/#36/#37 and this branch; main still retains legacy Azure workflow until reviewed merge. This branch replaces it with CI only.
4. Deploy only to a verified protected preview; do not point it at production writes for synthetic testing.
5. Test founder, provider A, provider B and pilgrim with real sessions; session expiry, sign-out, email verification/recovery, RLS negative cases, safety and Family Link regression.
6. Capture mobile/desktop screenshots and Arabic RTL evidence. Verify original logos/permanent landing imagery.
7. Reconfirm Cloudflare rollback version, built asset provenance, CI and migration gates. Obtain founder approval for production.
8. Apply reviewed migrations through Supabase release process and deploy via Cloudflare, never Azure. Smoke-test then monitor.

Rollback: before release, keep current Worker version and full database backup. Roll back frontend to the captured Worker version if smoke checks fail. Preserve new database tables/data for diagnosis; do not drop tables as an automatic rollback. The migrations are additive and transaction wrapped. A schema rollback requires a separately reviewed migration after checking dependencies and preserving collected records.
