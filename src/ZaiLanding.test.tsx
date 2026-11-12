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
    expect(markup).toContain('Use TEMAN — Free Essentials');
    expect(markup).toContain('href="/account.html"');
  });
  it('contains the supplied Z.ai design sections and language controls', () => {
    expect(markup).toContain('id="features"');
    expect(markup).toContain('id="about"');
    expect(markup).toContain('aria-label="Language"');
    expect(markup).toContain('TEMAN Haramain');
  });
});
