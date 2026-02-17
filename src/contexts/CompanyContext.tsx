import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { setCompanyOverride } from '@/lib/companyOverride';
import { extractSubdomain } from '@/lib/tenantResolver';

export type CompanyActivityType = 'car_dealership' | 'construction' | 'general_trading' | 'restaurant' | 'export_import' | 'medical' | 'real_estate';

export interface Company {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  is_active: boolean;
  company_type: CompanyActivityType;
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
  viewAsCompanyId: string | null;
  setViewAsCompanyId: (id: string | null) => void;
  tenantSubdomain: string | null;
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
  const [viewAsCompanyId, setViewAsCompanyIdState] = useState<string | null>(null);
  const [viewAsCompany, setViewAsCompany] = useState<Company | null>(null);
  const [tenantSubdomain] = useState<string | null>(() => extractSubdomain());

  const setViewAsCompanyId = async (id: string | null) => {
    setViewAsCompanyIdState(id);
    setCompanyOverride(id);
    queryClient.clear();
    if (id) {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      setViewAsCompany(data);
    } else {
      setViewAsCompany(null);
    }
  };

  const resolveCompanyBySubdomain = async (): Promise<{ id: string } | null> => {
    if (!tenantSubdomain) return null;
    
    try {
      const { data, error } = await supabase.rpc('resolve_company_by_subdomain', {
        p_subdomain: tenantSubdomain
      });
      
      if (error || !data || data.length === 0) {
        console.warn('Subdomain tenant not found:', tenantSubdomain);
        return null;
      }
      
      return { id: data[0].id };
    } catch (err) {
      console.error('Error resolving subdomain tenant:', err);
      return null;
    }
  };

  const fetchCompanyData = async () => {
    if (!user) {
      setCompany(null);
      setCompanyId(null);
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Run role check and company resolution in parallel
      const [rolesResult, subdomainResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('permission')
          .eq('user_id', user.id),
        tenantSubdomain ? resolveCompanyBySubdomain() : Promise.resolve(null),
      ]);
      
      const roles = rolesResult.data;
      const superAdmin = roles?.some(r => r.permission === 'super_admin') || false;
      setIsSuperAdmin(superAdmin);

      // Use subdomain result from parallel call
      let resolvedCompanyId: string | null = null;
      
      if (subdomainResult) {
        resolvedCompanyId = subdomainResult.id;
      }

      // Fallback: Get user's profile with company_id
      if (!resolvedCompanyId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single();
        
        resolvedCompanyId = profile?.company_id || null;
      }

      if (resolvedCompanyId) {
        if (previousCompanyId && previousCompanyId !== resolvedCompanyId) {
          queryClient.clear();
        }
        
        setPreviousCompanyId(resolvedCompanyId);
        setCompanyId(resolvedCompanyId);
        
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', resolvedCompanyId)
          .single();
        
        setCompany(companyData);
      } else {
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
      queryClient.clear();
      setCompany(null);
      setCompanyId(null);
      setPreviousCompanyId(null);
      setIsSuperAdmin(false);
      setLoading(false);
    }
  }, [session, user]);

  const effectiveCompanyId = viewAsCompanyId || companyId;
  const effectiveCompany = viewAsCompanyId ? viewAsCompany : company;

  return (
    <CompanyContext.Provider value={{ 
      company: effectiveCompany, 
      companyId: effectiveCompanyId, 
      loading, 
      isSuperAdmin, 
      refreshCompany, 
      updateCompany,
      viewAsCompanyId,
      setViewAsCompanyId,
      tenantSubdomain,
    }}>
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
