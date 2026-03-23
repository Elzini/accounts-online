/**
 * usePurchasesTable - Business logic hook extracted from PurchasesTable
 */
import { useState, useMemo, useCallback } from 'react';
import { Banknote, Building2, CreditCard, Wallet } from 'lucide-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useCars } from '@/hooks/useDatabase';
import { useExpenses } from '@/hooks/useExpenses';
import { useTaxSettings } from '@/hooks/useAccounting';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { approveInvoiceWithJournal } from '@/services/invoiceJournal';
import { toast } from 'sonner';

export function usePurchasesTable() {
  const queryClient = useQueryClient();
  const { companyId, company } = useCompany();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const industryLabels = useIndustryLabels();
  const { data: cars = [], isLoading, refetch } = useCars();
  const { data: allExpenses = [] } = useExpenses();
  const { data: taxSettings } = useTaxSettings();
  const { selectedFiscalYear } = useFiscalYear();
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();

  const { data: purchaseInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['purchase-invoices', companyId, selectedFiscalYear?.id],
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
  });

  const carExpensesMap = useMemo(() => {
    const map: Record<string, { description: string; amount: number }[]> = {};
    allExpenses.forEach(exp => {
      if (exp.car_id) {
        if (!map[exp.car_id]) map[exp.car_id] = [];
        map[exp.car_id].push({ description: exp.description, amount: Number(exp.amount) });
      }
    });
    return map;
  }, [allExpenses]);

  const getCarExpensesTotal = useCallback((carId: string) => {
    return (carExpensesMap[carId] || []).reduce((sum, e) => sum + e.amount, 0);
  }, [carExpensesMap]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings.tax_rate || 15) : 0;
  const currency = language === 'ar' ? 'ريال' : 'SAR';
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';

  const formatCurrency = useCallback((value: number) => String(Math.round(value)), []);
  const formatDate = useCallback((date: string) => new Intl.DateTimeFormat(locale).format(new Date(date)), [locale]);

  const normalizeInvoiceStatus = useCallback((status?: string) => String(status || '').trim().toLowerCase(), []);
  const isDraftInvoiceStatus = useCallback((status?: string) => {
    const n = normalizeInvoiceStatus(status);
    return n === 'draft' || n === 'مسودة';
  }, [normalizeInvoiceStatus]);
  const isApprovedInvoiceStatus = useCallback((status?: string) => {
    const n = normalizeInvoiceStatus(status);
    return n === 'approved' || n === 'issued' || n === 'معتمدة' || n === 'معتمد';
  }, [normalizeInvoiceStatus]);

  const calculateTaxDetails = useCallback((purchasePrice: number, carCondition?: string) => {
    const effectiveTaxRate = carCondition === 'used' ? 0 : taxRate;
    const taxAmount = purchasePrice * (effectiveTaxRate / 100);
    return {
      baseAmount: Math.round(purchasePrice * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalWithTax: Math.round((purchasePrice + taxAmount) * 100) / 100,
    };
  }, [taxRate]);

  const getPaymentMethodInfo = useCallback((code?: string) => {
    switch (code) {
      case '1101': return { label: t.payment_cash, icon: Banknote, color: 'text-green-600' };
      case '1102': return { label: t.payment_bank_transfer, icon: Building2, color: 'text-blue-600' };
      case '1103': return { label: t.payment_pos, icon: CreditCard, color: 'text-purple-600' };
      case '2101': return { label: t.payment_deferred, icon: Wallet, color: 'text-orange-600' };
      case '2102': return { label: t.payment_check, icon: Wallet, color: 'text-amber-600' };
      default: return { label: '-', icon: Wallet, color: 'text-muted-foreground' };
    }
  }, [t]);

  const invalidateAll = useCallback(() => {
    const keys = [
      ['purchase-invoices'], ['purchase-invoices-nav', companyId],
      ['company-purchases-report', companyId], ['invoices'],
      ['journal-entries'], ['stats'], ['advanced-analytics'],
      ['monthly-chart-data'], ['dashboard-recent-invoices'],
      ['trial-balance'], ['comprehensive-trial-balance'],
    ];
    keys.forEach(k => queryClient.invalidateQueries({ queryKey: k }));
  }, [queryClient, companyId]);

  const handleApproveInvoice = useCallback(async (invoiceId: string) => {
    try {
      await approveInvoiceWithJournal(invoiceId);
      invalidateAll();
      toast.success(language === 'ar' ? 'تم اعتماد الفاتورة وإنشاء القيد المحاسبي بنجاح' : 'Invoice approved and journal entry created');
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء اعتماد الفاتورة' : 'Error approving invoice');
    }
  }, [invalidateAll, language]);

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      const { data: linkedEntries } = await supabase
        .from('journal_entries').select('id')
        .eq('reference_id', invoiceId)
        .in('reference_type', ['invoice_purchase', 'invoice_sale']);
      if (linkedEntries && linkedEntries.length > 0) {
        const entryIds = linkedEntries.map(e => e.id);
        await supabase.from('journal_entry_lines').delete().in('journal_entry_id', entryIds);
        for (const eid of entryIds) {
          await (supabase.rpc as any)('delete_orphan_journal_entry', { entry_id: eid });
        }
      }
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;
      if (companyId) {
        const { data: remaining } = await (supabase as any)
          .from('invoices').select('id, invoice_number')
          .eq('company_id', companyId).eq('invoice_type', 'purchase')
          .order('created_at', { ascending: true });
        if (remaining && remaining.length > 0) {
          for (let i = 0; i < remaining.length; i++) {
            const expected = `PUR-${i + 1}`;
            if (remaining[i].invoice_number !== expected) {
              await supabase.from('invoices').update({ invoice_number: expected }).eq('id', remaining[i].id);
            }
          }
        }
      }
      invalidateAll();
      toast.success(language === 'ar' ? 'تم حذف الفاتورة وإعادة الترقيم بنجاح' : 'Invoice deleted and renumbered successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء حذف الفاتورة' : 'Error deleting invoice');
    }
    setDeleteInvoiceId(null);
  }, [invalidateAll, language, companyId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
    await queryClient.invalidateQueries({ queryKey: ['purchase-invoices', companyId] });
    await refetch();
    setIsRefreshing(false);
  }, [queryClient, companyId, refetch]);

  const draftInvoices = useMemo(() => {
    return purchaseInvoices.filter((inv: any) => isDraftInvoiceStatus(inv.status));
  }, [purchaseInvoices, isDraftInvoiceStatus]);

  const handleApproveAll = useCallback(async () => {
    if (draftInvoices.length === 0) {
      toast.info(language === 'ar' ? 'لا توجد فواتير مسودة للاعتماد' : 'No draft invoices to approve');
      return;
    }
    setIsApprovingAll(true);
    let successCount = 0, failCount = 0;
    for (const inv of draftInvoices) {
      try { await approveInvoiceWithJournal(inv.id); successCount++; }
      catch { failCount++; }
    }
    invalidateAll();
    setIsApprovingAll(false);
    if (successCount > 0) toast.success(language === 'ar' ? `تم اعتماد ${successCount} فاتورة بنجاح` : `${successCount} invoices approved`);
    if (failCount > 0) toast.error(language === 'ar' ? `فشل اعتماد ${failCount} فاتورة` : `${failCount} invoices failed`);
  }, [draftInvoices, invalidateAll, language]);

  // Filtered data
  const filteredInvoices = useMemo(() => {
    if (isCarDealership) return [];
    let result = purchaseInvoices;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((inv: any) =>
        inv.invoice_number?.toLowerCase().includes(q) || inv.supplier_invoice_number?.toLowerCase().includes(q) ||
        inv.supplier?.name?.toLowerCase().includes(q) || inv.notes?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'draft') result = result.filter((inv: any) => isDraftInvoiceStatus(inv.status));
      else if (statusFilter === 'approved') result = result.filter((inv: any) => isApprovedInvoiceStatus(inv.status));
      else result = result.filter((inv: any) => normalizeInvoiceStatus(inv.status) === statusFilter);
    }
    return result;
  }, [isCarDealership, purchaseInvoices, searchQuery, statusFilter, isDraftInvoiceStatus, isApprovedInvoiceStatus, normalizeInvoiceStatus]);

  const invoiceTotals = useMemo(() => {
    return filteredInvoices.reduce((acc: any, inv: any) => ({
      subtotal: acc.subtotal + (inv.subtotal || 0),
      vat: acc.vat + (inv.vat_amount || 0),
      total: acc.total + (inv.total || 0),
    }), { subtotal: 0, vat: 0, total: 0 });
  }, [filteredInvoices]);

  const filteredCars = useMemo(() => {
    if (!isCarDealership) return [];
    let result = cars;
    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date); fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date); fyEnd.setHours(23, 59, 59, 999);
      result = result.filter(car => { const d = new Date(car.purchase_date); return d >= fyStart && d <= fyEnd; });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(car => car.name.toLowerCase().includes(q) || car.model?.toLowerCase().includes(q) ||
        car.color?.toLowerCase().includes(q) || car.chassis_number.toLowerCase().includes(q) || car.inventory_number.toString().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(car => car.status === statusFilter);
    return result;
  }, [cars, searchQuery, statusFilter, selectedFiscalYear, isCarDealership]);

  const carTotals = useMemo(() => {
    return filteredCars.reduce((acc, car) => {
      const d = calculateTaxDetails(Number(car.purchase_price), (car as any).car_condition);
      return { baseAmount: acc.baseAmount + d.baseAmount, taxAmount: acc.taxAmount + d.taxAmount, totalWithTax: acc.totalWithTax + d.totalWithTax };
    }, { baseAmount: 0, taxAmount: 0, totalWithTax: 0 });
  }, [filteredCars, calculateTaxDetails]);

  return {
    // State
    isCarDealership, isLoading, invoicesLoading, isMobile, t, language,
    searchQuery, setSearchQuery, statusFilter, setStatusFilter,
    isRefreshing, isApprovingAll, deleteInvoiceId, setDeleteInvoiceId,
    expandedInvoiceId, setExpandedInvoiceId,
    // Data
    cars, purchaseInvoices, filteredInvoices, filteredCars,
    invoiceTotals, carTotals, draftInvoices, carExpensesMap,
    taxRate, currency,
    // Helpers
    formatCurrency, formatDate, calculateTaxDetails, getPaymentMethodInfo,
    getCarExpensesTotal, isDraftInvoiceStatus, normalizeInvoiceStatus,
    // Actions
    handleApproveInvoice, handleDeleteInvoice, handleRefresh, handleApproveAll,
  };
}
