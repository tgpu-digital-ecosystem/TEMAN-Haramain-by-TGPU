const tr=(k,fallback)=>window.TemanUI?.value(k)||fallback;
const base='https://mpidjwjghtpeybedmbkd.supabase.co';
const key='sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
const $=id=>document.getElementById(id);
const token=sessionStorage.getItem('tgpu_digital_access_token');
let user,existing;
const say=text=>{$('status').textContent=text;if(text?.i18nKey)$('status').dataset.i18n=text.i18nKey;else delete $('status').dataset.i18n;};
async function api(path,method='GET',body){
 const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:'Bearer '+(await (window.TemanSession?.getAccessToken()||token)),'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
 const data=await r.json().catch(()=>null);
 if(r.status===401)window.TemanSession?.clear();if(!r.ok)throw Error(r.status===401?tr("b_1735ecf6cc","Your session expired. Sign in again."):r.status===404?tr("b_6bd7966253","Partner onboarding is not enabled in this environment yet."):data?.message||tr("b_642495f075","Request failed. Please retry."));
 return data;
}
function text(tag,value,parent){const el=document.createElement(tag);if(value?.i18nKey){const span=document.createElement('span');span.dataset.i18n=value.i18nKey;span.textContent=value;el.append(span);}else el.textContent=value;parent.append(el);return el;}
async function load(){
 if(['founder-auth-preview','read-only'].includes(window.TemanAuthConfig?.mode)){say('Operational data is disabled in this preview. Founder sign-in is available through Account.');return;}
 $('workspace').hidden=true;$('review').hidden=true;
 if(!token){say(tr("b_3ac93b7277","Sign in with a verified email using Account, then return here."));return;}
 user=await api('/auth/v1/user');
 if(!user.email_confirmed_at)throw Error(tr("b_c795751623","Verify your email before applying."));
 const rows=await api('/rest/v1/teman_businesses?owner_id=eq.'+encodeURIComponent(user.id)+'&select=*');
 existing=rows[0];$('workspace').hidden=false;
 $('application-status').textContent=existing?tr("b_f8c824ee74","Status: ")+existing.status+(existing.is_test?' · SYNTHETIC TEST':''):tr("b_9741abdd41","No application submitted.");
 const form=$('application');form.hidden=!!existing&&!['pending_review','changes_requested'].includes(existing.status);
 if(existing){for(const name of ['company_name','licence_number','jurisdiction','contact_email','verification_notes'])form.elements.namedItem(name).value=existing[name];form.elements.namedItem('is_test').checked=existing.is_test;form.elements.namedItem('is_test').disabled=true;}
 $('history').replaceChildren();
 if(existing){const events=await api('/rest/v1/teman_business_reviews?business_id=eq.'+existing.id+'&order=created_at.asc');for(const e of events)text('p',e.created_at+' · '+e.decision+' · '+e.notes,$('history'));}
 const admins=await api('/rest/v1/teman_admins?select=user_id&user_id=eq.'+encodeURIComponent(user.id));
 if(admins.length){$('review').hidden=false;const queue=await api('/rest/v1/teman_businesses?select=*&order=created_at.asc');$('queue').replaceChildren();if(!queue.length)text('p',tr("b_f6223279b6","No applications yet."),$('queue'));
 for(const b of queue){const item=text('article','',$('queue'));text('h3',b.company_name+(b.is_test?' — SYNTHETIC TEST':''),item);text('p',b.status+' · '+b.licence_number+' · '+b.jurisdiction,item);text('p',b.contact_email,item);text('p',b.verification_notes,item);const documents=text('div','',item);showDocuments(b.id,documents,false).catch(e=>text('p',e.message,documents));const f=document.createElement('form');item.append(f);const label=text('label',tr("b_7f59a1f1d5","Decision"),f);const select=document.createElement('select');label.append(select);for(const s of ['changes_requested','approved','rejected','suspended']){const opt=document.createElement('option');opt.value=s;opt.textContent=window.TemanUI?.t(s)||s;select.append(opt);}const notesLabel=text('label',tr("b_40b69a4702","Review notes"),f);const notes=document.createElement('textarea');notes.required=true;notes.minLength=3;notes.maxLength=4000;notesLabel.append(notes);const btn=text('button',tr("b_621a4f4cb7","Record decision"),f);f.onsubmit=async e=>{e.preventDefault();btn.disabled=true;try{await api('/rest/v1/teman_businesses?id=eq.'+b.id,'PATCH',{status:select.value,review_notes:notes.value.trim()});await load();say(tr("b_5e3abc373b","Review saved with reviewer identity and timestamp."));}catch(err){say(err.message);}finally{btn.disabled=false;}};}}
 $('documents').hidden=!existing;
 if(existing){$('document-upload').hidden=!['pending_review','changes_requested'].includes(existing.status);showDocuments(existing.id,$('document-list'),!$('document-upload').hidden).catch(e=>say(e.message));}
 $('public-profile').hidden=!existing||existing.status!=='approved';
 if(existing?.status==='approved'){const profiles=await api('/rest/v1/teman_provider_profiles?business_id=eq.'+existing.id);if(profiles[0])for(const k of ['display_name','description','category'])$('profile').elements.namedItem(k).value=profiles[0][k];}
 say(tr("b_4085ccc6d0","Application data loaded. No payment or booking is created by this workflow."));
}
$('application').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget;const button=f.querySelector('button');button.disabled=true;try{const data=Object.fromEntries(['company_name','licence_number','jurisdiction','contact_email','verification_notes'].map(n=>[n,f.elements.namedItem(n).value.trim()]));data.status='pending_review';if(!existing)data.is_test=f.elements.namedItem('is_test').checked;const result=await api('/rest/v1/teman_businesses'+(existing?'?id=eq.'+existing.id:''),existing?'PATCH':'POST',data);if(!result?.length)throw Error(tr("b_6176d6e3d0","No application saved. Please refresh and retry."));await load();say(tr("b_bf8d564c83","Application saved. Reference: ")+result[0].id+'. Pending founder review.');}catch(err){say(err.message);}finally{button.disabled=false;}};
(window.TemanUI?.ready||Promise.resolve()).then(()=>load()).catch(err=>say(err.message));

async function documentRequest(bid,id='',method='GET',body){
 const r=await fetch('/api/documents'+(id?'/'+id:'')+'?business='+bid,{method,headers:{Authorization:'Bearer '+(await (window.TemanSession?.getAccessToken()||token))},body});
 if(!r.ok)throw Error(tr("b_6a87b8ab5e","Document request failed. Check your access, file type, size and quota."));
 return method==='GET'&&id?r.blob():r.json();
}
async function showDocuments(bid,parent,editable){
 parent.replaceChildren();const docs=await documentRequest(bid);if(!docs.length)text('p',tr("b_15ac668755","No documents uploaded."),parent);
 for(const d of docs){const row=text('article',d.filename+' · '+d.mime+' · '+d.size+' bytes · '+d.state+' · '+new Date(d.created_at).toLocaleString(document.documentElement.lang),parent);
 const download=text('button',tr("b_c27e0da663","Download privately"),row);download.type='button';download.onclick=async()=>{download.disabled=true;try{const blob=await documentRequest(bid,d.id);const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=d.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){say(e.message);}finally{download.disabled=false;}};
 if(editable){const remove=text('button',tr("b_86e2598142","Remove document"),row);remove.type='button';remove.onclick=async()=>{remove.disabled=true;try{await documentRequest(bid,d.id,'DELETE');await showDocuments(bid,parent,editable);}catch(e){say(e.message);remove.disabled=false;}};}
 }
}
$('document-upload').onsubmit=async e=>{e.preventDefault();if(!existing)return;const f=e.currentTarget,b=f.querySelector('button'),file=f.elements.namedItem('file').files[0];if(!file||file.size>5242880){say(tr("b_f9488c0837","Maximum file size is 5 MB."));return;}
 let access;try{access=await (window.TemanSession?.getAccessToken()||token);}catch{say(tr("b_1735ecf6cc","Your session expired. Sign in again."));return;}
 b.disabled=true;const progress=$('upload-progress');progress.hidden=false;progress.value=0;const xhr=new XMLHttpRequest();xhr.open('POST','/api/documents?business='+existing.id);xhr.setRequestHeader('Authorization','Bearer '+access);xhr.upload.onprogress=e=>{if(e.lengthComputable)progress.value=Math.round(e.loaded/e.total*100);};xhr.onload=async()=>{b.disabled=false;progress.hidden=true;if(xhr.status>=200&&xhr.status<300){f.reset();say(tr("b_79e5d1060a","Document uploaded to quarantine for review."));await showDocuments(existing.id,$('document-list'),true).catch(e=>say(e.message));}else say(tr("b_fa560cb746","Upload failed. Check file type, size, quota and review status."));};xhr.onerror=()=>{b.disabled=false;progress.hidden=true;say(tr("b_8beddbd99e","Upload interrupted. Please retry."));};xhr.send(new FormData(f));};
$('profile').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;try{const values=Object.fromEntries(['display_name','description','category'].map(k=>[k,f.elements.namedItem(k).value.trim()]));const path='/rest/v1/teman_provider_profiles';const profiles=await api(path+'?business_id=eq.'+existing.id);const saved=await api(path+(profiles.length?'?business_id=eq.'+existing.id:''),profiles.length?'PATCH':'POST',profiles.length?values:{...values,business_id:existing.id});if(!saved?.length)throw Error(tr("b_9d90dfb3db","Profile not saved."));say(tr("b_67150cad98","Public profile saved."));}catch(e){say(e.message);}finally{b.disabled=false;}};

window.addEventListener('teman-session-cleared',()=>{$('workspace').hidden=true;$('review').hidden=true;$('queue').replaceChildren();$('document-list').replaceChildren();existing=null;user=null;});
