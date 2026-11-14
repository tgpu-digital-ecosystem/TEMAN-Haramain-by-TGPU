import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/owner.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../public/owner.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

function setup(token?: string) {
  const dom = new JSDOM(html, { url: 'https://teman.tgpu.my/owner.html', runScripts: 'outside-only' });
  if (token) dom.window.sessionStorage.setItem('tgpu_digital_access_token', token);
  return dom;
}

describe('TEMAN Owner HQ real execution fail-closed', () => {
  it('denies a visitor without a session and never fetches', async () => {
    const dom = setup();
    const fetchMock = vi.fn();
    dom.window.fetch = fetchMock;
    dom.window.eval(script);
    await tick();
    expect(dom.window.document.getElementById('workspace')?.hidden).toBe(true);
    expect(dom.window.document.getElementById('denied')?.hidden).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    dom.window.close();
  });

  it('denies a valid user who is not in teman_admins', async () => {
    const dom = setup('test-session');
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'nonowner', email: 'guest@example.invalid' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    dom.window.fetch = fetchMock;
    dom.window.eval(script);
    await tick(); await tick();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(dom.window.document.getElementById('workspace')?.hidden).toBe(true);
    expect(dom.window.document.getElementById('denied')?.hidden).toBe(false);
    dom.window.close();
  });

  it('denies when the admin lookup fails', async () => {
    const dom = setup('test-session');
    dom.window.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-1' }) })
      .mockResolvedValueOnce({ ok: false });
    dom.window.eval(script);
    await tick(); await tick();
    expect(dom.window.document.getElementById('workspace')?.hidden).toBe(true);
    expect(dom.window.document.getElementById('denied')?.hidden).toBe(false);
    dom.window.close();
  });

  it('reveals preview only after both user and admin checks succeed', async () => {
    const dom = setup('test-session');
    dom.window.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'user-1', email: 'owner@example.invalid' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ user_id: 'user-1' }] });
    dom.window.eval(script);
    await tick(); await tick();
    expect(dom.window.document.getElementById('workspace')?.hidden).toBe(false);
    expect(dom.window.document.getElementById('denied')?.hidden).toBe(true);
    dom.window.close();
  });
});
