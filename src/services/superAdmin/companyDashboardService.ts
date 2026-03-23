/**
 * Company Admin Dashboard - Data Access Service
 * Replaces N+1 loop pattern (9 queries × N companies → 1 RPC + 2 queries).
 */
import { supabase } from '@/hooks/modules/useSuperAdminServices';

export interface CompanyStats {
  company_id: string;
  users_count: number;
  cars_count: number;
  sales_count: number;
  total_sales: number;
  total_profit: number;
  customers_count: number;
  suppliers_count: number;
  expenses_total: number;
  journal_entries_count: number;
}

export async function fetchCompaniesWithStats() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;

  // Try RPC first (server-side aggregation)
  let statsMap = new Map<string, CompanyStats>();
  try {
    const { data: stats } = await supabase.rpc('get_all_company_stats');
    if (stats && Array.isArray(stats)) {
      for (const s of stats) {
        statsMap.set(s.company_id, s as CompanyStats);
      }
    }
  } catch {
    // Fallback: batch queries for all companies at once instead of per-company
    const companyIds = (companies || []).map(c => c.id);
    if (companyIds.length > 0) {
      const [profilesRes, carsRes, salesRes, invoicesRes, customersRes, suppliersRes, expensesRes, journalRes] = await Promise.all([
        supabase.from('profiles').select('company_id').in('company_id', companyIds),
        supabase.from('cars').select('company_id').in('company_id', companyIds),
        supabase.from('sales').select('company_id, sale_price, profit').in('company_id', companyIds),
        supabase.from('invoices').select('company_id, subtotal').in('company_id', companyIds).eq('invoice_type', 'sales'),
        supabase.from('customers').select('company_id').in('company_id', companyIds),
        supabase.from('suppliers').select('company_id').in('company_id', companyIds),
        supabase.from('expenses').select('company_id, amount').in('company_id', companyIds),
        supabase.from('journal_entries').select('company_id').in('company_id', companyIds),
      ]);

      for (const cid of companyIds) {
        const companySales = (salesRes.data || []).filter((r: any) => r.company_id === cid);
        const companyInvoices = (invoicesRes.data || []).filter((r: any) => r.company_id === cid);
        const companyExpenses = (expensesRes.data || []).filter((r: any) => r.company_id === cid);
        const isCarCompany = (companies || []).find(c => c.id === cid)?.company_type === 'car_dealership';

        statsMap.set(cid, {
          company_id: cid,
          users_count: (profilesRes.data || []).filter((r: any) => r.company_id === cid).length,
          cars_count: (carsRes.data || []).filter((r: any) => r.company_id === cid).length,
          sales_count: isCarCompany ? companySales.length : companyInvoices.length,
          total_sales: isCarCompany
            ? companySales.reduce((s: number, r: any) => s + (r.sale_price || 0), 0)
            : companyInvoices.reduce((s: number, r: any) => s + (r.subtotal || 0), 0),
          total_profit: isCarCompany ? companySales.reduce((s: number, r: any) => s + (r.profit || 0), 0) : 0,
          customers_count: (customersRes.data || []).filter((r: any) => r.company_id === cid).length,
          suppliers_count: (suppliersRes.data || []).filter((r: any) => r.company_id === cid).length,
          expenses_total: companyExpenses.reduce((s: number, r: any) => s + (r.amount || 0), 0),
          journal_entries_count: (journalRes.data || []).filter((r: any) => r.company_id === cid).length,
        });
      }
    }
  }

  // Fetch quotas in batch
  const { data: quotas } = await supabase.from('tenant_resource_quotas').select('*');
  const quotaMap = new Map((quotas || []).map(q => [q.company_id, q]));

  return (companies || []).map(company => {
    const stats = statsMap.get(company.id);
    const quota = quotaMap.get(company.id) as any;
    return {
      company_id: company.id,
      company_name: company.name,
      subdomain: (company as any).subdomain || null,
      is_active: company.is_active,
      company_type: company.company_type || 'general_trading',
      created_at: company.created_at,
      users_count: stats?.users_count || 0,
      cars_count: stats?.cars_count || 0,
      sales_count: stats?.sales_count || 0,
      total_sales: stats?.total_sales || 0,
      total_profit: stats?.total_profit || 0,
      customers_count: stats?.customers_count || 0,
      suppliers_count: stats?.suppliers_count || 0,
      expenses_total: stats?.expenses_total || 0,
      journal_entries_count: stats?.journal_entries_count || 0,
      max_users: quota?.max_users || 50,
      max_requests_per_minute: quota?.max_requests_per_minute || 100,
      max_storage_mb: quota?.max_storage_mb || 500,
      max_records_per_table: quota?.max_records_per_table || 100000,
      quota_active: quota?.is_active ?? true,
      has_schema: false,
      has_encryption: false,
      recent_requests: 0,
    };
  });
}

export async function updateCompanyQuota(companyId: string, form: {
  max_users: number; max_requests_per_minute: number;
  max_storage_mb: number; max_records_per_table: number; is_active: boolean;
}) {
  const { error } = await supabase.from('tenant_resource_quotas').update({
    ...form, updated_at: new Date().toISOString(),
  }).eq('company_id', companyId);
  if (error) throw error;
}
