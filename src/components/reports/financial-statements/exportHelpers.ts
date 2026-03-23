/**
 * Financial Statements - Export Helpers
 * Functions to export each statement type to print/excel/pdf.
 */

import { FinancialData } from './types';

type ExportType = 'print' | 'excel' | 'pdf';

interface ExportDeps {
  printReport: (opts: any) => void;
  exportToExcel: (opts: any) => void;
  exportToPdf: (opts: any) => void;
  formatNumber: (num: number) => string;
}

export function createExportFunctions(data: FinancialData, deps: ExportDeps) {
  const { printReport, exportToExcel, exportToPdf, formatNumber } = deps;

  const dispatch = (type: ExportType, opts: { title: string; subtitle?: string; columns: any[]; data: any[]; fileName?: string; summaryCards?: any[] }) => {
    if (type === 'print') printReport({ title: opts.title, subtitle: opts.subtitle, columns: opts.columns, data: opts.data, summaryCards: opts.summaryCards });
    else if (type === 'excel') exportToExcel({ title: opts.title, columns: opts.columns, data: opts.data, fileName: opts.fileName, summaryData: opts.summaryCards?.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title: opts.title, subtitle: opts.subtitle, columns: opts.columns, data: opts.data, fileName: opts.fileName, summaryCards: opts.summaryCards });
  };

  const exportBalanceSheet = (type: ExportType) => {
    const columns = [{ header: 'البند', key: 'item' }, { header: data.period.to ? data.period.to.substring(0, 4) + 'م' : '2024م', key: 'current' }];
    const tableData = [
      { item: '=== الموجودات ===', current: '' },
      { item: 'الموجودات المتداولة', current: '' },
      ...data.balanceSheet.currentAssets.map(a => ({ item: a.name, current: String(a.amount) })),
      { item: 'إجمالي الموجودات المتداولة', current: String(data.balanceSheet.currentAssets.reduce((s, a) => s + a.amount, 0)) },
      { item: 'الموجودات الغير متداولة', current: '' },
      ...data.balanceSheet.fixedAssets.map(a => ({ item: a.name, current: String(a.amount) })),
      { item: 'إجمالي الموجودات الغير متداولة', current: String(data.balanceSheet.fixedAssets.reduce((s, a) => s + a.amount, 0)) },
      { item: 'مجموع الموجودات', current: String(data.balanceSheet.totalAssets) },
      { item: '', current: '' },
      { item: '=== المطلوبات وحقوق الملكية ===', current: '' },
      { item: 'المطلوبات المتداولة', current: '' },
      ...data.balanceSheet.currentLiabilities.map(a => ({ item: a.name, current: String(a.amount) })),
      { item: 'إجمالي المطلوبات المتداولة', current: String(data.balanceSheet.currentLiabilities.reduce((s, a) => s + a.amount, 0)) },
      { item: 'مجموع المطلوبات', current: String(data.balanceSheet.totalLiabilities) },
      { item: 'حقوق الملكية', current: '' },
      ...data.balanceSheet.equity.map(a => ({ item: a.name, current: String(a.amount) })),
      { item: 'مجموع حقوق الملكية', current: String(data.balanceSheet.totalEquity) },
      { item: 'مجموع المطلوبات وحقوق الملكية', current: String(data.balanceSheet.totalLiabilities + data.balanceSheet.totalEquity) },
    ];
    const summaryCards = [
      { label: 'إجمالي الموجودات', value: data.balanceSheet.totalAssets + ' ر.س' },
      { label: 'إجمالي المطلوبات', value: data.balanceSheet.totalLiabilities + ' ر.س' },
      { label: 'حقوق الملكية', value: data.balanceSheet.totalEquity + ' ر.س' },
    ];
    dispatch(type, { title: 'قائمة المركز المالي', subtitle: data.period.to ? `كما في ${data.period.to}` : undefined, columns, data: tableData, fileName: 'balance-sheet', summaryCards });
  };

  const exportIncomeStatement = (type: ExportType) => {
    const columns = [{ header: 'البند', key: 'item' }, { header: 'المبلغ (ر.س)', key: 'amount' }];
    const tableData = [
      { item: 'الإيرادات', amount: String(data.incomeStatement.revenue) },
      { item: 'تكلفة الإيرادات', amount: `(${data.incomeStatement.costOfRevenue})` },
      { item: 'إجمالي الربح', amount: String(data.incomeStatement.grossProfit) },
      { item: '', amount: '' },
      { item: 'مصاريف عمومية وإدارية', amount: `(${data.incomeStatement.totalOperatingExpenses})` },
      ...data.incomeStatement.operatingExpenses.map(e => ({ item: `   - ${e.name}`, amount: `(${e.amount})` })),
      { item: 'ربح العمليات', amount: String(data.incomeStatement.operatingProfit) },
      { item: 'الربح قبل الزكاة', amount: String(data.incomeStatement.profitBeforeZakat) },
      { item: 'الزكاة', amount: `(${data.incomeStatement.zakat})` },
      { item: 'صافي الربح', amount: String(data.incomeStatement.netProfit) },
    ];
    const summaryCards = [
      { label: 'الإيرادات', value: data.incomeStatement.revenue + ' ر.س' },
      { label: 'إجمالي الربح', value: data.incomeStatement.grossProfit + ' ر.س' },
      { label: 'صافي الربح', value: data.incomeStatement.netProfit + ' ر.س' },
    ];
    const period = data.period.from && data.period.to ? `للسنة المنتهية في ${data.period.to}` : undefined;
    dispatch(type, { title: 'قائمة الدخل الشامل', subtitle: period, columns, data: tableData, fileName: 'income-statement', summaryCards });
  };

  const exportEquityChanges = (type: ExportType) => {
    const columns = [
      { header: 'البيان', key: 'description' }, { header: 'رأس المال', key: 'capital' },
      { header: 'احتياطي نظامي', key: 'reserves' }, { header: 'أرباح مبقاة', key: 'retainedEarnings' },
      { header: 'الإجمالي', key: 'total' },
    ];
    const tableData = data.equityChanges.items.map(item => ({
      description: item.description, capital: item.capital.toLocaleString(),
      reserves: item.reserves.toLocaleString(), retainedEarnings: item.retainedEarnings.toLocaleString(),
      total: item.total.toLocaleString(),
    }));
    const period = data.period.from && data.period.to ? `للسنة المنتهية في ${data.period.to}` : undefined;
    dispatch(type, { title: 'قائمة التغير في حقوق الملكية', subtitle: period, columns, data: tableData, fileName: 'equity-changes' });
  };

  const exportCashFlow = (type: ExportType) => {
    const columns = [{ header: 'البند', key: 'item' }, { header: 'المبلغ (ر.س)', key: 'amount' }];
    const tableData = [
      { item: '=== التدفقات النقدية من الأنشطة التشغيلية ===', amount: '' },
      ...data.cashFlow.operating.map(o => ({ item: o.name, amount: o.amount.toLocaleString() })),
      { item: 'صافي التدفقات التشغيلية', amount: data.cashFlow.totalOperating.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== التدفقات النقدية من الأنشطة الاستثمارية ===', amount: '' },
      ...data.cashFlow.investing.map(i => ({ item: i.name, amount: i.amount.toLocaleString() })),
      { item: 'صافي التدفقات الاستثمارية', amount: data.cashFlow.totalInvesting.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== التدفقات النقدية من الأنشطة التمويلية ===', amount: '' },
      ...data.cashFlow.financing.map(f => ({ item: f.name, amount: f.amount.toLocaleString() })),
      { item: 'صافي التدفقات التمويلية', amount: data.cashFlow.totalFinancing.toLocaleString() },
      { item: '', amount: '' },
      { item: 'صافي التغير في النقد', amount: data.cashFlow.netChange.toLocaleString() },
      { item: 'النقد في بداية الفترة', amount: data.cashFlow.openingCash.toLocaleString() },
      { item: 'النقد في نهاية الفترة', amount: data.cashFlow.closingCash.toLocaleString() },
    ];
    const period = data.period.from && data.period.to ? `للسنة المنتهية في ${data.period.to}` : undefined;
    dispatch(type, { title: 'قائمة التدفق النقدي', subtitle: period, columns, data: tableData, fileName: 'cash-flow' });
  };

  const exportZakatCalculation = (type: ExportType) => {
    const columns = [{ header: 'البند', key: 'item' }, { header: 'المبلغ (ر.س)', key: 'amount' }];
    const zk = data.zakatCalculation;
    const tableData = [
      { item: '=== احتساب المخصص ===', amount: '' },
      { item: 'الربح (الخسارة) قبل الزكاة', amount: formatNumber(zk.profitBeforeZakat) },
      { item: 'تعديلات على صافي الدخل', amount: formatNumber(zk.adjustmentsOnNetIncome) },
      { item: 'صافي الربح المعدل', amount: formatNumber(zk.adjustedNetProfit) },
      { item: 'الزكاة الشرعية طبقاً لصافي الربح المعدل', amount: formatNumber(zk.zakatOnAdjustedProfit) },
      { item: '', amount: '' },
      { item: '=== الوعاء الزكوي ===', amount: '' },
      { item: 'رأس المال', amount: formatNumber(zk.capital) },
      { item: 'جاري الشركاء', amount: formatNumber(zk.partnersCurrentAccount) },
      { item: 'احتياطي نظامي مدور', amount: formatNumber(zk.statutoryReserve) },
      { item: 'التزامات منافع موظفين مدورة', amount: formatNumber(zk.employeeBenefitsLiabilities) },
      { item: 'المجموع', amount: formatNumber(zk.zakatBaseTotal) },
      { item: '', amount: '' },
      { item: '=== ينزل ===', amount: '' },
      { item: 'العقارات والآلات والمعدات، صافي', amount: `(${formatNumber(zk.fixedAssets)})` },
      { item: 'موجودات غير ملموسة، صافي', amount: `(${formatNumber(zk.intangibleAssets)})` },
      { item: '', amount: '' },
      { item: 'وعاء الزكاة', amount: formatNumber(zk.zakatBase) },
      { item: 'مخصص الزكاة الشرعية طبقاً للوعاء', amount: formatNumber(zk.zakatOnBase) },
      { item: 'إجمالي مخصص الزكاة التقريبي', amount: formatNumber(zk.totalZakat) },
      { item: '', amount: '' },
      { item: '=== حركة مخصص الزكاة ===', amount: '' },
      { item: 'رصيد أول السنة', amount: formatNumber(zk.openingBalance) },
      { item: 'مخصص الزكاة المكون', amount: formatNumber(zk.provisionAdded) },
      { item: 'المسدد خلال السنة', amount: `(${formatNumber(zk.paidDuringYear)})` },
      { item: 'الرصيد الختامي', amount: formatNumber(zk.closingBalance) },
    ];
    const summaryCards = [
      { label: 'الربح قبل الزكاة', value: formatNumber(zk.profitBeforeZakat) + ' ر.س' },
      { label: 'الوعاء الزكوي', value: formatNumber(zk.zakatBase) + ' ر.س' },
      { label: 'إجمالي الزكاة', value: formatNumber(zk.totalZakat) + ' ر.س' },
    ];
    const period = data.period.from && data.period.to ? `للسنة المنتهية في ${data.period.to}` : undefined;
    dispatch(type, { title: 'مخصص الزكاة', subtitle: period, columns, data: tableData, fileName: 'zakat-calculation', summaryCards });
  };

  return { exportBalanceSheet, exportIncomeStatement, exportEquityChanges, exportCashFlow, exportZakatCalculation };
}
