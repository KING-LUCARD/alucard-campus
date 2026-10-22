import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext<{ user: User | null; ready: boolean; signOut: () => Promise<void> }>({ user: null, ready: false, signOut: async () => {} });
export const useSchoolAuth = () => useContext(AuthContext);
export function SchoolAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    let alive = true;
    async function refresh() {
      const { data } = await supabase.auth.getUser();
      if (alive) { setUser(data.user); setReady(true); }
    }
    void refresh();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'MFA_CHALLENGE_VERIFIED'].includes(event)) return;
      // Avoid awaiting Auth methods inside its synchronous event callback.
      setTimeout(() => { if (!alive) return; void refresh(); void router.invalidate(); if (event !== 'SIGNED_OUT') void queryClient.invalidateQueries(); }, 0);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [router, queryClient]);
  async function signOut() {
    await queryClient.cancelQueries(); queryClient.clear();
    await supabase.auth.signOut(); setUser(null);
    await router.navigate({ to: '/auth', replace: true });
  }
  return <AuthContext.Provider value={{ user, ready, signOut }}>{children}</AuthContext.Provider>;
}