// مكون عرض قائمة التدفق النقدي - مطابق لتصدير مداد

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CashFlowData } from '../types';
import { formatNumber, formatNumberWithSign } from '../utils/numberFormatting';

interface Props {
  data: CashFlowData;
  reportDate: string;
  previousReportDate?: string;
  editMode?: boolean;
  onUpdate?: (data: CashFlowData) => void;
}

export function CashFlowView({ data, reportDate, previousReportDate, editMode, onUpdate }: Props) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousYear !== undefined;

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="text-center space-y-1 print:space-y-0">
        <h2 className="text-xl font-bold">قائمة التدفق النقدي</h2>
        <p className="text-muted-foreground">للسنة المنتهية في {reportDate}</p>
        <p className="text-sm text-muted-foreground">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
      </div>

      <Table className="border text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold w-2/3">البند</TableHead>
            <TableHead className="text-center font-bold">{currentYear}</TableHead>
            {hasPreviousData && <TableHead className="text-center font-bold">{previousYear}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* التدفقات النقدية من الأنشطة التشغيلية */}
          <TableRow className="bg-muted/30">
            <TableCell colSpan={hasPreviousData ? 3 : 2} className="font-bold text-primary">التدفقات النقدية من الأنشطة التشغيلية</TableCell>
          </TableRow>
          
          <TableRow>
            <TableCell>ربح (خسارة) الفترة قبل الزكاة</TableCell>
            <TableCell className="text-center font-mono">{formatNumberWithSign(data.operatingActivities.profitBeforeZakat)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
          </TableRow>

          {/* التعديلات لتسوية الربح */}
          <TableRow className="bg-muted/10">
            <TableCell className="font-semibold">التعديلات لتسوية الربح (الخسارة)</TableCell>
            <TableCell></TableCell>
            {hasPreviousData && <TableCell></TableCell>}
          </TableRow>
          {data.operatingActivities.adjustmentsToReconcile.map((item, idx) => (
            <TableRow key={`adj-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumberWithSign(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
          ))}

          {/* التدفقات النقدية قبل التغيرات في رأس المال العامل */}
          <TableRow className="font-semibold border-t">
            <TableCell>التدفقات النقدية قبل التغيرات في رأس المال العامل</TableCell>
            <TableCell className="text-center font-mono">-</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
          </TableRow>

          {/* التعديلات على التغيرات في رأس المال العامل */}
          <TableRow className="bg-muted/10">
            <TableCell className="font-semibold">التعديلات على التغيرات في رأس المال العامل</TableCell>
            <TableCell></TableCell>
            {hasPreviousData && <TableCell></TableCell>}
          </TableRow>
          {data.operatingActivities.changesInWorkingCapital.map((item, idx) => (
            <TableRow key={`wc-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumberWithSign(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
          ))}

          {/* الزكاة ومنافع الموظفين */}
          {data.operatingActivities.zakatPaid > 0 && (
            <TableRow>
              <TableCell className="pr-8">زكاة مدفوعة</TableCell>
              <TableCell className="text-center font-mono text-destructive">({formatNumber(data.operatingActivities.zakatPaid)})</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
          )}
          {data.operatingActivities.employeeBenefitsPaid > 0 && (
            <TableRow>
              <TableCell className="pr-8">مخصصات منافع موظفين مدفوعة</TableCell>
              <TableCell className="text-center font-mono text-destructive">({formatNumber(data.operatingActivities.employeeBenefitsPaid)})</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
          )}

          {/* صافي التدفقات التشغيلية */}
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>صافي التدفقات النقدية للأنشطة التشغيلية</TableCell>
            <TableCell className="text-center font-mono">{formatNumberWithSign(data.operatingActivities.netOperatingCashFlow)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumberWithSign(data.previousYear?.netOperatingCashFlow)}</TableCell>}
          </TableRow>

          {/* التدفقات النقدية من الأنشطة الاستثمارية */}
          <TableRow className="bg-muted/30">
            <TableCell colSpan={hasPreviousData ? 3 : 2} className="font-bold text-primary">التدفقات النقدية للأنشطة الاستثمارية</TableCell>
          </TableRow>
          {data.investingActivities.map((item, idx) => (
            <TableRow key={`inv-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumberWithSign(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>صافي التدفقات النقدية للأنشطة الاستثمارية</TableCell>
            <TableCell className="text-center font-mono">{formatNumberWithSign(data.netInvestingCashFlow)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumberWithSign(data.previousYear?.netInvestingCashFlow)}</TableCell>}
          </TableRow>

          {/* التدفقات النقدية من الأنشطة التمويلية */}
          <TableRow className="bg-muted/30">
            <TableCell colSpan={hasPreviousData ? 3 : 2} className="font-bold text-primary">التدفقات النقدية للأنشطة التمويلية</TableCell>
          </TableRow>
          {data.financingActivities.map((item, idx) => (
            <TableRow key={`fin-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumberWithSign(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>صافي التدفقات النقدية للأنشطة التمويلية</TableCell>
            <TableCell className="text-center font-mono">{formatNumberWithSign(data.netFinancingCashFlow)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumberWithSign(data.previousYear?.netFinancingCashFlow)}</TableCell>}
          </TableRow>

          {/* صافي التغير في النقد */}
          <TableRow className="font-bold border-t-2">
            <TableCell>صافي الزيادة (النقص) في النقد ومعادلاته</TableCell>
            <TableCell className="text-center font-mono">{formatNumberWithSign(data.netChangeInCash)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumberWithSign(data.previousYear?.netChangeInCash)}</TableCell>}
          </TableRow>
          <TableRow>
            <TableCell>النقد ومعادلاته في بداية الفترة</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.openingCashBalance)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
          </TableRow>
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>النقد ومعادلاته في نهاية الفترة</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.closingCashBalance)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousYear?.closingCashBalance)}</TableCell>}
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
