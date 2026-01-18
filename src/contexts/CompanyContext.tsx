import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyContextType {
  company: Company | null;
  companyId: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  refreshCompany: () => Promise<void>;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [company, setCompany] = useState<Company | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [previousCompanyId, setPreviousCompanyId] = useState<string | null>(null);

  const fetchCompanyData = async () => {
    if (!user) {
      setCompany(null);
      setCompanyId(null);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Check if user is super admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('permission')
        .eq('user_id', user.id);
      
      const superAdmin = roles?.some(r => r.permission === 'super_admin') || false;
      setIsSuperAdmin(superAdmin);

      // Get user's profile with company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.company_id) {
        // If company changed, clear the cache to prevent showing old data
        if (previousCompanyId && previousCompanyId !== profile.company_id) {
          queryClient.clear();
        }
        
        setPreviousCompanyId(profile.company_id);
        setCompanyId(profile.company_id);
        
        // Fetch company details
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        
        setCompany(companyData);
      } else {
        // User has no company, clear any cached data
        if (previousCompanyId) {
          queryClient.clear();
          setPreviousCompanyId(null);
        }
        setCompanyId(null);
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCompany = async () => {
    await fetchCompanyData();
  };

  const updateCompany = async (updates: Partial<Company>) => {
    if (!companyId) return;
    
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId);
    
    if (error) throw error;
    
    await refreshCompany();
  };

  useEffect(() => {
    if (session) {
      fetchCompanyData();
    } else {
      // User logged out - clear all cached data
      queryClient.clear();
      setCompany(null);
      setCompanyId(null);
      setPreviousCompanyId(null);
      setIsSuperAdmin(false);
      setLoading(false);
    }
  }, [session, user]);

  return (
    <CompanyContext.Provider value={{ company, companyId, loading, isSuperAdmin, refreshCompany, updateCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
