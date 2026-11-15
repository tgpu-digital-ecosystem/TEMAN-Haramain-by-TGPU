const base='https://mpidjwjghtpeybedmbkd.supabase.co';
const key='sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
const $=id=>document.getElementById(id);
const token=sessionStorage.getItem('tgpu_digital_access_token');
let user,existing;
const say=text=>{$('status').textContent=text;};
async function api(path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json().catch(()=>null);
 if(!r.ok)throw Error(r.status===401?'Your session expired. Sign in again.':r.status===404?'Partner onboarding is not enabled in this environment yet.':data?.message||'Request failed. Please retry.');
 return data;
}
function text(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
async function load(){
 $('workspace').hidden=true;$('review').hidden=true;
 if(!token){say('Sign in with a verified email using Account, then return here.');return;}
 user=await api('/auth/v1/user');
 if(!user.email_confirmed_at)throw Error('Verify your email before applying.');
 const rows=await api('/rest/v1/teman_businesses?owner_id=eq.'+encodeURIComponent(user.id)+'&select=*');
 existing=rows[0];$('workspace').hidden=false;
 $('application-status').textContent=existing?'Status: '+existing.status+(existing.is_test?' · SYNTHETIC TEST':''):'No application submitted.';
 const form=$('application');form.hidden=!!existing&&!['pending_review','changes_requested'].includes(existing.status);
 if(existing){for(const name of ['company_name','licence_number','jurisdiction','contact_email','verification_notes'])form.elements.namedItem(name).value=existing[name];form.elements.namedItem('is_test').checked=existing.is_test;form.elements.namedItem('is_test').disabled=true;}
 $('history').replaceChildren();
 if(existing){const events=await api('/rest/v1/teman_business_reviews?business_id=eq.'+existing.id+'&order=created_at.asc');for(const e of events)text('p',e.created_at+' · '+e.decision+' · '+e.notes,$('history'));}
 const admins=await api('/rest/v1/teman_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id));
 if(admins.length){$('review').hidden=false;const queue=await api('/rest/v1/teman_businesses?select=*&order=created_at.asc');$('queue').replaceChildren();if(!queue.length)text('p','No applications yet.',$('queue'));
 for(const b of queue){const item=text('article','',$('queue'));text('h3',b.company_name+(b.is_test?' — SYNTHETIC TEST':''),item);text('p',b.status+' · '+b.licence_number+' · '+b.jurisdiction,item);text('p',b.contact_email,item);text('p',b.verification_notes,item);const f=document.createElement('form');item.append(f);const label=text('label','Decision',f);const select=document.createElement('select');label.append(select);for(const s of ['changes_requested','approved','rejected','suspended']){const opt=document.createElement('option');opt.value=s;opt.textContent=s;select.append(opt);}const notesLabel=text('label','Review notes',f);const notes=document.createElement('textarea');notes.required=true;notes.minLength=3;notes.maxLength=4000;notesLabel.append(notes);const btn=text('button','Record decision',f);f.onsubmit=async e=>{e.preventDefault();btn.disabled=true;try{await api('/rest/v1/teman_businesses?id=eq.'+b.id,'PATCH',{status:select.value,review_notes:notes.value.trim()});await load();say('Review saved with reviewer identity and timestamp.');}catch(err){say(err.message);}finally{btn.disabled=false;}};}}
 say('Application data loaded. No payment or booking is created by this workflow.');
}
$('application').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const button=f.querySelector('button');button.disabled=true;try{const data=Object.fromEntries(['company_name','licence_number','jurisdiction','contact_email','verification_notes'].map(n=>[n,f.elements.namedItem(n).value.trim()]));data.status='pending_review';if(!existing)data.is_test=f.elements.namedItem('is_test').checked;const result=await api('/rest/v1/teman_businesses'+(existing?'?id=eq.'+existing.id:''),existing?'PATCH':'POST',data);if(!result?.length)throw Error('No application saved. Please refresh and retry.');await load();say('Application saved. Reference: '+result[0].id+'. Pending founder review.');}catch(err){say(err.message);}finally{button.disabled=false;}};
load().catch(err=>say(err.message));
