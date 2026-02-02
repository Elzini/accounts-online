import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SecurityCheckResult {
  valid: boolean;
  ip?: string;
  company_id?: string;
  two_fa_enabled?: boolean;
  error?: string;
}

export function useSecurityCheck() {
  const { session } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<SecurityCheckResult | null>(null);

  const validateIP = async (): Promise<boolean> => {
    if (!session?.access_token) return false;
    
    try {
      const { data, error } = await supabase.functions.invoke('security-middleware', {
        body: { action: 'validate_ip' },
      });

      if (error) {
        console.error('IP validation error:', error);
        return false;
      }

      if (!data?.valid) {
        toast.error(data?.error || 'عنوان IP غير مسموح به');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Security check error:', error);
      return false;
    }
  };

  const checkSession = async (): Promise<SecurityCheckResult> => {
    if (!session?.access_token) {
      return { valid: false, error: 'No session' };
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-middleware', {
        body: { action: 'check_session' },
      });

      if (error) {
        console.error('Session check error:', error);
        return { valid: false, error: error.message };
      }

      setSecurityStatus(data);
      return data;
    } catch (error) {
      console.error('Security check error:', error);
      return { valid: false, error: 'Network error' };
    } finally {
      setIsChecking(false);
    }
  };

  const logAccess = async (details?: Record<string, unknown>) => {
    if (!session?.access_token) return;

    try {
      await supabase.functions.invoke('security-middleware', {
        body: { action: 'log_access', ...details },
      });
    } catch (error) {
      // Silent fail for logging
      console.error('Access logging failed:', error);
    }
  };

  // Check session on mount and token change
  useEffect(() => {
    if (session?.access_token) {
      checkSession();
    }
  }, [session?.access_token]);

  return {
    validateIP,
    checkSession,
    logAccess,
    isChecking,
    securityStatus,
    isIPValid: securityStatus?.valid ?? null,
    is2FAEnabled: securityStatus?.two_fa_enabled ?? false,
    currentIP: securityStatus?.ip,
  };
}
