import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download, TrendingUp, TrendingDown, Building2, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';

// البيانات المستخرجة من ميزان المراجعة
const trialBalanceData = {
  companyName: 'شركة اشبال النمار للسيارات',
  vatNumber: '312876888500003',
  period: {
    from: '2025-01-01',
    to: '2025-12-31',
  },
  // الأصول الثابتة
  fixedAssets: {
    furniture: 13782.61,
    equipment: 500.00,
  },
  // الأصول المتداولة
  currentAssets: {
    banks: 50.00,
    employeeCustody: 901.00,
    prepaidRent: 229166.67,
    inputVat: 282324.23,
    outputVat: 214473.92,
    relatedParties: 250050.00, // دائن - سيظهر في الخصوم
  },
  // الخصوم
  liabilities: {
    accruedSalaries: 6050.00,
    relatedPartiesPayable: 250050.00,
  },
  // حقوق الملكية
  equity: {
    ownerDrawings: 428410.66,
  },
  // الإيرادات
  revenue: {
    sales: 1522826.08,
  },
  // المصروفات
  expenses: {
    salaries: 6050.00,
    officeSupplies: 2391.30,
    rent: 20833.33,
    miscellaneous: 4461.69,
    hospitality: 189.22,
    cleaning: 1793.65,
    purchases: 1859366.96,
  },
};

export function TrialBalanceAnalysisPage() {
  const [isExporting, setIsExporting] = useState(false);

  // حسابات قائمة الدخل
  const totalSales = trialBalanceData.revenue.sales;
  const costOfSales = trialBalanceData.expenses.purchases;
  const grossProfit = totalSales - costOfSales;
  
  const operatingExpenses = 
    trialBalanceData.expenses.salaries +
    trialBalanceData.expenses.officeSupplies +
    trialBalanceData.expenses.rent +
    trialBalanceData.expenses.miscellaneous +
    trialBalanceData.expenses.hospitality +
    trialBalanceData.expenses.cleaning;
  
  const netIncome = grossProfit - operatingExpenses;

  // حسابات الميزانية
  const totalFixedAssets = trialBalanceData.fixedAssets.furniture + trialBalanceData.fixedAssets.equipment;
  const vatReceivable = trialBalanceData.currentAssets.inputVat - trialBalanceData.currentAssets.outputVat;
  const totalCurrentAssets = 
    trialBalanceData.currentAssets.banks +
    trialBalanceData.currentAssets.employeeCustody +
    trialBalanceData.currentAssets.prepaidRent +
    Math.max(0, vatReceivable);
  const totalAssets = totalFixedAssets + totalCurrentAssets;

  const totalCurrentLiabilities = 
    trialBalanceData.liabilities.accruedSalaries +
    trialBalanceData.liabilities.relatedPartiesPayable;
  
  const totalEquity = trialBalanceData.equity.ownerDrawings + netIncome;
  const totalLiabilitiesAndEquity = totalCurrentLiabilities + totalEquity;

  // حساب الزكاة
  const zakatBase = trialBalanceData.equity.ownerDrawings + netIncome - totalFixedAssets - (trialBalanceData.currentAssets.prepaidRent * 11/12);
  const zakatDue = zakatBase > 0 ? zakatBase * 0.025 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const exportToExcel = () => {
    setIsExporting(true);

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: قائمة الدخل
      const incomeStatementData = [
        ['شركة اشبال النمار للسيارات'],
        ['قائمة الدخل'],
        [`للسنة المنتهية في 31/12/2025`],
        [''],
        ['البند', 'المبلغ (ر.س)'],
        ['إيرادات المبيعات', totalSales],
        ['(-) تكلفة المبيعات (المشتريات)', -costOfSales],
        ['مجمل الربح / (الخسارة)', grossProfit],
        [''],
        ['المصاريف التشغيلية:'],
        ['الرواتب', trialBalanceData.expenses.salaries],
        ['الإيجار', trialBalanceData.expenses.rent],
        ['لوازم مكتبية', trialBalanceData.expenses.officeSupplies],
        ['متنوعة', trialBalanceData.expenses.miscellaneous],
        ['ضيافة', trialBalanceData.expenses.hospitality],
        ['نظافة', trialBalanceData.expenses.cleaning],
        ['إجمالي المصاريف التشغيلية', -operatingExpenses],
        [''],
        ['صافي الربح / (الخسارة)', netIncome],
      ];
      const wsIncome = XLSX.utils.aoa_to_sheet(incomeStatementData);
      wsIncome['!cols'] = [{ wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsIncome, 'قائمة الدخل');

      // Sheet 2: قائمة المركز المالي
      const balanceSheetData = [
        ['شركة اشبال النمار للسيارات'],
        ['قائمة المركز المالي (الميزانية العمومية)'],
        ['في 31/12/2025'],
        [''],
        ['الأصول', 'المبلغ (ر.س)'],
        ['الأصول الثابتة:'],
        ['الأثاث', trialBalanceData.fixedAssets.furniture],
        ['أجهزة وآلات', trialBalanceData.fixedAssets.equipment],
        ['إجمالي الأصول الثابتة', totalFixedAssets],
        [''],
        ['الأصول المتداولة:'],
        ['البنوك (مصرف الراجحي)', trialBalanceData.currentAssets.banks],
        ['عهدة الموظفين', trialBalanceData.currentAssets.employeeCustody],
        ['إيجار مدفوع مقدماً', trialBalanceData.currentAssets.prepaidRent],
        ['ضريبة القيمة المضافة المستردة', Math.max(0, vatReceivable)],
        ['إجمالي الأصول المتداولة', totalCurrentAssets],
        [''],
        ['إجمالي الأصول', totalAssets],
        [''],
        ['الخصوم وحقوق الملكية', 'المبلغ (ر.س)'],
        ['الخصوم المتداولة:'],
        ['رواتب مستحقة', trialBalanceData.liabilities.accruedSalaries],
        ['أطراف ذات علاقة (دائن)', trialBalanceData.liabilities.relatedPartiesPayable],
        ['إجمالي الخصوم المتداولة', totalCurrentLiabilities],
        [''],
        ['حقوق الملكية:'],
        ['جاري المالك', trialBalanceData.equity.ownerDrawings],
        ['صافي الربح / (الخسارة) للفترة', netIncome],
        ['إجمالي حقوق الملكية', totalEquity],
        [''],
        ['إجمالي الخصوم وحقوق الملكية', totalLiabilitiesAndEquity],
      ];
      const wsBalance = XLSX.utils.aoa_to_sheet(balanceSheetData);
      wsBalance['!cols'] = [{ wch: 40 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsBalance, 'المركز المالي');

      // Sheet 3: حساب الزكاة
      const zakatData = [
        ['شركة اشبال النمار للسيارات'],
        ['حساب الزكاة الشرعية'],
        ['للسنة المنتهية في 31/12/2025'],
        [''],
        ['البند', 'المبلغ (ر.س)'],
        ['الوعاء الزكوي:'],
        ['(+) رأس المال المستثمر (جاري المالك)', trialBalanceData.equity.ownerDrawings],
        ['(+/-) صافي الربح / الخسارة', netIncome],
        ['إجمالي مصادر التمويل', trialBalanceData.equity.ownerDrawings + netIncome],
        [''],
        ['الحسميات:'],
        ['(-) الأصول الثابتة', -totalFixedAssets],
        ['(-) الإيجار المدفوع مقدماً (طويل الأجل)', -(trialBalanceData.currentAssets.prepaidRent * 11/12)],
        [''],
        ['الوعاء الزكوي المعدل', zakatBase],
        [''],
        ['نسبة الزكاة', '2.5%'],
        ['الزكاة المستحقة', zakatDue],
        [''],
        ['ملاحظة:', zakatBase <= 0 ? 'الوعاء الزكوي سالب - لا تستحق زكاة' : ''],
      ];
      const wsZakat = XLSX.utils.aoa_to_sheet(zakatData);
      wsZakat['!cols'] = [{ wch: 45 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsZakat, 'حساب الزكاة');

      // Sheet 4: ملخص تحليلي
      const summaryData = [
        ['شركة اشبال النمار للسيارات'],
        ['ملخص تحليلي'],
        ['للسنة المنتهية في 31/12/2025'],
        [''],
        ['المؤشر', 'القيمة', 'الملاحظة'],
        ['إجمالي المبيعات', totalSales, ''],
        ['تكلفة المبيعات', costOfSales, ''],
        ['هامش الربح الإجمالي', grossProfit, grossProfit < 0 ? 'خسارة إجمالية' : 'ربح إجمالي'],
        ['نسبة هامش الربح الإجمالي', `${((grossProfit / totalSales) * 100).toFixed(2)}%`, ''],
        [''],
        ['المصاريف التشغيلية', operatingExpenses, ''],
        ['صافي الربح / الخسارة', netIncome, netIncome < 0 ? '⚠️ خسارة صافية' : '✅ ربح صافي'],
        ['نسبة صافي الربح', `${((netIncome / totalSales) * 100).toFixed(2)}%`, ''],
        [''],
        ['إجمالي الأصول', totalAssets, ''],
        ['إجمالي الخصوم', totalCurrentLiabilities, ''],
        ['حقوق الملكية', totalEquity, ''],
        [''],
        ['ضريبة القيمة المضافة المستردة', vatReceivable, vatReceivable > 0 ? 'مستحقة للشركة' : 'مستحقة على الشركة'],
        ['الوعاء الزكوي', zakatBase, zakatBase <= 0 ? 'لا تستحق زكاة' : ''],
        ['الزكاة المستحقة', zakatDue, ''],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'ملخص تحليلي');

      // تحميل الملف
      XLSX.writeFile(wb, 'القوائم_المالية_2025.xlsx');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{trialBalanceData.companyName}</h1>
          <p className="text-muted-foreground">القوائم المالية للسنة المنتهية في 31/12/2025</p>
          <p className="text-sm text-muted-foreground">الرقم الضريبي: {trialBalanceData.vatNumber}</p>
        </div>
        <Button onClick={exportToExcel} disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalSales)}</p>
              </div>
              <FileSpreadsheet className="w-8 h-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">صافي الربح/الخسارة</p>
                <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(netIncome)}
                </p>
              </div>
              {netIncome >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-600/20" />
              ) : (
                <TrendingDown className="w-8 h-8 text-destructive/20" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAssets)}</p>
              </div>
              <Building2 className="w-8 h-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الزكاة المستحقة</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(zakatDue)}</p>
              </div>
              <Calculator className="w-8 h-8 text-orange-600/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            قائمة الدخل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2 font-semibold">البند</th>
                  <th className="text-left py-2 font-semibold">المبلغ (ر.س)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">إيرادات المبيعات</td>
                  <td className="py-2 text-left font-medium">{formatCurrency(totalSales)}</td>
                </tr>
                <tr>
                  <td className="py-2">(-) تكلفة المبيعات (المشتريات)</td>
                  <td className="py-2 text-left text-destructive">({formatCurrency(costOfSales)})</td>
                </tr>
                <tr className="border-t bg-muted/50">
                  <td className="py-2 font-semibold">مجمل الربح / (الخسارة)</td>
                  <td className={`py-2 text-left font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(grossProfit)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pt-4 font-semibold" colSpan={2}>المصاريف التشغيلية:</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">- الرواتب</td>
                  <td className="py-1 text-left">{formatCurrency(trialBalanceData.expenses.salaries)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">- الإيجار</td>
                  <td className="py-1 text-left">{formatCurrency(trialBalanceData.expenses.rent)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">- لوازم مكتبية</td>
                  <td className="py-1 text-left">{formatCurrency(trialBalanceData.expenses.officeSupplies)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">- متنوعة</td>
                  <td className="py-1 text-left">{formatCurrency(trialBalanceData.expenses.miscellaneous)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">- ضيافة</td>
                  <td className="py-1 text-left">{formatCurrency(trialBalanceData.expenses.hospitality)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">- نظافة</td>
                  <td className="py-1 text-left">{formatCurrency(trialBalanceData.expenses.cleaning)}</td>
                </tr>
                <tr className="border-t">
                  <td className="py-2">إجمالي المصاريف التشغيلية</td>
                  <td className="py-2 text-left text-destructive">({formatCurrency(operatingExpenses)})</td>
                </tr>
                <tr className="border-t-2 bg-primary/5">
                  <td className="py-3 font-bold text-lg">صافي الربح / (الخسارة)</td>
                  <td className={`py-3 text-left font-bold text-lg ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(netIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            قائمة المركز المالي (الميزانية العمومية)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الأصول */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary">الأصول</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 font-semibold" colSpan={2}>الأصول الثابتة:</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- الأثاث</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.fixedAssets.furniture)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- أجهزة وآلات</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.fixedAssets.equipment)}</td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي الأصول الثابتة</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(totalFixedAssets)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pt-4 font-semibold" colSpan={2}>الأصول المتداولة:</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- البنوك</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.currentAssets.banks)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- عهدة الموظفين</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.currentAssets.employeeCustody)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- إيجار مدفوع مقدماً</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.currentAssets.prepaidRent)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- ضريبة القيمة المضافة المستردة</td>
                    <td className="py-1 text-left">{formatCurrency(Math.max(0, vatReceivable))}</td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي الأصول المتداولة</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(totalCurrentAssets)}</td>
                  </tr>
                  <tr className="border-t-2 bg-primary/10">
                    <td className="py-3 font-bold">إجمالي الأصول</td>
                    <td className="py-3 text-left font-bold">{formatCurrency(totalAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* الخصوم وحقوق الملكية */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-primary">الخصوم وحقوق الملكية</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-2 font-semibold" colSpan={2}>الخصوم المتداولة:</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- رواتب مستحقة</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.liabilities.accruedSalaries)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- أطراف ذات علاقة (دائن)</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.liabilities.relatedPartiesPayable)}</td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي الخصوم المتداولة</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(totalCurrentLiabilities)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pt-4 font-semibold" colSpan={2}>حقوق الملكية:</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- جاري المالك</td>
                    <td className="py-1 text-left">{formatCurrency(trialBalanceData.equity.ownerDrawings)}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4">- صافي الربح / (الخسارة)</td>
                    <td className={`py-1 text-left ${netIncome >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {formatCurrency(netIncome)}
                    </td>
                  </tr>
                  <tr className="border-t bg-muted/30">
                    <td className="py-2">إجمالي حقوق الملكية</td>
                    <td className="py-2 text-left font-medium">{formatCurrency(totalEquity)}</td>
                  </tr>
                  <tr className="border-t-2 bg-primary/10">
                    <td className="py-3 font-bold">إجمالي الخصوم وحقوق الملكية</td>
                    <td className="py-3 text-left font-bold">{formatCurrency(totalLiabilitiesAndEquity)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Zakat Calculation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            حساب الزكاة الشرعية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm max-w-2xl">
              <tbody>
                <tr>
                  <td className="py-2 font-semibold" colSpan={2}>الوعاء الزكوي:</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">(+) رأس المال المستثمر (جاري المالك)</td>
                  <td className="py-1 text-left">{formatCurrency(trialBalanceData.equity.ownerDrawings)}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">(+/-) صافي الربح / الخسارة</td>
                  <td className={`py-1 text-left ${netIncome >= 0 ? '' : 'text-destructive'}`}>
                    {formatCurrency(netIncome)}
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="py-2">إجمالي مصادر التمويل</td>
                  <td className="py-2 text-left font-medium">
                    {formatCurrency(trialBalanceData.equity.ownerDrawings + netIncome)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pt-4 font-semibold" colSpan={2}>الحسميات:</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">(-) الأصول الثابتة</td>
                  <td className="py-1 text-left text-destructive">({formatCurrency(totalFixedAssets)})</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">(-) الإيجار المدفوع مقدماً (طويل الأجل)</td>
                  <td className="py-1 text-left text-destructive">
                    ({formatCurrency(trialBalanceData.currentAssets.prepaidRent * 11/12)})
                  </td>
                </tr>
                <tr className="border-t bg-muted/50">
                  <td className="py-2 font-semibold">الوعاء الزكوي المعدل</td>
                  <td className={`py-2 text-left font-bold ${zakatBase >= 0 ? '' : 'text-destructive'}`}>
                    {formatCurrency(zakatBase)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2">نسبة الزكاة</td>
                  <td className="py-2 text-left">2.5%</td>
                </tr>
                <tr className="border-t-2 bg-accent">
                  <td className="py-3 font-bold text-lg">الزكاة المستحقة</td>
                  <td className="py-3 text-left font-bold text-lg text-primary">
                    {formatCurrency(zakatDue)}
                  </td>
                </tr>
              </tbody>
            </table>
            {zakatBase <= 0 && (
              <div className="mt-4 p-4 bg-accent rounded-lg border border-border">
                <p className="text-foreground font-medium">
                  ⚠️ ملاحظة: الوعاء الزكوي سالب بسبب الخسارة الكبيرة، وبالتالي لا تستحق زكاة على هذه الفترة.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
