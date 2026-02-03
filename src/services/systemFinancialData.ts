// خدمة حساب القوائم المالية من بيانات النظام
import { supabase } from '@/integrations/supabase/client';
import { 
  ComprehensiveFinancialData, 
  BalanceSheetData, 
  IncomeStatementData,
  CashFlowData,
  EquityChangesData,
  emptyFinancialData 
} from '@/components/financial-statements/types';
import { AccountCategory, fetchAccounts } from './accounting';

interface SystemTrialBalanceAccount {
  code: string;
  name: string;
  type: string;
  openingDebit: number;
  openingCredit: number;
  movementDebit: number;
  movementCredit: number;
  closingDebit: number;
  closingCredit: number;
}

interface SystemTrialBalanceData {
  accounts: SystemTrialBalanceAccount[];
  totals: {
    openingDebit: number;
    openingCredit: number;
    movementDebit: number;
    movementCredit: number;
    closingDebit: number;
    closingCredit: number;
  };
}

// جلب ميزان المراجعة الشامل من النظام (6 أعمدة)
export async function getSystemTrialBalance(
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<SystemTrialBalanceData> {
  const accounts = await fetchAccounts(companyId);
  
  // جلب الأرصدة الافتتاحية (قبل تاريخ البداية)
  let openingQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);
  
  if (startDate) {
    openingQuery = openingQuery.lt('journal_entry.entry_date', startDate);
  }
  
  const { data: openingLines, error: openingError } = await openingQuery;
  if (openingError) throw openingError;

  // جلب حركة الفترة
  let movementQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);
  
  if (startDate) {
    movementQuery = movementQuery.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    movementQuery = movementQuery.lte('journal_entry.entry_date', endDate);
  }
  
  const { data: movementLines, error: movementError } = await movementQuery;
  if (movementError) throw movementError;

  // تجميع الأرصدة
  const openingBalances = new Map<string, { debit: number; credit: number }>();
  const movementBalances = new Map<string, { debit: number; credit: number }>();

  (openingLines || []).forEach((line: any) => {
    const current = openingBalances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    openingBalances.set(line.account_id, current);
  });

  (movementLines || []).forEach((line: any) => {
    const current = movementBalances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    movementBalances.set(line.account_id, current);
  });

  // بناء ميزان المراجعة
  const trialBalanceAccounts: SystemTrialBalanceAccount[] = [];
  const totals = {
    openingDebit: 0,
    openingCredit: 0,
    movementDebit: 0,
    movementCredit: 0,
    closingDebit: 0,
    closingCredit: 0,
  };

  accounts.forEach(account => {
    const opening = openingBalances.get(account.id) || { debit: 0, credit: 0 };
    const movement = movementBalances.get(account.id) || { debit: 0, credit: 0 };
    
    const openingDebit = opening.debit;
    const openingCredit = opening.credit;
    const movementDebit = movement.debit;
    const movementCredit = movement.credit;
    const closingDebit = openingDebit + movementDebit;
    const closingCredit = openingCredit + movementCredit;

    // فقط الحسابات التي لها حركة
    if (closingDebit > 0 || closingCredit > 0) {
      trialBalanceAccounts.push({
        code: account.code,
        name: account.name,
        type: account.type,
        openingDebit,
        openingCredit,
        movementDebit,
        movementCredit,
        closingDebit,
        closingCredit,
      });

      totals.openingDebit += openingDebit;
      totals.openingCredit += openingCredit;
      totals.movementDebit += movementDebit;
      totals.movementCredit += movementCredit;
      totals.closingDebit += closingDebit;
      totals.closingCredit += closingCredit;
    }
  });

  // ترتيب حسب رقم الحساب
  trialBalanceAccounts.sort((a, b) => a.code.localeCompare(b.code));

  return { accounts: trialBalanceAccounts, totals };
}

// حساب القوائم المالية الشاملة من بيانات النظام
export async function getSystemFinancialStatements(
  companyId: string,
  companyName: string,
  startDate?: string,
  endDate?: string
): Promise<ComprehensiveFinancialData> {
  const accounts = await fetchAccounts(companyId);
  
  // جلب جميع القيود المحاسبية للفترة
  let query = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (startDate) {
    query = query.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('journal_entry.entry_date', endDate);
  }

  const { data: lines, error } = await query;
  if (error) throw error;

  // تجميع الأرصدة لكل حساب
  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    balances.set(line.account_id, current);
  });

  // دالة حساب الرصيد الصافي
  const getBalance = (account: AccountCategory): number => {
    const totals = balances.get(account.id) || { debit: 0, credit: 0 };
    if (['liabilities', 'equity', 'revenue'].includes(account.type)) {
      return totals.credit - totals.debit;
    }
    return totals.debit - totals.credit;
  };

  // تصنيف الحسابات
  const assetAccounts = accounts.filter(a => a.type === 'assets');
  const liabilityAccounts = accounts.filter(a => a.type === 'liabilities');
  const equityAccounts = accounts.filter(a => a.type === 'equity');
  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expenses');

  // تصنيف الأصول
  const currentAssetCodes = ['11', '12', '13'];
  const isCurrentAsset = (code: string) => currentAssetCodes.some(c => code.startsWith(c));

  const currentLiabilityCodes = ['21', '22'];
  const isCurrentLiability = (code: string) => currentLiabilityCodes.some(c => code.startsWith(c));

  // ===== قائمة المركز المالي =====
  const currentAssets = assetAccounts
    .filter(a => isCurrentAsset(a.code))
    .map(a => ({ name: a.name, amount: getBalance(a) }))
    .filter(a => a.amount !== 0);

  const nonCurrentAssets = assetAccounts
    .filter(a => !isCurrentAsset(a.code))
    .map(a => ({ name: a.name, amount: getBalance(a) }))
    .filter(a => a.amount !== 0);

  const currentLiabilities = liabilityAccounts
    .filter(a => isCurrentLiability(a.code))
    .map(a => ({ name: a.name, amount: getBalance(a) }))
    .filter(a => a.amount !== 0);

  const nonCurrentLiabilities = liabilityAccounts
    .filter(a => !isCurrentLiability(a.code))
    .map(a => ({ name: a.name, amount: getBalance(a) }))
    .filter(a => a.amount !== 0);

  const equity = equityAccounts
    .map(a => ({ name: a.name, amount: getBalance(a) }))
    .filter(a => a.amount !== 0);

  const totalCurrentAssets = currentAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, a) => sum + a.amount, 0);
  const totalAssets = totalCurrentAssets + totalNonCurrentAssets;

  const totalCurrentLiabilities = currentLiabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((sum, l) => sum + l.amount, 0);
  const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;

  // ===== قائمة الدخل =====
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + getBalance(a), 0);
  
  // تصنيف المصروفات
  const cogsAccounts = expenseAccounts.filter(a => 
    a.code.startsWith('51') || a.name.includes('تكلفة') || a.name.includes('مشتريات')
  );
  const adminAccounts = expenseAccounts.filter(a => 
    !a.code.startsWith('51') && !a.name.includes('تكلفة') && !a.name.includes('مشتريات')
  );

  const costOfRevenue = cogsAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0);
  const generalAndAdminExpenses = adminAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0);

  const grossProfit = totalRevenue - costOfRevenue;
  const operatingProfit = grossProfit - generalAndAdminExpenses;
  const profitBeforeZakat = operatingProfit;
  
  // نسبة الزكاة 2.5%
  const zakatRate = 0.025;
  const zakat = Math.max(0, profitBeforeZakat * zakatRate);
  const netProfit = profitBeforeZakat - zakat;

  // حساب صافي حقوق الملكية
  const totalEquityFromAccounts = equity.reduce((sum, e) => sum + e.amount, 0);
  const totalEquity = totalEquityFromAccounts + netProfit;

  // ===== بناء الإيضاحات =====
  // إيضاح النقد والبنوك
  const cashAccounts = assetAccounts.filter(a => 
    a.code.startsWith('11') || a.name.includes('نقد') || a.name.includes('بنك') || a.name.includes('صندوق')
  );
  const cashAndBank = {
    items: cashAccounts.map(a => ({ name: a.name, amount: getBalance(a) })).filter(a => a.amount !== 0),
    total: cashAccounts.reduce((sum, a) => sum + getBalance(a), 0),
  };

  // إيضاح تكلفة الإيرادات
  const costOfRevenueNote = {
    items: cogsAccounts.map(a => ({ name: a.name, amount: Math.abs(getBalance(a)) })).filter(a => a.amount !== 0),
    total: costOfRevenue,
  };

  // إيضاح المصاريف العمومية والإدارية
  const generalAndAdminExpensesNote = {
    items: adminAccounts.map(a => ({ name: a.name, amount: Math.abs(getBalance(a)) })).filter(a => a.amount !== 0),
    total: generalAndAdminExpenses,
  };

  // إيضاح الدائنون
  const creditorsNote = {
    items: liabilityAccounts.map(a => ({ name: a.name, amount: getBalance(a) })).filter(a => a.amount !== 0),
    total: totalLiabilities,
  };

  // إيضاح رأس المال
  const capitalAccount = equityAccounts.find(a => a.code.startsWith('31') || a.name.includes('رأس المال'));
  const capitalNote = capitalAccount ? {
    description: 'رأس مال الشركة',
    partners: [{ name: 'رأس المال', sharesCount: 1, shareValue: getBalance(capitalAccount), totalValue: getBalance(capitalAccount) }],
    totalShares: 1,
    totalValue: getBalance(capitalAccount),
  } : undefined;

  // إيضاح الزكاة
  const zakatNote = {
    profitBeforeZakat,
    adjustmentsOnNetIncome: 0,
    adjustedNetProfit: profitBeforeZakat,
    zakatOnAdjustedProfit: zakat,
    capital: capitalAccount ? getBalance(capitalAccount) : 0,
    partnersCurrentAccount: 0,
    statutoryReserve: 0,
    employeeBenefitsLiabilities: 0,
    zakatBaseSubtotal: totalEquity,
    fixedAssetsNet: totalNonCurrentAssets,
    intangibleAssetsNet: 0,
    other: 0,
    totalDeductions: totalNonCurrentAssets,
    zakatBase: Math.max(0, totalEquity - totalNonCurrentAssets),
    zakatOnBase: Math.max(0, totalEquity - totalNonCurrentAssets) * zakatRate,
    totalZakatProvision: zakat,
    openingBalance: 0,
    provisionForYear: zakat,
    paidDuringYear: 0,
    closingBalance: zakat,
    zakatStatus: 'تم احتساب مخصص الزكاة',
  };

  // ===== قائمة التدفقات النقدية =====
  const cashFlow: CashFlowData = {
    operatingActivities: {
      profitBeforeZakat,
      adjustmentsToReconcile: [],
      changesInWorkingCapital: [],
      zakatPaid: 0,
      employeeBenefitsPaid: 0,
      netOperatingCashFlow: netProfit,
    },
    investingActivities: [],
    netInvestingCashFlow: 0,
    financingActivities: [],
    netFinancingCashFlow: 0,
    netChangeInCash: netProfit,
    openingCashBalance: 0,
    closingCashBalance: cashAndBank.total,
  };

  // ===== قائمة التغيرات في حقوق الملكية =====
  const equityChanges: EquityChangesData = {
    periods: [{
      label: 'السنة الحالية',
      rows: [
        {
          description: 'الرصيد في بداية السنة',
          capital: capitalAccount ? getBalance(capitalAccount) : 0,
          statutoryReserve: 0,
          retainedEarnings: 0,
          total: capitalAccount ? getBalance(capitalAccount) : 0,
        },
        {
          description: 'صافي الربح للسنة',
          capital: 0,
          statutoryReserve: 0,
          retainedEarnings: netProfit,
          total: netProfit,
        },
        {
          description: 'الرصيد في نهاية السنة',
          capital: capitalAccount ? getBalance(capitalAccount) : 0,
          statutoryReserve: 0,
          retainedEarnings: netProfit,
          total: totalEquity,
        },
      ],
    }],
  };

  // ===== بناء البيانات الشاملة =====
  const balanceSheet: BalanceSheetData = {
    currentAssets,
    totalCurrentAssets,
    nonCurrentAssets,
    totalNonCurrentAssets,
    totalAssets,
    currentLiabilities,
    totalCurrentLiabilities,
    nonCurrentLiabilities,
    totalNonCurrentLiabilities,
    totalLiabilities,
    equity: [
      ...equity,
      { name: 'صافي ربح السنة', amount: netProfit },
    ].filter(e => e.amount !== 0),
    totalEquity,
    totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
  };

  const incomeStatement: IncomeStatementData = {
    revenue: totalRevenue,
    costOfRevenue,
    grossProfit,
    generalAndAdminExpenses,
    operatingProfit,
    financingCost: 0,
    gainsLossesFromDisposals: 0,
    profitBeforeZakat,
    zakat,
    netProfit,
    otherComprehensiveIncome: 0,
    totalComprehensiveIncome: netProfit,
  };

  const reportDate = endDate 
    ? new Date(endDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  return {
    companyName,
    companyType: 'مؤسسة فردية',
    reportDate,
    currency: 'ريال سعودي',
    balanceSheet,
    incomeStatement,
    equityChanges,
    cashFlow,
    notes: {
      cashAndBank,
      costOfRevenue: costOfRevenueNote,
      generalAndAdminExpenses: generalAndAdminExpensesNote,
      creditors: creditorsNote,
      capital: capitalNote,
      zakat: zakatNote,
    },
  };
}
