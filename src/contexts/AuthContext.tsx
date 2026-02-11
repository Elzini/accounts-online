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
  financial_accounting: boolean;
  sales_invoices: boolean;
  purchase_invoices: boolean;
  control_center: boolean;
  accounting_audit: boolean;
  theme_settings: boolean;
  app_settings: boolean;
  branches: boolean;
  approvals: boolean;
  currencies: boolean;
  financial_kpis: boolean;
  budgets: boolean;
  checks: boolean;
  aging_report: boolean;
  medad_import: boolean;
  cost_centers: boolean;
  fixed_assets: boolean;
  financial_statements: boolean;
  trial_balance: boolean;
  zakat_reports: boolean;
  financial_reports: boolean;
  vat_return: boolean;
  account_statement: boolean;
  general_ledger: boolean;
  journal_entries: boolean;
  chart_of_accounts: boolean;
  tax_settings: boolean;
  fiscal_years: boolean;
  all_reports: boolean;
  warehouses: boolean;
  integrations: boolean;
  manufacturing: boolean;
  tasks: boolean;
  custody: boolean;
  banking: boolean;
  financing: boolean;
  vouchers: boolean;
  installments: boolean;
  quotations: boolean;
  prepaid_expenses: boolean;
  expenses: boolean;
  leaves: boolean;
  attendance: boolean;
  payroll: boolean;
  employees: boolean;
  car_transfers: boolean;
  partner_dealerships: boolean;
  customers: boolean;
  suppliers: boolean;
}

const DEFAULT_PERMISSIONS: UserPermissions = {
  sales: false, purchases: false, reports: false, admin: false, users: false, super_admin: false,
  financial_accounting: false, sales_invoices: false, purchase_invoices: false, control_center: false,
  accounting_audit: false, theme_settings: false, app_settings: false, branches: false, approvals: false,
  currencies: false, financial_kpis: false, budgets: false, checks: false, aging_report: false,
  medad_import: false, cost_centers: false, fixed_assets: false, financial_statements: false,
  trial_balance: false, zakat_reports: false, financial_reports: false, vat_return: false,
  account_statement: false, general_ledger: false, journal_entries: false, chart_of_accounts: false,
  tax_settings: false, fiscal_years: false, all_reports: false, warehouses: false, integrations: false,
  manufacturing: false, tasks: false, custody: false, banking: false, financing: false, vouchers: false,
  installments: false, quotations: false, prepaid_expenses: false, expenses: false, leaves: false,
  attendance: false, payroll: false, employees: false, car_transfers: false, partner_dealerships: false,
  customers: false, suppliers: false,
};

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
  const [permissions, setPermissions] = useState<UserPermissions>({ ...DEFAULT_PERMISSIONS });

  const fetchPermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('permission')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching permissions:', error);
      return;
    }

    const newPermissions: UserPermissions = { ...DEFAULT_PERMISSIONS };

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
          setPermissions({ ...DEFAULT_PERMISSIONS });
        }
      }
    );

    // Check if this is a redirect from login (cross-domain)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth_redirect') === '1') {
      sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
      urlParams.delete('auth_redirect');
      const cleanUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }

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

    return () => {
      subscription.unsubscribe();
    };
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
      setPermissions({ ...DEFAULT_PERMISSIONS });
      
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
