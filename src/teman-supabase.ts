import { createClient } from '@supabase/supabase-js';

// Public client identifiers only. Never embed a service-role key in the browser.
const url = import.meta.env.VITE_TEMAN_SUPABASE_URL || 'https://mpidjwjghtpeybedmbkd.supabase.co';
const key = import.meta.env.VITE_TEMAN_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_LUGX_-Co3zolt94Qaj9AQg_m2zidH68';
export const supabase = url && key ? createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
}) : null;
