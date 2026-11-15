// @vitest-environment node
import{it,expect,vi}from'vitest';
vi.mock('../worker/preview-auth.mjs',()=>({authenticate:vi.fn(async(r:any)=>{if(r.headers.get('Cf-Access-Jwt-Assertion')!=='synthetic-allowed')throw Error('denied');})}));
vi.mock('../worker/live-account.mjs',()=>({default:{fetch:vi.fn(async()=>new Response('verified account build'))}}));
import staging from'../worker/founder-auth-staging.mjs';
const request=(path='/account',auth=true,method='GET',host='staging.example')=>new Request('https://'+host+path,{method,headers:auth?{'Cf-Access-Jwt-Assertion':'synthetic-allowed'}:{}});
it('requires verified Access before exposing the staging account',async()=>expect((await staging.fetch(request('/account',false),{})).status).toBe(403));
it('never runs on production hostnames',async()=>expect((await staging.fetch(request('/account',true,'GET','teman.tgpu.my'),{})).status).toBe(503));
it('enables actual direct Auth while disabling account mutations and allowing dashboard navigation',async()=>{const r=await staging.fetch(request('/auth-config.js'),{});const body=await r.text();expect(body).toContain('founder-auth-preview');expect(body).toContain('ownerWorkspaceAvailable:true');expect(r.headers.get('Content-Security-Policy')).not.toContain('/functions/');});
it('serves only the tested account/dashboard assets and source identifier',async()=>{const r=await staging.fetch(request('/owner'),{SOURCE_COMMIT:'synthetic'});expect(await r.text()).toBe('verified account build');expect(r.headers.get('X-TEMAN-Source')).toBe('synthetic');for(const path of ['/business.html','/api/documents','/auth-confirm'])expect((await staging.fetch(request(path),{})).status).toBe(404);});
it('denies static writes and redirects root to account without retained static assets',async()=>{expect((await staging.fetch(request('/account',true,'POST'),{})).status).toBe(405);expect((await staging.fetch(request('/'),{})).headers.get('Location')).toBe('/account');});
