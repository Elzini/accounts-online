import { CashFlowStatement } from './types';
import { fetchAccounts, calculateActualNetIncome, fetchJournalBalances } from './helpers';

export async function getCashFlowStatement(companyId: string, startDate: string, endDate: string): Promise<CashFlowStatement> {
  const accounts = await fetchAccounts(companyId);
  const actualData = await calculateActualNetIncome(companyId, startDate, endDate);
  const { getBalance } = await fetchJournalBalances(companyId, startDate, endDate, accounts);

  const cashAccounts = accounts.filter(a => a.code.startsWith('11'));
  const receivableAccounts = accounts.filter(a => a.code.startsWith('12'));
  const inventoryAccounts = accounts.filter(a => a.code.startsWith('13'));
  const payableAccounts = accounts.filter(a => a.code.startsWith('21'));
  const fixedAssetAccounts = accounts.filter(a => a.code.startsWith('14') || a.code.startsWith('15'));
  const loanAccounts = accounts.filter(a => a.code.startsWith('23'));
  const capitalAccounts = accounts.filter(a => a.code.startsWith('31'));

  const netIncome = actualData.netIncome;
  const receivablesChange = receivableAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const inventoryChange = inventoryAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const payablesChange = payableAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);

  const operatingActivities = {
    netIncome, adjustments: [{ description: 'استهلاك الأصول الثابتة', amount: 0 }],
    changesInWorkingCapital: [
      { description: 'التغير في الذمم المدينة', amount: -receivablesChange },
      { description: 'التغير في المخزون', amount: -inventoryChange },
      { description: 'التغير في الدائنين', amount: payablesChange },
    ],
    total: netIncome - receivablesChange - inventoryChange + payablesChange,
  };

  const fixedAssetsChange = fixedAssetAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const investingActivities = { items: [{ description: 'شراء أصول ثابتة', amount: -fixedAssetsChange }], total: -fixedAssetsChange };

  const loansChange = loanAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const capitalChange = capitalAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const financingActivities = { items: [{ description: 'زيادة رأس المال', amount: capitalChange }, { description: 'القروض', amount: loansChange }], total: capitalChange + loansChange };

  const cashAtEnd = cashAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const netChangeInCash = operatingActivities.total + investingActivities.total + financingActivities.total;

  return { operatingActivities, investingActivities, financingActivities, netChangeInCash, cashAtBeginning: cashAtEnd - netChangeInCash, cashAtEnd, period: { startDate, endDate } };
}
