import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types';

/**
 * Admin client using the secret key. It bypasses Row Level Security, so only use it
 * in server code (Route Handlers, Server Actions, Server Components) for privileged
 * work such as `auth.admin.*` or background jobs. Never expose it to the browser.
 * The `server-only` import makes the build fail if a Client Component imports this file.
 *
 * For anything done on behalf of the signed-in user, use `createClient()` from
 * `@/utils/supabase/server` instead, so RLS still applies.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY');
  }

  return createClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
