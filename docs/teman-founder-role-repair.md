# Founder role and dashboard repair

## Production audit

The Digital Supabase project is `mpidjwjghtpeybedmbkd`. A read-only audit found exactly one `teman_admins` row, linked to the founder's confirmed Auth user `6b3d75b8-924e-46e8-8e2d-972f0818f353`; it predates this repair. No membership row exists, so Basic (Free) is correct. No email match grants authority in the application. The registry is the existing TEMAN founder authority, not an organisation-wide or cross-app role.

All four hosted TEMAN tables have RLS enabled. Administrator records allow authenticated self-read only; client INSERT/UPDATE/DELETE are denied. The primary key prevents duplicate assignment. No app-facing ownership transfer or self-removal exists. Database owners/service-role credentials can still alter the registry or delete the Auth user through its cascading FK; this app cannot prevent privileged infrastructure owners from doing so. No new universal bypass or account elevation is introduced.

Missing display root cause: account UI rendered membership but no administrative-role field. The prior live account overlay deliberately set `ownerWorkspaceAvailable:false`, hiding the navigation. Neither issue means founder permissions were removed.

## Repairs

The shared account access helper obtains the actual confirmed user from Auth and reads that user's RLS-protected registry row with their bearer token. It requires an exact returned user ID, never browser roles or user_metadata. Account and Owner HQ fail closed on verification failure; session clearing invalidates pending role results. Membership and VIP are independent, and VIP cannot grant registry access. New account fields, verification retry, dashboard and release statuses support English/Malay/Arabic RTL.

The account-only Worker serves account, shared access helper and Owner HQ assets while forwarding other requests to the existing production asset binding. The dashboard explicitly labels operational modules as staged or restricted. It does not introduce provider approval, storage, billing, membership editing, permission editing or ownership transfer against the shared backend. Hosted provider/pilot/notification/document tables are absent; activating their unfinished UI would be misleading.

## Least-privilege migration

Audit found an authenticated TRUNCATE/REFERENCES/TRIGGER grant on `teman_memberships`. A conditional revoke-only migration is staged separately. It neither mutates membership records nor assigns roles. No production SQL mutation is part of the UI repair. RLS does not govern TRUNCATE; the disposable real-Postgres suite verifies the revoke. Full hosted schema/backup gates remain for the larger provider release.

## Verification and deployment boundary

Unit/runtime tests cover verified founder, ordinary/VIP denial, forged browser roles, mismatched registry rows, network failures, language dictionaries, Arabic RTL, and clearing authority. Real local Supabase integration exercises founder sign-in/refresh/logout, dashboard navigation, Basic versus VIP separation, founder removal/escalation denial, and revoked membership TRUNCATE. Screenshots use isolated synthetic identities, not founder credentials. Production acceptance requires the existing founder session; no password or token is requested in chat.

Rollback the static overlay to Cloudflare version `69160a73-7ee7-4ecb-a2ad-32975830d962`; it remains a retrievable immutable version. No database rollback is needed for this static account release. Keep draft PR #39 and larger migrations unmerged until their independent release gates pass. Exact CI/commit/deployment evidence is recorded in existing Notion and Drive records after verification, not presumed here.

## Protected functional authentication staging

The dedicated staging entry verifies signed Cloudflare Access and allows only the exact account/session/role/dashboard assets. It uses existing hosted Auth for founder sessions, disables signup/recovery/password changes and blocks business APIs. It carries no retained static-asset set, database secret or storage binding, so asset-first routing cannot serve an older account implementation. Both Cloudflare edge Access and the Worker require founder identity; actual TEMAN privileges still require the confirmed Supabase user and RLS registry. The existing read-only review alias is unchanged. Hosted founder acceptance is separate from passing disposable real-service tests.
