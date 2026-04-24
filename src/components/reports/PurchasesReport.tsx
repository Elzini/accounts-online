import { useState, useMemo } from 'react';
import { FileText, ShoppingCart, Truck, Printer, RefreshCw, Filter, FileSpreadsheet, ShieldAlert, AlertTriangle, CheckCircle2, Download, Pencil } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
import { fetchSuppliers } from '@/services/suppliers';
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
  const [validationOpen, setValidationOpen] = useState(false);
  const [validationFilter, setValidationFilter] = useState<'all' | 'missing_name' | 'missing_tax' | 'missing_inv' | 'math' | 'duplicate'>('all');
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

  // ── ZATCA validation analysis (shared by export + validation page) ──
  type ValidationIssue = 'missing_name' | 'missing_tax' | 'missing_inv' | 'math' | 'duplicate';
  type ValidatedRow = {
    idx: number;
    row: ReportRow;
    systemInvoiceNumber: string;
    supplierInvoiceNumber: string;
    supplierName: string;
    supplierTax: string;
    subtotal: number;
    vat: number;
    total: number;
    issues: ValidationIssue[];
  };

  const validatedRows = useMemo<ValidatedRow[]>(() => {
    const safeNum = (v: any): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    // Pre-compute duplicate keys
    const dupCount = new Map<string, number>();
    filteredRows.forEach((row) => {
      const inv: any = row.raw || {};
      const supplier: any = inv.supplier_id ? suppliersMap[inv.supplier_id] : null;
      const sName = (supplier?.name || inv.supplier?.name || inv.customer_name || '').toString().trim().toLowerCase();
      const sTax = (supplier?.id_number || (supplier as any)?.tax_number || inv.supplier_tax_number || inv.customer_vat_number || '').toString().trim();
      const sInv = (inv.supplier_invoice_number || '').toString().trim();
      if (!sInv) return;
      const key = `${sTax || sName}::${sInv}`;
      dupCount.set(key, (dupCount.get(key) || 0) + 1);
    });

    return filteredRows.map((row, idx) => {
      const inv: any = row.raw || {};
      const supplier: any = inv.supplier_id ? suppliersMap[inv.supplier_id] : null;

      const supplierName: string =
        supplier?.name || inv.supplier?.name || inv.customer_name || '';
      const supplierTax: string =
        supplier?.id_number || (supplier as any)?.tax_number ||
        inv.supplier_tax_number || inv.customer_vat_number || '';
      const systemInvoiceNumber = inv.invoice_number || row.reference || '';
      const supplierInvoiceNumber = inv.supplier_invoice_number || '';
      const subtotal = safeNum(inv.subtotal ?? row.baseAmount);
      const vat = safeNum(inv.vat_amount ?? row.taxOrExpenses);
      const total = safeNum(inv.total ?? row.totalAmount);

      const issues: ValidationIssue[] = [];
      if (!supplierName.toString().trim()) issues.push('missing_name');
      if (!supplierTax.toString().trim()) issues.push('missing_tax');
      if (!supplierInvoiceNumber.toString().trim()) issues.push('missing_inv');
      if (Math.abs(total - (subtotal + vat)) > 0.05) issues.push('math');

      const sInvTrim = supplierInvoiceNumber.toString().trim();
      const sNameLower = supplierName.toString().trim().toLowerCase();
      const sTaxTrim = supplierTax.toString().trim();
      const dupKey = sInvTrim ? `${sTaxTrim || sNameLower}::${sInvTrim}` : '';
      if (dupKey && (dupCount.get(dupKey) || 0) > 1) issues.push('duplicate');

      return {
        idx, row, systemInvoiceNumber, supplierInvoiceNumber,
        supplierName, supplierTax: String(supplierTax),
        subtotal, vat, total, issues,
      };
    });
  }, [filteredRows, suppliersMap]);

  const issueRows = useMemo(() => validatedRows.filter(r => r.issues.length > 0), [validatedRows]);
  const filteredIssueRows = useMemo(() => {
    if (validationFilter === 'all') return issueRows;
    return issueRows.filter(r => r.issues.includes(validationFilter));
  }, [issueRows, validationFilter]);

  const issueLabel = (k: ValidationIssue) => {
    const ar = { missing_name: 'اسم المورد ناقص', missing_tax: 'الرقم الضريبي ناقص', missing_inv: 'رقم فاتورة المورد ناقص', math: 'عدم تطابق رياضي', duplicate: '🔁 فاتورة مكررة' };
    const en = { missing_name: 'Missing supplier name', missing_tax: 'Missing tax #', missing_inv: 'Missing supplier inv #', math: 'Math mismatch', duplicate: '🔁 Duplicate' };
    return language === 'ar' ? ar[k] : en[k];
  };

  const handleExportIssuesExcel = () => {
    if (filteredIssueRows.length === 0) {
      toast.info(language === 'ar' ? 'لا توجد فواتير بمشاكل للتصدير' : 'No problematic invoices to export');
      return;
    }

    const headers = language === 'ar'
      ? ['م', 'رقم النظام', 'رقم فاتورة المورد', 'اسم المورد', 'الرقم الضريبي', 'التاريخ', 'قبل الضريبة', 'الضريبة', 'الإجمالي', 'فرق الإجمالي', 'الملاحظات']
      : ['#', 'System #', 'Supplier Inv #', 'Supplier Name', 'Tax #', 'Date', 'Subtotal', 'VAT', 'Total', 'Total Diff', 'Issues'];

    const MISSING = language === 'ar' ? 'غير متوفر' : 'N/A';
    const data = filteredIssueRows.map((v, i) => {
      const diff = +(v.total - (v.subtotal + v.vat)).toFixed(2);
      return [
        i + 1,
        v.systemInvoiceNumber || MISSING,
        v.supplierInvoiceNumber || MISSING,
        v.supplierName || MISSING,
        v.supplierTax || MISSING,
        v.row.date ? formatDate(v.row.date) : MISSING,
        Number(v.subtotal.toFixed(2)),
        Number(v.vat.toFixed(2)),
        Number(v.total.toFixed(2)),
        diff,
        '⚠️ ' + v.issues.map(issueLabel).join(' | '),
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    ws['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 20 }, { wch: 32 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 40 }];
    const last = data.length + 1;
    for (let r = 2; r <= last; r++) {
      ['G', 'H', 'I', 'J'].forEach(c => {
        const a = `${c}${r}`;
        if (ws[a]) { ws[a].t = 'n'; ws[a].z = '#,##0.00'; }
      });
    }
    if (language === 'ar') (ws as any)['!sheetView'] = [{ RTL: true }];
    (ws as any)['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, language === 'ar' ? 'فواتير بها مشكلات' : 'Invoices with Issues');
    const today = new Date().toISOString().split('T')[0];
    const companyName = (company?.name || 'company').replace(/[^\w\u0600-\u06FF]+/g, '_');
    XLSX.writeFile(wb, `ZATCA_Issues_${companyName}_${today}.xlsx`);

    toast.success(
      language === 'ar'
        ? `✅ تم تصدير ${data.length} فاتورة بها مشكلات`
        : `✅ Exported ${data.length} problematic invoices`
    );
  };

  const handleExportZatcaExcel = async () => {
    if (filteredRows.length === 0) {
      toast.error(language === 'ar' ? 'لا توجد بيانات للتصدير' : 'No data to export');
      return;
    }

    // Force a fresh fetch of suppliers to ensure tax numbers are NOT served from a stale
    // (previously masked) React Query cache. Without this, recently fixed full tax numbers
    // can still appear truncated in the exported Excel for up to 5 minutes.
    await queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
    const freshSuppliers = await queryClient.fetchQuery({
      queryKey: ['suppliers', companyId],
      queryFn: fetchSuppliers,
    }) as typeof suppliers;
    const freshSuppliersMap = (freshSuppliers || []).reduce((acc, s) => {
      acc[s.id] = s;
      return acc;
    }, {} as Record<string, (typeof suppliers)[number]>);

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

    // Duplicate detection: same supplier invoice # under same supplier/tax
    const dupKeyCount = new Map<string, number>();
    filteredRows.forEach((row) => {
      const inv: any = row.raw || {};
      const supplier: any = inv.supplier_id ? freshSuppliersMap[inv.supplier_id] : null;
      const sName = (supplier?.name || inv.supplier?.name || inv.customer_name || '').toString().trim().toLowerCase();
      const sTax = (supplier?.id_number || (supplier as any)?.tax_number || inv.supplier_tax_number || inv.customer_vat_number || '').toString().trim();
      const sInv = (inv.supplier_invoice_number || '').toString().trim();
      if (!sInv) return;
      const key = `${sTax || sName}::${sInv}`;
      dupKeyCount.set(key, (dupKeyCount.get(key) || 0) + 1);
    });
    let duplicateCount = 0;

    const rows = filteredRows.map((row, idx) => {
      const inv: any = row.raw || {};
      const supplier: any = inv.supplier_id ? freshSuppliersMap[inv.supplier_id] : null;

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

      // Duplicate detection
      const sNameLower = supplierName.toString().trim().toLowerCase();
      const sTaxTrim = supplierTaxRaw.toString().trim();
      const sInvTrim = supplierInvoiceNumber.toString().trim();
      const dupKey = sInvTrim ? `${sTaxTrim || sNameLower}::${sInvTrim}` : '';
      const isDuplicate = dupKey && (dupKeyCount.get(dupKey) || 0) > 1;
      if (isDuplicate) {
        duplicateCount++;
        issues.push(language === 'ar' ? '🔁 فاتورة مكررة' : '🔁 Duplicate invoice');
      }

      const notes = issues.length > 0
        ? (language === 'ar' ? '⚠️ ' : '⚠️ ') + issues.join(' | ')
        : (language === 'ar' ? '✓ مكتملة' : '✓ Complete');

      return [
        idx + 1,
        systemInvoiceNumber || MISSING,
        supplierInvoiceNumber || MISSING,
        supplierName || MISSING,
        // Force tax number as string to preserve leading zeros & full digits in Excel
        supplierTaxRaw ? `\u200E${String(supplierTaxRaw).trim()}` : MISSING,
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

    // Column widths — wider tax # column to fit full Saudi VAT (15 digits)
    ws['!cols'] = [
      { wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 34 }, { wch: 22 },
      { wch: 14 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 40 },
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
      // Force tax-number column (E) to TEXT so Excel keeps leading zeros & full digits
      const taxAddr = `E${r}`;
      if (ws[taxAddr] && ws[taxAddr].v != null) {
        ws[taxAddr].t = 's';
        ws[taxAddr].z = '@';
        ws[taxAddr].v = String(ws[taxAddr].v).replace(/^\u200E/, '');
      }
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
    const totalIssues = missingSupplierName + missingSupplierTax + missingSupplierInvNo + mathMismatch + duplicateCount;
    if (totalIssues === 0) {
      toast.success(
        language === 'ar'
          ? `✅ تم تصدير ${rows.length} فاتورة بدون أي ملاحظات أو تكرار`
          : `✅ Exported ${rows.length} invoices — no issues, no duplicates`
      );
    } else {
      const parts: string[] = [];
      if (duplicateCount) parts.push(language === 'ar' ? `🔁 ${duplicateCount} فاتورة مكررة` : `🔁 ${duplicateCount} duplicates`);
      if (missingSupplierName) parts.push(language === 'ar' ? `${missingSupplierName} اسم مورد` : `${missingSupplierName} supplier name`);
      if (missingSupplierTax) parts.push(language === 'ar' ? `${missingSupplierTax} رقم ضريبي` : `${missingSupplierTax} tax #`);
      if (missingSupplierInvNo) parts.push(language === 'ar' ? `${missingSupplierInvNo} رقم فاتورة مورد` : `${missingSupplierInvNo} supplier inv #`);
      if (mathMismatch) parts.push(language === 'ar' ? `${mathMismatch} عدم تطابق رياضي` : `${mathMismatch} math mismatch`);

      toast.warning(
        language === 'ar'
          ? `⚠️ تم تصدير ${rows.length} فاتورة — راجع عمود "ملاحظات / تحقق": ${parts.join('، ')}`
          : `⚠️ Exported ${rows.length} invoices — review "Notes" column: ${parts.join(', ')}`,
        { duration: 9000 }
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
          {!isCarDealership && (
            <Button
              variant="outline"
              onClick={() => { setValidationFilter('all'); setValidationOpen(true); }}
              className={`gap-2 ${issueRows.length > 0 ? 'border-destructive/50 text-destructive hover:bg-destructive/10' : 'border-success/40 text-success hover:bg-success/10'}`}
              title={language === 'ar' ? 'فحص جودة بيانات فواتير المشتريات قبل التصدير' : 'Validate purchase invoices before export'}
            >
              <ShieldAlert className="w-4 h-4" />
              {language === 'ar' ? 'تحقق من التصدير' : 'Validate Export'}
              {issueRows.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5">{issueRows.length}</Badge>
              )}
            </Button>
          )}
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

      {/* ── ZATCA Validation Dialog ── */}
      <Dialog open={validationOpen} onOpenChange={setValidationOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              {language === 'ar' ? 'تحقق من تصدير هيئة الزكاة' : 'ZATCA Export Validation'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ar'
                ? `تم فحص ${validatedRows.length} فاتورة ضمن الفلاتر الحالية. يجب معالجة المشاكل قبل تقديم الملف للهيئة.`
                : `Scanned ${validatedRows.length} invoices under current filters. Issues should be fixed before submitting to the authority.`}
            </DialogDescription>
          </DialogHeader>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <button
              onClick={() => setValidationFilter('all')}
              className={`text-start rounded-lg border p-3 transition-colors ${validationFilter === 'all' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="text-xs text-muted-foreground">{language === 'ar' ? 'كل المشاكل' : 'All issues'}</div>
              <div className="text-xl font-bold text-destructive">{issueRows.length}</div>
            </button>
            <button
              onClick={() => setValidationFilter('duplicate')}
              className={`text-start rounded-lg border p-3 transition-colors ${validationFilter === 'duplicate' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="text-xs text-muted-foreground">{language === 'ar' ? '🔁 فواتير مكررة' : '🔁 Duplicates'}</div>
              <div className="text-xl font-bold text-destructive">{validatedRows.filter(r => r.issues.includes('duplicate')).length}</div>
            </button>
            <button
              onClick={() => setValidationFilter('missing_name')}
              className={`text-start rounded-lg border p-3 transition-colors ${validationFilter === 'missing_name' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="text-xs text-muted-foreground">{language === 'ar' ? 'اسم مورد ناقص' : 'Missing name'}</div>
              <div className="text-xl font-bold">{validatedRows.filter(r => r.issues.includes('missing_name')).length}</div>
            </button>
            <button
              onClick={() => setValidationFilter('missing_tax')}
              className={`text-start rounded-lg border p-3 transition-colors ${validationFilter === 'missing_tax' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم ضريبي ناقص' : 'Missing tax #'}</div>
              <div className="text-xl font-bold">{validatedRows.filter(r => r.issues.includes('missing_tax')).length}</div>
            </button>
            <button
              onClick={() => setValidationFilter('missing_inv')}
              className={`text-start rounded-lg border p-3 transition-colors ${validationFilter === 'missing_inv' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم فاتورة مورد ناقص' : 'Missing supplier inv #'}</div>
              <div className="text-xl font-bold">{validatedRows.filter(r => r.issues.includes('missing_inv')).length}</div>
            </button>
            <button
              onClick={() => setValidationFilter('math')}
              className={`text-start rounded-lg border p-3 transition-colors ${validationFilter === 'math' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
            >
              <div className="text-xs text-muted-foreground">{language === 'ar' ? 'عدم تطابق رياضي' : 'Math mismatch'}</div>
              <div className="text-xl font-bold">{validatedRows.filter(r => r.issues.includes('math')).length}</div>
            </button>
          </div>

          {/* Issues table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {filteredIssueRows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-success" />
                {issueRows.length === 0
                  ? (language === 'ar' ? 'كل الفواتير مكتملة وجاهزة للتصدير ✓' : 'All invoices are complete and ready to export ✓')
                  : (language === 'ar' ? 'لا توجد فواتير ضمن هذا الفلتر' : 'No invoices match this filter')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-right font-bold">#</TableHead>
                    <TableHead className="text-right font-bold">{language === 'ar' ? 'رقم النظام' : 'System #'}</TableHead>
                    <TableHead className="text-right font-bold">{language === 'ar' ? 'رقم فاتورة المورد' : 'Supplier Inv #'}</TableHead>
                    <TableHead className="text-right font-bold">{language === 'ar' ? 'المورد' : 'Supplier'}</TableHead>
                    <TableHead className="text-right font-bold">{language === 'ar' ? 'الرقم الضريبي' : 'Tax #'}</TableHead>
                    <TableHead className="text-right font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</TableHead>
                    <TableHead className="text-right font-bold">{language === 'ar' ? 'الملاحظات' : 'Issues'}</TableHead>
                    <TableHead className="text-center font-bold">{language === 'ar' ? 'إجراء' : 'Action'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssueRows.map((v, i) => (
                    <TableRow key={v.row.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{v.systemInvoiceNumber || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {v.supplierInvoiceNumber || <span className="text-destructive">—</span>}
                      </TableCell>
                      <TableCell>{v.supplierName || <span className="text-destructive">—</span>}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {v.supplierTax || <span className="text-destructive">—</span>}
                      </TableCell>
                      <TableCell>{formatCurrency(v.total)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {v.issues.map(k => (
                            <Badge key={k} variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {issueLabel(k)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                          onClick={() => {
                            const invId = (v.row as any)?.raw?.id || v.row.id;
                            sessionStorage.setItem('viewPurchaseInvoiceId', invId);
                            setValidationOpen(false);
                            window.dispatchEvent(new CustomEvent('app:navigate', { detail: { page: 'add-purchase-invoice' } }));
                          }}
                          title={language === 'ar' ? 'فتح الفاتورة لتصحيح البيانات' : 'Open invoice to fix data'}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setValidationOpen(false)}>
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            <Button
              onClick={handleExportIssuesExcel}
              disabled={filteredIssueRows.length === 0}
              className="gap-2"
              variant="destructive"
            >
              <Download className="w-4 h-4" />
              {language === 'ar'
                ? `تنزيل تقرير المشكلات (${filteredIssueRows.length})`
                : `Download Issues Report (${filteredIssueRows.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
