// مكون عرض إيضاحات الزكاة - مطابق لتصدير مداد

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ZakatNote } from '../types';
import { formatNumber, formatNumberWithSign } from '../utils/numberFormatting';

interface Props {
  data: ZakatNote;
  reportDate: string;
  previousReportDate?: string;
  noteNumber?: number;
}

export function ZakatNoteView({ data, reportDate, previousReportDate, noteNumber = 11 }: Props) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousYear !== undefined;

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="space-y-1">
        <h3 className="text-lg font-bold">{noteNumber}- مخصص الزكاة</h3>
        <p className="text-sm text-muted-foreground">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
      </div>

      {/* أ- احتساب المخصص */}
      <div className="space-y-2">
        <h4 className="font-semibold">أ- احتساب المخصص</h4>
        <Table className="border text-sm">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold w-2/3">البند</TableHead>
              <TableHead className="text-center font-bold">{currentYear}</TableHead>
              {hasPreviousData && <TableHead className="text-center font-bold">{previousYear}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>الربح (الخسارة) قبل الزكاة</TableCell>
              <TableCell className="text-center font-mono">{formatNumberWithSign(data.profitBeforeZakat)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumberWithSign(data.previousYear?.profitBeforeZakat)}</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>تعديلات على صافي الدخل</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.adjustmentsOnNetIncome)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow className="font-semibold">
              <TableCell>صافي الربح المعدل</TableCell>
              <TableCell className="text-center font-mono">{formatNumberWithSign(data.adjustedNetProfit)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow className="bg-muted/20">
              <TableCell>الزكاة الشرعية طبقاً لصافي الربح المعدل</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.zakatOnAdjustedProfit)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousYear?.zakatOnAdjustedProfit)}</TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* الوعاء الزكوي */}
      <div className="space-y-2">
        <h4 className="font-semibold">الوعاء الزكوي</h4>
        <Table className="border text-sm">
          <TableBody>
            <TableRow>
              <TableCell className="w-2/3">رأس المال</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.capital)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>جاري الشركاء</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.partnersCurrentAccount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>احتياطي نظامي رصيد مدور</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.statutoryReserve)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>التزامات منافع موظفين محددة الموظفين مدورة</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.employeeBenefitsLiabilities)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow className="font-semibold border-t">
              <TableCell>المجموع</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.zakatBaseSubtotal)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* ينزل (الحسميات) */}
      <div className="space-y-2">
        <h4 className="font-semibold">ينزل</h4>
        <Table className="border text-sm">
          <TableBody>
            <TableRow>
              <TableCell className="w-2/3">العقارات والآلات والمعدات، صافي</TableCell>
              <TableCell className="text-center font-mono text-destructive">({formatNumber(data.fixedAssetsNet)})</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>موجودات غير ملموسة، صافي</TableCell>
              <TableCell className="text-center font-mono text-destructive">({formatNumber(data.intangibleAssetsNet)})</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            {data.other > 0 && (
              <TableRow>
                <TableCell>أخرى</TableCell>
                <TableCell className="text-center font-mono text-destructive">({formatNumber(data.other)})</TableCell>
                {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* وعاء الزكاة والمخصص */}
      <div className="space-y-2">
        <Table className="border text-sm">
          <TableBody>
            <TableRow className="font-semibold bg-muted/20">
              <TableCell className="w-2/3">وعاء الزكاة</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.zakatBase)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousYear?.zakatBase)}</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>مخصص الزكاة الشرعية طبقاً للوعاء</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.zakatOnBase)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow className="font-bold bg-primary/10 border-t">
              <TableCell>إجمالي مخصص الزكاة التقريبي</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.totalZakatProvision)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousYear?.totalZakatProvision)}</TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* ب- حركة مخصص الزكاة الشرعية */}
      <div className="space-y-2">
        <h4 className="font-semibold">ب- حركة مخصص الزكاة الشرعية</h4>
        <Table className="border text-sm">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold w-2/3">البيان</TableHead>
              <TableHead className="text-center font-bold">{currentYear}</TableHead>
              {hasPreviousData && <TableHead className="text-center font-bold">{previousYear}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>رصيد أول السنة</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.openingBalance)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>مخصص الزكاة المكون</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.provisionForYear)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow>
              <TableCell>المسدد خلال السنة</TableCell>
              <TableCell className="text-center font-mono text-destructive">({formatNumber(data.paidDuringYear)})</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">-</TableCell>}
            </TableRow>
            <TableRow className="font-bold bg-primary/10 border-t">
              <TableCell>الرصيد الختامي</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(data.closingBalance)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousYear?.closingBalance)}</TableCell>}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* الموقف الزكوي */}
      {data.zakatStatus && (
        <div className="space-y-2 p-4 bg-muted/20 rounded-lg">
          <h4 className="font-semibold">ج- الموقف الزكوي</h4>
          <p className="text-sm text-muted-foreground">{data.zakatStatus}</p>
        </div>
      )}
    </div>
  );
}
