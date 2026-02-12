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
import { useLanguage } from '@/contexts/LanguageContext';

export function FinancialReportsPage() {
  const { t, direction } = useLanguage();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
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

  const getTypeLabel = (type: string): string => {
    const types: Record<string, string> = {
      assets: t.coa_type_assets, liabilities: t.coa_type_liabilities, equity: t.coa_type_equity,
      revenue: t.coa_type_revenue, expenses: t.coa_type_expenses,
    };
    return types[type] || type;
  };

  const getReferenceTypeLabel = (type: string | null): string => {
    const types: Record<string, string> = {
      sale: t.je_type_sales, purchase: t.je_type_purchases, expense: t.je_type_expenses,
      manual: t.je_type_manual, adjustment: t.je_type_auto, opening: t.fy_opening_entry,
    };
    return type ? types[type] || type : t.gl_general;
  };

  // Export functions - keeping same logic but with translated labels
  const exportTrialBalance = (type: 'print' | 'excel' | 'pdf') => {
    if (!trialBalance) return;
    const columns = [
      { header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' },
      { header: t.je_col_type, key: 'type' }, { header: t.acc_debit, key: 'debit' }, { header: t.acc_credit, key: 'credit' },
    ];
    const data = trialBalance.accounts.map(item => ({
      code: item.account.code, name: item.account.name, type: getTypeLabel(item.account.type),
      debit: item.debit > 0 ? item.debit.toLocaleString() : '-', credit: item.credit > 0 ? item.credit.toLocaleString() : '-',
    }));
    const summaryCards = [
      { label: t.fr_total_debit, value: trialBalance.totalDebit.toLocaleString() + ' ر.س' },
      { label: t.fr_total_credit, value: trialBalance.totalCredit.toLocaleString() + ' ر.س' },
      { label: t.je_col_status, value: trialBalance.totalDebit === trialBalance.totalCredit ? t.fr_balanced : t.fr_unbalanced },
    ];
    if (type === 'print') printReport({ title: t.fr_trial_balance, columns, data, summaryCards });
    else if (type === 'excel') exportToExcel({ title: t.fr_trial_balance, columns, data, fileName: 'trial-balance', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title: t.fr_trial_balance, columns, data, fileName: 'trial-balance', summaryCards });
  };

  const exportComprehensiveTrial = (type: 'print' | 'excel' | 'pdf') => {
    if (!comprehensiveTrial) return;
    const columns = [
      { header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' },
      { header: `${t.acc_debit}`, key: 'periodDebit' }, { header: `${t.acc_credit}`, key: 'periodCredit' },
      { header: `${t.acc_debit}`, key: 'closingDebit' }, { header: `${t.acc_credit}`, key: 'closingCredit' },
    ];
    const data = comprehensiveTrial.accounts.map(item => ({
      code: item.account.code, name: item.account.name,
      periodDebit: item.periodDebit > 0 ? item.periodDebit.toLocaleString() : '-',
      periodCredit: item.periodCredit > 0 ? item.periodCredit.toLocaleString() : '-',
      closingDebit: item.closingDebit > 0 ? item.closingDebit.toLocaleString() : '-',
      closingCredit: item.closingCredit > 0 ? item.closingCredit.toLocaleString() : '-',
    }));
    const summaryCards = [
      { label: t.acc_debit, value: comprehensiveTrial.totals.periodDebit.toLocaleString() + ' ر.س' },
      { label: t.acc_credit, value: comprehensiveTrial.totals.periodCredit.toLocaleString() + ' ر.س' },
    ];
    if (type === 'print') printReport({ title: t.fr_comprehensive_trial, columns, data, summaryCards });
    else if (type === 'excel') exportToExcel({ title: t.fr_comprehensive_trial, columns, data, fileName: 'comprehensive-trial-balance', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title: t.fr_comprehensive_trial, columns, data, fileName: 'comprehensive-trial-balance', summaryCards });
  };

  const exportIncomeStatement = (type: 'print' | 'excel' | 'pdf') => {
    if (!incomeStatement) return;
    const columns = [
      { header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' },
      { header: t.je_col_type, key: 'type' }, { header: t.acc_balance, key: 'amount' },
    ];
    const data = [
      ...incomeStatement.revenue.map(item => ({ code: item.account.code, name: item.account.name, type: t.coa_type_revenue, amount: item.amount.toLocaleString() })),
      ...incomeStatement.expenses.map(item => ({ code: item.account.code, name: item.account.name, type: t.coa_type_expenses, amount: item.amount.toLocaleString() })),
    ];
    const summaryCards = [
      { label: t.fr_total_revenue, value: incomeStatement.totalRevenue.toLocaleString() + ' ر.س' },
      { label: t.fr_total_expenses, value: incomeStatement.totalExpenses.toLocaleString() + ' ر.س' },
      { label: t.fr_net_income, value: incomeStatement.netIncome.toLocaleString() + ' ر.س' },
    ];
    const dateSubtitle = dateRange.from && dateRange.to ? `${t.gl_from} ${format(dateRange.from, 'yyyy/MM/dd')} ${t.gl_to} ${format(dateRange.to, 'yyyy/MM/dd')}` : undefined;
    if (type === 'print') printReport({ title: t.fr_income_statement, subtitle: dateSubtitle, columns, data, summaryCards });
    else if (type === 'excel') exportToExcel({ title: t.fr_income_statement, columns, data, fileName: 'income-statement', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title: t.fr_income_statement, subtitle: dateSubtitle, columns, data, fileName: 'income-statement', summaryCards });
  };

  const exportBalanceSheet = (type: 'print' | 'excel' | 'pdf') => {
    if (!balanceSheet) return;
    const columns = [
      { header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' },
      { header: t.je_col_type, key: 'category' }, { header: t.acc_balance, key: 'balance' },
    ];
    const data = [
      ...balanceSheet.currentAssets.map(item => ({ code: item.account.code, name: item.account.name, category: t.fr_current_assets, balance: item.balance.toLocaleString() })),
      ...balanceSheet.fixedAssets.map(item => ({ code: item.account.code, name: item.account.name, category: t.fr_fixed_assets, balance: item.balance.toLocaleString() })),
      ...balanceSheet.currentLiabilities.map(item => ({ code: item.account.code, name: item.account.name, category: t.fr_current_liabilities, balance: item.balance.toLocaleString() })),
      ...balanceSheet.longTermLiabilities.map(item => ({ code: item.account.code, name: item.account.name, category: t.fr_long_term_liabilities, balance: item.balance.toLocaleString() })),
      ...balanceSheet.equity.map(item => ({ code: item.account.code, name: item.account.name, category: t.fr_equity, balance: item.balance.toLocaleString() })),
      ...(balanceSheet.retainedEarnings !== 0 ? [{ code: '-', name: t.fr_retained_earnings, category: t.fr_equity, balance: balanceSheet.retainedEarnings.toLocaleString() }] : []),
    ];
    const summaryCards = [
      { label: t.fr_current_assets, value: balanceSheet.totalCurrentAssets.toLocaleString() + ' ر.س' },
      { label: t.fr_fixed_assets, value: balanceSheet.totalFixedAssets.toLocaleString() + ' ر.س' },
      { label: t.fr_total_assets, value: balanceSheet.totalAssets.toLocaleString() + ' ر.س' },
      { label: t.fr_total_liabilities, value: balanceSheet.totalLiabilities.toLocaleString() + ' ر.س' },
      { label: t.fr_total_equity, value: balanceSheet.totalEquity.toLocaleString() + ' ر.س' },
    ];
    if (type === 'print') printReport({ title: t.fr_balance_sheet, columns, data, summaryCards });
    else if (type === 'excel') exportToExcel({ title: t.fr_balance_sheet, columns, data, fileName: 'balance-sheet', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title: t.fr_balance_sheet, columns, data, fileName: 'balance-sheet', summaryCards });
  };

  const exportJournalEntries = (type: 'print' | 'excel' | 'pdf') => {
    if (!journalEntries.length) return;
    const columns = [
      { header: t.acc_entry_number, key: 'entry_number' }, { header: t.je_col_date, key: 'date' },
      { header: t.je_col_type, key: 'type' }, { header: t.je_col_desc, key: 'description' },
      { header: t.acc_debit, key: 'debit' }, { header: t.acc_credit, key: 'credit' },
    ];
    const data = journalEntries.map((entry: any) => ({
      entry_number: entry.entry_number, date: entry.entry_date, type: getReferenceTypeLabel(entry.reference_type),
      description: entry.description, debit: entry.total_debit.toLocaleString(), credit: entry.total_credit.toLocaleString(),
    }));
    const totalDebit = journalEntries.reduce((sum: number, e: any) => sum + e.total_debit, 0);
    const totalCredit = journalEntries.reduce((sum: number, e: any) => sum + e.total_credit, 0);
    const summaryCards = [
      { label: t.fr_entries_count, value: journalEntries.length.toString() },
      { label: t.fr_total_debit, value: totalDebit.toLocaleString() + ' ر.س' },
      { label: t.fr_total_credit, value: totalCredit.toLocaleString() + ' ر.س' },
    ];
    const dateSubtitle = dateRange.from && dateRange.to ? `${t.gl_from} ${format(dateRange.from, 'yyyy/MM/dd')} ${t.gl_to} ${format(dateRange.to, 'yyyy/MM/dd')}` : undefined;
    if (type === 'print') printReport({ title: t.fr_journal_entries_report, subtitle: dateSubtitle, columns, data, summaryCards });
    else if (type === 'excel') exportToExcel({ title: t.fr_journal_entries_report, columns, data, fileName: 'journal-entries', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title: t.fr_journal_entries_report, subtitle: dateSubtitle, columns, data, fileName: 'journal-entries', summaryCards });
  };

  const exportAccountBalances = (type: 'print' | 'excel' | 'pdf') => {
    if (!accountBalances.length) return;
    const columns = [
      { header: t.coa_col_code, key: 'code' }, { header: t.coa_col_name, key: 'name' },
      { header: t.je_col_type, key: 'type' }, { header: t.fr_total_debit, key: 'debit_total' },
      { header: t.fr_total_credit, key: 'credit_total' }, { header: t.acc_balance, key: 'balance' },
    ];
    const data = accountBalances.map(item => ({
      code: item.account.code, name: item.account.name, type: getTypeLabel(item.account.type),
      debit_total: (item.debit_total ?? 0).toLocaleString(), credit_total: (item.credit_total ?? 0).toLocaleString(),
      balance: (item.balance ?? 0).toLocaleString(),
    }));
    if (type === 'print') printReport({ title: t.fr_account_balances, columns, data });
    else if (type === 'excel') exportToExcel({ title: t.fr_account_balances, columns, data, fileName: 'account-balances' });
    else exportToPdf({ title: t.fr_account_balances, columns, data, fileName: 'account-balances' });
  };

  const exportVATSettlement = (type: 'print' | 'excel' | 'pdf') => {
    if (!vatSettlement) return;
    const columns = [
      { header: t.acc_entry_number, key: 'entryNumber' }, { header: t.je_col_date, key: 'date' },
      { header: t.je_col_type, key: 'type' }, { header: t.je_col_desc, key: 'description' },
      { header: t.vat_col_vat, key: 'taxAmount' },
    ];
    const data = vatSettlement.transactions.map(tr => ({
      entryNumber: tr.entryNumber, date: tr.date,
      type: tr.type === 'sales' ? t.vat_output_tax : t.vat_input_tax,
      description: tr.description, taxAmount: tr.taxAmount.toLocaleString(),
    }));
    const summaryCards = [
      { label: t.vat_output_tax, value: vatSettlement.vatPayable.balance.toLocaleString() + ' ر.س' },
      { label: t.vat_input_tax, value: vatSettlement.vatRecoverable.balance.toLocaleString() + ' ر.س' },
      { label: t.vat_net_vat, value: Math.abs(vatSettlement.netVAT).toLocaleString() + ' ر.س' },
    ];
    const dateSubtitle = dateRange.from && dateRange.to ? `${t.gl_from} ${format(dateRange.from, 'yyyy/MM/dd')} ${t.gl_to} ${format(dateRange.to, 'yyyy/MM/dd')}` : undefined;
    if (type === 'print') printReport({ title: t.fr_vat_settlement, subtitle: dateSubtitle, columns, data, summaryCards });
    else if (type === 'excel') exportToExcel({ title: t.fr_vat_settlement, columns, data, fileName: 'vat-settlement', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title: t.fr_vat_settlement, subtitle: dateSubtitle, columns, data, fileName: 'vat-settlement', summaryCards });
  };

  const ExportActions = ({ onExport }: { onExport: (type: 'print' | 'excel' | 'pdf') => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" />{t.fr_export_btn}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('print')} className="gap-2 cursor-pointer"><Printer className="w-4 h-4" />{t.fr_export_print}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('pdf')} className="gap-2 cursor-pointer"><FileText className="w-4 h-4" />{t.fr_export_pdf}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')} className="gap-2 cursor-pointer"><FileSpreadsheet className="w-4 h-4" />{t.fr_export_excel}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" dir={direction}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.fr_title}</h1>
        <p className="text-muted-foreground">{t.fr_subtitle}</p>
      </div>

      <Tabs defaultValue="journal-entries" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max gap-1 p-1">
            <TabsTrigger value="journal-entries" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><ClipboardList className="w-4 h-4" />{t.fr_tab_journal_entries}</TabsTrigger>
            <TabsTrigger value="account-movement" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Wallet className="w-4 h-4" />{t.fr_tab_account_movement}</TabsTrigger>
            <TabsTrigger value="trial-balance" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Scale className="w-4 h-4" />{t.fr_tab_trial_balance}</TabsTrigger>
            <TabsTrigger value="comprehensive-trial" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Scale className="w-4 h-4" />{t.fr_tab_comprehensive_trial}</TabsTrigger>
            <TabsTrigger value="income-statement" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><TrendingUp className="w-4 h-4" />{t.fr_tab_income}</TabsTrigger>
            <TabsTrigger value="balance-sheet" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Building2 className="w-4 h-4" />{t.fr_tab_balance_sheet}</TabsTrigger>
            <TabsTrigger value="account-balances" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><FileText className="w-4 h-4" />{t.fr_tab_account_balances}</TabsTrigger>
            <TabsTrigger value="vat-settlement" className="gap-1 text-xs sm:text-sm whitespace-nowrap"><Receipt className="w-4 h-4" />{t.fr_tab_vat_settlement}</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="account-movement"><AccountMovementReport /></TabsContent>

        {/* VAT Settlement */}
        <TabsContent value="vat-settlement">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5" />{t.fr_vat_settlement}</CardTitle>
                  <CardDescription>{t.vat_net_desc}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportVATSettlement} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("justify-start text-right font-normal gap-2", !dateRange.from && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange.from ? (dateRange.to ? <>{format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}</> : format(dateRange.from, "yyyy/MM/dd")) : t.vat_period}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar initialFocus mode="range" defaultMonth={dateRange.from} selected={dateRange} onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {vatSettlement ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-primary/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><ArrowUpCircle className="w-5 h-5 text-destructive" /><span className="text-sm text-muted-foreground">{t.vat_output_tax}</span></div><p className="text-2xl font-bold">{vatSettlement.vatPayable.balance.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p>{vatSettlement.vatPayable.account && <p className="text-xs text-muted-foreground mt-1">{vatSettlement.vatPayable.account.code} - {vatSettlement.vatPayable.account.name}</p>}</CardContent></Card>
                    <Card className="border-primary/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><ArrowDownCircle className="w-5 h-5 text-primary" /><span className="text-sm text-muted-foreground">{t.vat_input_tax}</span></div><p className="text-2xl font-bold">{vatSettlement.vatRecoverable.balance.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p>{vatSettlement.vatRecoverable.account && <p className="text-xs text-muted-foreground mt-1">{vatSettlement.vatRecoverable.account.code} - {vatSettlement.vatRecoverable.account.name}</p>}</CardContent></Card>
                    <Card className={cn("border-2", vatSettlement.status === 'payable' ? "border-destructive/50 bg-destructive/5" : vatSettlement.status === 'receivable' ? "border-primary/50 bg-primary/5" : "border-muted")}><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><MinusCircle className="w-5 h-5" /><span className="text-sm text-muted-foreground">{t.vat_net_vat}</span></div><p className={cn("text-2xl font-bold", vatSettlement.status === 'payable' ? "text-destructive" : vatSettlement.status === 'receivable' ? "text-primary" : "")}>{Math.abs(vatSettlement.netVAT).toLocaleString()} <span className="text-sm font-normal">ر.س</span></p></CardContent></Card>
                    <Card className="border-primary/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Receipt className="w-5 h-5" /><span className="text-sm text-muted-foreground">{t.je_col_status}</span></div><Badge variant={vatSettlement.status === 'payable' ? 'destructive' : vatSettlement.status === 'receivable' ? 'default' : 'secondary'} className="text-base px-3 py-1">{vatSettlement.status === 'payable' ? t.vat_payable : vatSettlement.status === 'receivable' ? t.vat_refundable : t.fr_balanced}</Badge></CardContent></Card>
                  </div>
                  <div>
                    {vatSettlement.transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>
                    ) : (
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>{t.acc_entry_number}</TableHead><TableHead>{t.je_col_date}</TableHead><TableHead>{t.je_col_type}</TableHead><TableHead>{t.je_col_desc}</TableHead><TableHead className="text-left">{t.vat_col_vat}</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {vatSettlement.transactions.map((tr, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-mono">{tr.entryNumber}</TableCell><TableCell>{tr.date}</TableCell>
                              <TableCell><Badge variant={tr.type === 'sales' ? 'destructive' : 'default'}>{tr.type === 'sales' ? t.vat_output_tax : t.vat_input_tax}</Badge></TableCell>
                              <TableCell>{tr.description}</TableCell><TableCell className="text-left font-medium">{tr.taxAmount.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </>
              ) : <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Entries */}
        <TabsContent value="journal-entries">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />{t.fr_journal_entries_report}</CardTitle>
                  <CardDescription>{t.je_entries_desc}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ExportActions onExport={exportJournalEntries} />
                  <Select value={referenceType} onValueChange={setReferenceType}>
                    <SelectTrigger className="w-32"><SelectValue placeholder={t.fr_type_label} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.fr_all_types}</SelectItem>
                      <SelectItem value="sale">{t.je_type_sales}</SelectItem>
                      <SelectItem value="purchase">{t.je_type_purchases}</SelectItem>
                      <SelectItem value="expense">{t.je_type_expenses}</SelectItem>
                      <SelectItem value="manual">{t.je_type_manual}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-1"><CalendarIcon className="h-4 w-4" />{dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : t.gl_from}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange({ ...dateRange, from: date })} className="pointer-events-auto" /></PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className="gap-1"><CalendarIcon className="h-4 w-4" />{dateRange.to ? format(dateRange.to, "yyyy/MM/dd") : t.gl_to}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end"><Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange({ ...dateRange, to: date })} className="pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {journalEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry: any) => (
                    <Card key={entry.id} className="border">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="font-mono bg-primary/10 px-2 py-1 rounded">#{entry.entry_number}</span>
                            <span className="text-sm">{entry.entry_date}</span>
                            <span className={cn("text-xs px-2 py-0.5 rounded",
                              entry.reference_type === 'sale' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                              entry.reference_type === 'purchase' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                              entry.reference_type === 'expense' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                              entry.reference_type === 'manual' && "bg-muted text-muted-foreground",
                              !entry.reference_type && "bg-muted text-muted-foreground"
                            )}>{getReferenceTypeLabel(entry.reference_type)}</span>
                          </div>
                          <span className="font-medium">{entry.total_debit.toLocaleString()} ر.س</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      </CardHeader>
                      <CardContent className="py-2">
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead>{t.acc_account}</TableHead><TableHead className="text-center w-24">{t.acc_debit}</TableHead><TableHead className="text-center w-24">{t.acc_credit}</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {entry.lines?.map((line: any) => (
                              <TableRow key={line.id}>
                                <TableCell><span className="font-mono text-xs text-muted-foreground ml-2">{line.account?.code}</span>{line.account?.name}</TableCell>
                                <TableCell className="text-center text-green-600 dark:text-green-400">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</TableCell>
                                <TableCell className="text-center text-red-600 dark:text-red-400">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</TableCell>
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
                <div><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5" />{t.fr_trial_balance}</CardTitle></div>
                <ExportActions onExport={exportTrialBalance} />
              </div>
            </CardHeader>
            <CardContent>
              {!trialBalance || trialBalance.accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>{t.coa_col_code}</TableHead><TableHead>{t.coa_col_name}</TableHead><TableHead>{t.je_col_type}</TableHead>
                      <TableHead className="text-left">{t.acc_debit}</TableHead><TableHead className="text-left">{t.acc_credit}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {trialBalance.accounts.map((item) => (
                        <TableRow key={item.account.id}>
                          <TableCell className="font-mono">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell>
                          <TableCell>{getTypeLabel(item.account.type)}</TableCell>
                          <TableCell className="text-left">{item.debit > 0 ? item.debit.toLocaleString() : '-'}</TableCell>
                          <TableCell className="text-left">{item.credit > 0 ? item.credit.toLocaleString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={3}>{t.total}</TableCell>
                        <TableCell className="text-left">{trialBalance.totalDebit.toLocaleString()}</TableCell>
                        <TableCell className="text-left">{trialBalance.totalCredit.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className={cn("p-4 rounded-lg text-center font-medium", trialBalance.totalDebit === trialBalance.totalCredit ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400")}>
                    {trialBalance.totalDebit === trialBalance.totalCredit ? t.fr_balanced : t.fr_unbalanced}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comprehensive Trial */}
        <TabsContent value="comprehensive-trial">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5" />{t.fr_comprehensive_trial}</CardTitle></div>
                <ExportActions onExport={exportComprehensiveTrial} />
              </div>
            </CardHeader>
            <CardContent>
              {!comprehensiveTrial || comprehensiveTrial.accounts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead rowSpan={2}>{t.coa_col_code}</TableHead><TableHead rowSpan={2}>{t.coa_col_name}</TableHead>
                      <TableHead colSpan={2} className="text-center border-x bg-blue-50 dark:bg-blue-900/20">{t.fr_tab_account_movement}</TableHead>
                      <TableHead colSpan={2} className="text-center bg-green-50 dark:bg-green-900/20">{t.gl_closing_balance}</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead className="text-center border-x bg-blue-50 dark:bg-blue-900/20">{t.acc_debit}</TableHead>
                      <TableHead className="text-center border-x bg-blue-50 dark:bg-blue-900/20">{t.acc_credit}</TableHead>
                      <TableHead className="text-center bg-green-50 dark:bg-green-900/20">{t.acc_debit}</TableHead>
                      <TableHead className="text-center bg-green-50 dark:bg-green-900/20">{t.acc_credit}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprehensiveTrial.accounts.map((item) => (
                      <TableRow key={item.account.id}>
                        <TableCell className="font-mono">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell>
                        <TableCell className="text-center border-x">{item.periodDebit > 0 ? item.periodDebit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center border-x">{item.periodCredit > 0 ? item.periodCredit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center">{item.closingDebit > 0 ? item.closingDebit.toLocaleString() : '-'}</TableCell>
                        <TableCell className="text-center">{item.closingCredit > 0 ? item.closingCredit.toLocaleString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>{t.total}</TableCell>
                      <TableCell className="text-center border-x">{comprehensiveTrial.totals.periodDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-center border-x">{comprehensiveTrial.totals.periodCredit.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{comprehensiveTrial.totals.closingDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-center">{comprehensiveTrial.totals.closingCredit.toLocaleString()}</TableCell>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />{t.fr_income_statement}</CardTitle></div>
                <div className="flex gap-2">
                  <ExportActions onExport={exportIncomeStatement} />
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" size="sm" className={cn("justify-start text-right font-normal gap-2", !dateRange.from && "text-muted-foreground")}><CalendarIcon className="h-4 w-4" />{dateRange.from ? (dateRange.to ? <>{format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}</> : format(dateRange.from, "yyyy/MM/dd")) : t.vat_period}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={dateRange.from} selected={dateRange} onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })} numberOfMonths={2} /></PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!incomeStatement ? (
                <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>
              ) : (
                <div className="space-y-6">
                  <div><h3 className="font-bold text-lg mb-2 text-green-600 dark:text-green-400">{t.coa_type_revenue}</h3>
                    <Table><TableBody>
                      {incomeStatement.revenue.map((item) => (<TableRow key={item.account.id}><TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell><TableCell className="text-left text-green-600 dark:text-green-400">{item.amount.toLocaleString()}</TableCell></TableRow>))}
                      <TableRow className="bg-green-50 dark:bg-green-900/20 font-bold"><TableCell colSpan={2}>{t.fr_total_revenue}</TableCell><TableCell className="text-left text-green-600 dark:text-green-400">{incomeStatement.totalRevenue.toLocaleString()}</TableCell></TableRow>
                    </TableBody></Table>
                  </div>
                  <div><h3 className="font-bold text-lg mb-2 text-red-600 dark:text-red-400">{t.coa_type_expenses}</h3>
                    <Table><TableBody>
                      {incomeStatement.expenses.map((item) => (<TableRow key={item.account.id}><TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell><TableCell className="text-left text-red-600 dark:text-red-400">{item.amount.toLocaleString()}</TableCell></TableRow>))}
                      <TableRow className="bg-red-50 dark:bg-red-900/20 font-bold"><TableCell colSpan={2}>{t.fr_total_expenses}</TableCell><TableCell className="text-left text-red-600 dark:text-red-400">{incomeStatement.totalExpenses.toLocaleString()}</TableCell></TableRow>
                    </TableBody></Table>
                  </div>
                  <div className={cn("p-4 rounded-lg text-center", incomeStatement.netIncome >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30")}>
                    <p className="text-lg font-bold">{t.fr_net_income}: <span className={incomeStatement.netIncome >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>{incomeStatement.netIncome.toLocaleString()} ر.س</span></p>
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
                <div><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />{t.fr_balance_sheet}</CardTitle></div>
                <ExportActions onExport={exportBalanceSheet} />
              </div>
            </CardHeader>
            <CardContent>
              {!balanceSheet ? (
                <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4 space-y-4">
                    <div><h3 className="font-bold text-lg mb-4 text-primary border-b pb-2">{t.fr_current_assets}</h3>
                      <Table><TableBody>
                        {balanceSheet.currentAssets.map((item) => (<TableRow key={item.account.id}><TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell><TableCell className="text-left">{item.balance.toLocaleString()}</TableCell></TableRow>))}
                        <TableRow className="bg-primary/10 font-bold"><TableCell colSpan={2}>{t.fr_current_assets}</TableCell><TableCell className="text-left text-primary">{balanceSheet.totalCurrentAssets.toLocaleString()}</TableCell></TableRow>
                      </TableBody></Table>
                    </div>
                    {balanceSheet.fixedAssets.length > 0 && (
                      <div><h3 className="font-bold text-lg mb-4 text-muted-foreground border-b pb-2">{t.fr_fixed_assets}</h3>
                        <Table><TableBody>
                          {balanceSheet.fixedAssets.map((item) => (<TableRow key={item.account.id}><TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell><TableCell className="text-left">{item.balance.toLocaleString()}</TableCell></TableRow>))}
                          <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={2}>{t.fr_fixed_assets}</TableCell><TableCell className="text-left">{balanceSheet.totalFixedAssets.toLocaleString()}</TableCell></TableRow>
                        </TableBody></Table>
                      </div>
                    )}
                    <div className="bg-primary/20 p-3 rounded-lg"><div className="flex justify-between items-center font-bold text-lg"><span>{t.fr_total_assets}</span><span className="text-primary">{balanceSheet.totalAssets.toLocaleString()}</span></div></div>
                  </div>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4"><h3 className="font-bold text-lg mb-4 text-destructive border-b pb-2">{t.fr_current_liabilities}</h3>
                      <Table><TableBody>
                        {balanceSheet.currentLiabilities.map((item) => (<TableRow key={item.account.id}><TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell><TableCell className="text-left">{item.balance.toLocaleString()}</TableCell></TableRow>))}
                        {balanceSheet.currentLiabilities.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">{t.fr_no_data}</TableCell></TableRow>}
                        <TableRow className="bg-destructive/10 font-bold"><TableCell colSpan={2}>{t.fr_current_liabilities}</TableCell><TableCell className="text-left text-destructive">{balanceSheet.totalCurrentLiabilities.toLocaleString()}</TableCell></TableRow>
                      </TableBody></Table>
                    </div>
                    {balanceSheet.longTermLiabilities.length > 0 && (
                      <div className="border rounded-lg p-4"><h3 className="font-bold text-lg mb-4 text-muted-foreground border-b pb-2">{t.fr_long_term_liabilities}</h3>
                        <Table><TableBody>
                          {balanceSheet.longTermLiabilities.map((item) => (<TableRow key={item.account.id}><TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell><TableCell className="text-left">{item.balance.toLocaleString()}</TableCell></TableRow>))}
                          <TableRow className="bg-muted/50 font-bold"><TableCell colSpan={2}>{t.fr_long_term_liabilities}</TableCell><TableCell className="text-left">{balanceSheet.totalLongTermLiabilities.toLocaleString()}</TableCell></TableRow>
                        </TableBody></Table>
                      </div>
                    )}
                    <div className="border rounded-lg p-4"><h3 className="font-bold text-lg mb-4 text-purple-600 dark:text-purple-400 border-b pb-2">{t.fr_equity}</h3>
                      <Table><TableBody>
                        {balanceSheet.equity.map((item) => (<TableRow key={item.account.id}><TableCell className="font-mono text-xs text-muted-foreground">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell><TableCell className="text-left">{item.balance.toLocaleString()}</TableCell></TableRow>))}
                        {balanceSheet.retainedEarnings !== 0 && (<TableRow><TableCell></TableCell><TableCell className="font-medium">{t.fr_retained_earnings}</TableCell><TableCell className={cn("text-left font-medium", balanceSheet.retainedEarnings >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{balanceSheet.retainedEarnings.toLocaleString()}</TableCell></TableRow>)}
                        <TableRow className="bg-purple-50 dark:bg-purple-900/20 font-bold"><TableCell colSpan={2}>{t.fr_total_equity}</TableCell><TableCell className="text-left text-purple-600 dark:text-purple-400">{balanceSheet.totalEquity.toLocaleString()}</TableCell></TableRow>
                      </TableBody></Table>
                    </div>
                  </div>
                </div>
              )}
              {balanceSheet && (
                <div className={cn("mt-6 p-4 rounded-lg text-center font-medium",
                  Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  {Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) < 0.01
                    ? t.fr_balanced
                    : t.fr_unbalanced
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
                <div><CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />{t.fr_account_balances}</CardTitle></div>
                <ExportActions onExport={exportAccountBalances} />
              </div>
            </CardHeader>
            <CardContent>
              {accountBalances.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.fr_no_data}</p>
              ) : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t.coa_col_code}</TableHead><TableHead>{t.coa_col_name}</TableHead><TableHead>{t.je_col_type}</TableHead>
                    <TableHead className="text-left">{t.fr_total_debit}</TableHead><TableHead className="text-left">{t.fr_total_credit}</TableHead><TableHead className="text-left">{t.acc_balance}</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {accountBalances.map((item) => (
                      <TableRow key={item.account.id}>
                        <TableCell className="font-mono">{item.account.code}</TableCell><TableCell>{item.account.name}</TableCell>
                        <TableCell>{getTypeLabel(item.account.type)}</TableCell>
                        <TableCell className="text-left">{(item.debit_total ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-left">{(item.credit_total ?? 0).toLocaleString()}</TableCell>
                        <TableCell className={cn("text-left font-medium", (item.balance ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{(item.balance ?? 0).toLocaleString()}</TableCell>
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
