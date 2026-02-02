// مكونات عرض الإيضاحات الأخرى

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CostOfRevenueNote, 
  GeneralAndAdminExpensesNote, 
  CashAndBankNote,
  EmployeeBenefitsNote,
  CapitalNote,
  FixedAssetsNote,
  AccountingPoliciesNote,
  CreditorsNote,
} from '../types';
import { formatNumber } from '../utils/numberFormatting';

// إيضاح السياسات المحاسبية
interface AccountingPoliciesNoteViewProps {
  data: AccountingPoliciesNote;
  noteNumber?: number;
}

export function AccountingPoliciesNoteView({ data, noteNumber = 3 }: AccountingPoliciesNoteViewProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- السياسات المحاسبية الهامة</h3>
      <div className="space-y-4">
        {data.policies.map((policy, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="font-semibold text-sm">{noteNumber}-{idx + 1} {policy.title}</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{policy.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// إيضاح ممتلكات ومعدات (الأصول الثابتة)
interface FixedAssetsNoteViewProps {
  data: FixedAssetsNote;
  reportDate: string;
  noteNumber?: number;
}

export function FixedAssetsNoteView({ data, reportDate, noteNumber = 7 }: FixedAssetsNoteViewProps) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  
  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- العقارات والآلات والمعدات</h3>
      <div className="overflow-x-auto">
        <Table className="border text-xs">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">البيان</TableHead>
              {data.categories.map((cat, idx) => (
                <TableHead key={idx} className="text-center font-bold whitespace-nowrap">{cat}</TableHead>
              ))}
              <TableHead className="text-center font-bold">المجموع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* التكلفة */}
            <TableRow className="bg-muted/30">
              <TableCell colSpan={data.categories.length + 2} className="font-bold">التكلفة</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>الرصيد في بداية الفترة</TableCell>
              {data.costOpening.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono">{formatNumber(val)}</TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold">{formatNumber(data.totals.costOpening)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>الإضافات خلال الفترة</TableCell>
              {data.costAdditions.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono">{formatNumber(val)}</TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold">{formatNumber(data.totals.costAdditions)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>الاستبعادات خلال الفترة</TableCell>
              {data.costDisposals.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono text-destructive">
                  {val > 0 ? `(${formatNumber(val)})` : '-'}
                </TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold text-destructive">
                {data.totals.costDisposals > 0 ? `(${formatNumber(data.totals.costDisposals)})` : '-'}
              </TableCell>
            </TableRow>
            <TableRow className="border-t font-semibold">
              <TableCell>الرصيد في نهاية الفترة</TableCell>
              {data.costClosing.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono">{formatNumber(val)}</TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold">{formatNumber(data.totals.costClosing)}</TableCell>
            </TableRow>
            
            {/* الإهلاك المتراكم */}
            <TableRow className="bg-muted/30">
              <TableCell colSpan={data.categories.length + 2} className="font-bold">الإهلاك المتراكم</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>الرصيد في بداية الفترة</TableCell>
              {data.depreciationOpening.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono">{formatNumber(val)}</TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold">{formatNumber(data.totals.depreciationOpening)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>الإهلاك للفترة</TableCell>
              {data.depreciationAdditions.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono">{formatNumber(val)}</TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold">{formatNumber(data.totals.depreciationAdditions)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>استبعادات الإهلاك</TableCell>
              {data.depreciationDisposals.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono text-destructive">
                  {val > 0 ? `(${formatNumber(val)})` : '-'}
                </TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold text-destructive">
                {data.totals.depreciationDisposals > 0 ? `(${formatNumber(data.totals.depreciationDisposals)})` : '-'}
              </TableCell>
            </TableRow>
            <TableRow className="border-t font-semibold">
              <TableCell>الرصيد في نهاية الفترة</TableCell>
              {data.depreciationClosing.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono">{formatNumber(val)}</TableCell>
              ))}
              <TableCell className="text-center font-mono font-bold">{formatNumber(data.totals.depreciationClosing)}</TableCell>
            </TableRow>
            
            {/* صافي القيمة الدفترية */}
            <TableRow className="bg-primary/10 font-bold border-t-2">
              <TableCell>صافي القيمة الدفترية في {currentYear}</TableCell>
              {data.netBookValueClosing.map((val, idx) => (
                <TableCell key={idx} className="text-center font-mono">{formatNumber(val)}</TableCell>
              ))}
              <TableCell className="text-center font-mono">{formatNumber(data.totals.netBookValueClosing)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// إيضاح الدائنون
interface CreditorsNoteViewProps {
  data: CreditorsNote;
  reportDate: string;
  previousReportDate?: string;
  noteNumber?: number;
}

export function CreditorsNoteView({ data, reportDate, previousReportDate, noteNumber = 8 }: CreditorsNoteViewProps) {
  const currentYear = reportDate ? reportDate.match(/\d{4}/)?.[0] + 'م' : '2025م';
  const previousYear = previousReportDate ? previousReportDate.match(/\d{4}/)?.[0] + 'م' : '2024م';
  const hasPreviousData = data.previousTotal !== undefined && data.previousTotal > 0;

  return (
    <div className="space-y-4" dir="rtl">
      <h3 className="text-lg font-bold">{noteNumber}- الدائنون</h3>
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
