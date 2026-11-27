import { Session, User } from '@supabase/supabase-js';

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  /** True until the initial session check finishes. */
  loading: boolean;
  /** False when the Supabase env vars are missing; auth calls will fail. */
  isConfigured: boolean;
  /** Signs out, sends the user to `/login`, and refreshes Server Components. */
  signOut: () => Promise<void>;
};
