import{it,expect,vi}from'vitest';import{readFileSync}from'node:fs';import{JSDOM}from'jsdom';
const wait=()=>new Promise(r=>setTimeout(r,15));
it('searches and paginates server-filtered service titles in bounded requests',async()=>{
 const d=new JSDOM(readFileSync('public/services.html','utf8'),{url:'https://preview.invalid',runScripts:'outside-only'});d.window.sessionStorage.setItem('tgpu_digital_access_token','synthetic');
 d.window.fetch=vi.fn(async(url:any)=>({ok:true,status:200,json:async()=>String(url).includes('/auth/')?{id:'pilgrim',email_confirmed_at:'today'}:String(url).includes('teman_services?')?Array.from({length:51},(_,i)=>({id:'synthetic-'+i,title:'Synthetic service',business_id:'synthetic',category:'transport',status:'published'})):[]})) as any;
 d.window.eval(readFileSync('public/services.js','utf8'));await wait();expect(d.window.document.querySelectorAll('#services article').length).toBe(50);
 d.window.document.getElementById('services-next')!.click();await wait();expect((d.window.fetch as any).mock.calls.some((c:any)=>c[0].includes('limit=51&offset=50'))).toBe(true);
 const f=d.window.document.getElementById('service-search') as HTMLFormElement;(f.elements.namedItem('query') as HTMLInputElement).value='Transport &id=eq.forged';(f.elements.namedItem('category') as HTMLSelectElement).value='transport';f.dispatchEvent(new d.window.Event('submit',{cancelable:true}));await wait();
 const query=(d.window.fetch as any).mock.calls.map((c:any)=>c[0]).filter((u:string)=>u.includes('teman_services?')).at(-1);expect(query).toContain('offset=0');expect(new URL(query).searchParams.get('title')).toBe('ilike.*Transport &id=eq.forged*');expect(new URL(query).searchParams.has('id')).toBe(false);expect(new URL(query).searchParams.get('category')).toBe('eq.transport');d.window.close();
});
