import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/types';

import { getSupabaseEnv } from './env';

/**
 * Supabase client for Client Components. Acts as the signed-in user, so RLS applies.
 * `createBrowserClient` returns a singleton in the browser, so calling this often is fine.
 */
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
