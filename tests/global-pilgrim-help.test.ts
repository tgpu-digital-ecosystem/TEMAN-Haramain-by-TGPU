import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  GLOBAL_GUIDANCE_LANGUAGES,
  getGuidanceDirection,
  getGuidanceStatus,
} from '../src/i18n/global-guidance';

const app = readFileSync('src/App.tsx', 'utf8');
const help = readFileSync('src/global-pilgrim-help.tsx', 'utf8');
const registry = readFileSync('src/i18n/global-guidance.ts', 'utf8');
const styles = readFileSync('src/global-pilgrim-help.css', 'utf8');

describe('TEMAN multilingual guidance without compromising emergency safety', () => {
  it('places global help after immediate emergency action', () => {
    expect(app.indexOf('className="action emergency"')).toBeGreaterThan(0);
    expect(app.indexOf('<GlobalPilgrimHelp')).toBeGreaterThan(app.indexOf('className="action emergency"'));
  });

  it('links only to an independently named official AI source and keeps private profile separate', () => {
    expect(help).toContain('https://my.gov.sa/en/services/2173544');
    expect(registry).toContain('not AI hosted or integrated by TGPU');
    expect(help + registry).not.toMatch(/\b(?:fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|navigator\.geolocation)\s*\(/);
  });

  it('registers all eight guidance languages with explicit release status', () => {
    expect(GLOBAL_GUIDANCE_LANGUAGES.map(item => item.code)).toEqual([
      'ms',
      'en',
      'ar',
      'zh',
      'tr',
      'fr',
      'sw',
      'ur',
    ]);

    for (const code of ['ms', 'en', 'ar'] as const) {
      expect(getGuidanceStatus(code)).toBe('core-live');
    }

    for (const code of ['zh', 'tr', 'fr', 'sw', 'ur'] as const) {
      expect(getGuidanceStatus(code)).toBe('orientation-only');
    }
  });

  it('keeps Arabic and Urdu RTL while other guidance languages remain LTR', () => {
    expect(getGuidanceDirection('ar')).toBe('rtl');
    expect(getGuidanceDirection('ur')).toBe('rtl');
    expect(getGuidanceDirection('ms')).toBe('ltr');
    expect(getGuidanceDirection('zh')).toBe('ltr');
  });

  it('does not claim orientation-only languages are full TEMAN localization', () => {
    expect(help).toContain('not a full translation');
    expect(registry).toContain("status: 'orientation-only'");
  });

  it('keeps guidance senior-accessible and links to actual existing features', () => {
    expect(styles).toContain('min-height:53px');
    expect(help).toContain('onPrepare');
    expect(help).toContain('onIbadah');
    expect(help).toContain('onPhrases');
  });
});
