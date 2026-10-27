import { useState } from 'react';
import { BookOpen, ExternalLink, Globe2, ShieldCheck, UserRound } from 'lucide-react';
import {
  GLOBAL_GUIDANCE_COPY,
  GLOBAL_GUIDANCE_LANGUAGES,
  getGuidanceDirection,
  type CoreLocale,
  type OutreachLanguage,
} from './i18n/global-guidance';
import './global-pilgrim-help.css';

export function GlobalPilgrimHelp({
  locale,
  onPrepare,
  onIbadah,
  onPhrases,
}: {
  locale: CoreLocale;
  onPrepare: () => void;
  onIbadah: () => void;
  onPhrases: () => void;
}) {
  const [language, setLanguage] = useState<OutreachLanguage>(locale);
  const t = GLOBAL_GUIDANCE_COPY[language];

  return (
    <section className="globalPilgrimHelp" aria-labelledby="global-help-title">
      <div className="globalHelpKicker">
        <Globe2 aria-hidden="true" size={21} />
        <span>{locale === 'ar' ? 'لغات العالم' : locale === 'ms' ? 'BANTUAN PELBAGAI BAHASA' : 'MULTILINGUAL SUPPORT'}</span>
      </div>

      <div className="globalHelpInner" dir={getGuidanceDirection(language)} lang={language}>
        <h2 id="global-help-title">{t.title}</h2>
        <p>{t.intro}</p>

        <label className="globalHelpLanguage">
          {locale === 'ar' ? 'اختر اللغة' : locale === 'ms' ? 'Pilih bahasa panduan' : 'Choose guide language'}
          <select
            value={language}
            onChange={event => setLanguage(event.target.value as OutreachLanguage)}
            aria-label="Guide language"
          >
            {GLOBAL_GUIDANCE_LANGUAGES.map(item => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <ol className="globalHelpSteps">
          {t.steps.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              {step}
            </li>
          ))}
        </ol>

        <div className="globalHelpActions">
          <button type="button" onClick={onPrepare}>
            <UserRound size={19} aria-hidden="true" />
            {t.prepare}
          </button>
          <button type="button" onClick={onIbadah}>
            <BookOpen size={19} aria-hidden="true" />
            {t.ritual}
          </button>
          <button type="button" onClick={onPhrases}>
            <Globe2 size={19} aria-hidden="true" />
            {t.phrases}
          </button>
        </div>

        <div className="globalHelpOfficial">
          <ShieldCheck size={23} aria-hidden="true" />
          <div>
            <a href="https://my.gov.sa/en/services/2173544" target="_blank" rel="noopener noreferrer">
              {t.official} <ExternalLink size={15} aria-hidden="true" />
            </a>
            <p>{t.notice}</p>
          </div>
        </div>

        <p className="globalHelpPrivacy">{t.privacy}</p>
        <p className="globalHelpScope">
          TGPU TEMAN interface: BM · English · العربية. This international orientation is not a full translation of TEMAN’s emergency interface or religious instructions. Independent language review required.
        </p>
      </div>
    </section>
  );
}
