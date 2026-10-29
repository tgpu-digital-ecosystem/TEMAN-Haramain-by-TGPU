// TEMAN Family Link on Cloudflare D1.
// Disabled unless a dedicated database and rate-limiting secret are configured.
// No live location tracking; a family member only sees explicit pilgrim check-ins.

type Row = Record<string, unknown>;
interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  first<T extends Row>(): Promise<T | null>;
  run(): Promise<{ meta: { changes?: number } }>;
}
export interface FamilyDatabase {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown>;
}
export interface FamilyEnvironment {
  FAMILY_DB?: FamilyDatabase;
  TEMAN_FAMILY_RATE_SALT?: string;
}

const HEADERS = {
  'Cache-Control': 'no-store, private, max-age=0',
  'Pragma': 'no-cache',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};
const DAY = 86_400_000;
const TTL = 30 * DAY;
const ALLOWED = new Set(['safe', 'with-group', 'at-hotel', 'need-contact']);

function answer(code: number, data: Row): Response {
  return new Response(JSON.stringify(data), { status: code, headers: HEADERS });
}
function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
}
async function rateKey(ip: string, salt: string, day: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(day + ':' + ip));
  return Array.from(new Uint8Array(signed), n => n.toString(16).padStart(2, '0')).join('');
}
function token(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function bodyJson(req: Request): Promise<Row | null> {
  const len = Number(req.headers.get('content-length') || '0');
  if (len > 4096) return null;
  const raw = await req.text();
  if (raw.length > 4096) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Row : null;
  } catch { return null; }
}
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  return Boolean(origin && origin === new URL(req.url).origin);
}
function configured(env: FamilyEnvironment): env is FamilyEnvironment & { FAMILY_DB: FamilyDatabase; TEMAN_FAMILY_RATE_SALT: string } {
  return Boolean(env.FAMILY_DB && env.TEMAN_FAMILY_RATE_SALT && env.TEMAN_FAMILY_RATE_SALT.length >= 32);
}

/**
 * Purge stale Family Link records without requiring anyone to activate a new link.
 * Do not log token hashes, IP-derived rate keys, or pilgrim status information.
 * The caller must only provide an explicitly approved, environment-isolated D1 binding.
 */
export async function purgeExpiredFamilyRecords(db: FamilyDatabase, now = Date.now()): Promise<void> {
  const period = Math.floor(now / DAY);
  await db.batch([
    db.prepare('DELETE FROM family_status WHERE family_id IN (SELECT family_id FROM family_channels WHERE expires_at <= ?)').bind(now),
    db.prepare('DELETE FROM family_channels WHERE expires_at <= ?').bind(now),
    db.prepare('DELETE FROM family_rate WHERE day < ?').bind(period - 1),
  ]);
}

export async function familyApi(request: Request, env: FamilyEnvironment): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path === '/api/family/health') {
    if (request.method !== 'GET') return answer(405, { ok: false });
    return answer(200, { ok: true, storageConfigured: configured(env), liveTracking: false });
  }
  if (!['/api/family/pair', '/api/family/checkin', '/api/family/status', '/api/family/link'].includes(path)) {
    return answer(404, { ok: false });
  }
  if (!configured(env)) return answer(503, { ok: false, configurationRequired: true });
  const db = env.FAMILY_DB;
  const now = Date.now();

  try {
    if (path === '/api/family/pair') {
      if (request.method !== 'POST') return answer(405, { ok: false });
      if (!sameOrigin(request)) return answer(403, { ok: false });
      const ip = request.headers.get('cf-connecting-ip');
      if (!ip || ip.length > 64) return answer(403, { ok: false });
      const period = Math.floor(now / DAY);
      const key = await rateKey(ip, env.TEMAN_FAMILY_RATE_SALT, period);
      const quota = await db.prepare(
        'INSERT INTO family_rate (rate_key, day, count) VALUES (?, ?, 1) ON CONFLICT(rate_key) DO UPDATE SET count = count + 1 WHERE count < 5'
      ).bind(key, period).run();
      if (quota.meta.changes !== 1) return answer(429, { ok: false, message: 'Try again tomorrow.' });

      // Opportunistic fallback if scheduled cleanup has not run recently.
      await purgeExpiredFamilyRecords(db, now);
      const familyId = token().slice(0, 32);
      const writeToken = token();
      const viewerToken = token();
      await db.prepare(
        'INSERT INTO family_channels (family_id, write_hash, view_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(familyId, await hash(writeToken), await hash(viewerToken), now, now + TTL).run();
      return answer(201, { ok: true, familyId, writeToken, viewerToken });
    }

    if (path === '/api/family/checkin') {
      if (request.method !== 'POST') return answer(405, { ok: false });
      if (!sameOrigin(request)) return answer(403, { ok: false });
      const data = await bodyJson(request);
      if (!data) return answer(400, { ok: false });
      const familyId = str(data.familyId, 64);
      const write = str(data.writeToken, 128);
      const checkIn = data.checkIn as Row | undefined;
      if (!familyId || !write || !checkIn || typeof checkIn !== 'object' || !ALLOWED.has(checkIn.status as string)) {
        return answer(400, { ok: false });
      }
      const channel = await db.prepare('SELECT family_id FROM family_channels WHERE family_id = ? AND write_hash = ? AND expires_at > ?')
        .bind(familyId, await hash(write), now).first();
      if (!channel) return answer(403, { ok: false });
      const createdAt = typeof checkIn.createdAt === 'number' && Number.isFinite(checkIn.createdAt)
        ? Math.min(now, Math.max(now - DAY, checkIn.createdAt)) : now;
      await db.prepare(
        'INSERT INTO family_status (family_id, checkin_id, status, label, created_at, pilgrim_name, hotel_name, group_code, bus_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(family_id) DO UPDATE SET checkin_id=excluded.checkin_id, status=excluded.status, label=excluded.label, created_at=excluded.created_at, pilgrim_name=excluded.pilgrim_name, hotel_name=excluded.hotel_name, group_code=excluded.group_code, bus_number=excluded.bus_number'
      ).bind(
        familyId, str(checkIn.id, 80), str(checkIn.status, 40), str(checkIn.label, 120), createdAt,
        str(checkIn.pilgrimName, 120), str(checkIn.hotelName, 160), str(checkIn.groupCode, 80), str(checkIn.busNumber, 80)
      ).run();
      return answer(200, { ok: true, syncedAt: now });
    }

    if (path === '/api/family/status') {
      if (request.method !== 'GET') return answer(405, { ok: false });
      const familyId = str(url.searchParams.get('family'), 64);
      const view = str(request.headers.get('x-teman-viewer-token'), 128);
      if (!familyId || !view) return answer(400, { ok: false });
      const channel = await db.prepare('SELECT family_id FROM family_channels WHERE family_id = ? AND view_hash = ? AND expires_at > ?')
        .bind(familyId, await hash(view), now).first();
      if (!channel) return answer(403, { ok: false });
      const row = await db.prepare('SELECT checkin_id, status, label, created_at, pilgrim_name, hotel_name, group_code, bus_number FROM family_status WHERE family_id = ?')
        .bind(familyId).first();
      return answer(200, { ok: true, latest: row ? {
        id: row.checkin_id, status: row.status, label: row.label, createdAt: row.created_at,
        pilgrimName: row.pilgrim_name, hotelName: row.hotel_name, groupCode: row.group_code, busNumber: row.bus_number,
      } : null });
    }

    if (path === '/api/family/link') {
      if (request.method !== 'DELETE') return answer(405, { ok: false });
      if (!sameOrigin(request)) return answer(403, { ok: false });
      const data = await bodyJson(request);
      const familyId = str(data?.familyId, 64);
      const write = str(data?.writeToken, 128);
      if (!familyId || !write) return answer(400, { ok: false });
      const channel = await db.prepare('SELECT family_id FROM family_channels WHERE family_id = ? AND write_hash = ?')
        .bind(familyId, await hash(write)).first();
      if (!channel) return answer(403, { ok: false });
      await db.batch([
        db.prepare('DELETE FROM family_status WHERE family_id = ?').bind(familyId),
        db.prepare('DELETE FROM family_channels WHERE family_id = ?').bind(familyId),
      ]);
      return answer(200, { ok: true });
    }
  } catch {
    // Never return private D1 driver errors, schema details or credentials to the client.
    return answer(503, { ok: false, configurationRequired: true });
  }
  return answer(404, { ok: false });
}
