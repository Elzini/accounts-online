import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Printer, FileDown, FileSpreadsheet, Wallet, Building2, Users, CreditCard, Search, Package, TrendingUp, TrendingDown, Landmark, Check, ChevronsUpDown } from 'lucide-react';
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
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA');
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            تقرير حركة الحسابات
          </CardTitle>
          <CardDescription>
            عرض حركة جميع الحسابات مع الرصيد الحالي
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>اختر الحساب</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-10"
                  >
                    {selectedAccount ? (
                      <div className="flex items-center gap-2 truncate">
                        {getAccountIcon(selectedAccount.type, selectedAccount.code)}
                        <span className="text-muted-foreground">{selectedAccount.code}</span>
                        <span className="truncate">{selectedAccount.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">ابحث واختر حساب...</span>
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
            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                dir="ltr"
              />
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
                className="flex items-center gap-2"
              >
                {getAccountIcon(account.type, account.code)}
                {account.name}
              </Button>
            ))}
          </div>

          {selectedAccountId && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">الرصيد الافتتاحي</p>
                    <p className="text-xl font-bold">{formatCurrency(processedData.openingBalance)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(processedData.totalDebit)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(processedData.totalCredit)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(processedData.closingBalance)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Export Actions */}
              <div className="flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={processedData.entries.length === 0}>
                      <FileDown className="h-4 w-4 ml-2" />
                      تصدير التقرير
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="h-4 w-4 ml-2" />
                      طباعة
                    </DropdownMenuItem>
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

              {/* Transactions Table */}
              {ledgerLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">رقم القيد</TableHead>
                        <TableHead className="text-right">البيان</TableHead>
                        <TableHead className="text-right">مدين</TableHead>
                        <TableHead className="text-right">دائن</TableHead>
                        <TableHead className="text-right">الرصيد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Opening Balance Row */}
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>رصيد افتتاحي</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{formatCurrency(processedData.openingBalance)}</TableCell>
                      </TableRow>

                      {processedData.entries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            لا توجد حركات لهذا الحساب في الفترة المحددة
                          </TableCell>
                        </TableRow>
                      ) : (
                        processedData.entries.map((entry: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{formatDate(entry.entry_date)}</TableCell>
                            <TableCell>{entry.entry_number}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell className={entry.debit > 0 ? 'text-green-600 font-medium' : ''}>
                              {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                            </TableCell>
                            <TableCell className={entry.credit > 0 ? 'text-red-600 font-medium' : ''}>
                              {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(entry.balance)}</TableCell>
                          </TableRow>
                        ))
                      )}

                      {/* Closing Balance Row */}
                      <TableRow className="bg-primary/10 font-bold">
                        <TableCell colSpan={3}>الرصيد الختامي</TableCell>
                        <TableCell className="text-green-600">{formatCurrency(processedData.totalDebit)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(processedData.totalCredit)}</TableCell>
                        <TableCell className="text-primary">{formatCurrency(processedData.closingBalance)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          {!selectedAccountId && (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>اختر حساباً لعرض حركاته</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
