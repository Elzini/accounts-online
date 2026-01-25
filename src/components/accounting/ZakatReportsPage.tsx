import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  useCashFlowStatement,
  useChangesInEquityStatement,
  useZakatBaseStatement,
  useDetailedIncomeStatement,
} from '@/hooks/useZakatReports';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { 
  Loader2, 
  Download, 
  Printer, 
  FileText, 
  FileSpreadsheet,
  CalendarIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  Scale,
  Receipt,
  Building2,
  Calculator,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function ZakatReportsPage() {
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(currentYear, 0, 1),
    to: new Date(currentYear, 11, 31),
  });
  const [fiscalYear, setFiscalYear] = useState(currentYear.toString());

  const startDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  const { data: cashFlow, isLoading: isLoadingCashFlow } = useCashFlowStatement(startDate, endDate);
  const { data: equityChanges, isLoading: isLoadingEquity } = useChangesInEquityStatement(startDate, endDate);
  const { data: zakatBase, isLoading: isLoadingZakat } = useZakatBaseStatement(fiscalYear);
  const { data: detailedIncome, isLoading: isLoadingDetailedIncome } = useDetailedIncomeStatement(startDate, endDate);

  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

  const isLoading = isLoadingCashFlow || isLoadingEquity || isLoadingZakat || isLoadingDetailedIncome;

  // Export functions for Cash Flow Statement
  const exportCashFlow = (type: 'print' | 'excel' | 'pdf') => {
    if (!cashFlow) return;
    
    const columns = [
      { header: 'البند', key: 'item' },
      { header: 'المبلغ (ر.س)', key: 'amount' },
    ];
    
    const data = [
      { item: 'صافي الربح', amount: cashFlow.operatingActivities.netIncome.toLocaleString() },
      { item: '--- الأنشطة التشغيلية ---', amount: '' },
      ...cashFlow.operatingActivities.changesInWorkingCapital.map(c => ({
        item: c.description,
        amount: c.amount.toLocaleString(),
      })),
      { item: 'إجمالي التدفقات التشغيلية', amount: cashFlow.operatingActivities.total.toLocaleString() },
      { item: '--- الأنشطة الاستثمارية ---', amount: '' },
      ...cashFlow.investingActivities.items.map(c => ({
        item: c.description,
        amount: c.amount.toLocaleString(),
      })),
      { item: 'إجمالي التدفقات الاستثمارية', amount: cashFlow.investingActivities.total.toLocaleString() },
      { item: '--- الأنشطة التمويلية ---', amount: '' },
      ...cashFlow.financingActivities.items.map(c => ({
        item: c.description,
        amount: c.amount.toLocaleString(),
      })),
      { item: 'إجمالي التدفقات التمويلية', amount: cashFlow.financingActivities.total.toLocaleString() },
      { item: '---', amount: '' },
      { item: 'صافي التغير في النقدية', amount: cashFlow.netChangeInCash.toLocaleString() },
      { item: 'النقدية في بداية الفترة', amount: cashFlow.cashAtBeginning.toLocaleString() },
      { item: 'النقدية في نهاية الفترة', amount: cashFlow.cashAtEnd.toLocaleString() },
    ];

    const summaryCards = [
      { label: 'التدفقات التشغيلية', value: cashFlow.operatingActivities.total.toLocaleString() + ' ر.س' },
      { label: 'التدفقات الاستثمارية', value: cashFlow.investingActivities.total.toLocaleString() + ' ر.س' },
      { label: 'التدفقات التمويلية', value: cashFlow.financingActivities.total.toLocaleString() + ' ر.س' },
      { label: 'صافي التغير', value: cashFlow.netChangeInCash.toLocaleString() + ' ر.س' },
    ];

    const dateSubtitle = dateRange.from && dateRange.to 
      ? `من ${format(dateRange.from, 'yyyy/MM/dd')} إلى ${format(dateRange.to, 'yyyy/MM/dd')}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة التدفقات النقدية', subtitle: dateSubtitle, columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة التدفقات النقدية', columns, data, fileName: 'cash-flow-statement', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'قائمة التدفقات النقدية', subtitle: dateSubtitle, columns, data, fileName: 'cash-flow-statement', summaryCards });
    }
  };

  // Export functions for Changes in Equity
  const exportEquityChanges = (type: 'print' | 'excel' | 'pdf') => {
    if (!equityChanges) return;
    
    const columns = [
      { header: 'البيان', key: 'description' },
      { header: 'رأس المال', key: 'capital' },
      { header: 'الاحتياطيات', key: 'reserves' },
      { header: 'الأرباح المحتجزة', key: 'retainedEarnings' },
      { header: 'الإجمالي', key: 'total' },
    ];
    
    const data = equityChanges.details.map(d => ({
      description: d.description,
      capital: d.capital.toLocaleString(),
      reserves: d.reserves.toLocaleString(),
      retainedEarnings: d.retainedEarnings.toLocaleString(),
      total: d.total.toLocaleString(),
    }));

    const summaryCards = [
      { label: 'الرصيد الافتتاحي', value: equityChanges.openingBalance.total.toLocaleString() + ' ر.س' },
      { label: 'الرصيد الختامي', value: equityChanges.closingBalance.total.toLocaleString() + ' ر.س' },
    ];

    const dateSubtitle = dateRange.from && dateRange.to 
      ? `من ${format(dateRange.from, 'yyyy/MM/dd')} إلى ${format(dateRange.to, 'yyyy/MM/dd')}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة التغيرات في حقوق الملكية', subtitle: dateSubtitle, columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة التغيرات في حقوق الملكية', columns, data, fileName: 'equity-changes', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'قائمة التغيرات في حقوق الملكية', subtitle: dateSubtitle, columns, data, fileName: 'equity-changes', summaryCards });
    }
  };

  // Export functions for Zakat Base
  const exportZakatBase = (type: 'print' | 'excel' | 'pdf') => {
    if (!zakatBase) return;
    
    const columns = [
      { header: 'البند', key: 'item' },
      { header: 'المبلغ (ر.س)', key: 'amount' },
    ];
    
    const data = [
      { item: '=== مصادر الأموال الخاضعة للزكاة ===', amount: '' },
      { item: 'رأس المال المدفوع', amount: zakatBase.zakatableSources.paidUpCapital.toLocaleString() },
      { item: 'الاحتياطيات', amount: zakatBase.zakatableSources.reserves.toLocaleString() },
      { item: 'الأرباح المحتجزة', amount: zakatBase.zakatableSources.retainedEarnings.toLocaleString() },
      { item: 'صافي ربح السنة', amount: zakatBase.zakatableSources.netIncomeForYear.toLocaleString() },
      { item: 'المخصصات', amount: zakatBase.zakatableSources.provisions.toLocaleString() },
      { item: 'القروض طويلة الأجل', amount: zakatBase.zakatableSources.longTermLoans.toLocaleString() },
      { item: 'إجمالي مصادر الأموال', amount: zakatBase.zakatableSources.total.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== الحسميات ===', amount: '' },
      { item: 'صافي الأصول الثابتة', amount: zakatBase.deductions.netFixedAssets.toLocaleString() },
      { item: 'الاستثمارات طويلة الأجل', amount: zakatBase.deductions.investments.toLocaleString() },
      { item: 'مصاريف ما قبل التشغيل', amount: zakatBase.deductions.preOperatingExpenses.toLocaleString() },
      { item: 'الخسائر المتراكمة', amount: zakatBase.deductions.accumulatedLosses.toLocaleString() },
      { item: 'إجمالي الحسميات', amount: zakatBase.deductions.total.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== الوعاء الزكوي ===', amount: '' },
      { item: 'الوعاء الزكوي المعدل', amount: zakatBase.adjustedZakatBase.toLocaleString() },
      { item: 'نسبة الزكاة', amount: '2.5%' },
      { item: 'الزكاة المستحقة', amount: zakatBase.zakatDue.toLocaleString() },
    ];

    const summaryCards = [
      { label: 'الوعاء الزكوي', value: zakatBase.adjustedZakatBase.toLocaleString() + ' ر.س' },
      { label: 'الزكاة المستحقة', value: zakatBase.zakatDue.toLocaleString() + ' ر.س' },
    ];

    if (type === 'print') {
      printReport({ title: 'قائمة الوعاء الزكوي', subtitle: `السنة المالية: ${fiscalYear}`, columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة الوعاء الزكوي', columns, data, fileName: 'zakat-base', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'قائمة الوعاء الزكوي', subtitle: `السنة المالية: ${fiscalYear}`, columns, data, fileName: 'zakat-base', summaryCards });
    }
  };

  // Export functions for Detailed Income Statement
  const exportDetailedIncome = (type: 'print' | 'excel' | 'pdf') => {
    if (!detailedIncome) return;
    
    const columns = [
      { header: 'البند', key: 'item' },
      { header: 'المبلغ (ر.س)', key: 'amount' },
    ];
    
    const data = [
      { item: '=== الإيرادات ===', amount: '' },
      ...detailedIncome.revenue.items.map(i => ({ item: `${i.code} - ${i.name}`, amount: i.amount.toLocaleString() })),
      { item: 'إجمالي الإيرادات', amount: detailedIncome.revenue.total.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== تكلفة المبيعات ===', amount: '' },
      ...detailedIncome.costOfSales.items.map(i => ({ item: `${i.code} - ${i.name}`, amount: `(${i.amount.toLocaleString()})` })),
      { item: 'إجمالي تكلفة المبيعات', amount: `(${detailedIncome.costOfSales.total.toLocaleString()})` },
      { item: '', amount: '' },
      { item: 'مجمل الربح', amount: detailedIncome.grossProfit.toLocaleString() },
      { item: `هامش الربح الإجمالي`, amount: `${detailedIncome.stats.grossProfitMargin}%` },
      { item: '', amount: '' },
      { item: '=== المصروفات التشغيلية ===', amount: '' },
      ...detailedIncome.operatingExpenses.items.map(e => ({ item: `${e.code} - ${e.name}`, amount: `(${e.amount.toLocaleString()})` })),
      { item: 'إجمالي المصروفات التشغيلية', amount: `(${detailedIncome.operatingExpenses.total.toLocaleString()})` },
      { item: '', amount: '' },
      { item: 'الربح التشغيلي', amount: detailedIncome.operatingIncome.toLocaleString() },
      { item: '', amount: '' },
      { item: '=== صافي الربح ===', amount: '' },
      { item: 'صافي الربح', amount: detailedIncome.netIncomeBeforeZakat.toLocaleString() },
      { item: 'هامش صافي الربح', amount: `${detailedIncome.stats.netProfitMargin}%` },
      { item: '', amount: '' },
      { item: detailedIncome.zakatNote, amount: '' },
    ];

    const summaryCards = [
      { label: 'إجمالي الإيرادات', value: detailedIncome.revenue.total.toLocaleString() + ' ر.س' },
      { label: 'مجمل الربح', value: detailedIncome.grossProfit.toLocaleString() + ' ر.س' },
      { label: 'صافي الربح', value: detailedIncome.netIncomeBeforeZakat.toLocaleString() + ' ر.س' },
      { label: 'عدد المبيعات', value: detailedIncome.stats.totalSalesCount.toString() },
    ];

    const dateSubtitle = dateRange.from && dateRange.to 
      ? `من ${format(dateRange.from, 'yyyy/MM/dd')} إلى ${format(dateRange.to, 'yyyy/MM/dd')}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة الدخل المفصلة', subtitle: dateSubtitle, columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة الدخل المفصلة', columns, data, fileName: 'detailed-income', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'قائمة الدخل المفصلة', subtitle: dateSubtitle, columns, data, fileName: 'detailed-income', summaryCards });
    }
  };

  // Export Actions Component
  const ExportActions = ({ onExport }: { onExport: (type: 'print' | 'excel' | 'pdf') => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('print')} className="gap-2 cursor-pointer">
          <Printer className="w-4 h-4" />
          طباعة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4" />
          تصدير PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4" />
          تصدير Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Date Range Picker Component
  const DateRangePicker = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("justify-start text-right font-normal gap-2", !dateRange.from && "text-muted-foreground")}>
          <CalendarIcon className="h-4 w-4" />
          {dateRange.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}
              </>
            ) : (
              format(dateRange.from, "yyyy/MM/dd")
            )
          ) : (
            <span>اختر الفترة</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateRange.from}
          selected={dateRange}
          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );

  if (isLoading) {
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
            <TabsTrigger value="cash-flow" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Wallet className="w-4 h-4" />
              التدفقات النقدية
            </TabsTrigger>
            <TabsTrigger value="equity-changes" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Scale className="w-4 h-4" />
              التغيرات في حقوق الملكية
            </TabsTrigger>
            <TabsTrigger value="zakat-base" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Calculator className="w-4 h-4" />
              الوعاء الزكوي
            </TabsTrigger>
            <TabsTrigger value="detailed-income" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <TrendingUp className="w-4 h-4" />
              قائمة الدخل المفصلة
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Cash Flow Statement - قائمة التدفقات النقدية */}
        <TabsContent value="cash-flow">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    قائمة التدفقات النقدية
                  </CardTitle>
                  <CardDescription>توضح حركة النقد من الأنشطة التشغيلية والاستثمارية والتمويلية</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportCashFlow} />
                  <DateRangePicker />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {cashFlow ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowUpCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">التدفقات التشغيلية</span>
                        </div>
                        <p className={cn("text-2xl font-bold", cashFlow.operatingActivities.total >= 0 ? "text-primary" : "text-destructive")}>
                          {cashFlow.operatingActivities.total.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">التدفقات الاستثمارية</span>
                        </div>
                        <p className={cn("text-2xl font-bold", cashFlow.investingActivities.total >= 0 ? "text-primary" : "text-destructive")}>
                          {cashFlow.investingActivities.total.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">التدفقات التمويلية</span>
                        </div>
                        <p className={cn("text-2xl font-bold", cashFlow.financingActivities.total >= 0 ? "text-primary" : "text-destructive")}>
                          {cashFlow.financingActivities.total.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={cn("border-2", cashFlow.netChangeInCash >= 0 ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5")}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5" />
                          <span className="text-sm text-muted-foreground">صافي التغير</span>
                        </div>
                        <p className={cn("text-2xl font-bold", cashFlow.netChangeInCash >= 0 ? "text-primary" : "text-destructive")}>
                          {cashFlow.netChangeInCash.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Cash Flow Details */}
                  <div className="space-y-6">
                    {/* Operating Activities */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">التدفقات النقدية من الأنشطة التشغيلية</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">صافي الربح</TableCell>
                              <TableCell className="text-left">{cashFlow.operatingActivities.netIncome.toLocaleString()}</TableCell>
                            </TableRow>
                            {cashFlow.operatingActivities.changesInWorkingCapital.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>
                                  {item.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold">
                              <TableCell>إجمالي التدفقات التشغيلية</TableCell>
                              <TableCell className="text-left">{cashFlow.operatingActivities.total.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Investing Activities */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">التدفقات النقدية من الأنشطة الاستثمارية</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            {cashFlow.investingActivities.items.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>
                                  {item.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold">
                              <TableCell>إجمالي التدفقات الاستثمارية</TableCell>
                              <TableCell className="text-left">{cashFlow.investingActivities.total.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Financing Activities */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">التدفقات النقدية من الأنشطة التمويلية</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            {cashFlow.financingActivities.items.map((item, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>
                                  {item.amount.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold">
                              <TableCell>إجمالي التدفقات التمويلية</TableCell>
                              <TableCell className="text-left">{cashFlow.financingActivities.total.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="border-primary">
                      <CardContent className="p-4">
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="font-medium">صافي التغير في النقدية</TableCell>
                              <TableCell className={cn("text-left font-bold", cashFlow.netChangeInCash >= 0 ? "text-primary" : "text-destructive")}>
                                {cashFlow.netChangeInCash.toLocaleString()}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>النقدية في بداية الفترة</TableCell>
                              <TableCell className="text-left">{cashFlow.cashAtBeginning.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow className="bg-primary/10">
                              <TableCell className="font-bold">النقدية في نهاية الفترة</TableCell>
                              <TableCell className="text-left font-bold text-primary">{cashFlow.cashAtEnd.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">اختر فترة لعرض التقرير</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Changes in Equity - قائمة التغيرات في حقوق الملكية */}
        <TabsContent value="equity-changes">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    قائمة التغيرات في حقوق الملكية
                  </CardTitle>
                  <CardDescription>توضح التغيرات في رأس المال والاحتياطيات والأرباح المحتجزة</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportEquityChanges} />
                  <DateRangePicker />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {equityChanges ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البيان</TableHead>
                      <TableHead className="text-center">رأس المال</TableHead>
                      <TableHead className="text-center">الاحتياطيات</TableHead>
                      <TableHead className="text-center">الأرباح المحتجزة</TableHead>
                      <TableHead className="text-center">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equityChanges.details.map((row, idx) => (
                      <TableRow key={idx} className={idx === 0 || idx === equityChanges.details.length - 1 ? "bg-muted/50 font-medium" : ""}>
                        <TableCell>{row.description}</TableCell>
                        <TableCell className="text-center">{row.capital.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{row.reserves.toLocaleString()}</TableCell>
                        <TableCell className="text-center">{row.retainedEarnings.toLocaleString()}</TableCell>
                        <TableCell className="text-center font-bold">{row.total.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">اختر فترة لعرض التقرير</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zakat Base Statement - قائمة الوعاء الزكوي */}
        <TabsContent value="zakat-base">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    قائمة الوعاء الزكوي
                  </CardTitle>
                  <CardDescription>احتساب الوعاء الزكوي والزكاة المستحقة حسب متطلبات هيئة الزكاة والضريبة والجمارك</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportZakatBase} />
                  <Select value={fiscalYear} onValueChange={setFiscalYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="السنة" />
                    </SelectTrigger>
                    <SelectContent>
                      {[currentYear, currentYear - 1, currentYear - 2].map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {zakatBase ? (
                <>
                  {/* Company Info */}
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <span className="text-sm text-muted-foreground">اسم الشركة:</span>
                          <p className="font-medium">{zakatBase.companyInfo.name || 'غير محدد'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">الرقم الضريبي:</span>
                          <p className="font-medium">{zakatBase.companyInfo.taxNumber || 'غير محدد'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">السجل التجاري:</span>
                          <p className="font-medium">{zakatBase.companyInfo.commercialRegister || 'غير محدد'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Zakat Calculation */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Sources */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-primary">مصادر الأموال الخاضعة للزكاة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>رأس المال المدفوع</TableCell>
                              <TableCell className="text-left">{zakatBase.zakatableSources.paidUpCapital.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>الاحتياطيات</TableCell>
                              <TableCell className="text-left">{zakatBase.zakatableSources.reserves.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>الأرباح المحتجزة</TableCell>
                              <TableCell className="text-left">{zakatBase.zakatableSources.retainedEarnings.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>صافي ربح السنة</TableCell>
                              <TableCell className="text-left">{zakatBase.zakatableSources.netIncomeForYear.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>المخصصات</TableCell>
                              <TableCell className="text-left">{zakatBase.zakatableSources.provisions.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>القروض طويلة الأجل</TableCell>
                              <TableCell className="text-left">{zakatBase.zakatableSources.longTermLoans.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow className="bg-primary/10 font-bold">
                              <TableCell>الإجمالي</TableCell>
                              <TableCell className="text-left text-primary">{zakatBase.zakatableSources.total.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Deductions */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-destructive">الحسميات</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>صافي الأصول الثابتة</TableCell>
                              <TableCell className="text-left">{zakatBase.deductions.netFixedAssets.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>الاستثمارات طويلة الأجل</TableCell>
                              <TableCell className="text-left">{zakatBase.deductions.investments.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>مصاريف ما قبل التشغيل</TableCell>
                              <TableCell className="text-left">{zakatBase.deductions.preOperatingExpenses.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>الخسائر المتراكمة</TableCell>
                              <TableCell className="text-left">{zakatBase.deductions.accumulatedLosses.toLocaleString()}</TableCell>
                            </TableRow>
                            <TableRow className="bg-destructive/10 font-bold">
                              <TableCell>الإجمالي</TableCell>
                              <TableCell className="text-left text-destructive">{zakatBase.deductions.total.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Zakat Summary */}
                  <Card className="border-2 border-primary">
                    <CardContent className="p-6">
                      <div className="grid gap-4 md:grid-cols-3 text-center">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">الوعاء الزكوي المعدل</p>
                          <p className="text-3xl font-bold text-primary">{zakatBase.adjustedZakatBase.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">ريال سعودي</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">نسبة الزكاة</p>
                          <p className="text-3xl font-bold">2.5%</p>
                          <p className="text-sm text-muted-foreground">حسب الشريعة الإسلامية</p>
                        </div>
                        <div className="bg-primary/10 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground mb-1">الزكاة المستحقة</p>
                          <p className="text-3xl font-bold text-primary">{zakatBase.zakatDue.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">ريال سعودي</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">اختر السنة المالية لعرض التقرير</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Income Statement - قائمة الدخل المفصلة */}
        <TabsContent value="detailed-income">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    قائمة الدخل المفصلة
                  </CardTitle>
                  <CardDescription>قائمة الدخل مع تفاصيل الإيرادات والمصروفات وصافي الربح قبل وبعد الزكاة</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportDetailedIncome} />
                  <DateRangePicker />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {detailedIncome ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowUpCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">إجمالي الإيرادات</span>
                        </div>
                        <p className="text-2xl font-bold text-primary">{detailedIncome.revenue.total.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{detailedIncome.stats.totalSalesCount} عملية بيع</p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">مجمل الربح</span>
                        </div>
                        <p className={cn("text-2xl font-bold", detailedIncome.grossProfit >= 0 ? "text-primary" : "text-destructive")}>
                          {detailedIncome.grossProfit.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">هامش {detailedIncome.stats.grossProfitMargin}%</p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-5 h-5" />
                          <span className="text-sm text-muted-foreground">الربح التشغيلي</span>
                        </div>
                        <p className={cn("text-2xl font-bold", detailedIncome.operatingIncome >= 0 ? "text-primary" : "text-destructive")}>
                          {detailedIncome.operatingIncome.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className={cn("border-2", detailedIncome.netIncomeBeforeZakat >= 0 ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5")}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calculator className="w-5 h-5" />
                          <span className="text-sm text-muted-foreground">صافي الربح</span>
                        </div>
                        <p className={cn("text-2xl font-bold", detailedIncome.netIncomeBeforeZakat >= 0 ? "text-primary" : "text-destructive")}>
                          {detailedIncome.netIncomeBeforeZakat.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">هامش {detailedIncome.stats.netProfitMargin}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Zakat Note */}
                  <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">ملاحظة هامة عن الزكاة</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{detailedIncome.zakatNote}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Income Statement Table */}
                  <Table>
                    <TableBody>
                      {/* Revenue */}
                      <TableRow className="bg-primary/10 font-bold">
                        <TableCell colSpan={2}>الإيرادات</TableCell>
                      </TableRow>
                      {detailedIncome.revenue.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pr-8">
                            <span className="text-xs text-muted-foreground ml-2">{item.code}</span>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-left text-primary">{item.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                      {detailedIncome.revenue.items.length === 0 && (
                        <TableRow>
                          <TableCell className="pr-8 text-muted-foreground">لا توجد إيرادات</TableCell>
                          <TableCell className="text-left">-</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-medium bg-primary/5">
                        <TableCell>إجمالي الإيرادات</TableCell>
                        <TableCell className="text-left text-primary font-bold">{detailedIncome.revenue.total.toLocaleString()}</TableCell>
                      </TableRow>

                      {/* Cost of Sales */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                      <TableRow className="bg-destructive/10 font-bold">
                        <TableCell colSpan={2}>تكلفة المبيعات (سعر الشراء)</TableCell>
                      </TableRow>
                      {detailedIncome.costOfSales.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pr-8">
                            <span className="text-xs text-muted-foreground ml-2">{item.code}</span>
                            {item.name}
                          </TableCell>
                          <TableCell className="text-left text-destructive">({item.amount.toLocaleString()})</TableCell>
                        </TableRow>
                      ))}
                      {detailedIncome.costOfSales.items.length === 0 && (
                        <TableRow>
                          <TableCell className="pr-8 text-muted-foreground">لا توجد تكاليف مبيعات</TableCell>
                          <TableCell className="text-left">-</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-medium bg-destructive/5">
                        <TableCell>إجمالي تكلفة المبيعات</TableCell>
                        <TableCell className="text-left text-destructive font-bold">({detailedIncome.costOfSales.total.toLocaleString()})</TableCell>
                      </TableRow>

                      {/* Gross Profit */}
                      <TableRow className="bg-primary/20 font-bold text-lg">
                        <TableCell>
                          مجمل الربح
                          <span className="text-sm font-normal text-muted-foreground mr-2">
                            (هامش {detailedIncome.stats.grossProfitMargin}%)
                          </span>
                        </TableCell>
                        <TableCell className={cn("text-left", detailedIncome.grossProfit >= 0 ? "text-primary" : "text-destructive")}>
                          {detailedIncome.grossProfit.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      {/* Operating Expenses */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                      <TableRow className="bg-orange-100 dark:bg-orange-900/30 font-bold">
                        <TableCell colSpan={2}>المصروفات التشغيلية والإدارية</TableCell>
                      </TableRow>
                      {detailedIncome.operatingExpenses.items.map((exp, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="pr-8">
                            <span className="text-xs text-muted-foreground ml-2">{exp.code}</span>
                            {exp.name}
                          </TableCell>
                          <TableCell className="text-left text-destructive">({exp.amount.toLocaleString()})</TableCell>
                        </TableRow>
                      ))}
                      {detailedIncome.operatingExpenses.items.length === 0 && (
                        <TableRow>
                          <TableCell className="pr-8 text-muted-foreground">لا توجد مصروفات تشغيلية</TableCell>
                          <TableCell className="text-left">-</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-medium bg-orange-50 dark:bg-orange-900/20">
                        <TableCell>إجمالي المصروفات التشغيلية</TableCell>
                        <TableCell className="text-left text-destructive font-bold">({detailedIncome.operatingExpenses.total.toLocaleString()})</TableCell>
                      </TableRow>

                      {/* Operating Income */}
                      <TableRow className="bg-primary/10 font-bold">
                        <TableCell>الربح التشغيلي</TableCell>
                        <TableCell className={cn("text-left", detailedIncome.operatingIncome >= 0 ? "text-primary" : "text-destructive")}>
                          {detailedIncome.operatingIncome.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      {/* Other Expenses */}
                      {detailedIncome.otherExpenses.items.length > 0 && (
                        <>
                          <TableRow className="bg-muted/50">
                            <TableCell colSpan={2}></TableCell>
                          </TableRow>
                          <TableRow className="bg-muted font-bold">
                            <TableCell colSpan={2}>مصروفات أخرى</TableCell>
                          </TableRow>
                          {detailedIncome.otherExpenses.items.map((exp, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="pr-8">
                                <span className="text-xs text-muted-foreground ml-2">{exp.code}</span>
                                {exp.name}
                              </TableCell>
                              <TableCell className="text-left text-destructive">({exp.amount.toLocaleString()})</TableCell>
                            </TableRow>
                          ))}
                        </>
                      )}

                      {/* Net Income */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                      <TableRow className="bg-primary font-bold text-lg text-primary-foreground">
                        <TableCell>
                          صافي الربح
                          <span className="text-sm font-normal opacity-80 mr-2">
                            (هامش {detailedIncome.stats.netProfitMargin}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-left">{detailedIncome.netIncomeBeforeZakat.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">اختر فترة لعرض التقرير</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
