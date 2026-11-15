# Latest verified evidence — PR #39

Implementation commit: e710f31f590ae67785edd66e26119af37b3d5cb4. GitHub Actions run 43694993521 passed all steps: 37 Vitest tests, 46 database checks, build, Chromium installation and synthetic browser mobile/RTL test. Screenshot artifact 14153743817 was downloaded and all three PNGs inspected. Arabic/mobile form layout showed no horizontal overflow; title input survived language changes. These screenshots use synthetic HTTP fixtures, not live accounts or database acceptance.

R2 tgpu-digital-private-files: managed public domain enabled=false, custom domains empty (read-only verified). Cloudflare automatically attempted build 614381e7-6b36-4524-b5fa-6824efad860c for this commit and it failed; the deliberate WORKERS_CI guard blocks upload. Preview build control 5bfea80b92f54ff5b9f7df289925ba01 was subsequently patched and read back auto_build=false. Production settings were not changed. No protected preview deployment is claimed.

| Feature | Implemented | Security tested | UI tested | Release ready |
|---|---|---|---|---|
| Secure uploads | PARTIAL | PARTIAL | BLOCKED | BLOCKED |
| Pilot analytics | PARTIAL | PARTIAL | BLOCKED | BLOCKED |
| Provider display names | PARTIAL | PARTIAL | PARTIAL | BLOCKED |
| Service editing | PARTIAL | PARTIAL | PARTIAL | BLOCKED |
| Malay interface | PARTIAL | PARTIAL | PARTIAL | BLOCKED |
| Arabic interface | PARTIAL | PARTIAL | PARTIAL | BLOCKED |

Evidence links: [CI run](https://github.com/tgpu-digital-ecosystem/TEMAN-Haramain-by-TGPU/actions/runs/43694993521), [screenshot artifact](https://github.com/tgpu-digital-ecosystem/TEMAN-Haramain-by-TGPU/actions/runs/43694993521/artifacts/14153743817). Local browser limitation below remains accurate; remote synthetic browser testing supersedes the earlier lack of screenshot evidence only.

# TEMAN Phase 2 — implementation checkpoint

This is a review branch based on PR #38 commit 305becf81b2725b58f84ecee45c65f7da7fe3968, itself based on main 44ebf15697598eae2e121733df84731d5cce21be. PR #35 and #36 were read, not merged. PR #38 remains an explicit dependency. This work is not a completed production release.

## Implemented code

- R2 Worker: validates Supabase session via Auth, then authorises business visibility through the caller's RLS. PDF/JPEG/PNG MIME, extension and magic-byte checks; bounded multipart body; random object paths; sanitised names; authenticated attachment downloads; private no-store responses; quarantine-only state. Provider deletion/replacement is allowed while pending/changes requested; founder can retrieve review evidence. No public object URL or frontend server key.
- SQL: server-only metadata writes, owner/reviewer reads, serialised maximum 10 files/50 MiB per business, 20 upload attempts/day, 1 GiB total TEMAN metadata-reserved storage. Explicit service-role metadata grants. These caps do not guarantee the shared Cloudflare account remains within free usage; account usage and request limits need release review.
- Separate RLS-protected public provider profiles; legal verification name remains unchanged/private. Display names reject markup/control characters and obvious verification claims. Public listing and enquiry history resolve display names, with a neutral reference fallback. Approved logo workflow and notification integration remain absent.
- Service create/draft/edit/review/unpublish/archive, expanded fields, persistence-result checks, unsaved edit warning, updated timestamp, immutable revisions. Published content edits return to draft/review; enquiries retain original references.
- Aggregate invoker RPC with explicit founder/provider scope, UTC start-inclusive/end-exclusive range (max 366 days), test/genuine separation, database-derived first provider response. Private, opt-in pilot roster and feedback with validated fields/rate limits. Aggregate CSV has only metric counts/times and filter boundaries.
- English/Malay/Arabic dictionaries on business, service and pilot pages, stable hashed keys, RTL/lang, local Noto Kufi Arabic, shared landing language preference, form-preserving language switching. Provider content is not automatically translated.

## Metric definitions

Applications: created in range, filtered by immutable application test flag. Pending includes pending review and changes requested. Approved/rejected/suspended are current states of those applications. Published services: currently published, created in range, with provider test flag matching filter. Enquiries: submitted in range and matching enquiry test flag; pending/responded/closed are current statuses. First response: mean seconds between enquiry creation and first provider-authored persisted reply, excluding unanswered enquiries. Feedback: founder-only count of submissions created in range and matching feedback test flag. Provider responses do not include founder messages. Reports are operational record counts, not traffic, conversions, revenue or commercial traction.

## Storage evaluation and configuration

Live read-only audit found existing R2 buckets tgpu-digital-private-files and tgpu-gulf-private-files. TEMAN production Worker had no bindings. Supabase Storage has other application buckets but no TEMAN verification bucket. R2 was selected to reuse existing private Digital infrastructure and avoid consuming shared Supabase file capacity. No bucket, secret, binding, route or paid service was created. Two attempts to add a branch exclusion using the legacy Builds trigger endpoint returned HTTP 400; no trigger change succeeded. A WORKERS_CI build guard instead prevents automatic Cloudflare upload from this branch until the release checks pass. R2 public access configuration and current account quota must be verified before enabling the binding.

wrangler.preview.jsonc is a disabled workers.dev review template, not an active deployment configuration. It needs an isolated test database, server-only SUPABASE_SERVICE_KEY, existing DOCUMENTS R2 binding and founder-only Cloudflare Access custom domain. Do not run it against production as a shortcut. Existing Family Link API routing must be reconciled; this template only adds document handling and static assets.

File quarantine is a manual-review policy, not antivirus scanning or a malware-free guarantee. Review on a maintained isolated workstation, never inline in the application. Providers can remove/replace pending evidence. Before pilot launch, implement and verify a founder retention/deletion and orphan reconciliation job, with explicit retention terms; proposed rejection/withdrawal retention is 90 days after closure subject to founder policy. No automatic retention purge is currently installed. Failed R2 deletion may leave an inaccessible orphan after metadata deletion; failed puts can leave a reservation if review concurrently locks the application. These must be reconciled before release.

## Verification boundaries and blockers

Local Vitest tests and PGlite/Postgres role tests are reproducible with npm test and npm run test:business-db. The SQL harness uses synthetic auth.uid and users; Worker HTTP tests mock Auth/PostgREST/R2. They do not prove real Supabase JWT, PostgREST grants, live R2 access, concurrency under deployment, or Cloudflare Access enforcement.

Local browser launch failed: Chromium socket() Operation not permitted. Vite wildcard listener also failed at uv_interface_addresses. Therefore no browser screenshots, mobile visual acceptance or browser end-to-end success is claimed. scripts/test-phase2-browser.cjs contains a synthetic-fixture browser harness for a compatible environment; it uses pinned Playwright and a GitHub CI browser job, not a deployed live test. Remote CI results must be checked separately.

Remaining scope: full existing Account/Owner/auth/safety/Family Link journey localisation and consent regression; raw server errors, composite status/history labels and dynamic labels need complete translation binding; per-service aggregate activity/count UI and unlimited catalogue pagination; approved logos/service images; notification templates; file lifecycle reconciliation/retention; actual isolated Supabase multi-user sessions; founder-only protected preview; production source parity and rollback re-verification. Existing service/inbox pages still show at most 100 records; aggregate reporting uses database queries without that UI cap.

All new migrations are unapplied remotely. No production merge, migration, release, DNS change or payment action was performed. Until these gates pass, each feature remains PARTIAL and release readiness BLOCKED.

## Release and rollback

1. Reconcile #35/#36/#38 overlaps. Apply all three migrations to an isolated compatible Supabase test environment; never use an unrelated application's database.
2. Provision server secrets only in the protected preview environment. Verify R2 bucket has no public access; test provider A/B, founder and anonymous direct endpoint requests.
3. Run regression/build/security tests, then browser/mobile/RTL and complete real-session provider-to-pilgrim workflow, including existing safety tools and Family Link consent.
4. Capture deployed preview commit/tree, Access rejection/allow evidence, screenshots, migration backup and current production Worker rollback version.
5. Obtain founder approval only after all release gates pass. Keep active production Worker/version and tables available for rollback. Prefer reverting application code and disabling new routes to destructive down migrations; retain existing enquiry/review records. Re-audit live deployment state immediately before release.
