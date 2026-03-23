/**
 * Financial Statements - Notes Tab Content
 * Renders all financial statement notes in sequence.
 */
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen } from 'lucide-react';
import { ComprehensiveFinancialData } from '../types';
import { ZakatNoteView } from '../notes/ZakatNoteView';
import {
  CashAndBankNoteView, CostOfRevenueNoteView, GeneralExpensesNoteView,
  EmployeeBenefitsNoteView, CapitalNoteView, AccountingPoliciesNoteView,
  FixedAssetsNoteView, CreditorsNoteView,
} from '../notes/OtherNotesViews';

interface Props {
  data: ComprehensiveFinancialData;
}

export function NotesTabContent({ data }: Props) {
  const reportDate = data.reportDate || '31 ديسمبر 2025م';
  const { notes } = data;
  const hasAnyNotes = notes.zakat || notes.costOfRevenue || notes.generalAndAdminExpenses;

  return (
    <ScrollArea className="h-[700px]">
      <div className="space-y-8">
        {notes.accountingPolicies && (<><AccountingPoliciesNoteView data={notes.accountingPolicies} noteNumber={3} /><Separator /></>)}
        {notes.cashAndBank && (<><CashAndBankNoteView data={notes.cashAndBank} reportDate={reportDate} noteNumber={5} /><Separator /></>)}
        {notes.fixedAssets && (<><FixedAssetsNoteView data={notes.fixedAssets} reportDate={reportDate} noteNumber={7} /><Separator /></>)}
        {notes.creditors && (<><CreditorsNoteView data={notes.creditors} reportDate={reportDate} noteNumber={8} /><Separator /></>)}
        {notes.zakat && (<><ZakatNoteView data={notes.zakat} reportDate={reportDate} noteNumber={11} /><Separator /></>)}
        {notes.employeeBenefits && (<><EmployeeBenefitsNoteView data={notes.employeeBenefits} reportDate={reportDate} noteNumber={12} /><Separator /></>)}
        {notes.capital && (<><CapitalNoteView data={notes.capital} noteNumber={13} /><Separator /></>)}
        {notes.costOfRevenue && (<><CostOfRevenueNoteView data={notes.costOfRevenue} reportDate={reportDate} noteNumber={14} /><Separator /></>)}
        {notes.generalAndAdminExpenses && (<><GeneralExpensesNoteView data={notes.generalAndAdminExpenses} reportDate={reportDate} noteNumber={15} /><Separator /></>)}

        <div className="space-y-4" dir="rtl">
          <h3 className="text-lg font-bold">16- الأحداث بعد نهاية الفترة المالية</h3>
          <p className="text-sm text-muted-foreground">
            {notes.eventsAfterReportingPeriod?.description ||
              'تعتقد الإدارة أنه لم تطرأ أية أحداث لاحقة هامة منذ السنة المنتهية في 31 ديسمبر 2025م قد يكون لها أثر جوهري على المركز المالي للشركة كجزء من هذه القوائم المالية.'}
          </p>
        </div>

        {!hasAnyNotes && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>لم يتم العثور على إيضاحات تفصيلية في الملف</p>
            <p className="text-sm">تأكد من أن ملف Excel يحتوي على صفحات الإيضاحات</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
