/**
 * Unified Sales Service (Facade)
 * Abstracts the dual sales paths (sales table for cars, invoices table for general)
 * into a single interface for stats, counts, and lookups.
 * 
 * This is a non-breaking facade — existing code can migrate incrementally.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';

export interface UnifiedSaleRecord {
  id: string;
  date: string;
  amount: number;
  profit: number | null;
  customerName: string | null;
  source: 'sales' | 'invoices';
  referenceType: 'sale' | 'invoice_sale';
}

export interface UnifiedSalesSummary {
  totalCount: number;
  totalAmount: number;
  totalProfit: number;
}

/**
 * Fetch sales count from the correct table(s) based on company type.
 */
export async function fetchSalesCount(
  companyId: string,
  companyType?: string | null
): Promise<{ count: number; source: 'sales' | 'invoices' | 'both' }> {
  const features = getIndustryFeatures(companyType);

  if (features.hasCarInventory) {
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);
    return { count: count || 0, source: 'sales' };
  }

  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('invoice_type', 'sales');
  return { count: count || 0, source: 'invoices' };
}

/**
 * Fetch total sales amount from the correct table(s).
 */
export async function fetchSalesAmount(
  companyId: string,
  companyType?: string | null,
  dateRange?: { start: string; end: string }
): Promise<UnifiedSalesSummary> {
  const features = getIndustryFeatures(companyType);

  if (features.hasCarInventory) {
    let q = supabase
      .from('sales')
      .select('sale_price, profit')
      .eq('company_id', companyId);
    if (dateRange) {
      q = q.gte('sale_date', dateRange.start).lte('sale_date', dateRange.end);
    }
    const { data } = await q;
    const rows = data || [];
    return {
      totalCount: rows.length,
      totalAmount: rows.reduce((s, r: any) => s + (Number(r.sale_price) || 0), 0),
      totalProfit: rows.reduce((s, r: any) => s + (Number(r.profit) || 0), 0),
    };
  }

  let q = supabase
    .from('invoices')
    .select('subtotal')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sales');
  if (dateRange) {
    q = q.gte('invoice_date', dateRange.start).lte('invoice_date', dateRange.end);
  }
  const { data } = await q;
  const rows = data || [];
  return {
    totalCount: rows.length,
    totalAmount: rows.reduce((s, r: any) => s + (Number(r.subtotal) || 0), 0),
    totalProfit: 0, // invoices don't store profit directly
  };
}

/**
 * Fetch combined sales count from both tables (for audit/admin views).
 */
export async function fetchCombinedSalesCount(companyId: string): Promise<{
  carSales: number;
  invoiceSales: number;
  total: number;
}> {
  const [carRes, invRes] = await Promise.all([
    supabase.from('sales').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('invoice_type', 'sales'),
  ]);
  const carSales = carRes.count || 0;
  const invoiceSales = invRes.count || 0;
  return { carSales, invoiceSales, total: carSales + invoiceSales };
}

/**
 * Get the journal entry reference types used by this company's sales.
 */
export function getSalesReferenceTypes(companyType?: string | null): string[] {
  const features = getIndustryFeatures(companyType);
  if (features.hasCarInventory) return ['sale'];
  return ['invoice_sale'];
}
