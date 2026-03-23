import { supabase } from '@/hooks/modules/useMiscServices';
import { AuditCheckResult } from '../types';
import { createFixNegativeAmounts, createFixOrphanedSaleEntries } from '../../auditFixActions';

export async function checkEdgeCases(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Negative amounts
  const { data: negativeLines } = await supabase.from('journal_entry_lines').select('id, debit, credit, journal_entry:journal_entries!inner(company_id, entry_number)').eq('journal_entry.company_id', companyId).or('debit.lt.0,credit.lt.0');
  results.push({ id: 'edge-negative-amounts', category: 'edge-cases', name: 'مبالغ سالبة في القيود', status: negativeLines && negativeLines.length > 0 ? 'warning' : 'pass', message: negativeLines && negativeLines.length > 0 ? `⚠️ ${negativeLines.length} سطر قيد يحتوي على مبالغ سالبة` : '✓ لا توجد مبالغ سالبة', details: (negativeLines || []).slice(0, 5).map((l: any) => `قيد #${l.journal_entry?.entry_number}: مدين=${l.debit}, دائن=${l.credit}`), severity: negativeLines && negativeLines.length > 0 ? 'medium' : 'info', fixActions: negativeLines && negativeLines.length > 0 ? [createFixNegativeAmounts(companyId, negativeLines.map((l: any) => l.id))] : undefined });

  // Large amounts
  const { data: largeLines } = await supabase.from('journal_entry_lines').select('id, debit, credit, journal_entry:journal_entries!inner(company_id, entry_number)').eq('journal_entry.company_id', companyId).or('debit.gt.10000000,credit.gt.10000000');
  results.push({ id: 'edge-large-amounts', category: 'edge-cases', name: 'مبالغ كبيرة جداً (أكثر من 10 مليون)', status: largeLines && largeLines.length > 0 ? 'warning' : 'pass', message: largeLines && largeLines.length > 0 ? `⚠️ ${largeLines.length} سطر بمبالغ تتجاوز 10 مليون` : '✓ لا توجد مبالغ كبيرة غير طبيعية', severity: largeLines && largeLines.length > 0 ? 'low' : 'info' });

  // Orphaned sale entries
  const { data: saleEntries } = await supabase.from('journal_entries').select('id, entry_number, reference_id').eq('company_id', companyId).eq('reference_type', 'sale').not('reference_id', 'is', null);
  if (saleEntries && saleEntries.length > 0) {
    const orphanedSaleEntries: string[] = [];
    const orphanedEntryIds: string[] = [];
    for (const entry of saleEntries.slice(0, 50)) {
      const { data: sale } = await supabase.from('sales').select('id').eq('id', entry.reference_id!).maybeSingle();
      if (!sale) { orphanedSaleEntries.push(`قيد #${entry.entry_number} مرتبط بعملية بيع محذوفة`); orphanedEntryIds.push(entry.id); }
    }
    results.push({ id: 'edge-orphaned-sale-entries', category: 'edge-cases', name: 'قيود مرتبطة بفواتير محذوفة', status: orphanedSaleEntries.length > 0 ? 'warning' : 'pass', message: orphanedSaleEntries.length > 0 ? `⚠️ ${orphanedSaleEntries.length} قيد مرتبط بفواتير محذوفة` : '✓ جميع القيود مرتبطة بفواتير صحيحة', details: orphanedSaleEntries.slice(0, 10), severity: orphanedSaleEntries.length > 0 ? 'high' : 'info', fixActions: orphanedEntryIds.length > 0 ? [createFixOrphanedSaleEntries(companyId, orphanedEntryIds)] : undefined });
  }

  // Unused accounts
  const { data: allAccounts } = await supabase.from('account_categories').select('id, code, name').eq('company_id', companyId);
  if (allAccounts && allAccounts.length > 0) {
    const accountsWithEntries = new Set<string>();
    const { data: usedAccounts } = await supabase.from('journal_entry_lines').select('account_id, journal_entry:journal_entries!inner(company_id)').eq('journal_entry.company_id', companyId);
    (usedAccounts || []).forEach((l: any) => accountsWithEntries.add(l.account_id));
    const unusedAccounts = allAccounts.filter(a => !accountsWithEntries.has(a.id));
    results.push({ id: 'edge-unused-accounts', category: 'edge-cases', name: 'حسابات بدون حركة', status: unusedAccounts.length > allAccounts.length * 0.8 ? 'warning' : 'pass', message: `${unusedAccounts.length} حساب بدون أي حركة من أصل ${allAccounts.length}`, severity: unusedAccounts.length > allAccounts.length * 0.8 ? 'low' : 'info' });
  }

  return results;
}
