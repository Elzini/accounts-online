import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserPermissions {
  sales: boolean;
  purchases: boolean;
  reports: boolean;
  admin: boolean;
  users: boolean;
  super_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  permissions: UserPermissions;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; data: { user: User | null; session: Session | null } | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions>({
    sales: false,
    purchases: false,
    reports: false,
    admin: false,
    users: false,
    super_admin: false,
  });

  const fetchPermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('permission')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching permissions:', error);
      return;
    }

    const newPermissions: UserPermissions = {
      sales: false,
      purchases: false,
      reports: false,
      admin: false,
      users: false,
      super_admin: false,
    };

    data?.forEach((role) => {
      if (role.permission in newPermissions) {
        newPermissions[role.permission as keyof UserPermissions] = true;
      }
    });

    setPermissions(newPermissions);
  };

  useEffect(() => {
    const SESSION_ACTIVE_KEY = 'app_session_active';

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Fetch permissions when user logs in
        if (session?.user) {
          // Mark session as active in this browser tab/window
          sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
          setTimeout(() => {
            fetchPermissions(session.user.id);
          }, 0);
        } else {
          setPermissions({
            sales: false,
            purchases: false,
            reports: false,
            admin: false,
            users: false,
            super_admin: false,
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Force re-login on fresh browser/tab open:
      // If there's a persisted session but no sessionStorage flag,
      // it means the user opened a new browser window/tab — sign them out.
      const isSessionActive = sessionStorage.getItem(SESSION_ACTIVE_KEY);
      if (session && !isSessionActive) {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
        fetchPermissions(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error, data };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local state first to ensure UI updates immediately
      setUser(null);
      setSession(null);
      setPermissions({
        sales: false,
        purchases: false,
        reports: false,
        admin: false,
        users: false,
        super_admin: false,
      });
      
      // Then attempt server-side logout (ignore errors if session already expired)
      await supabase.auth.signOut();
    } catch (error) {
      // Session might already be expired/invalid, which is fine
      console.log('Sign out completed (session may have been expired)');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, permissions, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
