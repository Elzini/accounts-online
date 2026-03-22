import { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useComprehensiveTrialBalance } from '@/hooks/useAccounting';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useCompany } from '@/contexts/CompanyContext';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { Loader2, Search, Printer, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { plainFormat } from '@/components/financial-statements/utils/numberFormatting';

const fmt = (n: number) => plainFormat(n);

type DisplayMode = 'all' | 'leaf' | 'parent';

export function TrialBalancePage() {
  const { company } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();

  // Date state – initialised from fiscal year
  const [startDate, setStartDate] = useState(selectedFiscalYear?.start_date || '');
  const [endDate, setEndDate] = useState(selectedFiscalYear?.end_date || '');

  // Lazy-fetch: only query when user clicks "بحث"
  const [queryDates, setQueryDates] = useState({ start: selectedFiscalYear?.start_date || '', end: selectedFiscalYear?.end_date || '' });
  const { data: trialData, isLoading } = useComprehensiveTrialBalance(queryDates.start || undefined, queryDates.end || undefined);

  const [search, setSearch] = useState('');
  const [hideZero, setHideZero] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('all');
  const tableRef = useRef<HTMLDivElement>(null);
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

  const handleSearch = () => {
    setQueryDates({ start: startDate, end: endDate });
  };

  const filteredAccounts = useMemo(() => {
    if (!trialData) return [];
    let accounts = trialData.accounts;
    if (hideZero) {
      accounts = accounts.filter(item =>
        item.openingDebit > 0 || item.openingCredit > 0 ||
        item.periodDebit > 0 || item.periodCredit > 0 ||
        item.closingDebit > 0 || item.closingCredit > 0
      );
    }
    if (displayMode === 'leaf') {
      accounts = accounts.filter(item => !item.isParent);
    } else if (displayMode === 'parent') {
      accounts = accounts.filter(item => item.isParent);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      accounts = accounts.filter(item =>
        item.account.name.toLowerCase().includes(q) ||
        item.account.code.toLowerCase().includes(q)
      );
    }
    return accounts;
  }, [trialData, search, hideZero, displayMode]);

  const getStatusLabel = (debit: number, credit: number) => {
    if (debit > credit) return 'مدين';
    if (credit > debit) return 'دائن';
    return '-';
  };

  const getNetBalance = (debit: number, credit: number) => Math.abs(debit - credit);

  // Compute bottom totals from filtered data
  const totals = useMemo(() => {
    if (!trialData) return null;
    const t = {
      openingDebit: 0, openingCredit: 0,
      periodDebit: 0, periodCredit: 0,
      totalDebit: 0, totalCredit: 0,
    };
    // Use leaf-only accounts for totals to avoid double-counting
    const leafAccounts = trialData.accounts.filter(a => !a.isParent);
    const filtered = hideZero
      ? leafAccounts.filter(a => a.openingDebit > 0 || a.openingCredit > 0 || a.periodDebit > 0 || a.periodCredit > 0 || a.closingDebit > 0 || a.closingCredit > 0)
      : leafAccounts;
    filtered.forEach(item => {
      t.openingDebit += item.openingDebit;
      t.openingCredit += item.openingCredit;
      t.periodDebit += item.periodDebit;
      t.periodCredit += item.periodCredit;
      t.totalDebit += item.openingDebit + item.periodDebit;
      t.totalCredit += item.openingCredit + item.periodCredit;
    });
    return t;
  }, [trialData, hideZero]);

  const handleExport = (type: 'print' | 'excel' | 'pdf') => {
    if (!trialData || !totals) return;
    const columns = [
      { header: 'اسم الحساب', key: 'name' },
      { header: 'مدين', key: 'openingDebit' }, { header: 'دائن', key: 'openingCredit' },
      { header: 'مدين', key: 'periodDebit' }, { header: 'دائن', key: 'periodCredit' },
      { header: 'الحالة', key: 'status' }, { header: 'الرصيد', key: 'netBalance' },
      { header: 'مدين', key: 'totalDebit' }, { header: 'دائن', key: 'totalCredit' },
    ];
    const data = filteredAccounts.map(item => {
      const tD = item.openingDebit + item.periodDebit;
      const tC = item.openingCredit + item.periodCredit;
      return {
        name: `${item.account.code} - ${item.account.name}`,
        openingDebit: item.openingDebit > 0 ? fmt(item.openingDebit) : '-',
        openingCredit: item.openingCredit > 0 ? fmt(item.openingCredit) : '-',
        periodDebit: item.periodDebit > 0 ? fmt(item.periodDebit) : '-',
        periodCredit: item.periodCredit > 0 ? fmt(item.periodCredit) : '-',
        status: getStatusLabel(tD, tC),
        netBalance: getNetBalance(tD, tC) > 0 ? fmt(getNetBalance(tD, tC)) : '-',
        totalDebit: tD > 0 ? fmt(tD) : '-',
        totalCredit: tC > 0 ? fmt(tC) : '-',
      };
    });
    data.push({
      name: 'الإجمالي',
      openingDebit: fmt(totals.openingDebit), openingCredit: fmt(totals.openingCredit),
      periodDebit: fmt(totals.periodDebit), periodCredit: fmt(totals.periodCredit),
      status: '', netBalance: '',
      totalDebit: fmt(totals.totalDebit), totalCredit: fmt(totals.totalCredit),
    });
    const title = `ميزان المراجعة - ${company?.name || ''}`;
    const subtitle = queryDates.start && queryDates.end ? `من ${queryDates.start} إلى ${queryDates.end}` : undefined;
    const summaryCards = [
      { label: 'الرصيد السابق - مدين', value: fmt(totals.openingDebit) },
      { label: 'الرصيد السابق - دائن', value: fmt(totals.openingCredit) },
      { label: 'الحركة - مدين', value: fmt(totals.periodDebit) },
      { label: 'الحركة - دائن', value: fmt(totals.periodCredit) },
      { label: 'الإجمالي - مدين', value: fmt(totals.totalDebit) },
      { label: 'الإجمالي - دائن', value: fmt(totals.totalCredit) },
    ];
    const columnGroups = [
      { label: 'الرصيد السابق', colSpan: 2 },
      { label: 'الحركة', colSpan: 4 },
      { label: 'الإجمالي', colSpan: 2 },
    ];
    if (type === 'print') printReport({ title, subtitle, columns, data, summaryCards, columnGroups });
    else if (type === 'excel') exportToExcel({ title, columns, data, fileName: 'trial-balance', summaryData: summaryCards.map(c => ({ label: c.label, value: c.value })) });
    else exportToPdf({ title, subtitle, columns, data, fileName: 'trial-balance', summaryCards });
  };

  return (
    <div className="space-y-3" dir="rtl">
      {/* Header / Toolbar */}
      <Card>
        <CardContent className="py-3 px-4">
          {/* Row 1: Company + dates */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="font-bold text-base">{company?.name || ''}</span>
            <div className="flex items-center gap-1.5 mr-auto">
              <label className="text-sm text-muted-foreground whitespace-nowrap">من تاريخ</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40 h-8 text-sm" />
              <label className="text-sm text-muted-foreground whitespace-nowrap">إلى</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40 h-8 text-sm" />
            </div>
          </div>
          {/* Row 2: Filters + actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={displayMode} onValueChange={v => setDisplayMode(v as DisplayMode)}>
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue placeholder="عرض" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="leaf">حسابات فرعية فقط</SelectItem>
                <SelectItem value="parent">حسابات رئيسية فقط</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5">
              <Checkbox id="hideZero" checked={hideZero} onCheckedChange={v => setHideZero(!!v)} />
              <label htmlFor="hideZero" className="text-sm cursor-pointer whitespace-nowrap">حسابات غير صفرية</label>
            </div>

            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-8 w-44 h-8 text-sm" />
            </div>

            <Button size="sm" className="h-8 gap-1.5" onClick={handleSearch}>
              <Search className="w-3.5 h-3.5" />بحث
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5"><Download className="w-3.5 h-3.5" />تصدير</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleExport('print')} className="gap-2 cursor-pointer"><Printer className="w-4 h-4" />طباعة</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer"><FileText className="w-4 h-4" />PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer"><FileSpreadsheet className="w-4 h-4" />Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div ref={tableRef} className="min-w-[1100px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead rowSpan={2} className="text-center border bg-muted/80 sticky right-0 z-10 min-w-[220px]">اسم الحساب</TableHead>
                      <TableHead colSpan={2} className="text-center border bg-sky-100 dark:bg-sky-900/30 font-bold">الرصيد السابق</TableHead>
                      <TableHead colSpan={4} className="text-center border bg-emerald-100 dark:bg-emerald-900/30 font-bold">الحركة</TableHead>
                      <TableHead colSpan={2} className="text-center border bg-amber-100 dark:bg-amber-900/30 font-bold">الإجمالي</TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/20">
                      <TableHead className="text-center border bg-sky-50 dark:bg-sky-900/20 w-[105px]">مدين</TableHead>
                      <TableHead className="text-center border bg-sky-50 dark:bg-sky-900/20 w-[105px]">دائن</TableHead>
                      <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[105px]">مدين</TableHead>
                      <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[105px]">دائن</TableHead>
                      <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[65px]">الحالة</TableHead>
                      <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[105px]">الرصيد</TableHead>
                      <TableHead className="text-center border bg-amber-50 dark:bg-amber-900/20 w-[105px]">مدين</TableHead>
                      <TableHead className="text-center border bg-amber-50 dark:bg-amber-900/20 w-[105px]">دائن</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.length === 0 ? (
                      <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-12">لا توجد بيانات</TableCell></TableRow>
                    ) : (
                      filteredAccounts.map(item => {
                        const indent = (item.level || 0) * 16;
                        const isParent = item.isParent;
                        const totalD = item.openingDebit + item.periodDebit;
                        const totalC = item.openingCredit + item.periodCredit;
                        const status = getStatusLabel(totalD, totalC);
                        const netBal = getNetBalance(totalD, totalC);
                        return (
                          <TableRow key={item.account.id} className={cn(isParent && 'bg-muted/40 font-bold', !isParent && 'hover:bg-muted/20')}>
                            <TableCell className={cn("border sticky right-0 z-10 bg-background", isParent && "bg-muted/40 font-bold")} style={{ paddingRight: `${indent + 12}px` }}>
                              <span className="text-muted-foreground font-mono text-xs ml-2">{item.account.code}</span>
                              {item.account.name}
                            </TableCell>
                            {/* أعمدة مدين/دائن الأصلية من الصورة المرجعية */}
                            <TableCell className="text-center border tabular-nums text-xs">{item.account.code}</TableCell>
                            <TableCell className="text-center border tabular-nums text-xs">-</TableCell>
                            {/* الرصيد السابق */}
                            <TableCell className="text-center border tabular-nums text-sm">{item.openingDebit > 0 ? fmt(item.openingDebit) : '-'}</TableCell>
                            <TableCell className="text-center border tabular-nums text-sm">{item.openingCredit > 0 ? fmt(item.openingCredit) : '-'}</TableCell>
                            {/* الحركة */}
                            <TableCell className="text-center border tabular-nums text-sm">{item.periodDebit > 0 ? fmt(item.periodDebit) : '-'}</TableCell>
                            <TableCell className="text-center border tabular-nums text-sm">{item.periodCredit > 0 ? fmt(item.periodCredit) : '-'}</TableCell>
                            <TableCell className={cn("text-center border text-xs font-medium", status === 'مدين' && 'text-blue-600 dark:text-blue-400', status === 'دائن' && 'text-rose-600 dark:text-rose-400')}>{status}</TableCell>
                            <TableCell className="text-center border tabular-nums text-sm">{netBal > 0 ? fmt(netBal) : '-'}</TableCell>
                            {/* الإجمالي = الرصيد السابق + الحركة (مجموع خام) */}
                            <TableCell className="text-center border tabular-nums text-sm">{totalD > 0 ? fmt(totalD) : '-'}</TableCell>
                            <TableCell className="text-center border tabular-nums text-sm">{totalC > 0 ? fmt(totalC) : '-'}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    {/* Totals row */}
                    {totals && (
                      <TableRow className="bg-primary/10 font-bold text-base border-t-4 border-primary">
                        <TableCell className="text-center border sticky right-0 z-10 bg-primary/10" colSpan={3}>الإجمالي</TableCell>
                        <TableCell className="text-center border tabular-nums">{fmt(totals.openingDebit)}</TableCell>
                        <TableCell className="text-center border tabular-nums">{fmt(totals.openingCredit)}</TableCell>
                        <TableCell className="text-center border tabular-nums">{fmt(totals.periodDebit)}</TableCell>
                        <TableCell className="text-center border tabular-nums">{fmt(totals.periodCredit)}</TableCell>
                        <TableCell className="text-center border"></TableCell>
                        <TableCell className="text-center border"></TableCell>
                        <TableCell className="text-center border tabular-nums">{fmt(totals.totalDebit)}</TableCell>
                        <TableCell className="text-center border tabular-nums">{fmt(totals.totalCredit)}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Bottom summary */}
      {totals && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">الرصيد السابق</p>
                <div className="flex justify-between"><span>مدين:</span><span className="font-mono font-bold">{fmt(totals.openingDebit)}</span></div>
                <div className="flex justify-between"><span>دائن:</span><span className="font-mono font-bold">{fmt(totals.openingCredit)}</span></div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">الحركة</p>
                <div className="flex justify-between"><span>مدين:</span><span className="font-mono font-bold">{fmt(totals.periodDebit)}</span></div>
                <div className="flex justify-between"><span>دائن:</span><span className="font-mono font-bold">{fmt(totals.periodCredit)}</span></div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-muted-foreground">الرصيد النهائي</p>
                <div className="flex justify-between"><span>مدين:</span><span className="font-mono font-bold">{fmt(totals.totalDebit)}</span></div>
                <div className="flex justify-between"><span>دائن:</span><span className="font-mono font-bold">{fmt(totals.totalCredit)}</span></div>
              </div>
            </div>
            <div className={cn("mt-3 p-2.5 rounded-lg text-center font-medium text-sm",
              Math.abs(totals.totalDebit - totals.totalCredit) < 0.01
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {Math.abs(totals.totalDebit - totals.totalCredit) < 0.01
                ? '✓ ميزان المراجعة متوازن'
                : `✗ فرق في الميزان: ${fmt(Math.abs(totals.totalDebit - totals.totalCredit))}`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
