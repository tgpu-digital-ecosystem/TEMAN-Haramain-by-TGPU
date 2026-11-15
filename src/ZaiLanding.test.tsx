import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ZaiLanding from './ZaiLanding';

describe('Z.ai TEMAN public landing integration', () => {
  const markup = renderToStaticMarkup(React.createElement(ZaiLanding, { onEnter: () => {} }));
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
  it('requires permanent locally hosted landing imagery before release', () => {
    // This intentionally fails while the Z.ai landing references expiring signed CDN URLs.
    // Replace them with approved local assets, then keep this regression gate.
    expect(markup).not.toMatch(/z-cdn-media\\.chatglm\\.cn|auth_key=|[?&](?:token|signature|expires)=/i);
  });
});
