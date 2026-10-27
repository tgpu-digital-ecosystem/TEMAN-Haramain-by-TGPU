export type CoreLocale = 'ms' | 'en' | 'ar';
export type OutreachLanguage = CoreLocale | 'zh' | 'tr' | 'fr' | 'sw' | 'ur';
export type GuidanceDirection = 'ltr' | 'rtl';
export type GuidanceReleaseStatus = 'core-live' | 'orientation-only';

export type GlobalGuidanceCopy = {
  label: string;
  title: string;
  intro: string;
  steps: [string, string, string];
  official: string;
  notice: string;
  privacy: string;
  prepare: string;
  ritual: string;
  phrases: string;
};

export type GlobalGuidanceLanguage = {
  code: OutreachLanguage;
  label: string;
  direction: GuidanceDirection;
  status: GuidanceReleaseStatus;
};

export const GLOBAL_GUIDANCE_LANGUAGES: readonly GlobalGuidanceLanguage[] = [
  { code: 'ms', label: 'Bahasa Melayu', direction: 'ltr', status: 'core-live' },
  { code: 'en', label: 'English', direction: 'ltr', status: 'core-live' },
  { code: 'ar', label: 'العربية', direction: 'rtl', status: 'core-live' },
  { code: 'zh', label: '简体中文', direction: 'ltr', status: 'orientation-only' },
  { code: 'tr', label: 'Türkçe', direction: 'ltr', status: 'orientation-only' },
  { code: 'fr', label: 'Français', direction: 'ltr', status: 'orientation-only' },
  { code: 'sw', label: 'Kiswahili', direction: 'ltr', status: 'orientation-only' },
  { code: 'ur', label: 'اردو', direction: 'rtl', status: 'orientation-only' },
] as const;

export const GLOBAL_GUIDANCE_COPY: Record<OutreachLanguage, GlobalGuidanceCopy> = {
  ms: {
    label: 'Bahasa Melayu',
    title: 'Panduan global untuk jemaah',
    intro: 'Terus gunakan TEMAN untuk maklumat kecemasan dan alat peribadi di telefon. Untuk soalan pelbagai bahasa, rujuk Nusuk AI rasmi secara berasingan.',
    steps: ['Sediakan profil & nombor keluarga', 'Semak panduan ibadah yang sahih', 'Latih frasa bantuan mudah'],
    official: 'Ketahui tentang Nusuk AI rasmi',
    notice: 'Nusuk AI ialah perkhidmatan rasmi Kerajaan Arab Saudi, bukan ciri AI yang dihoskan oleh TGPU. Gunakan aplikasi Nusuk bagi mengaksesnya.',
    privacy: 'Jangan masukkan pasport, nombor telefon, data perubatan atau butiran profil TEMAN ke dalam perkhidmatan AI. Untuk kecemasan, minta bantuan manusia segera.',
    prepare: 'Sediakan profil',
    ritual: 'Panduan ibadah',
    phrases: 'Frasa bantuan',
  },
  en: {
    label: 'English',
    title: 'Global help for pilgrims',
    intro: 'Keep using TEMAN for emergency contacts and on-device travel tools. For questions in more languages, consult the separate official Nusuk AI service.',
    steps: ['Prepare family and hotel details', 'Review trusted pilgrimage guidance', 'Practise simple help phrases'],
    official: 'About official Nusuk AI',
    notice: 'Nusuk AI is an official Saudi government service, not AI hosted or integrated by TGPU. Open the Nusuk application to use it.',
    privacy: 'Do not enter passport, phone, medical or private TEMAN profile details into an AI service. For emergencies, seek immediate human assistance.',
    prepare: 'Prepare profile',
    ritual: 'Ibadah guide',
    phrases: 'Help phrases',
  },
  ar: {
    label: 'العربية',
    title: 'مساعدة عالمية لضيوف الرحمن',
    intro: 'استعمل TEMAN لأرقام الطوارئ والمعلومات المحفوظة على جهازك. للاستفسارات بلغات متعددة يمكنك مراجعة خدمة نسك للذكاء الاصطناعي الرسمية بصورة مستقلة.',
    steps: ['جهّز معلومات الفندق والأسرة', 'راجع إرشادات المناسك المعتمدة', 'تدرّب على عبارات المساعدة'],
    official: 'التعرّف على نسك AI الرسمية',
    notice: 'نسك AI خدمة حكومية سعودية رسمية، وليست نظام ذكاء اصطناعي مستضافًا من TGPU أو متصلًا بها. تُستخدم من تطبيق نسك.',
    privacy: 'لا تشارك رقم الجواز أو البيانات الطبية أو تفاصيل ملف TEMAN الخاص مع أي خدمة ذكاء اصطناعي. في الطوارئ اطلب المساعدة المباشرة.',
    prepare: 'إعداد الملف',
    ritual: 'دليل المناسك',
    phrases: 'عبارات المساعدة',
  },
  zh: {
    label: '简体中文',
    title: '朝觐与副朝旅客多语言帮助',
    intro: '继续使用 TEMAN 保存紧急联系人及旅程资料。如需其他语言的问答，可另行使用沙特官方 Nusuk AI 服务。',
    steps: ['准备家人和酒店信息', '查看可靠的朝觐指导资料', '学习求助常用短语'],
    official: '了解沙特官方 Nusuk AI',
    notice: 'Nusuk AI 是沙特官方服务，不属于 TGPU，也未与 TEMAN 集成。请在 Nusuk 应用中使用。',
    privacy: '请勿向 AI 输入护照、电话号码、医疗资料或 TEMAN 私人档案。遇到紧急情况请立即寻求真人帮助。',
    prepare: '准备个人资料',
    ritual: '朝觐指导',
    phrases: '求助短语',
  },
  tr: {
    label: 'Türkçe',
    title: 'Hac ve umre yolcularına çok dilli destek',
    intro: 'Acil durum bilgileri ve çevrimdışı araçlar için TEMAN uygulamasını kullanın. Çok dilli sorular için ayrı bir resmî hizmet olan Nusuk AI’ye başvurabilirsiniz.',
    steps: ['Aile ve otel bilgilerini hazırlayın', 'Güvenilir ibadet rehberlerini inceleyin', 'Temel yardım ifadelerini öğrenin'],
    official: 'Resmî Nusuk AI hakkında',
    notice: 'Nusuk AI, Suudi Arabistan’ın resmî hizmetidir; TGPU tarafından işletilmez veya TEMAN’a entegre değildir.',
    privacy: 'Pasaport, telefon, sağlık veya TEMAN profil bilgilerini yapay zekâya yazmayın. Acil durumda doğrudan insan yardımı isteyin.',
    prepare: 'Profil hazırlığı',
    ritual: 'İbadet rehberi',
    phrases: 'Yardım ifadeleri',
  },
  fr: {
    label: 'Français',
    title: 'Aide multilingue pour le Hajj et la Omra',
    intro: 'Utilisez TEMAN pour les coordonnées d’urgence et les outils enregistrés sur votre téléphone. Pour des questions en d’autres langues, consultez séparément le service officiel Nusuk AI.',
    steps: ['Préparer les contacts et les détails de l’hôtel', 'Consulter les informations officielles sur les rites', 'Apprendre des phrases utiles pour demander de l’aide'],
    official: 'Découvrir le service officiel Nusuk AI',
    notice: 'Nusuk AI est un service officiel saoudien, indépendant de TGPU et non intégré à TEMAN. Il est accessible via l’application Nusuk.',
    privacy: 'Ne saisissez pas de passeport, numéro de téléphone, données médicales ou profil privé TEMAN dans un service d’IA. En cas d’urgence, demandez une assistance humaine.',
    prepare: 'Préparer mon profil',
    ritual: 'Guide des rites',
    phrases: 'Phrases utiles',
  },
  sw: {
    label: 'Kiswahili',
    title: 'Msaada wa lugha nyingi kwa Hija na Umra',
    intro: 'Endelea kutumia TEMAN kwa mawasiliano ya dharura na taarifa zilizohifadhiwa kwenye simu. Kwa maswali ya lugha nyingine, tumia huduma rasmi ya Nusuk AI kando.',
    steps: ['Andaa taarifa za familia na hoteli', 'Soma mwongozo wa ibada kutoka vyanzo rasmi', 'Jifunze maneno rahisi ya kuomba msaada'],
    official: 'Kuhusu Nusuk AI rasmi',
    notice: 'Nusuk AI ni huduma rasmi ya Saudi Arabia; si AI ya TGPU na haijaunganishwa na TEMAN. Itumie kupitia programu ya Nusuk.',
    privacy: 'Usiweke taarifa za pasipoti, simu, afya au wasifu binafsi wa TEMAN kwenye AI. Katika dharura, omba msaada wa mtu mara moja.',
    prepare: 'Andaa wasifu',
    ritual: 'Mwongozo wa ibada',
    phrases: 'Maneno ya msaada',
  },
  ur: {
    label: 'اردو',
    title: 'حج اور عمرہ کے لیے کثیر لسانی رہنمائی',
    intro: 'ہنگامی رابطوں اور فون میں محفوظ سفری معلومات کے لیے TEMAN استعمال کریں۔ مزید زبانوں میں سوالات کے لیے الگ سے سرکاری Nusuk AI سروس سے رجوع کریں۔',
    steps: ['اہل خانہ اور ہوٹل کی تفصیلات تیار کریں', 'مستند حج و عمرہ رہنمائی دیکھیں', 'مدد مانگنے کے آسان جملے سیکھیں'],
    official: 'سرکاری Nusuk AI کے بارے میں',
    notice: 'Nusuk AI سعودی حکومت کی سرکاری سروس ہے۔ یہ TGPU کا نظام نہیں ہے اور TEMAN کے ساتھ منسلک نہیں۔ اسے Nusuk ایپ میں استعمال کریں۔',
    privacy: 'پاسپورٹ، فون، طبی معلومات یا TEMAN کی نجی تفصیلات کسی AI سروس میں درج نہ کریں۔ ہنگامی صورتحال میں فوری طور پر کسی شخص سے مدد لیں۔',
    prepare: 'پروفائل تیار کریں',
    ritual: 'عبادات کی رہنمائی',
    phrases: 'مدد کے جملے',
  },
};

export function getGuidanceDirection(language: OutreachLanguage): GuidanceDirection {
  return GLOBAL_GUIDANCE_LANGUAGES.find(item => item.code === language)?.direction ?? 'ltr';
}

export function getGuidanceStatus(language: OutreachLanguage): GuidanceReleaseStatus {
  return GLOBAL_GUIDANCE_LANGUAGES.find(item => item.code === language)?.status ?? 'orientation-only';
}
