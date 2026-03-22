import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getCompanyOverride } from '@/lib/companyOverride';

// Re-export car dealership module for backward compatibility
export {
  fetchCars, addCar, updateCar, deleteCar, updateCarStatus,
  fetchSales, addSale, updateSale, updateSaleWithItems, deleteSale, reverseSale,
  addPurchaseBatch, fetchPurchaseBatches,
  addMultiCarSale, approveSale, fetchSalesWithItems, deleteMultiCarSale,
  recalculateCompanySalesProfits,
} from '@/services/carDealership';
export type { CarWithSaleInfo, MultiCarSaleData } from '@/services/carDealership';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

// Customers
// Use customers_safe view for read operations to mask sensitive PII (id_number, registration_number)
// The view shows only last 4 digits of identity documents for non-admin users
export async function fetchCustomers() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('customers_safe')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data?.map(customer => ({
    ...customer,
    id_number_encrypted: null as string | null,
  })) || [];
}

export async function addCustomer(customer: CustomerInsert) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...customer, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, customer: CustomerUpdate) {
  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Suppliers
// Use suppliers_safe view for read operations to mask sensitive data (phone, id_number, registration_number)
// The view shows only last 4 digits for non-admin users
export async function fetchSuppliers() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('suppliers_safe')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data?.map(supplier => ({
    id: supplier.id,
    company_id: supplier.company_id,
    name: supplier.name,
    phone: supplier.phone_masked,
    address: supplier.address,
    notes: supplier.notes,
    id_number: supplier.id_number_masked,
    registration_number: supplier.registration_number_masked,
    created_at: supplier.created_at,
    updated_at: supplier.updated_at,
    registration_number_encrypted: null as string | null,
  })) || [];
}

export async function addSupplier(supplier: SupplierInsert) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplier, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSupplier(id: string, supplier: SupplierUpdate) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplier)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// GENERAL FUNCTIONS (work for ALL company types)
// ============================================

// Stats
export async function fetchStats(fiscalYearId?: string | null) {
  const now = new Date();
  const today = toDateOnly(now);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfMonth = toDateOnly(currentMonthStart);
  const endOfMonth = toDateOnly(currentMonthEnd);

  const parseLocalISODate = (iso: string, endOfDay = false) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    if (endOfDay) dt.setHours(23, 59, 59, 999);
    else dt.setHours(0, 0, 0, 0);
    return dt;
  };

  let fiscalYearStart: string | null = null;
  let fiscalYearEnd: string | null = null;
  
  if (fiscalYearId) {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years')
      .select('start_date, end_date')
      .eq('id', fiscalYearId)
      .single();
    if (fiscalYear) {
      fiscalYearStart = fiscalYear.start_date;
      fiscalYearEnd = fiscalYear.end_date;
    }
  }

  const companyId = await requireCompanyId();
  const { data: companyRecord } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();

  const companyType = companyRecord?.company_type;

  // Real estate dashboard uses projects + invoices
  if (companyType === 'real_estate') {
    let projectsQuery = supabase
      .from('re_projects')
      .select('id, name, status')
      .eq('company_id', companyId);

    let purchaseInvoicesQuery = supabase
      .from('invoices')
      .select('subtotal, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'purchase');

    let salesInvoicesQuery = supabase
      .from('invoices')
      .select('subtotal, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sales');

    if (fiscalYearStart && fiscalYearEnd) {
      purchaseInvoicesQuery = purchaseInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);
      salesInvoicesQuery = salesInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);
    }

    const account1301Query = supabase
      .from('account_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', '1301')
      .maybeSingle();

    const [projectsResult, purchaseInvoicesResult, salesInvoicesResult, account1301Result] = await Promise.all([
      projectsQuery, purchaseInvoicesQuery, salesInvoicesQuery, account1301Query,
    ]);

    const projects = projectsResult.data || [];
    const purchaseInvoices = purchaseInvoicesResult.data || [];
    const salesInvoices = salesInvoicesResult.data || [];

    let totalPurchases = 0;
    const account1301 = account1301Result.data;
    if (account1301) {
      const { data: allAccounts } = await supabase
        .from('account_categories')
        .select('id, parent_id, type')
        .eq('company_id', companyId);

      if (allAccounts) {
        const childrenOf = new Map<string, string[]>();
        allAccounts.forEach(a => {
          if (a.parent_id) {
            const existing = childrenOf.get(a.parent_id) || [];
            existing.push(a.id);
            childrenOf.set(a.parent_id, existing);
          }
        });

        function getLeaves(accountId: string): string[] {
          const children = childrenOf.get(accountId);
          if (!children || children.length === 0) return [accountId];
          return children.flatMap(getLeaves);
        }

        const leafIds = getLeaves(account1301.id);
        let journalQuery = supabase
          .from('journal_entry_lines')
          .select('debit, credit, journal_entries!inner(is_posted, company_id, fiscal_year_id)')
          .eq('journal_entries.company_id', companyId)
          .eq('journal_entries.is_posted', true)
          .in('account_id', leafIds);

        if (fiscalYearId) {
          journalQuery = journalQuery.eq('journal_entries.fiscal_year_id', fiscalYearId);
        }

        const { data: lines } = await journalQuery;
        if (lines) {
          totalPurchases = lines.reduce((sum: number, line: any) => {
            return sum + (Number(line.debit) || 0) - (Number(line.credit) || 0);
          }, 0);
        }
      }
    }

    if (totalPurchases === 0 && purchaseInvoices.length > 0) {
      totalPurchases = Math.round(
        purchaseInvoices.reduce((sum: number, invoice: any) => sum + (Number(invoice.subtotal) || 0), 0)
      );
    }

    const activeProjectsList = projects.filter((project: any) => {
      const status = String(project.status || '').toLowerCase();
      return status !== 'completed' && status !== 'cancelled' && status !== 'canceled';
    });
    const activeProjects = activeProjectsList.length;
    const activeProjectNames = activeProjectsList.map((p: any) => p.name).filter(Boolean);

    const totalSalesAmount = salesInvoices.reduce(
      (sum: number, invoice: any) => sum + (Number(invoice.subtotal) || 0), 0
    );

    const monthSalesData = salesInvoices.filter((invoice: any) =>
      invoice.invoice_date >= startOfMonth && invoice.invoice_date <= endOfMonth
    );
    const monthPurchasesData = purchaseInvoices.filter((invoice: any) =>
      invoice.invoice_date >= startOfMonth && invoice.invoice_date <= endOfMonth
    );
    const monthSalesAmount = monthSalesData.reduce(
      (sum: number, invoice: any) => sum + (Number(invoice.subtotal) || 0), 0
    );

    return {
      availableNewCars: 0,
      availableUsedCars: 0,
      availableCars: activeProjects,
      activeProjectNames,
      todaySales: salesInvoices.filter((invoice: any) => invoice.invoice_date === today).length,
      totalProfit: totalSalesAmount,
      monthSales: monthSalesData.length,
      totalPurchases,
      monthSalesAmount,
      totalGrossProfit: totalSalesAmount,
      totalCarExpenses: 0,
      totalGeneralExpenses: 0,
      payrollExpenses: 0,
      prepaidExpensesDue: 0,
      otherGeneralExpenses: 0,
      purchasesCount: purchaseInvoices.length,
      monthSalesProfit: monthSalesAmount - monthPurchasesData.reduce(
        (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0
      ),
      totalSalesCount: salesInvoices.length,
      totalSalesAmount,
    };
  }

  // For car dealerships: use cars + sales tables
  if (companyType === 'car_dealership') {
    return fetchCarDealershipStats(companyId, fiscalYearId, fiscalYearStart, fiscalYearEnd, startOfMonth, endOfMonth, today, now, parseLocalISODate);
  }

  // ============================================
  // GENERAL COMPANIES: use invoices table
  // ============================================
  let purchaseInvoicesQuery = supabase
    .from('invoices')
    .select('subtotal, invoice_date')
    .eq('company_id', companyId)
    .eq('invoice_type', 'purchase');

  let salesInvoicesQuery = supabase
    .from('invoices')
    .select('subtotal, invoice_date')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sales');

  if (fiscalYearStart && fiscalYearEnd) {
    purchaseInvoicesQuery = purchaseInvoicesQuery
      .gte('invoice_date', fiscalYearStart)
      .lte('invoice_date', fiscalYearEnd);
    salesInvoicesQuery = salesInvoicesQuery
      .gte('invoice_date', fiscalYearStart)
      .lte('invoice_date', fiscalYearEnd);
  }

  let expensesQueryGeneral = supabase
    .from('expenses')
    .select('amount, car_id, expense_date, payment_method')
    .eq('company_id', companyId);
  
  if (fiscalYearStart && fiscalYearEnd) {
    expensesQueryGeneral = expensesQueryGeneral
      .gte('expense_date', fiscalYearStart)
      .lte('expense_date', fiscalYearEnd);
  }

  let payrollQueryGeneral = supabase
    .from('payroll_records')
    .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('status', 'approved')
    .eq('company_id', companyId);

  const [purchaseResult, salesResult, expensesResultGeneral, payrollResultGeneral] = await Promise.all([
    purchaseInvoicesQuery, salesInvoicesQuery, expensesQueryGeneral, payrollQueryGeneral,
  ]);

  const purchaseInvoices = purchaseResult.data || [];
  const salesInvoices = salesResult.data || [];
  const expensesDataGeneral = expensesResultGeneral.data || [];

  const totalPurchasesGeneral = Math.round(
    purchaseInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0)
  );
  const totalSalesAmountGeneral = salesInvoices.reduce(
    (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0
  );

  const generalExpensesAmount = expensesDataGeneral
    .filter(exp => !exp.car_id)
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  let payrollDataGeneral = payrollResultGeneral.data || [];
  if (fiscalYearStart && fiscalYearEnd) {
    const fyStartDate = parseLocalISODate(fiscalYearStart, false);
    const fyEndDate = parseLocalISODate(fiscalYearEnd, true);
    payrollDataGeneral = payrollDataGeneral.filter(p => {
      const payrollDate = new Date(Number(p.year), Number(p.month) - 1, 1);
      return payrollDate >= fyStartDate && payrollDate <= fyEndDate;
    });
  }
  const payrollExpensesGeneral = payrollDataGeneral.reduce((sum, p) => {
    return sum + (Number(p.total_base_salaries) || 0) + (Number(p.total_allowances) || 0)
      + (Number(p.total_bonuses) || 0) + (Number(p.total_overtime) || 0) - (Number(p.total_absences) || 0);
  }, 0);

  const monthSalesInvoices = salesInvoices.filter((inv: any) =>
    inv.invoice_date >= startOfMonth && inv.invoice_date <= endOfMonth
  );
  const monthPurchaseInvoices = purchaseInvoices.filter((inv: any) =>
    inv.invoice_date >= startOfMonth && inv.invoice_date <= endOfMonth
  );
  const monthSalesAmountGeneral = monthSalesInvoices.reduce(
    (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0
  );
  const monthPurchasesAmount = monthPurchaseInvoices.reduce(
    (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0
  );

  const totalExpensesGeneral = generalExpensesAmount + payrollExpensesGeneral;
  const netProfitGeneral = totalSalesAmountGeneral - totalPurchasesGeneral - totalExpensesGeneral;

  return {
    availableNewCars: 0,
    availableUsedCars: 0,
    availableCars: 0,
    todaySales: salesInvoices.filter((inv: any) => inv.invoice_date === today).length,
    totalProfit: netProfitGeneral,
    monthSales: monthSalesInvoices.length,
    totalPurchases: totalPurchasesGeneral,
    monthSalesAmount: monthSalesAmountGeneral,
    totalGrossProfit: totalSalesAmountGeneral - totalPurchasesGeneral,
    totalCarExpenses: 0,
    totalGeneralExpenses: totalExpensesGeneral,
    payrollExpenses: payrollExpensesGeneral,
    prepaidExpensesDue: 0,
    otherGeneralExpenses: generalExpensesAmount,
    purchasesCount: purchaseInvoices.length,
    monthSalesProfit: monthSalesAmountGeneral - monthPurchasesAmount,
    totalSalesCount: salesInvoices.length,
    totalSalesAmount: totalSalesAmountGeneral,
  };
}

// Car dealership specific stats - isolated function
async function fetchCarDealershipStats(
  companyId: string,
  fiscalYearId: string | null | undefined,
  fiscalYearStart: string | null,
  fiscalYearEnd: string | null,
  startOfMonth: string,
  endOfMonth: string,
  today: string,
  now: Date,
  parseLocalISODate: (iso: string, endOfDay?: boolean) => Date
) {
  let availableCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')
    .eq('company_id', companyId);

  let availableNewCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')
    .eq('car_condition', 'new')
    .eq('company_id', companyId);

  let availableUsedCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')
    .eq('car_condition', 'used')
    .eq('company_id', companyId);

  if (fiscalYearStart && fiscalYearEnd) {
    availableCarsQuery = availableCarsQuery.gte('purchase_date', fiscalYearStart).lte('purchase_date', fiscalYearEnd);
    availableNewCarsQuery = availableNewCarsQuery.gte('purchase_date', fiscalYearStart).lte('purchase_date', fiscalYearEnd);
    availableUsedCarsQuery = availableUsedCarsQuery.gte('purchase_date', fiscalYearStart).lte('purchase_date', fiscalYearEnd);
  }

  let todaySalesQuery = supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('sale_date', today)
    .eq('company_id', companyId);

  if (fiscalYearStart && fiscalYearEnd) {
    todaySalesQuery = todaySalesQuery.gte('sale_date', fiscalYearStart).lte('sale_date', fiscalYearEnd);
  }

  let salesQuery = supabase
    .from('sales')
    .select('profit, car_id, sale_date, sale_price')
    .eq('company_id', companyId);

  if (fiscalYearStart && fiscalYearEnd) {
    salesQuery = salesQuery.gte('sale_date', fiscalYearStart).lte('sale_date', fiscalYearEnd);
  }

  let expensesQuery = supabase
    .from('expenses')
    .select('amount, car_id, expense_date, payment_method')
    .eq('company_id', companyId);

  if (fiscalYearStart && fiscalYearEnd) {
    expensesQuery = expensesQuery.gte('expense_date', fiscalYearStart).lte('expense_date', fiscalYearEnd);
  }

  let payrollQuery = supabase
    .from('payroll_records')
    .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('status', 'approved')
    .eq('company_id', companyId);

  let prepaidAmortQuery = supabase
    .from('prepaid_expense_amortizations')
    .select(`amount, amortization_date, status, prepaid_expense:prepaid_expenses!inner(company_id, status)`)
    .lte('amortization_date', toDateOnly(now))
    .eq('prepaid_expense.company_id', companyId);

  if (fiscalYearStart && fiscalYearEnd) {
    prepaidAmortQuery = prepaidAmortQuery.gte('amortization_date', fiscalYearStart).lte('amortization_date', fiscalYearEnd);
  }

  let purchasesQuery = supabase
    .from('cars')
    .select('purchase_price, car_condition')
    .eq('company_id', companyId);

  if (fiscalYearId) {
    if (fiscalYearStart && fiscalYearEnd) {
      purchasesQuery = purchasesQuery.or(
        `fiscal_year_id.eq.${fiscalYearId},and(fiscal_year_id.is.null,purchase_date.gte.${fiscalYearStart},purchase_date.lte.${fiscalYearEnd})`
      );
    } else {
      purchasesQuery = purchasesQuery.eq('fiscal_year_id', fiscalYearId);
    }
  }

  const [
    availableCarsResult, availableNewCarsResult, availableUsedCarsResult,
    todaySalesResult, salesResult, expensesResult,
    payrollResult, prepaidAmortResult, purchasesResult
  ] = await Promise.all([
    availableCarsQuery, availableNewCarsQuery, availableUsedCarsQuery,
    todaySalesQuery, salesQuery, expensesQuery,
    payrollQuery, prepaidAmortQuery, purchasesQuery
  ]);

  const availableCars = availableCarsResult.count;
  const availableNewCars = availableNewCarsResult.count || 0;
  const availableUsedCars = availableUsedCarsResult.count || 0;
  const todaySales = todaySalesResult.count;
  const salesData = salesResult.data;
  const expensesData = expensesResult.data;
  const allPayrollData = payrollResult.data;
  const prepaidAmortData = prepaidAmortResult.data;
  const purchasesData = purchasesResult.data;

  const totalGrossProfit = salesData?.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0) || 0;
  const soldCarIds = salesData?.map(s => s.car_id) || [];
  const carExpenses = expensesData?.filter(exp => exp.car_id && soldCarIds.includes(exp.car_id))
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;

  const processedPrepaidExpenses = expensesData?.filter(exp => !exp.car_id && exp.payment_method === 'prepaid')
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  const otherOperatingExpenses = expensesData?.filter(exp => !exp.car_id && exp.payment_method !== 'prepaid')
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;

  let payrollData = allPayrollData;
  if (fiscalYearStart && fiscalYearEnd) {
    const fyStartDate = parseLocalISODate(fiscalYearStart, false);
    const fyEndDate = parseLocalISODate(fiscalYearEnd, true);
    payrollData = allPayrollData?.filter(p => {
      const payrollDate = new Date(Number(p.year), Number(p.month) - 1, 1);
      payrollDate.setHours(0, 0, 0, 0);
      return payrollDate >= fyStartDate && payrollDate <= fyEndDate;
    }) || [];
  }

  const payrollExpenses = payrollData?.reduce((sum, p) => {
    return sum + (Number(p.total_base_salaries) || 0) + (Number(p.total_allowances) || 0)
      + (Number(p.total_bonuses) || 0) + (Number(p.total_overtime) || 0) - (Number(p.total_absences) || 0);
  }, 0) || 0;

  const pendingPrepaidExpenses = prepaidAmortData?.filter(a => {
    const prepaid = a.prepaid_expense as any;
    return a.status === 'pending' && prepaid?.status === 'active';
  }).reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0;

  const totalPrepaidExpenses = processedPrepaidExpenses + pendingPrepaidExpenses;
  const generalExpenses = otherOperatingExpenses + payrollExpenses + totalPrepaidExpenses;
  const totalProfit = totalGrossProfit - carExpenses - generalExpenses;

  let monthSalesCount = salesData?.filter(sale =>
    sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth
  ).length || 0;

  const totalPurchases = Math.round(
    (purchasesData || []).reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0)
  );

  const monthSalesData = salesData?.filter(sale =>
    sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth
  ) || [];

  let monthSalesAmount = monthSalesData.reduce(
    (sum, sale) => sum + (Number(sale.sale_price) || 0), 0
  );

  const monthSalesProfit = monthSalesData.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0);

  return {
    availableNewCars,
    availableUsedCars,
    availableCars: availableCars || 0,
    todaySales: todaySales || 0,
    totalProfit,
    monthSales: monthSalesCount,
    totalPurchases,
    monthSalesAmount,
    totalGrossProfit,
    totalCarExpenses: carExpenses,
    totalGeneralExpenses: generalExpenses,
    payrollExpenses,
    prepaidExpensesDue: totalPrepaidExpenses,
    otherGeneralExpenses: otherOperatingExpenses,
    purchasesCount: purchasesData?.length || 0,
    monthSalesProfit,
    totalSalesCount: salesData?.length || 0,
    totalSalesAmount: salesData?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0,
  };
}

// All-time stats (across all fiscal years)
export async function fetchAllTimeStats() {
  const companyId = await requireCompanyId();
  
  const { data: companyRecord } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();

  const companyType = companyRecord?.company_type;

  // For non-car companies: use invoices
  if (companyType && companyType !== 'car_dealership') {
    const [purchaseResult, salesResult] = await Promise.all([
      supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'purchase'),
      supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'sales'),
    ]);

    const allTimePurchases = Math.round(
      (purchaseResult.data || []).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0)
    );
    const allTimeSales = (salesResult.data || []).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);

    return {
      allTimePurchases,
      allTimeSales,
      allTimeSalesCount: salesResult.data?.length || 0,
      allTimeProfit: allTimeSales - allTimePurchases,
      totalCarsCount: 0,
    };
  }

  // Car dealership
  const { data: carsData } = await supabase.from('cars').select('purchase_price').eq('company_id', companyId);
  const allTimePurchases = Math.round(carsData?.reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0) || 0);

  const { data: salesData } = await supabase.from('sales').select('sale_price, profit').eq('company_id', companyId);
  const allTimeSales = salesData?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;
  const allTimeSalesCount = salesData?.length || 0;
  const allTimeProfit = salesData?.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0) || 0;

  return {
    allTimePurchases,
    allTimeSales,
    allTimeSalesCount,
    allTimeProfit,
    totalCarsCount: carsData?.length || 0,
  };
}

// Monthly chart data
export async function fetchMonthlyChartData(fiscalYearId?: string) {
  let fiscalYearStart: string | null = null;
  let fiscalYearEnd: string | null = null;

  if (fiscalYearId) {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years')
      .select('start_date, end_date')
      .eq('id', fiscalYearId)
      .single();
    if (fiscalYear) {
      fiscalYearStart = fiscalYear.start_date;
      fiscalYearEnd = fiscalYear.end_date;
    }
  }

  let startDate: string;
  let endDate: string;

  if (fiscalYearStart && fiscalYearEnd) {
    startDate = fiscalYearStart;
    endDate = fiscalYearEnd;
  } else {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    startDate = toDateOnly(sixMonthsAgo);
    endDate = toDateOnly(new Date());
  }

  const companyId = await requireCompanyId();

  const { data: companyRecord } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();

  const companyType = companyRecord?.company_type;

  let rawData: Array<{ date: string; amount: number; profit: number }> = [];

  if (companyType && companyType !== 'car_dealership') {
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

  if (fiscalYearStart && fiscalYearEnd) {
    const start = new Date(fiscalYearStart);
    const end = new Date(fiscalYearEnd);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: arabicMonths[current.getMonth()],
        sales: monthlyData[monthKey]?.sales || 0,
        profit: monthlyData[monthKey]?.profit || 0,
      });
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: arabicMonths[date.getMonth()],
        sales: monthlyData[monthKey]?.sales || 0,
        profit: monthlyData[monthKey]?.profit || 0,
      });
    }
  }

  return result;
}
