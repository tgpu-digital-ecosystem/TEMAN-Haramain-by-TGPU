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

  it('scheduled cleanup is a no-op without a bound database', async () => {
    const assets = { fetch: vi.fn() };
    await expect(worker.scheduled({ scheduledTime: 1_780_000_000_000 }, { ASSETS: assets })).resolves.toBeUndefined();
    expect(assets.fetch).not.toHaveBeenCalled();
  });

  it('scheduled cleanup removes expired rows in child-first order', async () => {
    const sql: string[] = [];
    const db = {
      prepare: (query: string) => ({
        bind: (..._args: unknown[]) => ({
          query,
          run: async () => ({ meta: { changes: 1 } }),
        }),
      }),
      batch: vi.fn(async (statements: { query: string }[]) => {
        sql.push(...statements.map(statement => statement.query));
        return [];
      }),
    };
    const assets = { fetch: vi.fn() };
    await worker.scheduled({ scheduledTime: 1_780_000_000_000 }, { ASSETS: assets, FAMILY_DB: db });
    expect(sql).toHaveLength(3);
    expect(sql[0]).toContain('DELETE FROM family_status');
    expect(sql[1]).toContain('DELETE FROM family_channels');
    expect(sql[2]).toContain('DELETE FROM family_rate');
    expect(db.batch).toHaveBeenCalledOnce();
    expect(assets.fetch).not.toHaveBeenCalled();
  });
});
