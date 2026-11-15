'use strict';
(() => {
const base='https://mpidjwjghtpeybedmbkd.supabase.co';
const key='sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
const $=id=>document.getElementById(id);
const status=$('status'),email=$('email'),password=$('password'),guest=$('guest'),signed=$('signed');
let token=sessionStorage.getItem('tgpu_digital_access_token')||'';
const hash=new URLSearchParams(location.hash.slice(1));
const recoveryToken=hash.get('type')==='recovery'?hash.get('access_token'):null;
const callbackError=hash.get('error_description')||hash.get('error');
if(hash.has('access_token')||hash.has('refresh_token'))history.replaceState(null,'',location.pathname+location.search);
if(callbackError){history.replaceState(null,'',location.pathname+location.search);queueMicrotask(()=>say('Email link expired or invalid. Request a new verification or recovery email.'));}
if(recoveryToken){token=recoveryToken;history.replaceState(null,'',location.pathname+location.search);$('guest').hidden=true;$('guest').style.display='none';$('recovery').hidden=false;}
const say=t=>{status.textContent=t};
const busy=v=>{for(const b of document.querySelectorAll('button'))b.disabled=v};
async function api(path,body,bearer){
 const res=await fetch(base+'/auth/v1/'+path,{method:'POST',headers:{'Content-Type':'application/json','apikey':key,...(bearer?{'Authorization':'Bearer '+bearer}:{})},body:JSON.stringify(body)});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok)throw Error(data.msg||data.error_description||data.message||data.error||'Authentication failed');
 return data;
}
async function accountEmail(action){const response=await fetch(base+'/functions/v1/teman-account-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,email:email.value.trim(),...(action==='signup'?{password:password.value}:{})})});if(!response.ok)throw Error('Account email could not be sent. Please retry later or sign in if an account already exists.');}
let ownerCheck=0;
async function show(user){const check=++ownerCheck;const ownerLink=$('owner-link');ownerLink.hidden=true;const ok=!!user;guest.style.display=ok?'none':'block';signed.style.display=ok?'block':'none';$('signed-email').textContent=ok?'Signed in as '+(user.email||'verified user'):'';if(!ok)return;const label=$('membership');label.textContent='Membership: Basic (Free)';try{const res=await fetch(base+'/rest/v1/teman_memberships?select=tier,status,vip_expires_at&user_id=eq.'+encodeURIComponent(user.id),{headers:{apikey:key,Authorization:'Bearer '+token}});if(res.ok){const rows=await res.json();const m=rows[0];if(check===ownerCheck&&m&&m.tier==='vip'&&m.status==='active'&&new Date(m.vip_expires_at)>new Date())label.textContent='Membership: VIP (Active)';}}catch{}
 try{const res=await fetch(base+'/rest/v1/teman_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1',{headers:{apikey:key,Authorization:'Bearer '+token},cache:'no-store'});if(res.ok){const rows=await res.json();if(check===ownerCheck&&Array.isArray(rows)&&rows.length===1)ownerLink.hidden=false;}}catch{}
}
async function run(fn){busy(true);try{await fn()}catch(e){say(e.message||'Unable to complete request.')}finally{busy(false)}}
$('account-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
 const d=await api('token?grant_type=password',{email:email.value.trim(),password:password.value});
 if(!d.access_token||!d.user)throw Error('No verified session returned.');
 window.TemanSession?.save(d);token=d.access_token;sessionStorage.setItem('tgpu_digital_access_token',token);await show(d.user);say('Signed in. You can now continue to the app.');
})});
$('sign-up').addEventListener('click',()=>run(async()=>{
 if(!email.reportValidity()||!password.reportValidity())return;
 await accountEmail('signup');
 say('Registration submitted. Check your email for verification, then return here to sign in. If you already have an account, use Sign in.');
}));
$('reset').addEventListener('click',()=>run(async()=>{
 if(!email.reportValidity())return;
 await accountEmail('recovery');
 say('If this address has an account, password recovery instructions will be sent. Check your email.');
}));
$('sign-out').addEventListener('click',()=>run(async()=>{
 const logoutToken=token;window.TemanSession?.clear();token='';sessionStorage.removeItem('tgpu_digital_access_token');await show(null);
 try{if(logoutToken)await api('logout',{},logoutToken);say('Signed out.');}catch{say('Signed out on this device. Server session revocation could not be verified.');}
}));
$('recovery-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
 if(!recoveryToken)throw Error('Recovery link is invalid or expired. Request a new link.');
 const field=$('new-password');if(!field.reportValidity())return;
 const response=await fetch(base+'/auth/v1/user',{method:'PUT',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+recoveryToken},body:JSON.stringify({password:field.value})});
 if(!response.ok)throw Error('Unable to reset password. Request a new recovery link.');
 let revoked=true;try{await api('logout',{},recoveryToken);}catch{revoked=false;}
 $('new-password').value='';$('recovery').hidden=true;guest.hidden=false;guest.style.display='block';window.TemanSession?.clear();token='';sessionStorage.removeItem('tgpu_digital_access_token');void show(null);say(revoked?'Password updated. Sign in using your new password.':'Password updated. Sign in again. Server session revocation could not be verified.');
})});
if(token&&!recoveryToken){Promise.resolve(window.TemanSession?.getAccessToken()||token).then(value=>{token=value;return fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token}});}).then(r=>r.ok?r.json():null).then(user=>{if(user)void show(user);else{window.TemanSession?.clear();token='';sessionStorage.removeItem('tgpu_digital_access_token');void show(null)}}).catch(()=>{window.TemanSession?.clear();token='';sessionStorage.removeItem('tgpu_digital_access_token');void show(null)})}
})();