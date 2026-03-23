import { supabase } from '@/hooks/modules/useMiscServices';
import { IntegrityCheckResult } from './types';

export async function checkBalanceParity(companyId: string): Promise<IntegrityCheckResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, entry_number, is_posted')
    .eq('company_id', companyId)
    .eq('is_posted', true)
    .limit(200);

  const issues: string[] = [];
  let imbalancedEntries = 0;

  if (entries) {
    for (const entry of entries) {
      const { data: lines } = await supabase
        .from('journal_entry_lines')
        .select('debit, credit')
        .eq('journal_entry_id', entry.id);

      if (lines) {
        const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
        const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
        const diff = Math.abs(totalDebit - totalCredit);

        if (diff > 0.01) {
          imbalancedEntries++;
          issues.push(`قيد رقم ${entry.entry_number}: فرق ${diff.toFixed(2)} ريال`);
        }
      }
    }
  }

  return {
    checkType: 'balance_parity',
    checkName: 'تطابق الأرصدة (مدين = دائن)',
    status: imbalancedEntries === 0 ? 'pass' : 'fail',
    details: { totalEntries: entries?.length || 0, imbalancedEntries, issues },
    issuesFound: imbalancedEntries,
  };
}
