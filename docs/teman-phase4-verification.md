# TEMAN security continuation — 15 November 2026

Status: staged partial implementation; production release BLOCKED. Continue draft PR #39, stacked on #38. PR #32 is already merged. No duplicate PR, production migration, user permission change, email, payment or production deployment is authorised by this evidence.

## Verified changes and checks

- Document API validates complete routes and tenant/object scope. Auth/backend failures remain distinct. Uploads require a confirmed metadata reservation before R2 writes. An uncertain R2 write retains the quota reservation for reconciliation. Delete removes R2 bytes before metadata and reports pending cleanup instead of false success. Runtime tests cover those failures and cross-tenant object references.
- Account, business, services, pilot and owner pages share refresh-token rotation. Concurrent refresh is coalesced; logout/new-login races cannot restore an old session. Expired access clears private UI. Database membership and founder checks remain server-side.
- Restored the email verification callback into Vite's public output, reconciling only the callback from PR #33. Tokens are scrubbed from the address bar; signup does not persist a role/session. Password confirmation and recovery logout are tested. Staged signup/reset use the existing TEMAN branded-email function; actual mail delivery was not exercised.
- Existing resolved dependency versions are pinned. JWT verification uses jose 6.2.17 and preview packaging uses esbuild 0.28.2. CI checks the actual PR head, cancels superseded runs, and avoids duplicate feature push runs. CI has no deployment step.
- Local verification: 73 Vitest tests, 46 synthetic-auth PGlite SQL checks, TypeScript/Vite build and read-only preview packaging passed. SQL tests do not prove hosted Supabase JWT/PostgREST behavior. No migration changed in this continuation.
- Main React chunk remains 435.67 kB (137.65 kB gzip); lazy map chunk remains 1,113.41 kB (306.86 kB gzip). Build warns about chunk size. No claim of resolved map performance or full-product translation coverage.

## Preview boundary

Cloudflare Access application 54072432-1984-4615-8036-7d2c3b63083e targets preview destinations of Worker 7c45ff1a27884a7cb78fad326107f04b. Reusable policy d4dce3d5-e37d-4c41-89ea-76ca0adad391 permits only mamduh@tgpu.my for one hour. Both were read back successfully. This is a verified configuration, not proof of an authenticated browser session.

The review worker verifies signed RS256 Access JWTs, issuer, audience, expiry and founder email on every request. It refuses production hostnames, denies backend API operations and static writes, disables cross-origin connections, and labels itself read-only. No database/R2/email credentials or bindings are included. Existing document-preview template no longer defaults to production database or bucket bindings.

Read-only preview deployed successfully as aff831db-32e1-46df-bdf4-2174d4869599 (deployment 1), source f33dd1af379f8f07ceecaedddf457aae3bb969df. Deployment readback confirms only SOURCE_COMMIT and ACCESS_AUD plain-text bindings; no backend bindings. Browser verified unauthenticated navigation redirects to the correct TEMAN Cloudflare Access login. Founder authenticated content/session testing remains pending. Preview destination: https://feature-teman-phase2-pilot-20261115-tgpu-teman.moesaffin.workers.dev . Do not call this a working marketplace, live authentication test or functional storage preview. GitHub CI run 43701731949 passed for that exact source, including npm ci, 73 tests, 46 SQL checks, build, preview packaging and synthetic mobile/RTL browser tests. Do not deploy the read-only bundle to the production Worker.

## Release blockers

| Gate | Evidence / remaining work |
| --- | --- |
| Hosted Auth | Isolated Supabase environment unavailable; real signup, confirmation, login, refresh, reset, revocation and multi-user negative tests pending. Do not use Neon SQL results as certification. |
| Private storage | Mocked Auth/PostgREST/R2 failures covered; live object, signed URL, expired URL and revocation tests pending. Retained reservations need an authorised reconciliation/retention procedure. No production deletion. |
| Migrations/recovery | PR #38/#39 migrations remain unapplied. Complete production compatibility, protected backup and restore/rollback rehearsal still required. |
| Operational journeys | Real founder/provider/pilgrim onboarding, publication, enquiries and notifications pending on isolated backend. Read-only UI cannot certify them. |
| Product regression | Full EN/MS/AR errors/status text, real-device accessibility, approved permanent media, Family Link backend/privacy and map performance remain open. |
| Provenance | Production version is 6355c047-9f2a-4ffc-9f83-adc95d0a67eb, deployment 50d82454-6c69-4760-b74b-8ff6ffa7afe1 (re-read after preview deployment: unchanged at 100%). Exact production Git source parity not established. Re-read before any release. |
| Founder acceptance | Interactive Access login and real app acceptance pending; no OTP or identity bypass. |

## Rollback and recovery limits

No production rollback is needed because this work is staged. For a faulty read-only preview, remove/replace only its named preview deployment; retain Access protection. Production Worker and database stay unchanged. Code rollback can revert the continuation commit on the feature branch. This does not constitute a data recovery test.

For a future database release: export schema and critical data through an authorised private channel, encrypt and restrict access, verify a restore in isolation, reconcile tenant mapping and test forward/rollback behavior first. Do not assume Free-plan point-in-time recovery. Never commit production personal data, secrets or exports. Until verified recoverability and every critical gate pass, keep both PRs draft and do not merge or migrate.

CI evidence: https://github.com/tgpu-digital-ecosystem/TEMAN-Haramain-by-TGPU/actions/runs/43701731949 . Code tree parity: 69045bc9606c6301d66470387344c671bc461863. This documentation-only follow-up does not change the deployed preview source.
