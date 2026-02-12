import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Printer, FileSpreadsheet, Search, Check, ChevronsUpDown, FileText, X } from 'lucide-react';
import { useAccounts, useGeneralLedger } from '@/hooks/useAccounting';
import { useUnifiedPrintReport, UnifiedReportColumn } from '@/hooks/useUnifiedPrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export function AccountStatementReport() {
  const { t, direction } = useLanguage();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentType, setDocumentType] = useState<string>('all');
  const [showOpeningBalance, setShowOpeningBalance] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const { data: ledgerData, isLoading: ledgerLoading } = useGeneralLedger(
    selectedAccountId || null,
    startDate || undefined,
    endDate || undefined
  );

  const { printReport } = useUnifiedPrintReport();
  const { exportToExcel } = useExcelExport();

  const allAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return allAccounts;
    const query = searchQuery.toLowerCase();
    return allAccounts.filter(account => 
      account.code.toLowerCase().includes(query) ||
      account.name.toLowerCase().includes(query)
    );
  }, [allAccounts, searchQuery]);

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, typeof filteredAccounts> = {
      assets: [], liabilities: [], equity: [], revenue: [], expenses: [],
    };
    filteredAccounts.forEach(account => {
      if (groups[account.type]) groups[account.type].push(account);
    });
    return groups;
  }, [filteredAccounts]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      assets: t.coa_type_assets, liabilities: t.coa_type_liabilities, equity: t.coa_type_equity,
      revenue: t.coa_type_revenue, expenses: t.coa_type_expenses,
    };
    return types[type] || type;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA');
  };

  const processedData = useMemo(() => {
    if (!ledgerData?.entries) return { entries: [], openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0 };
    let runningBalance = ledgerData.openingBalance || 0;
    const entries = ledgerData.entries
      .filter((entry: any) => { if (documentType === 'all') return true; return entry.reference_type === documentType; })
      .map((entry: any) => { runningBalance += entry.debit - entry.credit; return { ...entry, balance: runningBalance }; });
    return {
      entries, openingBalance: ledgerData.openingBalance || 0,
      totalDebit: entries.reduce((sum: number, e: any) => sum + (e.debit || 0), 0),
      totalCredit: entries.reduce((sum: number, e: any) => sum + (e.credit || 0), 0),
      closingBalance: runningBalance,
    };
  }, [ledgerData, documentType]);

  const handleSearch = () => {
    if (!selectedAccountId) { toast.error(t.as_select_account); return; }
    setShowReport(true);
  };

  const getDocumentTypeLabel = (type: string | null) => {
    if (!type) return t.as_doc_journal;
    switch (type) {
      case 'sale': return t.as_doc_sales;
      case 'purchase': return t.as_doc_purchases;
      case 'expense': return t.as_doc_expenses;
      case 'voucher': return t.as_doc_vouchers;
      case 'payroll': return t.as_doc_payroll;
      default: return t.as_doc_journal;
    }
  };

  const handlePrint = () => {
    if (!selectedAccount) return;
    const columns: UnifiedReportColumn[] = [
      { header: t.acc_entry_number, key: 'entryNumber', align: 'center', width: '60px' },
      { header: t.je_col_date, key: 'date', align: 'center', width: '90px' },
      { header: t.je_col_statement, key: 'description', align: 'right' },
      { header: t.je_col_type, key: 'type', align: 'center', width: '80px' },
      { header: t.acc_debit, key: 'debit', align: 'right', type: 'currency', width: '100px' },
      { header: t.acc_credit, key: 'credit', align: 'right', type: 'currency', width: '100px' },
      { header: t.acc_balance, key: 'balance', align: 'right', type: 'currency', width: '110px' },
    ];
    const data: any[] = [];
    if (showOpeningBalance) {
      data.push({ entryNumber: '', date: '', description: t.as_previous_balance, type: '', debit: '', credit: processedData.openingBalance < 0 ? Math.abs(processedData.openingBalance) : '', balance: processedData.openingBalance });
    }
    processedData.entries.forEach((entry: any) => {
      data.push({ entryNumber: entry.entry_number, date: formatDate(entry.entry_date), description: entry.description, type: getDocumentTypeLabel(entry.reference_type), debit: entry.debit > 0 ? entry.debit : '', credit: entry.credit > 0 ? entry.credit : '', balance: entry.balance });
    });
    printReport({
      title: t.as_title,
      headerInfo: [
        { label: t.coa_col_code, value: selectedAccount.code },
        { label: t.coa_col_name, value: selectedAccount.name },
        { label: t.as_from_date, value: startDate || '-' },
        { label: t.as_to_date, value: endDate || '-' },
      ],
      columns, data, showSignatures: false,
    });
  };

  const handleExcelExport = () => {
    if (!selectedAccount) return;
    const columns = [
      { header: t.acc_entry_number, key: 'entryNumber' },
      { header: t.je_col_date, key: 'date' },
      { header: t.je_col_statement, key: 'description' },
      { header: t.je_col_type, key: 'type' },
      { header: t.acc_debit, key: 'debit' },
      { header: t.acc_credit, key: 'credit' },
      { header: t.acc_balance, key: 'balance' },
    ];
    const data: any[] = [];
    if (showOpeningBalance) {
      data.push({ entryNumber: '', date: '', description: t.as_previous_balance, type: '', debit: 0, credit: processedData.openingBalance < 0 ? Math.abs(processedData.openingBalance) : 0, balance: processedData.openingBalance });
    }
    processedData.entries.forEach((entry: any) => {
      data.push({ entryNumber: entry.entry_number, date: formatDate(entry.entry_date), description: entry.description, type: getDocumentTypeLabel(entry.reference_type), debit: entry.debit > 0 ? entry.debit : 0, credit: entry.credit > 0 ? entry.credit : 0, balance: entry.balance });
    });
    exportToExcel({
      title: `${t.as_title} - ${selectedAccount.name}`,
      columns, data, fileName: `account_statement_${selectedAccount.code}`,
      summaryData: [
        { label: t.as_opening_balance, value: processedData.openingBalance },
        { label: t.gl_total_debit, value: processedData.totalDebit },
        { label: t.gl_total_credit, value: processedData.totalCredit },
        { label: t.as_closing_balance, value: processedData.closingBalance },
      ],
    });
    toast.success(t.as_excel_exported);
  };

  if (accountsLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4" dir={direction}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            {t.as_title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.as_account_label}</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-10">
                    {selectedAccount ? (
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-muted-foreground font-mono">{selectedAccount.code}</span>
                        <span className="truncate">{selectedAccount.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{t.as_select_account}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t.as_search_placeholder} value={searchQuery} onValueChange={setSearchQuery} />
                    <CommandList>
                      <CommandEmpty>{t.gl_no_results}</CommandEmpty>
                      <ScrollArea className="h-[280px]">
                        {Object.entries(groupedAccounts).map(([type, accts]) => (
                          accts.length > 0 && (
                            <CommandGroup key={type} heading={getTypeLabel(type)}>
                              {accts.map((account) => (
                                <CommandItem key={account.id} value={`${account.code} ${account.name}`} onSelect={() => { setSelectedAccountId(account.id); setOpen(false); setSearchQuery(''); }}>
                                  <Check className={cn("mr-2 h-4 w-4", selectedAccountId === account.id ? "opacity-100" : "opacity-0")} />
                                  <span className="text-muted-foreground font-mono text-sm ml-2">{account.code}</span>
                                  <span className="truncate">{account.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )
                        ))}
                      </ScrollArea>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t.as_doc_type}</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.as_doc_all}</SelectItem>
                  <SelectItem value="sale">{t.as_doc_sales}</SelectItem>
                  <SelectItem value="purchase">{t.as_doc_purchases}</SelectItem>
                  <SelectItem value="expense">{t.as_doc_expenses}</SelectItem>
                  <SelectItem value="voucher">{t.as_doc_vouchers}</SelectItem>
                  <SelectItem value="payroll">{t.as_doc_payroll}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{t.as_from_date}</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{t.as_to_date}</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} dir="ltr" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id="openingBalance" checked={showOpeningBalance} onCheckedChange={(checked) => setShowOpeningBalance(!!checked)} />
                <Label htmlFor="openingBalance" className="cursor-pointer">{t.as_show_opening}</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSearch} className="gap-2"><Search className="h-4 w-4" />{t.search}</Button>
            <Button variant="outline" onClick={handlePrint} disabled={!showReport || processedData.entries.length === 0}>
              <Printer className="h-4 w-4 ml-2" />{t.print}
            </Button>
            <Button variant="outline" onClick={handleExcelExport} disabled={!showReport || processedData.entries.length === 0}>
              <FileSpreadsheet className="h-4 w-4 ml-2" />{t.fr_export_excel}
            </Button>
            <Button variant="ghost" onClick={() => { setSelectedAccountId(''); setStartDate(''); setEndDate(''); setDocumentType('all'); setShowReport(false); }}>
              <X className="h-4 w-4 ml-2" />{t.as_clear}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showReport && selectedAccountId && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                {t.as_title}: {selectedAccount?.name} ({selectedAccount?.code})
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {t.as_previous_balance}: <span className="font-bold text-foreground">{formatCurrency(processedData.openingBalance)}</span>
                </span>
                <span className="text-muted-foreground">
                  {t.as_closing_balance}: <span className="font-bold text-primary">{formatCurrency(processedData.closingBalance)}</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ledgerLoading ? (
              <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-center w-[60px]">{t.acc_entry_number}</TableHead>
                      <TableHead className="text-center w-[90px]">{t.je_col_date}</TableHead>
                      <TableHead className="text-right">{t.je_col_statement}</TableHead>
                      <TableHead className="text-center w-[80px]">{t.je_col_type}</TableHead>
                      <TableHead className="text-right w-[100px]">{t.acc_debit}</TableHead>
                      <TableHead className="text-right w-[100px]">{t.acc_credit}</TableHead>
                      <TableHead className="text-right w-[110px]">{t.acc_balance}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showOpeningBalance && (
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell>{t.as_previous_balance}</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">
                          {processedData.openingBalance < 0 ? formatCurrency(Math.abs(processedData.openingBalance)) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(processedData.openingBalance)}</TableCell>
                      </TableRow>
                    )}

                    {processedData.entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">{t.as_no_transactions}</TableCell>
                      </TableRow>
                    ) : (
                      processedData.entries.map((entry: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{entry.entry_number}</TableCell>
                          <TableCell className="text-center">{formatDate(entry.entry_date)}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-center text-xs">{getDocumentTypeLabel(entry.reference_type)}</TableCell>
                          <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600 dark:text-red-400">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </TableCell>
                          <TableCell className={cn("text-right font-mono font-medium", entry.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {formatCurrency(entry.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {processedData.entries.length > 0 && (
                      <TableRow className="bg-primary/10 font-bold border-t-2">
                        <TableCell colSpan={4} className="text-right">{t.total}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(processedData.totalDebit)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(processedData.totalCredit)}</TableCell>
                        <TableCell className={cn("text-right font-mono", processedData.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                          {formatCurrency(processedData.closingBalance)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!showReport && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>{t.as_select_prompt}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
