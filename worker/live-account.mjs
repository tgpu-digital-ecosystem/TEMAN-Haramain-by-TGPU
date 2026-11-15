import {accountAssets} from './live-account-assets.mjs';
const auth='https://mpidjwjghtpeybedmbkd.supabase.co';
const csp="default-src 'self'; connect-src 'self' "+auth+"/auth/v1/ "+auth+"/functions/v1/teman-account-email "+auth+"/rest/v1/teman_admins "+auth+"/rest/v1/teman_memberships; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
const aliases={'/account':'/account.html','/account/':'/account.html','/auth-confirm':'/auth-confirm.html','/auth-confirm/':'/auth-confirm.html','/owner':'/owner.html','/owner/':'/owner.html'};
export default {async fetch(request,env){
 const path=aliases[new URL(request.url).pathname]||new URL(request.url).pathname;
 if(!Object.hasOwn(accountAssets,path)&&path!=='/auth-config.js')return env.ASSETS.fetch(request);
 const headers={'Cache-Control':'private, no-store','Content-Security-Policy':csp,'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers});
 let entry=path==='/auth-config.js'?{type:'application/javascript',body:'window.TemanAuthConfig={mode:"standard",ownerWorkspaceAvailable:true};'}:accountAssets[path];
 let body=entry.body;
 if(path==='/account.html')body=body.replace(/<p><a href="\/business\.html">[\s\S]*?<\/p>/,'');
 return new Response(request.method==='HEAD'?null:body,{headers:{...headers,'Content-Type':entry.type}});
}};
