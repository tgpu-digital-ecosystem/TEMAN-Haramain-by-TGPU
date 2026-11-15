// @vitest-environment node
import {describe,it,expect,vi,afterEach} from 'vitest';
import worker,{validateFile} from '../worker/documents.mjs';
const bid='00000000-0000-0000-0000-000000000001',did='00000000-0000-0000-0000-000000000002';
const env=()=>({SUPABASE_URL:'https://example.invalid',SUPABASE_PUBLISHABLE_KEY:'public',SUPABASE_SERVICE_KEY:'server-only',DOCUMENTS:{get:vi.fn(async()=>({body:'private'})),put:vi.fn(),delete:vi.fn()},ASSETS:{fetch:vi.fn()}});
const req=(id='',method='GET')=>new Request('https://preview.invalid/api/documents'+id+'?business='+bid,{method,headers:{Authorization:'Bearer synthetic'}});
afterEach(()=>vi.unstubAllGlobals());
function auth(owner='provider',visible=true,status='pending_review'){
 vi.stubGlobal('fetch',vi.fn(async(url:string)=>Response.json(url.includes('/auth/')?{id:owner,email_confirmed_at:'today'}:url.includes('teman_businesses')?(visible?[{id:bid,owner_id:'provider',status}]:[]):url.includes('teman_verification_documents')?[{id:did,object_key:'private',filename:'evidence.pdf',mime:'application/pdf'}]:[])));
}
describe('Private verification documents',()=>{
 it('validates signature, extension and MIME together',()=>{const pdf=new TextEncoder().encode('%PDF-1.7');expect(validateFile(pdf,'application/pdf','test.pdf').ext).toBe('pdf');expect(()=>validateFile(pdf,'image/png','test.png')).toThrow('file_type');expect(()=>validateFile(new Uint8Array([1,2,3]),'application/pdf','test.pdf')).toThrow('file_type');expect(()=>validateFile(new Uint8Array(5242881),'application/pdf','test.pdf')).toThrow('file_size');});
 it('denies unauthenticated access before reading storage',async()=>{const e=env();const r=await worker.fetch(new Request('https://preview.invalid/api/documents?business='+bid),e);expect(r.status).toBe(401);expect(e.DOCUMENTS.get).not.toHaveBeenCalled();});
 it('denies a different provider under RLS',async()=>{auth('other',false);const e=env();expect((await worker.fetch(req('/'+did),e)).status).toBe(403);expect(e.DOCUMENTS.get).not.toHaveBeenCalled();});
 it.each(['provider','founder'])('allows an authorised %s download without public caching',async(role)=>{auth(role);const e=env();const r=await worker.fetch(req('/'+did),e);expect(r.status).toBe(200);expect(r.headers.get('Content-Disposition')).toContain('attachment');expect(r.headers.get('Cache-Control')).toBe('private, no-store');expect(await r.text()).toBe('private');});
 it('locks edits after founder approval',async()=>{auth('provider',true,'approved');const e=env();expect((await worker.fetch(req('/'+did,'DELETE'),e)).status).toBe(403);expect(e.DOCUMENTS.delete).not.toHaveBeenCalled();});
 it('fails closed without configured storage',async()=>{expect((await worker.fetch(req(),{})).status).toBe(503);});
});

describe('Server-side upload persistence',()=>{
 it('accepts a valid quarantined upload with random storage key',async()=>{
  auth();const e=env();const form=new FormData();form.append('kind','registration');form.append('file',new File(['%PDF-1.7\nSynthetic only'],'synthetic.pdf',{type:'application/pdf'}));
  const r=await worker.fetch(new Request('https://preview.invalid/api/documents?business='+bid,{method:'POST',headers:{Authorization:'Bearer synthetic'},body:form}),e);
  expect(r.status).toBe(201);expect((await r.json()).state).toBe('quarantined');expect(e.DOCUMENTS.put).toHaveBeenCalledOnce();expect(e.DOCUMENTS.put.mock.calls[0][0]).toMatch(/^teman\/verification\/[\w-]+\/[\w-]+\.pdf$/);
 });
 it('rejects a spoofed file before writing metadata or R2',async()=>{
  auth();const e=env();const form=new FormData();form.append('kind','licence');form.append('file',new File(['<script>bad</script>'],'licence.pdf',{type:'application/pdf'}));
  const r=await worker.fetch(new Request('https://preview.invalid/api/documents?business='+bid,{method:'POST',headers:{Authorization:'Bearer synthetic'},body:form}),e);expect(r.status).toBe(400);expect(e.DOCUMENTS.put).not.toHaveBeenCalled();
 });
});
