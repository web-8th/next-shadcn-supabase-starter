import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/types';

import { getSupabaseEnv, isSupabaseConfigured } from './env';

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers. It reads
 * the session from cookies and acts as the signed-in user, so RLS applies. Use this,
 * not `createAdminClient()`, for anything done on behalf of a user.
 *
 * Create a new client per request; don't store it in a module-level variable.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components can't set cookies. The proxy refreshes the session on
          // every request, so it's safe to ignore here.
        }
      },
    },
  });
}

/** The signed-in user, verified with Supabase Auth. Null when signed out or unconfigured. */
export async function getUser() {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
