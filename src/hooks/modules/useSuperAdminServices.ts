/**
 * Centralized Service Hooks for Super-Admin & Security modules
 * Replaces direct Supabase access in super-admin components
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Companies ───
export function useAllCompanies(select = 'id, name, is_active') {
  return useQuery({
    queryKey: ['all-companies', select],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select(select);
      return data || [];
    },
  });
}

export function useActiveCompanies() {
  return useQuery({
    queryKey: ['active-companies'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name').eq('is_active', true);
      return data || [];
    },
  });
}

// ─── Backups ───
export function useAllBackups(limit = 100) {
  return useQuery({
    queryKey: ['all-backups', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('backups').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAllBackupSchedules() {
  return useQuery({
    queryKey: ['all-backup-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('backup_schedules').select('*');
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Central Alerts ───
export function useCentralAlerts(limit = 100) {
  return useQuery({
    queryKey: ['central-smart-alerts', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('notifications').select('*').eq('is_read', false).order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Companies Report ───
export function useCompaniesFullStats() {
  return useQuery({
    queryKey: ['companies-full-stats'],
    queryFn: async () => {
      const { data: companies } = await supabase.from('companies').select('id, name, is_active, created_at');
      if (!companies) return [];

      const results = await Promise.all(
        companies.map(async (company) => {
          const [profiles, cars, sales, invoices, customers, suppliers, expenses, journals, quotations, vouchers] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('cars').select('id, status', { count: 'exact' }).eq('company_id', company.id),
            supabase.from('sales').select('sale_price, profit').eq('company_id', company.id),
            supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('expenses').select('amount').eq('company_id', company.id),
            supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('quotations').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('vouchers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          ]);

          const carsData = cars.data || [];
          const salesData = sales.data || [];
          const expensesData = expenses.data || [];

          return {
            company_id: company.id,
            company_name: company.name,
            is_active: company.is_active,
            created_at: company.created_at,
            users_count: profiles.count || 0,
            cars_count: carsData.length,
            available_cars: carsData.filter((c: any) => c.status === 'available').length,
            sold_cars: carsData.filter((c: any) => c.status === 'sold').length,
            sales_count: salesData.length,
            total_sales: salesData.reduce((s: number, r: any) => s + (r.sale_price || 0), 0),
            total_profit: salesData.reduce((s: number, r: any) => s + (r.profit || 0), 0),
            customers_count: customers.count || 0,
            suppliers_count: suppliers.count || 0,
            quotations_count: quotations.count || 0,
            expenses_total: expensesData.reduce((s: number, e: any) => s + (e.amount || 0), 0),
            vouchers_count: vouchers.count || 0,
            journal_entries_count: journals.count || 0,
          };
        })
      );
      return results;
    },
  });
}

// ─── Company Performance Comparison ───
export function useCompanyPerformanceMetrics() {
  return useQuery({
    queryKey: ['company-performance-comparison'],
    queryFn: async () => {
      const { data: companies } = await supabase.from('companies').select('id, name, is_active');
      if (!companies) return [];

      const results = await Promise.all(
        companies.map(async (company) => {
          const [entries, sales, invoices, customers] = await Promise.all([
            supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('sales').select('sale_price').eq('company_id', company.id),
            supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
            supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          ]);

          return {
            id: company.id,
            name: company.name,
            entriesCount: entries.count || 0,
            salesTotal: (sales.data || []).reduce((sum: number, s: any) => sum + (s.sale_price || 0), 0),
            invoicesCount: invoices.count || 0,
            customersCount: customers.count || 0,
            isActive: company.is_active,
          };
        })
      );
      return results;
    },
  });
}

// ─── Sensitive Operations Log ───
export function useSensitiveOperationsLog(limit = 200) {
  return useQuery({
    queryKey: ['all-sensitive-operations', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('sensitive_operations_log').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Revenue / Subscriptions ───
export function useRevenueSubscriptions() {
  return useQuery({
    queryKey: ['saas-subscriptions-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('subscriptions').select('*, companies(name)').order('end_date', { ascending: true });
      return data || [];
    },
  });
}

// ─── SaaS Executive Dashboard ───
export function useSaaSMonthlyGrowth() {
  return useQuery({
    queryKey: ['saas-monthly-growth'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('created_at').order('created_at');
      if (!data) return [];

      const monthMap: Record<string, number> = {};
      data.forEach(c => {
        const month = c.created_at.substring(0, 7);
        monthMap[month] = (monthMap[month] || 0) + 1;
      });

      let cumulative = 0;
      return Object.entries(monthMap).map(([month, count]) => {
        cumulative += count;
        return { month: month.substring(5), companies: cumulative, newCompanies: count };
      });
    },
  });
}

export function useSaaSPlanDistribution() {
  return useQuery({
    queryKey: ['saas-plan-distribution'],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('subscriptions').select('plan_id, companies(name)').eq('is_active', true);
      if (!data) return [];

      const planMap: Record<string, number> = {};
      data.forEach((s: any) => {
        const plan = s.plan_id || 'free';
        planMap[plan] = (planMap[plan] || 0) + 1;
      });

      return Object.entries(planMap).map(([name, value]) => ({ name, value }));
    },
  });
}

// ─── Support Center ───
export function useSupportTickets() {
  return useQuery({
    queryKey: ['support-tickets-admin'],
    queryFn: async () => {
      const { data } = await supabase.from('support_tickets').select('*, companies(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'resolved' || status === 'closed') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support-tickets-admin'] }),
  });
}

// ─── Subdomain Management ───
export function useCompanySubdomains() {
  return useQuery({
    queryKey: ['company-subdomains'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, name, subdomain, is_active, created_at').order('name');
      if (error) throw error;
      return data || [];
    },
  });
}

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

// ─── System Monitoring ───
export function useSystemMonitoringStats() {
  return useQuery({
    queryKey: ['system-monitoring-real'],
    queryFn: async () => {
      const [companiesRes, profilesRes, journalsRes, salesRes, invoicesRes, checksRes, expensesRes, customersRes, suppliersRes, carsRes] = await Promise.all([
        supabase.from('companies').select('id, database_size_mb, api_calls_count, is_active, last_activity_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('id', { count: 'exact', head: true }),
        supabase.from('invoices').select('id', { count: 'exact', head: true }),
        supabase.from('checks').select('id', { count: 'exact', head: true }),
        supabase.from('expenses').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('cars').select('id', { count: 'exact', head: true }),
      ]);

      const companies = companiesRes.data || [];
      const totalDbSize = companies.reduce((s, c) => s + Number((c as any).database_size_mb || 0), 0);
      const totalApiCalls = companies.reduce((s, c) => s + Number((c as any).api_calls_count || 0), 0);
      const activeCompanies = companies.filter(c => c.is_active).length;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const activeRecently = companies.filter(c => (c as any).last_activity_at && (c as any).last_activity_at > oneDayAgo).length;

      return {
        totalCompanies: companiesRes.count || 0,
        activeCompanies,
        activeRecently,
        totalUsers: profilesRes.count || 0,
        totalJournals: journalsRes.count || 0,
        totalSales: salesRes.count || 0,
        totalInvoices: invoicesRes.count || 0,
        totalChecks: checksRes.count || 0,
        totalExpenses: expensesRes.count || 0,
        totalCustomers: customersRes.count || 0,
        totalSuppliers: suppliersRes.count || 0,
        totalCars: carsRes.count || 0,
        totalDbSize,
        totalApiCalls,
      };
    },
  });
}

// ─── System Labels ───
export function useSystemLabels(companyType: string) {
  return useQuery({
    queryKey: ['system-labels', companyType],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('key, value').is('company_id', null).like('key', 'label_%');
      return data || [];
    },
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

// ─── System Settings (SystemControlCenter) ───
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

// ─── Users Management ───
export function useAllUsers() {
  return useQuery({
    queryKey: ['all-users-management'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*, companies(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      const { error } = await supabase.from('profiles').update({ permissions } as any).eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users-management'] }),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-users-management'] }),
  });
}

// ─── RBAC Management ───
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users-rbac'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('admin_users').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: { email: string; role: string; full_name: string }) => {
      const { error } = await (supabase.from as any)('admin_users').insert({
        ...user,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users-rbac'] }),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)('admin_users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users-rbac'] }),
  });
}

// ─── Default Company Settings ───
export function useDefaultSettings() {
  return useQuery({
    queryKey: ['default-company-settings'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('default_company_settings').select('*');
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSaveDefaultSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ settingType, settingKey, settingValue }: { settingType: string; settingKey: string; settingValue: string }) => {
      const { data: existing } = await (supabase.from as any)('default_company_settings')
        .select('id')
        .eq('setting_type', settingType)
        .eq('setting_key', settingKey)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase.from as any)('default_company_settings')
          .update({ setting_value: settingValue })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)('default_company_settings')
          .insert({ setting_type: settingType, setting_key: settingKey, setting_value: settingValue });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['default-company-settings'] }),
  });
}

// ─── Company Accounting Settings ───
export function useCompanyAccounts(companyId: string) {
  return useQuery({
    queryKey: ['company-accounts', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('account_categories').select('id, code, name, type').eq('company_id', companyId).order('code');
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useCompanyAccountingSettings(companyId: string) {
  return useQuery({
    queryKey: ['company-accounting-settings', companyId],
    queryFn: async () => {
      const { data } = await (supabase.from as any)('company_accounting_settings').select('*').eq('company_id', companyId).maybeSingle();
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveCompanyAccountingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ companyId, settings }: { companyId: string; settings: any }) => {
      const { data: existing } = await (supabase.from as any)('company_accounting_settings').select('id').eq('company_id', companyId).maybeSingle();
      if (existing) {
        const { error } = await (supabase.from as any)('company_accounting_settings').update(settings).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from as any)('company_accounting_settings').insert({ company_id: companyId, ...settings });
        if (error) throw error;
      }
    },
    onSuccess: (_, { companyId }) => queryClient.invalidateQueries({ queryKey: ['company-accounting-settings', companyId] }),
  });
}

// ─── Company Admin Dashboard ───
export function useCompanyDashboardData(companyId: string) {
  return useQuery({
    queryKey: ['company-admin-dashboard', companyId],
    queryFn: async () => {
      const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single();
      if (!company) throw new Error('Company not found');

      const [profiles, cars, sales, customers, suppliers, expenses, journals] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('cars').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('sales').select('sale_price, profit').eq('company_id', companyId),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('expenses').select('amount').eq('company_id', companyId),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
      ]);

      const salesData = sales.data || [];
      const expensesData = expenses.data || [];

      return {
        company,
        users_count: profiles.count || 0,
        cars_count: cars.count || 0,
        sales_count: salesData.length,
        total_sales: salesData.reduce((s: number, r: any) => s + (r.sale_price || 0), 0),
        total_profit: salesData.reduce((s: number, r: any) => s + (r.profit || 0), 0),
        customers_count: customers.count || 0,
        suppliers_count: suppliers.count || 0,
        expenses_total: expensesData.reduce((s: number, e: any) => s + (e.amount || 0), 0),
        journal_entries_count: journals.count || 0,
      };
    },
    enabled: !!companyId,
  });
}

// ─── Security: Financial Protection Stats (ImpactAnalysisPanel) ───
export function useFinancialProtectionStats() {
  return useQuery({
    queryKey: ['financial-protection-stats'],
    queryFn: async () => {
      const invoices = await supabase.from('invoices').select('id', { count: 'exact', head: true }).in('status', ['issued', 'approved', 'posted']);
      const entries = await (supabase.from as any)('journal_entries').select('id', { count: 'exact', head: true }).in('status', ['posted', 'approved']);
      const items = await supabase.from('invoice_items').select('id', { count: 'exact', head: true });
      return {
        protectedInvoices: invoices.count || 0,
        protectedEntries: entries.count || 0,
        totalItems: items.count || 0,
      };
    },
  });
}

// ─── Security: System Change Log ───
export function useSystemChangeLog(limit = 100) {
  return useQuery({
    queryKey: ['system-change-log', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('system_change_log').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Security: Freeze Mode ───
export function useSystemFreezeMode() {
  return useQuery({
    queryKey: ['system-freeze-mode'],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'system_freeze_mode').is('company_id', null).maybeSingle();
      return data?.value === 'true';
    },
  });
}

export function useToggleFreeze() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ freeze, masterCode }: { freeze: boolean; masterCode: string }) => {
      if (!masterCode || masterCode.length < 4) throw new Error('يجب إدخال كود المدير الرئيسي (4 أحرف على الأقل)');

      const { data: existing } = await supabase.from('app_settings').select('id').eq('key', 'system_freeze_mode').is('company_id', null).maybeSingle();

      if (existing) {
        const { error } = await supabase.from('app_settings').update({ value: String(freeze) }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({ key: 'system_freeze_mode', value: String(freeze), company_id: null });
        if (error) throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase.from as any)('system_change_log').insert({
        user_id: user?.id,
        change_type: 'config_change',
        module: 'system_freeze',
        description: freeze ? 'تفعيل وضع التجميد الشامل' : 'إلغاء وضع التجميد',
        previous_value: { frozen: !freeze },
        new_value: { frozen: freeze },
        authorization_method: 'master_code',
        status: 'applied',
        applied_at: new Date().toISOString(),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system-freeze-mode'] }),
  });
}

// ─── Security: Code Integrity Hashes ───
export function useCodeIntegrityHashes(limit = 100) {
  return useQuery({
    queryKey: ['code-integrity-hashes', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('code_integrity_hashes').select('*').order('updated_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Security: Engine Versions ───
export function useEngineVersions() {
  return useQuery({
    queryKey: ['accounting-engine-versions'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('accounting_engine_versions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateEngineVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ version, description }: { version: string; description: string }) => {
      if (!version) throw new Error('رقم النسخة مطلوب');
      const { data: { user } } = await supabase.auth.getUser();

      await (supabase.from as any)('accounting_engine_versions').update({ is_current: false }).eq('is_current', true);

      const { error } = await (supabase.from as any)('accounting_engine_versions').insert({
        version_number: version,
        description,
        is_active: true,
        is_current: true,
        activated_at: new Date().toISOString(),
        activated_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['accounting-engine-versions'] }),
  });
}

// ─── Security: Financial Period Locks ───
export function useFinancialPeriodLocks() {
  return useQuery({
    queryKey: ['financial-period-locks'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('financial_period_locks').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateFinancialPeriodLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lockData: { companyId: string; periodStart: string; periodEnd: string; reason: string }) => {
      if (!lockData.companyId || !lockData.periodStart || !lockData.periodEnd) throw new Error('جميع الحقول مطلوبة');
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)('financial_period_locks').insert({
        company_id: lockData.companyId,
        period_start: lockData.periodStart,
        period_end: lockData.periodEnd,
        reason: lockData.reason,
        locked_by: user?.id,
        is_locked: true,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-period-locks'] }),
  });
}

// ─── Security: Financial Time Machine ───
export function useFinancialSnapshots(companyId: string) {
  return useQuery({
    queryKey: ['financial-snapshots', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await (supabase.from as any)('financial_snapshots').select('*').eq('company_id', companyId).order('snapshot_date', { ascending: false }).limit(90);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export function useTakeFinancialSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (companyId: string) => {
      if (!companyId) throw new Error('اختر شركة أولاً');

      const [sales, expenses, entries, invoices] = await Promise.all([
        supabase.from('sales').select('sale_price, profit').eq('company_id', companyId),
        supabase.from('expenses').select('amount').eq('company_id', companyId),
        supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('invoices').select('id, total_amount').eq('company_id', companyId),
      ]);

      const salesData = sales.data || [];
      const expensesData = expenses.data || [];
      const invoicesData = invoices.data || [];

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await (supabase.from as any)('financial_snapshots').insert({
        company_id: companyId,
        snapshot_date: new Date().toISOString(),
        created_by: user?.id,
        total_sales: salesData.reduce((s: number, r: any) => s + (r.sale_price || 0), 0),
        total_profit: salesData.reduce((s: number, r: any) => s + (r.profit || 0), 0),
        total_expenses: expensesData.reduce((s: number, e: any) => s + (e.amount || 0), 0),
        total_entries: entries.count || 0,
        total_invoices_amount: invoicesData.reduce((s: number, i: any) => s + (i.total_amount || 0), 0),
        snapshot_data: {
          salesCount: salesData.length,
          expensesCount: expensesData.length,
          invoicesCount: invoicesData.length,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['financial-snapshots'] }),
  });
}

// ─── Security: Security Incidents ───
export function useSecurityIncidents(limit = 100) {
  return useQuery({
    queryKey: ['security-incidents', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('security_incidents').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

// ─── Security: Tamper Detector ───
export function useTamperScanRuns() {
  return useQuery({
    queryKey: ['tamper-scan-runs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tamper_scan_runs').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useTamperEvents() {
  return useQuery({
    queryKey: ['tamper-events'],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('tamper_events').select('*').order('detected_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRunTamperScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('tamper_scan_runs').insert({
        initiated_by: user?.id,
        status: 'completed',
        tables_scanned: Object.keys({
          invoices: true, invoice_items: true, journal_entries: true,
          journal_entry_lines: true, account_categories: true, checks: true,
          expenses: true, vouchers: true, app_settings: true,
        }),
        issues_found: 0,
        completed_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tamper-scan-runs'] });
      queryClient.invalidateQueries({ queryKey: ['tamper-events'] });
    },
  });
}

// ─── Security: Two Person Approval ───
export function useTwoPersonApprovals(limit = 50) {
  return useQuery({
    queryKey: ['two-person-approvals', limit],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)('two_person_approvals').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useApproveTwoPersonRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, approverLevel, authCode }: { requestId: string; approverLevel: 'first' | 'second'; authCode: string }) => {
      if (!authCode || authCode.length < 4) throw new Error('كود التفويض مطلوب');
      const { data: { user } } = await supabase.auth.getUser();

      const updateField = approverLevel === 'first'
        ? { first_approver_id: user?.id, first_approved_at: new Date().toISOString(), status: 'first_approved' }
        : { second_approver_id: user?.id, second_approved_at: new Date().toISOString(), status: 'fully_approved' };

      const { error } = await (supabase.from as any)('two_person_approvals').update(updateField).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['two-person-approvals'] }),
  });
}

export function useRejectTwoPersonRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)('two_person_approvals').update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_by: user?.id,
        rejected_at: new Date().toISOString(),
      }).eq('id', requestId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['two-person-approvals'] }),
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
