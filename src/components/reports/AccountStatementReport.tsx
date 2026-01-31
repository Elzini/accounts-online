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

export function AccountStatementReport() {
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

  // All accounts sorted by code
  const allAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => a.code.localeCompare(b.code));
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-CA'); // yyyy-MM-dd format
  };

  // Calculate totals and running balance
  const processedData = useMemo(() => {
    if (!ledgerData?.entries) return { entries: [], openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0 };

    let runningBalance = ledgerData.openingBalance || 0;
    const entries = ledgerData.entries
      .filter((entry: any) => {
        if (documentType === 'all') return true;
        return entry.reference_type === documentType;
      })
      .map((entry: any) => {
        runningBalance += entry.debit - entry.credit;
        return {
          ...entry,
          balance: runningBalance,
        };
      });

    return {
      entries,
      openingBalance: ledgerData.openingBalance || 0,
      totalDebit: entries.reduce((sum: number, e: any) => sum + (e.debit || 0), 0),
      totalCredit: entries.reduce((sum: number, e: any) => sum + (e.credit || 0), 0),
      closingBalance: runningBalance,
    };
  }, [ledgerData, documentType]);

  const handleSearch = () => {
    if (!selectedAccountId) {
      toast.error('يرجى اختيار حساب');
      return;
    }
    setShowReport(true);
  };

  const handlePrint = () => {
    if (!selectedAccount) return;

    const columns: UnifiedReportColumn[] = [
      { header: 'قيد رقم', key: 'entryNumber', align: 'center', width: '60px' },
      { header: 'التاريخ', key: 'date', align: 'center', width: '90px' },
      { header: 'البيان', key: 'description', align: 'right' },
      { header: 'النوع', key: 'type', align: 'center', width: '80px' },
      { header: 'رقم المستند', key: 'docNumber', align: 'center', width: '80px' },
      { header: 'رقم المرجع', key: 'refNumber', align: 'center', width: '80px' },
      { header: 'مدين', key: 'debit', align: 'right', type: 'currency', width: '100px' },
      { header: 'دائن', key: 'credit', align: 'right', type: 'currency', width: '100px' },
      { header: 'الرصيد', key: 'balance', align: 'right', type: 'currency', width: '110px' },
    ];

    const data: any[] = [];

    // Add opening balance row
    if (showOpeningBalance) {
      data.push({
        entryNumber: '',
        date: '',
        description: 'رصيد سابق',
        type: '',
        docNumber: '',
        refNumber: '',
        debit: '',
        credit: processedData.openingBalance < 0 ? Math.abs(processedData.openingBalance) : '',
        balance: processedData.openingBalance,
      });
    }

    // Add transaction rows
    processedData.entries.forEach((entry: any) => {
      data.push({
        entryNumber: entry.entry_number,
        date: formatDate(entry.entry_date),
        description: entry.description,
        type: getDocumentTypeLabel(entry.reference_type),
        docNumber: entry.reference_id ? entry.reference_id.slice(0, 8) : '',
        refNumber: entry.reference_number || '',
        debit: entry.debit > 0 ? entry.debit : '',
        credit: entry.credit > 0 ? entry.credit : '',
        balance: entry.balance,
      });
    });

    printReport({
      title: 'كشف حساب',
      headerInfo: [
        { label: 'رقم الحساب', value: selectedAccount.code },
        { label: 'اسم الحساب', value: selectedAccount.name },
        { label: 'من تاريخ', value: startDate || '-' },
        { label: 'إلى تاريخ', value: endDate || '-' },
      ],
      columns,
      data,
      showSignatures: false,
    });
  };

  const handleExcelExport = () => {
    if (!selectedAccount) return;

    const columns = [
      { header: 'قيد رقم', key: 'entryNumber' },
      { header: 'التاريخ', key: 'date' },
      { header: 'البيان', key: 'description' },
      { header: 'النوع', key: 'type' },
      { header: 'رقم المستند', key: 'docNumber' },
      { header: 'رقم المرجع', key: 'refNumber' },
      { header: 'مدين', key: 'debit' },
      { header: 'دائن', key: 'credit' },
      { header: 'الرصيد', key: 'balance' },
    ];

    const data: any[] = [];

    // Add opening balance row
    if (showOpeningBalance) {
      data.push({
        entryNumber: '',
        date: '',
        description: 'رصيد سابق',
        type: '',
        docNumber: '',
        refNumber: '',
        debit: 0,
        credit: processedData.openingBalance < 0 ? Math.abs(processedData.openingBalance) : 0,
        balance: processedData.openingBalance,
      });
    }

    // Add transaction rows
    processedData.entries.forEach((entry: any) => {
      data.push({
        entryNumber: entry.entry_number,
        date: formatDate(entry.entry_date),
        description: entry.description,
        type: getDocumentTypeLabel(entry.reference_type),
        docNumber: entry.reference_id ? entry.reference_id.slice(0, 8) : '',
        refNumber: entry.reference_number || '',
        debit: entry.debit > 0 ? entry.debit : 0,
        credit: entry.credit > 0 ? entry.credit : 0,
        balance: entry.balance,
      });
    });

    exportToExcel({
      title: `كشف حساب - ${selectedAccount.name}`,
      columns,
      data,
      fileName: `كشف_حساب_${selectedAccount.code}`,
      summaryData: [
        { label: 'الرصيد الافتتاحي', value: processedData.openingBalance },
        { label: 'إجمالي المدين', value: processedData.totalDebit },
        { label: 'إجمالي الدائن', value: processedData.totalCredit },
        { label: 'الرصيد الختامي', value: processedData.closingBalance },
      ],
    });
    toast.success('تم تصدير كشف الحساب بنجاح');
  };

  const getDocumentTypeLabel = (type: string | null) => {
    if (!type) return 'قيد يومية';
    switch (type) {
      case 'sale': return 'فاتورة بيع';
      case 'purchase': return 'فاتورة شراء';
      case 'expense': return 'مصروف';
      case 'voucher': return 'سند';
      case 'payroll': return 'رواتب';
      default: return 'قيد يومية';
    }
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            كشف حساب مفصل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Account Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم / اسم الحساب</Label>
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
                        <span className="text-muted-foreground font-mono">{selectedAccount.code}</span>
                        <span className="truncate">{selectedAccount.name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">اختر حساب...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="ابحث برقم أو اسم الحساب..." 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>لا توجد نتائج</CommandEmpty>
                      <ScrollArea className="h-[280px]">
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
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedAccountId === account.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
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
              <Label>نوع المستند</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="sale">فواتير البيع</SelectItem>
                  <SelectItem value="purchase">فواتير الشراء</SelectItem>
                  <SelectItem value="expense">المصروفات</SelectItem>
                  <SelectItem value="voucher">السندات</SelectItem>
                  <SelectItem value="payroll">الرواتب</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex items-end gap-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox 
                  id="openingBalance" 
                  checked={showOpeningBalance}
                  onCheckedChange={(checked) => setShowOpeningBalance(!!checked)}
                />
                <Label htmlFor="openingBalance" className="cursor-pointer">
                  إظهار الرصيد الافتتاحي
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              بحث
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={!showReport || processedData.entries.length === 0}>
              <Printer className="h-4 w-4 ml-2" />
              طباعة
            </Button>
            <Button variant="outline" onClick={handleExcelExport} disabled={!showReport || processedData.entries.length === 0}>
              <FileSpreadsheet className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                setSelectedAccountId('');
                setStartDate('');
                setEndDate('');
                setDocumentType('all');
                setShowReport(false);
              }}
            >
              <X className="h-4 w-4 ml-2" />
              مسح
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {showReport && selectedAccountId && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                كشف حساب: {selectedAccount?.name} ({selectedAccount?.code})
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  رصيد سابق: <span className="font-bold text-foreground">{formatCurrency(processedData.openingBalance)}</span>
                </span>
                <span className="text-muted-foreground">
                  رصيد نهائي: <span className="font-bold text-primary">{formatCurrency(processedData.closingBalance)}</span>
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {ledgerLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-center w-[60px]">قيد رقم</TableHead>
                      <TableHead className="text-center w-[90px]">التاريخ</TableHead>
                      <TableHead className="text-right">البيان</TableHead>
                      <TableHead className="text-center w-[80px]">النوع</TableHead>
                      <TableHead className="text-center w-[80px]">رقم المستند</TableHead>
                      <TableHead className="text-center w-[80px]">رقم المرجع</TableHead>
                      <TableHead className="text-right w-[100px]">مدين</TableHead>
                      <TableHead className="text-right w-[100px]">دائن</TableHead>
                      <TableHead className="text-right w-[110px]">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Opening Balance Row */}
                    {showOpeningBalance && (
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell>رصيد سابق</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-center">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">
                          {processedData.openingBalance < 0 ? formatCurrency(Math.abs(processedData.openingBalance)) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(processedData.openingBalance)}
                        </TableCell>
                      </TableRow>
                    )}

                    {processedData.entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          لا توجد حركات لهذا الحساب في الفترة المحددة
                        </TableCell>
                      </TableRow>
                    ) : (
                      processedData.entries.map((entry: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{entry.entry_number}</TableCell>
                          <TableCell className="text-center">{formatDate(entry.entry_date)}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-center text-xs">
                            {getDocumentTypeLabel(entry.reference_type)}
                          </TableCell>
                          <TableCell className="text-center text-xs">
                            {entry.reference_id ? entry.reference_id.slice(0, 8) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.reference_number || '-'}
                          </TableCell>
                          <TableCell className={cn("text-right", entry.debit > 0 && "text-emerald-600 font-medium")}>
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </TableCell>
                          <TableCell className={cn("text-right", entry.credit > 0 && "text-rose-600 font-medium")}>
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(entry.balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}

                    {/* Totals Row */}
                    {processedData.entries.length > 0 && (
                      <TableRow className="bg-primary/10 font-bold border-t-2">
                        <TableCell colSpan={6} className="text-right">الإجمالي</TableCell>
                        <TableCell className="text-right text-emerald-600">
                          {formatCurrency(processedData.totalDebit)}
                        </TableCell>
                        <TableCell className="text-right text-rose-600">
                          {formatCurrency(processedData.totalCredit)}
                        </TableCell>
                        <TableCell className="text-right text-primary">
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

      {/* Empty State */}
      {!showReport && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>اختر حساباً ثم اضغط على "بحث" لعرض كشف الحساب</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
