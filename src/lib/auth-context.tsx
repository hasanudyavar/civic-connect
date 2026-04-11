'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  appConfig: Record<string, string>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  appConfig: {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<Record<string, string>>({});

  const loadUser = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*, ward:wards(name, ward_number), department:departments(name, code)')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          // Merge email from auth.users into the profile (email is NOT in profiles table)
          setUser({ ...profile, email: authUser.email || '' } as Profile);
        } else {
          // Profile doesn't exist yet (e.g., trigger failed) — set minimal user
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      // system_settings table (NOT app_config — that table doesn't exist)
      const { data } = await supabase.from('system_settings').select('key, value');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
        setAppConfig(map);
      }
    } catch {
      // Use defaults silently
    }
  };

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    loadUser();
    loadConfig();

    const supabase = createBrowserSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
      } else {
        loadUser();
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, appConfig, signOut, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}
