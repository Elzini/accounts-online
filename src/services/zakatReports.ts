import { supabase } from '@/integrations/supabase/client';
import { fetchAccounts, AccountCategory } from './accounting';

// Types for Zakat Financial Reports

// قائمة التدفقات النقدية - Cash Flow Statement
export interface CashFlowStatement {
  // التدفقات النقدية من الأنشطة التشغيلية
  operatingActivities: {
    netIncome: number;
    adjustments: Array<{ description: string; amount: number }>;
    changesInWorkingCapital: Array<{ description: string; amount: number }>;
    total: number;
  };
  // التدفقات النقدية من الأنشطة الاستثمارية
  investingActivities: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  // التدفقات النقدية من الأنشطة التمويلية
  financingActivities: {
    items: Array<{ description: string; amount: number }>;
    total: number;
  };
  // صافي التغير في النقدية
  netChangeInCash: number;
  // النقدية في بداية الفترة
  cashAtBeginning: number;
  // النقدية في نهاية الفترة
  cashAtEnd: number;
  // الفترة
  period: { startDate: string; endDate: string };
}

// قائمة التغيرات في حقوق الملكية - Statement of Changes in Equity
export interface ChangesInEquityStatement {
  openingBalance: {
    capital: number;
    retainedEarnings: number;
    reserves: number;
    total: number;
  };
  changes: {
    netIncome: number;
    dividends: number;
    capitalIncrease: number;
    otherChanges: number;
  };
  closingBalance: {
    capital: number;
    retainedEarnings: number;
    reserves: number;
    total: number;
  };
  details: Array<{
    description: string;
    capital: number;
    retainedEarnings: number;
    reserves: number;
    total: number;
  }>;
  period: { startDate: string; endDate: string };
}

// قائمة الوعاء الزكوي - Zakat Base Statement (ZATCA Format)
export interface ZakatBaseStatement {
  // مصادر الأموال الخاضعة للزكاة
  zakatableSources: {
    paidUpCapital: number; // رأس المال المدفوع
    reserves: number; // الاحتياطيات
    retainedEarnings: number; // الأرباح المحتجزة
    netIncomeForYear: number; // صافي ربح السنة
    provisions: number; // المخصصات
    longTermLoans: number; // القروض طويلة الأجل
    total: number;
  };
  // الحسميات (ما يخصم من الوعاء)
  deductions: {
    netFixedAssets: number; // صافي الأصول الثابتة
    investments: number; // الاستثمارات طويلة الأجل
    preOperatingExpenses: number; // مصاريف ما قبل التشغيل
    accumulatedLosses: number; // الخسائر المتراكمة
    total: number;
  };
  // الوعاء الزكوي المعدل
  adjustedZakatBase: number;
  // نسبة الزكاة (2.5%)
  zakatRate: number;
  // الزكاة المستحقة
  zakatDue: number;
  // معلومات إضافية
  fiscalYear: string;
  companyInfo: {
    name: string;
    taxNumber: string;
    commercialRegister: string;
  };
}

// قائمة الدخل المفصلة للزكاة - Detailed Income Statement for Zakat
export interface DetailedIncomeStatement {
  // الإيرادات
  revenue: {
    salesRevenue: number;
    otherRevenue: number;
    total: number;
  };
  // تكلفة المبيعات
  costOfSales: {
    openingInventory: number;
    purchases: number;
    closingInventory: number;
    total: number;
  };
  // مجمل الربح
  grossProfit: number;
  // المصروفات التشغيلية
  operatingExpenses: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
  // الربح التشغيلي
  operatingIncome: number;
  // المصروفات الأخرى
  otherExpenses: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
  // الإيرادات الأخرى
  otherIncome: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
  // صافي الربح قبل الزكاة
  netIncomeBeforeZakat: number;
  // الزكاة المستحقة
  zakatExpense: number;
  // صافي الربح بعد الزكاة
  netIncomeAfterZakat: number;
  // الفترة
  period: { startDate: string; endDate: string };
}

// Fetch Cash Flow Statement
export async function getCashFlowStatement(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<CashFlowStatement> {
  const accounts = await fetchAccounts(companyId);
  
  // Get all journal entries for the period
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .gte('journal_entry.entry_date', startDate)
    .lte('journal_entry.entry_date', endDate);

  if (error) throw error;

  // Calculate balances per account
  const balances = new Map<string, { debit: number; credit: number }>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || { debit: 0, credit: 0 };
    current.debit += Number(line.debit) || 0;
    current.credit += Number(line.credit) || 0;
    balances.set(line.account_id, current);
  });

  const getBalance = (accountId: string, type: string) => {
    const totals = balances.get(accountId) || { debit: 0, credit: 0 };
    if (['liabilities', 'equity', 'revenue'].includes(type)) {
      return totals.credit - totals.debit;
    }
    return totals.debit - totals.credit;
  };

  // Categorize accounts
  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expenses');
  const cashAccounts = accounts.filter(a => a.code.startsWith('11')); // النقدية والبنوك
  const receivableAccounts = accounts.filter(a => a.code.startsWith('12')); // الذمم المدينة
  const inventoryAccounts = accounts.filter(a => a.code.startsWith('13')); // المخزون
  const payableAccounts = accounts.filter(a => a.code.startsWith('21')); // الدائنون
  const fixedAssetAccounts = accounts.filter(a => a.code.startsWith('14') || a.code.startsWith('15')); // الأصول الثابتة
  const loanAccounts = accounts.filter(a => a.code.startsWith('23')); // القروض
  const capitalAccounts = accounts.filter(a => a.code.startsWith('31')); // رأس المال

  // Calculate net income
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a.id, a.type)), 0);
  const netIncome = totalRevenue - totalExpenses;

  // Operating Activities
  const receivablesChange = receivableAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const inventoryChange = inventoryAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const payablesChange = payableAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);

  const operatingActivities = {
    netIncome,
    adjustments: [
      { description: 'استهلاك الأصول الثابتة', amount: 0 }, // Would need depreciation tracking
    ],
    changesInWorkingCapital: [
      { description: 'التغير في الذمم المدينة', amount: -receivablesChange },
      { description: 'التغير في المخزون', amount: -inventoryChange },
      { description: 'التغير في الدائنين', amount: payablesChange },
    ],
    total: netIncome - receivablesChange - inventoryChange + payablesChange,
  };

  // Investing Activities
  const fixedAssetsChange = fixedAssetAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const investingActivities = {
    items: [
      { description: 'شراء أصول ثابتة', amount: -fixedAssetsChange },
    ],
    total: -fixedAssetsChange,
  };

  // Financing Activities
  const loansChange = loanAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const capitalChange = capitalAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const financingActivities = {
    items: [
      { description: 'زيادة رأس المال', amount: capitalChange },
      { description: 'القروض', amount: loansChange },
    ],
    total: capitalChange + loansChange,
  };

  // Cash calculations
  const cashAtEnd = cashAccounts.reduce((sum, a) => sum + getBalance(a.id, a.type), 0);
  const netChangeInCash = operatingActivities.total + investingActivities.total + financingActivities.total;

  return {
    operatingActivities,
    investingActivities,
    financingActivities,
    netChangeInCash,
    cashAtBeginning: cashAtEnd - netChangeInCash,
    cashAtEnd,
    period: { startDate, endDate },
  };
}

// Fetch Changes in Equity Statement
export async function getChangesInEquityStatement(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<ChangesInEquityStatement> {
  const accounts = await fetchAccounts(companyId);
  
  // Get journal entries for the period
  const { data: periodLines, error: periodError } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .gte('journal_entry.entry_date', startDate)
    .lte('journal_entry.entry_date', endDate);

  if (periodError) throw periodError;

  // Get entries before the period (for opening balance)
  const { data: priorLines, error: priorError } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .lt('journal_entry.entry_date', startDate);

  if (priorError) throw priorError;

  const calculateBalances = (lines: any[]) => {
    const balances = new Map<string, number>();
    lines.forEach((line: any) => {
      const current = balances.get(line.account_id) || 0;
      const account = accounts.find(a => a.id === line.account_id);
      if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
        balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
      } else {
        balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
      }
    });
    return balances;
  };

  const priorBalances = calculateBalances(priorLines || []);
  const periodBalances = calculateBalances(periodLines || []);

  // Categorize equity accounts
  const capitalAccounts = accounts.filter(a => a.code.startsWith('31'));
  const reserveAccounts = accounts.filter(a => a.code.startsWith('32'));
  const retainedAccounts = accounts.filter(a => a.code.startsWith('33'));
  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expenses');

  // Opening balances
  const openingCapital = capitalAccounts.reduce((sum, a) => sum + (priorBalances.get(a.id) || 0), 0);
  const openingReserves = reserveAccounts.reduce((sum, a) => sum + (priorBalances.get(a.id) || 0), 0);
  const openingRetained = retainedAccounts.reduce((sum, a) => sum + (priorBalances.get(a.id) || 0), 0);

  // Period changes
  const periodRevenue = revenueAccounts.reduce((sum, a) => sum + (periodBalances.get(a.id) || 0), 0);
  const periodExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(periodBalances.get(a.id) || 0), 0);
  const netIncome = periodRevenue - periodExpenses;

  const capitalIncrease = capitalAccounts.reduce((sum, a) => sum + (periodBalances.get(a.id) || 0), 0);
  const reservesChange = reserveAccounts.reduce((sum, a) => sum + (periodBalances.get(a.id) || 0), 0);

  // Closing balances
  const closingCapital = openingCapital + capitalIncrease;
  const closingReserves = openingReserves + reservesChange;
  const closingRetained = openingRetained + netIncome;

  return {
    openingBalance: {
      capital: openingCapital,
      retainedEarnings: openingRetained,
      reserves: openingReserves,
      total: openingCapital + openingReserves + openingRetained,
    },
    changes: {
      netIncome,
      dividends: 0, // Would need dividend tracking
      capitalIncrease,
      otherChanges: reservesChange,
    },
    closingBalance: {
      capital: closingCapital,
      retainedEarnings: closingRetained,
      reserves: closingReserves,
      total: closingCapital + closingReserves + closingRetained,
    },
    details: [
      {
        description: 'الرصيد الافتتاحي',
        capital: openingCapital,
        retainedEarnings: openingRetained,
        reserves: openingReserves,
        total: openingCapital + openingReserves + openingRetained,
      },
      {
        description: 'صافي الربح للفترة',
        capital: 0,
        retainedEarnings: netIncome,
        reserves: 0,
        total: netIncome,
      },
      {
        description: 'زيادة رأس المال',
        capital: capitalIncrease,
        retainedEarnings: 0,
        reserves: 0,
        total: capitalIncrease,
      },
      {
        description: 'الرصيد الختامي',
        capital: closingCapital,
        retainedEarnings: closingRetained,
        reserves: closingReserves,
        total: closingCapital + closingReserves + closingRetained,
      },
    ],
    period: { startDate, endDate },
  };
}

// Fetch Zakat Base Statement (قائمة الوعاء الزكوي)
export async function getZakatBaseStatement(
  companyId: string,
  fiscalYear: string
): Promise<ZakatBaseStatement> {
  const accounts = await fetchAccounts(companyId);
  
  // Get all posted journal entries
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);

  if (error) throw error;

  // Get company info
  const { data: taxSettings } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  // Calculate balances
  const balances = new Map<string, number>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || 0;
    const account = accounts.find(a => a.id === line.account_id);
    if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
      balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
    } else {
      balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
    }
  });

  const getAccountBalance = (codePrefix: string) => {
    return accounts
      .filter(a => a.code.startsWith(codePrefix))
      .reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);
  };

  // Zakatable Sources (مصادر الوعاء الزكوي)
  const paidUpCapital = getAccountBalance('31'); // رأس المال المدفوع
  const reserves = getAccountBalance('32'); // الاحتياطيات
  const retainedEarnings = getAccountBalance('33'); // الأرباح المحتجزة
  
  // Calculate net income for year
  const revenueAccounts = accounts.filter(a => a.type === 'revenue');
  const expenseAccounts = accounts.filter(a => a.type === 'expenses');
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + Math.abs(balances.get(a.id) || 0), 0);
  const netIncomeForYear = totalRevenue - totalExpenses;
  
  const provisions = getAccountBalance('24'); // المخصصات
  const longTermLoans = getAccountBalance('23'); // القروض طويلة الأجل

  const totalZakatableSources = paidUpCapital + reserves + retainedEarnings + netIncomeForYear + provisions + longTermLoans;

  // Deductions (الحسميات)
  const netFixedAssets = getAccountBalance('14') + getAccountBalance('15'); // صافي الأصول الثابتة
  const investments = getAccountBalance('16'); // الاستثمارات طويلة الأجل
  const preOperatingExpenses = getAccountBalance('17'); // مصاريف ما قبل التشغيل
  const accumulatedLosses = Math.min(0, retainedEarnings); // الخسائر المتراكمة (إن وجدت)

  const totalDeductions = netFixedAssets + investments + preOperatingExpenses + Math.abs(accumulatedLosses);

  // Adjusted Zakat Base
  const adjustedZakatBase = Math.max(0, totalZakatableSources - totalDeductions);

  // Zakat Rate (2.5%)
  const zakatRate = 0.025;
  const zakatDue = adjustedZakatBase * zakatRate;

  return {
    zakatableSources: {
      paidUpCapital,
      reserves,
      retainedEarnings: Math.max(0, retainedEarnings),
      netIncomeForYear,
      provisions,
      longTermLoans,
      total: totalZakatableSources,
    },
    deductions: {
      netFixedAssets,
      investments,
      preOperatingExpenses,
      accumulatedLosses: Math.abs(accumulatedLosses),
      total: totalDeductions,
    },
    adjustedZakatBase,
    zakatRate,
    zakatDue,
    fiscalYear,
    companyInfo: {
      name: company?.name || '',
      taxNumber: taxSettings?.tax_number || '',
      commercialRegister: taxSettings?.commercial_register || '',
    },
  };
}

// Get Detailed Income Statement for Zakat
export async function getDetailedIncomeStatement(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<DetailedIncomeStatement> {
  const accounts = await fetchAccounts(companyId);
  
  const { data: lines, error } = await supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, entry_date, is_posted)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .gte('journal_entry.entry_date', startDate)
    .lte('journal_entry.entry_date', endDate);

  if (error) throw error;

  const balances = new Map<string, number>();
  (lines || []).forEach((line: any) => {
    const current = balances.get(line.account_id) || 0;
    const account = accounts.find(a => a.id === line.account_id);
    if (account && ['liabilities', 'equity', 'revenue'].includes(account.type)) {
      balances.set(line.account_id, current + (Number(line.credit) - Number(line.debit)));
    } else {
      balances.set(line.account_id, current + (Number(line.debit) - Number(line.credit)));
    }
  });

  // Revenue accounts (4xxx)
  const salesAccounts = accounts.filter(a => a.code.startsWith('41'));
  const otherRevenueAccounts = accounts.filter(a => a.type === 'revenue' && !a.code.startsWith('41'));
  
  const salesRevenue = salesAccounts.reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);
  const otherRevenue = otherRevenueAccounts.reduce((sum, a) => sum + (balances.get(a.id) || 0), 0);

  // Cost of Sales (51xx)
  const cogsAccounts = accounts.filter(a => a.code.startsWith('51'));
  const cogsTotal = cogsAccounts.reduce((sum, a) => sum + Math.abs(balances.get(a.id) || 0), 0);

  // Operating Expenses (52xx - 54xx)
  const opExpenseAccounts = accounts.filter(a => 
    a.type === 'expenses' && 
    (a.code.startsWith('52') || a.code.startsWith('53') || a.code.startsWith('54'))
  );
  const operatingExpenses = opExpenseAccounts.map(a => ({
    name: a.name,
    amount: Math.abs(balances.get(a.id) || 0),
  })).filter(e => e.amount > 0);
  const totalOpExpenses = operatingExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Other Expenses (55xx+)
  const otherExpenseAccounts = accounts.filter(a => 
    a.type === 'expenses' && 
    !a.code.startsWith('51') && 
    !a.code.startsWith('52') && 
    !a.code.startsWith('53') && 
    !a.code.startsWith('54')
  );
  const otherExpenses = otherExpenseAccounts.map(a => ({
    name: a.name,
    amount: Math.abs(balances.get(a.id) || 0),
  })).filter(e => e.amount > 0);
  const totalOtherExpenses = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculations
  const grossProfit = salesRevenue + otherRevenue - cogsTotal;
  const operatingIncome = grossProfit - totalOpExpenses;
  const netIncomeBeforeZakat = operatingIncome + otherRevenue - totalOtherExpenses;
  const zakatExpense = netIncomeBeforeZakat * 0.025; // 2.5%
  const netIncomeAfterZakat = netIncomeBeforeZakat - zakatExpense;

  return {
    revenue: {
      salesRevenue,
      otherRevenue,
      total: salesRevenue + otherRevenue,
    },
    costOfSales: {
      openingInventory: 0,
      purchases: cogsTotal,
      closingInventory: 0,
      total: cogsTotal,
    },
    grossProfit,
    operatingExpenses: {
      items: operatingExpenses,
      total: totalOpExpenses,
    },
    operatingIncome,
    otherExpenses: {
      items: otherExpenses,
      total: totalOtherExpenses,
    },
    otherIncome: {
      items: [],
      total: otherRevenue,
    },
    netIncomeBeforeZakat,
    zakatExpense,
    netIncomeAfterZakat,
    period: { startDate, endDate },
  };
}
