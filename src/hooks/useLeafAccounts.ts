import { useMemo } from 'react';
import { useAccounts } from '@/hooks/useAccounting';

/**
 * Returns only leaf accounts (accounts that have no children).
 * Use this in journal entry forms and voucher forms to prevent
 * direct posting to parent/summary accounts.
 */
export function useLeafAccounts() {
  const { data: accounts = [], ...rest } = useAccounts();

  const leafAccounts = useMemo(() => {
    const parentIds = new Set(
      accounts
        .filter(a => a.parent_id)
        .map(a => a.parent_id!)
    );
    return accounts.filter(a => !parentIds.has(a.id));
  }, [accounts]);

  return { data: leafAccounts, allAccounts: accounts, ...rest };
}
