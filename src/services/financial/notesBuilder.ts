/**
 * Financial Statement Notes Builder
 * Extracted from systemFinancialData.ts
 */
import { AccountCategory } from '../accounting';
import { ZakatNote } from '@/components/financial-statements/types';
import { ClassifiedAccounts, getBalance, getPositiveCreditBalance } from './accountClassifier';
import { IncomeComponents } from './incomeStatementBuilder';

export function buildNotes(
  classified: ClassifiedAccounts,
  balances: Map<string, { debit: number; credit: number }>,
  income: IncomeComponents,
  zakatNote: ZakatNote
) {
  const bal = (a: AccountCategory) => getBalance(a, balances);
  const posCr = (a: AccountCategory) => getPositiveCreditBalance(a, balances);

  // Cash & Bank
  const cashAccounts = classified.assetAccounts.filter(a =>
    a.code.startsWith('11') || a.name.includes('نقد') || a.name.includes('بنك') || a.name.includes('صندوق')
  );
  const cashAndBank = {
    items: cashAccounts.map(a => ({ name: a.name, amount: bal(a) })).filter(a => a.amount !== 0),
    total: cashAccounts.reduce((sum, a) => sum + bal(a), 0),
  };

  // COGS note
  const costOfRevenueNote = {
    items: income.cogsAccounts.map(a => ({ name: a.name, amount: Math.abs(bal(a)) })).filter(a => a.amount !== 0),
    total: income.costOfRevenue,
  };

  // Selling expenses note
  const sellingExpensesNote = {
    items: income.sellingAccounts.map(a => ({ name: a.name, amount: Math.abs(bal(a)) })).filter(a => a.amount !== 0),
    total: income.sellingAndMarketingExpenses,
  };

  // G&A note
  const generalAndAdminExpensesNote = {
    items: income.adminAccounts.map(a => ({ name: a.name, amount: Math.abs(bal(a)) })).filter(a => a.amount !== 0),
    total: income.generalAndAdminExpenses,
  };

  // Creditors
  const creditorsNote = {
    items: classified.liabilityAccounts.map(a => ({ name: a.name, amount: bal(a) })).filter(a => a.amount !== 0),
    total: classified.liabilityAccounts.reduce((sum, a) => sum + bal(a), 0),
  };

  // Capital
  const capitalAccounts = classified.equityAccounts.filter(a =>
    (a.name.includes('رأس المال') || a.name.includes('راس المال')) &&
    !a.name.includes('جاري') && !a.name.includes('سحوبات') && !a.name.includes('مسحوبات')
  );
  const capitalValue = capitalAccounts.reduce((sum, a) => sum + posCr(a), 0);
  const capitalNote = capitalAccounts.length > 0 ? {
    description: 'رأس مال الشركة',
    partners: [{ name: 'رأس المال', sharesCount: 1, shareValue: capitalValue, totalValue: capitalValue }],
    totalShares: 1,
    totalValue: capitalValue,
  } : undefined;

  return {
    cashAndBank,
    costOfRevenue: costOfRevenueNote,
    generalAndAdminExpenses: generalAndAdminExpensesNote,
    creditors: creditorsNote,
    capital: capitalNote,
    zakat: zakatNote,
  };
}
