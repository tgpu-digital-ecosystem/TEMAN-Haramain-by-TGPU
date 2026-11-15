(()=>{
 let dictionaries,lang='en';const missing=new Set();
 try{lang=localStorage.getItem('teman_business_language')||localStorage.getItem('teman-landing-language')||'en';}catch{}
 if(!['en','ms','ar'].includes(lang))lang='en';
 const t=k=>{if(dictionaries&&!dictionaries.en[k])k=Object.keys(dictionaries.en).find(id=>dictionaries.en[id]===k)||k;if(!dictionaries?.en[k]){if(dictionaries)missing.add(k);return k;}return dictionaries[lang][k]||dictionaries.en[k];};
 function apply(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});}
 window.TemanUI={t,value(k){const value=new String(t(k));value.i18nKey=k;return value;},missing,async setLanguage(value){if(!['en','ms','ar'].includes(value))return;lang=value;try{localStorage.setItem('teman_business_language',lang);localStorage.setItem('teman-landing-language',lang);}catch{}apply();window.dispatchEvent(new Event('teman-language'));}};
 const label=document.createElement('label');label.textContent='English / Bahasa Melayu / العربية';const select=document.createElement('select');select.setAttribute('aria-label','English / Bahasa Melayu / العربية');for(const [value,name] of [['en','English'],['ms','Bahasa Melayu'],['ar','العربية']]){const o=document.createElement('option');o.value=value;o.textContent=name;select.append(o);}select.value=lang;select.onchange=()=>window.TemanUI.setLanguage(select.value);label.append(select);document.querySelector('main').prepend(label);
 // Load before the page module: labels are localised without recreating forms or user content.
 window.TemanUI.ready=fetch('/business-translations.json').then(r=>{if(!r.ok)throw Error('translations');return r.json();}).then(d=>{dictionaries=d;apply();});
 document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
})();
