/**
 * IFRS 9 - Expected Credit Loss (ECL) / مخصص الديون المشكوك في تحصيلها
 * Uses ServiceContainer for journal entries and fiscal year lookups.
 */

import { supabase } from '@/hooks/modules/useMiscServices';
import { getCurrentCompanyId } from '@/services/companyContext';
import { getServiceContainer } from '@/core/engine/serviceContainer';
import { defaultRepos } from '@/core/engine/supabaseRepositories';

export interface AgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  lossRate: number;
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

const DEFAULT_BUCKETS = [
  { label: '0-30 يوم (جارية)', minDays: 0, maxDays: 30, lossRate: 0.5 },
  { label: '31-60 يوم', minDays: 31, maxDays: 60, lossRate: 2 },
  { label: '61-90 يوم', minDays: 61, maxDays: 90, lossRate: 5 },
  { label: '91-180 يوم', minDays: 91, maxDays: 180, lossRate: 15 },
  { label: '181-365 يوم', minDays: 181, maxDays: 365, lossRate: 40 },
  { label: 'أكثر من 365 يوم', minDays: 366, maxDays: null, lossRate: 80 },
];

export async function calculateECL(
  reportDate?: string,
  customBuckets?: typeof DEFAULT_BUCKETS
): Promise<ECLReport> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('COMPANY_REQUIRED');

  const refDate = reportDate || new Date().toISOString().split('T')[0];
  const bucketConfig = customBuckets || DEFAULT_BUCKETS;

  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, invoice_date, total, payment_status, customer_name')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sale')
    .eq('status', 'issued')
    .in('payment_status', ['unpaid', 'partial', null]);

  if (error) throw error;

  const buckets: AgingBucket[] = bucketConfig.map(b => ({
    ...b, totalReceivable: 0, eclAmount: 0, invoiceCount: 0,
  }));

  const refDateObj = new Date(refDate);

  for (const inv of (invoices || [])) {
    const invDate = new Date(inv.invoice_date);
    const daysPast = Math.floor((refDateObj.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = inv.total || 0;

    for (const bucket of buckets) {
      if (daysPast >= bucket.minDays && (bucket.maxDays === null || daysPast <= bucket.maxDays)) {
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
    companyId, reportDate: refDate, totalReceivables, totalECL,
    eclPercentage: totalReceivables > 0 ? Math.round((totalECL / totalReceivables) * 10000) / 100 : 0,
    buckets: buckets.map(b => ({
      ...b,
      totalReceivable: Math.round(b.totalReceivable * 100) / 100,
      eclAmount: Math.round(b.eclAmount * 100) / 100,
    })),
  };
}

/**
 * Post ECL adjustment journal entry via ServiceContainer
 */
export async function postECLJournalEntry(
  eclAmount: number,
  expenseAccountId: string,
  allowanceAccountId: string,
  description?: string
): Promise<string> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('COMPANY_REQUIRED');

  const fiscalYear = await defaultRepos.fiscalYears.findCurrent(companyId);
  const amount = Math.round(eclAmount * 100) / 100;
  const desc = description || `تكوين مخصص ديون مشكوك فيها - IFRS 9 ECL`;

  const { journal } = getServiceContainer(companyId);
  const entry = await journal.createEntry({
    company_id: companyId,
    fiscal_year_id: fiscalYear?.id || '',
    entry_date: new Date().toISOString().split('T')[0],
    description: desc,
    reference_type: 'adjustment',
    is_posted: true,
    lines: [
      { account_id: expenseAccountId, debit: amount, credit: 0, description: 'مصروف ديون مشكوك في تحصيلها' },
      { account_id: allowanceAccountId, debit: 0, credit: amount, description: 'مخصص ديون مشكوك في تحصيلها' },
    ],
  });

  return entry.id;
}
