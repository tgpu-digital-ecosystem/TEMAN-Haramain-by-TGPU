import { familyApi, type FamilyEnvironment } from './family-api';

interface Assets { fetch(request: Request): Promise<Response> }
type Env = FamilyEnvironment & { ASSETS: Assets };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return familyApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
