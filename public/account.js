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
let ownerCheck=0;
async function show(user){const check=++ownerCheck;const ownerLink=$('owner-link');ownerLink.hidden=true;const ok=!!user;guest.style.display=ok?'none':'block';signed.style.display=ok?'block':'none';$('signed-email').textContent=ok?'Signed in as '+(user.email||'verified user'):'';if(!ok)return;const label=$('membership');label.textContent='Membership: Basic (Free)';try{const res=await fetch(base+'/rest/v1/teman_memberships?select=tier,status,vip_expires_at&user_id=eq.'+encodeURIComponent(user.id),{headers:{apikey:key,Authorization:'Bearer '+token}});if(!res.ok)return;const rows=await res.json();const m=rows[0];if(m&&m.tier==='vip'&&m.status==='active'&&new Date(m.vip_expires_at)>new Date())label.textContent='Membership: VIP (Active)';}catch{}
 try{const res=await fetch(base+'/rest/v1/teman_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1',{headers:{apikey:key,Authorization:'Bearer '+token},cache:'no-store'});if(res.ok){const rows=await res.json();if(check===ownerCheck&&Array.isArray(rows)&&rows.length===1)ownerLink.hidden=false;}}catch{}
}
async function run(fn){busy(true);try{await fn()}catch(e){say(e.message||'Unable to complete request.')}finally{busy(false)}}
$('account-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
 const d=await api('token?grant_type=password',{email:email.value.trim(),password:password.value});
 if(!d.access_token||!d.user)throw Error('No verified session returned.');
 token=d.access_token;sessionStorage.setItem('tgpu_digital_access_token',token);await show(d.user);say('Signed in. You can now continue to the app.');
})});
$('sign-up').addEventListener('click',()=>run(async()=>{
 if(!email.reportValidity()||!password.reportValidity())return;
 await api('signup?redirect_to='+encodeURIComponent(location.origin+'/account.html'),{email:email.value.trim(),password:password.value});
 say('Registration submitted. Check your email for verification, then return here to sign in. If you already have an account, use Sign in.');
}));
$('reset').addEventListener('click',()=>run(async()=>{
 if(!email.reportValidity())return;
 await api('recover?redirect_to='+encodeURIComponent(location.origin+'/account.html'),{email:email.value.trim()});
 say('If this address has an account, password recovery instructions will be sent. Check your email.');
}));
$('sign-out').addEventListener('click',()=>run(async()=>{
 if(token){try{await api('logout',{},token)}catch{}}
 token='';sessionStorage.removeItem('tgpu_digital_access_token');show(null);say('Signed out.');
}));
$('recovery-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
 if(!recoveryToken)throw Error('Recovery link is invalid or expired. Request a new link.');
 const field=$('new-password');if(!field.reportValidity())return;
 const response=await fetch(base+'/auth/v1/user',{method:'PUT',headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+recoveryToken},body:JSON.stringify({password:field.value})});
 if(!response.ok)throw Error('Unable to reset password. Request a new recovery link.');
 $('recovery').hidden=true;guest.hidden=false;guest.style.display='block';token='';sessionStorage.removeItem('tgpu_digital_access_token');say('Password updated. Sign in using your new password.');
})});
if(token&&!recoveryToken){fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token}}).then(r=>r.ok?r.json():null).then(user=>{if(user)void show(user);else{token='';sessionStorage.removeItem('tgpu_digital_access_token')}}).catch(()=>{})}
})();