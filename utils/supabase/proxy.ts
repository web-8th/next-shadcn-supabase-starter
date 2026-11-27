import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/types';

import { getSupabaseEnv, isSupabaseConfigured } from './env';

/** Refreshes the auth session cookie and returns the current user. Used by `proxy.ts`. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    console.warn('Supabase env vars are missing, so auth is skipped. See README.md.');
    return { user: null, supabaseResponse };
  }

  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Don't put code between createServerClient and getUser(): it can make users get
  // signed out at random.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
}
