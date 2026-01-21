import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccounts, useGeneralLedger } from '@/hooks/useAccounting';
import { Loader2, BookOpen, CalendarIcon, FileText, Search, FileDown, Printer, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompany } from '@/contexts/CompanyContext';

export function GeneralLedgerPage() {
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { companyId } = useCompany();
  const { data: companySettings } = useCompanySettings(companyId || '');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const printRef = useRef<HTMLDivElement>(null);
  
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const { data: ledger, isLoading: isLoadingLedger } = useGeneralLedger(
    selectedAccountId,
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );

  // Filter accounts based on search
  const filteredAccounts = useMemo(() => {
    if (!accountSearch) return accounts;
    const query = accountSearch.toLowerCase();
    return accounts.filter(
      acc => acc.name.toLowerCase().includes(query) || 
             acc.code.toLowerCase().includes(query)
    );
  }, [accounts, accountSearch]);

  // Filter ledger entries based on search and type
  const filteredEntries = useMemo(() => {
    if (!ledger?.entries) return [];
    
    let entries = ledger.entries;
    
    // Filter by transaction type
    if (transactionFilter !== 'all') {
      entries = entries.filter(e => e.reference_type === transactionFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        e => e.description.toLowerCase().includes(query) ||
             String(e.entry_number).includes(query)
      );
    }
    
    return entries;
  }, [ledger?.entries, searchQuery, transactionFilter]);

  const getReferenceTypeBadge = (type: string | null) => {
    switch (type) {
      case 'sale':
        return <Badge variant="default" className="bg-green-500">مبيعات</Badge>;
      case 'purchase':
        return <Badge variant="default" className="bg-blue-500">مشتريات</Badge>;
      case 'expense':
        return <Badge variant="default" className="bg-orange-500">مصروفات</Badge>;
      case 'manual':
        return <Badge variant="secondary">يدوي</Badge>;
      default:
        return <Badge variant="outline">عام</Badge>;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      assets: 'أصول',
      liabilities: 'خصوم',
      equity: 'حقوق الملكية',
      revenue: 'إيرادات',
      expenses: 'مصروفات',
    };
    return types[type] || type;
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
    
    const XLSX = await import('xlsx');
    
    const data = [
      // Header info
      ['دفتر الأستاذ العام'],
      [`الحساب: ${ledger.account.code} - ${ledger.account.name}`],
      [`النوع: ${getAccountTypeLabel(ledger.account.type)}`],
      [`الفترة: من ${dateRange.from ? format(dateRange.from, 'yyyy/MM/dd') : '-'} إلى ${dateRange.to ? format(dateRange.to, 'yyyy/MM/dd') : '-'}`],
      [],
      // Table headers
      ['التاريخ', 'رقم القيد', 'البيان', 'النوع', 'مدين', 'دائن', 'الرصيد'],
      // Opening balance
      ['', '', 'رصيد أول المدة', '', '', '', ledger.openingBalance],
      // Entries
      ...filteredEntries.map(entry => [
        format(new Date(entry.date), 'yyyy/MM/dd'),
        entry.entry_number,
        entry.description,
        entry.reference_type || 'عام',
        entry.debit > 0 ? entry.debit : '',
        entry.credit > 0 ? entry.credit : '',
        entry.balance,
      ]),
      // Totals
      ['', '', 'الإجمالي', '', ledger.totalDebit, ledger.totalCredit, ledger.closingBalance],
      [],
      // Summary
      ['ملخص الحساب'],
      ['رصيد أول المدة', ledger.openingBalance],
      ['إجمالي المدين', ledger.totalDebit],
      ['إجمالي الدائن', ledger.totalCredit],
      ['رصيد آخر المدة', ledger.closingBalance],
      ['عدد الحركات', filteredEntries.length],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'دفتر الأستاذ');
    XLSX.writeFile(wb, `دفتر_الأستاذ_${ledger.account.code}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!ledger || !printRef.current) return;
    
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    
    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
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

    pdf.save(`دفتر_الأستاذ_${ledger.account.code}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Print
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <title>دفتر الأستاذ - ${ledger?.account.name || ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 20px;
              direction: rtl;
            }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 18px; margin-bottom: 5px; }
            .header p { font-size: 12px; color: #666; }
            .summary { display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap; }
            .summary-item { flex: 1; min-width: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            .summary-item .label { font-size: 11px; color: #666; }
            .summary-item .value { font-size: 16px; font-weight: bold; }
            .text-left { text-align: left; }
            .positive { color: green; }
            .negative { color: red; }
            .bg-muted { background-color: #f9f9f9; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (isLoadingAccounts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">دفتر الأستاذ العام</h1>
        <p className="text-muted-foreground">عرض حركة كل حساب بالتفصيل</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            اختيار الحساب والفترة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Account Search & Select */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن حساب بالاسم أو الرمز..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="pr-10 mb-2"
                />
              </div>
              <Select
                value={selectedAccountId || ''}
                onValueChange={(value) => setSelectedAccountId(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحساب" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    {filteredAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="font-mono ml-2 text-muted-foreground">{account.code}</span>
                        {account.name}
                        <span className="text-xs text-muted-foreground mr-2">({getAccountTypeLabel(account.type)})</span>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "yyyy/MM/dd") : "من"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                <PopoverContent className="w-auto p-0" align="start">
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
        </CardContent>
      </Card>

      {/* Ledger Content */}
      {!selectedAccountId ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>اختر حساباً لعرض حركته</p>
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
              
              {/* Export Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
                  <FileDown className="w-4 h-4" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
                  <FileDown className="w-4 h-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" />
                  طباعة
                </Button>
              </div>
            </div>
            
            {/* Transaction Search & Filter */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث في الحركات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحركات</SelectItem>
                  <SelectItem value="sale">مبيعات</SelectItem>
                  <SelectItem value="purchase">مشتريات</SelectItem>
                  <SelectItem value="expense">مصروفات</SelectItem>
                  <SelectItem value="manual">يدوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Printable Content */}
            <div ref={printRef}>
              {/* Print Header */}
              <div className="hidden print:block header mb-4">
                <h1 className="text-xl font-bold text-center">دفتر الأستاذ العام</h1>
                <p className="text-center text-muted-foreground">
                  {ledger.account.code} - {ledger.account.name}
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  الفترة من {dateRange.from ? format(dateRange.from, 'yyyy/MM/dd') : '-'} إلى {dateRange.to ? format(dateRange.to, 'yyyy/MM/dd') : '-'}
                </p>
              </div>

              {/* Balance Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground">رصيد أول المدة</p>
                  <p className={cn(
                    "text-xl font-bold",
                    ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(ledger.openingBalance)} ر.س
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600">إجمالي المدين</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(ledger.totalDebit)} ر.س</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <p className="text-sm text-orange-600">إجمالي الدائن</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(ledger.totalCredit)} ر.س</p>
                </div>
                <div className={cn(
                  "p-4 rounded-lg border",
                  ledger.closingBalance >= 0 
                    ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                )}>
                  <p className={cn(
                    "text-sm",
                    ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                  )}>رصيد آخر المدة</p>
                  <p className={cn(
                    "text-xl font-bold",
                    ledger.closingBalance >= 0 ? "text-green-700" : "text-red-700"
                  )}>{formatCurrency(ledger.closingBalance)} ر.س</p>
                </div>
              </div>

              {filteredEntries.length === 0 && !searchQuery && transactionFilter === 'all' ? (
                <p className="text-center text-muted-foreground py-8">لا توجد حركات في هذه الفترة</p>
              ) : filteredEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد نتائج مطابقة للبحث</p>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    عرض {filteredEntries.length} من {ledger.entries.length} حركة
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">التاريخ</TableHead>
                          <TableHead className="w-20">رقم القيد</TableHead>
                          <TableHead>البيان</TableHead>
                          <TableHead className="w-20">النوع</TableHead>
                          <TableHead className="w-28 text-left">مدين</TableHead>
                          <TableHead className="w-28 text-left">دائن</TableHead>
                          <TableHead className="w-32 text-left">الرصيد</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Opening Balance Row */}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-medium">رصيد أول المدة</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className={cn(
                            "text-left font-medium",
                            ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(ledger.openingBalance)}
                          </TableCell>
                        </TableRow>
                        
                        {filteredEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{format(new Date(entry.date), "yyyy/MM/dd")}</TableCell>
                            <TableCell className="font-mono">{entry.entry_number}</TableCell>
                            <TableCell className="max-w-[300px] truncate" title={entry.description}>
                              {entry.description}
                            </TableCell>
                            <TableCell>{getReferenceTypeBadge(entry.reference_type)}</TableCell>
                            <TableCell className="text-left font-mono">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                            </TableCell>
                            <TableCell className="text-left font-mono">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                            </TableCell>
                            <TableCell className={cn(
                              "text-left font-medium font-mono",
                              entry.balance >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(entry.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Closing Balance Row */}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={4} className="font-medium">رصيد آخر المدة</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className="text-left">-</TableCell>
                          <TableCell className={cn(
                            "text-left font-bold",
                            ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(ledger.closingBalance)}
                          </TableCell>
                        </TableRow>
                        
                        {/* Totals Row */}
                        <TableRow className="bg-primary/10 font-bold">
                          <TableCell colSpan={4}>الإجمالي</TableCell>
                          <TableCell className="text-left font-mono">{formatCurrency(ledger.totalDebit)}</TableCell>
                          <TableCell className="text-left font-mono">{formatCurrency(ledger.totalCredit)}</TableCell>
                          <TableCell className={cn(
                            "text-left font-mono",
                            ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(ledger.closingBalance)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                    <div className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">رصيد أول المدة</p>
                      <p className={cn(
                        "text-lg font-bold",
                        ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>{formatCurrency(ledger.openingBalance)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-600">إجمالي المدين</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(ledger.totalDebit)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-orange-600">إجمالي الدائن</p>
                      <p className="text-lg font-bold text-orange-700">{formatCurrency(ledger.totalCredit)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-purple-600">عدد الحركات</p>
                      <p className="text-lg font-bold text-purple-700">{filteredEntries.length}</p>
                    </div>
                    <div className={cn(
                      "p-4 rounded-lg border",
                      ledger.closingBalance >= 0 
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" 
                        : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                    )}>
                      <p className={cn(
                        "text-sm",
                        ledger.closingBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}>رصيد آخر المدة</p>
                      <p className={cn(
                        "text-lg font-bold",
                        ledger.closingBalance >= 0 ? "text-green-700" : "text-red-700"
                      )}>{formatCurrency(ledger.closingBalance)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
