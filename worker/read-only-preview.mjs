import {authenticate} from './preview-auth.mjs';
import {assets} from './review-assets.mjs';
import {handlePreviewAuth} from './preview-auth-api.mjs';
const csp="default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'none'";
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':csp,'X-TEMAN-Preview':'read-only'};
export default {async fetch(request,env){
 let identity;try{identity=await authenticate(request,env);}catch{return new Response('Founder Access required',{status:403,headers});}
 const url=new URL(request.url);
 // A review build must never function as production, even if selected accidentally.
 if(['teman.tgpu.my','tgpu-teman.moesaffin.workers.dev'].includes(url.hostname))return new Response('Preview build unavailable on production',{status:503,headers});
 if(url.pathname.startsWith('/api/preview/'))return handlePreviewAuth(request,env,identity);
 if(url.pathname==='/auth-config.js')return new Response('window.TemanAuthConfig='+JSON.stringify({mode:env.FOUNDER_AUTH_ENABLED==='true'?'founder-auth-preview':'read-only',base:'/api/preview'})+';',{headers:{...headers,'Content-Type':'application/javascript'}});
 if(url.pathname.startsWith('/api/'))return Response.json({error:'read_only_preview',message:'No production or isolated backend is connected.'},{status:503,headers});
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only preview',{status:405,headers});
 if(url.pathname==='/sw.js')return new Response("self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.registration.unregister()));",{headers:{...headers,'Content-Type':'application/javascript'}});
 let path=url.pathname==='/'?'/index.html':url.pathname;
 if(!Object.hasOwn(assets,path)&&Object.hasOwn(assets,path+'.html'))path+='.html';
 if(!Object.hasOwn(assets,path))return new Response('Not found',{status:404,headers});
 const asset=assets[path];let body=asset.body;
 if(asset.type.startsWith('text/html')){
  const commit=/^[a-f0-9]{40}$/.test(env.SOURCE_COMMIT||'')?env.SOURCE_COMMIT:'candidate';
  const label=env.FOUNDER_AUTH_ENABLED==='true'?'Founder authentication preview. Existing TGPU Digital identity is used for sign-in only. Account creation, password changes, uploads and business-data writes are disabled.':'Founder read-only preview. Login, uploads, enquiries and backend writes are disabled';
  const banner='<aside role="status" style="padding:16px;background:#063f35;color:#f8f6f0;border-bottom:2px solid #c6a667;font:16px system-ui">'+label+' · '+commit.slice(0,8)+'. Existing local guest tools remain available. External media and network maps are disabled.</aside>';
  body=/<body[^>]*>/i.test(body)?body.replace(/<body[^>]*>/i,m=>m+banner):body.replace('<main>','<body>'+banner+'<main>');
 }
 return new Response(request.method==='HEAD'?null:body,{headers:{...headers,'Content-Type':asset.type,'X-TEMAN-Source':env.SOURCE_COMMIT||'candidate'}});
}};
