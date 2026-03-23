import { useState, useMemo, useCallback } from 'react';
import { ShoppingCart, Car, Calendar, Wallet, Building2, CreditCard, Banknote, Hash, RefreshCw, Receipt, FileText, Edit, CheckCircle, Trash2, MoreHorizontal, Eye, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SearchFilter } from '@/components/ui/search-filter';
import { CarActions } from '@/components/actions/CarActions';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card-list';
import { ActivePage } from '@/types';
import { useCars } from '@/hooks/useDatabase';
import { useTaxSettings } from '@/hooks/useAccounting';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useExpenses } from '@/hooks/useExpenses';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { supabase } from '@/integrations/supabase/client';
import { approveInvoiceWithJournal } from '@/services/invoiceJournal';
import { InvoiceJournalEntry } from './InvoiceJournalEntry';
import { toast } from 'sonner';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';

interface PurchasesTableProps {
  setActivePage: (page: ActivePage) => void;
}

export function PurchasesTable({ setActivePage }: PurchasesTableProps) {
  const queryClient = useQueryClient();
  const { companyId, company } = useCompany();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const industryLabels = useIndustryLabels();
  const { data: cars = [], isLoading, refetch } = useCars();
  const { data: allExpenses = [] } = useExpenses();
  const { data: taxSettings } = useTaxSettings();
  const { selectedFiscalYear } = useFiscalYear();

  // Fetch purchase invoices for non-car companies
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

  // Build a map of car_id -> expenses
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

  const getCarExpensesTotal = (carId: string) => {
    return (carExpensesMap[carId] || []).reduce((sum, e) => sum + e.amount, 0);
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { t, language } = useLanguage();

  const handleApproveInvoice = useCallback(async (invoiceId: string) => {
    try {
      await approveInvoiceWithJournal(invoiceId);
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['company-purchases-report', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance'] });
      toast.success(language === 'ar' ? 'تم اعتماد الفاتورة وإنشاء القيد المحاسبي بنجاح' : 'Invoice approved and journal entry created');
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء اعتماد الفاتورة' : 'Error approving invoice');
    }
  }, [queryClient, language, companyId]);

  const handleDeleteInvoice = useCallback(async (invoiceId: string) => {
    try {
      // Delete linked journal entry lines and entries first
      const { data: linkedEntries } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('reference_id', invoiceId)
        .in('reference_type', ['invoice_purchase', 'invoice_sale']);

      if (linkedEntries && linkedEntries.length > 0) {
        const entryIds = linkedEntries.map(e => e.id);
        await supabase.from('journal_entry_lines').delete().in('journal_entry_id', entryIds);
        for (const eid of entryIds) {
          await (supabase.rpc as any)('delete_orphan_journal_entry', { entry_id: eid });
        }
      }

      // Delete invoice items then invoice
      await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (error) throw error;

      // Auto-renumber remaining purchase invoices
      if (companyId) {
        const { data: remaining } = await (supabase as any)
          .from('invoices')
          .select('id, invoice_number')
          .eq('company_id', companyId)
          .eq('invoice_type', 'purchase')
          .order('created_at', { ascending: true });

        if (remaining && remaining.length > 0) {
          for (let i = 0; i < remaining.length; i++) {
            const expectedNumber = `PUR-${i + 1}`;
            if (remaining[i].invoice_number !== expectedNumber) {
              await supabase
                .from('invoices')
                .update({ invoice_number: expectedNumber })
                .eq('id', remaining[i].id);
            }
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices-nav', companyId] });
      queryClient.invalidateQueries({ queryKey: ['company-purchases-report', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['advanced-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-chart-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-invoices'] });
      toast.success(language === 'ar' ? 'تم حذف الفاتورة وإعادة الترقيم بنجاح' : 'Invoice deleted and renumbered successfully');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء حذف الفاتورة' : 'Error deleting invoice');
    }
    setDeleteInvoiceId(null);
  }, [queryClient, language, companyId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['cars', companyId] });
    await queryClient.invalidateQueries({ queryKey: ['purchase-invoices', companyId] });
    await refetch();
    setIsRefreshing(false);
  };
  const normalizeInvoiceStatus = (status?: string) => String(status || '').trim().toLowerCase();

  const isDraftInvoiceStatus = (status?: string) => {
    const normalized = normalizeInvoiceStatus(status);
    return normalized === 'draft' || normalized === 'مسودة';
  };

  const isApprovedInvoiceStatus = (status?: string) => {
    const normalized = normalizeInvoiceStatus(status);
    return normalized === 'approved' || normalized === 'issued' || normalized === 'معتمدة' || normalized === 'معتمد';
  };

  const draftInvoices = useMemo(() => {
    return purchaseInvoices.filter((inv: any) => isDraftInvoiceStatus(inv.status));
  }, [purchaseInvoices]);

  const handleApproveAll = useCallback(async () => {
    if (draftInvoices.length === 0) {
      toast.info(language === 'ar' ? 'لا توجد فواتير مسودة للاعتماد' : 'No draft invoices to approve');
      return;
    }
    setIsApprovingAll(true);
    let successCount = 0;
    let failCount = 0;
    for (const inv of draftInvoices) {
      try {
        await approveInvoiceWithJournal(inv.id);
        successCount++;
      } catch (err) {
        console.error(`Error approving ${inv.invoice_number}:`, err);
        failCount++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-invoices-nav', companyId] });
    queryClient.invalidateQueries({ queryKey: ['company-purchases-report', companyId] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    queryClient.invalidateQueries({ queryKey: ['stats'] });
    queryClient.invalidateQueries({ queryKey: ['advanced-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
    queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance'] });
    setIsApprovingAll(false);
    if (successCount > 0) {
      toast.success(language === 'ar' ? `تم اعتماد ${successCount} فاتورة بنجاح` : `${successCount} invoices approved`);
    }
    if (failCount > 0) {
      toast.error(language === 'ar' ? `فشل اعتماد ${failCount} فاتورة` : `${failCount} invoices failed`);
    }
  }, [draftInvoices, queryClient, language, companyId]);

  const taxRate = taxSettings?.is_active && taxSettings?.apply_to_purchases ? (taxSettings.tax_rate || 15) : 0;
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';
  const currency = language === 'ar' ? 'ريال' : 'SAR';

  const formatCurrency = (value: number) => {
    return String(Math.round(value));
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat(locale).format(new Date(date));
  };

  const calculateTaxDetails = (purchasePrice: number, carCondition?: string) => {
    const baseAmount = purchasePrice;
    const effectiveTaxRate = carCondition === 'used' ? 0 : taxRate;
    const taxAmount = purchasePrice * (effectiveTaxRate / 100);
    const totalWithTax = purchasePrice + taxAmount;
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalWithTax: Math.round(totalWithTax * 100) / 100,
    };
  };

  const getPaymentMethodInfo = (code?: string) => {
    switch (code) {
      case '1101': return { label: t.payment_cash, icon: Banknote, color: 'text-green-600' };
      case '1102': return { label: t.payment_bank_transfer, icon: Building2, color: 'text-blue-600' };
      case '1103': return { label: t.payment_pos, icon: CreditCard, color: 'text-purple-600' };
      case '2101': return { label: t.payment_deferred, icon: Wallet, color: 'text-orange-600' };
      case '2102': return { label: t.payment_check, icon: Wallet, color: 'text-amber-600' };
      default: return { label: '-', icon: Wallet, color: 'text-muted-foreground' };
    }
  };




  const getStatusBadge = (status: string) => {
    const normalized = normalizeInvoiceStatus(status);
    switch (normalized) {
      case 'available':
        return <Badge className="bg-success hover:bg-success/90 text-xs">{t.status_available}</Badge>;
      case 'transferred':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-xs">{t.status_transferred}</Badge>;
      case 'sold':
        return <Badge variant="secondary" className="text-xs">{t.status_sold}</Badge>;
      case 'approved':
      case 'issued':
      case 'معتمدة':
      case 'معتمد':
        return <Badge className="bg-success hover:bg-success/90 text-xs">{language === 'ar' ? 'معتمدة' : 'Approved'}</Badge>;
      case 'draft':
      case 'مسودة':
        return <Badge variant="secondary" className="text-xs">{language === 'ar' ? 'مسودة' : 'Draft'}</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  // ===== Invoice-based data for non-car companies =====
  const filteredInvoices = useMemo(() => {
    if (isCarDealership) return [];
    let result = purchaseInvoices;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((inv: any) =>
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.supplier_invoice_number?.toLowerCase().includes(query) ||
        inv.supplier?.name?.toLowerCase().includes(query) ||
        inv.notes?.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'draft') {
        result = result.filter((inv: any) => isDraftInvoiceStatus(inv.status));
      } else if (statusFilter === 'approved') {
        result = result.filter((inv: any) => isApprovedInvoiceStatus(inv.status));
      } else {
        result = result.filter((inv: any) => normalizeInvoiceStatus(inv.status) === statusFilter);
      }
    }
    return result;
  }, [isCarDealership, purchaseInvoices, searchQuery, statusFilter]);

  const invoiceTotals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc: any, inv: any) => ({
        subtotal: acc.subtotal + (inv.subtotal || 0),
        vat: acc.vat + (inv.vat_amount || 0),
        total: acc.total + (inv.total || 0),
      }),
      { subtotal: 0, vat: 0, total: 0 }
    );
  }, [filteredInvoices]);

  // ===== NON-CAR COMPANY: Invoice-based purchases =====
  if (!isCarDealership) {
    const filterOptions = [
      { value: 'draft', label: language === 'ar' ? 'مسودة' : 'Draft' },
      { value: 'approved', label: language === 'ar' ? 'معتمدة' : 'Approved' },
    ];

    if (isLoading || invoicesLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.nav_purchases}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{language === 'ar' ? 'إدارة فواتير المشتريات' : 'Manage purchase invoices'}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="h-10 sm:h-11">
              <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
              {t.btn_refresh}
            </Button>
            {draftInvoices.length > 0 && (
              <Button
                variant="outline"
                onClick={handleApproveAll}
                disabled={isApprovingAll}
                className="h-10 sm:h-11 border-success text-success hover:bg-success hover:text-success-foreground"
              >
                <CheckCircle className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isApprovingAll ? 'animate-spin' : ''}`} />
                {isApprovingAll
                  ? (language === 'ar' ? `جاري الاعتماد...` : 'Approving...')
                  : (language === 'ar' ? `اعتماد الكل (${draftInvoices.length})` : `Approve All (${draftInvoices.length})`)
                }
              </Button>
            )}
            <Button onClick={() => setActivePage('add-purchase')} className="gradient-primary hover:opacity-90 flex-1 sm:flex-initial h-10 sm:h-11">
              <ShoppingCart className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'فاتورة مشتريات جديدة' : 'New Purchase Invoice'}
            </Button>
          </div>
        </div>

        <SearchFilter
          searchPlaceholder={language === 'ar' ? 'البحث برقم الفاتورة أو رقم فاتورة المورد...' : 'Search by invoice number or supplier invoice...'}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterOptions={filterOptions}
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterPlaceholder={t.filter_status}
        />

        <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</TableHead>
                <TableHead className="text-right font-bold">{language === 'ar' ? 'المورد' : 'Supplier'}</TableHead>
                <TableHead className="text-right font-bold">{t.th_base_amount}</TableHead>
                <TableHead className="text-right font-bold">{t.th_tax} ({taxRate}%)</TableHead>
                <TableHead className="text-right font-bold">{t.th_total_with_tax}</TableHead>
                <TableHead className="text-right font-bold">{t.th_payment_method}</TableHead>
                <TableHead className="text-right font-bold">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                <TableHead className="text-right font-bold">{t.th_status}</TableHead>
                <TableHead className="text-center font-bold">{language === 'ar' ? 'القيد' : 'Entry'}</TableHead>
                <TableHead className="text-center font-bold">{language === 'ar' ? 'إجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv: any) => {
                const paymentInfo = getPaymentMethodInfo(inv.payment_method);
                const PaymentIcon = paymentInfo.icon;
                const isExpanded = expandedInvoiceId === inv.id;
                return (
                  <>
                    <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          {inv.invoice_number}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{inv.supplier?.name || inv.customer_name || '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(inv.subtotal || 0)} {currency}</TableCell>
                      <TableCell className="text-orange-600 font-medium">{formatCurrency(inv.vat_amount || 0)} {currency}</TableCell>
                      <TableCell className="font-semibold text-primary">{formatCurrency(inv.total || 0)} {currency}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentIcon className={`w-4 h-4 ${paymentInfo.color}`} />
                          <span className={paymentInfo.color}>{paymentInfo.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{formatDate(inv.invoice_date || inv.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(inv.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={isExpanded ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isDraftInvoiceStatus(inv.status) && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveInvoice(inv.id)}>
                                  <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                                  {language === 'ar' ? 'اعتماد الفاتورة' : 'Approve Invoice'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDeleteInvoiceId(inv.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 ml-2" />
                                  {language === 'ar' ? 'حذف' : 'Delete'}
                                </DropdownMenuItem>
                              </>
                            )}
                            {!isDraftInvoiceStatus(inv.status) && (
                              <DropdownMenuItem onClick={() => {
                                sessionStorage.setItem('viewPurchaseInvoiceId', inv.id);
                                setActivePage('add-purchase-invoice');
                              }}>
                                <Eye className="w-4 h-4 ml-2" />
                                {language === 'ar' ? 'عرض' : 'View'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${inv.id}-journal`}>
                        <TableCell colSpan={10} className="p-2 bg-muted/20">
                          <InvoiceJournalEntry invoiceId={inv.id} invoiceNumber={inv.invoice_number} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>

          {filteredInvoices.length > 0 && (
            <div className="border-t bg-muted/30 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_base_amount}</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(invoiceTotals.subtotal))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(invoiceTotals.vat))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_purchases_with_tax}</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(invoiceTotals.total))} {currency}</p>
                </div>
              </div>
            </div>
          )}

          {purchaseInvoices.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد فواتير مشتريات' : 'No purchase invoices'}</p>
              <Button onClick={() => setActivePage('add-purchase')} className="mt-4 gradient-primary">
                {language === 'ar' ? 'إضافة أول فاتورة مشتريات' : 'Add First Purchase Invoice'}
              </Button>
            </div>
          )}

          {purchaseInvoices.length > 0 && filteredInvoices.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>

        <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</AlertDialogTitle>
              <AlertDialogDescription>
                {language === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this invoice? This action cannot be undone.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteInvoiceId && handleDeleteInvoice(deleteInvoiceId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {language === 'ar' ? 'حذف' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ===== CAR DEALERSHIP: Original car-based purchases =====
  const filteredCars = useMemo(() => {
    let result = cars;

    if (selectedFiscalYear) {
      const fyStart = new Date(selectedFiscalYear.start_date);
      fyStart.setHours(0, 0, 0, 0);
      const fyEnd = new Date(selectedFiscalYear.end_date);
      fyEnd.setHours(23, 59, 59, 999);

      result = result.filter((car) => {
        const purchaseDate = new Date(car.purchase_date);
        return purchaseDate >= fyStart && purchaseDate <= fyEnd;
      });
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(car =>
        car.name.toLowerCase().includes(query) ||
        car.model?.toLowerCase().includes(query) ||
        car.color?.toLowerCase().includes(query) ||
        car.chassis_number.toLowerCase().includes(query) ||
        car.inventory_number.toString().includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(car => car.status === statusFilter);
    }
    
    return result;
  }, [cars, searchQuery, statusFilter, selectedFiscalYear]);

  const totals = useMemo(() => {
    return filteredCars.reduce(
      (acc, car) => {
        const details = calculateTaxDetails(Number(car.purchase_price), (car as any).car_condition);
        return {
          baseAmount: acc.baseAmount + details.baseAmount,
          taxAmount: acc.taxAmount + details.taxAmount,
          totalWithTax: acc.totalWithTax + details.totalWithTax,
        };
      },
      { baseAmount: 0, taxAmount: 0, totalWithTax: 0 }
    );
  }, [filteredCars, taxRate]);

  const filterOptions = [
    { value: 'available', label: t.status_available },
    { value: 'sold', label: t.status_sold },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{t.nav_purchases}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t.subtitle_manage_inventory}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 sm:h-11"
          >
            <RefreshCw className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'} ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.btn_refresh}
          </Button>
          <Button 
            onClick={() => setActivePage('add-purchase')}
            className="gradient-primary hover:opacity-90 flex-1 sm:flex-initial h-10 sm:h-11"
          >
            <ShoppingCart className={`w-5 h-5 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
            {t.btn_add_car}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        searchPlaceholder={t.search_purchases}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterChange={setStatusFilter}
        filterPlaceholder={t.filter_status}
      />

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredCars.map((car) => {
            const taxDetails = calculateTaxDetails(Number(car.purchase_price), (car as any).car_condition);
            const paymentAccount = (car as any).payment_account;
            const paymentInfo = getPaymentMethodInfo(paymentAccount?.code);
            
            return (
              <MobileCard key={car.id}>
                <MobileCardHeader
                  title={car.name}
                  subtitle={`${car.model || ''} ${car.color ? `- ${car.color}` : ''}`}
                  badge={getStatusBadge(car.status)}
                  actions={<CarActions car={car} />}
                />
                <div className="space-y-1">
                  <MobileCardRow label={t.th_inventory_number} value={car.inventory_number} icon={<Hash className="w-3.5 h-3.5" />} />
                  <MobileCardRow label={t.th_chassis_number} value={<span dir="ltr" className="font-mono text-xs">{car.chassis_number}</span>} icon={<Car className="w-3.5 h-3.5" />} />
                  <MobileCardRow label={t.th_base_amount} value={`${formatCurrency(taxDetails.baseAmount)} ${currency}`} icon={<Wallet className="w-3.5 h-3.5" />} />
                  {taxRate > 0 && (
                    <MobileCardRow label={`${t.th_tax} (${taxRate}%)`} value={<span className="text-orange-600">{formatCurrency(taxDetails.taxAmount)} {currency}</span>} />
                  )}
                  <MobileCardRow label={t.th_total_with_tax} value={<span className="text-primary font-bold">{formatCurrency(taxDetails.totalWithTax)} {currency}</span>} />
                  {(() => {
                    const carExps = carExpensesMap[car.id] || [];
                    const expTotal = getCarExpensesTotal(car.id);
                    return carExps.length > 0 ? (
                      <>
                        <MobileCardRow 
                          label="المصروفات"
                          value={
                            <div className="text-sm">
                              {carExps.map((e, i) => (
                                <div key={i} className="flex justify-between gap-2">
                                  <span className="text-muted-foreground">{e.description}</span>
                                  <span className="text-orange-600 font-medium">{formatCurrency(e.amount)} {currency}</span>
                                </div>
                              ))}
                            </div>
                          }
                          icon={<Receipt className="w-3.5 h-3.5" />}
                        />
                        <MobileCardRow label="إجمالي التكلفة" value={<span className="text-success font-bold">{formatCurrency(taxDetails.totalWithTax + expTotal)} {currency}</span>} />
                      </>
                    ) : null;
                  })()}
                  <MobileCardRow label={t.th_purchase_date} value={formatDate(car.purchase_date)} icon={<Calendar className="w-3.5 h-3.5" />} />
                  <MobileCardRow label={t.th_payment_method} value={<span className={paymentInfo.color}>{paymentInfo.label}</span>} />
                </div>
              </MobileCard>
            );
          })}
          
          {filteredCars.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mt-4">
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">{t.total_base_amount}</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} {currency}</p>
              </div>
              {taxRate > 0 && (
                <div className="bg-card rounded-xl p-4 border">
                  <p className="text-xs text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} {currency}</p>
                </div>
              )}
              <div className="bg-card rounded-xl p-4 border">
                <p className="text-xs text-muted-foreground">{t.total_purchases_with_tax}</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} {currency}</p>
              </div>
            </div>
          )}

          {cars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground mb-4">{t.no_cars_in_stock}</p>
              <Button onClick={() => setActivePage('add-purchase')} className="gradient-primary">{t.add_first_car}</Button>
            </div>
          )}

          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-8 text-center bg-card rounded-xl border">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="bg-card rounded-xl md:rounded-2xl card-shadow overflow-hidden overflow-x-auto">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-right font-bold">{t.th_inventory_number}</TableHead>
                <TableHead className="text-right font-bold">{t.th_car_name}</TableHead>
                <TableHead className="text-right font-bold">{t.th_model}</TableHead>
                <TableHead className="text-right font-bold">{t.th_color}</TableHead>
                <TableHead className="text-right font-bold">{t.th_chassis_number}</TableHead>
                <TableHead className="text-right font-bold">رقم اللوحة</TableHead>
                <TableHead className="text-right font-bold">{t.th_base_amount}</TableHead>
                <TableHead className="text-right font-bold">{t.th_tax} ({taxRate}%)</TableHead>
                <TableHead className="text-right font-bold">{t.th_total_with_tax}</TableHead>
                <TableHead className="text-right font-bold">المصروفات</TableHead>
                <TableHead className="text-right font-bold">إجمالي التكلفة</TableHead>
                <TableHead className="text-right font-bold">{t.th_payment_method}</TableHead>
                <TableHead className="text-right font-bold">{t.th_purchase_date}</TableHead>
                <TableHead className="text-right font-bold">{t.th_status}</TableHead>
                <TableHead className="text-right font-bold">{t.th_actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => {
                const taxDetails = calculateTaxDetails(Number(car.purchase_price), (car as any).car_condition);
                const paymentAccount = (car as any).payment_account;
                const paymentInfo = getPaymentMethodInfo(paymentAccount?.code);
                const PaymentIcon = paymentInfo.icon;
                return (
                <TableRow key={car.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{car.inventory_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{car.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{car.model || '-'}</TableCell>
                  <TableCell>{car.color || '-'}</TableCell>
                  <TableCell dir="ltr" className="text-right font-mono text-sm">{car.chassis_number}</TableCell>
                  <TableCell>{(car as any).plate_number || '-'}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(taxDetails.baseAmount)} {currency}</TableCell>
                  <TableCell className="text-orange-600 font-medium">{formatCurrency(taxDetails.taxAmount)} {currency}</TableCell>
                  <TableCell className="font-semibold text-primary">{formatCurrency(taxDetails.totalWithTax)} {currency}</TableCell>
                  <TableCell>
                    {(() => {
                      const carExps = carExpensesMap[car.id] || [];
                      if (carExps.length === 0) return <span className="text-muted-foreground">-</span>;
                      return (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-orange-600 font-medium cursor-help underline decoration-dotted">
                                {formatCurrency(getCarExpensesTotal(car.id))} {currency}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1 text-sm">
                                {carExps.map((e, i) => (
                                  <div key={i} className="flex justify-between gap-4">
                                    <span>{e.description}</span>
                                    <span className="font-bold">{formatCurrency(e.amount)} {currency}</span>
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="font-bold text-success">
                    {formatCurrency(taxDetails.totalWithTax + getCarExpensesTotal(car.id))} {currency}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PaymentIcon className={`w-4 h-4 ${paymentInfo.color}`} />
                      <span className={paymentInfo.color}>{paymentInfo.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(car.purchase_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(car.status)}
                  </TableCell>
                  <TableCell>
                    <CarActions car={car} />
                  </TableCell>
                </TableRow>
              );})}
            </TableBody>
          </Table>

          {/* Tax Summary */}
          {filteredCars.length > 0 && (
            <div className="border-t bg-muted/30 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_base_amount}</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(Math.round(totals.baseAmount))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_tax} ({taxRate}%)</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(Math.round(totals.taxAmount))} {currency}</p>
                </div>
                <div className="bg-card rounded-lg p-3 border">
                  <p className="text-sm text-muted-foreground">{t.total_purchases_with_tax}</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(Math.round(totals.totalWithTax))} {currency}</p>
                </div>
              </div>
            </div>
          )}
          
          {cars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_cars_in_stock}</p>
              <Button onClick={() => setActivePage('add-purchase')} className="mt-4 gradient-primary">{t.add_first_car}</Button>
            </div>
          )}

          {cars.length > 0 && filteredCars.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">{t.no_search_results}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
