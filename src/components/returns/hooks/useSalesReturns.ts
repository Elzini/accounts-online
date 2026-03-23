/**
 * Sales Returns Hook - Extracted from SalesReturnsPage.tsx
 * Uses service layer instead of direct DB access.
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  fetchAvailableInvoicesForReturn, fetchSalesReturns, searchSaleByNumber,
  searchInvoiceByNumber, processCarReturn, deleteSaleWithJournal,
  deleteInvoiceWithJournal, insertCreditNote, deleteCreditNote,
} from '@/services/returns/salesReturnsService';

export interface ReturnItem {
  id: string;
  car_id: string;
  description: string;
  quantity: number;
  returnedQty: number;
  unit: string;
  price: number;
  total: number;
  discountPercent: number;
  discount: number;
  net: number;
  vat: number;
  grandTotal: number;
}

export function useSalesReturns() {
  const { language } = useLanguage();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const isCarDealership = useIndustryFeatures().hasCarInventory;
  const queryClient = useQueryClient();

  const [searchList, setSearchList] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<any>(null);
  const [foundInvoice, setFoundInvoice] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    invoiceType: 'normal', paymentMethod: 'cash', fullInvoice: true,
    returnDate: new Date().toISOString().split('T')[0], notes: '', costCenter: '', salesman: '', reference: '',
  });
  const [items, setItems] = useState<ReturnItem[]>([]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA').format(v);

  const { data: availableInvoices = [] } = useQuery({
    queryKey: ['available-invoices-for-return', companyId, isCarDealership],
    queryFn: () => fetchAvailableInvoicesForReturn(companyId!, isCarDealership),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['sales-returns', companyId],
    queryFn: () => fetchSalesReturns(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const searchInvoice = useCallback(async () => {
    if (!invoiceSearch.trim() || !companyId) return;
    setIsSearching(true);
    try {
      if (isCarDealership) {
        const sale = await searchSaleByNumber(companyId, parseInt(invoiceSearch));
        if (!sale) { toast.error(language === 'ar' ? 'لم يتم العثور على الفاتورة' : 'Invoice not found'); setFoundSale(null); setFoundInvoice(null); setItems([]); return; }
        setFoundSale(sale); setFoundInvoice(null);
        const saleItems = (sale as any).sale_items || [];
        if (saleItems.length > 0) {
          setItems(saleItems.map((item: any, idx: number) => { const price = Number(item.sale_price); const vat = price * 0.15; return { id: String(idx + 1), car_id: item.car_id, description: `${item.car?.name || ''} ${item.car?.model || ''} - ${item.car?.color || ''} - شاسيه: ${item.car?.chassis_number || ''}`, quantity: 1, returnedQty: 1, unit: 'سيارة', price, total: price, discountPercent: 0, discount: 0, net: price, vat, grandTotal: price + vat }; }));
        } else {
          const car = (sale as any).car; const price = Number(sale.sale_price); const vat = price * 0.15;
          setItems([{ id: '1', car_id: sale.car_id, description: `${car?.name || ''} ${car?.model || ''} - ${car?.color || ''} - شاسيه: ${car?.chassis_number || ''}`, quantity: 1, returnedQty: 1, unit: 'سيارة', price, total: price, discountPercent: 0, discount: 0, net: price, vat, grandTotal: price + vat }]);
        }
      } else {
        const invoice = await searchInvoiceByNumber(companyId, invoiceSearch);
        if (!invoice) { toast.error(language === 'ar' ? 'لم يتم العثور على الفاتورة' : 'Invoice not found'); setFoundSale(null); setFoundInvoice(null); setItems([]); return; }
        setFoundInvoice(invoice); setFoundSale(null);
        const invoiceItems = Array.isArray((invoice as any).items) ? (invoice as any).items : [];
        if (invoiceItems.length > 0) {
          setItems(invoiceItems.map((item: any, idx: number) => { const qty = Number(item.quantity) || 1; const price = Number(item.unitPrice || item.unit_price || item.price) || 0; const total = qty * price; const taxRate = Number(item.taxRate || item.tax_rate) || 0.15; const vat = total * taxRate; return { id: String(idx + 1), car_id: '', description: item.description || item.name || item.item_name || `صنف ${idx + 1}`, quantity: qty, returnedQty: qty, unit: item.unit || 'وحدة', price, total, discountPercent: 0, discount: 0, net: total, vat, grandTotal: total + vat }; }));
        } else {
          const price = Number(invoice.subtotal) || Number(invoice.total) || 0; const vat = Number(invoice.vat_amount) || price * 0.15;
          setItems([{ id: '1', car_id: '', description: `فاتورة رقم ${invoice.invoice_number}`, quantity: 1, returnedQty: 1, unit: 'وحدة', price, total: price, discountPercent: 0, discount: 0, net: price, vat, grandTotal: price + vat }]);
        }
      }
      toast.success(language === 'ar' ? 'تم العثور على الفاتورة' : 'Invoice found');
    } catch { toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error'); }
    finally { setIsSearching(false); }
  }, [invoiceSearch, companyId, language, isCarDealership]);

  const updateItem = (index: number, field: keyof ReturnItem, value: string | number) => {
    setItems(prev => { const updated = [...prev]; updated[index] = { ...updated[index], [field]: value }; const item = updated[index]; item.total = item.returnedQty * item.price; item.discount = item.total * (item.discountPercent / 100); item.net = item.total - item.discount; item.vat = item.net * 0.15; item.grandTotal = item.net + item.vat; return updated; });
  };

  const totals = items.reduce((acc, item) => ({ quantity: acc.quantity + item.returnedQty, total: acc.total + item.total, discount: acc.discount + item.discount, net: acc.net + item.net, vat: acc.vat + item.vat, grandTotal: acc.grandTotal + item.grandTotal }), { quantity: 0, total: 0, discount: 0, net: 0, vat: 0, grandTotal: 0 });

  const resetForm = () => { setFoundSale(null); setFoundInvoice(null); setItems([]); setInvoiceSearch(''); setForm({ invoiceType: 'normal', paymentMethod: 'cash', fullInvoice: true, returnDate: new Date().toISOString().split('T')[0], notes: '', costCenter: '', salesman: '', reference: '' }); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!foundSale && !foundInvoice) throw new Error('No sale/invoice found');
      if (isCarDealership && foundSale) {
        const returnedItems = items.filter(i => i.returnedQty > 0);
        await processCarReturn(returnedItems);
        await deleteSaleWithJournal(foundSale.id, form.fullInvoice);
      } else if (foundInvoice) {
        await deleteInvoiceWithJournal(foundInvoice.id, form.fullInvoice);
      }
      const refNumber = foundSale ? foundSale.sale_number : foundInvoice?.invoice_number;
      const num = `SR-${String(returns.length + 1).padStart(4, '0')}`;
      await insertCreditNote(companyId!, {
        note_number: num, note_date: form.returnDate, total_amount: totals.grandTotal,
        reason: `مرتجع فاتورة رقم ${refNumber}${form.notes ? ' - ' + form.notes : ''}`,
      });
    },
    onSuccess: () => {
      ['sales-returns', 'credit-debit-notes', 'sales', 'cars', 'stats', 'available-invoices-for-return', 'company-invoices'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      toast.success(language === 'ar' ? 'تم اعتماد مرتجع المبيعات' : 'Sales return approved');
      resetForm();
    },
    onError: (e) => { console.error(e); toast.error(language === 'ar' ? 'حدث خطأ أثناء اعتماد المرتجع' : 'Error approving return'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCreditNote(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sales-returns'] }); toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted'); },
  });

  const filtered = returns.filter((r: any) => r.note_number?.includes(searchList) || r.reason?.includes(searchList));
  const hasValidReturn = (foundSale || foundInvoice) && items.filter(i => i.returnedQty > 0).length > 0;

  return {
    language, activeTab, setActiveTab, searchList, setSearchList,
    invoiceSearch, setInvoiceSearch, isSearching, foundSale, foundInvoice,
    confirmOpen, setConfirmOpen, form, setForm, items, availableInvoices,
    returns, isLoading, searchInvoice, updateItem, totals, resetForm,
    saveMutation, deleteMutation, filtered, hasValidReturn, formatCurrency,
  };
}
