/* Ephemeral session refresh only. Membership and owner checks stay server-side. */
(()=>{
 const storage=sessionStorage,sessionKey='teman_auth_session',legacyKey='tgpu_digital_access_token';
 const base=window.TemanAuthConfig?.base||'https://mpidjwjghtpeybedmbkd.supabase.co',key='sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
 let epoch=0,pending=null;
 function clear(){epoch++;pending=null;storage.removeItem(sessionKey);storage.removeItem(legacyKey);window.dispatchEvent(new Event('teman-session-cleared'));}
 function save(data){
  if(typeof data?.access_token!=='string'||!data.access_token)throw Error('Invalid session');
  const expiry=Number(data.expires_at)||(Date.now()/1000+Number(data.expires_in||3600));
  storage.setItem(sessionKey,JSON.stringify({access_token:data.access_token,refresh_token:typeof data.refresh_token==='string'?data.refresh_token:null,expires_at:expiry}));
  storage.setItem(legacyKey,data.access_token);epoch++;
 }
 function current(){try{return JSON.parse(storage.getItem(sessionKey)||'null');}catch{clear();return null;}}
 async function getAccessToken(force=false){
  const session=current();if(!session)return storage.getItem(legacyKey)||'';
  if(!force&&session.expires_at>Date.now()/1000+30)return session.access_token;
  if(pending)return pending;
  if(!session.refresh_token){clear();throw Error('session_expired');}
  const started=epoch;
  const work=(async()=>{
   try{
    const response=await fetch(base+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:key,'content-type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
    if(!response.ok)throw Error('session_expired');const data=await response.json();
    if(started!==epoch)throw Error('session_changed');save(data);return data.access_token;
   }catch(e){if(started===epoch)clear();throw e;}
  })();pending=work;
  try{return await work;}finally{if(pending===work)pending=null;}
 }
 window.TemanSession={save,clear,getAccessToken};
})();
