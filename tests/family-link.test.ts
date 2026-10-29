import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { initFamilyLink } from '../src/family-link';

describe('family link local behavior', () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '<main class="page"><section class="hero"></section></main>';
    document.documentElement.lang = 'en';
    localStorage.setItem(
      'teman-profile',
      JSON.stringify({ pilgrimName: 'Pilgrim', hotelMakkah: 'Hotel A', groupCode: 'G1', busNumber: 'B1' }),
    );
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false });
  });

  it('keeps check-in queue available offline and preserves newest-first pending semantics', () => {
    initFamilyLink();

    const trigger = document.querySelector<HTMLButtonElement>('.temanFamilyTrigger');
    expect(trigger).toBeTruthy();
    trigger?.click();

    document.querySelector<HTMLButtonElement>('[data-checkin="safe"]')?.click();
    document.querySelector<HTMLButtonElement>('[data-checkin="with-group"]')?.click();

    const checkins = JSON.parse(localStorage.getItem('teman.family.checkins.v1') || '[]') as Array<{
      status: string;
      synced?: boolean;
    }>;

    expect(checkins).toHaveLength(2);
    expect(checkins[0]?.status).toBe('with-group');
    expect(checkins[1]?.status).toBe('safe');
    expect(checkins.every(item => item.synced === false)).toBe(true);
  });
  it('shows safe manual fallback if a static preview returns HTML instead of the family API', async () => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<!doctype html><title>TEMAN</title>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })));

    initFamilyLink();
    document.querySelector<HTMLButtonElement>('.temanFamilyTrigger')?.click();
    document.querySelector<HTMLButtonElement>('[data-activate]')?.click();

    await vi.waitFor(() => {
      expect(document.querySelector('.familyMessage')?.textContent).toContain('Family cloud is unavailable');
    });
    expect(localStorage.getItem('teman.family.cloud.v1')).toBeNull();
    document.querySelector<HTMLButtonElement>('[data-checkin="safe"]')?.click();
    expect(localStorage.getItem('teman.family.checkins.v1')).toContain('"status":"safe"');
  });

  it('preserves Arabic emergency text width in the responsive RTL grid rules', () => {
    const css = readFileSync('src/styles.css', 'utf8');
    expect(css).toContain("[dir='rtl'] .action{grid-template-columns:38px minmax(0,1fr) 38px}");
    expect(css).toContain("[dir='rtl'] .action{grid-template-columns:34px minmax(0,1fr) 34px}");
    expect(css).toContain("[dir='rtl'] .action>div{min-width:0;width:100%}");
    expect(css).not.toContain("[dir='rtl'] .action>b{order:-1}");
  });

});
