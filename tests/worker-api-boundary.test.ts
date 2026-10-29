import { describe, expect, it, vi } from 'vitest';
import worker from '../worker/entry';

describe('TEMAN Cloudflare Worker API boundary', () => {
  it('fails closed for family API requests without configured storage', async () => {
    const assets = { fetch: vi.fn() };
    const request = new Request('https://preview.example/api/family/pair', { method: 'POST' });
    const response = await worker.fetch(request, { ASSETS: assets });
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ ok: false, configurationRequired: true });
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it('passes non-API pages to the existing static assets handler', async () => {
    const assets = { fetch: vi.fn().mockResolvedValue(new Response('TEMAN homepage', { status: 200 })) };
    const request = new Request('https://preview.example/');
    const response = await worker.fetch(request, { ASSETS: assets });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('TEMAN homepage');
    expect(assets.fetch).toHaveBeenCalledWith(request);
  });
});
