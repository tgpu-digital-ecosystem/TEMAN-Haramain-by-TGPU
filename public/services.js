const base='https://mpidjwjghtpeybedmbkd.supabase.co',key='sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
const $=id=>document.getElementById(id),token=sessionStorage.getItem('tgpu_digital_access_token');
let user,business,admin=false;
const say=t=>{$('status').textContent=t;};
async function api(path,method='GET',body){const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json().catch(()=>null);if(!r.ok)throw Error(r.status===401?'Session expired. Sign in again.':d?.message||'This workflow is not enabled in this environment yet.');return d;}
function text(tag,value,parent){const e=document.createElement(tag);e.textContent=value;parent.append(e);return e;}
function action(label,parent,fn){const b=text('button',label,parent);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();await load();}catch(e){say(e.message);}finally{b.disabled=false;}};return b;}
async function load(){
 if(!token){say('Sign in through Account to view services and submit enquiries.');return;}
 user=await api('/auth/v1/user');if(!user.email_confirmed_at)throw Error('Verify your email first.');
 admin=(await api('/rest/v1/teman_admins?select=user_id&user_id=eq.'+user.id)).length>0;
 business=(await api('/rest/v1/teman_businesses?select=id,status,is_test&owner_id=eq.'+user.id))[0];
 $('provider').hidden=!business||business.status!=='approved';
 const services=await api('/rest/v1/teman_services?select=*&order=created_at.desc&limit=100');$('services').replaceChildren();
 if(!services.length)text('p','No services available.',$('services'));
 for(const s of services){const a=text('article','',$('services'));text('h3',s.title,a);text('p',s.category+' · '+s.service_area+' · '+s.status,a);for(const k of ['description','availability','pricing','terms'])text('p',s[k],a);text('p','Provider reference: '+s.business_id,a);
 if(admin){if(s.status==='pending_review')action('Approve publication',a,()=>api('/rest/v1/teman_services?id=eq.'+s.id,'PATCH',{status:'published'}));if(s.status!=='draft')action('Unpublish / return to draft',a,()=>api('/rest/v1/teman_services?id=eq.'+s.id,'PATCH',{status:'draft'}));}
 if(business?.id===s.business_id&&s.status!=='draft')action('Unpublish my service',a,()=>api('/rest/v1/teman_services?id=eq.'+s.id,'PATCH',{status:'draft'}));
 if(s.status==='published'){const f=text('form','',a),label=text('label','Your enquiry (no passport, medical or precise location details)',f),input=document.createElement('textarea');input.required=true;input.minLength=10;input.maxLength=4000;label.append(input);const testLabel=text('label','',f),test=document.createElement('input');test.type='checkbox';testLabel.append(test);testLabel.append(document.createTextNode('Synthetic test enquiry'));const b=text('button','Send enquiry',f);f.onsubmit=async e=>{e.preventDefault();b.disabled=true;try{const rows=await api('/rest/v1/teman_service_enquiries','POST',{service_id:s.id,body:input.value.trim(),is_test:test.checked});if(!rows?.length)throw Error('Enquiry not saved');const ref=rows[0].id;await load();say('Enquiry saved. Reference: '+ref+'. This is not a booking.');}catch(err){say(err.message);}finally{b.disabled=false;}};}}
 const enquiries=await api('/rest/v1/teman_service_enquiries?select=*&order=created_at.desc&limit=100');$('enquiries').replaceChildren();if(!enquiries.length)text('p','No enquiries yet.',$('enquiries'));
 for(const e of enquiries){const a=text('article','',$('enquiries'));text('h3',e.id+(e.is_test?' — SYNTHETIC TEST':''),a);text('p',e.created_at+' · '+e.status,a);text('p',e.body,a);
 const messages=await api('/rest/v1/teman_enquiry_messages?select=sender_id,body,created_at&enquiry_id=eq.'+e.id+'&order=created_at.asc&limit=100');for(const m of messages)text('p',m.created_at+' · '+(m.sender_id===user.id?'You':m.sender_id===e.pilgrim_id?'Pilgrim':'Provider / owner')+': '+m.body,a);
 if(e.status!=='closed'){const f=text('form','',a),label=text('label','Reply',f),input=document.createElement('textarea');input.required=true;input.maxLength=4000;label.append(input);const b=text('button','Send reply',f);f.onsubmit=async event=>{event.preventDefault();b.disabled=true;try{await api('/rest/v1/teman_enquiry_messages','POST',{enquiry_id:e.id,body:input.value.trim()});await load();say('Reply saved.');}catch(err){say(err.message);}finally{b.disabled=false;}};if(admin||e.pilgrim_id!==user.id){action('Mark responded',a,()=>api('/rest/v1/teman_service_enquiries?id=eq.'+e.id,'PATCH',{status:'responded'}));action('Close enquiry',a,()=>api('/rest/v1/teman_service_enquiries?id=eq.'+e.id,'PATCH',{status:'closed'}));}}
 }
 say('Loaded recorded activity. Showing up to 100 records per section.');
}
$('listing').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;try{const data=Object.fromEntries(['title','category','description','service_area','availability','pricing','terms'].map(k=>[k,f.elements.namedItem(k).value.trim()]));await api('/rest/v1/teman_services','POST',{...data,business_id:business.id,status:'pending_review'});f.reset();await load();say('Service submitted for founder moderation.');}catch(err){say(err.message);}finally{b.disabled=false;}};
load().catch(e=>say(e.message));
