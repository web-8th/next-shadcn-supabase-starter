import type { User } from '@supabase/supabase-js';

/**
 * The name to show for a user: a name from their profile metadata (set at sign-up or by
 * an OAuth provider) if there is one, otherwise the part of their email before the @.
 */
export function getDisplayName(user: User) {
  const metadata = user.user_metadata ?? {};
  const name = [metadata.display_name, metadata.full_name, metadata.name].find(
    (value): value is string => typeof value === 'string' && value.trim() !== ''
  );
  return name?.trim() ?? user.email?.split('@')[0] ?? 'Account';
}
