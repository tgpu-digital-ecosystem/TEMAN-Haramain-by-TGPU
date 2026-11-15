// R2 binding and server-only Supabase key are required. Never served as a public asset.
const MAX=5*1024*1024;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateFile(bytes,mime,name){
 const b=new Uint8Array(bytes); if(!b.length||b.length>MAX)throw Error('file_size');
 const pdf=b[0]===37&&b[1]===80&&b[2]===68&&b[3]===70&&b[4]===45;
 const jpg=b[0]===255&&b[1]===216&&b[2]===255;
 const png=[137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x);
 const ext=pdf?'pdf':jpg?'jpg':png?'png':null;
 if(!ext||mime!==({pdf:'application/pdf',jpg:'image/jpeg',png:'image/png'})[ext]||!new RegExp('\\.'+(ext==='jpg'?'jpe?g':ext)+'$','i').test(name))throw Error('file_type');
 return {mime,filename:name.replace(/[^\p{L}\p{N}._ -]/gu,'_').slice(-120),ext,size:b.length};
}
function json(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/documents'))return env.ASSETS.fetch(request);
 if(!env.DOCUMENTS||!env.SUPABASE_SERVICE_KEY||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return json({error:'storage_unavailable'},503);
 const authorization=request.headers.get('Authorization');if(!authorization?.startsWith('Bearer '))return json({error:'sign_in'},401);
 const db=async(path,method='GET',body,server=false)=>{
 const r=await fetch(env.SUPABASE_URL+path,{method,headers:{apikey:server?env.SUPABASE_SERVICE_KEY:env.SUPABASE_PUBLISHABLE_KEY,Authorization:server?'Bearer '+env.SUPABASE_SERVICE_KEY:authorization,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
 if(!r.ok)throw Error('access_denied');return r.status===204?null:r.json();};
 try{
 const user=await db('/auth/v1/user');if(!user.email_confirmed_at)return json({error:'verify_email'},403);
 const bid=url.searchParams.get('business');if(!UUID.test(bid||''))return json({error:'invalid_business'},400);
 const businesses=await db('/rest/v1/teman_businesses?select=id,owner_id,status&id=eq.'+bid);const business=businesses[0];if(!business)return json({error:'access_denied'},403);
 const id=url.pathname.split('/')[3];if(id&&!UUID.test(id))return json({error:'invalid_document'},400);
 const owner=business.owner_id===user.id,editable=owner&&['pending_review','changes_requested'].includes(business.status);
 if(request.method==='GET'&&!id)return json(await db('/rest/v1/teman_verification_documents?select=id,filename,mime,size,kind,state,created_at&business_id=eq.'+bid));
 if(request.method==='POST'&&!id){
 if(!editable)return json({error:'review_locked'},403);
 const length=Number(request.headers.get('Content-Length'));if(length>MAX+16384)return json({error:'file_size'},413);
 // Read a bounded stream before parsing multipart; never buffer an unbounded request.
 const reader=request.body?.getReader();if(!reader)return json({error:'file_required'},400);const chunks=[];let total=0;
 while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>MAX+16384){await reader.cancel();return json({error:'file_size'},413);}chunks.push(value);}
 const bounded=new Uint8Array(total);let offset=0;for(const c of chunks){bounded.set(c,offset);offset+=c.length;}
 const form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('Content-Type')||''},body:bounded}).formData();
 const file=form.get('file'),kind=form.get('kind');if(!(file instanceof File)||!['registration','licence','supporting'].includes(kind))return json({error:'invalid_document'},400);
 const bytes=await file.arrayBuffer(),meta=validateFile(bytes,file.type,file.name),doc=crypto.randomUUID(),object='teman/verification/'+bid+'/'+doc+'.'+meta.ext;
 await db('/rest/v1/teman_verification_documents','POST',{id:doc,business_id:bid,object_key:object,filename:meta.filename,mime:meta.mime,size:meta.size,kind,state:'quarantined'},true);
 try{await env.DOCUMENTS.put(object,bytes,{httpMetadata:{contentType:meta.mime}});}catch(e){await db('/rest/v1/teman_verification_documents?id=eq.'+doc,'DELETE',null,true);throw e;}
 return json({id:doc,state:'quarantined'},201);
 }
 const docs=id?await db('/rest/v1/teman_verification_documents?select=*&id=eq.'+id+'&business_id=eq.'+bid):[];const doc=docs[0];if(!doc)return json({error:'not_found'},404);
 if(request.method==='GET'){
 const object=await env.DOCUMENTS.get(doc.object_key);if(!object)return json({error:'not_found'},404);
 return new Response(object.body,{headers:{'Content-Type':doc.mime,'Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(doc.filename),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}});
 }
 if(request.method==='DELETE'){
 if(!editable)return json({error:'review_locked'},403);
 await db('/rest/v1/teman_verification_documents?id=eq.'+id,'DELETE',null,true);await env.DOCUMENTS.delete(doc.object_key);return json({deleted:true});
 }
 return json({error:'method_not_allowed'},405);
 }catch(e){return json({error:['file_size','file_type'].includes(e.message)?e.message:'request_failed'},400);}
}};
