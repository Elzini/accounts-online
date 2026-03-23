/**
 * ZakatReportsPage - Export Utilities (extracted from main component)
 */
import { format } from 'date-fns';

export function buildCashFlowExportData(cashFlow: any) {
  const columns = [
    { header: 'البند', key: 'item' },
    { header: 'المبلغ (ر.س)', key: 'amount' },
  ];
  const data = [
    { item: 'صافي الربح', amount: String(cashFlow.operatingActivities.netIncome) },
    { item: '--- الأنشطة التشغيلية ---', amount: '' },
    ...cashFlow.operatingActivities.changesInWorkingCapital.map((c: any) => ({ item: c.description, amount: String(c.amount) })),
    { item: 'إجمالي التدفقات التشغيلية', amount: String(cashFlow.operatingActivities.total) },
    { item: '--- الأنشطة الاستثمارية ---', amount: '' },
    ...cashFlow.investingActivities.items.map((c: any) => ({ item: c.description, amount: String(c.amount) })),
    { item: 'إجمالي التدفقات الاستثمارية', amount: String(cashFlow.investingActivities.total) },
    { item: '--- الأنشطة التمويلية ---', amount: '' },
    ...cashFlow.financingActivities.items.map((c: any) => ({ item: c.description, amount: String(c.amount) })),
    { item: 'إجمالي التدفقات التمويلية', amount: String(cashFlow.financingActivities.total) },
    { item: '---', amount: '' },
    { item: 'صافي التغير في النقدية', amount: String(cashFlow.netChangeInCash) },
    { item: 'النقدية في بداية الفترة', amount: String(cashFlow.cashAtBeginning) },
    { item: 'النقدية في نهاية الفترة', amount: String(cashFlow.cashAtEnd) },
  ];
  const summaryData = [
    { label: 'التدفقات التشغيلية', value: cashFlow.operatingActivities.total + ' ر.س' },
    { label: 'التدفقات الاستثمارية', value: cashFlow.investingActivities.total + ' ر.س' },
    { label: 'التدفقات التمويلية', value: cashFlow.financingActivities.total + ' ر.س' },
    { label: 'صافي التغير', value: cashFlow.netChangeInCash + ' ر.س' },
  ];
  return { columns, data, summaryData };
}

export function buildEquityExportData(equityChanges: any) {
  const columns = [
    { header: 'البيان', key: 'description' },
    { header: 'رأس المال', key: 'capital' },
    { header: 'الاحتياطيات', key: 'reserves' },
    { header: 'الأرباح المحتجزة', key: 'retainedEarnings' },
    { header: 'الإجمالي', key: 'total' },
  ];
  const data = equityChanges.details.map((d: any) => ({
    description: d.description, capital: String(d.capital), reserves: String(d.reserves),
    retainedEarnings: String(d.retainedEarnings), total: String(d.total),
  }));
  const summaryData = [
    { label: 'الرصيد الافتتاحي', value: equityChanges.openingBalance.total + ' ر.س' },
    { label: 'الرصيد الختامي', value: equityChanges.closingBalance.total + ' ر.س' },
  ];
  return { columns, data, summaryData };
}

export function buildZakatBaseExportData(zakatBase: any) {
  const columns = [
    { header: 'البند', key: 'item' },
    { header: 'المبلغ (ر.س)', key: 'amount' },
  ];
  const data = [
    { item: '=== مصادر الأموال الخاضعة للزكاة ===', amount: '' },
    { item: 'رأس المال المدفوع', amount: String(zakatBase.zakatableSources.paidUpCapital) },
    { item: 'الاحتياطيات', amount: String(zakatBase.zakatableSources.reserves) },
    { item: 'الأرباح المحتجزة', amount: String(zakatBase.zakatableSources.retainedEarnings) },
    { item: 'صافي ربح السنة', amount: String(zakatBase.zakatableSources.netIncomeForYear) },
    { item: 'المخصصات', amount: String(zakatBase.zakatableSources.provisions) },
    { item: 'القروض طويلة الأجل', amount: String(zakatBase.zakatableSources.longTermLoans) },
    { item: 'إجمالي مصادر الأموال', amount: String(zakatBase.zakatableSources.total) },
    { item: '', amount: '' },
    { item: '=== الحسميات ===', amount: '' },
    { item: 'صافي الأصول الثابتة', amount: String(zakatBase.deductions.netFixedAssets) },
    { item: 'الاستثمارات طويلة الأجل', amount: String(zakatBase.deductions.investments) },
    { item: 'مصاريف ما قبل التشغيل', amount: String(zakatBase.deductions.preOperatingExpenses) },
    { item: 'الخسائر المتراكمة', amount: String(zakatBase.deductions.accumulatedLosses) },
    { item: 'إجمالي الحسميات', amount: String(zakatBase.deductions.total) },
    { item: '', amount: '' },
    { item: '=== الوعاء الزكوي ===', amount: '' },
    { item: 'الوعاء الزكوي المعدل', amount: String(zakatBase.adjustedZakatBase) },
    { item: 'نسبة الزكاة', amount: '2.5%' },
    { item: 'الزكاة المستحقة', amount: String(zakatBase.zakatDue) },
  ];
  const summaryData = [
    { label: 'الوعاء الزكوي', value: zakatBase.adjustedZakatBase + ' ر.س' },
    { label: 'الزكاة المستحقة', value: zakatBase.zakatDue + ' ر.س' },
  ];
  return { columns, data, summaryData };
}

export function buildDetailedIncomeExportData(detailedIncome: any) {
  const columns = [
    { header: 'البند', key: 'item' },
    { header: 'المبلغ (ر.س)', key: 'amount' },
  ];
  const data = [
    { item: '=== الإيرادات ===', amount: '' },
    ...detailedIncome.revenue.items.map((i: any) => ({ item: `${i.code} - ${i.name}`, amount: String(i.amount) })),
    { item: 'إجمالي الإيرادات', amount: String(detailedIncome.revenue.total) },
    { item: '', amount: '' },
    { item: '=== تكلفة المبيعات ===', amount: '' },
    ...detailedIncome.costOfSales.items.map((i: any) => ({ item: `${i.code} - ${i.name}`, amount: `(${i.amount})` })),
    { item: 'إجمالي تكلفة المبيعات', amount: `(${detailedIncome.costOfSales.total})` },
    { item: '', amount: '' },
    { item: 'مجمل الربح', amount: String(detailedIncome.grossProfit) },
    { item: `هامش الربح الإجمالي`, amount: `${detailedIncome.stats.grossProfitMargin}%` },
    { item: '', amount: '' },
    { item: '=== المصروفات التشغيلية ===', amount: '' },
    ...detailedIncome.operatingExpenses.items.map((e: any) => ({ item: `${e.code} - ${e.name}`, amount: `(${e.amount})` })),
    { item: 'إجمالي المصروفات التشغيلية', amount: `(${detailedIncome.operatingExpenses.total})` },
    { item: '', amount: '' },
    { item: 'الربح التشغيلي', amount: String(detailedIncome.operatingIncome) },
    { item: '', amount: '' },
    { item: '=== صافي الربح ===', amount: '' },
    { item: 'صافي الربح', amount: String(detailedIncome.netIncomeBeforeZakat) },
    { item: 'هامش صافي الربح', amount: `${detailedIncome.stats.netProfitMargin}%` },
    { item: '', amount: '' },
    { item: detailedIncome.zakatNote, amount: '' },
  ];
  const summaryData = [
    { label: 'إجمالي الإيرادات', value: detailedIncome.revenue.total + ' ر.س' },
    { label: 'مجمل الربح', value: detailedIncome.grossProfit + ' ر.س' },
    { label: 'صافي الربح', value: detailedIncome.netIncomeBeforeZakat + ' ر.س' },
    { label: 'عدد المبيعات', value: detailedIncome.stats.totalSalesCount.toString() },
  ];
  return { columns, data, summaryData };
}
