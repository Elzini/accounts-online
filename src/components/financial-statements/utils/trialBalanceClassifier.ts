/**
 * Account Classification & Financial Statement Builder
 * Extracted from trialBalanceParser.ts
 */
import { ComprehensiveFinancialData } from '../types';

export interface ClassifiedAccounts {
  fixedAssets: { name: string; amount: number; code: string }[];
  currentAssets: { name: string; amount: number; code: string }[];
  currentLiabilities: { name: string; amount: number; code: string }[];
  equity: { name: string; amount: number; code: string }[];
  revenue: { name: string; amount: number; code: string }[];
  expenses: { name: string; amount: number; code: string }[];
  purchases: { name: string; amount: number; code: string }[];
}

export function categorizeAccountMedad(code: string, name: string): string {
  const arabicName = name;

  if (code.startsWith('1')) {
    if (code.startsWith('11') || code.startsWith('110') || code.startsWith('15')) return 'أصول ثابتة';
    return 'أصول متداولة';
  }
  if (code.startsWith('2')) {
    if (code.startsWith('25')) return 'حقوق ملكية';
    return 'خصوم';
  }
  if (code.startsWith('3')) {
    if (code.startsWith('309')) return 'خصوم';
    return 'إيرادات';
  }
  if (code.startsWith('4')) {
    if (code.startsWith('45')) return 'مشتريات';
    return 'مصروفات';
  }
  if (code.startsWith('5')) return 'حقوق ملكية';

  // Name-based fallback
  if (arabicName.includes('أثاث') || arabicName.includes('معدات') || arabicName.includes('أجهز') || arabicName.includes('مركب')) return 'أصول ثابتة';
  if (arabicName.includes('بنك') || arabicName.includes('نقد') || arabicName.includes('عهد') || arabicName.includes('مصرف')) return 'أصول متداولة';
  if (arabicName.includes('إيجار مدفوع') || arabicName.includes('مدفوع مقدما')) return 'أصول متداولة';
  if (arabicName.includes('ضريبة') || arabicName.includes('مستحق') || arabicName.includes('دائن')) return 'خصوم';
  if (arabicName.includes('رواتب مستحقة')) return 'خصوم';
  if (arabicName.includes('جاري') || arabicName.includes('رأس المال') || arabicName.includes('ملكية')) return 'حقوق ملكية';
  if (arabicName.includes('مبيعات') || arabicName.includes('إيراد')) return 'إيرادات';
  if (arabicName.includes('مشتريات')) return 'مشتريات';
  if (arabicName.includes('مصروف') || arabicName.includes('مصاريف')) return 'مصروفات';

  console.log(`⚠️ Unclassified account: ${code} - ${name}`);
  return 'غير مصنف';
}

export function buildFinancialStatements(accounts: ClassifiedAccounts, result: ComprehensiveFinancialData) {
  // Balance Sheet - Non-Current Assets
  let totalNonCurrentAssets = 0;
  accounts.fixedAssets.forEach(acc => {
    result.balanceSheet.nonCurrentAssets.push({ name: acc.name, amount: acc.amount, note: acc.code });
    totalNonCurrentAssets += acc.amount;
  });
  result.balanceSheet.totalNonCurrentAssets = totalNonCurrentAssets;

  // Balance Sheet - Current Assets
  let totalCurrentAssets = 0;
  accounts.currentAssets.forEach(acc => {
    result.balanceSheet.currentAssets.push({ name: acc.name, amount: acc.amount, note: acc.code });
    totalCurrentAssets += acc.amount;
  });
  result.balanceSheet.totalCurrentAssets = totalCurrentAssets;
  result.balanceSheet.totalAssets = totalNonCurrentAssets + totalCurrentAssets;

  // Balance Sheet - Liabilities
  let totalCurrentLiabilities = 0;
  accounts.currentLiabilities.forEach(acc => {
    result.balanceSheet.currentLiabilities.push({ name: acc.name, amount: acc.amount, note: acc.code });
    totalCurrentLiabilities += acc.amount;
  });
  result.balanceSheet.totalCurrentLiabilities = totalCurrentLiabilities;
  result.balanceSheet.totalLiabilities = totalCurrentLiabilities;

  // Balance Sheet - Equity
  let totalEquity = 0;
  accounts.equity.forEach(acc => {
    result.balanceSheet.equity.push({ name: acc.name, amount: acc.amount, note: acc.code });
    totalEquity += acc.amount;
  });
  result.balanceSheet.totalEquity = totalEquity;
  result.balanceSheet.totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;

  // Income Statement
  let totalRevenue = 0;
  accounts.revenue.forEach(acc => { totalRevenue += acc.amount; });
  result.incomeStatement.revenue = totalRevenue;

  let totalPurchases = 0;
  accounts.purchases.forEach(acc => { totalPurchases += acc.amount; });
  result.incomeStatement.costOfRevenue = totalPurchases;

  let totalExpenses = 0;
  accounts.expenses.forEach(acc => { totalExpenses += acc.amount; });
  result.incomeStatement.generalAndAdminExpenses = totalExpenses;
  result.incomeStatement.sellingAndMarketingExpenses = 0;

  result.incomeStatement.grossProfit = totalRevenue - totalPurchases;
  result.incomeStatement.operatingProfit = result.incomeStatement.grossProfit - totalExpenses;
  result.incomeStatement.profitBeforeZakat = result.incomeStatement.operatingProfit;
  result.incomeStatement.netProfit = result.incomeStatement.profitBeforeZakat;
  result.incomeStatement.totalComprehensiveIncome = result.incomeStatement.netProfit;

  // Notes - Cost of Revenue
  if (!result.notes.costOfRevenue) result.notes.costOfRevenue = { items: [], total: 0 };
  accounts.purchases.forEach(acc => { result.notes.costOfRevenue!.items.push({ name: acc.name, amount: acc.amount }); });
  result.notes.costOfRevenue!.total = totalPurchases;

  // Notes - G&A Expenses
  if (!result.notes.generalAndAdminExpenses) result.notes.generalAndAdminExpenses = { items: [], total: 0 };
  accounts.expenses.forEach(acc => { result.notes.generalAndAdminExpenses!.items.push({ name: acc.name, amount: acc.amount }); });
  result.notes.generalAndAdminExpenses!.total = totalExpenses;

  // Zakat
  const profitBeforeZakat = result.incomeStatement.profitBeforeZakat;
  const adjustedNetProfit = profitBeforeZakat;
  const zakatOnAdjustedProfit = Math.max(0, adjustedNetProfit * 0.025);

  let capital = 0, partnersCurrentAccount = 0;
  accounts.equity.forEach(acc => {
    const n = acc.name.toLowerCase();
    if (n.includes('رأس المال') || n.includes('رأس مال')) capital += acc.amount;
    else if (n.includes('جاري') || n.includes('شركاء')) partnersCurrentAccount += acc.amount;
  });

  const zakatBaseSubtotal = capital + partnersCurrentAccount + adjustedNetProfit;
  const fixedAssetsNet = totalNonCurrentAssets;
  const zakatBase = Math.max(0, zakatBaseSubtotal - fixedAssetsNet);
  const zakatOnBase = zakatBase * 0.025;
  const totalZakatProvision = Math.max(zakatOnAdjustedProfit, zakatOnBase);

  result.notes.zakat = {
    profitBeforeZakat, adjustmentsOnNetIncome: 0, adjustedNetProfit, zakatOnAdjustedProfit,
    capital, partnersCurrentAccount, statutoryReserve: 0, employeeBenefitsLiabilities: 0, zakatBaseSubtotal,
    fixedAssetsNet, intangibleAssetsNet: 0, other: 0, totalDeductions: fixedAssetsNet,
    zakatBase, zakatOnBase, totalZakatProvision,
    openingBalance: 0, provisionForYear: totalZakatProvision, paidDuringYear: 0, closingBalance: totalZakatProvision,
    zakatStatus: 'تم إعداد مخصص الزكاة بشكل تقديري بناء على رأي فني في محايد حيث تعتقد إدارة المنشأة أنه كافي وفي حالة وجود فروقات ما بين مخصص الزكاة والربط النهائي سيتم إثباتها كتغيرات في التقديرات المحاسبية في الفترة التي يصدر فيها الربط النهائي.',
  };

  result.incomeStatement.zakat = totalZakatProvision;
  result.incomeStatement.netProfit = profitBeforeZakat - totalZakatProvision;
  result.incomeStatement.totalComprehensiveIncome = result.incomeStatement.netProfit;

  // Accounting Policies
  result.notes.accountingPolicies = {
    policies: [
      { title: 'أساس الإعداد', content: 'تم إعداد هذه القوائم المالية وفقاً للمعايير الدولية للتقرير المالي (IFRS) المعتمدة في المملكة العربية السعودية والمتطلبات الأخرى الصادرة عن الهيئة السعودية للمحاسبين القانونيين.' },
      { title: 'أساس القياس', content: 'تم إعداد القوائم المالية على أساس التكلفة التاريخية باستثناء ما تم الإفصاح عنه بخلاف ذلك.' },
      { title: 'العملة الوظيفية وعملة العرض', content: 'تعرض هذه القوائم المالية بالريال السعودي وهو العملة الوظيفية للشركة.' },
      { title: 'الإيرادات', content: 'يتم الاعتراف بالإيرادات عند انتقال السيطرة على البضاعة أو الخدمات إلى العميل بمبلغ يعكس العوض الذي تتوقع الشركة أن يحق لها مقابل تلك البضائع أو الخدمات.' },
      { title: 'العقارات والآلات والمعدات', content: 'تثبت العقارات والآلات والمعدات بالتكلفة ناقصاً الإهلاك المتراكم وخسائر الانخفاض في القيمة. يحسب الإهلاك باستخدام طريقة القسط الثابت على مدى العمر الإنتاجي المقدر للأصول.' },
      { title: 'الزكاة', content: 'تخضع الشركة لنظام الزكاة المعمول به في المملكة العربية السعودية. يتم احتساب مخصص الزكاة على أساس الوعاء الزكوي وفقاً للقواعد واللوائح الصادرة عن الهيئة العامة للزكاة والدخل.' },
    ]
  };

  // Fixed Assets Note
  if (accounts.fixedAssets.length > 0) {
    const categories = accounts.fixedAssets.map(acc => acc.name);
    const amounts = accounts.fixedAssets.map(acc => acc.amount);
    result.notes.fixedAssets = {
      categories, costOpening: amounts.map(() => 0), costAdditions: amounts, costDisposals: amounts.map(() => 0), costClosing: amounts,
      depreciationOpening: amounts.map(() => 0), depreciationAdditions: amounts.map(() => 0), depreciationDisposals: amounts.map(() => 0), depreciationClosing: amounts.map(() => 0),
      netBookValueClosing: amounts, netBookValuePreviousClosing: amounts.map(() => 0),
      totals: { costOpening: 0, costAdditions: totalNonCurrentAssets, costDisposals: 0, costClosing: totalNonCurrentAssets, depreciationOpening: 0, depreciationAdditions: 0, depreciationDisposals: 0, depreciationClosing: 0, netBookValueClosing: totalNonCurrentAssets, netBookValuePreviousClosing: 0 }
    };
  }

  // Creditors Note
  if (accounts.currentLiabilities.length > 0) {
    result.notes.creditors = {
      items: accounts.currentLiabilities.map(acc => ({ name: acc.name, amount: acc.amount })),
      total: totalCurrentLiabilities,
    };
  }

  // Cash & Bank Note
  const cashAndBankAccounts = accounts.currentAssets.filter(acc => {
    const n = acc.name.toLowerCase();
    return n.includes('بنك') || n.includes('نقد') || n.includes('مصرف') || n.includes('صندوق');
  });
  if (cashAndBankAccounts.length > 0) {
    result.notes.cashAndBank = {
      items: cashAndBankAccounts.map(acc => ({ name: acc.name, amount: acc.amount })),
      total: cashAndBankAccounts.reduce((sum, acc) => sum + acc.amount, 0),
    };
  }
}
