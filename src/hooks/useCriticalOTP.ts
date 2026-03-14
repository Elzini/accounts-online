import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

interface OTPRequest {
  operationType: string;
  operationDescription?: string;
  entityType?: string;
  entityId?: string;
}

interface OTPState {
  isOpen: boolean;
  isLoading: boolean;
  isSending: boolean;
  otpId: string | null;
  adminEmail: string | null;
  expiresAt: string | null;
  error: string | null;
}

export function useCriticalOTP() {
  const { companyId } = useCompany();
  const [state, setState] = useState<OTPState>({
    isOpen: false,
    isLoading: false,
    isSending: false,
    otpId: null,
    adminEmail: null,
    expiresAt: null,
    error: null,
  });

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requestOTP = useCallback(async (request: OTPRequest, onSuccess: () => void) => {
    if (!companyId) {
      toast.error('لا يوجد سياق شركة');
      return;
    }

    setState(prev => ({ ...prev, isOpen: true, isSending: true, error: null }));
    setPendingAction(() => onSuccess);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('غير مسجل الدخول');
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/send-critical-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            companyId,
            ...request,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'فشل في إرسال كود التحقق');
      }

      setState(prev => ({
        ...prev,
        isSending: false,
        otpId: result.otpId,
        adminEmail: result.adminEmail,
        expiresAt: result.expiresAt,
      }));

      toast.success('تم إرسال كود التحقق إلى المسؤول');
    } catch (err: any) {
      setState(prev => ({ ...prev, isSending: false, error: err.message }));
      toast.error(err.message || 'فشل في إرسال كود التحقق');
    }
  }, [companyId]);

  const verifyOTP = useCallback(async (code: string): Promise<boolean> => {
    if (!state.otpId || !companyId) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('غير مسجل الدخول');
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/verify-critical-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            otpId: state.otpId,
            code,
            companyId,
          }),
        }
      );

      const result = await response.json();

      if (!result.valid) {
        setState(prev => ({ ...prev, isLoading: false, error: result.error || 'كود التحقق غير صحيح' }));
        return false;
      }

      setState(prev => ({ ...prev, isLoading: false, isOpen: false }));
      toast.success('تم التحقق بنجاح ✅');

      // تنفيذ العملية المعلقة
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }

      return true;
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      return false;
    }
  }, [state.otpId, companyId, pendingAction]);

  const close = useCallback(() => {
    setState({
      isOpen: false,
      isLoading: false,
      isSending: false,
      otpId: null,
      adminEmail: null,
      expiresAt: null,
      error: null,
    });
    setPendingAction(null);
  }, []);

  return { ...state, requestOTP, verifyOTP, close };
}
