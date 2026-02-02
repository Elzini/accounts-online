// مكون عرض قائمة التغيرات في حقوق الملكية - مطابق لتصدير مداد

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EquityChangesData } from '../types';
import { formatNumber, formatNumberWithSign } from '../utils/numberFormatting';

interface Props {
  data: EquityChangesData;
  reportDate: string;
  editMode?: boolean;
  onUpdate?: (data: EquityChangesData) => void;
}

export function EquityChangesView({ data, reportDate, editMode, onUpdate }: Props) {
  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="text-center space-y-1 print:space-y-0">
        <h2 className="text-xl font-bold">قائمة التغير في حقوق الملكية</h2>
        <p className="text-muted-foreground">للسنة المنتهية في {reportDate}</p>
        <p className="text-sm text-muted-foreground">(المبالغ بالريال السعودي ما لم يذكر غير ذلك)</p>
      </div>

      <Table className="border text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold">البيان</TableHead>
            <TableHead className="text-center font-bold">رأس المال</TableHead>
            <TableHead className="text-center font-bold">احتياطي نظامي</TableHead>
            <TableHead className="text-center font-bold">أرباح مبقاة (خسائر متراكمة)</TableHead>
            <TableHead className="text-center font-bold">مجموع حقوق الملكية</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.periods.map((period, periodIdx) => (
            <>
              {/* عنوان الفترة */}
              <TableRow key={`period-${periodIdx}`} className="bg-muted/30">
                <TableCell colSpan={5} className="font-semibold text-primary">{period.label}</TableCell>
              </TableRow>
              
              {/* بنود الفترة */}
              {period.rows.map((row, rowIdx) => {
                const isTotal = row.description.includes('أرصدة') && row.description.includes('نهاية');
                const isOpening = row.description.includes('بداية');
                
                return (
                  <TableRow key={`period-${periodIdx}-row-${rowIdx}`} className={isTotal ? 'font-bold bg-primary/10 border-t' : isOpening ? 'font-semibold' : ''}>
                    <TableCell className={isOpening || isTotal ? '' : 'pr-8'}>{row.description}</TableCell>
                    <TableCell className="text-center font-mono">{formatNumberWithSign(row.capital)}</TableCell>
                    <TableCell className="text-center font-mono">{formatNumberWithSign(row.statutoryReserve)}</TableCell>
                    <TableCell className="text-center font-mono">{formatNumberWithSign(row.retainedEarnings)}</TableCell>
                    <TableCell className="text-center font-mono">{formatNumberWithSign(row.total)}</TableCell>
                  </TableRow>
                );
              })}
            </>
          ))}

          {/* إذا لم توجد بيانات، عرض هيكل افتراضي */}
          {data.periods.length === 0 && (
            <>
              <TableRow className="bg-muted/30">
                <TableCell colSpan={5} className="font-semibold text-primary">السنة المنتهية في 31 ديسمبر 2024م</TableCell>
              </TableRow>
              <TableRow className="font-semibold">
                <TableCell>أرصدة حقوق الملكية في بداية الفترة</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pr-8">محول إلى (من) الاحتياطي النظامي</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pr-8">توزيعات أرباح مدفوعة</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pr-8">ربح (خسارة) الفترة</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
              </TableRow>
              <TableRow className="font-bold bg-primary/10 border-t">
                <TableCell>أرصدة حقوق الملكية في نهاية الفترة</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
                <TableCell className="text-center font-mono">-</TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>

      {/* التذييل */}
      <p className="text-sm text-muted-foreground text-center">
        الإيضاحات المرفقة على القوائم المالية جزء لا يتجزأ منها وتقرأ معها.
      </p>
    </div>
  );
}
