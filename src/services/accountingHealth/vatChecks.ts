// مدقق ضريبة القيمة المضافة
import { supabase } from '@/integrations/supabase/client';
import { AccountingCheckResult } from './types';

export async function checkVATAccuracy(companyId: string): Promise<AccountingCheckResult> {
  const { data: accounts } = await supabase
    .from('account_categories')
    .select('id, code, name, type')
    .eq('company_id', companyId)
    .or('code.like.2201%,code.like.2202%,code.like.2203%');

  if (!accounts || accounts.length === 0) {
    return {
      checkId: 'vat_accuracy', checkName: 'دقة حسابات ضريبة القيمة المضافة',
      category: 'vat', status: 'warning', severity: 'medium',
      summary: 'لم يتم العثور على حسابات ضريبة القيمة المضافة',
      details: { message: 'لا توجد حسابات ضريبة (2201/2202/2203)' },
      issuesCount: 1, recommendations: ['إضافة حسابات ضريبة المخرجات (2201) والمدخلات (2202)'],
    };
  }

  const accountIds = accounts.map(a => a.id);
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_posted', true);

  let vatOutput = 0, vatInput = 0;

  if (entries) {
    const entryIds = entries.map(e => e.id);
    for (let i = 0; i < entryIds.length; i += 100) {
      const batch = entryIds.slice(i, i + 100);
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('account_id, debit, credit')
        .in('journal_entry_id', batch)
        .in('account_id', accountIds);

      if (lines) {
        lines.forEach(l => {
          const account = accounts.find(a => a.id === l.account_id);
          if (account?.code?.startsWith('2201')) {
            vatOutput += (Number(l.credit) || 0) - (Number(l.debit) || 0);
          } else if (account?.code?.startsWith('2202')) {
            vatInput += (Number(l.debit) || 0) - (Number(l.credit) || 0);
          }
        });
      }
    }
  }

  const { data: salesInvoices } = await supabase
    .from('invoices')
    .select('total, vat_amount, status')
    .eq('company_id', companyId)
    .eq('invoice_type', 'sale')
    .in('status', ['issued', 'paid']);

  const { data: purchaseInvoices } = await supabase
    .from('invoices')
    .select('total, vat_amount, status')
    .eq('company_id', companyId)
    .eq('invoice_type', 'purchase')
    .in('status', ['issued', 'paid']);

  const invoiceSalesVAT = (salesInvoices || []).reduce((s: number, i: any) => s + (Number(i.vat_amount) || 0), 0);
  const totalExpectedInput = (purchaseInvoices || []).reduce((s: number, i: any) => s + (Number(i.vat_amount) || 0), 0);

  const outputDiff = Math.round((vatOutput - invoiceSalesVAT) * 100) / 100;
  const inputDiff = Math.round((vatInput - totalExpectedInput) * 100) / 100;
  const hasDiscrepancy = Math.abs(outputDiff) > 1 || Math.abs(inputDiff) > 1;
  const netVAT = vatOutput - vatInput;

  return {
    checkId: 'vat_accuracy',
    checkName: 'دقة حسابات ضريبة القيمة المضافة',
    category: 'vat',
    status: hasDiscrepancy ? 'warning' : 'pass',
    severity: hasDiscrepancy ? 'high' : 'low',
    summary: hasDiscrepancy
      ? `فرق في الضريبة: مخرجات ${outputDiff.toLocaleString()} | مدخلات ${inputDiff.toLocaleString()}`
      : `الضريبة متطابقة | صافي مستحق: ${Math.round(netVAT * 100 / 100).toLocaleString()} ريال`,
    details: {
      vatOutput: Math.round(vatOutput * 100) / 100,
      vatInput: Math.round(vatInput * 100) / 100,
      netVAT: Math.round(netVAT * 100) / 100,
      expectedOutput: invoiceSalesVAT,
      expectedInput: totalExpectedInput,
      outputDifference: outputDiff,
      inputDifference: inputDiff,
    },
    issuesCount: hasDiscrepancy ? 1 : 0,
    recommendations: hasDiscrepancy
      ? ['مراجعة ترحيل الضريبة في الفواتير', 'التأكد من استخدام حسابات 2201/2202 الصحيحة']
      : [],
  };
}
