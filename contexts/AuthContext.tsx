'use client';

import { createContext, ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';

import { AuthContextType } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { isSupabaseConfigured } from '@/utils/supabase/env';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const userIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Without env vars, skip auth entirely so the rest of the app still renders.
    if (!isSupabaseConfigured) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user.id ?? null;
      // When the user changes (sign-in, sign-out, another tab), re-render Server
      // Components so they see the new session. Skip the initial load.
      if (userIdRef.current !== undefined && userIdRef.current !== nextUserId) {
        router.refresh();
      }
      userIdRef.current = nextUserId;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signOut = async () => {
    if (!isSupabaseConfigured) return;

    const { error } = await createClient().auth.signOut();
    if (error) throw error;
    router.replace('/login');
    router.refresh();
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    isConfigured: isSupabaseConfigured,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
