import { useState, useMemo } from 'react';
import { FileText, ShoppingCart, Truck, Printer, RefreshCw, Filter, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useCars, useSuppliers } from '@/hooks/useDatabase';
import { useExpenses } from '@/hooks/useExpenses';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePrintReport } from '@/hooks/usePrintReport';
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { PurchaseActions } from '@/components/actions/PurchaseActions';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNumberFormat } from '@/hooks/useNumberFormat';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/hooks/modules/useReportsServices';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

type InvoiceStatusFilter = 'all' | 'draft' | 'issued';
type CarStatusFilter = 'all' | 'available' | 'sold';

type ReportRow = {
  id: string;
  reference: string;
  itemName: string;
  model: string;
  plate: string;
  chassis: string;
  baseAmount: number;
  taxOrExpenses: number;
  totalAmount: number;
  date: string;
  status: string;
  raw?: any;
};

export function PurchasesReport() {
  const { companyId, company } = useCompany();
  const isCarDealership = useIndustryFeatures().hasCarInventory;

  const { data: cars = [], isLoading: carsLoading, refetch } = useCars();
  const { data: suppliers = [] } = useSuppliers();
  const { data: allExpenses = [] } = useExpenses();
  const { filterByFiscalYear, selectedFiscalYear } = useFiscalYearFilter();

  const { data: purchaseInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['company-purchases-report', companyId, selectedFiscalYear?.id],
    queryFn: async () => {
      let query = (supabase as any)
        .from('invoices')
        .select('*, supplier:suppliers!invoices_supplier_id_fkey(id, name)')
        .eq('company_id', companyId!)
        .eq('invoice_type', 'purchase')
        .gte('total', 0)
        .order('created_at', { ascending: false });
      if (selectedFiscalYear) {
        query = query.eq('fiscal_year_id', selectedFiscalYear.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId && !isCarDealership,
    staleTime: 5 * 60 * 1000,
  });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<CarStatusFilter | InvoiceStatusFilter>('all');
  const { printReport } = usePrintReport();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { decimals } = useNumberFormat();

  const locale = language === 'ar' ? 'ar-SA' : 'en-US';
  const formatCurrency = (value: number) => decimals === 0 ? String(Math.round(value)) : value.toFixed(decimals);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(locale);

  const suppliersMap = useMemo(() => {
    return suppliers.reduce((acc, supplier) => {
      acc[supplier.id] = supplier;
      return acc;
    }, {} as Record<string, (typeof suppliers)[number]>);
  }, [suppliers]);

  const carExpensesMap = useMemo(() => {
    const map: Record<string, { description: string; amount: number }[]> = {};

    allExpenses.forEach((exp) => {
      if (exp.car_id) {
        if (!map[exp.car_id]) map[exp.car_id] = [];
        map[exp.car_id].push({ description: exp.description, amount: Number(exp.amount) });
      }
    });

    return map;
  }, [allExpenses]);

  const getCarExpensesTotal = (carId: string) =>
    (carExpensesMap[carId] || []).reduce((sum, e) => sum + e.amount, 0);

  const reportRows = useMemo<ReportRow[]>(() => {
    if (isCarDealership) {
      return cars.map((car) => {
        const expenses = getCarExpensesTotal(car.id);
        const supplier = car.supplier_id ? suppliersMap[car.supplier_id] : null;

        return {
          id: car.id,
          reference: String(car.inventory_number ?? '-'),
          itemName: car.name || '-',
          model: car.model || '-',
          plate: car.plate_number || '-',
          chassis: car.chassis_number || '-',
          baseAmount: Number(car.purchase_price || 0),
          taxOrExpenses: expenses,
          totalAmount: Number(car.purchase_price || 0) + expenses,
          date: car.purchase_date,
          status: car.status || 'available',
          raw: {
            ...car,
            supplier,
          },
        };
      });
    }

    return purchaseInvoices.map((inv: any) => ({
      id: inv.id,
      reference: inv.invoice_number || '-',
      itemName: inv.supplier?.name || inv.customer_name || '-',
      model: '-',
      plate: '-',
      chassis: '-',
      baseAmount: Number(inv.subtotal || 0),
      taxOrExpenses: Number(inv.vat_amount || 0),
      totalAmount: Number(inv.total || 0),
      date: inv.invoice_date || inv.created_at,
      status: inv.status || 'draft',
      raw: inv,
    }));
  }, [isCarDealership, cars, suppliersMap, purchaseInvoices, carExpensesMap]);

  const filteredRows = useMemo(() => {
    let result = filterByFiscalYear(reportRows, 'date');

    result = result.filter((row) => {
      const rowDate = new Date(row.date);
      if (startDate && rowDate < new Date(startDate)) return false;
      if (endDate && rowDate > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });

    if (statusFilter !== 'all') {
      result = result.filter((row) => row.status === statusFilter);
    }

    return result;
  }, [reportRows, startDate, endDate, filterByFiscalYear, statusFilter]);

  const totalPurchases = filteredRows.reduce((sum, row) => sum + row.baseAmount, 0);
  const totalTaxOrExpenses = filteredRows.reduce((sum, row) => sum + row.taxOrExpenses, 0);
  const grandTotal = filteredRows.reduce((sum, row) => sum + row.totalAmount, 0);

  const getStatusText = (status: string) => {
    if (isCarDealership) {
      return status === 'available'
        ? t.rpt_status_available
        : status === 'transferred'
          ? t.rpt_status_transferred
          : t.rpt_status_sold;
    }

    if (status === 'issued' || status === 'approved') return language === 'ar' ? 'معتمدة' : 'Issued';
    if (status === 'draft') return language === 'ar' ? 'مسودة' : 'Draft';
    if (status === 'cancelled') return language === 'ar' ? 'ملغية' : 'Cancelled';
    return status;
  };

  const getFilterLabel = () => {
    if (isCarDealership) {
      if (statusFilter === 'available') return 'السيارات المتاحة';
      if (statusFilter === 'sold') return 'السيارات المباعة';
      return t.rpt_purch_title;
    }

    if (statusFilter === 'draft') return language === 'ar' ? 'الفواتير المسودة' : 'Draft invoices';
    if (statusFilter === 'issued') return language === 'ar' ? 'الفواتير المعتمدة' : 'Issued invoices';
    return t.rpt_purch_title;
  };

  const handleRefresh = () => {
    if (isCarDealership) {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
      queryClient.invalidateQueries({ queryKey: ['stats', companyId] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics', companyId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data', companyId] });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['company-purchases-report', companyId] });
    queryClient.invalidateQueries({ queryKey: ['purchase-invoices', companyId] });
    queryClient.invalidateQueries({ queryKey: ['invoices', companyId] });
  };

  const handlePrint = () => {
    printReport({
      title: getFilterLabel(),
      subtitle: t.rpt_purch_subtitle,
      columns: isCarDealership
        ? [
            { header: t.rpt_purch_col_number, key: 'reference' },
            { header: t.rpt_purch_col_item, key: 'itemName' },
            { header: t.rpt_purch_col_model, key: 'model' },
            { header: 'رقم اللوحة', key: 'plate' },
            { header: t.rpt_purch_col_chassis, key: 'chassis' },
            { header: t.rpt_purch_col_price, key: 'baseAmount' },
            { header: 'المصروفات', key: 'taxOrExpenses' },
            { header: 'الإجمالي', key: 'totalAmount' },
            { header: t.rpt_purch_col_date, key: 'date' },
            { header: t.rpt_purch_col_status, key: 'status' },
          ]
        : [
            { header: language === 'ar' ? 'رقم الفاتورة' : 'Invoice #', key: 'reference' },
            { header: language === 'ar' ? 'المورد' : 'Supplier', key: 'itemName' },
            { header: language === 'ar' ? 'المبلغ الأساسي' : 'Base Amount', key: 'baseAmount' },
            { header: language === 'ar' ? 'الضريبة' : 'Tax', key: 'taxOrExpenses' },
            { header: language === 'ar' ? 'الإجمالي' : 'Total', key: 'totalAmount' },
            { header: t.rpt_purch_col_date, key: 'date' },
            { header: t.rpt_purch_col_status, key: 'status' },
          ],
      data: filteredRows.map((row) => ({
        reference: row.reference,
        itemName: row.itemName,
        model: row.model,
        plate: row.plate,
        chassis: row.chassis,
        baseAmount: `${formatCurrency(row.baseAmount)} ${t.rpt_currency}`,
        taxOrExpenses: `${formatCurrency(row.taxOrExpenses)} ${t.rpt_currency}`,
        totalAmount: `${formatCurrency(row.totalAmount)} ${t.rpt_currency}`,
        date: formatDate(row.date),
        status: getStatusText(row.status),
      })),
      summaryCards: [
        { label: `${language === 'ar' ? 'عدد' : 'Count'} ${getFilterLabel()}`, value: String(filteredRows.length) },
        { label: language === 'ar' ? 'إجمالي المشتريات' : 'Total purchases', value: `${formatCurrency(totalPurchases)} ${t.rpt_currency}` },
        {
          label: isCarDealership
            ? (language === 'ar' ? 'إجمالي المصروفات' : 'Total expenses')
            : (language === 'ar' ? 'إجمالي الضريبة' : 'Total tax'),
          value: `${formatCurrency(totalTaxOrExpenses)} ${t.rpt_currency}`,
        },
        { label: language === 'ar' ? 'الإجمالي الكلي' : 'Grand total', value: `${formatCurrency(grandTotal)} ${t.rpt_currency}` },
      ],
    });
  };

  const handleExportZatcaExcel = () => {
    if (filteredRows.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
      return;
    }

    // ZATCA-required columns — fixed order regardless of UI filters
    const headers = language === 'ar'
      ? ['م', 'رقم الفاتورة في النظام', 'رقم فاتورة المورد', 'اسم المورد', 'الرقم الضريبي للمورد', 'تاريخ الفاتورة', 'السعر قبل الضريبة', 'الضريبة', 'الإجمالي شامل الضريبة', 'ملاحظات / تحقق']
      : ['#', 'System Invoice #', 'Supplier Invoice #', 'Supplier Name', 'Supplier Tax #', 'Invoice Date', 'Subtotal (Excl. VAT)', 'VAT', 'Total (Incl. VAT)', 'Notes / Validation'];

    // Validation counters for the post-export toast
    let missingSupplierName = 0;
    let missingSupplierTax = 0;
    let missingSupplierInvNo = 0;
    let mathMismatch = 0;

    const MISSING = language === 'ar' ? 'غير متوفر' : 'N/A';
    const safeNum = (v: any): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    let runningSubtotal = 0;
    let runningVat = 0;
    let runningTotal = 0;

    const rows = filteredRows.map((row, idx) => {
      const inv: any = row.raw || {};
      const supplier: any = inv.supplier_id ? suppliersMap[inv.supplier_id] : null;

      // ── Supplier identity ──
      const supplierName: string =
        supplier?.name
        || inv.supplier?.name
        || inv.customer_name
        || (isCarDealership ? (inv.supplier as any)?.name : '')
        || '';
      const supplierTaxRaw =
        supplier?.id_number
        || (supplier as any)?.tax_number
        || inv.supplier_tax_number
        || inv.customer_vat_number
        || '';

      // ── Invoice identity ──
      const systemInvoiceNumber = inv.invoice_number || row.reference || '';
      const supplierInvoiceNumber = inv.supplier_invoice_number || '';

      // ── Amounts (always derived consistently) ──
      const subtotal = safeNum(inv.subtotal ?? row.baseAmount);
      const vat = safeNum(inv.vat_amount ?? row.taxOrExpenses);
      const total = safeNum(inv.total ?? row.totalAmount);

      runningSubtotal += subtotal;
      runningVat += vat;
      runningTotal += total;

      // ── Validation flags ──
      const issues: string[] = [];
      if (!supplierName.trim()) {
        missingSupplierName++;
        issues.push(language === 'ar' ? 'اسم المورد ناقص' : 'Missing supplier name');
      }
      if (!supplierTaxRaw.toString().trim()) {
        missingSupplierTax++;
        issues.push(language === 'ar' ? 'الرقم الضريبي ناقص' : 'Missing tax #');
      }
      if (!supplierInvoiceNumber.toString().trim()) {
        missingSupplierInvNo++;
        issues.push(language === 'ar' ? 'رقم فاتورة المورد ناقص' : 'Missing supplier invoice #');
      }
      // Math validation: subtotal + vat ≈ total (1 halala tolerance)
      if (Math.abs(total - (subtotal + vat)) > 0.05) {
        mathMismatch++;
        issues.push(language === 'ar' ? 'عدم تطابق رياضي' : 'Math mismatch');
      }

      const notes = issues.length > 0
        ? (language === 'ar' ? '⚠️ ' : '⚠️ ') + issues.join(' | ')
        : (language === 'ar' ? '✓ مكتملة' : '✓ Complete');

      return [
        idx + 1,
        systemInvoiceNumber || MISSING,
        supplierInvoiceNumber || MISSING,
        supplierName || MISSING,
        supplierTaxRaw || MISSING,
        row.date ? formatDate(row.date) : MISSING,
        Number(subtotal.toFixed(2)),
        Number(vat.toFixed(2)),
        Number(total.toFixed(2)),
        notes,
      ];
    });

    // Totals row uses re-summed values (consistent with displayed numbers)
    const totalsLabel = language === 'ar' ? 'الإجمالي' : 'Total';
    const totalsRow = [
      '', '', '', '', '', totalsLabel,
      Number(runningSubtotal.toFixed(2)),
      Number(runningVat.toFixed(2)),
      Number(runningTotal.toFixed(2)),
      '',
    ];

    const sheetData = [headers, ...rows, totalsRow];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Column widths
    ws['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 34 }, { wch: 20 },
      { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 36 },
    ];

    // Number format for currency columns (G, H, I)
    const lastRow = sheetData.length;
    for (let r = 2; r <= lastRow; r++) {
      ['G', 'H', 'I'].forEach((col) => {
        const cellAddr = `${col}${r}`;
        if (ws[cellAddr]) {
          ws[cellAddr].t = 'n';
          ws[cellAddr].z = '#,##0.00';
        }
      });
    }

    if (language === 'ar') {
      (ws as any)['!sheetView'] = [{ RTL: true }];
    }

    // Freeze header row
    (ws as any)['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, language === 'ar' ? 'فواتير المشتريات' : 'Purchase Invoices');

    const today = new Date().toISOString().split('T')[0];
    const companyName = (company?.name || 'company').replace(/[^\w\u0600-\u06FF]+/g, '_');
    const fileName = `ZATCA_Purchases_${companyName}_${today}.xlsx`;

    XLSX.writeFile(wb, fileName);

    // Detailed validation feedback
    const totalIssues = missingSupplierName + missingSupplierTax + missingSupplierInvNo + mathMismatch;
    if (totalIssues === 0) {
      toast.success(
        language === 'ar'
          ? `✅ تم تصدير ${rows.length} فاتورة بدون أي ملاحظات`
          : `✅ Exported ${rows.length} invoices with no issues`
      );
    } else {
      const parts: string[] = [];
      if (missingSupplierName) parts.push(language === 'ar' ? `${missingSupplierName} اسم مورد` : `${missingSupplierName} supplier name`);
      if (missingSupplierTax) parts.push(language === 'ar' ? `${missingSupplierTax} رقم ضريبي` : `${missingSupplierTax} tax #`);
      if (missingSupplierInvNo) parts.push(language === 'ar' ? `${missingSupplierInvNo} رقم فاتورة مورد` : `${missingSupplierInvNo} supplier inv #`);
      if (mathMismatch) parts.push(language === 'ar' ? `${mathMismatch} عدم تطابق رياضي` : `${mathMismatch} math mismatch`);

      toast.warning(
        language === 'ar'
          ? `⚠️ تم تصدير ${rows.length} فاتورة — راجع عمود "ملاحظات / تحقق": ${parts.join('، ')}`
          : `⚠️ Exported ${rows.length} invoices — review "Notes" column: ${parts.join(', ')}`,
        { duration: 8000 }
      );
    }
  };

  if (carsLoading || invoicesLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.rpt_purch_title}</h1>
          <p className="text-muted-foreground">{t.rpt_purch_subtitle}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CarStatusFilter | InvoiceStatusFilter)}
          >
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
              {isCarDealership ? (
                <>
                  <SelectItem value="available">{language === 'ar' ? 'المتاحة' : 'Available'}</SelectItem>
                  <SelectItem value="sold">{language === 'ar' ? 'المباعة' : 'Sold'}</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
                  <SelectItem value="issued">{language === 'ar' ? 'معتمدة' : 'Issued'}</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t.rpt_refresh}
          </Button>
          <Button
            variant="outline"
            onClick={handleExportZatcaExcel}
            className="gap-2 border-success/40 text-success hover:bg-success/10"
            title={language === 'ar' ? 'تصدير ملف Excel متوافق مع هيئة الزكاة والضريبة' : 'Export ZATCA-compliant Excel'}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {language === 'ar' ? 'تصدير Excel (هيئة الزكاة)' : 'Export Excel (ZATCA)'}
          </Button>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            {t.rpt_print_report}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'عدد السجلات' : 'Records count'}</p>
              <p className="text-2xl font-bold">{filteredRows.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المشتريات' : 'Total purchases'}</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPurchases)} {t.rpt_currency}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isCarDealership
                  ? (language === 'ar' ? 'إجمالي المصروفات' : 'Total expenses')
                  : (language === 'ar' ? 'إجمالي الضريبة' : 'Total tax')}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(totalTaxOrExpenses)} {t.rpt_currency}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{language === 'ar' ? 'الإجمالي الكلي' : 'Grand total'}</p>
              <p className="text-2xl font-bold">{formatCurrency(grandTotal)} {t.rpt_currency}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">{t.rpt_purch_details} - {getFilterLabel()}</h3>
          {statusFilter !== 'all' && (
            <Badge variant="secondary">{getFilterLabel()} ({filteredRows.length})</Badge>
          )}
        </div>

        {filteredRows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.rpt_purch_no_data}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{isCarDealership ? t.rpt_purch_col_number : (language === 'ar' ? 'رقم الفاتورة' : 'Invoice #')}</TableHead>
                <TableHead className="text-right font-bold">{isCarDealership ? t.rpt_purch_col_item : (language === 'ar' ? 'المورد' : 'Supplier')}</TableHead>
                {isCarDealership && <TableHead className="text-right font-bold">{t.rpt_purch_col_model}</TableHead>}
                {isCarDealership && <TableHead className="text-right font-bold">رقم اللوحة</TableHead>}
                {isCarDealership && <TableHead className="text-right font-bold">{t.rpt_purch_col_chassis}</TableHead>}
                <TableHead className="text-right font-bold">{isCarDealership ? t.rpt_purch_col_price : (language === 'ar' ? 'المبلغ الأساسي' : 'Base amount')}</TableHead>
                <TableHead className="text-right font-bold">{isCarDealership ? (language === 'ar' ? 'المصروفات' : 'Expenses') : (language === 'ar' ? 'الضريبة' : 'Tax')}</TableHead>
                <TableHead className="text-right font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_date}</TableHead>
                <TableHead className="text-right font-bold">{t.rpt_purch_col_status}</TableHead>
                {isCarDealership && <TableHead className="text-right font-bold">{t.rpt_purch_col_actions}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.reference}</TableCell>
                  <TableCell className="font-semibold">{row.itemName}</TableCell>
                  {isCarDealership && <TableCell>{row.model}</TableCell>}
                  {isCarDealership && <TableCell>{row.plate}</TableCell>}
                  {isCarDealership && <TableCell className="font-mono text-sm">{row.chassis}</TableCell>}
                  <TableCell>{formatCurrency(row.baseAmount)} {t.rpt_currency}</TableCell>
                  <TableCell>
                    {isCarDealership && row.taxOrExpenses > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="cursor-help underline decoration-dotted">
                            {formatCurrency(row.taxOrExpenses)} {t.rpt_currency}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1 text-sm">
                              {(carExpensesMap[row.id] || []).map((e, i) => (
                                <div key={i} className="flex justify-between gap-4">
                                  <span>{e.description}</span>
                                  <span>{formatCurrency(e.amount)}</span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span>{formatCurrency(row.taxOrExpenses)} {t.rpt_currency}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(row.totalAmount)} {t.rpt_currency}</TableCell>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getStatusText(row.status)}</Badge>
                  </TableCell>
                  {isCarDealership && (
                    <TableCell>
                      <PurchaseActions car={row.raw} />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
