import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../worker/index';

const assets = { fetch: vi.fn(async () => new Response('asset')) };

afterEach(() => {
  vi.restoreAllMocks();
  assets.fetch.mockClear();
});

describe('Cloudflare family API proxy', () => {
  it('fails closed when the family API origin is not configured', async () => {
    const response = await worker.fetch(
      new Request('https://teman.example/api/family/status?family=abc'),
      { ASSETS: assets },
    );

    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(await response.json()).toMatchObject({ configurationRequired: true });
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it('proxies only the family route and enforces no-store on upstream responses', async () => {
    const upstreamFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=3600' },
      }),
    );

    const response = await worker.fetch(
      new Request('https://teman.example/api/family/status?family=abc', {
        headers: { 'x-teman-viewer-token': 'viewer-token' },
      }),
      { ASSETS: assets, FAMILY_API_ORIGIN: 'https://legacy.example.test/' },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(upstreamFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'https://legacy.example.test/api/family/status?family=abc',
      }),
      expect.objectContaining({ method: 'GET', redirect: 'manual' }),
    );
  });

  it('does not turn unsupported API paths into an upstream proxy', async () => {
    const upstreamFetch = vi.spyOn(globalThis, 'fetch');

    const response = await worker.fetch(
      new Request('https://teman.example/api/other'),
      { ASSETS: assets, FAMILY_API_ORIGIN: 'https://legacy.example.test' },
    );

    expect(response.status).toBe(404);
    expect(upstreamFetch).not.toHaveBeenCalled();
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it('serves non-API requests from Cloudflare assets', async () => {
    const response = await worker.fetch(
      new Request('https://teman.example/'),
      { ASSETS: assets },
    );

    expect(response.status).toBe(200);
    expect(assets.fetch).toHaveBeenCalledOnce();
  });
});
