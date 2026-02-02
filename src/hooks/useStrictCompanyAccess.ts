import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface StrictAccessState {
  isAuthorized: boolean;
  isChecking: boolean;
  companyId: string | null;
  error: string | null;
}

/**
 * Hook to enforce strict company access with deny-by-default policy
 * All access is denied unless explicitly authorized
 */
export function useStrictCompanyAccess() {
  const { user, session } = useAuth();
  const { companyId } = useCompany();
  const [state, setState] = useState<StrictAccessState>({
    isAuthorized: false,
    isChecking: true,
    companyId: null,
    error: null,
  });

  const verifyAccess = useCallback(async () => {
    // DENY by default - no user = no access
    if (!user || !session) {
      setState({
        isAuthorized: false,
        isChecking: false,
        companyId: null,
        error: 'لم يتم تسجيل الدخول',
      });
      return false;
    }

    // DENY by default - no company = no access
    if (!companyId) {
      setState({
        isAuthorized: false,
        isChecking: false,
        companyId: null,
        error: 'لم يتم ربط الحساب بشركة',
      });
      return false;
    }

    try {
      setState(prev => ({ ...prev, isChecking: true }));

      // Use security middleware to validate access
      const { data, error } = await supabase.functions.invoke('security-middleware', {
        body: { action: 'check_session' },
      });

      if (error) {
        console.error('Security check error:', error);
        setState({
          isAuthorized: false,
          isChecking: false,
          companyId: null,
          error: 'فشل التحقق من الأمان',
        });
        return false;
      }

      if (!data?.valid) {
        setState({
          isAuthorized: false,
          isChecking: false,
          companyId: null,
          error: data?.error || 'الوصول غير مصرح',
        });
        return false;
      }

      // Verify company matches
      if (data.company_id !== companyId) {
        setState({
          isAuthorized: false,
          isChecking: false,
          companyId: null,
          error: 'عدم تطابق الشركة',
        });
        return false;
      }

      setState({
        isAuthorized: true,
        isChecking: false,
        companyId: data.company_id,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Access verification failed:', error);
      setState({
        isAuthorized: false,
        isChecking: false,
        companyId: null,
        error: 'خطأ في التحقق من الوصول',
      });
      return false;
    }
  }, [user, session, companyId]);

  // Check if user has specific permission
  const hasPermission = useCallback(async (permission: string): Promise<boolean> => {
    if (!state.isAuthorized) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('rbac_check', {
        required_permission: permission,
      });

      if (error) {
        console.error('Permission check error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }, [state.isAuthorized]);

  // Check if user can access data for a specific company
  const canAccessCompanyData = useCallback(async (targetCompanyId: string): Promise<boolean> => {
    if (!state.isAuthorized) {
      return false;
    }

    // DENY cross-company access
    if (targetCompanyId !== state.companyId) {
      toast.error('لا يمكن الوصول لبيانات شركة أخرى');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('strict_company_check', {
        _company_id: targetCompanyId,
      });

      if (error) {
        console.error('Company access check error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Company access check failed:', error);
      return false;
    }
  }, [state.isAuthorized, state.companyId]);

  // Check combined permission + company access
  const canAccessWithPermission = useCallback(async (
    targetCompanyId: string,
    permission: string
  ): Promise<boolean> => {
    if (!state.isAuthorized) {
      return false;
    }

    // DENY cross-company access
    if (targetCompanyId !== state.companyId) {
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('can_access_with_permission', {
        _company_id: targetCompanyId,
        required_permission: permission,
      });

      if (error) {
        console.error('Permission + company check error:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Permission + company check failed:', error);
      return false;
    }
  }, [state.isAuthorized, state.companyId]);

  // Log access for audit trail
  const logAccess = useCallback(async (details?: Record<string, unknown>) => {
    if (!session?.access_token) return;

    try {
      await supabase.functions.invoke('security-middleware', {
        body: { action: 'log_access', ...details },
      });
    } catch (error) {
      console.error('Access logging failed:', error);
    }
  }, [session?.access_token]);

  // Verify on mount and when dependencies change
  useEffect(() => {
    verifyAccess();
  }, [verifyAccess]);

  return {
    ...state,
    verifyAccess,
    hasPermission,
    canAccessCompanyData,
    canAccessWithPermission,
    logAccess,
  };
}
