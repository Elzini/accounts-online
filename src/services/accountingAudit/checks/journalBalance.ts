import { supabase } from '@/integrations/supabase/client';
import { AuditCheckResult } from '../types';
import { createFixUnbalancedEntries, createFixLinesTotalsMismatch, createFixDuplicateEntries } from '../../auditFixActions';

export async function checkJournalEntryBalance(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];

  // Opening entries
  const { data: openingEntries, error: oeErr } = await supabase.from('journal_entries').select('id, entry_number, total_debit, total_credit, description').eq('company_id', companyId).eq('reference_type', 'opening');
  if (oeErr) {
    results.push({ id: 'balance-opening', category: 'journal-balance', name: 'توازن القيد الافتتاحي', status: 'fail', message: 'خطأ في قراءة القيود الافتتاحية', severity: 'critical' });
  } else {
    const unbalancedOpening = (openingEntries || []).filter(e => Math.abs(Number(e.total_debit) - Number(e.total_credit)) > 0.01);
    results.push({ id: 'balance-opening', category: 'journal-balance', name: 'توازن القيد الافتتاحي', status: unbalancedOpening.length > 0 ? 'fail' : (openingEntries && openingEntries.length > 0 ? 'pass' : 'warning'), message: unbalancedOpening.length > 0 ? `${unbalancedOpening.length} قيد افتتاحي غير متوازن!` : (openingEntries && openingEntries.length > 0 ? `${openingEntries.length} قيد افتتاحي متوازن` : 'لا توجد قيود افتتاحية'), details: unbalancedOpening.map(e => `قيد #${e.entry_number}: مدين=${e.total_debit} ≠ دائن=${e.total_credit}`), severity: unbalancedOpening.length > 0 ? 'critical' : 'info', fixActions: unbalancedOpening.length > 0 ? [createFixUnbalancedEntries(companyId, unbalancedOpening.map(e => e.id))] : undefined });
  }

  // All entries balance
  const { data: allEntries, error: allErr } = await supabase.from('journal_entries').select('id, entry_number, total_debit, total_credit, entry_date, description').eq('company_id', companyId).order('entry_number', { ascending: true });
  if (allErr) {
    results.push({ id: 'balance-all-entries', category: 'journal-balance', name: 'توازن جميع القيود اليومية', status: 'fail', message: 'خطأ في قراءة القيود', severity: 'critical' });
  } else {
    const unbalanced = (allEntries || []).filter(e => Math.abs(Number(e.total_debit) - Number(e.total_credit)) > 0.01);
    results.push({ id: 'balance-all-entries', category: 'journal-balance', name: 'توازن جميع القيود اليومية', status: unbalanced.length > 0 ? 'fail' : 'pass', message: unbalanced.length > 0 ? `⚠️ ${unbalanced.length} قيد غير متوازن من أصل ${(allEntries || []).length}` : `✓ جميع القيود متوازنة (${(allEntries || []).length} قيد)`, details: unbalanced.slice(0, 20).map(e => `قيد #${e.entry_number} (${e.entry_date}): مدين=${e.total_debit} ≠ دائن=${e.total_credit} | ${e.description || ''}`), severity: unbalanced.length > 0 ? 'critical' : 'info', fixActions: unbalanced.length > 0 ? [createFixUnbalancedEntries(companyId, unbalanced.map(e => e.id))] : undefined });

    // Duplicates
    if (allEntries && allEntries.length > 0) {
      const duplicates: string[] = [];
      const duplicateEntryIds: string[] = [];
      const seen = new Map<string, { numbers: number[]; ids: string[] }>();
      for (const entry of allEntries) {
        const key = `${entry.entry_date}_${entry.total_debit}_${entry.total_credit}_${entry.description || ''}`;
        const existing = seen.get(key) || { numbers: [], ids: [] };
        existing.numbers.push(entry.entry_number);
        existing.ids.push(entry.id);
        seen.set(key, existing);
      }
      for (const [, group] of seen) {
        if (group.numbers.length > 1) { duplicates.push(`قيود مكررة: #${group.numbers.join(', #')}`); duplicateEntryIds.push(...group.ids.slice(1)); }
      }
      results.push({ id: 'balance-duplicates', category: 'journal-balance', name: 'فحص القيود المكررة', status: duplicates.length > 0 ? 'warning' : 'pass', message: duplicates.length > 0 ? `⚠️ تم العثور على ${duplicates.length} مجموعة من القيود المحتمل تكرارها` : 'لا توجد قيود مكررة', details: duplicates.slice(0, 10), severity: duplicates.length > 0 ? 'medium' : 'info', fixActions: duplicateEntryIds.length > 0 ? [createFixDuplicateEntries(companyId, duplicateEntryIds)] : undefined });
    }
  }

  // Lines match totals
  const { data: entriesWithLines, error: ewlErr } = await supabase.from('journal_entries').select('id, entry_number, total_debit, total_credit').eq('company_id', companyId);
  if (!ewlErr && entriesWithLines && entriesWithLines.length > 0) {
    const mismatchDetails: string[] = [];
    const mismatchIds: string[] = [];
    const sampleEntries = entriesWithLines.slice(0, 100);
    for (const entry of sampleEntries) {
      const { data: lines } = await supabase.from('journal_entry_lines').select('debit, credit').eq('journal_entry_id', entry.id);
      if (lines) {
        const linesDebit = lines.reduce((s, l) => s + Number(l.debit), 0);
        const linesCredit = lines.reduce((s, l) => s + Number(l.credit), 0);
        if (Math.abs(linesDebit - Number(entry.total_debit)) > 0.01 || Math.abs(linesCredit - Number(entry.total_credit)) > 0.01) {
          mismatchDetails.push(`قيد #${entry.entry_number}: مجموع السطور (${linesDebit}/${linesCredit}) ≠ إجمالي القيد (${entry.total_debit}/${entry.total_credit})`);
          mismatchIds.push(entry.id);
        }
      }
    }
    results.push({ id: 'balance-lines-match', category: 'journal-balance', name: 'تطابق سطور القيود مع الإجمالي', status: mismatchDetails.length > 0 ? 'fail' : 'pass', message: mismatchDetails.length > 0 ? `${mismatchDetails.length} قيد لا تتطابق سطوره مع الإجمالي` : `تم فحص ${sampleEntries.length} قيد - جميعها متطابقة`, details: mismatchDetails.slice(0, 10), severity: mismatchDetails.length > 0 ? 'high' : 'info', fixActions: mismatchIds.length > 0 ? [createFixLinesTotalsMismatch(companyId, mismatchIds)] : undefined });
  }

  return results;
}
