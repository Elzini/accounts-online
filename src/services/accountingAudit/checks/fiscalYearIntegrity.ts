import { supabase } from '@/hooks/modules/useMiscServices';
import { AuditCheckResult } from '../types';

export async function checkFiscalYearIntegrity(companyId: string): Promise<AuditCheckResult[]> {
  const results: AuditCheckResult[] = [];
  const { data: fiscalYears, error: fyErr } = await supabase.from('fiscal_years').select('*').eq('company_id', companyId).order('start_date', { ascending: true });

  if (fyErr || !fiscalYears || fiscalYears.length === 0) {
    results.push({ id: 'fy-exists', category: 'fiscal-year', name: 'وجود سنوات مالية', status: 'warning', message: 'لا توجد سنوات مالية محددة', severity: 'medium' });
    return results;
  }

  const closedYears = fiscalYears.filter(fy => fy.status === 'closed');
  if (closedYears.length > 0) {
    const closedDetails: string[] = [];
    for (const fy of closedYears) {
      const { data: modifiedEntries } = await supabase.from('journal_entries').select('id, entry_number, updated_at').eq('company_id', companyId).gte('entry_date', fy.start_date).lte('entry_date', fy.end_date).gt('updated_at', fy.updated_at);
      if (modifiedEntries && modifiedEntries.length > 0) closedDetails.push(`${fy.name}: ${modifiedEntries.length} قيد تم تعديله بعد الإغلاق`);
    }
    results.push({ id: 'fy-closed-protection', category: 'fiscal-year', name: 'حماية السنوات المغلقة', status: closedDetails.length > 0 ? 'fail' : 'pass', message: closedDetails.length > 0 ? '⚠️ تم تعديل قيود في سنوات مالية مغلقة!' : `✓ ${closedYears.length} سنة مغلقة بدون تعديلات`, details: closedDetails, severity: closedDetails.length > 0 ? 'critical' : 'info' });
  }

  if (fiscalYears.length > 1) {
    results.push({ id: 'fy-carry-forward', category: 'fiscal-year', name: 'ترحيل الأرصدة', status: 'pass', message: `✓ ${fiscalYears.length} سنة مالية متسلسلة`, details: fiscalYears.map(fy => `${fy.name}: ${fy.start_date} → ${fy.end_date} ${fy.status === 'closed' ? '(مغلقة)' : '(مفتوحة)'}`), severity: 'info' });
  }

  return results;
}
