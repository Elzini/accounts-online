import type { QueryClient, QueryKey } from '@tanstack/react-query';

const FINANCIAL_REPORT_QUERY_PREFIXES: QueryKey[] = [
  ['journal-entries'],
  ['journal-entry'],
  ['account-balances'],
  ['trial-balance'],
  ['comprehensive-trial-balance'],
  ['income-statement'],
  ['balance-sheet'],
  ['general-ledger'],
  ['vat-settlement-report'],
  ['vouchers-report'],
  ['journal-entries-report'],
];

/**
 * Single source of truth for invalidating accounting report caches.
 * This prevents future regressions where one report updates and others stay stale.
 */
export async function invalidateFinancialReportQueries(
  queryClient: QueryClient,
  companyId?: string | null
) {
  const invalidations = FINANCIAL_REPORT_QUERY_PREFIXES.flatMap((prefix) => {
    const baseInvalidation = queryClient.invalidateQueries({ queryKey: prefix });

    if (!companyId) {
      return [baseInvalidation];
    }

    return [
      baseInvalidation,
      queryClient.invalidateQueries({ queryKey: [...prefix, companyId] }),
    ];
  });

  await Promise.all(invalidations);
}
