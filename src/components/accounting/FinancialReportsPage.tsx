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
import { 
  useTrialBalance, 
  useIncomeStatement, 
  useAccountBalances, 
  useBalanceSheet,
  useJournalEntriesReport,
  useComprehensiveTrialBalance,
  useVATSettlementReport
} from '@/hooks/useAccounting';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { Loader2, FileText, TrendingUp, Scale, CalendarIcon, Building2, ClipboardList, Printer, Download, FileSpreadsheet, Wallet, Receipt, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AccountMovementReport } from '@/components/reports/AccountMovementReport';
import { Badge } from '@/components/ui/badge';

export function FinancialReportsPage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });
  const [referenceType, setReferenceType] = useState<string>('all');

  const { data: trialBalance, isLoading: isLoadingTrial } = useTrialBalance();
  const { data: incomeStatement, isLoading: isLoadingIncome } = useIncomeStatement(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );
  const { data: accountBalances = [], isLoading: isLoadingBalances } = useAccountBalances();
  const { data: balanceSheet, isLoading: isLoadingBalanceSheet } = useBalanceSheet();
  const { data: journalEntries = [], isLoading: isLoadingJournal } = useJournalEntriesReport(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    referenceType === 'all' ? undefined : referenceType
  );
  const { data: comprehensiveTrial, isLoading: isLoadingComprehensive } = useComprehensiveTrialBalance();
  const { data: vatSettlement, isLoading: isLoadingVAT } = useVATSettlementReport(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );

  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

  const isLoading = isLoadingTrial || isLoadingIncome || isLoadingBalances || isLoadingBalanceSheet || isLoadingJournal || isLoadingComprehensive || isLoadingVAT;

  // Export functions for Trial Balance
  const exportTrialBalance = (type: 'print' | 'excel' | 'pdf') => {
    if (!trialBalance) return;
    
    const columns = [
      { header: 'الرمز', key: 'code' },
      { header: 'اسم الحساب', key: 'name' },
      { header: 'النوع', key: 'type' },
      { header: 'مدين', key: 'debit' },
      { header: 'دائن', key: 'credit' },
    ];
    
    const data = trialBalance.accounts.map(item => ({
      code: item.account.code,
      name: item.account.name,
      type: getTypeLabel(item.account.type),
      debit: item.debit > 0 ? item.debit.toLocaleString() : '-',
      credit: item.credit > 0 ? item.credit.toLocaleString() : '-',
    }));

    const summaryCards = [
      { label: 'إجمالي المدين', value: trialBalance.totalDebit.toLocaleString() + ' ر.س' },
      { label: 'إجمالي الدائن', value: trialBalance.totalCredit.toLocaleString() + ' ر.س' },
      { label: 'الحالة', value: trialBalance.totalDebit === trialBalance.totalCredit ? 'متوازن ✓' : 'غير متوازن ✗' },
    ];

    if (type === 'print') {
      printReport({ title: 'ميزان المراجعة', columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'ميزان المراجعة', columns, data, fileName: 'trial-balance', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'ميزان المراجعة', columns, data, fileName: 'trial-balance', summaryCards });
    }
  };

  // Export functions for Comprehensive Trial Balance
  const exportComprehensiveTrial = (type: 'print' | 'excel' | 'pdf') => {
    if (!comprehensiveTrial) return;
    
    const columns = [
      { header: 'الرمز', key: 'code' },
      { header: 'اسم الحساب', key: 'name' },
      { header: 'حركة مدين', key: 'periodDebit' },
      { header: 'حركة دائن', key: 'periodCredit' },
      { header: 'رصيد مدين', key: 'closingDebit' },
      { header: 'رصيد دائن', key: 'closingCredit' },
    ];
    
    const data = comprehensiveTrial.accounts.map(item => ({
      code: item.account.code,
      name: item.account.name,
      periodDebit: item.periodDebit > 0 ? item.periodDebit.toLocaleString() : '-',
      periodCredit: item.periodCredit > 0 ? item.periodCredit.toLocaleString() : '-',
      closingDebit: item.closingDebit > 0 ? item.closingDebit.toLocaleString() : '-',
      closingCredit: item.closingCredit > 0 ? item.closingCredit.toLocaleString() : '-',
    }));

    const summaryCards = [
      { label: 'حركة مدين', value: comprehensiveTrial.totals.periodDebit.toLocaleString() + ' ر.س' },
      { label: 'حركة دائن', value: comprehensiveTrial.totals.periodCredit.toLocaleString() + ' ر.س' },
    ];

    if (type === 'print') {
      printReport({ title: 'ميزان المراجعة الشامل', columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'ميزان المراجعة الشامل', columns, data, fileName: 'comprehensive-trial-balance', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'ميزان المراجعة الشامل', columns, data, fileName: 'comprehensive-trial-balance', summaryCards });
    }
  };

  // Export functions for Income Statement
  const exportIncomeStatement = (type: 'print' | 'excel' | 'pdf') => {
    if (!incomeStatement) return;
    
    const columns = [
      { header: 'الرمز', key: 'code' },
      { header: 'اسم الحساب', key: 'name' },
      { header: 'النوع', key: 'type' },
      { header: 'المبلغ', key: 'amount' },
    ];
    
    const revenueData = incomeStatement.revenue.map(item => ({
      code: item.account.code,
      name: item.account.name,
      type: 'إيرادات',
      amount: item.amount.toLocaleString(),
    }));

    const expenseData = incomeStatement.expenses.map(item => ({
      code: item.account.code,
      name: item.account.name,
      type: 'مصروفات',
      amount: item.amount.toLocaleString(),
    }));

    const data = [...revenueData, ...expenseData];

    const summaryCards = [
      { label: 'إجمالي الإيرادات', value: incomeStatement.totalRevenue.toLocaleString() + ' ر.س' },
      { label: 'إجمالي المصروفات', value: incomeStatement.totalExpenses.toLocaleString() + ' ر.س' },
      { label: 'صافي الربح', value: incomeStatement.netIncome.toLocaleString() + ' ر.س' },
    ];

    const dateSubtitle = dateRange.from && dateRange.to 
      ? `من ${format(dateRange.from, 'yyyy/MM/dd')} إلى ${format(dateRange.to, 'yyyy/MM/dd')}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'قائمة الدخل', subtitle: dateSubtitle, columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'قائمة الدخل', columns, data, fileName: 'income-statement', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'قائمة الدخل', subtitle: dateSubtitle, columns, data, fileName: 'income-statement', summaryCards });
    }
  };

  // Export functions for Balance Sheet
  const exportBalanceSheet = (type: 'print' | 'excel' | 'pdf') => {
    if (!balanceSheet) return;
    
    const columns = [
      { header: 'الرمز', key: 'code' },
      { header: 'اسم الحساب', key: 'name' },
      { header: 'التصنيف', key: 'category' },
      { header: 'الرصيد', key: 'balance' },
    ];
    
    const currentAssetsData = balanceSheet.currentAssets.map(item => ({
      code: item.account.code,
      name: item.account.name,
      category: 'أصول متداولة',
      balance: item.balance.toLocaleString(),
    }));

    const fixedAssetsData = balanceSheet.fixedAssets.map(item => ({
      code: item.account.code,
      name: item.account.name,
      category: 'أصول ثابتة',
      balance: item.balance.toLocaleString(),
    }));

    const currentLiabilitiesData = balanceSheet.currentLiabilities.map(item => ({
      code: item.account.code,
      name: item.account.name,
      category: 'خصوم متداولة',
      balance: item.balance.toLocaleString(),
    }));

    const longTermLiabilitiesData = balanceSheet.longTermLiabilities.map(item => ({
      code: item.account.code,
      name: item.account.name,
      category: 'خصوم طويلة الأجل',
      balance: item.balance.toLocaleString(),
    }));

    const equityData = balanceSheet.equity.map(item => ({
      code: item.account.code,
      name: item.account.name,
      category: 'حقوق الملكية',
      balance: item.balance.toLocaleString(),
    }));

    if (balanceSheet.retainedEarnings !== 0) {
      equityData.push({
        code: '-',
        name: 'الأرباح المحتجزة',
        category: 'حقوق الملكية',
        balance: balanceSheet.retainedEarnings.toLocaleString(),
      });
    }

    const data = [...currentAssetsData, ...fixedAssetsData, ...currentLiabilitiesData, ...longTermLiabilitiesData, ...equityData];

    const summaryCards = [
      { label: 'الأصول المتداولة', value: balanceSheet.totalCurrentAssets.toLocaleString() + ' ر.س' },
      { label: 'الأصول الثابتة', value: balanceSheet.totalFixedAssets.toLocaleString() + ' ر.س' },
      { label: 'إجمالي الأصول', value: balanceSheet.totalAssets.toLocaleString() + ' ر.س' },
      { label: 'إجمالي الخصوم', value: balanceSheet.totalLiabilities.toLocaleString() + ' ر.س' },
      { label: 'حقوق الملكية', value: balanceSheet.totalEquity.toLocaleString() + ' ر.س' },
    ];

    if (type === 'print') {
      printReport({ title: 'الميزانية العمومية', columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'الميزانية العمومية', columns, data, fileName: 'balance-sheet', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'الميزانية العمومية', columns, data, fileName: 'balance-sheet', summaryCards });
    }
  };

  // Export functions for Journal Entries
  const exportJournalEntries = (type: 'print' | 'excel' | 'pdf') => {
    if (!journalEntries.length) return;
    
    const columns = [
      { header: 'رقم القيد', key: 'entry_number' },
      { header: 'التاريخ', key: 'date' },
      { header: 'النوع', key: 'type' },
      { header: 'الوصف', key: 'description' },
      { header: 'مدين', key: 'debit' },
      { header: 'دائن', key: 'credit' },
    ];
    
    const data = journalEntries.map((entry: any) => ({
      entry_number: entry.entry_number,
      date: entry.entry_date,
      type: getReferenceTypeLabel(entry.reference_type),
      description: entry.description,
      debit: entry.total_debit.toLocaleString(),
      credit: entry.total_credit.toLocaleString(),
    }));

    const totalDebit = journalEntries.reduce((sum: number, e: any) => sum + e.total_debit, 0);
    const totalCredit = journalEntries.reduce((sum: number, e: any) => sum + e.total_credit, 0);

    const summaryCards = [
      { label: 'عدد القيود', value: journalEntries.length.toString() },
      { label: 'إجمالي المدين', value: totalDebit.toLocaleString() + ' ر.س' },
      { label: 'إجمالي الدائن', value: totalCredit.toLocaleString() + ' ر.س' },
    ];

    const dateSubtitle = dateRange.from && dateRange.to 
      ? `من ${format(dateRange.from, 'yyyy/MM/dd')} إلى ${format(dateRange.to, 'yyyy/MM/dd')}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'كشف القيود', subtitle: dateSubtitle, columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'كشف القيود', columns, data, fileName: 'journal-entries', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'كشف القيود', subtitle: dateSubtitle, columns, data, fileName: 'journal-entries', summaryCards });
    }
  };

  // Export functions for Account Balances
  const exportAccountBalances = (type: 'print' | 'excel' | 'pdf') => {
    if (!accountBalances.length) return;
    
    const columns = [
      { header: 'الرمز', key: 'code' },
      { header: 'اسم الحساب', key: 'name' },
      { header: 'النوع', key: 'type' },
      { header: 'إجمالي المدين', key: 'debit_total' },
      { header: 'إجمالي الدائن', key: 'credit_total' },
      { header: 'الرصيد', key: 'balance' },
    ];
    
    const data = accountBalances.map(item => ({
      code: item.account.code,
      name: item.account.name,
      type: getTypeLabel(item.account.type),
      debit_total: (item.debit_total ?? 0).toLocaleString(),
      credit_total: (item.credit_total ?? 0).toLocaleString(),
      balance: (item.balance ?? 0).toLocaleString(),
    }));

    if (type === 'print') {
      printReport({ title: 'أرصدة الحسابات', columns, data });
    } else if (type === 'excel') {
      exportToExcel({ title: 'أرصدة الحسابات', columns, data, fileName: 'account-balances' });
    } else {
      exportToPdf({ title: 'أرصدة الحسابات', columns, data, fileName: 'account-balances' });
    }
  };

  // Export functions for VAT Settlement
  const exportVATSettlement = (type: 'print' | 'excel' | 'pdf') => {
    if (!vatSettlement) return;
    
    const columns = [
      { header: 'رقم القيد', key: 'entryNumber' },
      { header: 'التاريخ', key: 'date' },
      { header: 'النوع', key: 'type' },
      { header: 'الوصف', key: 'description' },
      { header: 'مبلغ الضريبة', key: 'taxAmount' },
    ];
    
    const data = vatSettlement.transactions.map(t => ({
      entryNumber: t.entryNumber,
      date: t.date,
      type: t.type === 'sales' ? 'مبيعات (مخرجات)' : 'مشتريات (مدخلات)',
      description: t.description,
      taxAmount: t.taxAmount.toLocaleString(),
    }));

    const statusLabel = vatSettlement.status === 'payable' 
      ? 'مستحق للهيئة' 
      : vatSettlement.status === 'receivable' 
        ? 'مسترد من الهيئة' 
        : 'متوازن';

    const summaryCards = [
      { label: 'ضريبة المخرجات (المبيعات)', value: vatSettlement.vatPayable.balance.toLocaleString() + ' ر.س' },
      { label: 'ضريبة المدخلات (المشتريات)', value: vatSettlement.vatRecoverable.balance.toLocaleString() + ' ر.س' },
      { label: 'صافي الضريبة', value: Math.abs(vatSettlement.netVAT).toLocaleString() + ' ر.س' },
      { label: 'الحالة', value: statusLabel },
    ];

    const dateSubtitle = dateRange.from && dateRange.to 
      ? `من ${format(dateRange.from, 'yyyy/MM/dd')} إلى ${format(dateRange.to, 'yyyy/MM/dd')}`
      : undefined;

    if (type === 'print') {
      printReport({ title: 'تقرير تسوية ضريبة القيمة المضافة', subtitle: dateSubtitle, columns, data, summaryCards });
    } else if (type === 'excel') {
      exportToExcel({ title: 'تقرير تسوية ضريبة القيمة المضافة', columns, data, fileName: 'vat-settlement', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    } else {
      exportToPdf({ title: 'تقرير تسوية ضريبة القيمة المضافة', subtitle: dateSubtitle, columns, data, fileName: 'vat-settlement', summaryCards });
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
        <h1 className="text-2xl font-bold text-foreground">التقارير المالية</h1>
        <p className="text-muted-foreground">عرض التقارير المالية والمحاسبية للشركة</p>
      </div>

      <Tabs defaultValue="journal-entries" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max gap-1 p-1">
            <TabsTrigger value="journal-entries" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <ClipboardList className="w-4 h-4" />
              كشف القيود
            </TabsTrigger>
            <TabsTrigger value="account-movement" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Wallet className="w-4 h-4" />
              حركة الحسابات
            </TabsTrigger>
            <TabsTrigger value="trial-balance" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Scale className="w-4 h-4" />
              ميزان المراجعة
            </TabsTrigger>
            <TabsTrigger value="comprehensive-trial" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Scale className="w-4 h-4" />
              ميزان شامل
            </TabsTrigger>
            <TabsTrigger value="income-statement" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <TrendingUp className="w-4 h-4" />
              قائمة الدخل
            </TabsTrigger>
            <TabsTrigger value="balance-sheet" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Building2 className="w-4 h-4" />
              الميزانية العمومية
            </TabsTrigger>
            <TabsTrigger value="account-balances" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <FileText className="w-4 h-4" />
              أرصدة الحسابات
            </TabsTrigger>
            <TabsTrigger value="vat-settlement" className="gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Receipt className="w-4 h-4" />
              تسوية الضريبة
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* Account Movement Report - حركة الحسابات */}
        <TabsContent value="account-movement">
          <AccountMovementReport />
        </TabsContent>

        {/* VAT Settlement Report - تقرير تسوية ضريبة القيمة المضافة */}
        <TabsContent value="vat-settlement">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    تقرير تسوية ضريبة القيمة المضافة
                  </CardTitle>
                  <CardDescription>حساب الفرق بين الضريبة المستحقة والمستردة</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportVATSettlement} />
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
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {vatSettlement ? (
                <>
                  {/* Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowUpCircle className="w-5 h-5 text-destructive" />
                          <span className="text-sm text-muted-foreground">ضريبة المخرجات (المبيعات)</span>
                        </div>
                        <p className="text-2xl font-bold">{vatSettlement.vatPayable.balance.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p>
                        {vatSettlement.vatPayable.account && (
                          <p className="text-xs text-muted-foreground mt-1">{vatSettlement.vatPayable.account.code} - {vatSettlement.vatPayable.account.name}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowDownCircle className="w-5 h-5 text-primary" />
                          <span className="text-sm text-muted-foreground">ضريبة المدخلات (المشتريات)</span>
                        </div>
                        <p className="text-2xl font-bold">{vatSettlement.vatRecoverable.balance.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p>
                        {vatSettlement.vatRecoverable.account && (
                          <p className="text-xs text-muted-foreground mt-1">{vatSettlement.vatRecoverable.account.code} - {vatSettlement.vatRecoverable.account.name}</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className={cn(
                      "border-2",
                      vatSettlement.status === 'payable' ? "border-destructive/50 bg-destructive/5" : 
                      vatSettlement.status === 'receivable' ? "border-primary/50 bg-primary/5" : 
                      "border-muted"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MinusCircle className="w-5 h-5" />
                          <span className="text-sm text-muted-foreground">صافي الضريبة</span>
                        </div>
                        <p className={cn(
                          "text-2xl font-bold",
                          vatSettlement.status === 'payable' ? "text-destructive" : 
                          vatSettlement.status === 'receivable' ? "text-primary" : ""
                        )}>
                          {Math.abs(vatSettlement.netVAT).toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt className="w-5 h-5" />
                          <span className="text-sm text-muted-foreground">حالة التسوية</span>
                        </div>
                        <Badge variant={
                          vatSettlement.status === 'payable' ? 'destructive' : 
                          vatSettlement.status === 'receivable' ? 'default' : 
                          'secondary'
                        } className="text-base px-3 py-1">
                          {vatSettlement.status === 'payable' ? 'مستحق للهيئة' : 
                           vatSettlement.status === 'receivable' ? 'مسترد من الهيئة' : 
                           'متوازن'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Transactions Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">تفاصيل الحركات الضريبية</h3>
                    {vatSettlement.transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">لا توجد حركات ضريبية في هذه الفترة</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>رقم القيد</TableHead>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>النوع</TableHead>
                            <TableHead>الوصف</TableHead>
                            <TableHead className="text-left">مبلغ الضريبة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vatSettlement.transactions.map((t, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono">{t.entryNumber}</TableCell>
                              <TableCell>{t.date}</TableCell>
                              <TableCell>
                                <Badge variant={t.type === 'sales' ? 'destructive' : 'default'}>
                                  {t.type === 'sales' ? 'مخرجات' : 'مدخلات'}
                                </Badge>
                              </TableCell>
                              <TableCell>{t.description}</TableCell>
                              <TableCell className="text-left font-medium">{t.taxAmount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات ضريبية. تأكد من تفعيل إعدادات الضريبة وربط الحسابات.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Entries Report - كشف القيود */}
        <TabsContent value="journal-entries">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    كشف القيود
                  </CardTitle>
                  <CardDescription>عرض جميع القيود المحاسبية</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportJournalEntries} />
                  <Select value={referenceType} onValueChange={setReferenceType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="sale">مبيعات</SelectItem>
                      <SelectItem value="purchase">مشتريات</SelectItem>
                      <SelectItem value="expense">مصروفات</SelectItem>
                      <SelectItem value="manual">يدوي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : "من"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "yyyy/MM/dd") : "إلى"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {journalEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد قيود</p>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry: any) => (
                    <Card key={entry.id} className="border">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-mono bg-primary/10 px-2 py-1 rounded">#{entry.entry_number}</span>
                            <span className="text-sm">{entry.entry_date}</span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              entry.reference_type === 'sale' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              entry.reference_type === 'purchase' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                              entry.reference_type === 'expense' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                              entry.reference_type === 'manual' && "bg-muted text-muted-foreground",
                              !entry.reference_type && "bg-muted text-muted-foreground"
                            )}>
                              {getReferenceTypeLabel(entry.reference_type)}
                            </span>
                          </div>
                          <span className="font-medium">{entry.total_debit.toLocaleString()} ر.س</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      </CardHeader>
                      <CardContent className="py-2">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>الحساب</TableHead>
                              <TableHead className="text-center w-24">مدين</TableHead>
                              <TableHead className="text-center w-24">دائن</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.lines?.map((line: any) => (
                              <TableRow key={line.id}>
                                <TableCell>
                                  <span className="font-mono text-xs text-muted-foreground ml-2">{line.account?.code}</span>
                                  {line.account?.name}
                                </TableCell>
                                <TableCell className="text-center text-green-600 dark:text-green-400">
                                  {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                                </TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">
                                  {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    ميزان المراجعة
                  </CardTitle>
                  <CardDescription>ملخص أرصدة جميع الحسابات المدينة والدائنة</CardDescription>
                </div>
                <ExportActions onExport={exportTrialBalance} />
              </div>
            </CardHeader>
            <CardContent>
              {!trialBalance || trialBalance.accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الرمز</TableHead>
                        <TableHead>اسم الحساب</TableHead>
                        <TableHead>النوع</TableHead>
                        <TableHead className="text-left">مدين</TableHead>
                        <TableHead className="text-left">دائن</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trialBalance.accounts.map((item) => (
                        <TableRow key={item.account.id}>
                          <TableCell className="font-mono">{item.account.code}</TableCell>
                          <TableCell>{item.account.name}</TableCell>
                          <TableCell>{getTypeLabel(item.account.type)}</TableCell>
                          <TableCell className="text-left">
                            {item.debit > 0 ? item.debit.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-left">
                            {item.credit > 0 ? item.credit.toLocaleString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>الإجمالي</TableCell>
                        <TableCell className="text-left">{trialBalance.totalDebit.toLocaleString()}</TableCell>
                        <TableCell className="text-left">{trialBalance.totalCredit.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className={cn(
                    "p-4 rounded-lg text-center font-medium",
                    trialBalance.totalDebit === trialBalance.totalCredit ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {trialBalance.totalDebit === trialBalance.totalCredit ? '✓ الميزان متوازن' : '✗ الميزان غير متوازن'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comprehensive Trial Balance */}
        <TabsContent value="comprehensive-trial">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    ميزان المراجعة الشامل
                  </CardTitle>
                  <CardDescription>عرض أرصدة افتتاحية وحركة الفترة والأرصدة الختامية</CardDescription>
                </div>
                <ExportActions onExport={exportComprehensiveTrial} />
              </div>
            </CardHeader>
            <CardContent>
              {!comprehensiveTrial || comprehensiveTrial.accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2}>الرمز</TableHead>
                      <TableHead rowSpan={2}>اسم الحساب</TableHead>
                      <TableHead colSpan={2} className="text-center border-x bg-blue-50 dark:bg-blue-900/20">حركة الفترة</TableHead>
                      <TableHead colSpan={2} className="text-center bg-green-50 dark:bg-green-900/20">الرصيد الختامي</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-center border-r bg-blue-50 dark:bg-blue-900/20">مدين</TableHead>
                      <TableHead className="text-center bg-blue-50 dark:bg-blue-900/20">دائن</TableHead>
                      <TableHead className="text-center border-r bg-green-50 dark:bg-green-900/20">مدين</TableHead>
                      <TableHead className="text-center bg-green-50 dark:bg-green-900/20">دائن</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprehensiveTrial.accounts.map((item) => (
                      <TableRow key={item.account.id}>
                        <TableCell className="font-mono">{item.account.code}</TableCell>
                        <TableCell>{item.account.name}</TableCell>
                        <TableCell className="text-center border-r">{item.periodDebit > 0 ? item.periodDebit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center">{item.periodCredit > 0 ? item.periodCredit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center border-r text-green-600 dark:text-green-400">{item.closingDebit > 0 ? item.closingDebit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center text-red-600 dark:text-red-400">{item.closingCredit > 0 ? item.closingCredit.toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>الإجمالي</TableCell>
                      <TableCell className="text-center border-r">{comprehensiveTrial.totals.periodDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{comprehensiveTrial.totals.periodCredit.toLocaleString()}</TableCell>
                      <TableCell className="text-center border-r text-green-600 dark:text-green-400">{comprehensiveTrial.totals.closingDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-center text-red-600 dark:text-red-400">{comprehensiveTrial.totals.closingCredit.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Statement */}
        <TabsContent value="income-statement">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    قائمة الدخل
                  </CardTitle>
                  <CardDescription>ملخص الإيرادات والمصروفات وصافي الربح</CardDescription>
                </div>
                <div className="flex gap-2">
                  <ExportActions onExport={exportIncomeStatement} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : "من"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "yyyy/MM/dd") : "إلى"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!incomeStatement ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="space-y-6">
                  {/* Revenue */}
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-green-600 dark:text-green-400">الإيرادات</h3>
                    <Table>
                      <TableBody>
                      {incomeStatement.revenue.map((item) => (
                          <TableRow key={item.account.id}>
                            <TableCell>{item.account.code}</TableCell>
                            <TableCell>{item.account.name}</TableCell>
                            <TableCell className="text-left">{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold">
                          <TableCell colSpan={2}>إجمالي الإيرادات</TableCell>
                          <TableCell className="text-left text-green-600 dark:text-green-400">
                            {incomeStatement.totalRevenue.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h3 className="font-bold text-lg mb-3 text-red-600 dark:text-red-400">المصروفات</h3>
                    <Table>
                      <TableBody>
                      {incomeStatement.expenses.map((item) => (
                          <TableRow key={item.account.id}>
                            <TableCell>{item.account.code}</TableCell>
                            <TableCell>{item.account.name}</TableCell>
                            <TableCell className="text-left">{item.amount.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-red-50 dark:bg-red-900/20 font-bold">
                          <TableCell colSpan={2}>إجمالي المصروفات</TableCell>
                          <TableCell className="text-left text-red-600 dark:text-red-400">
                            {incomeStatement.totalExpenses.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Net Income */}
                  <div className={cn(
                    "p-6 rounded-lg",
                    incomeStatement.netIncome >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold">صافي الربح / (الخسارة)</span>
                      <span className={cn(
                        "text-2xl font-bold",
                        incomeStatement.netIncome >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                      )}>
                        {incomeStatement.netIncome.toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    الميزانية العمومية
                  </CardTitle>
                  <CardDescription>عرض الأصول والخصوم وحقوق الملكية</CardDescription>
                </div>
                <ExportActions onExport={exportBalanceSheet} />
              </div>
            </CardHeader>
            <CardContent>
              {!balanceSheet ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assets */}
                  <div className="border rounded-lg p-4 space-y-4">
                    {/* Current Assets - الأصول المتداولة */}
                    <div>
                      <h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">الأصول المتداولة</h3>
                      <Table>
                        <TableBody>
                          {balanceSheet.currentAssets.map((item) => (
                            <TableRow key={item.account.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                              <TableCell>{item.account.name}</TableCell>
                              <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-primary/10 font-bold">
                            <TableCell colSpan={2}>إجمالي الأصول المتداولة</TableCell>
                            <TableCell className="text-left text-primary">{balanceSheet.totalCurrentAssets.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Fixed Assets - الأصول الثابتة */}
                    {balanceSheet.fixedAssets.length > 0 && (
                      <div>
                        <h3 className="font-bold text-lg mb-4 text-muted-foreground border-b pb-2">الأصول الثابتة</h3>
                        <Table>
                          <TableBody>
                            {balanceSheet.fixedAssets.map((item) => (
                              <TableRow key={item.account.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                                <TableCell>{item.account.name}</TableCell>
                                <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold">
                              <TableCell colSpan={2}>إجمالي الأصول الثابتة</TableCell>
                              <TableCell className="text-left">{balanceSheet.totalFixedAssets.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Total Assets */}
                    <div className="bg-primary/20 p-3 rounded-lg">
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>إجمالي الأصول</span>
                        <span className="text-primary">{balanceSheet.totalAssets.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div className="space-y-4">
                    {/* Current Liabilities - الخصوم المتداولة */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-4 text-destructive border-b pb-2">الخصوم المتداولة</h3>
                      <Table>
                        <TableBody>
                          {balanceSheet.currentLiabilities.map((item) => (
                            <TableRow key={item.account.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                              <TableCell>{item.account.name}</TableCell>
                              <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          {balanceSheet.currentLiabilities.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد خصوم متداولة</TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-destructive/10 font-bold">
                            <TableCell colSpan={2}>إجمالي الخصوم المتداولة</TableCell>
                            <TableCell className="text-left text-destructive">{balanceSheet.totalCurrentLiabilities.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Long-term Liabilities - الخصوم طويلة الأجل */}
                    {balanceSheet.longTermLiabilities.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-bold text-lg mb-4 text-muted-foreground border-b pb-2">الخصوم طويلة الأجل</h3>
                        <Table>
                          <TableBody>
                            {balanceSheet.longTermLiabilities.map((item) => (
                              <TableRow key={item.account.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                                <TableCell>{item.account.name}</TableCell>
                                <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/50 font-bold">
                              <TableCell colSpan={2}>إجمالي الخصوم طويلة الأجل</TableCell>
                              <TableCell className="text-left">{balanceSheet.totalLongTermLiabilities.toLocaleString()}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Equity */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-4 text-purple-600 dark:text-purple-400 border-b pb-2">حقوق الملكية</h3>
                      <Table>
                        <TableBody>
                          {balanceSheet.equity.map((item) => (
                            <TableRow key={item.account.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell>
                              <TableCell>{item.account.name}</TableCell>
                              <TableCell className="text-left">{item.balance.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                          {balanceSheet.retainedEarnings !== 0 && (
                            <TableRow>
                              <TableCell></TableCell>
                              <TableCell className="font-medium">الأرباح المحتجزة</TableCell>
                              <TableCell className={cn(
                                "text-left font-medium",
                                balanceSheet.retainedEarnings >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {balanceSheet.retainedEarnings.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="bg-purple-50 dark:bg-purple-900/20 font-bold">
                            <TableCell colSpan={2}>إجمالي حقوق الملكية</TableCell>
                            <TableCell className="text-left text-purple-600 dark:text-purple-400">{balanceSheet.totalEquity.toLocaleString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
              
              {balanceSheet && (
                <div className={cn(
                  "mt-6 p-4 rounded-lg text-center font-medium",
                  Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                    ? '✓ الميزانية متوازنة (الأصول = الخصوم + حقوق الملكية)' 
                    : `✗ الميزانية غير متوازنة - فرق: ${(balanceSheet.totalAssets - balanceSheet.totalLiabilities - balanceSheet.totalEquity).toLocaleString()}`
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Balances */}
        <TabsContent value="account-balances">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    أرصدة الحسابات
                  </CardTitle>
                  <CardDescription>عرض أرصدة جميع الحسابات في الدفتر</CardDescription>
                </div>
                <ExportActions onExport={exportAccountBalances} />
              </div>
            </CardHeader>
            <CardContent>
              {accountBalances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد بيانات</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرمز</TableHead>
                      <TableHead>اسم الحساب</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead className="text-left">إجمالي المدين</TableHead>
                      <TableHead className="text-left">إجمالي الدائن</TableHead>
                      <TableHead className="text-left">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountBalances.map((item) => (
                      <TableRow key={item.account.id}>
                        <TableCell className="font-mono">{item.account.code}</TableCell>
                        <TableCell>{item.account.name}</TableCell>
                        <TableCell>{getTypeLabel(item.account.type)}</TableCell>
                        <TableCell className="text-left">{(item.debit_total ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-left">{(item.credit_total ?? 0).toLocaleString()}</TableCell>
                        <TableCell className={cn(
                          "text-left font-medium",
                          (item.balance ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {(item.balance ?? 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getTypeLabel(type: string): string {
  const types: Record<string, string> = {
    assets: 'أصول',
    liabilities: 'خصوم',
    equity: 'حقوق الملكية',
    revenue: 'إيرادات',
    expenses: 'مصروفات',
  };
  return types[type] || type;
}

function getReferenceTypeLabel(type: string | null): string {
  const types: Record<string, string> = {
    sale: 'مبيعات',
    purchase: 'مشتريات',
    expense: 'مصروفات',
    manual: 'يدوي',
    adjustment: 'تسوية',
    opening: 'افتتاحي',
  };
  return type ? types[type] || type : 'عام';
}