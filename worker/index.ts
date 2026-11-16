const FAMILY_API_PREFIX = '/api/family/';
const FAMILY_API_METHODS: Record<string, string> = {
  checkin: 'POST',
  health: 'GET',
  link: 'DELETE',
  pair: 'POST',
  status: 'GET',
};

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
};

export interface WorkerEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
  FAMILY_API_ORIGIN?: string;
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...NO_STORE_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function apiRoute(pathname: string): string | undefined {
  if (!pathname.startsWith(FAMILY_API_PREFIX)) return undefined;
  const route = pathname.slice(FAMILY_API_PREFIX.length);
  return Object.hasOwn(FAMILY_API_METHODS, route) ? route : undefined;
}

function apiOrigin(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  try {
    const origin = new URL(value);
    if (origin.protocol !== 'https:') return undefined;
    origin.pathname = origin.pathname.replace(/\/+$/, '');
    origin.search = '';
    origin.hash = '';
    return origin;
  } catch {
    return undefined;
  }
}

async function proxyFamilyApi(request: Request, env: WorkerEnv): Promise<Response> {
  const route = apiRoute(new URL(request.url).pathname);
  if (!route) return jsonResponse(404, { ok: false, message: 'Not found.' });
  if (request.method !== FAMILY_API_METHODS[route]) {
    return jsonResponse(405, { ok: false, message: 'Method not allowed.' });
  }

  const origin = apiOrigin(env.FAMILY_API_ORIGIN);
  if (!origin) {
    return jsonResponse(503, {
      ok: false,
      configurationRequired: true,
      message: 'Family API is not configured.',
    });
  }

  const incoming = new URL(request.url);
  const upstream = new URL(`${origin.toString().replace(/\/+$/, '')}/api/family/${route}`);
  upstream.search = incoming.search;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('Cache-Control', 'no-store, max-age=0');

  let response: Response;
  try {
    response = await fetch(upstream, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    });
  } catch {
    return jsonResponse(502, { ok: false, message: 'Family API is temporarily unavailable.' });
  }

  const responseHeaders = new Headers(response.headers);
  Object.entries(NO_STORE_HEADERS).forEach(([name, value]) => responseHeaders.set(name, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return proxyFamilyApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

export { proxyFamilyApi };
