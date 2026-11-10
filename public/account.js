'use strict';
(() => {
const base='https://mpidjwjghtpeybedmbkd.supabase.co';
const key='sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
const $=id=>document.getElementById(id);
const status=$('status'),email=$('email'),password=$('password'),guest=$('guest'),signed=$('signed');
let token=sessionStorage.getItem('tgpu_digital_access_token')||'';
const say=t=>{status.textContent=t};
const busy=v=>{for(const b of document.querySelectorAll('button'))b.disabled=v};
async function api(path,body,bearer){
 const res=await fetch(base+'/auth/v1/'+path,{method:'POST',headers:{'Content-Type':'application/json','apikey':key,...(bearer?{'Authorization':'Bearer '+bearer}:{})},body:JSON.stringify(body)});
 let data={};try{data=await res.json()}catch{}
 if(!res.ok)throw Error(data.msg||data.error_description||data.message||data.error||'Authentication failed');
 return data;
}
function show(user){const ok=!!user;guest.style.display=ok?'none':'block';signed.style.display=ok?'block':'none';$('signed-email').textContent=ok?'Signed in as '+(user.email||'verified user'):''}
async function run(fn){busy(true);try{await fn()}catch(e){say(e.message||'Unable to complete request.')}finally{busy(false)}}
$('account-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{
 const d=await api('token?grant_type=password',{email:email.value.trim(),password:password.value});
 if(!d.access_token||!d.user)throw Error('No verified session returned.');
 token=d.access_token;sessionStorage.setItem('tgpu_digital_access_token',token);show(d.user);say('Signed in. You can now continue to the app.');
})});
$('sign-up').addEventListener('click',()=>run(async()=>{
 if(!email.reportValidity()||!password.reportValidity())return;
 await api('signup',{email:email.value.trim(),password:password.value});
 say('Registration submitted. Check your email for verification, then return here to sign in. If you already have an account, use Sign in.');
}));
$('reset').addEventListener('click',()=>run(async()=>{
 if(!email.reportValidity())return;
 await api('recover',{email:email.value.trim()});
 say('If this address has an account, password recovery instructions will be sent. Check your email.');
}));
$('sign-out').addEventListener('click',()=>run(async()=>{
 if(token){try{await api('logout',{},token)}catch{}}
 token='';sessionStorage.removeItem('tgpu_digital_access_token');show(null);say('Signed out.');
}));
if(token){fetch(base+'/auth/v1/user',{headers:{apikey:key,Authorization:'Bearer '+token}}).then(r=>r.ok?r.json():null).then(user=>{if(user)show(user);else{token='';sessionStorage.removeItem('tgpu_digital_access_token')}}).catch(()=>{})}
})();