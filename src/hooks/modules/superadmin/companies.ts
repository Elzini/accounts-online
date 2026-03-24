/**
 * Super Admin - Company Management Services
 */
import { useQuery } from '@tanstack/react-query';
import { supabase, untypedFrom } from '@/integrations/supabase/untypedFrom';

export function useAllCompanies(select = 'id, name, is_active') {
  return useQuery({
    queryKey: ['all-companies', select],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select(select);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveCompanies() {
  return useQuery({
    queryKey: ['active-companies'],
    queryFn: async () => {
      const { data } = await supabase.from('companies').select('id, name').eq('is_active', true);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

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
    staleTime: 5 * 60 * 1000,
  });
}

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
    staleTime: 5 * 60 * 1000,
  });
}

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
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanySubdomains() {
  return useQuery({
    queryKey: ['company-subdomains'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('id, name, subdomain, is_active, created_at').order('name');
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyUsageBreakdown() {
  return useQuery({
    queryKey: ['system-company-usage'],
    queryFn: async () => {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, database_size_mb, api_calls_count, last_activity_at, is_active')
        .order('api_calls_count', { ascending: false })
        .limit(20);

      if (!companies) return [];

      const enriched = await Promise.all(
        companies.map(async (c) => {
          const { count: userCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', c.id);
          const { count: journalCount } = await supabase.from('journal_entries').select('id', { count: 'exact', head: true }).eq('company_id', c.id);

          return {
            ...c,
            users: userCount || 0,
            journals: journalCount || 0,
            dbSize: Number((c as any).database_size_mb || 0),
            apiCalls: Number((c as any).api_calls_count || 0),
            lastActivity: (c as any).last_activity_at,
          };
        })
      );
      return enriched;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCompanyAccounts(companyId: string) {
  return useQuery({
    queryKey: ['company-accounts', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('account_categories').select('id, code, name, type').eq('company_id', companyId).order('code');
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyAccountingSettings(companyId: string) {
  return useQuery({
    queryKey: ['company-accounting-settings', companyId],
    queryFn: async () => {
      const { data } = await untypedFrom('company_accounting_settings').select('*').eq('company_id', companyId).maybeSingle();
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
