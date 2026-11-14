# TEMAN Haramain — Hosting and release source of truth (15 November 2026)

## Founder-approved target stack
- **GitHub**: application source, pull requests, checks, audit history.
- **Supabase (TGPU Digital project `mpidjwjghtpeybedmbkd`)**: identity, access control, private records and server-side authorization.
- **Cloudflare**: DNS, hosting, deployment and protected previews, subject to confirming the existing live hostname routing and Cloudflare project.

**Azure is legacy deployment configuration, not the current target.** The checked-in `.github/workflows/azure-static-web-apps.yml` still deploys on `main`. This must be retired or replaced only after confirming Cloudflare's live origin, Worker/Pages project, deployment ownership, required assets and a rollback path. Do not trigger Azure releases for TEMAN improvements.

## Verified implementation state
- Existing private draft PR #35 contains account Owner HQ role-gated navigation and a founder workspace **preview**, alongside unfinished community/marketplace foundations.
- Supabase `teman_admins` has an owner record for the verified TGPU Digital founder account; RLS self-read is enabled.
- GitHub Actions run `43627714892` passed tests and build, but the old Azure deploy job was skipped.
- No Cloudflare deployment, Cloudflare preview, or production browser acceptance was verified by this document.
- Do not merge PR #35 as a single production release; isolate tested features and secure any new Supabase tables with RLS before use.

## Next safe execution sequence
1. Inspect Cloudflare account, `teman.tgpu.my` DNS and any existing Worker/Pages deployment, including current deployed source/version.
2. Identify Cloudflare's current source integration, build command, output directory, routes, secrets and preview mechanism. Preserve the working live app, emergency features, offline maps, Family Link, Arabic and mobile functionality.
3. Establish a restricted founder preview on Cloudflare; never expose unreviewed private groups, marketplace, booking, payment or owner operations.
4. Verify owner/non-owner authorization using real sessions, accessible phone and RTL QA, unit/build tests and Cloudflare response/asset checks.
5. Only after preview acceptance, release narrowly scoped changes with rollback evidence; update Notion HQ and the existing Drive technical handover.

**No public release or payment activation is authorized by this document.**

## Cloudflare control-plane inspection — 15 November 2026
- Verified Worker `tgpu-teman`, deployed version 28 (`6355c047-9f2a-4ffc-9f83-adc95d0a67eb`) at 100%, last deployed 12 Nov 2026.
- Worker version runtime declares static assets with `not_found_handling: single-page-application`, `serve_directly: true`, and `base_path: /`. Runtime compatibility date `2026-11-10`.
- Worker settings returned **no bindings**. Do not infer the Supabase account frontend is functional from this alone; check browser/network and published static assets.
- The Cloudflare Worker script content v2 endpoint returned an empty body for this asset-based deployment; **deployed static asset bytes were not recovered**. Do not overwrite it with GitHub `main` or PR #35 without source parity and a rollback plan.
- Repository branch uses Vite (`npm run build`: `tsc -b && vite build`, default `dist` output). No checked-in `wrangler.toml` or `wrangler.jsonc` was found at repository root. The existing Cloudflare Worker was deployed using Wrangler, but its original deployment project/configuration remains unverified.
- DNS `teman.tgpu.my` is proxied AAAA `100::`; no TEMAN Pages project found in the connected Cloudflare account.
- **Next technical blocker**: establish deployed asset/source provenance and safe preview pipeline before any upload or route changes. This is distinct from the obsolete Azure staging quota issue.
