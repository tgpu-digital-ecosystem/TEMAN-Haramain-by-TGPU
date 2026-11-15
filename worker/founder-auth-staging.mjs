import account from './live-account.mjs';
import {authenticate} from './preview-auth.mjs';
const auth='https://mpidjwjghtpeybedmbkd.supabase.co';
const safeHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; connect-src 'self' "+auth+"/auth/v1/ "+auth+"/rest/v1/teman_admins "+auth+"/rest/v1/teman_memberships; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; form-action 'self'"};
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(['teman.tgpu.my','tgpu-teman.moesaffin.workers.dev'].includes(url.hostname))return new Response('Authentication staging cannot run on production',{status:503,headers:safeHeaders});
 try{await authenticate(request,env);}catch{return new Response('Founder Access required',{status:403,headers:safeHeaders});}
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:safeHeaders});
 if(url.pathname==='/')return new Response(null,{status:302,headers:{...safeHeaders,Location:'/account'}});
 if(url.pathname==='/auth-config.js')return new Response('window.TemanAuthConfig={mode:"founder-auth-preview",base:'+JSON.stringify(auth)+',ownerWorkspaceAvailable:true};',{headers:{...safeHeaders,'Content-Type':'application/javascript'}});
 const allowed=['/account','/account/','/account.html','/account.js','/account-access.js','/auth-session.js','/owner','/owner/','/owner.html','/owner.js'];
 if(!allowed.includes(url.pathname))return new Response('Authentication staging only. Business workflows and account changes are unavailable.',{status:404,headers:safeHeaders});
 const response=await account.fetch(request,env);const headers=new Headers(response.headers);for(const [k,v] of Object.entries(safeHeaders))headers.set(k,v);headers.set('X-TEMAN-Source',env.SOURCE_COMMIT||'candidate');headers.set('X-TEMAN-Preview','founder-auth-staging');return new Response(response.body,{status:response.status,headers});
}};
