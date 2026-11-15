# Founder preview authentication repair — 15 November 2026

Continue draft PR #39 from 30c46f1e9076c02ab8c1a9dd64163f95cffdfba4. No schema migration or founder account/permission changes.

## Root cause and observed preflight

The preview was intentionally deployed with `Content-Security-Policy: connect-src 'self'` and only SOURCE_COMMIT/ACCESS_AUD bindings. Its active account form nevertheless POSTed directly to `https://mpidjwjghtpeybedmbkd.supabase.co/auth/v1/token?grant_type=password`. The browser must block that cross-origin fetch before Supabase receives it, producing `TypeError: Failed to fetch`. The misleading active form was a preview integration defect, not evidence of an incorrect password.

Read-only checks verified the configured Supabase URL; the public publishable key matches the connected project's inventory (value not recorded here). Hosted Auth settings returned HTTP 200 with the preview Origin allowed. OPTIONS on the password-token endpoint returned HTTP 200 with allowed-origin `*`. The verified founder/admin registry link count is one. No passwords, tokens, account details or permissions were changed. A raw DNS lookup in this workspace failed, while HTTPS requests through its configured network proxy succeeded; that is not evidence of a Supabase DNS outage. Cloudflare Access remains required before reaching this preview.

## Staged repair

- Keep CSP connect-src self. Add an explicit founder-auth-preview mode and a same-origin /api/preview bridge, enabled only by FOUNDER_AUTH_ENABLED=true and verified public Auth configuration.
- Every preview request still verifies Cloudflare Access signature/issuer/audience/expiry and exact founder email. The bridge then validates actual Supabase Auth, confirmed email matching the verified Access identity, and the existing database founder registry. Frontend labels/user_metadata cannot grant access.
- Only password sign-in, refresh, logout, own user, own founder-role and own membership reads are allowed. Caller-supplied user filters are ignored in favour of the authenticated ID. No service-role credential, arbitrary proxy, signup, email sending, recovery, password update, storage or business mutation route is exposed. Cross-origin requests and oversized bodies are rejected; upstream redirects/timeouts/errors fail safely.
- Browser account/session/owner code uses a Worker-served runtime configuration before loading session code. Operational pages/notification polling stop before attempting forbidden backend requests. Plain read-only mode now disables its misleading sign-in controls too.
- Network failures receive a useful retry message instead of raw Failed to fetch or a misleading wrong-password claim. Password fields clear after successful login. Logout obtains the latest rotated token before clearing local credentials.
- Recovery/signup controls are disabled in this founder-only preview; the callback scrubs its URL and clearly refuses to consume email proofs or change passwords there. Do not reset the real founder's password to test this repair.

The enabled founder sign-in preview uses the existing hosted Digital Auth identity. It is NOT an isolated provider/pilgrim environment, and must not be used for destructive or operational acceptance tests. Authentication creates/revokes only the user-requested sessions; no production app deployment, schema, account, password, role or business-data change is part of this repair.

## Verification boundary

All existing tests are preserved. Added unit/runtime tests cover transport configuration, bounded requests, origin restrictions, identity/role checks, forbidden operations, rotated-token logout and helpful network errors. The disposable Supabase CI suite adds real proxy login/refresh/logout and Chromium browser login/refresh/logout with self-only CSP, plus a browser reproduction of the original blocked direct request. It reuses the existing real local confirmation/recovery/expiry checks with synthetic identities only. The CI jobs are combined to reuse one npm install and Chromium installation on free infrastructure.

Local results at this checkpoint: 97 Vitest tests, 69 SQL checks, six synthetic engine restore checks and build/preview packaging pass. Final remote CI and deployment evidence is recorded on PR #39 and the existing Notion/Drive records after observation; this checkpoint does not assert unobserved success.

Real hosted founder authentication requires interactive Cloudflare Access sign-in followed by the founder's existing Supabase credentials. No credential is requested in chat or reset. Until that real session is observed, classify the end-to-end hosted founder outcome PARTIAL. Real email delivery and live confirmation/recovery remain separate unverified gates; the local actual Supabase service tests do not certify Zoho or production mail flow.

## Deployment and rollback

Deploy only to the existing named protected preview. Bind AUTH_SUPABASE_URL, AUTH_SUPABASE_PUBLIC_KEY (publishable/anon only), FOUNDER_AUTH_ENABLED, ACCESS_AUD and SOURCE_COMMIT. Never attach a service-role key or data/storage binding. Verify immutable deployment source, binding names, Access gate and unchanged production version 6355c047-9f2a-4ffc-9f83-adc95d0a67eb.

Rollback only the named preview to deployment f1d249e6-0000-4ab7-877b-8a6eacc13a77 or set FOUNDER_AUTH_ENABLED=false. Retain Access protection. No database rollback is required. Never deploy this bundle to the production Worker.


## Separate authentication staging — follow-up

Founder-supplied screenshot confirms successful production login at /account with mamduh@tgpu.my. Preserve the read-only review deployment with connect-src self and disabled sign-in. A separate explicitly opted-in STAGING_DIRECT_AUTH deployment uses exactly the existing production Supabase Auth origin directly, with CSP restricted to /auth/v1/ and the two existing own-role/membership read endpoints. All other database/storage endpoints remain blocked. Existing Cloudflare Access preview-worker policy protects both URLs, founder email only. No new Supabase project, credentials, role assignment or production deployment.

The previous same-origin bridge remains opt-in only and will be disabled in both these deployments. Direct staging uses its own browser-origin session; production sessions are not copied. Account creation/recovery/password changes and business workflows remain disabled in its interface. Real hosted founder sign-in still requires interactive acceptance, not an assumption from synthetic tests. Existing local real Supabase confirmation/recovery and browser session tests remain required. The operational staging is for founder authentication acceptance, not a certified full provider/pilgrim backend.
