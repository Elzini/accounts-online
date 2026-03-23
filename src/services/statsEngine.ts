/**
 * Stats Engine - Unified dashboard statistics service
 * 
 * Replaces the 3 duplicated fetchStats branches (car/real-estate/general)
 * with a single, industry-agnostic engine that uses Strategy Pattern.
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { requireCompanyId, toDateOnly } from '@/services/companyContext';
import { getIndustryFeatures } from '@/core/engine/industryFeatures';

// ── Unified Stats Result (no car-specific fields) ──
export interface DashboardStats {
  // Universal metrics
  todaySales: number;
  monthSales: number;
  monthSalesAmount: number;
  monthSalesProfit: number;
  totalSalesCount: number;
  totalSalesAmount: number;
  totalPurchases: number;
  purchasesCount: number;
  totalGrossProfit: number;
  totalProfit: number;
  // Expense breakdown
  totalGeneralExpenses: number;
  payrollExpenses: number;
  prepaidExpensesDue: number;
  otherGeneralExpenses: number;
  // Industry-specific (optional)
  industryMetrics: Record<string, number | string[]>;
}

// ── Helpers ──
function parseLocalISODate(iso: string, endOfDay = false) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  if (endOfDay) dt.setHours(23, 59, 59, 999);
  else dt.setHours(0, 0, 0, 0);
  return dt;
}

async function getFiscalYearDates(fiscalYearId?: string | null) {
  if (!fiscalYearId) return { start: null, end: null };
  const { data } = await supabase
    .from('fiscal_years')
    .select('start_date, end_date')
    .eq('id', fiscalYearId)
    .single();
  return { start: data?.start_date || null, end: data?.end_date || null };
}

function filterPayrollByFiscalYear(
  payrollData: any[], fyStart: string | null, fyEnd: string | null
) {
  if (!fyStart || !fyEnd) return payrollData;
  const s = parseLocalISODate(fyStart);
  const e = parseLocalISODate(fyEnd, true);
  return payrollData.filter(p => {
    const d = new Date(Number(p.year), Number(p.month) - 1, 1);
    return d >= s && d <= e;
  });
}

function sumPayroll(data: any[]) {
  return data.reduce((sum, p) =>
    sum + (Number(p.total_base_salaries) || 0) + (Number(p.total_allowances) || 0)
    + (Number(p.total_bonuses) || 0) + (Number(p.total_overtime) || 0)
    - (Number(p.total_absences) || 0), 0);
}

// ── Invoice-based stats (General Trading, Real Estate, etc.) ──
async function fetchInvoiceBasedStats(
  companyId: string, fiscalYearId: string | null | undefined,
  fyStart: string | null, fyEnd: string | null
): Promise<DashboardStats> {
  const now = new Date();
  const today = toDateOnly(now);
  const startOfMonth = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
  const endOfMonth = toDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  let purchaseQ = supabase.from('invoices').select('subtotal, invoice_date')
    .eq('company_id', companyId).eq('invoice_type', 'purchase');
  let salesQ = supabase.from('invoices').select('subtotal, invoice_date')
    .eq('company_id', companyId).eq('invoice_type', 'sales');
  let expensesQ = supabase.from('expenses').select('amount, expense_date, payment_method')
    .eq('company_id', companyId).is('car_id', null);
  let payrollQ = supabase.from('payroll_records')
    .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('status', 'approved').eq('company_id', companyId);

  if (fyStart && fyEnd) {
    purchaseQ = purchaseQ.gte('invoice_date', fyStart).lte('invoice_date', fyEnd);
    salesQ = salesQ.gte('invoice_date', fyStart).lte('invoice_date', fyEnd);
    expensesQ = expensesQ.gte('expense_date', fyStart).lte('expense_date', fyEnd);
  }

  const [pRes, sRes, eRes, prRes] = await Promise.all([purchaseQ, salesQ, expensesQ, payrollQ]);

  const purchases = pRes.data || [];
  const sales = sRes.data || [];
  const expenses = eRes.data || [];
  const payroll = filterPayrollByFiscalYear(prRes.data || [], fyStart, fyEnd);

  const totalPurchases = Math.round(purchases.reduce((s, i) => s + (Number(i.subtotal) || 0), 0));
  const totalSalesAmount = sales.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const generalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const payrollExp = sumPayroll(payroll);

  const monthSales = sales.filter(i => i.invoice_date >= startOfMonth && i.invoice_date <= endOfMonth);
  const monthPurchases = purchases.filter(i => i.invoice_date >= startOfMonth && i.invoice_date <= endOfMonth);
  const monthSalesAmount = monthSales.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);
  const monthPurchasesAmount = monthPurchases.reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  const totalExp = generalExpenses + payrollExp;

  return {
    todaySales: sales.filter(i => i.invoice_date === today).length,
    monthSales: monthSales.length,
    monthSalesAmount,
    monthSalesProfit: monthSalesAmount - monthPurchasesAmount,
    totalSalesCount: sales.length,
    totalSalesAmount,
    totalPurchases,
    purchasesCount: purchases.length,
    totalGrossProfit: totalSalesAmount - totalPurchases,
    totalProfit: totalSalesAmount - totalPurchases - totalExp,
    totalGeneralExpenses: totalExp,
    payrollExpenses: payrollExp,
    prepaidExpensesDue: 0,
    otherGeneralExpenses: generalExpenses,
    industryMetrics: {},
  };
}

// ── Real Estate specific additions ──
async function enrichRealEstateStats(
  stats: DashboardStats, companyId: string, fiscalYearId: string | null | undefined
): Promise<DashboardStats> {
  const { data: projects } = await supabase
    .from('re_projects')
    .select('id, name, status')
    .eq('company_id', companyId);

  const activeProjects = (projects || []).filter(p => {
    const s = String(p.status || '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled' && s !== 'canceled';
  });

  stats.industryMetrics = {
    activeProjects: activeProjects.length,
    activeProjectNames: activeProjects.map(p => p.name).filter(Boolean),
  };

  return stats;
}

// ── Car Dealership stats (isolated) ──
async function fetchCarDealershipStats(
  companyId: string, fiscalYearId: string | null | undefined,
  fyStart: string | null, fyEnd: string | null
): Promise<DashboardStats> {
  const now = new Date();
  const today = toDateOnly(now);
  const startOfMonth = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
  const endOfMonth = toDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  let carsQ = supabase.from('cars').select('*', { count: 'exact', head: true })
    .eq('status', 'available').eq('company_id', companyId);
  let salesQ = supabase.from('sales').select('profit, car_id, sale_date, sale_price')
    .eq('company_id', companyId);
  let expensesQ = supabase.from('expenses').select('amount, car_id, expense_date, payment_method')
    .eq('company_id', companyId);
  let payrollQ = supabase.from('payroll_records')
    .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('status', 'approved').eq('company_id', companyId);
  let purchasesQ = supabase.from('cars').select('purchase_price').eq('company_id', companyId);

  if (fyStart && fyEnd) {
    carsQ = carsQ.gte('purchase_date', fyStart).lte('purchase_date', fyEnd);
    salesQ = salesQ.gte('sale_date', fyStart).lte('sale_date', fyEnd);
    expensesQ = expensesQ.gte('expense_date', fyStart).lte('expense_date', fyEnd);
    if (fiscalYearId) {
      purchasesQ = purchasesQ.or(
        `fiscal_year_id.eq.${fiscalYearId},and(fiscal_year_id.is.null,purchase_date.gte.${fyStart},purchase_date.lte.${fyEnd})`
      );
    }
  }

  const [carsRes, salesRes, expRes, prRes, purRes] = await Promise.all([
    carsQ, salesQ, expensesQ, payrollQ, purchasesQ
  ]);

  const salesData = salesRes.data || [];
  const expensesData = expRes.data || [];
  const payroll = filterPayrollByFiscalYear(prRes.data || [], fyStart, fyEnd);

  const totalGrossProfit = salesData.reduce((s, sale) => s + (Number(sale.profit) || 0), 0);
  const soldCarIds = salesData.map(s => s.car_id);
  const carExpenses = expensesData
    .filter(e => e.car_id && soldCarIds.includes(e.car_id))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const otherExpenses = expensesData
    .filter(e => !e.car_id && e.payment_method !== 'prepaid')
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const payrollExp = sumPayroll(payroll);
  const totalPurchases = Math.round((purRes.data || []).reduce((s, c) => s + (Number(c.purchase_price) || 0), 0));

  const monthSalesData = salesData.filter(s => s.sale_date >= startOfMonth && s.sale_date <= endOfMonth);
  const totalSalesAmount = salesData.reduce((s, sale) => s + (Number(sale.sale_price) || 0), 0);
  const generalExpenses = otherExpenses + payrollExp;

  return {
    todaySales: salesData.filter(s => s.sale_date === today).length,
    monthSales: monthSalesData.length,
    monthSalesAmount: monthSalesData.reduce((s, sale) => s + (Number(sale.sale_price) || 0), 0),
    monthSalesProfit: monthSalesData.reduce((s, sale) => s + (Number(sale.profit) || 0), 0),
    totalSalesCount: salesData.length,
    totalSalesAmount,
    totalPurchases,
    purchasesCount: purRes.data?.length || 0,
    totalGrossProfit,
    totalProfit: totalGrossProfit - carExpenses - generalExpenses,
    totalGeneralExpenses: generalExpenses,
    payrollExpenses: payrollExp,
    prepaidExpensesDue: 0,
    otherGeneralExpenses: otherExpenses,
    industryMetrics: {
      availableCars: carsRes.count || 0,
      carExpenses,
    },
  };
}

// ── Shared company type resolver (single query, reused) ──
async function resolveCompanyType(companyId: string): Promise<string | null> {
  const { data } = await supabase.from('companies').select('company_type').eq('id', companyId).maybeSingle();
  return data?.company_type || null;
}

// ── Main Entry Point ──
export async function fetchDashboardStats(fiscalYearId?: string | null): Promise<DashboardStats> {
  const companyId = await requireCompanyId();
  const [{ start: fyStart, end: fyEnd }, companyType] = await Promise.all([
    getFiscalYearDates(fiscalYearId),
    resolveCompanyType(companyId),
  ]);
  const features = getIndustryFeatures(companyType);

  if (features.hasCarInventory) {
    return fetchCarDealershipStats(companyId, fiscalYearId, fyStart, fyEnd);
  }

  let stats = await fetchInvoiceBasedStats(companyId, fiscalYearId, fyStart, fyEnd);

  const { ModuleRegistry } = await import('@/core/engine/moduleRegistry');
  await import('@/core/modules');
  const industryModule = ModuleRegistry.getForType(companyType || 'general_trading');
  if (industryModule) {
    const extraStats = await industryModule.getDashboardStats(companyId, fiscalYearId);
    if (extraStats.extra) {
      stats.industryMetrics = { ...stats.industryMetrics, ...extraStats.extra };
    }
  }

  return stats;
}

// ── All-time stats ──
export async function fetchAllTimeDashboardStats() {
  const companyId = await requireCompanyId();
  const companyType = await resolveCompanyType(companyId);

  if (companyType && !getIndustryFeatures(companyType).hasCarInventory) {
    const [pRes, sRes] = await Promise.all([
      supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'purchase'),
      supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'sales'),
    ]);
    const purchases = Math.round((pRes.data || []).reduce((s: number, i: any) => s + (Number(i.subtotal) || 0), 0));
    const sales = (sRes.data || []).reduce((s: number, i: any) => s + (Number(i.subtotal) || 0), 0);
    return { allTimePurchases: purchases, allTimeSales: sales, allTimeSalesCount: sRes.data?.length || 0, allTimeProfit: sales - purchases };
  }

  const [carsRes, salesRes] = await Promise.all([
    supabase.from('cars').select('purchase_price').eq('company_id', companyId),
    supabase.from('sales').select('sale_price, profit').eq('company_id', companyId),
  ]);
  const purchases = Math.round((carsRes.data || []).reduce((s, c) => s + (Number(c.purchase_price) || 0), 0));
  const sales = (salesRes.data || []).reduce((s, sale) => s + (Number(sale.sale_price) || 0), 0);
  const profit = (salesRes.data || []).reduce((s, sale) => s + (Number(sale.profit) || 0), 0);
  return {
    allTimePurchases: purchases, allTimeSales: sales,
    allTimeSalesCount: salesRes.data?.length || 0, allTimeProfit: profit,
    industryMetrics: { totalCarsCount: carsRes.data?.length || 0 },
  };
}

// ── Monthly Chart Data ──
export async function fetchMonthlyChartData(fiscalYearId?: string) {
  const companyId = await requireCompanyId();
  const [{ start: fyStart, end: fyEnd }, companyType] = await Promise.all([
    getFiscalYearDates(fiscalYearId),
    resolveCompanyType(companyId),
  ]);

  let startDate: string;
  let endDate: string;

  if (fyStart && fyEnd) {
    startDate = fyStart;
    endDate = fyEnd;
  } else {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    startDate = toDateOnly(sixMonthsAgo);
    endDate = toDateOnly(new Date());
  }

  let rawData: Array<{ date: string; amount: number; profit: number }> = [];

  if (companyType && !getIndustryFeatures(companyType).hasCarInventory) {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_date, subtotal')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sales')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .order('invoice_date', { ascending: true });
    if (error) throw error;
    rawData = (invoices || []).map((inv: any) => ({
      date: inv.invoice_date,
      amount: Number(inv.subtotal) || 0,
      profit: Number(inv.subtotal) || 0,
    }));
  } else {
    const { data, error } = await supabase
      .from('sales')
      .select('sale_date, sale_price, profit')
      .eq('company_id', companyId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: true });
    if (error) throw error;
    rawData = (data || []).map(sale => ({
      date: sale.sale_date,
      amount: Number(sale.sale_price) || 0,
      profit: Number(sale.profit) || 0,
    }));
  }

  const monthlyData: Record<string, { sales: number; profit: number }> = {};
  rawData.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { sales: 0, profit: 0 };
    monthlyData[monthKey].sales += item.amount;
    monthlyData[monthKey].profit += item.profit;
  });

  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const result = [];

  if (fyStart && fyEnd) {
    const start = new Date(fyStart);
    const end = new Date(fyEnd);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: arabicMonths[current.getMonth()], sales: monthlyData[monthKey]?.sales || 0, profit: monthlyData[monthKey]?.profit || 0 });
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: arabicMonths[date.getMonth()], sales: monthlyData[monthKey]?.sales || 0, profit: monthlyData[monthKey]?.profit || 0 });
    }
  }

  return result;
}
