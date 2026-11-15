// Private in-app delivery only. No email or background push delivery is implied.
(()=>{
 const base='https://mpidjwjghtpeybedmbkd.supabase.co',key='sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
 const section=document.createElement('section');section.id='teman-notifications';section.hidden=true;document.querySelector('main').append(section);
 let rows=[],offset=0,more=false,busy=false,epoch=0,note='';
 const t=k=>window.TemanUI?.t(k)||k;
 const eventKeys={application_received:'n_application_received',application_submitted:'n_application_submitted',application_approved:'n_application_approved',application_rejected:'n_application_rejected',application_changes_requested:'n_application_changes_requested',application_suspended:'n_application_suspended',new_enquiry:'n_new_enquiry',new_reply:'n_new_reply',enquiry_status:'n_enquiry_status'};
 function el(tag,value,parent){const e=document.createElement(tag);if(value)e.textContent=value;parent.append(e);return e;}
 function button(key,parent,action){const b=el('button',t(key),parent);b.type='button';b.disabled=busy;b.onclick=action;return b;}
 function render(){
  section.replaceChildren();el('h2',t('n_title'),section);el('p',t('n_privacy'),section);
  const status=el('p',note?t(note):rows.filter(r=>!r.read_at).length+' '+t('n_unread_page'),section);status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  button('n_refresh',section,()=>{offset=0;load();});
  if(!rows.length&&!note)el('p',t('n_empty'),section);
  for(const r of rows){const a=el('article','',section);el('h3',t(eventKeys[r.event_type]||'n_event'),a);el('p',new Date(r.created_at).toLocaleString(['en','ms','ar'].includes(document.documentElement.lang)?document.documentElement.lang:'en'),a);
   // Only server-selected target kinds and exact UUIDs can produce a local link.
   if(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(r.target_id)&&['business','enquiry'].includes(r.target_type)){
    const link=el('a',t('n_open')+' · '+r.target_id.slice(0,8),a);link.href=(r.target_type==='business'?'/business.html':'/services.html')+'#'+(r.target_type==='business'?'application-status':'enquiry-'+r.target_id);
   }
   button(r.read_at?'n_mark_unread':'n_mark_read',a,()=>mark(r));
  }
  if(offset>0)button('n_previous',section,()=>{offset=Math.max(0,offset-50);load();});
  if(more)button('n_next',section,()=>{offset+=50;load();});
 }
 async function api(path,method='GET',body){
  const access=await window.TemanSession?.getAccessToken();if(!access)throw Error('session');
  const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:'Bearer '+access,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
  if(r.status===401){window.TemanSession?.clear();throw Error('session');}
  if(!r.ok)throw Error('unavailable');return r.json();
 }
 async function load(){
  if(busy||!window.TemanSession)return;const current=epoch;busy=true;note='n_loading';render();
  try{const data=await api('/rest/v1/teman_notifications?select=id,event_type,target_type,target_id,created_at,read_at&order=created_at.desc,id.desc&limit=51&offset='+offset);
   if(current!==epoch)return;if(!Array.isArray(data))throw Error('unavailable');rows=data.slice(0,50);more=data.length>50;note='';section.hidden=false;
  }catch(e){if(current!==epoch)return;rows=[];more=false;note=e.message==='session'?'n_sign_in':'n_unavailable';section.hidden=e.message==='session';}
  finally{if(current===epoch){busy=false;render();}}
 }
 async function mark(row){if(busy)return;const current=epoch;busy=true;render();try{
  const saved=await api('/rest/v1/teman_notifications?id=eq.'+encodeURIComponent(row.id),'PATCH',{read_at:row.read_at?null:new Date().toISOString()});
  if(current!==epoch)return;if(!Array.isArray(saved)||saved.length!==1||saved[0].id!==row.id)throw Error('unavailable');
  row.read_at=saved[0].read_at;note='';
 }catch{if(current===epoch)note='n_unavailable';}finally{if(current===epoch){busy=false;render();}}}
 window.addEventListener('teman-session-cleared',()=>{epoch++;rows=[];offset=0;busy=false;more=false;section.replaceChildren();section.hidden=true;});
 window.addEventListener('teman-language',render);
 window.addEventListener('focus',()=>{if(!document.hidden){offset=0;load();}});
 // One request per visible minute; no emails, push service, or real-time subscription.
 setInterval(()=>{if(!document.hidden&&!section.hidden&&offset===0)load();},60000);
 (window.TemanUI?.ready||Promise.resolve()).then(load);
})();
