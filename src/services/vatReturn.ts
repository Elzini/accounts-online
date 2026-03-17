import { supabase } from '@/integrations/supabase/client';
import { fetchAccounts } from './accounting';

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

  // ========== 1. Fetch VAT account balances from JOURNAL ENTRIES ==========
  const accounts = await fetchAccounts(companyId);
  
  // Find VAT accounts by code
  const salesVATAccount = accounts.find(a => a.code === '21041');
  const purchaseVATAccount = accounts.find(a => a.code === '21042');

  // Build query for journal entry lines
  let journalQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (startDate) journalQuery = journalQuery.gte('journal_entry.entry_date', startDate);
  if (endDate) journalQuery = journalQuery.lte('journal_entry.entry_date', endDate);

  // ========== 2. Fetch credit/debit notes for returns breakdown ==========
  let debitNotesQuery = supabase
    .from('credit_debit_notes')
    .select('id, total_amount, tax_amount, note_date')
    .eq('company_id', companyId)
    .eq('note_type', 'debit')
    .neq('status', 'draft');

  if (startDate) debitNotesQuery = debitNotesQuery.gte('note_date', startDate);
  if (endDate) debitNotesQuery = debitNotesQuery.lte('note_date', endDate);

  let creditNotesQuery = supabase
    .from('credit_debit_notes')
    .select('id, total_amount, tax_amount, note_date')
    .eq('company_id', companyId)
    .eq('note_type', 'credit')
    .neq('status', 'draft');

  if (startDate) creditNotesQuery = creditNotesQuery.gte('note_date', startDate);
  if (endDate) creditNotesQuery = creditNotesQuery.lte('note_date', endDate);

  // ========== 3. Fetch invoices for detailed report only ==========
  let salesInvQuery = supabase
    .from('invoices')
    .select('id, invoice_number, subtotal, vat_amount, total, invoice_date, customer_name, supplier_invoice_number')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sales')
    .neq('status', 'draft');

  if (startDate) salesInvQuery = salesInvQuery.gte('invoice_date', startDate);
  if (endDate) salesInvQuery = salesInvQuery.lte('invoice_date', endDate);

  let purchaseInvQuery = supabase
    .from('invoices')
    .select('id, invoice_number, subtotal, vat_amount, total, invoice_date, customer_name, supplier_invoice_number')
    .eq('company_id', companyId)
    .eq('invoice_type', 'purchase')
    .neq('status', 'draft');

  if (startDate) purchaseInvQuery = purchaseInvQuery.gte('invoice_date', startDate);
  if (endDate) purchaseInvQuery = purchaseInvQuery.lte('invoice_date', endDate);

  // Execute all queries in parallel
  const [journalResult, debitNotesResult, creditNotesResult, salesInvResult, purchaseInvResult] = await Promise.all([
    journalQuery,
    debitNotesQuery,
    creditNotesQuery,
    salesInvQuery,
    purchaseInvQuery,
  ]);

  if (journalResult.error) throw journalResult.error;
  if (debitNotesResult.error) throw debitNotesResult.error;
  if (creditNotesResult.error) throw creditNotesResult.error;
  if (salesInvResult.error) throw salesInvResult.error;
  if (purchaseInvResult.error) throw purchaseInvResult.error;

  const journalLines = journalResult.data || [];
  const debitNotes = debitNotesResult.data || [];
  const creditNotes = creditNotesResult.data || [];
  const salesInvoices = salesInvResult.data || [];
  const purchaseInvoices = purchaseInvResult.data || [];

  // ========== Calculate VAT from journal entries ==========
  // Sales VAT (21041) - liability: credit increases, debit decreases
  let salesVATTotal = 0;
  let salesVATGrossCredit = 0; // gross sales VAT (credits only)
  let salesVATGrossDebit = 0;  // returns/adjustments (debits only)
  
  // Purchase VAT (21042) - asset: debit increases, credit decreases
  let purchaseVATTotal = 0;
  let purchaseVATGrossDebit = 0; // gross purchase VAT (debits only)
  let purchaseVATGrossCredit = 0; // returns/adjustments (credits only)

  journalLines.forEach((line: any) => {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    if (salesVATAccount && line.account_id === salesVATAccount.id) {
      salesVATGrossCredit += credit;
      salesVATGrossDebit += debit;
    }
    if (purchaseVATAccount && line.account_id === purchaseVATAccount.id) {
      purchaseVATGrossDebit += debit;
      purchaseVATGrossCredit += credit;
    }
  });

  // Net VAT = total posted in journal entries
  salesVATTotal = salesVATGrossCredit - salesVATGrossDebit; // net sales VAT (liability)
  purchaseVATTotal = purchaseVATGrossDebit - purchaseVATGrossCredit; // net purchase VAT (asset)

  // Derive amounts from VAT using tax rate
  const grossSalesVAT = salesVATGrossCredit;
  const grossSalesAmount = taxRate > 0 ? (grossSalesVAT / taxRate) * 100 : 0;
  
  const grossPurchaseVAT = purchaseVATGrossDebit;
  const grossPurchaseAmount = taxRate > 0 ? (grossPurchaseVAT / taxRate) * 100 : 0;

  // Returns from credit/debit notes (for display breakdown)
  const creditNotesTax = creditNotes.reduce((sum, n) => sum + (Number(n.tax_amount) || 0), 0);
  const creditNotesTotal = creditNotes.reduce((sum, n) => sum + (Number(n.total_amount) || 0), 0);
  const creditNotesAmount = creditNotesTotal - creditNotesTax;

  const debitNotesTax = debitNotes.reduce((sum, n) => sum + (Number(n.tax_amount) || 0), 0);
  const debitNotesTotal = debitNotes.reduce((sum, n) => sum + (Number(n.total_amount) || 0), 0);
  const debitNotesAmount = debitNotesTotal - debitNotesTax;

  // Also count negative invoices as returns
  const negativeSalesInvoices = salesInvoices.filter(inv => (Number(inv.total) || 0) < 0);
  const negativeInvoices = purchaseInvoices.filter(inv => (Number(inv.total) || 0) < 0);

  const invoiceSalesReturnsVAT = Math.abs(negativeSalesInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0));
  const invoiceSalesReturnsAmount = Math.abs(negativeSalesInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0));

  const invoicePurchaseReturnsVAT = Math.abs(negativeInvoices.reduce((sum, inv) => sum + (Number(inv.vat_amount) || 0), 0));
  const invoicePurchaseReturnsAmount = Math.abs(negativeInvoices.reduce((sum, inv) => sum + (Number(inv.subtotal) || 0), 0));

  const totalSalesReturnsVAT = invoiceSalesReturnsVAT + creditNotesTax;
  const totalSalesReturnsAmount = invoiceSalesReturnsAmount + creditNotesAmount;

  const totalPurchaseReturnsVAT = invoicePurchaseReturnsVAT + debitNotesTax;
  const totalPurchaseReturnsAmount = invoicePurchaseReturnsAmount + debitNotesAmount;

  // ========== Build report using journal-entry-based totals ==========
  const sales: VATReturnSales = {
    standardRatedAmount: grossSalesAmount,
    standardRatedVAT: grossSalesVAT,
    citizenServicesAmount: 0,
    citizenServicesVAT: 0,
    zeroRatedAmount: 0,
    exportsAmount: 0,
    exemptAmount: 0,
    totalAmount: taxRate > 0 ? (salesVATTotal / taxRate) * 100 : 0,
    totalVAT: salesVATTotal,
  };

  const purchases: VATReturnPurchases = {
    standardRatedAmount: grossPurchaseAmount,
    standardRatedVAT: grossPurchaseVAT,
    importsAmount: 0,
    importsVAT: 0,
    reverseChargeAmount: 0,
    reverseChargeVAT: 0,
    zeroRatedAmount: 0,
    exemptAmount: 0,
    totalAmount: taxRate > 0 ? (purchaseVATTotal / taxRate) * 100 : 0,
    totalVAT: purchaseVATTotal,
  };

  const netVAT = sales.totalVAT - purchases.totalVAT;

  let status: 'payable' | 'receivable' | 'settled' = 'settled';
  if (netVAT > 0.01) status = 'payable';
  else if (netVAT < -0.01) status = 'receivable';

  // Build detailed invoices list (from invoices table for reference)
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
      amount: totalSalesReturnsAmount,
      vat: totalSalesReturnsVAT,
      count: negativeSalesInvoices.length + creditNotes.length,
    },
    purchaseReturns: {
      amount: totalPurchaseReturnsAmount,
      vat: totalPurchaseReturnsVAT,
      count: negativeInvoices.length + debitNotes.length,
    },
    detailedInvoices,
  };
}
