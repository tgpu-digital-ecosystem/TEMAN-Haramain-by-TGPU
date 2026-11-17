import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ZaiLanding from './ZaiLanding';

describe('Z.ai TEMAN public landing integration', () => {
  const markup = renderToStaticMarkup(React.createElement(ZaiLanding, { onEnter: () => {} }));
  it('does not depend on expiring signed image URLs', () => {
    const source = readFileSync(new URL('./ZaiLanding.tsx', import.meta.url), 'utf8');
    expect(source).not.toContain('z-cdn-media.chatglm.cn');
    expect(source).not.toContain('auth_key=');
    expect(source).not.toContain('heroImage');
    expect(source).not.toContain('madinahImage');
  });
  it('keeps accessible responsive and RTL styling without remote hero dependencies', () => {
    const styles = readFileSync(new URL('./zai-landing.css', import.meta.url), 'utf8');
    expect(styles).toContain('.zai[dir=rtl]');
    expect(styles).toContain('@media(max-width:850px)');
    expect(styles).toContain('@media(max-width:420px)');
    expect(styles).toContain('.zai .zai-hero{');
    expect(styles).toContain('.zai .zai-about{');
    expect(styles).toContain('min-height:48px');
    expect(styles).not.toContain('z-cdn-media.chatglm.cn');
  });
  it('keeps public emergency contacts correct', () => {
    for (const number of ['911', '997', '998', '999', '937']) {
      expect(markup).toContain('href="tel:' + number + '"');
    }
    expect(markup).toContain('997 · Ambulance');
    expect(markup).toContain('998 · Civil Defense');
  });
  it('preserves guest entry and existing account route', () => {
    expect(markup).toContain('Gunakan TEMAN — Percuma');
    expect(markup).toContain('href="/account.html"');
  });
  it('contains the supplied Z.ai design sections and language controls', () => {
    expect(markup).toContain('id="features"');
    expect(markup).toContain('id="about"');
    expect(markup).toContain('aria-label="Language"');
    expect(markup).toContain('TEMAN Haramain');
    expect(markup).toContain('src="/teman-icon.svg"');
    expect(markup).toContain('aria-controls="teman-landing-navigation"');
  });
});
