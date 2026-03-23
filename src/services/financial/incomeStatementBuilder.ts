/**
 * Income Statement Builder - Constructs income statement from classified accounts
 * Extracted from systemFinancialData.ts
 */
import { IncomeStatementData } from '@/components/financial-statements/types';
import { AccountCategory } from '../accounting';
import { ClassifiedAccounts, getBalance } from './accountClassifier';

export interface IncomeComponents {
  totalRevenue: number;
  costOfRevenue: number;
  sellingAndMarketingExpenses: number;
  generalAndAdminExpenses: number;
  grossProfit: number;
  operatingProfit: number;
  profitBeforeZakat: number;
  cogsAccounts: AccountCategory[];
  sellingAccounts: AccountCategory[];
  adminAccounts: AccountCategory[];
}

export function computeIncomeComponents(
  classified: ClassifiedAccounts,
  balances: Map<string, { debit: number; credit: number }>
): IncomeComponents {
  const bal = (a: AccountCategory) => getBalance(a, balances);

  const totalRevenue = classified.revenueAccounts.reduce((sum, a) => sum + bal(a), 0);

  // COGS
  const cogsAccounts = classified.expenseAccounts.filter(a =>
    a.code.startsWith('51') || a.name.includes('تكلفة') || a.name.includes('مشتريات') || a.name.includes('بضاعة')
  );

  // Selling & Marketing (IAS 1.103)
  const sellingAccounts = classified.expenseAccounts.filter(a =>
    !a.code.startsWith('51') && (
      a.code.startsWith('62') ||
      a.name.includes('بيع') || a.name.includes('تسويق') || a.name.includes('دعاية') ||
      a.name.includes('إعلان') || a.name.includes('عمولة بيع') || a.name.includes('توزيع')
    )
  );

  // G&A - everything else
  const adminAccounts = classified.expenseAccounts.filter(a =>
    !a.code.startsWith('51') && !sellingAccounts.includes(a)
  );

  const costOfRevenue = cogsAccounts.reduce((sum, a) => sum + Math.abs(bal(a)), 0);
  const sellingAndMarketingExpenses = sellingAccounts.reduce((sum, a) => sum + Math.abs(bal(a)), 0);
  const generalAndAdminExpenses = adminAccounts.reduce((sum, a) => sum + Math.abs(bal(a)), 0);

  const grossProfit = totalRevenue - costOfRevenue;
  const operatingProfit = grossProfit - sellingAndMarketingExpenses - generalAndAdminExpenses;

  return {
    totalRevenue,
    costOfRevenue,
    sellingAndMarketingExpenses,
    generalAndAdminExpenses,
    grossProfit,
    operatingProfit,
    profitBeforeZakat: operatingProfit,
    cogsAccounts,
    sellingAccounts,
    adminAccounts,
  };
}

export function buildIncomeStatement(
  components: IncomeComponents,
  zakat: number,
  netProfit: number
): IncomeStatementData {
  return {
    revenue: components.totalRevenue,
    costOfRevenue: components.costOfRevenue,
    grossProfit: components.grossProfit,
    sellingAndMarketingExpenses: components.sellingAndMarketingExpenses,
    generalAndAdminExpenses: components.generalAndAdminExpenses,
    operatingProfit: components.operatingProfit,
    financingCost: 0,
    gainsLossesFromDisposals: 0,
    profitBeforeZakat: components.profitBeforeZakat,
    zakat,
    netProfit,
    otherComprehensiveIncome: 0,
    totalComprehensiveIncome: netProfit,
  };
}
