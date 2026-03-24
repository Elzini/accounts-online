/**
 * Super Admin - Settings & Configuration Services
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, untypedFrom } from '@/integrations/supabase/untypedFrom';

// ─── System Labels ───
export function useSystemLabels(companyType: string) {
  return useQuery({
    queryKey: ['system-labels', companyType],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('key, value').is('company_id', null).like('key', 'label_%');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveSystemLabel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const settingKey = `label_${key}`;
      const { data: existing } = await supabase.from('app_settings').select('id').eq('key', settingKey).is('company_id', null).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('app_settings').update({ value }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({ key: settingKey, value, company_id: null });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-labels'] }),
  });
}

// ─── System Settings ───
export async function fetchSystemSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).is('company_id', null).maybeSingle();
  return data?.value || null;
}

export async function saveSystemSetting(key: string, value: string): Promise<void> {
  const { data: existing } = await supabase.from('app_settings').select('id').eq('key', key).is('company_id', null).maybeSingle();
  if (existing) {
    const { error } = await supabase.from('app_settings').update({ value }).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('app_settings').insert({ key, value, company_id: null });
    if (error) throw error;
  }
}

// ─── Default Company Settings ───
export function useDefaultSettings() {
  return useQuery({
    queryKey: ['default-company-settings'],
    queryFn: async () => {
      const { data, error } = await untypedFrom('default_company_settings').select('*');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveDefaultSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ settingType, settingKey, settingValue }: { settingType: string; settingKey: string; settingValue: string }) => {
      const { data: existing } = await untypedFrom('default_company_settings')
        .select('id').eq('setting_type', settingType).eq('setting_key', settingKey).maybeSingle();

      if (existing) {
        const { error } = await untypedFrom('default_company_settings').update({ setting_value: settingValue }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await untypedFrom('default_company_settings').insert({ setting_type: settingType, setting_key: settingKey, setting_value: settingValue });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['default-company-settings'] }),
  });
}

// ─── Company Accounting Settings ───
export function useSaveCompanyAccountingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, settings }: { companyId: string; settings: any }) => {
      const { data: existing } = await untypedFrom('company_accounting_settings').select('id').eq('company_id', companyId).maybeSingle();
      if (existing) {
        const { error } = await untypedFrom('company_accounting_settings').update(settings).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)('company_accounting_settings').insert({ company_id: companyId, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: (_, { companyId }) => queryClient.invalidateQueries({ queryKey: ['company-accounting-settings', companyId] }),
  });
}

// ─── Login Settings ───
export function useLoginSettings() {
  return useQuery({
    queryKey: ['login-settings'],
    queryFn: async () => {
      const keys = ['login_bg_color', 'login_card_color', 'login_title', 'login_subtitle', 'login_logo_url'];
      const { data } = await supabase.from('app_settings').select('key, value').in('key', keys).is('company_id', null);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveLoginSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { data: existing } = await supabase.from('app_settings').select('id').eq('key', key).is('company_id', null).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('app_settings').update({ value }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({ key, value, company_id: null });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['login-settings'] }),
  });
}

// ─── Subdomain Management ───
export function useUpdateSubdomain() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, subdomain }: { id: string; subdomain: string }) => {
      const { data: existing } = await supabase.from('companies').select('id').eq('subdomain', subdomain).neq('id', id).maybeSingle();
      if (existing) throw new Error('هذا الـ Subdomain مستخدم بالفعل');
      const { error } = await supabase.from('companies').update({ subdomain }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company-subdomains'] }),
  });
}
