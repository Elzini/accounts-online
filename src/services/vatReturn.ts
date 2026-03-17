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

export interface VATInvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string | null;
  subtotal: number;
  vat_amount: number;
  total: number;
  type: 'sales' | 'purchase';
  supplier_invoice_number?: string | null;
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
  salesReturns: { amount: number; vat: number; count: number };
  purchaseReturns: { amount: number; vat: number; count: number };
  detailedInvoices: VATInvoiceDetail[];
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
    .select('id, invoice_number, subtotal, vat_amount, total, invoice_date, customer_name, supplier_invoice_number')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sales')
    .neq('status', 'draft');

  if (startDate) salesInvQuery = salesInvQuery.gte('invoice_date', startDate);
  if (endDate) salesInvQuery = salesInvQuery.lte('invoice_date', endDate);

  // Purchase invoices (issued/approved only)
  let purchaseInvQuery = supabase
    .from('invoices')
    .select('id, invoice_number, subtotal, vat_amount, total, invoice_date, customer_name, supplier_invoice_number')
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
  // From invoices table - separate positive (sales) from negative (returns)
  const positiveSalesInvoices = salesInvoices.filter(inv => (Number(inv.total) || 0) >= 0);
  const negativeSalesInvoices = salesInvoices.filter(inv => (Number(inv.total) || 0) < 0);

  const invoiceSalesAmount = positiveSalesInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  const invoiceSalesVAT = positiveSalesInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0);

  // Invoice-based sales returns (negative invoices)
  const invoiceSalesReturnsAmount = Math.abs(negativeSalesInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0));
  const invoiceSalesReturnsVAT = Math.abs(negativeSalesInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0));

  // From car sales table (sale_price = base amount, VAT calculated)
  const carSalesAmount = carSales.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0);
  const carSalesVAT = carSales.reduce((sum, s) => {
    const price = Number(s.sale_price) || 0;
    return sum + price * (taxRate / 100);
  }, 0);

  // Sales returns (credit notes from credit_debit_notes table) - reduce sales
  const creditNotesTotal = creditNotes.reduce((sum, n) => sum + (Number(n.total_amount) || 0), 0);
  const creditNotesTax = creditNotes.reduce((sum, n) => sum + (Number(n.tax_amount) || 0), 0);
  const creditNotesAmount = creditNotesTotal - creditNotesTax; // net amount before tax

  // Total sales returns = from negative invoices + from credit notes
  const totalSalesReturnsAmount = invoiceSalesReturnsAmount + creditNotesAmount;
  const totalSalesReturnsVAT = invoiceSalesReturnsVAT + creditNotesTax;

  // Gross sales (positive only)
  const grossSalesAmount = invoiceSalesAmount + carSalesAmount;
  const grossSalesVAT = invoiceSalesVAT + carSalesVAT;

  // Net sales = gross - returns
  const totalSalesAmount = grossSalesAmount - totalSalesReturnsAmount;
  const totalSalesVAT = grossSalesVAT - totalSalesReturnsVAT;

  // ========== Calculate Purchases ==========
  // From invoices table - separate positive (purchases) from negative (returns)
  const positiveInvoices = purchaseInvoices.filter(inv => (Number(inv.total) || 0) >= 0);
  const negativeInvoices = purchaseInvoices.filter(inv => (Number(inv.total) || 0) < 0);

  const invoicePurchasesAmount = positiveInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0);
  const invoicePurchasesVAT = positiveInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0);

  // Invoice-based purchase returns (negative invoices)
  const invoiceReturnsAmount = Math.abs(negativeInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0));
  const invoiceReturnsVAT = Math.abs(negativeInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0));

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

  // Purchase returns (debit notes from credit_debit_notes table) - reduce purchases
  const debitNotesTotal = debitNotes.reduce((sum, n) => sum + (Number(n.total_amount) || 0), 0);
  const debitNotesTax = debitNotes.reduce((sum, n) => sum + (Number(n.tax_amount) || 0), 0);
  const debitNotesAmount = debitNotesTotal - debitNotesTax; // net amount before tax

  // Total purchase returns = from negative invoices + from debit notes
  const totalPurchaseReturnsAmount = invoiceReturnsAmount + debitNotesAmount;
  const totalPurchaseReturnsVAT = invoiceReturnsVAT + debitNotesTax;

  // Gross purchases (positive only)
  const grossPurchasesAmount = invoicePurchasesAmount + carPurchasesAmount + expensesAmount;
  const grossPurchasesVAT = invoicePurchasesVAT + carPurchasesVAT + expensesVAT;

  // Net purchases = gross - returns
  const totalPurchasesAmount = grossPurchasesAmount - totalPurchaseReturnsAmount;
  const totalPurchasesVAT = grossPurchasesVAT - totalPurchaseReturnsVAT;

  // Build report
  const sales: VATReturnSales = {
    standardRatedAmount: grossSalesAmount,
    standardRatedVAT: grossSalesVAT,
    citizenServicesAmount: 0,
    citizenServicesVAT: 0,
    zeroRatedAmount: 0,
    exportsAmount: 0,
    exemptAmount: 0,
    totalAmount: totalSalesAmount,
    totalVAT: totalSalesVAT,
  };

  const purchases: VATReturnPurchases = {
    standardRatedAmount: grossPurchasesAmount,
    standardRatedVAT: grossPurchasesVAT,
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

  // Build detailed invoices list
  const detailedInvoices: VATInvoiceDetail[] = [
    ...salesInvoices.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number || '',
      invoice_date: inv.invoice_date || '',
      customer_name: inv.customer_name || null,
      subtotal: Number(inv.subtotal) || 0,
      vat_amount: Number(inv.vat_amount) || 0,
      total: Number(inv.total) || 0,
      type: 'sales' as const,
      supplier_invoice_number: (inv as any).supplier_invoice_number || null,
    })),
    ...purchaseInvoices.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number || '',
      invoice_date: inv.invoice_date || '',
      customer_name: inv.customer_name || null,
      subtotal: Number(inv.subtotal) || 0,
      vat_amount: Number(inv.vat_amount) || 0,
      total: Number(inv.total) || 0,
      type: 'purchase' as const,
      supplier_invoice_number: (inv as any).supplier_invoice_number || null,
    })),
  ].sort((a, b) => a.invoice_date.localeCompare(b.invoice_date));

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
    salesReturns: {
      amount: creditNotesAmount,
      vat: creditNotesTax,
      count: creditNotes.length,
    },
    purchaseReturns: {
      amount: totalPurchaseReturnsAmount,
      vat: totalPurchaseReturnsVAT,
      count: negativeInvoices.length + debitNotes.length,
    },
    detailedInvoices,
  };
}
