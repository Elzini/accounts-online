import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccounts, useGeneralLedger } from '@/hooks/useAccounting';
import { Loader2, BookOpen, FileDown, Printer, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useCompany } from '@/contexts/CompanyContext';
import { LedgerPreviewDialog } from './LedgerPreviewDialog';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search } from 'lucide-react';
import { LedgerFilters } from './ledger/LedgerFilters';
import { LedgerTable } from './ledger/LedgerTable';
import { exportLedgerExcel, exportLedgerPDF, printLedger } from './ledger/LedgerExport';

export function GeneralLedgerPage() {
  const { t, direction } = useLanguage();
  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts();
  const { companyId } = useCompany();
  const { data: companySettings } = useCompanySettings(companyId || '');
  const { selectedFiscalYear, fiscalYearDateRange } = useFiscalYearFilter();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportType, setExportType] = useState<'print' | 'pdf' | 'excel'>('print');
  const printRef = useRef<HTMLDivElement>(null);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: fiscalYearDateRange.startDate,
    to: fiscalYearDateRange.endDate || new Date(),
  });

  useEffect(() => {
    if (fiscalYearDateRange.startDate && fiscalYearDateRange.endDate) {
      setDateRange({ from: fiscalYearDateRange.startDate, to: fiscalYearDateRange.endDate });
    }
  }, [fiscalYearDateRange.startDate, fiscalYearDateRange.endDate]);

  const { data: ledger, isLoading: isLoadingLedger } = useGeneralLedger(
    selectedAccountId,
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
  );

  const companyName = companySettings?.app_name || 'Company';

  const filteredEntries = useMemo(() => {
    if (!ledger?.entries) return [];
    let entries = ledger.entries;
    if (transactionFilter !== 'all') entries = entries.filter(e => e.reference_type === transactionFilter);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e => e.description.toLowerCase().includes(query) || String(e.entry_number).includes(query));
    }
    return entries;
  }, [ledger?.entries, searchQuery, transactionFilter]);

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = { assets: t.coa_type_assets, liabilities: t.coa_type_liabilities, equity: t.coa_type_equity, revenue: t.coa_type_revenue, expenses: t.coa_type_expenses };
    return types[type] || type;
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  if (isLoadingAccounts) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6" dir={direction}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.gl_title}</h1>
        <p className="text-muted-foreground">{t.gl_subtitle}</p>
      </div>

      <LedgerFilters
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        dateRange={dateRange}
        setDateRange={setDateRange}
        t={t}
        getAccountTypeLabel={getAccountTypeLabel}
      />

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
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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
                  <p className={cn("text-xl font-bold", ledger.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(ledger.openingBalance)}</p>
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

              <LedgerTable
                ledger={ledger}
                filteredEntries={filteredEntries}
                dateRange={dateRange}
                searchQuery={searchQuery}
                transactionFilter={transactionFilter}
                t={t}
                formatCurrency={formatCurrency}
              />
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
          if (exportType === 'print') printLedger(printRef, ledger, t);
          else if (exportType === 'pdf') exportLedgerPDF(printRef, ledger, t);
          else exportLedgerExcel(ledger, filteredEntries, dateRange, t);
        }}
        companyName={companyName}
      />
    </div>
  );
}
