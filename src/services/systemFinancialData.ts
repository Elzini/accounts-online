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
  
  // تحديد الحسابات الورقية فقط (التي ليس لها أبناء) لمنع الازدواجية
  const parentIds = new Set(accounts.filter(a => a.parent_id).map(a => a.parent_id!));
  const leafAccounts = accounts.filter(a => !parentIds.has(a.id));
  // جلب الأرصدة الافتتاحية (قبل تاريخ البداية + قيود الافتتاح بنفس التاريخ)
  let openingQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true);
  
  if (startDate) {
    openingQuery = openingQuery.lt('journal_entry.entry_date', startDate);
  }
  
  const { data: openingLines, error: openingError } = await openingQuery;
  if (openingError) throw openingError;

  // جلب قيود الافتتاح المرحّلة التي تاريخها يقع ضمن الفترة (reference_type = 'opening')
  let openingEntriesQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .eq('journal_entry.reference_type', 'opening');
  
  if (startDate) {
    openingEntriesQuery = openingEntriesQuery.gte('journal_entry.entry_date', startDate);
  }
  if (endDate) {
    openingEntriesQuery = openingEntriesQuery.lte('journal_entry.entry_date', endDate);
  }
  
  const { data: openingEntryLines, error: openingEntryError } = await openingEntriesQuery;
  if (openingEntryError) throw openingEntryError;

  // جلب حركة الفترة (باستثناء قيود الافتتاح)
  let movementQuery = supabase
    .from('journal_entry_lines')
    .select(`
      account_id,
      debit,
      credit,
      journal_entry:journal_entries!inner(company_id, is_posted, entry_date, reference_type)
    `)
    .eq('journal_entry.company_id', companyId)
    .eq('journal_entry.is_posted', true)
    .neq('journal_entry.reference_type', 'opening');
  
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

  // تجميع الأرصدة الافتتاحية (ما قبل الفترة + قيود الافتتاح المرحّلة)
  // استبعاد حسابات الإيرادات والمصروفات لأنها حسابات فترة تبدأ من صفر كل سنة
  const balanceSheetTypes = new Set(['asset', 'assets', 'liability', 'liabilities', 'equity']);
  const accountTypeMap = new Map<string, string>();
  leafAccounts.forEach(a => accountTypeMap.set(a.id, a.type));
  // تضمين الحسابات الأب أيضاً لأنها قد تظهر في القيود
  accounts.forEach(a => { if (!accountTypeMap.has(a.id)) accountTypeMap.set(a.id, a.type); });

  // إذا وُجد قيد افتتاحي داخل الفترة المختارة نستخدمه حصراً للافتتاح
  // حتى لا تُحتسب أرصدة السنوات السابقة مرتين.
  const openingLinesInPeriod = openingEntryLines || [];
  const openingSourceLines = openingLinesInPeriod.length > 0
    ? openingLinesInPeriod
    : [...(openingLines || [])];

  openingSourceLines.forEach((line: any) => {
    const accType = accountTypeMap.get(line.account_id);
    // فقط حسابات المركز المالي (أصول، خصوم، حقوق ملكية)
    if (!accType || !balanceSheetTypes.has(accType)) return;
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

  leafAccounts.forEach(account => {
    const opening = openingBalances.get(account.id) || { debit: 0, credit: 0 };
    const movement = movementBalances.get(account.id) || { debit: 0, credit: 0 };
    
    const openingDebit = opening.debit;
    const openingCredit = opening.credit;
    const movementDebit = movement.debit;
    const movementCredit = movement.credit;
    
    // حساب الصافي الإجمالي (رصيد افتتاحي + حركة الفترة)
    const totalDebit = openingDebit + movementDebit;
    const totalCredit = openingCredit + movementCredit;
    const netBalance = totalDebit - totalCredit;
    const closingDebit = netBalance > 0 ? netBalance : 0;
    const closingCredit = netBalance < 0 ? Math.abs(netBalance) : 0;

    // فقط الحسابات التي لها حركة
    if (movementDebit > 0 || movementCredit > 0 || openingDebit > 0 || openingCredit > 0) {
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
    }
  });

  // حساب إجماليات الإقفال من البيانات الخام لضمان التوازن
  totals.closingDebit = totals.openingDebit + totals.movementDebit;
  totals.closingCredit = totals.openingCredit + totals.movementCredit;

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
  
  // تحديد الحسابات الورقية فقط (التي ليس لها أبناء) لمنع الازدواجية
  const parentIds = new Set(accounts.filter(a => a.parent_id).map(a => a.parent_id!));
  const leafAccounts = accounts.filter(a => !parentIds.has(a.id));
  
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

  // تجميع الأرصدة لكل حساب من القيود
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
    if (['liability', 'liabilities', 'equity', 'revenue'].includes(account.type)) {
      return totals.credit - totals.debit;
    }
    return totals.debit - totals.credit;
  };

  // تصنيف الحسابات الورقية فقط (دعم المفرد والجمع لتوافق قاعدة البيانات)
  const typeMatch = (a: { type: string }, ...types: string[]) => types.includes(a.type);
  const assetAccounts = leafAccounts.filter(a => typeMatch(a, 'asset', 'assets'));
  const liabilityAccounts = leafAccounts.filter(a => typeMatch(a, 'liability', 'liabilities'));
  const equityAccounts = leafAccounts.filter(a => typeMatch(a, 'equity'));
  const revenueAccounts = leafAccounts.filter(a => typeMatch(a, 'revenue'));
  const expenseAccounts = leafAccounts.filter(a => typeMatch(a, 'expense', 'expenses'));

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

  // ===== قائمة الدخل - حساب من القيود المحاسبية =====
  // الإيرادات من حسابات الإيرادات
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + getBalance(a), 0);
  
  // تصنيف المصروفات من القيود وفقاً لـ IAS 1 (عرض حسب الوظيفة)
  // تكلفة البضاعة المباعة (COGS) - تشمل حساب 5101 وما يبدأ بـ 51
  const cogsAccounts = expenseAccounts.filter(a => 
    a.code.startsWith('51') || a.name.includes('تكلفة') || a.name.includes('مشتريات') || a.name.includes('بضاعة')
  );
  // مصاريف البيع والتسويق (IAS 1.103) - ما يبدأ بـ 62 أو يحتوي على كلمات البيع/التسويق
  const sellingAccounts = expenseAccounts.filter(a => 
    !a.code.startsWith('51') && (
      a.code.startsWith('62') || 
      a.name.includes('بيع') || a.name.includes('تسويق') || a.name.includes('دعاية') || 
      a.name.includes('إعلان') || a.name.includes('عمولة بيع') || a.name.includes('توزيع')
    )
  );
  // المصروفات الإدارية والعمومية - باقي المصروفات
  const adminAccounts = expenseAccounts.filter(a => 
    !a.code.startsWith('51') && 
    !sellingAccounts.includes(a)
  );

  // تكلفة المبيعات من القيود (حساب 5101)
  const costOfRevenue = cogsAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0);
  const sellingAndMarketingExpenses = sellingAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0);
  const generalAndAdminExpenses = adminAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0);

  // حساب الأرباح من القيود المحاسبية:
  // الربح الإجمالي = الإيرادات - تكلفة البضاعة المباعة
  const grossProfit = totalRevenue - costOfRevenue;
  // ربح العمليات = الربح الإجمالي - مصاريف البيع - المصروفات الإدارية (IAS 1.103)
  const operatingProfit = grossProfit - sellingAndMarketingExpenses - generalAndAdminExpenses;
  // الربح قبل الزكاة
  const profitBeforeZakat = operatingProfit;
  
  // نسبة الزكاة 2.5%
  const zakatRate = 0.025;

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

  // إيضاح مصاريف البيع والتسويق (IAS 1.103)
  const sellingExpensesNote = {
    items: sellingAccounts.map(a => ({ name: a.name, amount: Math.abs(getBalance(a)) })).filter(a => a.amount !== 0),
    total: sellingAndMarketingExpenses,
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
  const capitalValue = capitalAccount ? getBalance(capitalAccount) : 0;
  const capitalNote = capitalAccount ? {
    description: 'رأس مال الشركة',
    partners: [{ name: 'رأس المال', sharesCount: 1, shareValue: capitalValue, totalValue: capitalValue }],
    totalShares: 1,
    totalValue: capitalValue,
  } : undefined;

  // ===== حساب الزكاة - طريقة صافي الأصول (متوافق مع هيئة الزكاة والضريبة والجمارك ZATCA) =====
  // البحث عن حسابات الإيجار المدفوع مقدماً
  const prepaidRentAccounts = assetAccounts.filter(a => 
    a.name.includes('إيجار مدفوع') || a.name.includes('ايجار مدفوع') || 
    a.name.includes('إيجار مقدم') || a.name.includes('ايجار مقدم')
  );
  const prepaidRent = prepaidRentAccounts.reduce((sum, a) => sum + getBalance(a), 0);
  const prepaidRentLongTerm = prepaidRent * (11/12);

  // حساب حقوق الملكية من الحسابات
  const totalEquityFromAccounts = equity.reduce((sum, e) => sum + e.amount, 0);

  // ===== إضافات الوعاء الزكوي (طريقة صافي الأصول - ZATCA) =====
  // 1. جاري الشركاء/المالك فقط (وليس التمويل البنكي أو القروض التجارية)
  const partnersCurrentAccounts = liabilityAccounts.filter(a =>
    a.name.includes('جاري المالك') || a.name.includes('جاري الشريك') || 
    a.name.includes('جاري الشركاء') || a.name.includes('جاري صاحب') ||
    a.name.includes('قرض الشريك') || a.name.includes('قروض الشركاء') ||
    a.name.includes('سلف من المالك') || a.name.includes('سلف من الشريك') ||
    a.code.startsWith('32') // حسابات جاري الملاك عادةً تحت 32
  );
  // أيضاً نبحث في حقوق الملكية عن جاري المالك
  const equityPartnersAccounts = equityAccounts.filter(a =>
    a.name.includes('جاري') || a.name.includes('حساب جاري')
  );
  const partnersCurrentTotal = 
    partnersCurrentAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0) +
    equityPartnersAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0);

  // 2. المخصصات (provisions) - ما عدا مخصص الزكاة نفسه
  const provisionAccounts = liabilityAccounts.filter(a =>
    (a.name.includes('مخصص') || a.name.includes('احتياطي')) && !a.name.includes('زكاة')
  );
  const provisionsTotal = provisionAccounts.reduce((sum, a) => sum + Math.abs(getBalance(a)), 0);

  // 3. الاحتياطي النظامي
  const statutoryReserveAccounts = equityAccounts.filter(a => 
    a.name.includes('احتياطي نظامي') || a.name.includes('احتياطي قانوني')
  );
  const statutoryReserveTotal = statutoryReserveAccounts.reduce((sum, a) => sum + getBalance(a), 0);

  // ===== حسم من الوعاء الزكوي =====
  // الأصول الثابتة + الاستثمارات طويلة الأجل
  const longTermInvestments = assetAccounts.filter(a =>
    a.name.includes('استثمار') && !a.code.startsWith('11')
  );
  const longTermInvestmentsTotal = longTermInvestments.reduce((sum, a) => sum + getBalance(a), 0);

  // الوعاء الزكوي = حقوق الملكية + جاري الشركاء + المخصصات + صافي الربح - الأصول الثابتة - الاستثمارات - الإيجار المدفوع مقدماً
  const zakatBase = capitalValue 
    + partnersCurrentTotal 
    + provisionsTotal 
    + statutoryReserveTotal
    + profitBeforeZakat 
    - totalNonCurrentAssets 
    - longTermInvestmentsTotal
    - prepaidRentLongTerm;
  
  // الزكاة المستحقة = الوعاء الزكوي × 2.5%
  const zakat = zakatBase > 0 ? zakatBase * zakatRate : 0;
  const netProfit = profitBeforeZakat - zakat;

  // حساب صافي حقوق الملكية
  const totalEquity = totalEquityFromAccounts + netProfit;

  // إيضاح الزكاة - طريقة صافي الأصول
  const totalDeductions = totalNonCurrentAssets + longTermInvestmentsTotal + prepaidRentLongTerm;
  const zakatNote = {
    profitBeforeZakat,
    adjustmentsOnNetIncome: 0,
    adjustedNetProfit: profitBeforeZakat,
    zakatOnAdjustedProfit: profitBeforeZakat * zakatRate,
    capital: capitalValue,
    partnersCurrentAccount: partnersCurrentTotal,
    statutoryReserve: statutoryReserveTotal,
    employeeBenefitsLiabilities: provisionsTotal,
    zakatBaseSubtotal: capitalValue + partnersCurrentTotal + provisionsTotal + statutoryReserveTotal + profitBeforeZakat,
    fixedAssetsNet: totalNonCurrentAssets,
    intangibleAssetsNet: longTermInvestmentsTotal,
    prepaidRentLongTerm,
    other: 0,
    totalDeductions,
    zakatBase: Math.max(0, zakatBase),
    zakatOnBase: zakat,
    totalZakatProvision: zakat,
    openingBalance: 0,
    provisionForYear: zakat,
    paidDuringYear: 0,
    closingBalance: zakat,
    zakatStatus: zakatBase > 0 ? 'تم احتساب مخصص الزكاة بطريقة صافي الأصول' : 'الوعاء الزكوي سالب - لا تستحق زكاة',
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
    sellingAndMarketingExpenses,
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
    ? `${new Date(endDate).getDate()} ${new Date(endDate).toLocaleDateString('ar-SA', { month: 'long' })} ${new Date(endDate).getFullYear()}م`
    : `${new Date().getDate()} ${new Date().toLocaleDateString('ar-SA', { month: 'long' })} ${new Date().getFullYear()}م`;

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
