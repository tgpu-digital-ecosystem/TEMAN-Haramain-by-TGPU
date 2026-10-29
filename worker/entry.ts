export default {
  async fetch(request: Request, env: { ASSETS: { fetch(input: Request): Promise<Response> } }): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) {
      return Response.json({ ok: false, configurationRequired: true }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    return env.ASSETS.fetch(request);
  },
};
