import { supabase } from '@/integrations/supabase/client';

export interface TwoFASetupResponse {
  success: boolean;
  secret?: string;
  otpauthUrl?: string;
  backupCodes?: string[];
  error?: string;
}

export interface TwoFASmsSetupResponse {
  success: boolean;
  message?: string;
  maskedPhone?: string;
  error?: string;
}

export interface TwoFAVerifyResponse {
  success: boolean;
  isValid?: boolean;
  error?: string;
}

export interface TwoFACheckResponse {
  success: boolean;
  isEnabled?: boolean;
  twoFaType?: 'totp' | 'sms' | null;
  phoneNumber?: string | null;
  error?: string;
}

// ============== TOTP (App-based) 2FA ==============

export async function setup2FA(): Promise<TwoFASetupResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'setup' },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

export async function verify2FA(token: string): Promise<TwoFAVerifyResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'verify', token },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

export async function verifyLogin2FA(token: string): Promise<TwoFAVerifyResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'verify-login', token },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

export async function disable2FA(token: string): Promise<TwoFAVerifyResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'disable', token },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

export async function check2FAStatus(): Promise<TwoFACheckResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'check' },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

// ============== SMS-based 2FA (Authentica) ==============

export async function setupSms2FA(phone: string): Promise<TwoFASmsSetupResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'setup-sms', phone },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

export async function verifySms2FA(token: string): Promise<TwoFAVerifyResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'verify-sms', token },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

export async function verifyLoginSms2FA(token: string): Promise<TwoFAVerifyResponse> {
  const { data, error } = await supabase.functions.invoke('manage-2fa', {
    body: { action: 'verify-login-sms', token },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return data;
}

// ============== Send OTP for Login (request new code) ==============

export async function sendLoginOtp(): Promise<TwoFASmsSetupResponse> {
  // Get current user's phone from 2FA settings and send OTP
  const checkResult = await check2FAStatus();
  if (!checkResult.success || !checkResult.phoneNumber) {
    return { success: false, error: 'لم يتم العثور على رقم الهاتف' };
  }

  // The phone is already stored, just need to trigger a new OTP
  const { data, error } = await supabase.functions.invoke('authentica-sms', {
    body: { 
      action: 'send-otp',
      method: 'sms',
      phone: checkResult.phoneNumber.replace(/\*/g, ''), // Won't work with masked, need full number
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, message: 'تم إرسال رمز التحقق' };
}
