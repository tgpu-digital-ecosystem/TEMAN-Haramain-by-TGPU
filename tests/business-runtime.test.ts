import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync('public/business.html','utf8');
const script=readFileSync('public/business.js','utf8');
async function page(session:boolean,respond:(url:string)=>unknown){
 const dom=new JSDOM(html,{url:'https://teman.example/business.html',runScripts:'outside-only'});
 if(session)dom.window.sessionStorage.setItem('tgpu_digital_access_token','synthetic');
 dom.window.fetch=vi.fn(async(url:any)=>{const data=respond(String(url));return {ok:true,status:200,json:async()=>data};}) as any;
 dom.window.eval(script);await new Promise(r=>setTimeout(r,30));return dom;
}
describe('Business session gating',()=>{
 it('makes no data request without session',async()=>{const d=await page(false,()=>[]);expect(d.window.fetch).not.toHaveBeenCalled();expect(d.window.document.getElementById('workspace')?.hidden).toBe(true);d.window.close();});
 it('requires verified email',async()=>{const d=await page(true,()=>({id:'user'}));expect(d.window.document.getElementById('status')?.textContent).toMatch(/Verify your email/);expect(d.window.document.getElementById('workspace')?.hidden).toBe(true);d.window.close();});
 it('shows empty application and denies founder UI to non-admin',async()=>{const d=await page(true,url=>url.includes('/auth/')?{id:'user',email_confirmed_at:'2026-11-15'}:[]);expect(d.window.document.getElementById('workspace')?.hidden).toBe(false);expect(d.window.document.getElementById('review')?.hidden).toBe(true);d.window.close();});
 it('renders untrusted licence evidence as plain text',async()=>{const d=await page(true,url=>url.includes('/auth/')?{id:'founder',email_confirmed_at:'today'}:url.includes('teman_admins')?[{user_id:'founder'}]:url.includes('owner_id=')?[]:[{id:'test',company_name:'<img src=x onerror=alert(1)>',verification_notes:'<script>alert(1)</script>',status:'pending_review'}]);expect(d.window.document.querySelector('#queue img')).toBe(null);expect(d.window.document.querySelector('#queue h3')?.textContent).toContain('<img');d.window.close();});
});
