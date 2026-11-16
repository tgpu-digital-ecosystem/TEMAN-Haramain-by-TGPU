import { familyApi, purgeExpiredFamilyRecords, type FamilyEnvironment } from './family-api';

interface Assets { fetch(request: Request): Promise<Response> }
type Env = FamilyEnvironment & { ASSETS: Assets };
interface ScheduledEvent { scheduledTime: number }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return familyApi(request, env);
    return env.ASSETS.fetch(request);
  },

  // Runs only when an explicitly configured Cron Trigger is enabled.
  // No database binding means no retention task and no private-data access.
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    if (!env.FAMILY_DB) return;
    await purgeExpiredFamilyRecords(env.FAMILY_DB, event.scheduledTime);
  },
};
