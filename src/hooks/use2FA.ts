import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  setup2FA,
  verify2FA,
  verifyLogin2FA,
  disable2FA,
  check2FAStatus,
} from '@/services/twoFactorAuth';

export function use2FAStatus() {
  return useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      const result = await check2FAStatus();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.isEnabled || false;
    },
  });
}

export function useSetup2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setup2FA,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
      } else {
        toast.error(data.error || 'فشل في إعداد المصادقة الثنائية');
      }
    },
    onError: (error: Error) => {
      toast.error(`فشل في إعداد المصادقة الثنائية: ${error.message}`);
    },
  });
}

export function useVerify2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => verify2FA(token),
    onSuccess: (data) => {
      if (data.success && data.isValid) {
        queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
        toast.success('تم تفعيل المصادقة الثنائية بنجاح');
      } else if (!data.isValid) {
        toast.error('الرمز غير صحيح');
      }
    },
    onError: (error: Error) => {
      toast.error(`فشل التحقق: ${error.message}`);
    },
  });
}

export function useVerifyLogin2FA() {
  return useMutation({
    mutationFn: (token: string) => verifyLogin2FA(token),
    onError: (error: Error) => {
      toast.error(`فشل التحقق: ${error.message}`);
    },
  });
}

export function useDisable2FA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => disable2FA(token),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['2fa-status'] });
        toast.success('تم تعطيل المصادقة الثنائية');
      } else {
        toast.error(data.error || 'فشل في تعطيل المصادقة الثنائية');
      }
    },
    onError: (error: Error) => {
      toast.error(`فشل التعطيل: ${error.message}`);
    },
  });
}
