# TEMAN Haramain by TGPU

Safety-first Hajj & Umrah companion focused on elderly pilgrims, family-assisted preparation, crisis support, offline safety information, and Bahasa Melayu / Arabic / English communication.

Planned production domain: https://teman.tgpu.my

This repository is being separated from the SATU project so TEMAN and SATU can be developed and deployed independently.

## Current safety release

Includes travel-readiness checks, emergency officer mode, offline notes and currency tools, GPS location sharing, senior large-text mode, expanded offline Arabic phrases, private family backup/restore, and official Saudi emergency quick-call shortcuts.

## Family API deployment

Cloudflare Worker `tgpu-teman` serves the static application and proxies the allowlisted `/api/family/*` routes to the retained family API. Configure the existing API origin as a Worker secret before deployment:

```sh
wrangler secret put FAMILY_API_ORIGIN
```

The value must be the HTTPS origin of the existing Azure Functions service, without an `/api` suffix. The Worker fails closed with a non-cacheable `503` until this secret is configured; no family records or credentials are copied by the proxy.
