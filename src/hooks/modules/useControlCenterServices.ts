/**
 * Control Center & Settings - Service Hooks
 * Covers: Reports Config, Sensitive Ops, Smart Alerts, Permissions, 
 * General Settings, Menu Config, Activity Log, Accounting Settings, 
 * Invoice Settings, Report Settings
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/untypedFrom';
import { useCompany } from '@/contexts/CompanyContext';

function useCompanyId() {
  const { companyId } = useCompany();
  return companyId;
}

// ── Built-in Reports Config ──
export function useBuiltInReportsConfig() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['report-configs', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('company_id', companyId)
        .like('key', 'report_config_%');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveReportConfig() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, company_id: companyId! }, { onConflict: 'key,company_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-configs', companyId] }),
  });
}

// ── Sensitive Operations Log (redirected to audit_logs) ──
export function useSensitiveOpsLog() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['company-sensitive-ops', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .in('action', ['delete', 'update'])
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Smart Alerts ──
export function useCompanySmartAlerts() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['company-smart-alerts', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Employee Permissions ──
export function useEmployeePermissions(table: string) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['field-permissions', companyId, table],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await (supabase as any)
        .from('field_level_permissions')
        .select('*')
        .eq('company_id', companyId)
        .eq('table_name', table);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyMembers() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['company-members-perms', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await (supabase as any)
        .from('company_members')
        .select('user_id, role, profiles(full_name, email)')
        .eq('company_id', companyId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertFieldPermission() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (perm: { table_name: string; field_name: string; user_id: string; can_view: boolean; can_edit: boolean }) => {
      const { error } = await (supabase as any)
        .from('field_level_permissions')
        .upsert({ ...perm, company_id: companyId! }, { onConflict: 'company_id,table_name,field_name,user_id' });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['field-permissions', companyId, v.table_name] }),
  });
}

// ── General Settings (app_settings) ──
export function useAppSetting(key: string) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['app-setting', key, companyId],
    queryFn: async () => {
      if (companyId) {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', key)
          .eq('company_id', companyId)
          .maybeSingle();
        if (data?.value) return data.value;
      }
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .is('company_id', null)
        .maybeSingle();
      return data?.value || null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveAppSetting() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, company_id: companyId || undefined }, { onConflict: 'key,company_id' });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ['app-setting', v.key] }),
  });
}

// ── User Activity Log ──
export function useUserActivityLog() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['user-activity-log', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Company Accounting Settings ──
export function useCompanyAccountingSettings() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['company-accounting-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('company_accounting_settings')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccountCategories() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['account-categories-settings', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('account_categories')
        .select('id, code, name, type')
        .eq('company_id', companyId)
        .order('code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveAccountingSettings() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const { error } = await supabase
        .from('company_accounting_settings')
        .upsert({ ...settings, company_id: companyId! }, { onConflict: 'company_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company-accounting-settings', companyId] }),
  });
}

// ── Invoice Settings ──
export function useInvoiceSettings() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['invoice-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'invoice_settings')
        .eq('company_id', companyId)
        .maybeSingle();
      return data?.value ? JSON.parse(data.value) : null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveInvoiceSettings() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'invoice_settings', value: JSON.stringify(settings), company_id: companyId! }, { onConflict: 'key,company_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice-settings', companyId] }),
  });
}

// ── Report Settings ──
export function useReportSettingsData() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['report-settings', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'report_settings')
        .eq('company_id', companyId)
        .maybeSingle();
      return data?.value ? JSON.parse(data.value) : null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveReportSettings() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: Record<string, any>) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'report_settings', value: JSON.stringify(settings), company_id: companyId! }, { onConflict: 'key,company_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-settings', companyId] }),
  });
}

// ── Custom Invoice Template (background/logo upload) ──
export function useUploadInvoiceBackground() {
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop();
      const path = `${companyId}/invoice-bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('company-assets').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(path);
      return urlData.publicUrl;
    },
  });
}

// ── Menu Config (uses systemControl service) ──
export function useMenuCompanyType() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['company-type-menu', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data, error } = await supabase
        .from('companies')
        .select('company_type')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw error;
      return data?.company_type || null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Password Change (auth) ──
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('No user');
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInError) throw new Error('wrong_password');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
  });
}
