// مكونات عرض الإيضاحات الأخرى

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CostOfRevenueNote, 
  GeneralAndAdminExpensesNote, 
  CashAndBankNote,
  EmployeeBenefitsNote,
  CapitalNote,
  FixedAssetsNote,
} from '../types';
import { formatNumber } from '../utils/numberFormatting';

// إيضاح النقد وأرصدة لدى البنوك
interface CashAndBankNoteViewProps {
  data: CashAndBankNote;
  reportDate: string;
  previousReportDate?: string;
  noteNumber?: number;
}

export function CashAndBankNoteView({ data, reportDate, previousReportDate, noteNumber = 5 }: CashAndBankNoteViewProps) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousTotal !== undefined && data.previousTotal > 0;

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- النقد وأرصدة لدى البنوك</h3>
      <Table className="border text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold w-2/3">البيان</TableHead>
            <TableHead className="text-center font-bold">{currentYear}</TableHead>
            {hasPreviousData && <TableHead className="text-center font-bold">{previousYear}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>المجموع</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.total)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotal)}</TableCell>}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// إيضاح تكلفة الإيرادات
interface CostOfRevenueNoteViewProps {
  data: CostOfRevenueNote;
  reportDate: string;
  previousReportDate?: string;
  noteNumber?: number;
}

export function CostOfRevenueNoteView({ data, reportDate, previousReportDate, noteNumber = 14 }: CostOfRevenueNoteViewProps) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousTotal !== undefined && data.previousTotal > 0;

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- تكلفة الإيرادات</h3>
      <Table className="border text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold w-2/3">البيان</TableHead>
            <TableHead className="text-center font-bold">{currentYear}</TableHead>
            {hasPreviousData && <TableHead className="text-center font-bold">{previousYear}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>المجموع</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.total)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotal)}</TableCell>}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// إيضاح المصاريف العمومية والإدارية
interface GeneralExpensesNoteViewProps {
  data: GeneralAndAdminExpensesNote;
  reportDate: string;
  previousReportDate?: string;
  noteNumber?: number;
}

export function GeneralExpensesNoteView({ data, reportDate, previousReportDate, noteNumber = 15 }: GeneralExpensesNoteViewProps) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousTotal !== undefined && data.previousTotal > 0;

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- مصاريف عمومية وإدارية</h3>
      <Table className="border text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold w-2/3">البيان</TableHead>
            <TableHead className="text-center font-bold">{currentYear}</TableHead>
            {hasPreviousData && <TableHead className="text-center font-bold">{previousYear}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(item.amount)}</TableCell>
              {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(item.previousAmount)}</TableCell>}
            </TableRow>
          ))}
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>المجموع</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.total)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousTotal)}</TableCell>}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// إيضاح مخصصات منافع موظفين
interface EmployeeBenefitsNoteViewProps {
  data: EmployeeBenefitsNote;
  reportDate: string;
  previousReportDate?: string;
  noteNumber?: number;
}

export function EmployeeBenefitsNoteView({ data, reportDate, previousReportDate, noteNumber = 12 }: EmployeeBenefitsNoteViewProps) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousClosingBalance !== undefined && data.previousClosingBalance > 0;

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- مخصصات منافع موظفين</h3>
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
            <TableCell>مخصصات منافع موظفين في بداية الفترة</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.openingBalance)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousOpeningBalance)}</TableCell>}
          </TableRow>
          <TableRow>
            <TableCell>مخصصات منافع موظفين مكونة</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.additions)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousAdditions)}</TableCell>}
          </TableRow>
          <TableRow>
            <TableCell>مخصصات منافع موظفين مدفوعة</TableCell>
            <TableCell className="text-center font-mono text-destructive">({formatNumber(data.payments)})</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono text-destructive">({formatNumber(data.previousPayments)})</TableCell>}
          </TableRow>
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>مخصصات منافع موظفين في نهاية الفترة</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.closingBalance)}</TableCell>
            {hasPreviousData && <TableCell className="text-center font-mono">{formatNumber(data.previousClosingBalance)}</TableCell>}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// إيضاح رأس المال
interface CapitalNoteViewProps {
  data: CapitalNote;
  noteNumber?: number;
}

export function CapitalNoteView({ data, noteNumber = 13 }: CapitalNoteViewProps) {
  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- رأس المال</h3>
      {data.description && (
        <p className="text-sm text-muted-foreground">{data.description}</p>
      )}
      <Table className="border text-sm">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right font-bold">اسم الشريك</TableHead>
            <TableHead className="text-center font-bold">عدد الحصص</TableHead>
            <TableHead className="text-center font-bold">قيمة الحصة</TableHead>
            <TableHead className="text-center font-bold">الإجمالي / ريال</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.partners.map((partner, idx) => (
            <TableRow key={idx}>
              <TableCell>{partner.name}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(partner.sharesCount)}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(partner.shareValue)}</TableCell>
              <TableCell className="text-center font-mono">{formatNumber(partner.totalValue)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-primary/10 border-t">
            <TableCell>المجموع</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalShares)}</TableCell>
            <TableCell className="text-center font-mono">-----</TableCell>
            <TableCell className="text-center font-mono">{formatNumber(data.totalValue)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
