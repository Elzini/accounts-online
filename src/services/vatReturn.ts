import { supabase } from '@/integrations/supabase/client';

export interface VATReturnSales {
  standardRatedAmount: number;
  standardRatedVAT: number;
  citizenServicesAmount: number;
  citizenServicesVAT: number;
  zeroRatedAmount: number;
  exportsAmount: number;
  exemptAmount: number;
  totalAmount: number;
  totalVAT: number;
}

export interface VATReturnPurchases {
  standardRatedAmount: number;
  standardRatedVAT: number;
  importsAmount: number;
  importsVAT: number;
  reverseChargeAmount: number;
  reverseChargeVAT: number;
  zeroRatedAmount: number;
  exemptAmount: number;
  totalAmount: number;
  totalVAT: number;
}

export interface VATReturnReport {
  sales: VATReturnSales;
  purchases: VATReturnPurchases;
  corrections: number;
  netVAT: number;
  status: 'payable' | 'receivable' | 'settled';
  period: {
    startDate: string;
    endDate: string;
  };
}

export async function getVATReturnReport(
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<VATReturnReport> {
  // Get tax rate
  const { data: taxSettings } = await supabase
    .from('tax_settings')
    .select('tax_rate')
    .eq('company_id', companyId)
    .maybeSingle();

  const taxRate = taxSettings?.tax_rate || 15;

  // ========== 1. Fetch from invoices table (primary source) ==========
  
  // Sales invoices (issued/approved only)
  let salesInvQuery = supabase
    .from('invoices')
    .select('id, subtotal, vat_amount, total, invoice_date')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sales')
    .neq('status', 'draft');

  if (startDate) salesInvQuery = salesInvQuery.gte('invoice_date', startDate);
  if (endDate) salesInvQuery = salesInvQuery.lte('invoice_date', endDate);

  // Purchase invoices (issued/approved only)
  let purchaseInvQuery = supabase
    .from('invoices')
    .select('id, subtotal, vat_amount, total, invoice_date')
    .eq('company_id', companyId)
    .eq('invoice_type', 'purchase')
    .neq('status', 'draft');

  if (startDate) purchaseInvQuery = purchaseInvQuery.gte('invoice_date', startDate);
  if (endDate) purchaseInvQuery = purchaseInvQuery.lte('invoice_date', endDate);

  // ========== 2. Fetch from car sales table (legacy) ==========
  let carSalesQuery = supabase
    .from('sales')
    .select('id, sale_price, sale_date')
    .eq('company_id', companyId);

  if (startDate) carSalesQuery = carSalesQuery.gte('sale_date', startDate);
  if (endDate) carSalesQuery = carSalesQuery.lte('sale_date', endDate);

  // Car purchases
  let carPurchasesQuery = supabase
    .from('cars')
    .select('id, purchase_price, purchase_date')
    .eq('company_id', companyId);

  if (startDate) carPurchasesQuery = carPurchasesQuery.gte('purchase_date', startDate);
  if (endDate) carPurchasesQuery = carPurchasesQuery.lte('purchase_date', endDate);

  // ========== 3. Fetch expenses with VAT invoices ==========
  let expensesQuery = supabase
    .from('expenses')
    .select('id, amount, expense_date, has_vat_invoice')
    .eq('company_id', companyId)
    .eq('has_vat_invoice', true);

  if (startDate) expensesQuery = expensesQuery.gte('expense_date', startDate);
  if (endDate) expensesQuery = expensesQuery.lte('expense_date', endDate);

  // ========== 4. Fetch credit/debit notes (returns) ==========
  // Debit notes = purchase returns (reduce purchases)
  let debitNotesQuery = supabase
    .from('credit_debit_notes')
    .select('id, total_amount, tax_amount, note_date')
    .eq('company_id', companyId)
    .eq('note_type', 'debit')
    .neq('status', 'draft');

  if (startDate) debitNotesQuery = debitNotesQuery.gte('note_date', startDate);
  if (endDate) debitNotesQuery = debitNotesQuery.lte('note_date', endDate);

  // Credit notes = sales returns (reduce sales)
  let creditNotesQuery = supabase
    .from('credit_debit_notes')
    .select('id, total_amount, tax_amount, note_date')
    .eq('company_id', companyId)
    .eq('note_type', 'credit')
    .neq('status', 'draft');

  if (startDate) creditNotesQuery = creditNotesQuery.gte('note_date', startDate);
  if (endDate) creditNotesQuery = creditNotesQuery.lte('note_date', endDate);

  // Execute all queries in parallel
  const [salesInvResult, purchaseInvResult, carSalesResult, carPurchasesResult, expensesResult, debitNotesResult, creditNotesResult] = await Promise.all([
    salesInvQuery,
    purchaseInvQuery,
    carSalesQuery,
    carPurchasesQuery,
    expensesQuery,
    debitNotesQuery,
    creditNotesQuery,
  ]);

  if (salesInvResult.error) throw salesInvResult.error;
  if (purchaseInvResult.error) throw purchaseInvResult.error;
  if (carSalesResult.error) throw carSalesResult.error;
  if (carPurchasesResult.error) throw carPurchasesResult.error;
  if (expensesResult.error) throw expensesResult.error;
  if (debitNotesResult.error) throw debitNotesResult.error;
  if (creditNotesResult.error) throw creditNotesResult.error;

  const salesInvoices = salesInvResult.data || [];
  const purchaseInvoices = purchaseInvResult.data || [];
  const carSales = carSalesResult.data || [];
  const carPurchases = carPurchasesResult.data || [];
  const expenses = expensesResult.data || [];
  const debitNotes = debitNotesResult.data || [];
  const creditNotes = creditNotesResult.data || [];

  // ========== Calculate Sales ==========
  // From invoices table (subtotal = amount before VAT, vat_amount = VAT)
  const invoiceSalesAmount = salesInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  const invoiceSalesVAT = salesInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0);

  // From car sales table (sale_price = base amount, VAT calculated)
  const carSalesAmount = carSales.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0);
  const carSalesVAT = carSales.reduce((sum, s) => {
    const price = Number(s.sale_price) || 0;
    return sum + price * (taxRate / 100);
  }, 0);

  const totalSalesAmount = invoiceSalesAmount + carSalesAmount;
  const totalSalesVAT = invoiceSalesVAT + carSalesVAT;

  // ========== Calculate Purchases ==========
  // From invoices table
  const invoicePurchasesAmount = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  const invoicePurchasesVAT = purchaseInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0);

  // From car purchases
  const carPurchasesAmount = carPurchases.reduce((sum, c) => sum + (Number(c.purchase_price) || 0), 0);
  const carPurchasesVAT = carPurchases.reduce((sum, c) => {
    const price = Number(c.purchase_price) || 0;
    return sum + price * (taxRate / 100);
  }, 0);

  // Expenses with VAT invoices
  const expensesAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const expensesVAT = expenses.reduce((sum, e) => {
    const amount = Number(e.amount) || 0;
    return sum + amount * (taxRate / 100);
  }, 0);

  const totalPurchasesAmount = invoicePurchasesAmount + carPurchasesAmount + expensesAmount;
  const totalPurchasesVAT = invoicePurchasesVAT + carPurchasesVAT + expensesVAT;

  // Build report
  const sales: VATReturnSales = {
    standardRatedAmount: totalSalesAmount,
    standardRatedVAT: totalSalesVAT,
    citizenServicesAmount: 0,
    citizenServicesVAT: 0,
    zeroRatedAmount: 0,
    exportsAmount: 0,
    exemptAmount: 0,
    totalAmount: totalSalesAmount,
    totalVAT: totalSalesVAT,
  };

  const purchases: VATReturnPurchases = {
    standardRatedAmount: totalPurchasesAmount,
    standardRatedVAT: totalPurchasesVAT,
    importsAmount: 0,
    importsVAT: 0,
    reverseChargeAmount: 0,
    reverseChargeVAT: 0,
    zeroRatedAmount: 0,
    exemptAmount: 0,
    totalAmount: totalPurchasesAmount,
    totalVAT: totalPurchasesVAT,
  };

  const netVAT = sales.totalVAT - purchases.totalVAT;

  let status: 'payable' | 'receivable' | 'settled' = 'settled';
  if (netVAT > 0.01) status = 'payable';
  else if (netVAT < -0.01) status = 'receivable';

  return {
    sales,
    purchases,
    corrections: 0,
    netVAT,
    status,
    period: {
      startDate: startDate || '',
      endDate: endDate || '',
    },
  };
}
