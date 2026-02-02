// مكون عرض قائمة الدخل الشامل - مطابق لتصدير مداد

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IncomeStatementData } from '../types';
import { formatNumber, formatNumberWithSign } from '../utils/numberFormatting';

interface Props {
  data: IncomeStatementData;
  reportDate: string;
  previousReportDate?: string;
  editMode?: boolean;
  onUpdate?: (data: IncomeStatementData) => void;
}

export function IncomeStatementView({ data, reportDate, previousReportDate, editMode, onUpdate }: Props) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousRevenue !== undefined && data.previousRevenue > 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="text-center space-y-1 print:space-y-0">
        <h2 className="text-xl font-bold">قائمة الدخل الشامل</h2>
        <p className="text-muted-foreground">للسنة المنتهية في {reportDate}</p>
        <p className="text-sm text-muted-foreground">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
      </div>

      <Table className="border text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold w-1/2">البند</TableHead>
            <TableHead className="text-center font-bold w-16">إيضاح</TableHead>
            <TableHead className="text-center font-bold">{currentYear}</TableHead>
            {hasPreviousData && <TableHead className="text-center font-bold">{previousYear}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* الإيرادات */}
          <TableRow>
            <TableCell className="font-semibold">الإيرادات</TableCell>
            <TableCell className="text-center text-muted-foreground">{data.revenueNote || '-'}</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.revenue)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousRevenue)}</TableCell>}
          </TableRow>

          {/* تكلفة الإيرادات */}
          <TableRow>
            <TableCell>تكلفة الإيرادات</TableCell>
            <TableCell className="text-center text-muted-foreground">{data.costOfRevenueNote || '15'}</TableCell>
            <TableCell className="text-center font-mono text-destructive">({formatNumber(data.costOfRevenue)})</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono text-destructive">({formatNumber(data.previousCostOfRevenue)})</TableCell>}
          </TableRow>

          {/* إجمالي الربح */}
          <TableRow className="font-semibold bg-muted/20 border-t">
            <TableCell>إجمالي الربح (الخسارة)</TableCell>
            <TableCell></TableCell>
            <TableCell className={`text-center font-mono ${data.grossProfit < 0 ? 'text-destructive' : ''}`}>
              {formatNumberWithSign(data.grossProfit)}
            </TableCell>
            {hasPreviousData && (
              <TableCell className={`text-center font-mono ${(data.previousGrossProfit || 0) < 0 ? 'text-destructive' : ''}`}>
                {formatNumberWithSign(data.previousGrossProfit)}
              </TableCell>
            )}
          </TableRow>

          {/* المصاريف العمومية والإدارية */}
          <TableRow>
            <TableCell>مصاريف عمومية وإدارية</TableCell>
            <TableCell className="text-center text-muted-foreground">{data.generalAndAdminExpensesNote || '16'}</TableCell>
            <TableCell className="text-center font-mono text-destructive">({formatNumber(data.generalAndAdminExpenses)})</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono text-destructive">({formatNumber(data.previousGeneralAndAdminExpenses)})</TableCell>}
          </TableRow>

          {/* ربح العمليات */}
          <TableRow className="font-semibold bg-muted/20 border-t">
            <TableCell>ربح (خسارة) العمليات</TableCell>
            <TableCell></TableCell>
            <TableCell className={`text-center font-mono ${data.operatingProfit < 0 ? 'text-destructive' : ''}`}>
              {formatNumberWithSign(data.operatingProfit)}
            </TableCell>
            {hasPreviousData && (
              <TableCell className={`text-center font-mono ${(data.previousOperatingProfit || 0) < 0 ? 'text-destructive' : ''}`}>
                {formatNumberWithSign(data.previousOperatingProfit)}
              </TableCell>
            )}
          </TableRow>

          {/* أعباء تمويل */}
          {data.financingCost > 0 && (
            <TableRow>
              <TableCell>أعباء تمويل</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-center font-mono text-destructive">({formatNumber(data.financingCost)})</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono text-destructive">({formatNumber(data.previousFinancingCost)})</TableCell>}
            </TableRow>
          )}

          {/* أرباح/خسائر من استبعاد الأصول */}
          {data.gainsLossesFromDisposals !== 0 && (
            <TableRow>
              <TableCell>أرباح (خسائر) من استبعاد العقارات والآلات والمعدات</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-center font-mono">{formatNumberWithSign(data.gainsLossesFromDisposals)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumberWithSign(data.previousGainsLossesFromDisposals)}</TableCell>}
            </TableRow>
          )}

          {/* الربح قبل الزكاة */}
          <TableRow className="font-semibold bg-muted/20 border-t">
            <TableCell>الربح (الخسارة) قبل الزكاة</TableCell>
            <TableCell></TableCell>
            <TableCell className={`text-center font-mono ${data.profitBeforeZakat < 0 ? 'text-destructive' : ''}`}>
              {formatNumberWithSign(data.profitBeforeZakat)}
            </TableCell>
            {hasPreviousData && (
              <TableCell className={`text-center font-mono ${(data.previousProfitBeforeZakat || 0) < 0 ? 'text-destructive' : ''}`}>
                {formatNumberWithSign(data.previousProfitBeforeZakat)}
              </TableCell>
            )}
          </TableRow>

          {/* الزكاة */}
          <TableRow>
            <TableCell>الزكاة</TableCell>
            <TableCell className="text-center text-muted-foreground">11</TableCell>
            <TableCell className="text-center font-mono text-destructive">({formatNumber(data.zakat)})</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono text-destructive">({formatNumber(data.previousZakat)})</TableCell>}
          </TableRow>

          {/* ربح/خسارة الفترة */}
          <TableRow className="font-bold bg-primary/10 border-t-2">
            <TableCell>ربح (خسارة) الفترة</TableCell>
            <TableCell></TableCell>
            <TableCell className={`text-center font-mono ${data.netProfit < 0 ? 'text-destructive' : ''}`}>
              {formatNumberWithSign(data.netProfit)}
            </TableCell>
            {hasPreviousData && (
              <TableCell className={`text-center font-mono ${(data.previousNetProfit || 0) < 0 ? 'text-destructive' : ''}`}>
                {formatNumberWithSign(data.previousNetProfit)}
              </TableCell>
            )}
          </TableRow>

          {/* الدخل الشامل الآخر */}
          <TableRow className="bg-muted/10">
            <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-semibold">الدخل الشامل الآخر</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="pr-8">دخل شامل آخر سيعاد تصنيفه إلى الدخل في الفترات اللاحقة:</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">-</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
          </TableRow>
          <TableRow>
            <TableCell className="pr-8">خسارة شاملة أخرى لن يعاد تصنيفها إلى الدخل في الفترات اللاحقة:</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">-</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
          </TableRow>

          {/* إجمالي الدخل الشامل */}
          <TableRow className="font-bold bg-primary/10 border-t-2">
            <TableCell>إجمالي الدخل الشامل</TableCell>
            <TableCell></TableCell>
            <TableCell className={`text-center font-mono ${data.totalComprehensiveIncome < 0 ? 'text-destructive' : ''}`}>
              {formatNumberWithSign(data.totalComprehensiveIncome || data.netProfit)}
            </TableCell>
            {hasPreviousData && (
              <TableCell className={`text-center font-mono ${(data.previousTotalComprehensiveIncome || 0) < 0 ? 'text-destructive' : ''}`}>
                {formatNumberWithSign(data.previousTotalComprehensiveIncome || data.previousNetProfit)}
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>

      {/* التذييل */}
      <p className="text-sm text-muted-foreground text-center">
        الإيضاحات المرفقة على القوائم المالية جزء لا يتجزأ منها وتقرأ معها.
      </p>
    </div>
  );
}
