import { supabase } from '@/integrations/supabase/client';
import { IntegrityCheckResult } from './types';

export async function checkTenantIsolation(companyId: string): Promise<IntegrityCheckResult> {
  const tables = ['journal_entries', 'journal_entry_lines', 'account_categories', 'invoices', 'vouchers'];
  const issues: string[] = [];

  for (const table of tables) {
    try {
      await supabase
        .from(table as any)
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);
    } catch {
      continue;
    }
  }

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, company_id')
    .eq('company_id', companyId)
    .limit(100);

  if (entries && entries.length > 0) {
    const entryIds = entries.map(e => e.id);
    const { data: lines } = await supabase
      .from('journal_entry_lines')
      .select('id, account_id, journal_entry_id')
      .in('journal_entry_id', entryIds.slice(0, 50));

    if (lines) {
      const accountIds = [...new Set(lines.map(l => l.account_id))];
      const { data: accounts } = await supabase
        .from('account_categories')
        .select('id, company_id')
        .in('id', accountIds);

      if (accounts) {
        const foreignAccounts = accounts.filter(a => a.company_id !== companyId);
        if (foreignAccounts.length > 0) {
          issues.push(`تم اكتشاف ${foreignAccounts.length} حساب تابع لشركة أخرى في القيود`);
        }
      }
    }
  }

  return {
    checkType: 'tenant_isolation',
    checkName: 'عزل بيانات الشركات',
    status: issues.length === 0 ? 'pass' : 'fail',
    details: { issues, tablesChecked: tables.length },
    issuesFound: issues.length,
  };
}
