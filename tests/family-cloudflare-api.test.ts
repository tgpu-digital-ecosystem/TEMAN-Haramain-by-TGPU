import { describe, expect, it, vi } from 'vitest';
import { familyApi } from '../worker/family-api';

describe('Family Link Cloudflare backend security gates', () => {
  const pair = () => new Request('https://teman.example/api/family/pair', {
    method: 'POST', headers: { Origin: 'https://teman.example', 'cf-connecting-ip': '192.0.2.55' },
  });

  it('never issues family credentials without an approved DB and secret', async () => {
    const result = await familyApi(pair(), {});
    expect(result.status).toBe(503);
    expect(result.headers.get('Cache-Control')).toContain('no-store');
    expect(await result.json()).toEqual({ ok: false, configurationRequired: true });
  });

  it('reports that live tracking is disabled without claiming storage readiness', async () => {
    const result = await familyApi(new Request('https://teman.example/api/family/health'), {});
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ ok: true, storageConfigured: false, liveTracking: false });
  });

  it('rejects cross-origin creation before touching D1', async () => {
    const db = { prepare: vi.fn(), batch: vi.fn() };
    const result = await familyApi(new Request('https://teman.example/api/family/pair', {
      method: 'POST', headers: { Origin: 'https://attacker.example', 'cf-connecting-ip': '192.0.2.55' },
    }), { FAMILY_DB: db as never, TEMAN_FAMILY_RATE_SALT: 'a'.repeat(32) });
    expect(result.status).toBe(403);
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('does not expose D1 errors or accept SQL details from missing migrations', async () => {
    const db = { prepare: vi.fn(() => { throw Error('database internals and secret metadata'); }), batch: vi.fn() };
    const result = await familyApi(pair(), {
      FAMILY_DB: db as never, TEMAN_FAMILY_RATE_SALT: 'a'.repeat(32),
    });
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain('database internals');
  });

  it('purges expired family records before creating any new link', async () => {
    const operations: string[] = [];
    const db = {
      prepare: vi.fn((sql: string) => ({
        bind: (..._args: unknown[]) => ({
          run: async () => { operations.push(sql); return { meta: { changes: 1 } }; },
        }),
      })),
      batch: vi.fn(async (statements: unknown[]) => {
        expect(statements).toHaveLength(3);
        return [];
      }),
    };
    const response = await familyApi(pair(), {
      FAMILY_DB: db as never, TEMAN_FAMILY_RATE_SALT: 'a'.repeat(32),
    });
    expect(response.status).toBe(201);
    expect(db.batch).toHaveBeenCalledOnce();
    const sqls = db.prepare.mock.calls.map(([query]) => query);
    expect(sqls.join('\n')).toContain('DELETE FROM family_status WHERE family_id IN');
    expect(sqls.join('\n')).toContain('DELETE FROM family_channels WHERE expires_at <=');
    expect(sqls.join('\n')).toContain('DELETE FROM family_rate WHERE day <');
    expect(operations.some(q => q.includes('INSERT INTO family_channels'))).toBe(true);
  });

  it('does not send unsupported endpoints to the SPA or disclose data', async () => {
    const result = await familyApi(new Request('https://teman.example/api/private'), {});
    expect(result.status).toBe(404);
  });
});
