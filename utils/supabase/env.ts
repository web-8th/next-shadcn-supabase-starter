// `NEXT_PUBLIC_*` values must be read with their full literal names so Next.js can
// inline them into the browser bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

/** False until both public Supabase env vars are set. Lets the UI run without a backend. */
export const isSupabaseConfigured = Boolean(url && publishableKey);

export function getSupabaseEnv() {
  if (!url || !publishableKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY in .env.local (see README.md).'
    );
  }
  return { url, publishableKey };
}
