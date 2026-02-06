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
import { 
  Loader2, 
  FileText, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  Building2,
  Receipt,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import { ar } from 'date-fns/locale';

export function VATReturnReportPage() {
  const { data: taxSettings } = useTaxSettings();
  const { selectedFiscalYear } = useFiscalYear();
  
  // Calculate fiscal year bounds
  const fiscalYearBounds = useMemo(() => {
    if (!selectedFiscalYear) {
      return { start: new Date(), end: new Date() };
    }
    return {
      start: new Date(selectedFiscalYear.start_date),
      end: new Date(selectedFiscalYear.end_date),
    };
  }, [selectedFiscalYear]);

  // Default to the FULL fiscal year to match sales/purchases tables
  const getDefaultDates = () => {
    return {
      start: format(fiscalYearBounds.start, 'yyyy-MM-dd'),
      end: format(fiscalYearBounds.end, 'yyyy-MM-dd'),
    };
  };

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);

  // Reset dates when fiscal year changes
  useEffect(() => {
    const newDates = getDefaultDates();
    setStartDate(newDates.start);
    setEndDate(newDates.end);
  }, [selectedFiscalYear?.id]);

  const { data: report, isLoading } = useVATReturnReport(startDate, endDate);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!report) return;

    const taxRate = taxSettings?.tax_rate || 15;
    
    // Create CSV content
    const csvRows = [
      ['إقرار ضريبة القيمة المضافة'],
      [`الفترة: من ${startDate} إلى ${endDate}`],
      [`الرقم الضريبي: ${taxSettings?.tax_number || 'غير محدد'}`],
      [''],
      ['المبيعات', 'المبلغ (ريال)', 'ضريبة القيمة المضافة'],
      ['مبيعات خاضعة للنسبة الأساسية', formatNumber(report.sales.standardRatedAmount), formatNumber(report.sales.standardRatedVAT)],
      ['مبيعات لمواطنين (تعليم وصحة)', formatNumber(report.sales.citizenServicesAmount), formatNumber(report.sales.citizenServicesVAT)],
      ['مبيعات خاضعة لنسبة الصفر', formatNumber(report.sales.zeroRatedAmount), '0.00'],
      ['صادرات', formatNumber(report.sales.exportsAmount), '0.00'],
      ['مبيعات معفاة', formatNumber(report.sales.exemptAmount), '0.00'],
      ['إجمالي المبيعات', formatNumber(report.sales.totalAmount), formatNumber(report.sales.totalVAT)],
      [''],
      ['المشتريات', 'المبلغ (ريال)', 'ضريبة القيمة المضافة'],
      ['مشتريات خاضعة للنسبة الأساسية', formatNumber(report.purchases.standardRatedAmount), formatNumber(report.purchases.standardRatedVAT)],
      ['استيرادات خاضعة للضريبة', formatNumber(report.purchases.importsAmount), formatNumber(report.purchases.importsVAT)],
      ['مشتريات خاضعة لنسبة الصفر', formatNumber(report.purchases.zeroRatedAmount), '0.00'],
      ['مشتريات معفاة', formatNumber(report.purchases.exemptAmount), '0.00'],
      ['إجمالي المشتريات', formatNumber(report.purchases.totalAmount), formatNumber(report.purchases.totalVAT)],
      [''],
      ['صافي ضريبة القيمة المضافة'],
      ['إجمالي ضريبة المبيعات (المخرجات)', formatNumber(report.sales.totalVAT)],
      ['إجمالي ضريبة المشتريات (المدخلات)', formatNumber(report.purchases.totalVAT)],
      ['صافي الضريبة المستحقة', formatNumber(report.netVAT)],
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
    toast.success('تم تصدير التقرير بنجاح');
  };

  // Quick date range within fiscal year bounds
  const setQuickDateRange = (type: 'month' | 'quarter' | 'year') => {
    const fyStart = fiscalYearBounds.start;
    const fyEnd = fiscalYearBounds.end;
    
    let start: Date;
    let end: Date;
    
    if (type === 'year') {
      start = fyStart;
      end = fyEnd;
    } else if (type === 'quarter') {
      // Get the last complete quarter within the fiscal year
      end = endOfQuarter(fyEnd);
      if (end > fyEnd) {
        end = fyEnd;
      }
      start = startOfQuarter(end);
      if (start < fyStart) {
        start = fyStart;
      }
    } else {
      // Get the last month within the fiscal year
      end = endOfMonth(fyEnd);
      if (end > fyEnd) {
        end = fyEnd;
      }
      start = startOfMonth(end);
      if (start < fyStart) {
        start = fyStart;
      }
    }
    
    setStartDate(format(start, 'yyyy-MM-dd'));
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  // Validate and constrain date inputs to fiscal year
  const handleStartDateChange = (value: string) => {
    const date = new Date(value);
    const fyStart = fiscalYearBounds.start;
    const fyEnd = fiscalYearBounds.end;
    
    if (date < fyStart) {
      setStartDate(format(fyStart, 'yyyy-MM-dd'));
    } else if (date > fyEnd) {
      setStartDate(format(fyEnd, 'yyyy-MM-dd'));
    } else {
      setStartDate(value);
    }
  };

  const handleEndDateChange = (value: string) => {
    const date = new Date(value);
    const fyStart = fiscalYearBounds.start;
    const fyEnd = fiscalYearBounds.end;
    
    if (date < fyStart) {
      setEndDate(format(fyStart, 'yyyy-MM-dd'));
    } else if (date > fyEnd) {
      setEndDate(format(fyEnd, 'yyyy-MM-dd'));
    } else {
      setEndDate(value);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6" />
            إقرار ضريبة القيمة المضافة
          </h1>
          <p className="text-muted-foreground">
            تقرير مطابق لنموذج هيئة الزكاة والضريبة والجمارك (ZATCA)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="start-date">من تاريخ</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                min={format(fiscalYearBounds.start, 'yyyy-MM-dd')}
                max={format(fiscalYearBounds.end, 'yyyy-MM-dd')}
                className="w-40"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">إلى تاريخ</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                min={format(fiscalYearBounds.start, 'yyyy-MM-dd')}
                max={format(fiscalYearBounds.end, 'yyyy-MM-dd')}
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
                شهر واحد
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('quarter')}>
                ربع سنوي
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQuickDateRange('year')}>
                سنة كاملة
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">إقرار ضريبة القيمة المضافة</h1>
        <p className="text-sm text-muted-foreground">
          {taxSettings?.company_name_ar || 'اسم الشركة'}
        </p>
        <p className="text-sm">
          الرقم الضريبي: {taxSettings?.tax_number || 'غير محدد'}
        </p>
        <p className="text-sm">
          الفترة: من {startDate && format(new Date(startDate), 'dd MMMM yyyy', { locale: ar })} 
          {' إلى '} 
          {endDate && format(new Date(endDate), 'dd MMMM yyyy', { locale: ar })}
        </p>
      </div>

      {/* Company Info Card */}
      <Card className="print:shadow-none print:border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5" />
            بيانات المنشأة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">اسم المنشأة</p>
              <p className="font-medium">{taxSettings?.company_name_ar || 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">الرقم الضريبي</p>
              <p className="font-medium font-mono" dir="ltr">{taxSettings?.tax_number || 'غير محدد'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">نسبة الضريبة</p>
              <p className="font-medium">{taxSettings?.tax_rate || 15}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">فترة الإقرار</p>
              <p className="font-medium">
                {startDate && format(new Date(startDate), 'MMM yyyy', { locale: ar })}
                {endDate && new Date(startDate).getMonth() !== new Date(endDate).getMonth() && 
                  ` - ${format(new Date(endDate), 'MMM yyyy', { locale: ar })}`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ضريبة المبيعات (المخرجات)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report?.sales.totalVAT || 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ضريبة المشتريات (المدخلات)</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(report?.purchases.totalVAT || 0)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${(report?.netVAT || 0) >= 0 
          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900' 
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {(report?.netVAT || 0) >= 0 ? 'ضريبة مستحقة للهيئة' : 'ضريبة مستردة من الهيئة'}
                </p>
                <p className={`text-2xl font-bold ${(report?.netVAT || 0) >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-amber-600 dark:text-amber-400'}`}>
                  {formatCurrency(Math.abs(report?.netVAT || 0))}
                </p>
              </div>
              {(report?.netVAT || 0) >= 0 ? (
                <AlertCircle className="w-8 h-8 text-blue-500" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-amber-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Section */}
      <Card className="print:shadow-none print:border print:break-inside-avoid">
        <CardHeader className="pb-3 bg-emerald-50/50 dark:bg-emerald-950/20 print:bg-emerald-50">
          <CardTitle className="flex items-center gap-2 text-lg text-emerald-700 dark:text-emerald-400">
            <Receipt className="w-5 h-5" />
            المبيعات
          </CardTitle>
          <CardDescription>
            إجمالي المبيعات وضريبة القيمة المضافة على المخرجات
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">الخانة</TableHead>
                <TableHead className="text-right font-bold">الوصف</TableHead>
                <TableHead className="text-left font-bold">المبلغ (ريال)</TableHead>
                <TableHead className="text-left font-bold">ضريبة القيمة المضافة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">1</TableCell>
                <TableCell>مبيعات خاضعة للنسبة الأساسية ({taxSettings?.tax_rate || 15}%)</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.sales.standardRatedAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-emerald-600 dark:text-emerald-400">
                  {formatNumber(report?.sales.standardRatedVAT || 0)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">2</TableCell>
                <TableCell>مبيعات للمواطنين (الخدمات الصحية والتعليمية الخاصة)</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.sales.citizenServicesAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-emerald-600 dark:text-emerald-400">
                  {formatNumber(report?.sales.citizenServicesVAT || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">3</TableCell>
                <TableCell>مبيعات خاضعة لنسبة الصفر</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.sales.zeroRatedAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">4</TableCell>
                <TableCell>الصادرات</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.sales.exportsAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">5</TableCell>
                <TableCell>مبيعات معفاة من الضريبة</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.sales.exemptAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell>
              </TableRow>
              <TableRow className="font-bold bg-emerald-100 dark:bg-emerald-950/50">
                <TableCell>6</TableCell>
                <TableCell>إجمالي المبيعات</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.sales.totalAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-emerald-700 dark:text-emerald-300">
                  {formatNumber(report?.sales.totalVAT || 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Purchases Section */}
      <Card className="print:shadow-none print:border print:break-inside-avoid">
        <CardHeader className="pb-3 bg-rose-50/50 dark:bg-rose-950/20 print:bg-rose-50">
          <CardTitle className="flex items-center gap-2 text-lg text-rose-700 dark:text-rose-400">
            <ShoppingCart className="w-5 h-5" />
            المشتريات
          </CardTitle>
          <CardDescription>
            إجمالي المشتريات وضريبة القيمة المضافة على المدخلات
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">الخانة</TableHead>
                <TableHead className="text-right font-bold">الوصف</TableHead>
                <TableHead className="text-left font-bold">المبلغ (ريال)</TableHead>
                <TableHead className="text-left font-bold">ضريبة القيمة المضافة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">7</TableCell>
                <TableCell>مشتريات خاضعة للنسبة الأساسية ({taxSettings?.tax_rate || 15}%)</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.purchases.standardRatedAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-rose-600 dark:text-rose-400">
                  {formatNumber(report?.purchases.standardRatedVAT || 0)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">8</TableCell>
                <TableCell>استيرادات خاضعة للضريبة (دفعت في الجمارك)</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.purchases.importsAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-rose-600 dark:text-rose-400">
                  {formatNumber(report?.purchases.importsVAT || 0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">9</TableCell>
                <TableCell>استيرادات خاضعة للضريبة (آلية الاحتساب العكسي)</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.purchases.reverseChargeAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-rose-600 dark:text-rose-400">
                  {formatNumber(report?.purchases.reverseChargeVAT || 0)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">10</TableCell>
                <TableCell>مشتريات خاضعة لنسبة الصفر</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.purchases.zeroRatedAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">11</TableCell>
                <TableCell>مشتريات معفاة من الضريبة</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.purchases.exemptAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-muted-foreground">0.00</TableCell>
              </TableRow>
              <TableRow className="font-bold bg-rose-100 dark:bg-rose-950/50">
                <TableCell>12</TableCell>
                <TableCell>إجمالي المشتريات</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.purchases.totalAmount || 0)}</TableCell>
                <TableCell className="text-left font-mono text-rose-700 dark:text-rose-300">
                  {formatNumber(report?.purchases.totalVAT || 0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Net VAT Section */}
      <Card className="print:shadow-none print:border print:break-inside-avoid">
        <CardHeader className="pb-3 bg-blue-50/50 dark:bg-blue-950/20 print:bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-400">
            <FileText className="w-5 h-5" />
            صافي ضريبة القيمة المضافة
          </CardTitle>
          <CardDescription>
            حساب الضريبة المستحقة أو المستردة
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">الخانة</TableHead>
                <TableHead className="text-right font-bold">الوصف</TableHead>
                <TableHead className="text-left font-bold">المبلغ (ريال)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">13</TableCell>
                <TableCell>إجمالي ضريبة القيمة المضافة على المبيعات (خانة 6)</TableCell>
                <TableCell className="text-left font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatNumber(report?.sales.totalVAT || 0)}
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">14</TableCell>
                <TableCell>إجمالي ضريبة القيمة المضافة على المشتريات القابلة للاسترداد (خانة 12)</TableCell>
                <TableCell className="text-left font-mono text-rose-600 dark:text-rose-400 font-medium">
                  ({formatNumber(report?.purchases.totalVAT || 0)})
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">15</TableCell>
                <TableCell>تصحيحات من الفترات السابقة (إن وجدت)</TableCell>
                <TableCell className="text-left font-mono">{formatNumber(report?.corrections || 0)}</TableCell>
              </TableRow>
              <TableRow className="font-bold bg-blue-100 dark:bg-blue-950/50 text-lg">
                <TableCell>16</TableCell>
                <TableCell>
                  صافي ضريبة القيمة المضافة 
                  <Badge variant={(report?.netVAT || 0) >= 0 ? 'destructive' : 'secondary'} className="mr-2">
                    {(report?.netVAT || 0) >= 0 ? 'مستحقة للهيئة' : 'مستردة من الهيئة'}
                  </Badge>
                </TableCell>
                <TableCell className={`text-left font-mono text-xl ${(report?.netVAT || 0) >= 0 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-amber-700 dark:text-amber-300'}`}>
                  {formatNumber(Math.abs(report?.netVAT || 0))}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card className="print:shadow-none print:border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">ملاحظات هامة</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>يجب تقديم الإقرار الضريبي في موعده المحدد لتجنب الغرامات</li>
            <li>الفترة الضريبية الشهرية: للمنشآت التي تزيد إيراداتها عن 40 مليون ريال سنوياً</li>
            <li>الفترة الضريبية الربع سنوية: للمنشآت التي تقل إيراداتها عن 40 مليون ريال سنوياً</li>
            <li>يجب الاحتفاظ بجميع الفواتير والمستندات الداعمة لمدة 6 سنوات على الأقل</li>
            <li>هذا التقرير لأغراض المراجعة فقط - يجب تقديم الإقرار الرسمي عبر بوابة هيئة الزكاة والضريبة والجمارك</li>
          </ul>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="hidden print:block text-center text-sm text-muted-foreground mt-8 pt-4 border-t">
        <p>تم إنشاء هذا التقرير بواسطة Elzini SaaS</p>
        <p>تاريخ الطباعة: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
      </div>
    </div>
  );
}
