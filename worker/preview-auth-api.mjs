// Narrow founder-session bridge. No service-role credential or business mutation route.
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
async function boundedJSON(request){
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw{status:415,code:'json_required'};
 const reader=request.body?.getReader();if(!reader)throw{status:400,code:'invalid_request'};let size=0;const chunks=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>4096){await reader.cancel();throw{status:413,code:'request_too_large'};}chunks.push(value);}
 const bytes=new Uint8Array(size);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw{status:400,code:'invalid_request'};}
}
function config(env){
 const base=env.AUTH_SUPABASE_URL,key=env.AUTH_SUPABASE_PUBLIC_KEY;
 const u=new URL(base);if(u.pathname!=='/'||u.search||u.hash||u.username||u.password||!(u.origin==='https://mpidjwjghtpeybedmbkd.supabase.co'||(u.hostname==='127.0.0.1'&&u.protocol==='http:')))throw Error('config');
 if(!key?.startsWith('sb_publishable_')){try{if(JSON.parse(atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/'))).role!=='anon')throw Error();}catch{throw Error('config');}}
 return{base:u.origin,key};
}
export async function handlePreviewAuth(request,env,identity){
 if(env.FOUNDER_AUTH_ENABLED!=='true')return json({error:'preview_auth_disabled'},503);
 const url=new URL(request.url),path=url.pathname.slice('/api/preview'.length),origin=request.headers.get('Origin');
 if(origin&&origin!==url.origin)return json({error:'same_origin_required'},403);
 if(request.method==='POST'&&origin!==url.origin)return json({error:'same_origin_required'},403);
 const grant=url.searchParams.get('grant_type');
 const login=path==='/auth/v1/token'&&request.method==='POST'&&['password','refresh_token'].includes(grant);
 const logout=path==='/auth/v1/logout'&&request.method==='POST';
 const read=request.method==='GET'&&['/auth/v1/user','/rest/v1/teman_admins','/rest/v1/teman_memberships'].includes(path);
 if(!login&&!logout&&!read)return json({error:'preview_operation_disabled',message:'This preview permits founder sign-in, refresh, logout and own role/membership reads only.'},403);
 let options;try{options=config(env);}catch{return json({error:'preview_auth_not_configured'},503);}
 const upstream=async(path,method='GET',body,token)=>{
  let response;try{response=await fetch(options.base+path,{method,redirect:'error',signal:AbortSignal.timeout(10000),headers:{apikey:options.key,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});}catch{throw{status:503,code:'auth_network_unavailable'};}
  const data=await response.json().catch(()=>null);
  if(!response.ok)throw{status:response.status===429?429:response.status>=500?503:401,code:response.status===429?'auth_rate_limited':response.status>=500?'auth_unavailable':'auth_rejected'};
  return data;
 };
 const principal=async(token,requireOwner=true)=>{
  const user=await upstream('/auth/v1/user','GET',null,token);
  if(!user?.email_confirmed_at||!user.id||user.email?.toLowerCase()!==identity?.email?.toLowerCase())throw{status:403,code:'founder_identity_required'};
  const roles=await upstream('/rest/v1/teman_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1','GET',null,token);
  if(requireOwner&&(!Array.isArray(roles)||roles.length!==1||roles[0].user_id!==user.id))throw{status:403,code:'founder_role_required'};
  return{user,roles};
 };
 try{
  if(login){const body=await boundedJSON(request);
   const payload=grant==='password'?{email:body.email,password:body.password}:{refresh_token:body.refresh_token};
   if(grant==='password'&&(typeof body.email!=='string'||body.email.trim().toLowerCase()!==identity?.email?.toLowerCase()||typeof body.password!=='string'||!body.password||body.password.length>256))return json({error:'founder_identity_required'},403);
   if(grant==='refresh_token'&&(typeof body.refresh_token!=='string'||!body.refresh_token||body.refresh_token.length>2048))return json({error:'invalid_refresh'},400);
   if(payload.email)payload.email=payload.email.trim();
   const session=await upstream('/auth/v1/token?grant_type='+grant,'POST',payload);if(!session?.access_token)throw{status:503,code:'invalid_auth_response'};
   await principal(session.access_token);return json(session);
  }
  const authorization=request.headers.get('Authorization');if(!authorization?.startsWith('Bearer ')||authorization.length>8192)return json({error:'sign_in_required'},401);
  const token=authorization.slice(7),{user,roles}=await principal(token,!logout);
  if(logout){await upstream('/auth/v1/logout','POST',{},token);return json({signed_out:true});}
  if(path==='/auth/v1/user')return json({id:user.id,email:user.email,email_confirmed_at:user.email_confirmed_at});
  if(path==='/rest/v1/teman_admins')return json(roles);
  return json(await upstream('/rest/v1/teman_memberships?select=tier,status,vip_expires_at&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1','GET',null,token));
 }catch(e){return json({error:e.code||'auth_unavailable'},e.status||503);}
}
