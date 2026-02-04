import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Printer, FileDown, FileSpreadsheet, Wallet, Building2, Users, CreditCard, Package, TrendingUp, TrendingDown, Landmark, Check, ChevronsUpDown, ArrowLeft, X, Calendar } from 'lucide-react';
import { useAccounts, useGeneralLedger } from '@/hooks/useAccounting';
import { usePrintReport } from '@/hooks/usePrintReport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AccountMovementReport() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: ledgerData, isLoading: ledgerLoading } = useGeneralLedger(
    selectedAccountId || null,
    startDate || undefined,
    endDate || undefined
  );

  const { printReport } = usePrintReport();
  const { exportToPdf } = usePdfExport();
  const { exportToExcel } = useExcelExport();

  // All accounts sorted by code
  const allAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts]);

  // Quick access accounts (Cash, Bank, Partner, POS)
  const quickAccounts = useMemo(() => {
    return accounts.filter(account => {
      const code = account.code;
      return (
        code.startsWith('110') || // Cash accounts
        code.startsWith('111') || // Bank accounts
        code === '3102' || // Partner current account
        code.startsWith('112') // POS accounts
      );
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts]);

  // Filtered accounts based on search
  const filteredAccounts = useMemo(() => {
    if (!searchQuery) return allAccounts;
    const query = searchQuery.toLowerCase();
    return allAccounts.filter(account => 
      account.code.toLowerCase().includes(query) ||
      account.name.toLowerCase().includes(query)
    );
  }, [allAccounts, searchQuery]);

  // Group accounts by type
  const groupedAccounts = useMemo(() => {
    const groups: Record<string, typeof filteredAccounts> = {
      assets: [],
      liabilities: [],
      equity: [],
      revenue: [],
      expenses: [],
    };
    
    filteredAccounts.forEach(account => {
      if (groups[account.type]) {
        groups[account.type].push(account);
      }
    });
    
    return groups;
  }, [filteredAccounts]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const getAccountIcon = (type: string, code: string) => {
    if (code.startsWith('110')) return <Wallet className="h-4 w-4 shrink-0" />;
    if (code.startsWith('111')) return <Building2 className="h-4 w-4 shrink-0" />;
    if (code.startsWith('112')) return <CreditCard className="h-4 w-4 shrink-0" />;
    if (code === '3102') return <Users className="h-4 w-4 shrink-0" />;
    if (code.startsWith('13')) return <Package className="h-4 w-4 shrink-0" />;
    
    switch (type) {
      case 'assets': return <Wallet className="h-4 w-4 shrink-0" />;
      case 'liabilities': return <Landmark className="h-4 w-4 shrink-0" />;
      case 'equity': return <Users className="h-4 w-4 shrink-0" />;
      case 'revenue': return <TrendingUp className="h-4 w-4 shrink-0" />;
      case 'expenses': return <TrendingDown className="h-4 w-4 shrink-0" />;
      default: return <Wallet className="h-4 w-4 shrink-0" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'assets': return 'أصول';
      case 'liabilities': return 'خصوم';
      case 'equity': return 'حقوق ملكية';
      case 'revenue': return 'إيرادات';
      case 'expenses': return 'مصروفات';
      default: return 'حساب';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA');
  };

  const formatInputDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Calculate totals and running balance
  const processedData = useMemo(() => {
    if (!ledgerData?.entries) return { entries: [], openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0 };

    let runningBalance = ledgerData.openingBalance || 0;
    const entries = ledgerData.entries.map((entry: any) => {
      runningBalance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance,
      };
    });

    return {
      entries,
      openingBalance: ledgerData.openingBalance || 0,
      totalDebit: ledgerData.totalDebit || 0,
      totalCredit: ledgerData.totalCredit || 0,
      closingBalance: runningBalance,
    };
  }, [ledgerData]);

  const columns = [
    { header: 'التاريخ', key: 'date' },
    { header: 'رقم القيد', key: 'entryNumber' },
    { header: 'البيان', key: 'description' },
    { header: 'مدين', key: 'debit' },
    { header: 'دائن', key: 'credit' },
    { header: 'الرصيد', key: 'balance' },
  ];

  const exportData = processedData.entries.map((entry: any) => ({
    date: formatDate(entry.entry_date),
    entryNumber: entry.entry_number,
    description: entry.description,
    debit: entry.debit > 0 ? formatCurrency(entry.debit) : '-',
    credit: entry.credit > 0 ? formatCurrency(entry.credit) : '-',
    balance: formatCurrency(entry.balance),
  }));

  const summaryData = [
    { label: 'الرصيد الافتتاحي', value: formatCurrency(processedData.openingBalance) },
    { label: 'إجمالي المدين', value: formatCurrency(processedData.totalDebit) },
    { label: 'إجمالي الدائن', value: formatCurrency(processedData.totalCredit) },
    { label: 'الرصيد الختامي', value: formatCurrency(processedData.closingBalance) },
  ];

  const handlePrint = () => {
    if (!selectedAccount) return;
    printReport({
      title: `حركة حساب: ${selectedAccount.name}`,
      subtitle: `${startDate ? `من ${formatDate(startDate)}` : ''} ${endDate ? `إلى ${formatDate(endDate)}` : ''}`.trim() || 'جميع الفترات',
      columns,
      data: exportData,
      summaryCards: summaryData,
    });
  };

  const handlePdfExport = () => {
    if (!selectedAccount) return;
    exportToPdf({
      title: `حركة حساب: ${selectedAccount.name}`,
      subtitle: `${startDate ? `من ${formatDate(startDate)}` : ''} ${endDate ? `إلى ${formatDate(endDate)}` : ''}`.trim() || 'جميع الفترات',
      columns,
      data: exportData,
      summaryCards: summaryData,
      fileName: `account-movement-${selectedAccount.code}`,
    });
  };

  const handleExcelExport = () => {
    if (!selectedAccount) return;
    exportToExcel({
      title: `حركة حساب: ${selectedAccount.name}`,
      columns,
      data: exportData,
      fileName: `account-movement-${selectedAccount.code}`,
      summaryData,
    });
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Green Header Section */}
      <div className="bg-gradient-to-l from-emerald-600 to-emerald-500 rounded-xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-3">
              <Wallet className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">تقرير حركة الحسابات</h1>
              <p className="text-emerald-100 text-sm mt-1">
                عرض حركة جميع الحسابات مع الرصيد الحالي
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-white rounded-xl p-3 flex flex-wrap items-center gap-3 text-foreground shadow-lg">
            {/* Print & Export Buttons */}
            <div className="flex items-center gap-1 border-l pl-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                onClick={handlePrint}
                disabled={!selectedAccountId || processedData.entries.length === 0}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    disabled={!selectedAccountId || processedData.entries.length === 0}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePdfExport}>
                    <FileDown className="h-4 w-4 ml-2" />
                    تصدير PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExcelExport}>
                    <FileSpreadsheet className="h-4 w-4 ml-2" />
                    تصدير Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-36 text-sm border-emerald-200 focus:border-emerald-400 pl-8"
                  dir="ltr"
                />
                {endDate && (
                  <button
                    onClick={() => setEndDate('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-36 text-sm border-emerald-200 focus:border-emerald-400 pl-8"
                  dir="ltr"
                />
                {startDate && (
                  <button
                    onClick={() => setStartDate('')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Account Selector */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-48 justify-between h-9 border-emerald-200 hover:border-emerald-400"
                >
                  {selectedAccount ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-muted-foreground text-xs">{selectedAccount.code}</span>
                      <span className="truncate text-sm">{selectedAccount.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">اختر حساب...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-popover border shadow-lg z-50" align="start">
                <Command>
                  <CommandInput 
                    placeholder="ابحث برقم أو اسم الحساب..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="h-10"
                  />
                  <CommandList>
                    <CommandEmpty>لا توجد نتائج</CommandEmpty>
                    <ScrollArea className="h-[300px]">
                      {Object.entries(groupedAccounts).map(([type, accts]) => (
                        accts.length > 0 && (
                          <CommandGroup key={type} heading={getTypeLabel(type)}>
                            {accts.map((account) => (
                              <CommandItem
                                key={account.id}
                                value={`${account.code} ${account.name}`}
                                onSelect={() => {
                                  setSelectedAccountId(account.id);
                                  setOpen(false);
                                  setSearchQuery('');
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedAccountId === account.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center gap-2 flex-1">
                                  {getAccountIcon(account.type, account.code)}
                                  <span className="text-muted-foreground font-mono text-sm">{account.code}</span>
                                  <span className="truncate">{account.name}</span>
                                </div>
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
        </div>
      </div>

      {/* Quick Account Selection */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground self-center ml-2">اختصارات:</span>
        {quickAccounts.slice(0, 6).map((account) => (
          <Button
            key={account.id}
            variant={selectedAccountId === account.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedAccountId(account.id)}
            className={cn(
              "flex items-center gap-2",
              selectedAccountId === account.id && "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {getAccountIcon(account.type, account.code)}
            {account.name}
          </Button>
        ))}
      </div>

      {selectedAccountId && (
        <>
          {/* Summary Cards - Bank Statement Style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 rounded-xl overflow-hidden border shadow-sm">
            {/* Opening Balance */}
            <div className="bg-white p-4 border-l">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                الرصيد الافتتاحي
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(processedData.openingBalance)}</p>
            </div>
            
            {/* Total Debit (like deposits) */}
            <div className="bg-emerald-50 p-4 border-l">
              <div className="flex items-center gap-2 text-emerald-600 text-sm mb-2">
                <TrendingDown className="h-4 w-4" />
                إجمالي المدين
              </div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(processedData.totalDebit)}</p>
            </div>
            
            {/* Total Credit (like withdrawals) */}
            <div className="bg-rose-50 p-4 border-l">
              <div className="flex items-center gap-2 text-rose-600 text-sm mb-2">
                <TrendingUp className="h-4 w-4" />
                إجمالي الدائن
              </div>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(processedData.totalCredit)}</p>
            </div>
            
            {/* Closing Balance */}
            <div className={cn(
              "p-4",
              processedData.closingBalance >= 0 ? "bg-emerald-600" : "bg-amber-500"
            )}>
              <div className="text-white/80 text-sm mb-2">الرصيد الختامي</div>
              <p className="text-2xl font-bold text-white">{formatCurrency(processedData.closingBalance)}</p>
            </div>
          </div>

          {/* Transactions Table */}
          {ledgerLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700 hover:bg-slate-700">
                    <TableHead className="text-right text-white font-medium">التاريخ</TableHead>
                    <TableHead className="text-right text-white font-medium">البيان / الوصف</TableHead>
                    <TableHead className="text-right text-emerald-300 font-medium">مدين</TableHead>
                    <TableHead className="text-right text-rose-300 font-medium">دائن</TableHead>
                    <TableHead className="text-right text-white font-medium">الرصيد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance Row */}
                  <TableRow className="bg-muted/30">
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                        <span className="font-medium">رصيد افتتاحي (Balance Forward)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell className="font-medium">{formatCurrency(processedData.openingBalance)}</TableCell>
                  </TableRow>

                  {processedData.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        لا توجد حركات لهذا الحساب في الفترة المحددة
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedData.entries.map((entry: any, index: number) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="text-muted-foreground">{formatDate(entry.entry_date)}</TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-xs ml-2">#{entry.entry_number}</span>
                          {entry.description}
                        </TableCell>
                        <TableCell className={entry.debit > 0 ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </TableCell>
                        <TableCell className={entry.credit > 0 ? 'text-rose-600 font-medium' : 'text-muted-foreground'}>
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(entry.balance)}</TableCell>
                      </TableRow>
                    ))
                  )}

                  {/* Totals Row */}
                  <TableRow className="bg-amber-50 font-bold border-t-2 border-amber-200">
                    <TableCell colSpan={2} className="text-right">الإجماليات</TableCell>
                    <TableCell className="text-emerald-600">{formatCurrency(processedData.totalDebit)}</TableCell>
                    <TableCell className="text-rose-600">{formatCurrency(processedData.totalCredit)}</TableCell>
                    <TableCell className={processedData.closingBalance >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {formatCurrency(processedData.closingBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {!selectedAccountId && (
        <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
          <Wallet className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">اختر حساباً لعرض حركاته</p>
          <p className="text-sm mt-2">استخدم القائمة أعلاه أو الاختصارات السريعة</p>
        </div>
      )}
    </div>
  );
}
