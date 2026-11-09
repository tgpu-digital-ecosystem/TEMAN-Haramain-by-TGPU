import { supabase } from './teman-supabase';
import type { User } from '@supabase/supabase-js';
import { FamilyIbadahHub } from './FamilyIbadahHub';
import { useEffect, useMemo, useState } from 'react';
import { GlobalPilgrimHelp } from './global-pilgrim-help';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Bus,
  Calculator,
  CheckCircle2,
  Copy,
  Languages,
  MapPin,
  NotebookPen,
  Phone,
  Save,
  Share2,
  ShieldCheck,
  UserRound,
  UsersRound,
  Volume2,
  Wifi,
  WifiOff,
  Home,
} from 'lucide-react';

type Locale = 'ms' | 'ar' | 'en';
type Page = 'home' | 'app' | 'admin' | 'account' | 'setup' | 'emergency' | 'translate' | 'ibadah' | 'family-ibadah' | 'notes' | 'currency';
type City = 'makkah' | 'madinah';
type EmergencyKind = 'lost' | 'unwell' | 'bus';
type CurrencyDirection = 'sar-myr' | 'myr-sar';
type Profile = {
  pilgrimName: string;
  preferredName: string;
  hotelMakkah: string;
  hotelMadinah: string;
  hotelAddress: string;
  hotelAddressMakkah: string;
  hotelAddressMadinah: string;
  groupCode: string;
  busNumber: string;
  mutawwifName: string;
  mutawwifPhone: string;
  familyName: string;
  familyPhone: string;
};

const EMPTY: Profile = {
  pilgrimName: '', preferredName: '', hotelMakkah: '', hotelMadinah: '', hotelAddress: '', hotelAddressMakkah: '', hotelAddressMadinah: '',
  groupCode: '', busNumber: '', mutawwifName: '', mutawwifPhone: '', familyName: '', familyPhone: '',
};

const COPY = {
  ms: {
    subtitle: 'Keselamatan jemaah • Mesra warga emas', hello: 'Assalamualaikum', need: 'Apa yang anda perlukan?',
    hint: 'Tekan satu butang sahaja. Maklumat penting disimpan pada telefon ini.', help: 'BANTU SAYA SEKARANG',
    helpHint: 'Sesat, sakit, terpisah atau perlukan bantuan', hotel: 'BALIK KE HOTEL', hotelHint: 'Belum ada hotel untuk bandar ini',
    group: 'CARI KUMPULAN SAYA', groupHint: 'Kumpulan, bas dan mutawwif', translate: 'CAKAP & TERJEMAH', translateHint: 'Bahasa Melayu ⇄ العربية ⇄ English',
    ibadah: 'PANDUAN IBADAH', ibadahHint: 'Panduan ringkas Umrah / Haji', setup: 'SEDIAKAN PROFIL JEMAAH', setupHint: 'Anak / keluarga isi sebelum berlepas',
    notes: 'SATU NOTES', notesHint: 'Simpan nota penting pada telefon', currency: 'KIRA CURRENCY', currencyHint: 'Riyal Saudi ⇄ Ringgit Malaysia',
    saved: 'Profil disimpan pada peranti', notReady: 'Profil belum lengkap', ready: 'PROFIL KESELAMATAN SEDIA', back: 'Kembali', save: 'Simpan Profil',
    setupTitle: 'Sediakan TEMAN untuk Ayah / Ibu', setupIntro: 'Isi maklumat yang akan membantu jika jemaah sesat, terpisah atau perlukan bantuan.',
    name: 'Nama penuh jemaah', preferred: 'Nama panggilan', makkah: 'Hotel Makkah', madinah: 'Hotel Madinah', makkahAddress: 'Alamat / lokasi hotel Makkah', madinahAddress: 'Alamat / lokasi hotel Madinah',
    groupCode: 'Kod kumpulan', bus: 'Nombor bas', mutawwif: 'Nama mutawwif', mutawwifPhone: 'Telefon mutawwif', family: 'Nama ahli keluarga', familyPhone: 'Telefon keluarga',
    crisis: 'Apa yang berlaku?', lost: 'SAYA SESAT', lostHint: 'Tunjukkan skrin bantuan kepada petugas', unwell: 'SAYA TAK SIHAT', unwellHint: 'Minta bantuan perubatan dan hubungi orang dipercayai',
    busLost: 'SAYA TAK JUMPA BAS', busLostHint: 'Tunjukkan nombor bas, kumpulan dan mutawwif', callGuide: 'HUBUNGI MUTAWWIF', callFamily: 'HUBUNGI KELUARGA', showCard: 'TUNJUKKAN SKRIN INI',
    openMap: 'BUKA LOKASI HOTEL', speakArabic: 'MAIN ARABIC', translateTitle: 'Cakap. TEMAN bantu terjemah.',
    translateIntro: 'Pilih frasa penting dan mainkan versi Arab dengan kuat kepada petugas atau orang berdekatan.',
    choosePhrase: 'Pilih frasa', phraseLost: 'Saya sesat dan mahu balik ke hotel.', phraseBus: 'Saya tidak jumpa bas kumpulan saya.', phraseSick: 'Saya tidak sihat dan perlukan bantuan.', phraseGuide: 'Tolong hubungi mutawwif saya.',
    guideTitle: 'Panduan Ibadah Ringkas', guideNote: 'Rujukan ringkas untuk membantu ingatan. Ikuti bimbingan mutawwif dan pihak berautoriti bagi persoalan ibadah.',
    currentCity: 'LOKASI SEMASA', makkahCity: 'Makkah', madinahCity: 'Madinah', locationHint: 'Pilih bandar anda sekarang supaya TEMAN tunjuk hotel yang betul.',
    editProfile: 'Lengkapkan profil dahulu untuk menggunakan fungsi ini.', selectedIssue: 'Bantuan dipilih', online: 'ONLINE', offlineReady: 'OFFLINE READY',
    shareDetails: 'KONGSI BUTIRAN BANTUAN', copyDetails: 'SALIN BUTIRAN', copied: 'Butiran telah disalin',
    notesTitle: 'SATU Notes', notesIntro: 'Catat nombor bilik, tempat berkumpul, maklumat bas atau perkara penting. Nota disimpan pada telefon ini.',
    notesPlaceholder: 'Contoh: Berkumpul di Pintu 79 selepas Isyak…', saveNote: 'Simpan Nota', noteSaved: 'Nota disimpan pada peranti',
    currencyTitle: 'Kira Riyal & Ringgit', currencyIntro: 'Kalkulator ringkas yang boleh digunakan tanpa internet. Masukkan kadar semasa daripada bank atau pengurup wang yang anda percayai.',
    rateLabel: 'Kadar: 1 SAR = berapa MYR?', amountLabel: 'Jumlah', resultLabel: 'Anggaran', sarToMyr: 'SAR → MYR', myrToSar: 'MYR → SAR',
    rateHelp: 'Kadar ini disimpan pada telefon. Semak dan kemas kini apabila kadar berubah.',
    toolsTitle: 'ALAT PERJALANAN', toolsHint: 'Akses alat penting tanpa memenuhi skrin.', offlineCardTool: 'KAD OFFLINE', offlineMapTool: 'PETA OFFLINE', readinessTool: 'PERSEDIAAN', remindersTool: 'PERINGATAN',
  },
  en: {
    subtitle: 'Pilgrim safety • Senior friendly', hello: 'Welcome', need: 'What do you need?',
    hint: 'Tap one large button. Important information stays on this phone.', help: 'HELP ME NOW', helpHint: 'Lost, unwell, separated, or need assistance',
    hotel: 'RETURN TO HOTEL', hotelHint: 'No hotel saved for this city', group: 'FIND MY GROUP', groupHint: 'Group, bus, and mutawwif',
    translate: 'SPEAK & TRANSLATE', translateHint: 'Bahasa Melayu ⇄ العربية ⇄ English', ibadah: 'IBADAH GUIDE', ibadahHint: 'Simple Umrah / Hajj guidance',
    setup: 'PREPARE PILGRIM PROFILE', setupHint: 'Family completes this before travel', notes: 'SATU NOTES', notesHint: 'Save important notes on this phone',
    currency: 'CURRENCY', currencyHint: 'Saudi Riyal ⇄ Malaysian Ringgit', saved: 'Profile saved on this device', notReady: 'Profile is incomplete', ready: 'SAFETY PROFILE READY',
    back: 'Back', save: 'Save Profile', setupTitle: 'Prepare TEMAN for Mum / Dad', setupIntro: 'Add information that can help if the pilgrim is lost, separated, or needs assistance.',
    name: 'Pilgrim full name', preferred: 'Preferred name', makkah: 'Makkah hotel', madinah: 'Madinah hotel', makkahAddress: 'Makkah hotel address / location', madinahAddress: 'Madinah hotel address / location',
    groupCode: 'Group code', bus: 'Bus number', mutawwif: 'Mutawwif name', mutawwifPhone: 'Mutawwif phone', family: 'Family contact name', familyPhone: 'Family phone', crisis: 'What happened?',
    lost: 'I AM LOST', lostHint: 'Show the help screen to an officer', unwell: 'I FEEL UNWELL', unwellHint: 'Ask for medical help and contact someone you trust', busLost: 'I CANNOT FIND MY BUS', busLostHint: 'Show your bus, group, and mutawwif details',
    callGuide: 'CALL MUTAWWIF', callFamily: 'CALL FAMILY', showCard: 'SHOW THIS SCREEN', openMap: 'OPEN HOTEL LOCATION', speakArabic: 'PLAY ARABIC',
    translateTitle: 'Speak. TEMAN helps translate.', translateIntro: 'Choose an important phrase and play the Arabic version aloud to an officer or someone nearby.', choosePhrase: 'Choose a phrase',
    phraseLost: 'I am lost and want to return to my hotel.', phraseBus: 'I cannot find my group bus.', phraseSick: 'I feel unwell and need help.', phraseGuide: 'Please contact my mutawwif.',
    guideTitle: 'Simple Ibadah Guide', guideNote: 'A simple memory aid. Follow your mutawwif and relevant religious authorities for ibadah questions.',
    currentCity: 'CURRENT LOCATION', makkahCity: 'Makkah', madinahCity: 'Madinah', locationHint: 'Choose where you are now so TEMAN shows the correct hotel.',
    editProfile: 'Complete the pilgrim profile first to use this function.', selectedIssue: 'Selected assistance', online: 'ONLINE', offlineReady: 'OFFLINE READY',
    shareDetails: 'SHARE HELP DETAILS', copyDetails: 'COPY DETAILS', copied: 'Details copied',
    notesTitle: 'SATU Notes', notesIntro: 'Keep room numbers, meeting points, bus information, or other important notes. Notes stay on this phone.',
    notesPlaceholder: 'Example: Meet at Gate 79 after Isha…', saveNote: 'Save Note', noteSaved: 'Note saved on this device',
    currencyTitle: 'Riyal & Ringgit Calculator', currencyIntro: 'A simple calculator that works offline. Enter the current rate from a bank or money changer you trust.',
    rateLabel: 'Rate: 1 SAR equals how many MYR?', amountLabel: 'Amount', resultLabel: 'Estimate', sarToMyr: 'SAR → MYR', myrToSar: 'MYR → SAR',
    rateHelp: 'This rate is stored on your phone. Check and update it when exchange rates change.',
    toolsTitle: 'TRAVEL TOOLS', toolsHint: 'Open useful tools without cluttering the screen.', offlineCardTool: 'OFFLINE CARD', offlineMapTool: 'OFFLINE MAP', readinessTool: 'READINESS', remindersTool: 'REMINDERS',
  },
  ar: {
    subtitle: 'سلامة الحجاج والمعتمرين • مناسب لكبار السن', hello: 'السلام عليكم', need: 'ماذا تحتاج؟', hint: 'اضغط على زر واحد فقط. المعلومات المهمة محفوظة على هذا الهاتف.',
    help: 'ساعدني الآن', helpHint: 'ضائع أو مريض أو منفصل عن المجموعة أو تحتاج إلى مساعدة', hotel: 'العودة إلى الفندق', hotelHint: 'لا يوجد فندق محفوظ لهذه المدينة', group: 'العثور على مجموعتي',
    groupHint: 'المجموعة والحافلة والمطوف', translate: 'تحدث وترجم', translateHint: 'Bahasa Melayu ⇄ العربية ⇄ English', ibadah: 'دليل العبادة', ibadahHint: 'إرشادات مبسطة للعمرة والحج',
    setup: 'إعداد ملف الحاج / المعتمر', setupHint: 'تقوم الأسرة بإكماله قبل السفر', notes: 'ملاحظات SATU', notesHint: 'احفظ المعلومات المهمة على هذا الهاتف', currency: 'حاسبة العملات', currencyHint: 'الريال السعودي ⇄ الرينغيت الماليزي',
    saved: 'تم حفظ الملف على هذا الجهاز', notReady: 'الملف غير مكتمل', ready: 'ملف السلامة جاهز', back: 'رجوع', save: 'حفظ الملف', setupTitle: 'إعداد TEMAN للوالد / الوالدة', setupIntro: 'أدخل المعلومات التي تساعد عند الضياع أو الانفصال عن المجموعة أو الحاجة إلى مساعدة.',
    name: 'الاسم الكامل', preferred: 'الاسم المفضل', makkah: 'فندق مكة', madinah: 'فندق المدينة', makkahAddress: 'عنوان / موقع فندق مكة', madinahAddress: 'عنوان / موقع فندق المدينة',
    groupCode: 'رمز المجموعة', bus: 'رقم الحافلة', mutawwif: 'اسم المطوف', mutawwifPhone: 'هاتف المطوف', family: 'اسم فرد الأسرة', familyPhone: 'هاتف الأسرة', crisis: 'ماذا حدث؟',
    lost: 'أنا ضائع', lostHint: 'اعرض شاشة المساعدة للموظف', unwell: 'أنا مريض', unwellHint: 'اطلب مساعدة طبية وتواصل مع شخص موثوق', busLost: 'لا أجد الحافلة', busLostHint: 'اعرض رقم الحافلة والمجموعة وبيانات المطوف',
    callGuide: 'اتصل بالمطوف', callFamily: 'اتصل بالأسرة', showCard: 'اعرض هذه الشاشة', openMap: 'افتح موقع الفندق', speakArabic: 'تشغيل العربية',
    translateTitle: 'تحدث. TEMAN يساعد في الترجمة.', translateIntro: 'اختر عبارة مهمة وشغّل النسخة العربية بصوت مرتفع للموظف أو لمن حولك.', choosePhrase: 'اختر العبارة',
    phraseLost: 'أنا ضائع وأريد العودة إلى الفندق.', phraseBus: 'لا أجد حافلة مجموعتي.', phraseSick: 'أنا مريض وأحتاج إلى مساعدة.', phraseGuide: 'يرجى الاتصال بالمطوف.',
    guideTitle: 'دليل عبادة مبسط', guideNote: 'مرجع مختصر للتذكير. اتبع إرشادات المطوف والجهات الشرعية الموثوقة في مسائل العبادة.',
    currentCity: 'الموقع الحالي', makkahCity: 'مكة', madinahCity: 'المدينة', locationHint: 'اختر المدينة التي أنت فيها الآن ليعرض TEMAN الفندق الصحيح.',
    editProfile: 'أكمل ملف الحاج أو المعتمر أولاً لاستخدام هذه الوظيفة.', selectedIssue: 'المساعدة المختارة', online: 'متصل', offlineReady: 'جاهز دون اتصال',
    shareDetails: 'مشاركة تفاصيل المساعدة', copyDetails: 'نسخ التفاصيل', copied: 'تم نسخ التفاصيل',
    notesTitle: 'ملاحظات SATU', notesIntro: 'احفظ رقم الغرفة ونقطة التجمع ومعلومات الحافلة وأي ملاحظات مهمة. تحفظ الملاحظات على هذا الهاتف.',
    notesPlaceholder: 'مثال: التجمع عند البوابة 79 بعد العشاء…', saveNote: 'حفظ الملاحظة', noteSaved: 'تم حفظ الملاحظة على الجهاز',
    currencyTitle: 'حاسبة الريال والرينغيت', currencyIntro: 'حاسبة بسيطة تعمل دون اتصال. أدخل سعر الصرف الحالي من بنك أو صراف تثق به.',
    rateLabel: 'السعر: 1 ريال سعودي يساوي كم رينغيت؟', amountLabel: 'المبلغ', resultLabel: 'التقدير', sarToMyr: 'SAR → MYR', myrToSar: 'MYR → SAR',
    rateHelp: 'يتم حفظ السعر على هاتفك. تحقق منه وحدثه عند تغير سعر الصرف.',
    toolsTitle: 'أدوات السفر', toolsHint: 'افتح الأدوات المهمة دون ازدحام الشاشة.', offlineCardTool: 'البطاقة دون اتصال', offlineMapTool: 'الخريطة دون اتصال', readinessTool: 'الاستعداد', remindersTool: 'التذكيرات',
  },
} as const;

const PHRASES = [
  { key: 'phraseLost', ar: 'أنا ضائع وأريد العودة إلى فندقي. هل يمكنك مساعدتي؟', en: 'I am lost and want to return to my hotel. Could you help me?' },
  { key: 'phraseBus', ar: 'لم أتمكن من العثور على حافلة مجموعتي. هل يمكنك مساعدتي؟', en: 'I cannot find my group bus. Could you help me?' },
  { key: 'phraseSick', ar: 'أنا متعب ولا أشعر أنني بخير. أحتاج إلى مساعدة.', en: 'I feel unwell and need assistance.' },
  { key: 'phraseGuide', ar: 'من فضلك ساعدني في الاتصال بمسؤول مجموعتي.', en: 'Please help me contact my group leader.' },
] as const;

const EMERGENCY_MESSAGES: Record<EmergencyKind, { ar: string; en: string }> = {
  lost: {
    ar: 'أنا حاج أو معتمر وقد ضللت عن مجموعتي. الرجاء مساعدتي في العودة إلى فندقي والتواصل مع مسؤول مجموعتي.',
    en: 'I am a pilgrim and I am separated from my group. Please help me return to my hotel and contact my group leader.',
  },
  unwell: {
    ar: 'أنا حاج أو معتمر وأشعر بتوعك. الرجاء مساعدتي في الحصول على مساعدة طبية والتواصل مع مسؤول مجموعتي.',
    en: 'I am a pilgrim and I feel unwell. Please help me get medical assistance and contact my group leader.',
  },
  bus: {
    ar: 'أنا حاج أو معتمر ولم أجد حافلة مجموعتي. الرجاء مساعدتي في العثور على مجموعتي والتواصل مع مسؤولها.',
    en: 'I am a pilgrim and I cannot find my group bus. Please help me find my group and contact my group leader.',
  },
};

const GUIDE: Record<Locale, Array<{ title: string; body: string }>> = {
  ms: [
    { title: 'Ihram', body: 'Niat, pakaian ihram dan larangan ihram.' },
    { title: 'Tawaf', body: 'Tujuh pusingan mengelilingi Kaabah mengikut panduan yang betul.' },
    { title: "Sa'i", body: 'Safa ke Marwah sebanyak tujuh perjalanan.' },
    { title: 'Tahallul', body: 'Bercukur atau bergunting mengikut panduan yang sah.' },
  ],
  en: [
    { title: 'Ihram', body: 'Intention, ihram clothing, and the restrictions of ihram.' },
    { title: 'Tawaf', body: 'Seven circuits around the Kaabah following the proper guidance.' },
    { title: "Sa'i", body: 'Seven journeys between Safa and Marwah.' },
    { title: 'Tahallul', body: 'Shave or trim the hair according to the proper guidance.' },
  ],
  ar: [
    { title: 'الإحرام', body: 'النية ولباس الإحرام ومحظورات الإحرام.' },
    { title: 'الطواف', body: 'سبعة أشواط حول الكعبة وفق الإرشادات الصحيحة.' },
    { title: 'السعي', body: 'سبعة أشواط بين الصفا والمروة.' },
    { title: 'التحلل', body: 'الحلق أو التقصير وفق الإرشادات الشرعية.' },
  ],
};

function loadProfile(): Profile {
  try {
    const saved = { ...EMPTY, ...JSON.parse(localStorage.getItem('teman-profile') || '{}') } as Profile;
    if (saved.hotelAddress && saved.hotelMakkah && !saved.hotelAddressMakkah) saved.hotelAddressMakkah = saved.hotelAddress;
    if (saved.hotelAddress && saved.hotelMadinah && !saved.hotelAddressMadinah) saved.hotelAddressMadinah = saved.hotelAddress;
    return saved;
  } catch {
    return EMPTY;
  }
}

function loadCity(): City {
  return localStorage.getItem('teman-city') === 'madinah' ? 'madinah' : 'makkah';
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem('teman-locale') as Locale) || 'ms');
  const [page, setPage] = useState<Page>('home');
  const [accountUser, setAccountUser] = useState<User | null>(null);
  const [demoActive, setDemoActive] = useState(false);
  const [isTemanAdmin, setIsTemanAdmin] = useState(false);
  const [authMode, setAuthMode] = useState<'register' | 'login' | 'reset' | 'new-password'>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => { if (mounted) setAccountUser(data.user); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { setAccountUser(session?.user ?? null); if (event === 'PASSWORD_RECOVERY') { setAuthMode('new-password'); setPage('account'); } });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!supabase || !accountUser) { setIsTemanAdmin(false); return; }
    let active = true;
    void supabase.from('teman_admins').select('user_id').eq('user_id', accountUser.id).maybeSingle()
      .then(({ data, error }) => { if (active) setIsTemanAdmin(!error && !!data); });
    return () => { active = false; };
  }, [accountUser]);
  useEffect(() => {
    const publicPages: Page[] = ['home','account'];
    if (!publicPages.includes(page) && !accountUser && !demoActive) setPage('home');
    if (page === 'admin' && !isTemanAdmin) setPage('home');
  }, [page, accountUser, demoActive, isTemanAdmin]);
  useEffect(() => {
    if (!accountUser || !supabase) return;
    let active = true;
    void supabase.from('teman_profiles').select('pilgrim_details').eq('user_id', accountUser.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active || error || !data?.pilgrim_details || typeof data.pilgrim_details !== 'object') return;
        const remote = { ...EMPTY, ...data.pilgrim_details } as Profile;
        setProfile(remote); setDraft(remote);
      });
    return () => { active = false; };
  }, [accountUser]);
  const [profile, setProfile] = useState<Profile>(loadProfile);
  const [draft, setDraft] = useState<Profile>(profile);
  const [city, setCityState] = useState<City>(loadCity);
  const [emergencyKind, setEmergencyKind] = useState<EmergencyKind>('lost');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [notes, setNotes] = useState(() => localStorage.getItem('teman-notes') || '');
  const [noteSaved, setNoteSaved] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(() => localStorage.getItem('teman-sar-myr-rate') || '');
  const [currencyAmount, setCurrencyAmount] = useState('100');
  const [currencyDirection, setCurrencyDirection] = useState<CurrencyDirection>('sar-myr');
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const t = COPY[locale];
  const rtl = locale === 'ar';

  const hotel = city === 'makkah' ? profile.hotelMakkah : profile.hotelMadinah;
  const hotelAddress = city === 'makkah' ? (profile.hotelAddressMakkah || profile.hotelAddress) : (profile.hotelAddressMadinah || profile.hotelAddress);
  const hasAnyHotel = Boolean(profile.hotelMakkah || profile.hotelMadinah);
  const ready = Boolean(profile.pilgrimName && hasAnyHotel && profile.mutawwifPhone && profile.familyPhone);
  const selectedPhrase = PHRASES[phraseIndex];
  const emergencyMessage = EMERGENCY_MESSAGES[emergencyKind];
  const emergencyLabel = useMemo(() => ({ lost: t.lost, unwell: t.unwell, bus: t.busLost }[emergencyKind]), [emergencyKind, t]);
  const currencyResult = useMemo(() => {
    const amount = Number.parseFloat(currencyAmount);
    const rate = Number.parseFloat(exchangeRate);
    if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) return null;
    return currencyDirection === 'sar-myr' ? amount * rate : amount / rate;
  }, [currencyAmount, exchangeRate, currencyDirection]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  }, [locale, rtl]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const submitAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthMessage('');
    if (!supabase) { setAuthMessage('Account service is not configured. Essential tools remain available.'); return; }
    setAuthBusy(true);
    try {
      if (authMode === 'new-password') {
        const { error } = await supabase.auth.updateUser({ password: authPassword });
        if (error) throw error;
        setAuthMessage(locale === 'ar' ? 'تم تحديث كلمة المرور.' : locale === 'en' ? 'Password updated.' : 'Kata laluan dikemas kini.');
        setAuthMode('login');
      } else if (authMode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), { redirectTo: window.location.origin });
        if (error) throw error;
        setAuthMessage(locale === 'ar' ? 'تحقق من بريدك الإلكتروني.' : locale === 'en' ? 'Check your email for password recovery instructions.' : 'Semak e-mel untuk arahan pemulihan kata laluan.');
      } else if (authMode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(), password: authPassword,
          options: { emailRedirectTo: window.location.origin, data: { full_name: authName.trim(), product: 'teman' } }
        });
        if (error) throw error;
        setAuthMessage(locale === 'ar' ? 'تحقق من بريدك الإلكتروني لتأكيد حسابك.' : locale === 'en' ? 'Check your email to confirm your account before signing in.' : 'Semak e-mel untuk mengesahkan akaun sebelum log masuk.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
        if (error) throw error;
        setDemoActive(false);setPage('app');
      }
    } catch (error) { setAuthMessage(error instanceof Error ? error.message : 'Account request failed'); }
    finally { setAuthBusy(false); }
  };
  const setLang = (next: Locale) => {
    setLocale(next);
    localStorage.setItem('teman-locale', next);
  };

  const setCity = (next: City) => {
    setCityState(next);
    localStorage.setItem('teman-city', next);
  };

  const saveProfile = async () => {
    const cleaned: Profile = {
      ...draft,
      pilgrimName: draft.pilgrimName.trim(),
      preferredName: draft.preferredName.trim(),
      hotelMakkah: draft.hotelMakkah.trim(),
      hotelMadinah: draft.hotelMadinah.trim(),
      hotelAddressMakkah: draft.hotelAddressMakkah.trim(),
      hotelAddressMadinah: draft.hotelAddressMadinah.trim(),
      groupCode: draft.groupCode.trim(),
      busNumber: draft.busNumber.trim(),
      mutawwifName: draft.mutawwifName.trim(),
      mutawwifPhone: draft.mutawwifPhone.trim(),
      familyName: draft.familyName.trim(),
      familyPhone: draft.familyPhone.trim(),
    };
    setProfile(cleaned);
    setDraft(cleaned);
    if (!demoActive) localStorage.setItem('teman-profile', JSON.stringify(cleaned));
    if (!demoActive && supabase && accountUser) {
      const { error } = await supabase.from('teman_profiles').upsert({
        user_id: accountUser.id, display_name: cleaned.pilgrimName,
        preferred_language: locale, pilgrim_details: cleaned, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) { setAuthMessage(error.message); setPage('account'); return; }
    }
    setPage('app');
  };

  const saveNotes = () => {
    if (!demoActive) localStorage.setItem('teman-notes', notes);
    setNoteSaved(true);
    window.setTimeout(() => setNoteSaved(false), 2200);
  };

  const updateRate = (value: string) => {
    setExchangeRate(value);
    if (value) localStorage.setItem('teman-sar-myr-rate', value);
    else localStorage.removeItem('teman-sar-myr-rate');
  };

  const speak = (text: string, lang = 'ar-SA') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

  const phone = (number: string) => {
    if (!number) return;
    const cleaned = number.trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    if (cleaned) window.location.href = `tel:${cleaned}`;
  };

  const openHotel = () => {
    const query = [hotel, hotelAddress].filter(Boolean).join(' ');
    if (!query) {
      setDraft(profile);
      setPage('setup');
      return;
    }
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
  };

  const chooseEmergency = (kind: EmergencyKind) => {
    setEmergencyKind(kind);
    setShareState('idle');
    window.setTimeout(() => document.getElementById('help-card')?.scrollIntoView({ block: 'start' }), 0);
  };

  const emergencyText = () => [
    'TEMAN Haramain by TGPU',
    emergencyLabel,
    emergencyMessage.en,
    `City: ${city === 'makkah' ? 'Makkah' : 'Madinah'}`,
    `Hotel: ${hotel || '—'}${hotelAddress ? ` — ${hotelAddress}` : ''}`,
    `Group: ${profile.groupCode || '—'}${profile.busNumber ? ` • Bus ${profile.busNumber}` : ''}`,
    `Mutawwif: ${profile.mutawwifName || '—'} ${profile.mutawwifPhone || ''}`.trim(),
    `Family: ${profile.familyName || '—'} ${profile.familyPhone || ''}`.trim(),
  ].join('\n');

  const shareEmergency = async () => {
    const text = emergencyText();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TEMAN Haramain', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareState('copied');
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareState('copied');
      } catch {
        setShareState('idle');
      }
    }
  };

  const copyEmergency = async () => {
    try {
      await navigator.clipboard.writeText(emergencyText());
      setShareState('copied');
      window.setTimeout(() => setShareState('idle'), 2200);
    } catch {
      setShareState('idle');
    }
  };

  const field = (key: keyof Profile, label: string, placeholder = '') => {
    const isPhone = key === 'mutawwifPhone' || key === 'familyPhone';
    return (
      <label className="field">
        <span>{label}</span>
        <input
          value={draft[key]}
          placeholder={placeholder}
          type={isPhone ? 'tel' : 'text'}
          inputMode={isPhone ? 'tel' : undefined}
          autoComplete="off"
          onChange={e => setDraft({ ...draft, [key]: e.target.value })}
        />
      </label>
    );
  };

  const citySelector = (
    <section className="cityPanel" aria-label={t.currentCity}>
      <div className="cityHeading"><div><strong>{t.currentCity}</strong><span>{t.locationHint}</span></div><MapPin size={24}/></div>
      <div className="citySwitch">
        <button type="button" className={city === 'makkah' ? 'active' : ''} aria-pressed={city === 'makkah'} onClick={() => setCity('makkah')}>{t.makkahCity}</button>
        <button type="button" className={city === 'madinah' ? 'active' : ''} aria-pressed={city === 'madinah'} onClick={() => setCity('madinah')}>{t.madinahCity}</button>
      </div>
    </section>
  );

  const openUtility = (selector: string) => {
    document.querySelector<HTMLButtonElement>(selector)?.click();
  };

  const back = <button type="button" className="back" onClick={() => setPage('home')}><ArrowLeft size={22} /> {t.back}</button>;

  const bottomNav = <nav className="teman-bottom-nav" aria-label="TEMAN navigation">
    <button type="button" className={page === 'home' ? 'active' : ''} onClick={() => setPage('home')}><Home/><span>{locale === 'ar' ? 'الرئيسية' : locale === 'en' ? 'Home' : 'Utama'}</span></button>
    <button type="button" className={page === 'emergency' ? 'active' : ''} onClick={() => setPage('emergency')}><ShieldCheck/><span>{locale === 'ar' ? 'مساعدة' : locale === 'en' ? 'Help' : 'Bantuan'}</span></button>
    <button type="button" className={page === 'translate' ? 'active' : ''} onClick={() => setPage('translate')}><Languages/><span>{locale === 'ar' ? 'ترجمة' : locale === 'en' ? 'Translate' : 'Terjemah'}</span></button>
    <button type="button" className={page === 'ibadah' ? 'active' : ''} onClick={() => setPage('ibadah')}><UserRound/><span>{locale === 'ar' ? 'عبادة' : 'Ibadah'}</span></button>
    <button type="button" className={page === 'setup' ? 'active' : ''} onClick={() => { setDraft(profile); setPage('setup'); }}><UserRound/><span>{locale === 'ar' ? 'الملف' : locale === 'en' ? 'Profile' : 'Profil'}</span></button>
  </nav>;

  return <div className="shell" dir={rtl ? 'rtl' : 'ltr'}>
    <header className="topbar">
      <div className="brand"><button type="button" className="mark" onClick={() => setPage('home')} aria-label={locale === 'ar' ? 'الصفحة الرئيسية' : locale === 'en' ? 'Home' : 'Utama'}><span aria-hidden="true">T</span></button><div><strong>TEMAN Haramain</strong><span>by TGPU</span></div></div>
      <div className="langs" aria-label="Language selector">
        <button type="button" aria-pressed={locale === 'ms'} className={locale === 'ms' ? 'active' : ''} onClick={() => setLang('ms')}>BM</button>
        <button type="button" aria-pressed={locale === 'ar'} className={locale === 'ar' ? 'active' : ''} onClick={() => setLang('ar')}>العربية</button>
        <button type="button" aria-pressed={locale === 'en'} className={locale === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
      </div>
    </header>

    {page === 'home' && <main className="temanPublicHome">
      <section className="temanLandingHero" aria-label="TEMAN Haramain">
        <div className="temanLandingBadge">TEMAN Haramain · TGPU Digital Ecosystem</div>
        <div className="temanLandingColumns"><div>
          <h1>{locale === 'ar' ? 'رحلتك المباركة تبدأ هنا' : locale === 'en' ? 'Your Sacred Journey Starts Here' : 'Perjalanan Ibadah Anda Bermula Di Sini'}</h1>
          <h2>{locale === 'ar' ? 'رفيقك الرقمي للحج والعمرة' : locale === 'en' ? 'Your Digital Companion for Hajj & Umrah' : 'Teman Digital Haji & Umrah Anda'}</h2>
          <p>{locale === 'ar' ? 'مساعدة عملية للحجاج والمعتمرين والعائلات، باللغات الملايوية والإنجليزية والعربية.' : locale === 'en' ? 'Pilgrimage guidance, Arabic assistance and family-focused tools in one accessible experience.' : 'Panduan ibadah, bantuan bahasa Arab dan kemudahan keluarga dalam satu pengalaman yang mudah.'}</p>
          <div className="temanLandingActions">
            <button type="button" className="temanLandingPrimary" onClick={() => { setDemoActive(false);setAuthMode('register');setPage('account'); }}>{locale === 'ar' ? 'أنشئ ملفك الشخصي' : locale === 'en' ? 'Create Your Profile' : 'Cipta Profil Anda'}</button>
            <button type="button" className="temanLandingSecondary" onClick={() => { setDemoActive(true);setProfile(EMPTY);setDraft(EMPTY);setNotes('');setPage('app'); }}>{locale === 'ar' ? 'جرب النسخة التجريبية' : locale === 'en' ? 'Try Demo' : 'Cuba Demo'}</button>
            <button type="button" className="temanLandingSecondary" onClick={() => {setDemoActive(false);setAuthMode('login');setPage('account');}}>{locale === 'ar' ? 'تسجيل الدخول' : locale === 'en' ? 'Sign In' : 'Log Masuk'}</button>
          </div>
          <p className="temanLandingNote">{locale === 'ar' ? 'التسجيل الأساسي مجاني. خدمات VIP اختيارية قيد التطوير.' : locale === 'en' ? 'Free essential access. Optional VIP services are planned.' : 'Akses asas percuma. Perkhidmatan VIP pilihan sedang dirancang.'}</p>
        </div><div className="temanLandingVisual" aria-hidden="true"><div className="temanLandingIcon">☪</div><strong>TEMAN Haramain</strong><span>Hajj · Umrah · Family</span></div></div>
      </section>
      <section className="temanLandingFeatures">
        <article><h3>{locale === 'ar' ? 'إرشاد الحجاج' : locale === 'en' ? 'Pilgrim Guidance' : 'Panduan Jemaah'}</h3><p>{locale === 'ar' ? 'معلومات عملية للحج والعمرة' : locale === 'en' ? 'Practical information for your journey' : 'Maklumat praktikal untuk perjalanan ibadah'}</p></article>
        <article><h3>{locale === 'ar' ? 'مساعدة عربية' : locale === 'en' ? 'Arabic Assistance' : 'Bantuan Bahasa Arab'}</h3><p>{locale === 'ar' ? 'عبارات مفيدة أثناء السفر' : locale === 'en' ? 'Helpful phrases for everyday situations' : 'Frasa berguna semasa perjalanan'}</p></article>
        <article><h3>{locale === 'ar' ? 'دعم الأسرة' : locale === 'en' ? 'Family Support' : 'Sokongan Keluarga'}</h3><p>{locale === 'ar' ? 'أدوات لتنظيم التواصل' : locale === 'en' ? 'Tools to help families stay organised' : 'Kemudahan untuk keluarga kekal teratur'}</p></article>
      </section>
      {isTemanAdmin && <button type="button" onClick={() => setPage('admin')}>{locale === 'ar' ? 'لوحة الإدارة' : locale === 'en' ? 'Admin Dashboard' : 'Papan Pemuka Admin'}</button>}
    </main>}

    {page === 'app' && <main className="page">
      <section className="sectionHead"><h1>{locale === 'ar' ? 'مساعد الحجاج' : locale === 'en' ? 'Pilgrim Companion' : 'Teman Jemaah'}</h1>
      <p>{demoActive ? (locale === 'ar' ? 'وضع تجريبي — لا تستخدم بيانات حقيقية.' : locale === 'en' ? 'Demo mode — do not enter real personal information.' : 'Mod demo — jangan masukkan maklumat peribadi sebenar.') : (locale === 'ar' ? 'مرحباً بعودتك' : locale === 'en' ? 'Welcome back' : 'Selamat kembali')}</p></section>
      <div className="temanAppChoices">
        <button type="button" onClick={() => setPage('translate')}>{locale === 'ar' ? 'مساعدة عربية' : locale === 'en' ? 'Arabic Assistance' : 'Bantuan Arab'}</button>
        <button type="button" onClick={() => setPage('emergency')}>{locale === 'ar' ? 'مساعدة الطوارئ' : locale === 'en' ? 'Emergency Information' : 'Maklumat Kecemasan'}</button>
        <button type="button" onClick={() => setPage('ibadah')}>{locale === 'ar' ? 'العبادة' : locale === 'en' ? 'Ibadah' : 'Ibadah'}</button>
        <button type="button" onClick={() => {setDraft(profile);setPage('setup')}}>{locale === 'ar' ? 'ملف الحاج' : locale === 'en' ? 'Pilgrim Profile' : 'Profil Jemaah'}</button>
        <button type="button" onClick={() => {setDemoActive(false);setProfile(loadProfile());setNotes(localStorage.getItem('teman-notes') || '');setPage('home')}}>{locale === 'ar' ? 'إنهاء العرض' : locale === 'en' ? 'Exit to Homepage' : 'Kembali ke Laman Utama'}</button>
      </div>
    </main>}

    {page === 'admin' && isTemanAdmin && <main className="page">{back}<section className="sectionHead"><h1>TEMAN Admin · TGPU Digital</h1><p>{accountUser?.email}</p></section><p>{locale === 'ar' ? 'الوصول مقيد بمسؤولي TEMAN المعتمدين.' : locale === 'en' ? 'Restricted to approved TEMAN administrators. Account management tools are pending verification.' : 'Khusus untuk pentadbir TEMAN yang diluluskan. Alat pengurusan masih menunggu pengesahan.'}</p></main>}

    {page === 'account' && <main className="page">{back}
      <section className="sectionHead"><h1>{locale === 'ar' ? 'حساب TEMAN' : locale === 'en' ? 'Your TEMAN Account' : 'Akaun TEMAN Anda'}</h1>
      <p>{locale === 'ar' ? 'التسجيل مجاني. الخدمات الأساسية متاحة دون حساب.' : locale === 'en' ? 'Registration is free. Essential assistance remains available without an account.' : 'Pendaftaran percuma. Bantuan asas kekal tersedia tanpa akaun.'}</p></section>
      {accountUser ? <div className="temanAccountPanel"><p>{accountUser.email}</p>
        <button type="button" className="temanLandingPrimary" onClick={() => {setDemoActive(false);setDraft(profile);setPage('app')}}>{locale === 'ar' ? 'افتح ملفك' : locale === 'en' ? 'Open Pilgrim Profile' : 'Buka Profil Jemaah'}</button>
        <button type="button" onClick={async () => { await supabase?.auth.signOut(); setPage('home'); }}>{locale === 'ar' ? 'تسجيل الخروج' : locale === 'en' ? 'Sign Out' : 'Log Keluar'}</button>
      </div> : <form className="temanAccountPanel" onSubmit={submitAccount}>
        <div className="temanAccountTabs">
          <button type="button" aria-pressed={authMode === 'register'} onClick={() => {setAuthMode('register');setAuthMessage('')}}>{locale === 'ar' ? 'إنشاء حساب' : locale === 'en' ? 'Register' : 'Daftar'}</button>
          <button type="button" aria-pressed={authMode === 'login'} onClick={() => {setAuthMode('login');setAuthMessage('')}}>{locale === 'ar' ? 'تسجيل الدخول' : locale === 'en' ? 'Sign In' : 'Log Masuk'}</button>
        </div>
        {authMode === 'register' && <label>{locale === 'ar' ? 'الاسم' : locale === 'en' ? 'Full name' : 'Nama penuh'}<input required autoComplete="name" value={authName} onChange={e=>setAuthName(e.target.value)} maxLength={120}/></label>}
        <label>{locale === 'ar' ? 'البريد الإلكتروني' : locale === 'en' ? 'Email' : 'E-mel'}<input required type="email" autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/></label>
        {authMode !== 'reset' && <label>{locale === 'ar' ? 'كلمة المرور' : locale === 'en' ? 'Password (at least 8 characters)' : 'Kata laluan (minimum 8 aksara)'}<input required type="password" minLength={8} autoComplete={authMode === 'register' || authMode === 'new-password' ? 'new-password' : 'current-password'} value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/></label>}
        <button type="submit" disabled={authBusy || !supabase} className="temanLandingPrimary">{authBusy ? '…' : authMode === 'new-password' ? (locale === 'ar' ? 'تحديث كلمة المرور' : locale === 'en' ? 'Set New Password' : 'Tetapkan Kata Laluan Baharu') : authMode === 'reset' ? (locale === 'ar' ? 'إرسال رابط الاستعادة' : locale === 'en' ? 'Send Recovery Email' : 'Hantar E-mel Pemulihan') : authMode === 'register' ? (locale === 'ar' ? 'سجل مجانا' : locale === 'en' ? 'Create Free Account' : 'Cipta Akaun Percuma') : (locale === 'ar' ? 'دخول' : locale === 'en' ? 'Sign In' : 'Log Masuk')}</button>
        <button type="button" className="temanAccountLink" onClick={() => {setAuthMode('reset');setAuthMessage('')}}>{locale === 'ar' ? 'نسيت كلمة المرور؟' : locale === 'en' ? 'Forgot password?' : 'Lupa kata laluan?'}</button>
        {authMessage && <p role="status">{authMessage}</p>}
      </form>}
    </main>}
    {page === 'setup' && <main className="page">{back}<section className="sectionHead"><h1>{t.setupTitle}</h1><p>{t.setupIntro}</p></section>
      <div className="form">
        {field('pilgrimName', t.name)}{field('preferredName', t.preferred)}
        {field('hotelMakkah', t.makkah)}{field('hotelAddressMakkah', t.makkahAddress)}
        {field('hotelMadinah', t.madinah)}{field('hotelAddressMadinah', t.madinahAddress)}
        {field('groupCode', t.groupCode)}{field('busNumber', t.bus)}{field('mutawwifName', t.mutawwif)}{field('mutawwifPhone', t.mutawwifPhone, '+966...')}{field('familyName', t.family)}{field('familyPhone', t.familyPhone, '+60...')}
      </div>
      <button type="button" className="primary" onClick={saveProfile}>{t.save} →</button>
    </main>}

    {page === 'emergency' && <main className="page emergencyPage">{back}<section className="sectionHead"><h1>{t.crisis}</h1><p>{t.helpHint}</p></section>
      {citySelector}
      <div className="emergencyChoices" role="group" aria-label={t.crisis}>
        <button type="button" className={`action emergencyChoice ${emergencyKind === 'lost' ? 'selected' : ''}`} aria-pressed={emergencyKind === 'lost'} onClick={() => chooseEmergency('lost')}><MapPin size={32}/><div><strong>{t.lost}</strong><span>{t.lostHint}</span></div><b aria-hidden="true">→</b></button>
        <button type="button" className={`action emergencyChoice ${emergencyKind === 'unwell' ? 'selected' : ''}`} aria-pressed={emergencyKind === 'unwell'} onClick={() => chooseEmergency('unwell')}><AlertTriangle size={30}/><div><strong>{t.unwell}</strong><span>{t.unwellHint}</span></div><b aria-hidden="true">→</b></button>
        <button type="button" className={`action emergencyChoice ${emergencyKind === 'bus' ? 'selected' : ''}`} aria-pressed={emergencyKind === 'bus'} onClick={() => chooseEmergency('bus')}><Bus size={30}/><div><strong>{t.busLost}</strong><span>{profile.busNumber || profile.groupCode || t.busLostHint}</span></div><b aria-hidden="true">→</b></button>
      </div>
      <div className="contactRow"><button type="button" disabled={!profile.mutawwifPhone} onClick={() => phone(profile.mutawwifPhone)}><Phone/> {t.callGuide}</button><button type="button" disabled={!profile.familyPhone} onClick={() => phone(profile.familyPhone)}><Phone/> {t.callFamily}</button></div>
      {!profile.mutawwifPhone && !profile.familyPhone && <p className="assistNote">{t.editProfile}</p>}
      <section className="helpCard" id="help-card" aria-live="polite">
        <div className="helpCardHead"><span className="cardLabel">{t.showCard}</span><strong>{t.selectedIssue}: {emergencyLabel}</strong></div>
        <p className="arabic">{emergencyMessage.ar}</p><p>{emergencyMessage.en}</p>
        <div className="facts">
          <div><span>CITY / المدينة</span><strong>{city === 'makkah' ? t.makkahCity : t.madinahCity}</strong></div>
          <div><span>HOTEL / الفندق</span><strong>{hotel || '—'}</strong>{hotelAddress && <small>{hotelAddress}</small>}</div>
          <div><span>GROUP / المجموعة</span><strong>{profile.groupCode || '—'} {profile.busNumber ? `• Bus ${profile.busNumber}` : ''}</strong></div>
          <div><span>MUTAWWIF / مسؤول المجموعة</span><strong>{profile.mutawwifName || '—'} {profile.mutawwifPhone}</strong></div>
        </div>
        <div className="contactRow"><button type="button" onClick={() => speak(emergencyMessage.ar)}><Volume2/> {t.speakArabic}</button><button type="button" disabled={!hotel && !hotelAddress} onClick={openHotel}><MapPin/> {t.openMap}</button></div>
        <div className="shareRow"><button type="button" onClick={shareEmergency}><Share2/> {t.shareDetails}</button><button type="button" onClick={copyEmergency}>{shareState === 'copied' ? <CheckCircle2/> : <Copy/>} {shareState === 'copied' ? t.copied : t.copyDetails}</button></div>
      </section>
    </main>}

    {page === 'translate' && <main className="page">{back}<section className="sectionHead"><h1>{t.translateTitle}</h1><p>{t.translateIntro}</p></section>
      <div className="phraseList"><span>{t.choosePhrase}</span>{PHRASES.map((phrase, index) => <button type="button" key={phrase.key} className={index === phraseIndex ? 'selected' : ''} aria-pressed={index === phraseIndex} onClick={() => setPhraseIndex(index)}>{t[phrase.key]}</button>)}</div>
      <section className="translationCard"><span>العربية</span><p className="arabic">{selectedPhrase.ar}</p><button type="button" className="primary" onClick={() => speak(selectedPhrase.ar)}><Volume2/> {t.speakArabic}</button><span>English</span><p>{selectedPhrase.en}</p></section>
    </main>}

    {page === 'ibadah' && <main className="page">{back}<section className="sectionHead"><h1>{t.guideTitle}</h1><p>{t.guideNote}</p></section>
      <div className="guide">{GUIDE[locale].map((item, index) => <article key={item.title}><b>{index + 1}</b><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}</div>
    </main>}

    {page === 'family-ibadah' && <main className="page">{back}<FamilyIbadahHub locale={locale}/></main>}

    {page === 'notes' && <main className="page">{back}<section className="sectionHead"><h1>{t.notesTitle}</h1><p>{t.notesIntro}</p></section>
      <section className="toolCard notesCard">
        <label className="toolLabel" htmlFor="teman-notes">{t.notesTitle}</label>
        <textarea id="teman-notes" value={notes} onChange={e => { setNotes(e.target.value); setNoteSaved(false); }} placeholder={t.notesPlaceholder} rows={10}/>
        <button type="button" className="primary" onClick={saveNotes}>{noteSaved ? <CheckCircle2/> : <Save/>} {noteSaved ? t.noteSaved : t.saveNote}</button>
      </section>
    </main>}

    {page === 'currency' && <main className="page">{back}<section className="sectionHead"><h1>{t.currencyTitle}</h1><p>{t.currencyIntro}</p></section>
      <section className="toolCard currencyCard">
        <div className="directionSwitch" role="group" aria-label={t.currencyTitle}>
          <button type="button" className={currencyDirection === 'sar-myr' ? 'active' : ''} aria-pressed={currencyDirection === 'sar-myr'} onClick={() => setCurrencyDirection('sar-myr')}>{t.sarToMyr}</button>
          <button type="button" className={currencyDirection === 'myr-sar' ? 'active' : ''} aria-pressed={currencyDirection === 'myr-sar'} onClick={() => setCurrencyDirection('myr-sar')}>{t.myrToSar}</button>
        </div>
        <label className="currencyField"><span>{t.rateLabel}</span><div className="currencyInput"><b>1 SAR =</b><input type="number" min="0" step="0.001" inputMode="decimal" value={exchangeRate} onChange={e => updateRate(e.target.value)} placeholder="1.15"/><b>MYR</b></div><small>{t.rateHelp}</small></label>
        <label className="currencyField"><span>{t.amountLabel}</span><div className="currencyInput amountInput"><input type="number" min="0" step="0.01" inputMode="decimal" value={currencyAmount} onChange={e => setCurrencyAmount(e.target.value)} /><b>{currencyDirection === 'sar-myr' ? 'SAR' : 'MYR'}</b></div></label>
        <div className="quickAmounts" aria-label="Quick amounts">{[10, 50, 100, 500].map(value => <button type="button" key={value} onClick={() => setCurrencyAmount(String(value))}>{value}</button>)}</div>
        <div className="currencyResult" aria-live="polite"><span>{t.resultLabel}</span><strong>{currencyResult === null ? '—' : currencyResult.toLocaleString(locale === 'ar' ? 'ar-SA' : locale === 'ms' ? 'ms-MY' : 'en-US', { maximumFractionDigits: 2 })}</strong><b>{currencyDirection === 'sar-myr' ? 'MYR' : 'SAR'}</b></div>
      </section>
    </main>}
    {(accountUser || demoActive) && page !== 'home' && page !== 'account' && page !== 'admin' && bottomNav}
  </div>;
}
