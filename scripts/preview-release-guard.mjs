// Fail closed before an automatic Workers build can upload an unprotected preview.
// Deliberate release gate: remove only after the documented preview checks pass.
if(process.env.WORKERS_CI){
 throw new Error('TEMAN Phase 2: automatic Cloudflare release is blocked. Configure and verify founder-only preview access, isolated database, R2 and regression gates before removing this guard.');
}
