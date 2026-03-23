/**
 * ZakatReportsPage - Orchestrator
 * Decomposed into tab components under ./zakat/
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Wallet, Scale, Calculator, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import {
  useCashFlowStatement,
  useChangesInEquityStatement,
  useZakatBaseStatement,
  useDetailedIncomeStatement,
} from '@/hooks/useZakatReports';
import { useUnifiedPrintReport } from '@/hooks/useUnifiedPrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { CashFlowTab } from './zakat/CashFlowTab';
import { EquityChangesTab } from './zakat/EquityChangesTab';
import { ZakatBaseTab } from './zakat/ZakatBaseTab';
import { DetailedIncomeTab } from './zakat/DetailedIncomeTab';
import {
  buildCashFlowExportData,
  buildEquityExportData,
  buildZakatBaseExportData,
  buildDetailedIncomeExportData,
} from './zakat/exportUtils';

export function ZakatReportsPage() {
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(currentYear, 0, 1),
    to: new Date(currentYear, 11, 31),
  });
  const [fiscalYear, setFiscalYear] = useState(currentYear.toString());

  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const { data: cashFlow, isLoading: l1 } = useCashFlowStatement(startDate, endDate);
  const { data: equityChanges, isLoading: l2 } = useChangesInEquityStatement(startDate, endDate);
  const { data: zakatBase, isLoading: l3 } = useZakatBaseStatement(fiscalYear);
  const { data: detailedIncome, isLoading: l4 } = useDetailedIncomeStatement(startDate, endDate);

  const { printReport } = useUnifiedPrintReport();
  const { exportToExcel } = useExcelExport();

  const dateSubtitle = dateRange.from && dateRange.to
    ? `من ${format(dateRange.from, 'yyyy/MM/dd')} إلى ${format(dateRange.to, 'yyyy/MM/dd')}`
    : undefined;

  const handleExport = (
    buildFn: () => { columns: any[]; data: any[]; summaryData?: any[]; title: string; subtitle?: string; fileName?: string } | null,
    type: 'print' | 'excel' | 'pdf'
  ) => {
    const result = buildFn();
    if (!result) return;
    if (type === 'excel') {
      exportToExcel({ title: result.title, columns: result.columns, data: result.data, fileName: result.fileName || 'report', summaryData: result.summaryData });
    } else {
      printReport({ title: result.title, subtitle: result.subtitle, columns: result.columns, data: result.data });
    }
  };

  if (l1 || l2 || l3 || l4) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">القوائم المالية للزكاة</h1>
        <p className="text-muted-foreground">القوائم المالية المطلوبة لهيئة الزكاة والضريبة والجمارك</p>
      </div>

      <Tabs defaultValue="cash-flow" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max gap-1 p-1">
            <TabsTrigger value="cash-flow" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Wallet className="w-4 h-4" />التدفقات النقدية</TabsTrigger>
            <TabsTrigger value="equity-changes" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Scale className="w-4 h-4" />التغيرات في حقوق الملكية</TabsTrigger>
            <TabsTrigger value="zakat-base" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Calculator className="w-4 h-4" />الوعاء الزكوي</TabsTrigger>
            <TabsTrigger value="detailed-income" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><TrendingUp className="w-4 h-4" />قائمة الدخل المفصلة</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="cash-flow">
          <CashFlowTab
            data={cashFlow}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExport={(type) => handleExport(() => cashFlow ? buildCashFlowExportData(cashFlow, dateSubtitle) : null, type)}
          />
        </TabsContent>

        <TabsContent value="equity-changes">
          <EquityChangesTab
            data={equityChanges}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExport={(type) => handleExport(() => equityChanges ? buildEquityExportData(equityChanges, dateSubtitle) : null, type)}
          />
        </TabsContent>

        <TabsContent value="zakat-base">
          <ZakatBaseTab
            data={zakatBase}
            fiscalYear={fiscalYear}
            onFiscalYearChange={setFiscalYear}
            currentYear={currentYear}
            onExport={(type) => handleExport(() => zakatBase ? buildZakatBaseExportData(zakatBase, fiscalYear) : null, type)}
          />
        </TabsContent>

        <TabsContent value="detailed-income">
          <DetailedIncomeTab
            data={detailedIncome}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExport={(type) => handleExport(() => detailedIncome ? buildDetailedIncomeExportData(detailedIncome, dateSubtitle) : null, type)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
