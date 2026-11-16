import { describe, expect, it } from 'vitest';
import { familyApi } from '../worker/family-api';

type RecordValue = Record<string, string | number>;
function mockFamilyDb() {
  const channels = new Map<string, RecordValue>();
  const statuses = new Map<string, RecordValue>();
  const rates = new Map<string, number>();
  const prepare = (sql: string) => ({
    bind(...params: (string | number | null)[]) {
      const args = params;
      return {
        async run() {
          if (sql.startsWith('INSERT INTO family_rate')) {
            const key = String(args[0]);
            const count = rates.get(key) || 0;
            if (count >= 5) return { meta: { changes: 0 } };
            rates.set(key, count + 1);
          } else if (sql.startsWith('INSERT INTO family_channels')) {
            channels.set(String(args[0]), {
              family_id: String(args[0]), write_hash: String(args[1]),
              view_hash: String(args[2]), created_at: Number(args[3]), expires_at: Number(args[4]),
            });
          } else if (sql.startsWith('INSERT INTO family_status')) {
            statuses.set(String(args[0]), {
              family_id: String(args[0]), checkin_id: String(args[1]), status: String(args[2]),
              label: String(args[3]), created_at: Number(args[4]), pilgrim_name: String(args[5]),
              hotel_name: String(args[6]), group_code: String(args[7]), bus_number: String(args[8]),
            });
          } else if (sql.startsWith('DELETE FROM family_status')) statuses.delete(String(args[0]));
          else if (sql.startsWith('DELETE FROM family_channels')) channels.delete(String(args[0]));
          return { meta: { changes: 1 } };
        },
        async first() {
          const id = String(args[0]);
          const channel = channels.get(id);
          if (sql.startsWith('SELECT family_id FROM family_channels')) {
            if (!channel) return null;
            const column = sql.includes('write_hash') ? 'write_hash' : 'view_hash';
            if (channel[column] !== args[1]) return null;
            if (sql.includes('expires_at') && Number(channel.expires_at) <= Number(args[2])) return null;
            return { family_id: id };
          }
          if (sql.startsWith('SELECT checkin_id')) return statuses.get(id) || null;
          return null;
        },
      };
    },
  });
  return {
    prepare,
    async batch(statements: { run(): Promise<unknown> }[]) {
      for (const stmt of statements) await stmt.run();
      return [];
    },
    channels,
    statuses,
  };
}
const base = 'https://teman.example';
const envFor = (db: ReturnType<typeof mockFamilyDb>) =>
  ({ FAMILY_DB: db as never, TEMAN_FAMILY_RATE_SALT: 'test-only-secret-'.repeat(3) });
const mutate = (path: string, method: string, data: unknown) =>
  new Request(base + path, { method, headers: { origin: base, 'content-type': 'application/json' }, body: JSON.stringify(data) });

describe('TEMAN D1 complete synthetic family flow', () => {
  it('pairs, verifies viewer/write separation, saves, reads, and revokes dummy check-in', async () => {
    const db = mockFamilyDb();
    const env = envFor(db);
    const pair = await familyApi(new Request(base + '/api/family/pair', {
      method: 'POST', headers: { origin: base, 'cf-connecting-ip': '192.0.2.7' },
    }), env);
    expect(pair.status).toBe(201);
    const { familyId, writeToken, viewerToken } = await pair.json() as Record<string, string>;
    expect(familyId).toBeTruthy();
    expect(writeToken).not.toBe(viewerToken);
    expect(db.channels.get(familyId)?.write_hash).not.toBe(writeToken);

    const checkin = await familyApi(mutate('/api/family/checkin', 'POST', {
      familyId, writeToken, checkIn: { id: 'dummy-1', status: 'safe', label: 'I am safe', pilgrimName: 'Test Only', createdAt: Date.now() },
    }), env);
    expect(checkin.status).toBe(200);
    const statusUrl = base + '/api/family/status?family=' + encodeURIComponent(familyId);
    const badViewer = await familyApi(new Request(statusUrl, { headers: { 'x-teman-viewer-token': writeToken } }), env);
    expect(badViewer.status).toBe(403);
    const read = await familyApi(new Request(statusUrl, { headers: { 'x-teman-viewer-token': viewerToken } }), env);
    expect(read.status).toBe(200);
    const content = await read.json() as { latest: { status: string; pilgrimName: string } };
    expect(content.latest.status).toBe('safe');
    expect(content.latest.pilgrimName).toBe('Test Only');

    const forbidden = await familyApi(mutate('/api/family/link', 'DELETE', { familyId, writeToken: viewerToken }), env);
    expect(forbidden.status).toBe(403);
    const revoked = await familyApi(mutate('/api/family/link', 'DELETE', { familyId, writeToken }), env);
    expect(revoked.status).toBe(200);
    expect(db.channels.has(familyId)).toBe(false);
    expect(db.statuses.has(familyId)).toBe(false);
    const afterRevoke = await familyApi(new Request(statusUrl, { headers: { 'x-teman-viewer-token': viewerToken } }), env);
    expect(afterRevoke.status).toBe(403);
  });
});
