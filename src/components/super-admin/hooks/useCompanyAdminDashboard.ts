/**
 * Company Admin Dashboard - Logic Hook
 * Extracted from CompanyAdminDashboard.tsx (617 lines)
 * Uses service layer (no direct DB queries).
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchCompaniesWithStats, updateCompanyQuota } from '@/services/superAdmin/companyDashboardService';

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
    queryFn: fetchCompaniesWithStats,
    staleTime: 5 * 60 * 1000,
  });

  const updateQuota = useMutation({
    mutationFn: async ({ companyId, form }: { companyId: string; form: QuotaForm }) => {
      await updateCompanyQuota(companyId, form);
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
