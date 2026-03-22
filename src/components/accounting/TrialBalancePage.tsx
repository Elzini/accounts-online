import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useComprehensiveTrialBalance } from '@/hooks/useAccounting';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useCompany } from '@/contexts/CompanyContext';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useExcelExport } from '@/hooks/useExcelExport';
import { usePdfExport } from '@/hooks/usePdfExport';
import { Loader2, Search, Printer, Download, FileText, FileSpreadsheet, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { plainFormat } from '@/components/financial-statements/utils/numberFormatting';

const fmt = (n: number) => plainFormat(n);

export function TrialBalancePage() {
  const { company } = useCompany();
  const { selectedFiscalYear } = useFiscalYear();
  const startDate = selectedFiscalYear?.start_date;
  const endDate = selectedFiscalYear?.end_date;
  const { data: trialData, isLoading } = useComprehensiveTrialBalance(startDate, endDate);

  const [search, setSearch] = useState('');
  const [hideZero, setHideZero] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  const { printReport } = usePrintReport();
  const { exportToExcel } = useExcelExport();
  const { exportToPdf } = usePdfExport();

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
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      accounts = accounts.filter(item =>
        item.account.name.toLowerCase().includes(q) ||
        item.account.code.toLowerCase().includes(q)
      );
    }
    return accounts;
  }, [trialData, search, hideZero]);

  const getStatusLabel = (debit: number, credit: number) => {
    if (debit > credit) return 'مدين';
    if (credit > debit) return 'دائن';
    return '-';
  };

  const getNetBalance = (debit: number, credit: number) => Math.abs(debit - credit);

  const handleExport = (type: 'print' | 'excel' | 'pdf') => {
    if (!trialData) return;
    const columns = [
      { header: 'اسم الحساب', key: 'name' },
      { header: 'مدين', key: 'openingDebit' }, { header: 'دائن', key: 'openingCredit' },
      { header: 'مدين', key: 'periodDebit' }, { header: 'دائن', key: 'periodCredit' },
      { header: 'الحالة', key: 'status' }, { header: 'الرصيد', key: 'netBalance' },
      { header: 'مدين', key: 'closingDebit' }, { header: 'دائن', key: 'closingCredit' },
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
        closingDebit: item.closingDebit > 0 ? fmt(item.closingDebit) : '-',
        closingCredit: item.closingCredit > 0 ? fmt(item.closingCredit) : '-',
      };
    });
    data.push({
      name: 'الإجمالي',
      openingDebit: fmt(trialData.totals.openingDebit), openingCredit: fmt(trialData.totals.openingCredit),
      periodDebit: fmt(trialData.totals.periodDebit), periodCredit: fmt(trialData.totals.periodCredit),
      status: '', netBalance: '',
      closingDebit: fmt(trialData.totals.closingDebit), closingCredit: fmt(trialData.totals.closingCredit),
    });
    const title = `ميزان المراجعة - ${company?.name || ''}`;
    const subtitle = startDate && endDate ? `من ${startDate} إلى ${endDate}` : undefined;
    const summaryCards = [
      { label: 'الرصيد السابق - مدين', value: fmt(trialData.totals.openingDebit) },
      { label: 'الرصيد السابق - دائن', value: fmt(trialData.totals.openingCredit) },
      { label: 'الحركة - مدين', value: fmt(trialData.totals.periodDebit) },
      { label: 'الحركة - دائن', value: fmt(trialData.totals.periodCredit) },
      { label: 'الرصيد النهائي - مدين', value: fmt(trialData.totals.closingDebit) },
      { label: 'الرصيد النهائي - دائن', value: fmt(trialData.totals.closingCredit) },
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-primary" />
              <div>
                <CardTitle className="text-xl">ميزان مراجعة شامل</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {company?.name || ''} {startDate && endDate ? `• من ${startDate} إلى ${endDate}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="hideZero" checked={hideZero} onCheckedChange={v => setHideZero(!!v)} />
                <label htmlFor="hideZero" className="text-sm cursor-pointer">حسابات غير صفرية</label>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" />تصدير</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleExport('print')} className="gap-2 cursor-pointer"><Printer className="w-4 h-4" />طباعة</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2 cursor-pointer"><FileText className="w-4 h-4" />PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')} className="gap-2 cursor-pointer"><FileSpreadsheet className="w-4 h-4" />Excel</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

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
                    <TableHead className="text-center border bg-sky-50 dark:bg-sky-900/20 w-[110px]">مدين</TableHead>
                    <TableHead className="text-center border bg-sky-50 dark:bg-sky-900/20 w-[110px]">دائن</TableHead>
                    <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[110px]">مدين</TableHead>
                    <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[110px]">دائن</TableHead>
                    <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[70px]">الحالة</TableHead>
                    <TableHead className="text-center border bg-emerald-50 dark:bg-emerald-900/20 w-[110px]">الرصيد</TableHead>
                    <TableHead className="text-center border bg-amber-50 dark:bg-amber-900/20 w-[110px]">مدين</TableHead>
                    <TableHead className="text-center border bg-amber-50 dark:bg-amber-900/20 w-[110px]">دائن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-12">لا توجد بيانات</TableCell></TableRow>
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
                          <TableCell className="text-center border tabular-nums text-sm">{item.openingDebit > 0 ? fmt(item.openingDebit) : '-'}</TableCell>
                          <TableCell className="text-center border tabular-nums text-sm">{item.openingCredit > 0 ? fmt(item.openingCredit) : '-'}</TableCell>
                          <TableCell className="text-center border tabular-nums text-sm">{item.periodDebit > 0 ? fmt(item.periodDebit) : '-'}</TableCell>
                          <TableCell className="text-center border tabular-nums text-sm">{item.periodCredit > 0 ? fmt(item.periodCredit) : '-'}</TableCell>
                          <TableCell className={cn("text-center border text-xs font-medium", status === 'مدين' && 'text-blue-600 dark:text-blue-400', status === 'دائن' && 'text-rose-600 dark:text-rose-400')}>{status}</TableCell>
                          <TableCell className="text-center border tabular-nums text-sm">{netBal > 0 ? fmt(netBal) : '-'}</TableCell>
                          <TableCell className="text-center border tabular-nums text-sm">{item.closingDebit > 0 ? fmt(item.closingDebit) : '-'}</TableCell>
                          <TableCell className="text-center border tabular-nums text-sm">{item.closingCredit > 0 ? fmt(item.closingCredit) : '-'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                  {trialData && (
                    <TableRow className="bg-primary/10 font-bold text-base border-t-4 border-primary">
                      <TableCell className="text-center border sticky right-0 z-10 bg-primary/10">الإجمالي</TableCell>
                      <TableCell className="text-center border tabular-nums">{fmt(trialData.totals.openingDebit)}</TableCell>
                      <TableCell className="text-center border tabular-nums">{fmt(trialData.totals.openingCredit)}</TableCell>
                      <TableCell className="text-center border tabular-nums">{fmt(trialData.totals.periodDebit)}</TableCell>
                      <TableCell className="text-center border tabular-nums">{fmt(trialData.totals.periodCredit)}</TableCell>
                      <TableCell className="text-center border"></TableCell>
                      <TableCell className="text-center border"></TableCell>
                      <TableCell className="text-center border tabular-nums">{fmt(trialData.totals.closingDebit)}</TableCell>
                      <TableCell className="text-center border tabular-nums">{fmt(trialData.totals.closingCredit)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {trialData && (
        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold text-muted-foreground">الرصيد السابق</p>
                <div className="flex justify-between"><span>مدين:</span><span className="font-mono font-bold">{fmt(trialData.totals.openingDebit)}</span></div>
                <div className="flex justify-between"><span>دائن:</span><span className="font-mono font-bold">{fmt(trialData.totals.openingCredit)}</span></div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-muted-foreground">الحركة</p>
                <div className="flex justify-between"><span>مدين:</span><span className="font-mono font-bold">{fmt(trialData.totals.periodDebit)}</span></div>
                <div className="flex justify-between"><span>دائن:</span><span className="font-mono font-bold">{fmt(trialData.totals.periodCredit)}</span></div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-muted-foreground">الرصيد النهائي</p>
                <div className="flex justify-between"><span>مدين:</span><span className="font-mono font-bold">{fmt(trialData.totals.closingDebit)}</span></div>
                <div className="flex justify-between"><span>دائن:</span><span className="font-mono font-bold">{fmt(trialData.totals.closingCredit)}</span></div>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-muted-foreground">الرصيد الصافي</p>
                <div className="flex justify-between"><span>مدين:</span><span className="font-mono font-bold">{fmt(Math.max(0, trialData.totals.closingDebit - trialData.totals.closingCredit))}</span></div>
                <div className="flex justify-between"><span>دائن:</span><span className="font-mono font-bold">{fmt(Math.max(0, trialData.totals.closingCredit - trialData.totals.closingDebit))}</span></div>
              </div>
            </div>
            <div className={cn("mt-4 p-3 rounded-lg text-center font-medium text-sm",
              trialData.totals.closingDebit === trialData.totals.closingCredit
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {trialData.totals.closingDebit === trialData.totals.closingCredit
                ? '✓ ميزان المراجعة متوازن'
                : `✗ فرق في الميزان: ${fmt(Math.abs(trialData.totals.closingDebit - trialData.totals.closingCredit))}`}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}