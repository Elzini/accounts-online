import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVATReturnReport } from '@/hooks/useVATReturnReport';
import { useTaxSettings } from '@/hooks/useAccounting';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { toast } from 'sonner';
import { Loader2, FileText, Printer, TrendingUp, TrendingDown, Building2, Receipt, ShoppingCart, AlertCircle, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';

export function VATReturnReportPage() {
  const { t, direction } = useLanguage();
  const { data: taxSettings } = useTaxSettings();
  const { selectedFiscalYear } = useFiscalYear();
  
  const fiscalYearBounds = useMemo(() => {
    if (!selectedFiscalYear) return { start: new Date(), end: new Date() };
    return { start: new Date(selectedFiscalYear.start_date), end: new Date(selectedFiscalYear.end_date) };
  }, [selectedFiscalYear]);

  const getDefaultDates = () => ({
    start: format(fiscalYearBounds.start, 'yyyy-MM-dd'),
    end: format(fiscalYearBounds.end, 'yyyy-MM-dd'),
  });

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  useEffect(() => {
    const newDates = getDefaultDates();
    setStartDate(newDates.start);
    setEndDate(newDates.end);
  }, [selectedFiscalYear?.id]);

  const { data: report, isLoading } = useVATReturnReport(startDate, endDate);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2 }).format(amount);
  const formatNumber = (amount: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

  const handlePrint = () => { window.print(); };

  const handleExportExcel = () => {
    if (!report) return;
    const taxRate = taxSettings?.tax_rate || 15;
    const csvRows = [
      [t.vat_title],
      [`${t.vat_period}: ${startDate} - ${endDate}`],
      [`${t.vat_tax_number}: ${taxSettings?.tax_number || '-'}`],
      [''],
      [t.vat_sales_title, t.vat_col_amount, t.vat_col_vat],
      [t.vat_standard_sales, formatNumber(report.sales.standardRatedAmount), formatNumber(report.sales.standardRatedVAT)],
      [t.vat_citizen_services, formatNumber(report.sales.citizenServicesAmount), formatNumber(report.sales.citizenServicesVAT)],
      [t.vat_zero_rated_sales, formatNumber(report.sales.zeroRatedAmount), '0.00'],
      [t.vat_exports, formatNumber(report.sales.exportsAmount), '0.00'],
      [t.vat_exempt_sales, formatNumber(report.sales.exemptAmount), '0.00'],
      [t.vat_total_sales, formatNumber(report.sales.totalAmount), formatNumber(report.sales.totalVAT)],
      [''],
      [t.vat_purchases_title, t.vat_col_amount, t.vat_col_vat],
      [t.vat_standard_purchases, formatNumber(report.purchases.standardRatedAmount), formatNumber(report.purchases.standardRatedVAT)],
      [t.vat_imports_customs, formatNumber(report.purchases.importsAmount), formatNumber(report.purchases.importsVAT)],
      [t.vat_zero_rated_purchases, formatNumber(report.purchases.zeroRatedAmount), '0.00'],
      [t.vat_exempt_purchases, formatNumber(report.purchases.exemptAmount), '0.00'],
      [t.vat_total_purchases, formatNumber(report.purchases.totalAmount), formatNumber(report.purchases.totalVAT)],
      [''],
      [t.vat_net_title],
      [t.vat_total_sales_vat, formatNumber(report.sales.totalVAT)],
      [t.vat_total_purchases_vat, formatNumber(report.purchases.totalVAT)],
      [t.vat_net_vat, formatNumber(report.netVAT)],
    ];
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vat-return-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t.vat_exported);
  };

  const setQuickDateRange = (type: 'month' | 'quarter' | 'year') => {
    const fyStart = fiscalYearBounds.start;
    const fyEnd = fiscalYearBounds.end;
    let start: Date, end: Date;
    if (type === 'year') { start = fyStart; end = fyEnd; }
    else if (type === 'quarter') {
      end = endOfQuarter(fyEnd); if (end > fyEnd) end = fyEnd;
      start = startOfQuarter(end); if (start < fyStart) start = fyStart;
    } else {
      end = endOfMonth(fyEnd); if (end > fyEnd) end = fyEnd;
      start = startOfMonth(end); if (start < fyStart) start = fyStart;
    }
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const handleStartDateChange = (value: string) => {
    const date = new Date(value);
    if (date < fiscalYearBounds.start) setStartDate(format(fiscalYearBounds.start, 'yyyy-MM-dd'));
    else if (date > fiscalYearBounds.end) setStartDate(format(fiscalYearBounds.end, 'yyyy-MM-dd'));
    else setStartDate(value);
  };

  const handleEndDateChange = (value: string) => {
    const date = new Date(value);
    if (date < fiscalYearBounds.start) setEndDate(format(fiscalYearBounds.start, 'yyyy-MM-dd'));
    else if (date > fiscalYearBounds.end) setEndDate(format(fiscalYearBounds.end, 'yyyy-MM-dd'));
    else setEndDate(value);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 print:space-y-4" dir={direction}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="w-6 h-6" />{t.vat_title}</h1>
          <p className="text-muted-foreground">{t.vat_subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 ml-2" />{t.print}</Button>
          <Button variant="outline" onClick={handleExportExcel}><FileSpreadsheet className="w-4 h-4 ml-2" />{t.fr_export_excel}</Button>
        </div>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid gap-2">
              <Label>{t.vat_from_date}</Label>
              <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} min={format(fiscalYearBounds.start, 'yyyy-MM-dd')} max={format(fiscalYearBounds.end, 'yyyy-MM-dd')} className="w-40" />
            </div>
            <div className="grid gap-2">
              <Label>{t.vat_to_date}</Label>
              <Input type="date" value={endDate} onChange={(e) => handleEndDateChange(e.target.value)} min={format(fiscalYearBounds.start, 'yyyy-MM-dd')} max={format(fiscalYearBounds.end, 'yyyy-MM-dd')} className="w-40" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>{t.vat_month}</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('quarter')}>{t.vat_quarter}</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('year')}>{t.vat_full_year}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">{t.vat_title}</h1>
        <p className="text-sm text-muted-foreground">{taxSettings?.company_name_ar || '-'}</p>
        <p className="text-sm">{t.vat_tax_number}: {taxSettings?.tax_number || '-'}</p>
        <p className="text-sm">{t.vat_period}: {startDate} - {endDate}</p>
      </div>

      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="w-5 h-5" />{t.vat_company_info}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">{t.vat_company_name}</p><p className="font-medium">{taxSettings?.company_name_ar || '-'}</p></div>
            <div><p className="text-muted-foreground">{t.vat_tax_number}</p><p className="font-medium font-mono" dir="ltr">{taxSettings?.tax_number || '-'}</p></div>
            <div><p className="text-muted-foreground">{t.vat_tax_rate}</p><p className="font-medium">{taxSettings?.tax_rate || 15}%</p></div>
            <div><p className="text-muted-foreground">{t.vat_period}</p><p className="font-medium">{startDate && format(new Date(startDate), 'MMM yyyy', { locale: ar })}{endDate && new Date(startDate).getMonth() !== new Date(endDate).getMonth() && ` - ${format(new Date(endDate), 'MMM yyyy', { locale: ar })}`}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">{t.vat_output_tax}</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(report?.sales.totalVAT || 0)}</p></div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">{t.vat_input_tax}</p><p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(report?.purchases.totalVAT || 0)}</p></div>
              <TrendingDown className="w-8 h-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>
        <Card className={`${(report?.netVAT || 0) >= 0 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">{(report?.netVAT || 0) >= 0 ? t.vat_payable : t.vat_refundable}</p><p className={`text-2xl font-bold ${(report?.netVAT || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>{formatCurrency(Math.abs(report?.netVAT || 0))}</p></div>
              {(report?.netVAT || 0) >= 0 ? <AlertCircle className="w-8 h-8 text-blue-500" /> : <CheckCircle2 className="w-8 h-8 text-amber-500" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales */}
      <Card className="print:shadow-none print:border print:break-inside-avoid">
        <CardHeader className="pb-3 bg-emerald-50/50 dark:bg-emerald-950/20 print:bg-emerald-50">
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-400"><Receipt className="w-5 h-5" />{t.vat_sales_title}</CardTitle>
          <CardDescription>{t.vat_sales_desc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">{t.vat_col_box}</TableHead>
              <TableHead className="text-right font-bold">{t.vat_col_desc}</TableHead>
              <TableHead className="text-left font-bold">{t.vat_col_amount}</TableHead>
              <TableHead className="text-left font-bold">{t.vat_col_vat}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-medium">1</TableCell><TableCell>{t.vat_standard_sales} ({taxSettings?.tax_rate || 15}%)</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.sales.standardRatedAmount || 0)}</TableCell><TableCell className="text-left font-mono text-emerald-600 dark:text-emerald-400">{formatNumber(report?.sales.standardRatedVAT || 0)}</TableCell></TableRow>
              <TableRow className="bg-muted/30"><TableCell className="font-medium">2</TableCell><TableCell>{t.vat_citizen_services}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.sales.citizenServicesAmount || 0)}</TableCell><TableCell className="text-left font-mono text-emerald-600 dark:text-emerald-400">{formatNumber(report?.sales.citizenServicesVAT || 0)}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">3</TableCell><TableCell>{t.vat_zero_rated_sales}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.sales.zeroRatedAmount || 0)}</TableCell><TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell></TableRow>
              <TableRow className="bg-muted/30"><TableCell className="font-medium">4</TableCell><TableCell>{t.vat_exports}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.sales.exportsAmount || 0)}</TableCell><TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">5</TableCell><TableCell>{t.vat_exempt_sales}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.sales.exemptAmount || 0)}</TableCell><TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell></TableRow>
              <TableRow className="font-bold bg-emerald-100 dark:bg-emerald-950/50"><TableCell>6</TableCell><TableCell>{t.vat_total_sales}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.sales.totalAmount || 0)}</TableCell><TableCell className="text-left font-mono text-emerald-700 dark:text-emerald-300">{formatNumber(report?.sales.totalVAT || 0)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchases */}
      <Card className="print:shadow-none print:border print:break-inside-avoid">
        <CardHeader className="pb-3 bg-rose-50/50 dark:bg-rose-950/20 print:bg-rose-50">
          <CardTitle className="flex items-center gap-2 text-lg text-rose-700 dark:text-rose-400"><ShoppingCart className="w-5 h-5" />{t.vat_purchases_title}</CardTitle>
          <CardDescription>{t.vat_purchases_desc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">{t.vat_col_box}</TableHead>
              <TableHead className="text-right font-bold">{t.vat_col_desc}</TableHead>
              <TableHead className="text-left font-bold">{t.vat_col_amount}</TableHead>
              <TableHead className="text-left font-bold">{t.vat_col_vat}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-medium">7</TableCell><TableCell>{t.vat_standard_purchases} ({taxSettings?.tax_rate || 15}%)</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.purchases.standardRatedAmount || 0)}</TableCell><TableCell className="text-left font-mono text-rose-600 dark:text-rose-400">{formatNumber(report?.purchases.standardRatedVAT || 0)}</TableCell></TableRow>
              <TableRow className="bg-muted/30"><TableCell className="font-medium">8</TableCell><TableCell>{t.vat_imports_customs}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.purchases.importsAmount || 0)}</TableCell><TableCell className="text-left font-mono text-rose-600 dark:text-rose-400">{formatNumber(report?.purchases.importsVAT || 0)}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">9</TableCell><TableCell>{t.vat_imports_reverse}</TableCell><TableCell className="text-left font-mono">0.00</TableCell><TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell></TableRow>
              <TableRow className="bg-muted/30"><TableCell className="font-medium">10</TableCell><TableCell>{t.vat_zero_rated_purchases}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.purchases.zeroRatedAmount || 0)}</TableCell><TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">11</TableCell><TableCell>{t.vat_exempt_purchases}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.purchases.exemptAmount || 0)}</TableCell><TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell></TableRow>
              <TableRow className="font-bold bg-rose-100 dark:bg-rose-950/50"><TableCell>12</TableCell><TableCell>{t.vat_total_purchases}</TableCell><TableCell className="text-left font-mono">{formatNumber(report?.purchases.totalAmount || 0)}</TableCell><TableCell className="text-left font-mono text-rose-700 dark:text-rose-300">{formatNumber(report?.purchases.totalVAT || 0)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Net VAT */}
      <Card className="print:shadow-none print:border print:break-inside-avoid">
        <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-950/20 print:bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-400">{t.vat_net_title}</CardTitle>
          <CardDescription>{t.vat_net_desc}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead className="text-right font-bold">{t.vat_col_box}</TableHead>
              <TableHead className="text-right font-bold">{t.vat_col_desc}</TableHead>
              <TableHead className="text-left font-bold">{t.vat_col_amount}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell className="font-medium">13</TableCell><TableCell>{t.vat_total_sales_vat}</TableCell><TableCell className="text-left font-mono text-emerald-600">{formatNumber(report?.sales.totalVAT || 0)}</TableCell></TableRow>
              <TableRow className="bg-muted/30"><TableCell className="font-medium">14</TableCell><TableCell>{t.vat_total_purchases_vat}</TableCell><TableCell className="text-left font-mono text-rose-600">{formatNumber(report?.purchases.totalVAT || 0)}</TableCell></TableRow>
              <TableRow><TableCell className="font-medium">15</TableCell><TableCell>{t.vat_corrections}</TableCell><TableCell className="text-left font-mono">0.00</TableCell></TableRow>
              <TableRow className="font-bold bg-blue-100 dark:bg-blue-950/50">
                <TableCell>16</TableCell><TableCell>{t.vat_net_vat}</TableCell>
                <TableCell className={`text-left font-mono text-lg ${(report?.netVAT || 0) >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {formatNumber(Math.abs(report?.netVAT || 0))}
                  <span className="text-xs font-normal mr-2">({(report?.netVAT || 0) >= 0 ? t.vat_payable : t.vat_refundable})</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-500" />{t.vat_notes_title}</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>{t.vat_note_1}</li><li>{t.vat_note_2}</li><li>{t.vat_note_3}</li><li>{t.vat_note_4}</li>
            <li className="text-amber-600 dark:text-amber-400 font-medium">{t.vat_note_5}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
