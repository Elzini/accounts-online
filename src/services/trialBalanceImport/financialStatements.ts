import { TrialBalanceRow } from './types';

export function generateFinancialStatementsFromTB(
  rows: TrialBalanceRow[],
  companyName: string,
  reportDate: string
) {
  const getNetBalance = (row: TrialBalanceRow) => {
    if (['current_liabilities', 'non_current_liabilities', 'equity', 'revenue'].includes(row.mappedType)) {
      return row.credit - row.debit;
    }
    return row.debit - row.credit;
  };
  
  const currentAssets = rows.filter(r => r.mappedType === 'current_assets');
  const nonCurrentAssets = rows.filter(r => r.mappedType === 'non_current_assets');
  const currentLiabilities = rows.filter(r => r.mappedType === 'current_liabilities');
  const nonCurrentLiabilities = rows.filter(r => r.mappedType === 'non_current_liabilities');
  const equityRows = rows.filter(r => r.mappedType === 'equity');
  const revenueRows = rows.filter(r => r.mappedType === 'revenue');
  const cogsRows = rows.filter(r => r.mappedType === 'cogs');
  const expenseRows = rows.filter(r => r.mappedType === 'expenses');

  const currentAssetsItems = currentAssets.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const nonCurrentAssetsItems = nonCurrentAssets.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const currentLiabilitiesItems = currentLiabilities.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const nonCurrentLiabilitiesItems = nonCurrentLiabilities.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);
  const equityItems = equityRows.map(r => ({ name: r.name, amount: getNetBalance(r) })).filter(a => a.amount !== 0);

  const totalCurrentAssets = currentAssetsItems.reduce((s, a) => s + a.amount, 0);
  const totalNonCurrentAssets = nonCurrentAssetsItems.reduce((s, a) => s + a.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
  const totalCurrentLiabilities = currentLiabilitiesItems.reduce((s, l) => s + l.amount, 0);
  const totalNonCurrentLiabilities = nonCurrentLiabilitiesItems.reduce((s, l) => s + l.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  const totalRevenue = revenueRows.reduce((s, r) => s + getNetBalance(r), 0);
  const costOfRevenue = cogsRows.reduce((s, r) => s + Math.abs(getNetBalance(r)), 0);
  const grossProfit = totalRevenue - costOfRevenue;
  const sellingExpenseRows = expenseRows.filter(r => 
    r.code.startsWith('62') || r.name.includes('بيع') || r.name.includes('تسويق') || r.name.includes('دعاية')
  );
  const adminExpenseRows = expenseRows.filter(r => !sellingExpenseRows.includes(r));
  const sellingAndMarketingExpenses = sellingExpenseRows.reduce((s, r) => s + Math.abs(getNetBalance(r)), 0);
  const generalAndAdminExpenses = adminExpenseRows.reduce((s, r) => s + Math.abs(getNetBalance(r)), 0);
  const operatingProfit = grossProfit - sellingAndMarketingExpenses - generalAndAdminExpenses;
  const profitBeforeZakat = operatingProfit;

  const capitalAccount = equityRows.find(r => r.code.startsWith('31'));
  const capitalValue = capitalAccount ? getNetBalance(capitalAccount) : 0;
  const totalEquityFromAccounts = equityItems.reduce((s, e) => s + e.amount, 0);
  const zakatBase = Math.max(0, totalEquityFromAccounts + profitBeforeZakat - totalNonCurrentAssets);
  const zakat = zakatBase > 0 ? zakatBase * 0.025 : 0;
  const netProfit = profitBeforeZakat - zakat;
  const totalEquity = totalEquityFromAccounts + netProfit;

  const cashAccounts = currentAssets.filter(r =>
    r.code.startsWith('11') || r.name.includes('نقد') || r.name.includes('بنك') || r.name.includes('صندوق')
  );

  return {
    companyName,
    companyType: 'مؤسسة فردية',
    reportDate,
    currency: 'ريال سعودي',
    balanceSheet: {
      currentAssets: currentAssetsItems, totalCurrentAssets,
      nonCurrentAssets: nonCurrentAssetsItems, totalNonCurrentAssets, totalAssets,
      currentLiabilities: currentLiabilitiesItems, totalCurrentLiabilities,
      nonCurrentLiabilities: nonCurrentLiabilitiesItems, totalNonCurrentLiabilities, totalLiabilities,
      equity: [...equityItems, { name: 'صافي ربح السنة', amount: netProfit }].filter(e => e.amount !== 0),
      totalEquity, totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    },
    incomeStatement: {
      revenue: totalRevenue, costOfRevenue, grossProfit,
      sellingAndMarketingExpenses: 0, generalAndAdminExpenses, operatingProfit,
      financingCost: 0, gainsLossesFromDisposals: 0, profitBeforeZakat, zakat, netProfit,
      otherComprehensiveIncome: 0, totalComprehensiveIncome: netProfit,
    },
    equityChanges: {
      periods: [{
        label: 'السنة الحالية',
        rows: [
          { description: 'الرصيد في بداية السنة', capital: capitalValue, statutoryReserve: 0, retainedEarnings: 0, total: capitalValue },
          { description: 'صافي الربح للسنة', capital: 0, statutoryReserve: 0, retainedEarnings: netProfit, total: netProfit },
          { description: 'الرصيد في نهاية السنة', capital: capitalValue, statutoryReserve: 0, retainedEarnings: netProfit, total: totalEquity },
        ],
      }],
    },
    cashFlow: {
      operatingActivities: {
        profitBeforeZakat, adjustmentsToReconcile: [], changesInWorkingCapital: [],
        zakatPaid: 0, employeeBenefitsPaid: 0, netOperatingCashFlow: netProfit,
      },
      investingActivities: [], netInvestingCashFlow: 0,
      financingActivities: [], netFinancingCashFlow: 0,
      netChangeInCash: netProfit, openingCashBalance: 0,
      closingCashBalance: cashAccounts.reduce((s, r) => s + (r.debit - r.credit), 0),
    },
    notes: {
      cashAndBank: {
        items: cashAccounts.map(r => ({ name: r.name, amount: r.debit - r.credit })).filter(a => a.amount !== 0),
        total: cashAccounts.reduce((s, r) => s + (r.debit - r.credit), 0),
      },
      costOfRevenue: {
        items: cogsRows.map(r => ({ name: r.name, amount: Math.abs(getNetBalance(r)) })).filter(a => a.amount !== 0),
        total: costOfRevenue,
      },
      generalAndAdminExpenses: {
        items: expenseRows.map(r => ({ name: r.name, amount: Math.abs(getNetBalance(r)) })).filter(a => a.amount !== 0),
        total: generalAndAdminExpenses,
      },
      creditors: { items: [...currentLiabilitiesItems, ...nonCurrentLiabilitiesItems], total: totalLiabilities },
      capital: capitalAccount ? {
        description: 'رأس مال الشركة',
        partners: [{ name: 'رأس المال', sharesCount: 1, shareValue: capitalValue, totalValue: capitalValue }],
        totalShares: 1, totalValue: capitalValue,
      } : undefined,
      zakat: {
        profitBeforeZakat, adjustmentsOnNetIncome: 0, adjustedNetProfit: profitBeforeZakat,
        zakatOnAdjustedProfit: profitBeforeZakat * 0.025, capital: capitalValue,
        partnersCurrentAccount: 0, statutoryReserve: 0, employeeBenefitsLiabilities: 0,
        zakatBaseSubtotal: totalEquityFromAccounts + profitBeforeZakat,
        fixedAssetsNet: totalNonCurrentAssets, intangibleAssetsNet: 0, prepaidRentLongTerm: 0, other: 0,
        totalDeductions: totalNonCurrentAssets, zakatBase, zakatOnBase: zakat, totalZakatProvision: zakat,
        openingBalance: 0, provisionForYear: zakat, paidDuringYear: 0, closingBalance: zakat,
        zakatStatus: 'تم احتساب مخصص الزكاة بطريقة صافي الأصول',
      },
    },
  };
}
