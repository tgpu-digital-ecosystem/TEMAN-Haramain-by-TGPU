import { useState } from 'react';
type Locale = 'ms' | 'en' | 'ar';
const tasks = ['prayer', 'quran', 'dhikr', 'dua', 'reflection', 'good'] as const;
const labels = {
  ms: { title: 'Ibadah Harian', subtitle: 'Senarai peribadi. Tiada markah atau perkongsian automatik.', family: 'Panggilan Video Keluarga', link: 'Pautan Google Meet keluarga', save: 'Simpan pautan', open: 'Sertai panggilan', invalid: 'Masukkan pautan Google Meet yang sah.', notice: 'Panggilan memerlukan internet dan mungkin dibuka dalam aplikasi Google Meet.', tasks: ['Solat', 'Al-Quran', 'Zikir', 'Doa', 'Muhasabah', 'Amal baik'] },
  en: { title: 'Daily Ibadah', subtitle: 'Private checklist. No scores or automatic family sharing.', family: 'Family Video Call', link: 'Family Google Meet link', save: 'Save link', open: 'Join call', invalid: 'Enter a valid Google Meet link.', notice: 'Calls need internet and may open in the Google Meet app.', tasks: ['Prayer', 'Quran', 'Dhikr', 'Dua', 'Reflection', 'Good deed'] },
  ar: { title: 'العبادة اليومية', subtitle: 'قائمة خاصة دون تقييم أو مشاركة تلقائية مع الأسرة.', family: 'مكالمة فيديو عائلية', link: 'رابط Google Meet للأسرة', save: 'حفظ الرابط', open: 'الانضمام للمكالمة', invalid: 'أدخل رابط Google Meet صالحًا.', notice: 'تحتاج المكالمة إلى الإنترنت وقد تفتح في تطبيق Google Meet.', tasks: ['الصلاة', 'القرآن', 'الذكر', 'الدعاء', 'المحاسبة', 'عمل الخير'] },
};
const today = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'); };
const read = (key: string) => { try { return localStorage.getItem(key) || ''; } catch { return ''; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private storage unavailable */ } };
export function FamilyIbadahHub({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const key = 'teman-ibadah-v1:' + today();
  const [done, setDone] = useState<boolean[]>(() => { try { const x = JSON.parse(read(key)); return Array.isArray(x) && x.length === tasks.length ? x.map(Boolean) : tasks.map(() => false); } catch { return tasks.map(() => false); } });
  const [meeting, setMeeting] = useState(() => read('teman-family-meet-v1'));
  const [error, setError] = useState(false);
  const valid = (value: string) => { try { const u = new URL(value.trim()); return u.protocol === 'https:' && u.hostname === 'meet.google.com' && /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/.test(u.pathname) && !u.username && !u.password; } catch { return false; } };
  const toggle = (index: number) => { const next = done.map((v,i) => i === index ? !v : v); setDone(next); write(key, JSON.stringify(next)); };
  const save = () => { if (!valid(meeting)) { setError(true); return; } setError(false); write('teman-family-meet-v1', meeting.trim()); };
  const open = () => { if (!valid(meeting)) { setError(true); return; } save(); window.open(meeting.trim(), '_blank', 'noopener,noreferrer'); };
  return <div className="familyIbadahHub" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <section className="toolCard" style={{marginBottom:16,padding:20}}>
      <h2>{t.title}</h2><p>{t.subtitle}</p>
      <div style={{display:'grid',gap:12}}>
        {tasks.map((task,i) => <label key={task} style={{display:'flex',alignItems:'center',gap:12,fontSize:'1.1rem',minHeight:44}}>
          <input type="checkbox" checked={done[i]} onChange={() => toggle(i)} style={{width:22,height:22}} />{t.tasks[i]}
        </label>)}
      </div>
    </section>
    <section className="toolCard" style={{padding:20}}>
      <h2>{t.family}</h2><p>{t.notice}</p>
      <label style={{display:'grid',gap:8}}>{t.link}<input type="url" value={meeting} onChange={e => {setMeeting(e.target.value);setError(false);}} placeholder="https://meet.google.com/abc-defg-hij" autoComplete="off" style={{width:'100%',padding:12,fontSize:16}} /></label>
      {error && <p role="alert" style={{color:'#9b2828'}}>{t.invalid}</p>}
      <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:16}}>
        <button type="button" onClick={save}>{t.save}</button>
        <button type="button" className="primary" onClick={open}>{t.open}</button>
      </div>
    </section>
  </div>;
}
