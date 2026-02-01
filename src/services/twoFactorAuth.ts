import { supabase } from '@/integrations/supabase/client';

export interface TwoFASetupResponse {
  success: boolean;
  secret?: string;
  otpauthUrl?: string;
  backupCodes?: string[];
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
  error?: string;
}

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
