/**
 * Company Admin Dashboard - Logic Hook
 * Extracted from CompanyAdminDashboard.tsx (617 lines)
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useSuperAdminServices';
import { toast } from 'sonner';

export interface CompanyDashboardData {
  company_id: string;
  company_name: string;
  subdomain: string | null;
  is_active: boolean;
  company_type: string;
  created_at: string;
  users_count: number;
  cars_count: number;
  sales_count: number;
  total_sales: number;
  total_profit: number;
  customers_count: number;
  suppliers_count: number;
  expenses_total: number;
  journal_entries_count: number;
  max_users: number;
  max_requests_per_minute: number;
  max_storage_mb: number;
  max_records_per_table: number;
  quota_active: boolean;
  has_schema: boolean;
  has_encryption: boolean;
  recent_requests: number;
}

export interface QuotaForm {
  max_users: number;
  max_requests_per_minute: number;
  max_storage_mb: number;
  max_records_per_table: number;
  is_active: boolean;
}

export const ACTIVITY_LABELS: Record<string, string> = {
  car_dealership: 'معرض سيارات',
  construction: 'مقاولات',
  general_trading: 'تجارة عامة',
  restaurant: 'مطاعم',
  export_import: 'استيراد وتصدير',
};

export function useCompanyAdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaForm, setQuotaForm] = useState<QuotaForm>({
    max_users: 50, max_requests_per_minute: 100, max_storage_mb: 500, max_records_per_table: 100000, is_active: true,
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['company-admin-dashboard'],
    queryFn: async (): Promise<CompanyDashboardData[]> => {
      const { data: companies, error } = await supabase.from('companies').select('*').order('created_at', { ascending: true });
      if (error) throw error;

      const results: CompanyDashboardData[] = [];
      for (const company of companies || []) {
        const [usersRes, carsRes, salesRes, customersRes, suppliersRes, expensesRes, journalRes, quotaRes, rateLimitRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('cars').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('sales').select('sale_price, profit').eq('company_id', company.id),
          supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('expenses').select('amount').eq('company_id', company.id),
          supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
          supabase.from('tenant_resource_quotas').select('*').eq('company_id', company.id).maybeSingle(),
          supabase.from('tenant_rate_limits').select('request_count').eq('company_id', company.id),
        ]);

        const salesData = salesRes.data || [];
        const expensesData = expensesRes.data || [];
        const quota = quotaRes.data;

        let hasSchema = false, hasEncryption = false;
        try { const { data: sc } = await supabase.rpc('check_tenant_schema_exists', { p_company_id: company.id }); hasSchema = !!sc; } catch {}
        try { const { data: ec } = await supabase.rpc('check_tenant_encryption_exists', { p_company_id: company.id }); hasEncryption = !!ec; } catch {}

        const recentRequests = (rateLimitRes.data || []).reduce((sum, r) => sum + (r.request_count || 0), 0);

        results.push({
          company_id: company.id, company_name: company.name,
          subdomain: (company as any).subdomain || null, is_active: company.is_active,
          company_type: company.company_type || 'general_trading', created_at: company.created_at,
          users_count: usersRes.count || 0, cars_count: carsRes.count || 0,
          sales_count: salesData.length,
          total_sales: salesData.reduce((s, r) => s + (r.sale_price || 0), 0),
          total_profit: salesData.reduce((s, r) => s + (r.profit || 0), 0),
          customers_count: customersRes.count || 0, suppliers_count: suppliersRes.count || 0,
          expenses_total: expensesData.reduce((s, r) => s + (r.amount || 0), 0),
          journal_entries_count: journalRes.count || 0,
          max_users: quota?.max_users || 50, max_requests_per_minute: quota?.max_requests_per_minute || 100,
          max_storage_mb: quota?.max_storage_mb || 500, max_records_per_table: quota?.max_records_per_table || 100000,
          quota_active: quota?.is_active ?? true, has_schema: hasSchema, has_encryption: hasEncryption,
          recent_requests: recentRequests,
        });
      }
      return results;
    },
  });

  const updateQuota = useMutation({
    mutationFn: async ({ companyId, form }: { companyId: string; form: QuotaForm }) => {
      const { error } = await supabase.from('tenant_resource_quotas').update({
        max_users: form.max_users, max_requests_per_minute: form.max_requests_per_minute,
        max_storage_mb: form.max_storage_mb, max_records_per_table: form.max_records_per_table,
        is_active: form.is_active, updated_at: new Date().toISOString(),
      }).eq('company_id', companyId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['company-admin-dashboard'] }); toast.success('تم تحديث الحصص بنجاح'); setQuotaDialogOpen(false); },
    onError: () => toast.error('حدث خطأ أثناء تحديث الحصص'),
  });

  const openQuotaDialog = (company: CompanyDashboardData) => {
    setSelectedCompanyId(company.company_id);
    setQuotaForm({
      max_users: company.max_users, max_requests_per_minute: company.max_requests_per_minute,
      max_storage_mb: company.max_storage_mb, max_records_per_table: company.max_records_per_table,
      is_active: company.quota_active,
    });
    setQuotaDialogOpen(true);
  };

  const formatCurrency = (num: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(num);
  const formatNumber = (num: number) => new Intl.NumberFormat('ar-SA').format(num);
  const formatDate = (d: string) => new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d));

  const totals = dashboardData?.reduce(
    (acc, c) => ({
      users: acc.users + c.users_count, sales: acc.sales + c.total_sales,
      profit: acc.profit + c.total_profit, expenses: acc.expenses + c.expenses_total,
      requests: acc.requests + c.recent_requests, companies: acc.companies + 1,
      activeCompanies: acc.activeCompanies + (c.is_active ? 1 : 0),
      isolated: acc.isolated + (c.has_schema ? 1 : 0), encrypted: acc.encrypted + (c.has_encryption ? 1 : 0),
    }),
    { users: 0, sales: 0, profit: 0, expenses: 0, requests: 0, companies: 0, activeCompanies: 0, isolated: 0, encrypted: 0 }
  ) || { users: 0, sales: 0, profit: 0, expenses: 0, requests: 0, companies: 0, activeCompanies: 0, isolated: 0, encrypted: 0 };

  return {
    dashboardData, isLoading, totals,
    selectedCompanyId, quotaDialogOpen, setQuotaDialogOpen, quotaForm, setQuotaForm,
    updateQuota, openQuotaDialog,
    formatCurrency, formatNumber, formatDate,
  };
}
