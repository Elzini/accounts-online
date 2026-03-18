import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

/**
 * Fetch balances for a set of account IDs from journal_entry_lines
 */
async function fetchAccountBalances(
  accountIds: string[],
  companyId: string,
  fiscalYearId?: string
): Promise<Record<string, number>> {
  if (!accountIds.length) return {};

  // Get all leaf accounts under requested accounts (recursive)
  const { data: allAccounts } = await supabase
    .from('account_categories')
    .select('id, parent_id, code, type')
    .eq('company_id', companyId);

  if (!allAccounts) return {};

  // Build parent->children map
  const childrenOf = new Map<string, string[]>();
  allAccounts.forEach(a => {
    if (a.parent_id) {
      const existing = childrenOf.get(a.parent_id) || [];
      existing.push(a.id);
      childrenOf.set(a.parent_id, existing);
    }
  });

  // For each requested account, collect all leaf descendants
  const accountLeafMap = new Map<string, string[]>();
  
  function getLeaves(accountId: string): string[] {
    const children = childrenOf.get(accountId);
    if (!children || children.length === 0) return [accountId];
    return children.flatMap(getLeaves);
  }

  const allLeafIds = new Set<string>();
  accountIds.forEach(id => {
    const leaves = getLeaves(id);
    accountLeafMap.set(id, leaves);
    leaves.forEach(l => allLeafIds.add(l));
  });

  // Fetch balances from journal_entry_lines
  let query = supabase
    .from('journal_entry_lines')
    .select('account_id, debit, credit, journal_entries!inner(is_posted, company_id, fiscal_year_id)')
    .eq('journal_entries.company_id', companyId)
    .eq('journal_entries.is_posted', true)
    .in('account_id', Array.from(allLeafIds));

  if (fiscalYearId) {
    query = query.eq('journal_entries.fiscal_year_id', fiscalYearId);
  }

  const { data: lines } = await query;
  if (!lines) return {};

  // Sum per leaf
  const leafTotals = new Map<string, { debit: number; credit: number }>();
  lines.forEach((line: any) => {
    const existing = leafTotals.get(line.account_id) || { debit: 0, credit: 0 };
    existing.debit += Number(line.debit) || 0;
    existing.credit += Number(line.credit) || 0;
    leafTotals.set(line.account_id, existing);
  });

  // Calculate balance per requested account
  const accountTypeMap = new Map(allAccounts.map(a => [a.id, a.type]));
  const result: Record<string, number> = {};

  accountIds.forEach(id => {
    const leaves = accountLeafMap.get(id) || [];
    let balance = 0;
    leaves.forEach(leafId => {
      const totals = leafTotals.get(leafId) || { debit: 0, credit: 0 };
      const type = accountTypeMap.get(leafId) || accountTypeMap.get(id);
      // Credit-normal accounts: liabilities, equity, revenue
      if (['liabilities', 'equity', 'revenue'].includes(type || '')) {
        balance += totals.credit - totals.debit;
      } else {
        balance += totals.debit - totals.credit;
      }
    });
    result[id] = balance;
  });

  return result;
}

/**
 * Hook to fetch account balances for dashboard cards
 */
export function useCardAccountBalances(accountIds: string[]) {
  const { companyId } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();

  return useQuery({
    queryKey: ['card-account-balances', companyId, selectedFiscalYear?.id, accountIds.sort().join(',')],
    queryFn: () => fetchAccountBalances(accountIds, companyId!, selectedFiscalYear?.id),
    enabled: !!companyId && accountIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}
