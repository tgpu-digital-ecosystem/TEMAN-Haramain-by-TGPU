import {readFileSync} from 'node:fs';
import {describe,it,expect,vi} from 'vitest';
import {JSDOM} from 'jsdom';
const dict=JSON.parse(readFileSync('public/business-translations.json','utf8'));
describe('Business localisation',()=>{
 it('covers every declared key in English, Malay and Arabic',()=>{expect(Object.keys(dict.ms).sort()).toEqual(Object.keys(dict.en).sort());expect(Object.keys(dict.ar).sort()).toEqual(Object.keys(dict.en).sort());for(const lang of ['en','ms','ar'])for(const value of Object.values(dict[lang]))expect(String(value).trim().length).toBeGreaterThan(0);for(const page of ['business','services','pilot'])for(const [,key] of readFileSync('public/'+page+'.html','utf8').matchAll(/data-i18n="([^"]+)"/g))expect(dict.en[key]).toBeTruthy();});
 it('switches RTL without replacing form data or provider content',async()=>{const dom=new JSDOM(readFileSync('public/services.html','utf8'),{url:'https://preview.invalid',runScripts:'outside-only'});dom.window.fetch=vi.fn(async()=>({ok:true,json:async()=>dict})) as any;dom.window.eval(readFileSync('public/business-i18n.js','utf8'));await (dom.window as any).TemanUI.ready;const input=dom.window.document.querySelector('[name=title]') as HTMLInputElement;input.value='My unsubmitted title';const content=dom.window.document.createElement('p');content.textContent='Provider submitted English';dom.window.document.body.append(content);await (dom.window as any).TemanUI.setLanguage('ar');expect(dom.window.document.documentElement.dir).toBe('rtl');expect(input.value).toBe('My unsubmitted title');expect(content.textContent).toBe('Provider submitted English');expect((dom.window as any).TemanUI.missing.size).toBe(0);dom.window.close();});
});

it('preserves dynamic enquiry textarea when changing language',async()=>{
 const dom=new JSDOM(readFileSync('public/services.html','utf8'),{url:'https://preview.invalid',runScripts:'outside-only'});dom.window.sessionStorage.setItem('tgpu_digital_access_token','synthetic');
 dom.window.fetch=vi.fn(async(url:any)=>({ok:true,json:async()=>String(url).includes('translations')?dict:String(url).includes('/auth/')?{id:'pilgrim',email_confirmed_at:'today'}:String(url).includes('teman_services?')?[{id:'service',business_id:'provider',title:'Synthetic service',category:'transport',service_area:'Makkah',status:'published'}]:[]})) as any;
 dom.window.eval(readFileSync('public/business-i18n.js','utf8'));dom.window.eval(readFileSync('public/services.js','utf8'));await new Promise(r=>setTimeout(r,30));
 const field=dom.window.document.querySelector('#services textarea') as HTMLTextAreaElement;expect(field).toBeTruthy();field.value='Unsubmitted enquiry';await (dom.window as any).TemanUI.setLanguage('ar');expect(field.isConnected).toBe(true);expect(field.value).toBe('Unsubmitted enquiry');dom.window.close();
});
