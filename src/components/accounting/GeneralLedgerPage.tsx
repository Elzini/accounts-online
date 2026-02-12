import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useAccounts, useGeneralLedger } from '@/hooks/useAccounting';
import { Loader2, BookOpen, CalendarIcon, FileText, Search, FileDown, Printer, Filter, Eye, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompany } from '@/contexts/CompanyContext';
import { LedgerPreviewDialog } from './LedgerPreviewDialog';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { createSimpleExcel, downloadExcelBuffer } from '@/lib/excelUtils';
import { useLanguage } from '@/contexts/LanguageContext';

export function GeneralLedgerPage() {
  const { t, direction } = useLanguage();
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { companyId } = useCompany();
  const { data: companySettings } = useCompanySettings(companyId || '');
  const { selectedFiscalYear, fiscalYearDateRange } = useFiscalYearFilter();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportType, setExportType] = useState<'print' | 'pdf' | 'excel'>('print');
  const printRef = useRef<HTMLDivElement>(null);
  
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: fiscalYearDateRange.startDate,
    to: fiscalYearDateRange.endDate || new Date(),
  });

  useEffect(() => {
    if (fiscalYearDateRange.startDate && fiscalYearDateRange.endDate) {
      setDateRange({
        from: fiscalYearDateRange.startDate,
        to: fiscalYearDateRange.endDate,
      });
    }
  }, [fiscalYearDateRange.startDate, fiscalYearDateRange.endDate]);

  const { data: ledger, isLoading: isLoadingLedger } = useGeneralLedger(
    selectedAccountId,
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );

  const companyName = companySettings?.app_name || 'Company';

  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return accounts;
    const query = accountSearch.toLowerCase();
    return accounts.filter(
      acc => acc.name.toLowerCase().includes(query) || 
             acc.code.toLowerCase().includes(query)
    );
  }, [accounts, accountSearch]);

  const filteredEntries = useMemo(() => {
    if (!ledger?.entries) return [];
    let entries = ledger.entries;
    if (transactionFilter !== 'all') {
      entries = entries.filter(e => e.reference_type === transactionFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        e => e.description.toLowerCase().includes(query) ||
             String(e.entry_number).includes(query)
      );
    }
    return entries;
  }, [ledger?.entries, searchQuery, transactionFilter]);

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      assets: t.coa_type_assets,
      liabilities: t.coa_type_liabilities,
      equity: t.coa_type_equity,
      revenue: t.coa_type_revenue,
      expenses: t.coa_type_expenses,
    };
    return types[type] || type;
  };

  const getReferenceTypeBadge = (type: string | null) => {
    switch (type) {
      case 'sale':
        return <Badge variant="default" className="bg-green-500">{t.je_type_sales}</Badge>;
      case 'purchase':
        return <Badge variant="default" className="bg-blue-500">{t.je_type_purchases}</Badge>;
      case 'expense':
        return <Badge variant="default" className="bg-orange-500">{t.je_type_expenses}</Badge>;
      case 'manual':
        return <Badge variant="secondary">{t.je_type_manual}</Badge>;
      default:
        return <Badge variant="outline">{t.gl_general}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!ledger) return;
    const data = [
      [t.gl_title],
      [`${t.acc_account}: ${ledger.account.code} - ${ledger.account.name}`],
      [`${t.gl_period_from} ${dateRange.from ? format(dateRange.from, 'yyyy/MM/dd') : '-'} ${t.gl_to} ${dateRange.to ? format(dateRange.to, 'yyyy/MM/dd') : '-'}`],
      [],
      [t.je_col_date, t.acc_entry_number, t.je_col_statement, t.je_col_type, t.acc_debit, t.acc_credit, t.acc_balance],
      ['', '', t.gl_opening_balance, '', '', '', ledger.openingBalance],
      ...filteredEntries.map(entry => [
        format(new Date(entry.date), 'yyyy/MM/dd'),
        entry.entry_number,
        entry.description,
        entry.reference_type || t.gl_general,
        entry.debit > 0 ? entry.debit : '',
        entry.credit > 0 ? entry.credit : '',
        entry.balance,
      ]),
      ['', '', t.total, '', ledger.totalDebit, ledger.totalCredit, ledger.closingBalance],
    ];

    const buffer = await createSimpleExcel(t.gl_title, data, { rtl: true });
    downloadExcelBuffer(buffer, `${t.gl_title}_${ledger.account.code}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!ledger || !printRef.current) return;
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`${t.gl_title}_${ledger.account.code}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const escapeHtml = (text: string | number | null | undefined): string => {
    if (text === null || text === undefined) return '';
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const clonedContent = printContent.cloneNode(true) as HTMLElement;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>${t.gl_title} - ${escapeHtml(ledger?.account.name || '')}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; direction: rtl; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 18px; margin-bottom: 5px; }
            .header p { font-size: 12px; color: #666; }
            .text-left { text-align: left; }
            .positive { color: green; }
            .negative { color: red; }
            .bg-muted { background-color: #f9f9f9; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${clonedContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.gl_title}</h1>
        <p className="text-muted-foreground">{t.gl_subtitle}</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t.gl_select_account}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <Popover open={showAccountDropdown && filteredAccounts.length > 0} onOpenChange={setShowAccountDropdown}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <Input
                      placeholder={t.gl_search_placeholder}
                      value={accountSearch}
                      onChange={(e) => { setAccountSearch(e.target.value); setShowAccountDropdown(true); }}
                      onFocus={() => setShowAccountDropdown(true)}
                      className="pr-10"
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                  <Command>
                    <CommandList>
                      <CommandEmpty>{t.gl_no_results}</CommandEmpty>
                      <CommandGroup heading={t.gl_matching_accounts}>
                        <ScrollArea className="h-[250px]">
                          {filteredAccounts.slice(0, 20).map((account) => (
                            <CommandItem
                              key={account.id}
                              value={account.id}
                              onSelect={() => {
                                setSelectedAccountId(account.id);
                                setAccountSearch(`${account.code} - ${account.name}`);
                                setShowAccountDropdown(false);
                              }}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-muted-foreground">{account.code}</span>
                                <span>{account.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{getAccountTypeLabel(account.type)}</Badge>
                                {selectedAccountId === account.id && <Check className="w-4 h-4 text-primary" />}
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <div className="flex gap-2 mt-2 flex-wrap">
                {['assets', 'liabilities', 'equity', 'revenue', 'expenses'].map((type) => (
                  <Button key={type} variant="outline" size="sm" className="text-xs" onClick={() => { setAccountSearch(getAccountTypeLabel(type)); setShowAccountDropdown(true); }}>
                    {getAccountTypeLabel(type)}
                  </Button>
                ))}
                {accountSearch && (
                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => { setAccountSearch(''); setSelectedAccountId(null); }}>
                    {t.gl_clear}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : t.gl_from}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange({ ...dateRange, from: date })} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "yyyy/MM/dd") : t.gl_to}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange({ ...dateRange, to: date })} className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Content */}
      {!selectedAccountId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t.gl_select_prompt}</p>
            </div>
          </CardContent>
        </Card>
      ) : isLoadingLedger ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : ledger ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span className="font-mono">{ledger.account.code}</span>
                  {ledger.account.name}
                </CardTitle>
                <CardDescription>
                  {getAccountTypeLabel(ledger.account.type)}
                  {ledger.account.description && ` - ${ledger.account.description}`}
                </CardDescription>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => { setExportType('excel'); setPreviewOpen(true); }} className="gap-2">
                  <Eye className="w-4 h-4" /><FileDown className="w-4 h-4" />Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setExportType('pdf'); setPreviewOpen(true); }} className="gap-2">
                  <Eye className="w-4 h-4" /><FileDown className="w-4 h-4" />PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setExportType('print'); setPreviewOpen(true); }} className="gap-2">
                  <Eye className="w-4 h-4" /><Printer className="w-4 h-4" />{t.print}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={t.gl_search_transactions} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
              </div>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.gl_all_transactions}</SelectItem>
                  <SelectItem value="sale">{t.je_type_sales}</SelectItem>
                  <SelectItem value="purchase">{t.je_type_purchases}</SelectItem>
                  <SelectItem value="expense">{t.je_type_expenses}</SelectItem>
                  <SelectItem value="manual">{t.je_type_manual}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            <div ref={printRef}>
              <div className="hidden print:block header mb-4">
                <h1 className="text-xl font-bold text-center">{t.gl_title}</h1>
                <p className="text-center text-muted-foreground">{ledger.account.code} - {ledger.account.name}</p>
                <p className="text-center text-sm text-muted-foreground">
                  {t.gl_period_from} {dateRange.from ? format(dateRange.from, 'yyyy/MM/dd') : '-'} {t.gl_to} {dateRange.to ? format(dateRange.to, 'yyyy/MM/dd') : '-'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">{t.gl_opening_balance}</p>
                  <p className={cn("text-xl font-bold", ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(ledger.openingBalance)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600">{t.gl_total_debit}</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(ledger.totalDebit)}</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-600">{t.gl_total_credit}</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(ledger.totalCredit)}</p>
                </div>
                <div className={cn("p-4 rounded-lg border", ledger.closingBalance >= 0 ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800")}>
                  <p className={cn("text-sm", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>{t.gl_closing_balance}</p>
                  <p className={cn("text-xl font-bold", ledger.closingBalance >= 0 ? "text-green-700" : "text-red-700")}>{formatCurrency(ledger.closingBalance)}</p>
                </div>
              </div>

              {filteredEntries.length === 0 && !searchQuery && transactionFilter === 'all' ? (
                <p className="text-center text-muted-foreground py-8">{t.gl_no_transactions}</p>
              ) : filteredEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t.gl_no_match_search}</p>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    {t.gl_showing} {filteredEntries.length} {t.gl_of} {ledger.entries.length} {t.gl_transactions}
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">{t.je_col_date}</TableHead>
                          <TableHead className="w-20">{t.acc_entry_number}</TableHead>
                          <TableHead>{t.je_col_statement}</TableHead>
                          <TableHead className="w-20">{t.je_col_type}</TableHead>
                          <TableHead className="w-28 text-left">{t.acc_debit}</TableHead>
                          <TableHead className="w-28 text-left">{t.acc_credit}</TableHead>
                          <TableHead className="w-32 text-left">{t.acc_balance}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-medium">{t.gl_opening_balance}</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className={cn("text-left font-medium", ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(ledger.openingBalance)}
                          </TableCell>
                        </TableRow>
                        
                        {filteredEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{format(new Date(entry.date), "yyyy/MM/dd")}</TableCell>
                            <TableCell className="font-mono">{entry.entry_number}</TableCell>
                            <TableCell className="max-w-[300px] truncate" title={entry.description}>{entry.description}</TableCell>
                            <TableCell>{getReferenceTypeBadge(entry.reference_type)}</TableCell>
                            <TableCell className="text-left font-mono">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</TableCell>
                            <TableCell className="text-left font-mono">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</TableCell>
                            <TableCell className={cn("text-left font-medium font-mono", entry.balance >= 0 ? "text-green-600" : "text-red-600")}>
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-medium">{t.gl_closing_balance}</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className={cn("text-left font-bold", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(ledger.closingBalance)}
                          </TableCell>
                        </TableRow>
                        
                        <TableRow className="bg-primary/10 font-bold">
                          <TableCell colSpan={4}>{t.total}</TableCell>
                          <TableCell className="text-left font-mono">{formatCurrency(ledger.totalDebit)}</TableCell>
                          <TableCell className="text-left font-mono">{formatCurrency(ledger.totalCredit)}</TableCell>
                          <TableCell className={cn("text-left font-mono", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(ledger.closingBalance)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">{t.gl_opening_balance}</p>
                      <p className={cn("text-lg font-bold", ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(ledger.openingBalance)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-600">{t.gl_total_debit}</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(ledger.totalDebit)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-600">{t.gl_total_credit}</p>
                      <p className="text-lg font-bold text-orange-700">{formatCurrency(ledger.totalCredit)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-purple-600">{t.gl_transaction_count}</p>
                      <p className="text-lg font-bold text-purple-700">{filteredEntries.length}</p>
                    </div>
                    <div className={cn("p-4 rounded-lg border", ledger.closingBalance >= 0 ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800")}>
                      <p className={cn("text-sm", ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600")}>{t.gl_closing_balance}</p>
                      <p className={cn("text-lg font-bold", ledger.closingBalance >= 0 ? "text-green-700" : "text-red-700")}>{formatCurrency(ledger.closingBalance)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <LedgerPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        ledger={ledger || null}
        entries={filteredEntries}
        dateRange={dateRange}
        exportType={exportType}
        onConfirm={() => {
          setPreviewOpen(false);
          if (exportType === 'print') handlePrint();
          else if (exportType === 'pdf') handleExportPDF();
          else handleExportExcel();
        }}
        companyName={companyName}
      />
    </div>
  );
}
