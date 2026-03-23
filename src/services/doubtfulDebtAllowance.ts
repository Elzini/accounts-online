/**
 * IFRS 9 - Expected Credit Loss (ECL) / مخصص الديون المشكوك في تحصيلها
 * 
 * Implements simplified ECL model for trade receivables per IFRS 9.5.5.15
 * Uses aging buckets with historical loss rates.
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentCompanyId } from '@/services/companyContext';

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  lossRate: number; // percentage e.g. 1 = 1%
  totalReceivable: number;
  eclAmount: number;
  invoiceCount: number;
}

export interface ECLReport {
  companyId: string;
  reportDate: string;
  totalReceivables: number;
  totalECL: number;
  eclPercentage: number;
  buckets: AgingBucket[];
}

// Default aging buckets with loss rates (can be customized per company)
const DEFAULT_BUCKETS = [
  { label: '0-30 يوم (جارية)', minDays: 0, maxDays: 30, lossRate: 0.5 },
  { label: '31-60 يوم', minDays: 31, maxDays: 60, lossRate: 2 },
  { label: '61-90 يوم', minDays: 61, maxDays: 90, lossRate: 5 },
  { label: '91-180 يوم', minDays: 91, maxDays: 180, lossRate: 15 },
  { label: '181-365 يوم', minDays: 181, maxDays: 365, lossRate: 40 },
  { label: 'أكثر من 365 يوم', minDays: 366, maxDays: null, lossRate: 80 },
];

/**
 * Calculate ECL report based on outstanding receivables aging
 */
export async function calculateECL(
  reportDate?: string,
  customBuckets?: typeof DEFAULT_BUCKETS
): Promise<ECLReport> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('COMPANY_REQUIRED');

  const refDate = reportDate || new Date().toISOString().split('T')[0];
  const bucketConfig = customBuckets || DEFAULT_BUCKETS;

  // Fetch unpaid/partially paid sales invoices
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, invoice_date, total, payment_status, customer_name')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sale')
    .eq('status', 'issued')
    .in('payment_status', ['unpaid', 'partial', null]);

  if (error) throw error;

  const buckets: AgingBucket[] = bucketConfig.map(b => ({
    ...b,
    totalReceivable: 0,
    eclAmount: 0,
    invoiceCount: 0,
  }));

  const refDateObj = new Date(refDate);

  for (const inv of (invoices || [])) {
    const invDate = new Date(inv.invoice_date || inv.created_at);
    const daysPast = Math.floor((refDateObj.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = inv.total || 0;

    for (const bucket of buckets) {
      const inBucket = daysPast >= bucket.minDays && 
        (bucket.maxDays === null || daysPast <= bucket.maxDays);
      if (inBucket) {
        bucket.totalReceivable += amount;
        bucket.eclAmount += amount * (bucket.lossRate / 100);
        bucket.invoiceCount++;
        break;
      }
    }
  }

  const totalReceivables = buckets.reduce((s, b) => s + b.totalReceivable, 0);
  const totalECL = Math.round(buckets.reduce((s, b) => s + b.eclAmount, 0) * 100) / 100;

  return {
    companyId,
    reportDate: refDate,
    totalReceivables,
    totalECL,
    eclPercentage: totalReceivables > 0 ? Math.round((totalECL / totalReceivables) * 10000) / 100 : 0,
    buckets: buckets.map(b => ({
      ...b,
      totalReceivable: Math.round(b.totalReceivable * 100) / 100,
      eclAmount: Math.round(b.eclAmount * 100) / 100,
    })),
  };
}

/**
 * Post ECL adjustment journal entry
 * Dr: مصروف ديون مشكوك فيها  |  Cr: مخصص ديون مشكوك فيها
 */
export async function postECLJournalEntry(
  eclAmount: number,
  expenseAccountId: string,
  allowanceAccountId: string,
  description?: string
): Promise<string> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('COMPANY_REQUIRED');

  const { data: fiscalYear } = await supabase
    .from('fiscal_years')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_current', true)
    .maybeSingle();

  const amount = Math.round(eclAmount * 100) / 100;
  const desc = description || `تكوين مخصص ديون مشكوك فيها - IFRS 9 ECL`;

  const { data: entry, error: jeError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      fiscal_year_id: fiscalYear?.id || null,
      entry_date: new Date().toISOString().split('T')[0],
      description: desc,
      reference_type: 'ecl_allowance',
      status: 'posted',
      is_approved: true,
    })
    .select('id')
    .single();

  if (jeError || !entry) throw jeError || new Error('Failed to create journal entry');

  await supabase.from('journal_entry_lines').insert([
    {
      journal_entry_id: entry.id,
      account_id: expenseAccountId,
      debit: amount,
      credit: 0,
      description: 'مصروف ديون مشكوك في تحصيلها',
      company_id: companyId,
    },
    {
      journal_entry_id: entry.id,
      account_id: allowanceAccountId,
      debit: 0,
      credit: amount,
      description: 'مخصص ديون مشكوك في تحصيلها',
      company_id: companyId,
    },
  ]);

  return entry.id;
}
