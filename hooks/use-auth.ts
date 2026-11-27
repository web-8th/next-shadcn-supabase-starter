import { useContext } from 'react';

import { AuthContext } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';

/** Current session and user. For Server Components, use `getUser()` from `@/utils/supabase/server`. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** Returns Supabase's `{ data, error }`. Sign out through `useAuth().signOut`. */
export async function signInWithEmail(email: string, password: string) {
  return createClient().auth.signInWithPassword({ email, password });
}
