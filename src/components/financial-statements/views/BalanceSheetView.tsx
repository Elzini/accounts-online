// مكون عرض قائمة المركز المالي - مطابق لتصدير مداد

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BalanceSheetData } from '../types';
import { formatNumber } from '../utils/numberFormatting';

interface Props {
  data: BalanceSheetData;
  reportDate: string;
  previousReportDate?: string;
  editMode?: boolean;
  onUpdate?: (data: BalanceSheetData) => void;
}

export function BalanceSheetView({ data, reportDate, previousReportDate, editMode, onUpdate }: Props) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousTotalAssets !== undefined && data.previousTotalAssets > 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* العنوان */}
      <div className="text-center space-y-1 print:space-y-0">
        <h2 className="text-xl font-bold">قائمة المركز المالي</h2>
        <p className="text-muted-foreground">كما في {reportDate}</p>
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
          {/* الموجودات */}
          <TableRow className="bg-muted/30">
            <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-bold text-primary">الموجودات</TableCell>
          </TableRow>

          {/* الموجودات المتداولة */}
          <TableRow className="bg-muted/20">
            <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-semibold">الموجودات المتداولة</TableCell>
          </TableRow>
          {data.currentAssets.map((item, idx) => (
            <TableRow key={`ca-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center text-muted-foreground">{item.note || '-'}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-semibold border-t-2">
            <TableCell className="pr-4">إجمالي الموجودات المتداولة</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalCurrentAssets)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalCurrentAssets)}</TableCell>}
          </TableRow>

          {/* الموجودات الغير متداولة */}
          <TableRow className="bg-muted/20">
            <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-semibold">الموجودات الغير متداولة</TableCell>
          </TableRow>
          {data.nonCurrentAssets.map((item, idx) => (
            <TableRow key={`nca-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center text-muted-foreground">{item.note || '-'}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-semibold border-t">
            <TableCell className="pr-4">مجموع الموجودات الغير متداولة</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalNonCurrentAssets)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalNonCurrentAssets)}</TableCell>}
          </TableRow>

          {/* مجموع الموجودات */}
          <TableRow className="font-bold bg-primary/10 border-t-2 border-b-2">
            <TableCell>مجموع الموجودات</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalAssets)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalAssets)}</TableCell>}
          </TableRow>

          {/* المطلوبات وحقوق الملكية */}
          <TableRow className="bg-muted/30">
            <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-bold text-primary">المطلوبات وحقوق الملكية</TableCell>
          </TableRow>

          {/* المطلوبات المتداولة */}
          <TableRow className="bg-muted/20">
            <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-semibold">المطلوبات المتداولة</TableCell>
          </TableRow>
          {data.currentLiabilities.map((item, idx) => (
            <TableRow key={`cl-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center text-muted-foreground">{item.note || '-'}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-semibold border-t">
            <TableCell className="pr-4">مجموع المطلوبات المتداولة</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalCurrentLiabilities)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalCurrentLiabilities)}</TableCell>}
          </TableRow>

          {/* المطلوبات الغير متداولة */}
          {data.nonCurrentLiabilities.length > 0 && (
            <>
              <TableRow className="bg-muted/20">
                <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-semibold">المطلوبات الغير متداولة</TableCell>
              </TableRow>
              {data.nonCurrentLiabilities.map((item, idx) => (
                <TableRow key={`ncl-${idx}`}>
                  <TableCell className="pr-8">{item.name}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{item.note || '-'}</TableCell>
                  <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
                  {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
                </TableRow>
              ))}
              <TableRow className="font-semibold border-t">
                <TableCell className="pr-4">مجموع المطلوبات الغير متداولة</TableCell>
                <TableCell></TableCell>
                <TableCell className="text-center font-mono">{formatNumber(data.totalNonCurrentLiabilities)}</TableCell>
                {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalNonCurrentLiabilities)}</TableCell>}
              </TableRow>
            </>
          )}

          {/* مجموع المطلوبات */}
          <TableRow className="font-semibold border-t">
            <TableCell>مجموع المطلوبات</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalLiabilities)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalLiabilities)}</TableCell>}
          </TableRow>

          {/* حقوق الملكية */}
          <TableRow className="bg-muted/20">
            <TableCell colSpan={hasPreviousData ? 4 : 3} className="font-semibold">حقوق الملكية</TableCell>
          </TableRow>
          {data.equity.map((item, idx) => (
            <TableRow key={`eq-${idx}`}>
              <TableCell className="pr-8">{item.name}</TableCell>
              <TableCell className="text-center text-muted-foreground">{item.note || '-'}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-semibold border-t">
            <TableCell className="pr-4">مجموع حقوق الملكية</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalEquity)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalEquity)}</TableCell>}
          </TableRow>

          {/* مجموع المطلوبات وحقوق الملكية */}
          <TableRow className="font-bold bg-primary/10 border-t-2">
            <TableCell>مجموع المطلوبات وحقوق الملكية</TableCell>
            <TableCell></TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalLiabilitiesAndEquity)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotalLiabilitiesAndEquity)}</TableCell>}
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
