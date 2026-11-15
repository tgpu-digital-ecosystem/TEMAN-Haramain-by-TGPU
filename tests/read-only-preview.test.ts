// @vitest-environment node
import{describe,it,expect,vi}from'vitest';
vi.mock('../worker/preview-auth.mjs',()=>({authenticate:vi.fn(async(request:any)=>{if(request.headers.get('Cf-Access-Jwt-Assertion')!=='synthetic-allowed')throw Error('denied');})}));
vi.mock('../worker/review-assets.mjs',()=>({assets:{'/index.html':{type:'text/html',body:'<html><body><div id="root"></div></body></html>'},'/account.html':{type:'text/html',body:'<html><main>Account</main></html>'},'/assets/app.js':{type:'application/javascript',body:'/* synthetic asset */'}}}));
import worker from'../worker/read-only-preview.mjs';
const req=(path='/',method='GET',auth=true,host='review.security.example')=>new Request('https://'+host+path,{method,headers:auth?{'Cf-Access-Jwt-Assertion':'synthetic-allowed'}:{}});
const env={ACCESS_AUD:'synthetic-audience',SOURCE_COMMIT:'1'.repeat(40)};
describe('Isolated read-only TEMAN review',()=>{
 it('denies access before serving any page',async()=>expect((await worker.fetch(req('/','GET',false),env)).status).toBe(403));
 it('blocks production hostnames even for an authenticated founder',async()=>{for(const host of ['teman.tgpu.my','tgpu-teman.moesaffin.workers.dev'])expect((await worker.fetch(req('/','GET',true,host),env)).status).toBe(503);});
 it('serves a clear banner and forbids external backend connections',async()=>{const r=await worker.fetch(req(),env);expect(r.status).toBe(200);expect(await r.text()).toContain('Login, uploads, enquiries and backend writes are disabled');expect(r.headers.get('Content-Security-Policy')).toContain("connect-src 'self'");expect(r.headers.get('Cache-Control')).toBe('private, no-store');expect(r.headers.get('X-TEMAN-Source')).toBe(env.SOURCE_COMMIT);});
 it('denies all API calls without a database or storage request',async()=>{for(const path of ['/api/documents','/api/profile','/api/family'])expect((await worker.fetch(req(path),env)).status).toBe(503);});
 it('rejects write methods on all static pages',async()=>{for(const method of ['POST','PUT','DELETE'])expect((await worker.fetch(req('/account.html',method),env)).status).toBe(405);});
 it('serves actual static routes and refuses unknown paths',async()=>{expect((await worker.fetch(req('/account'),env)).status).toBe(200);expect((await worker.fetch(req('/unknown'),env)).status).toBe(404);expect(await (await worker.fetch(req('/assets/app.js'),env)).text()).toBe('/* synthetic asset */');});
 it('does not retain a service worker on the isolated review origin',async()=>{const r=await worker.fetch(req('/sw.js'),env);expect(await r.text()).toContain('self.registration.unregister()');});
});
