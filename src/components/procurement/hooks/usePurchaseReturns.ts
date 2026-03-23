/**
 * usePurchaseReturns - Business logic hook extracted from PurchaseReturnsPage (1005 lines)
 */
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/hooks/modules/useMiscServices';
import { createPurchaseReturnJournal } from '@/services/purchaseReturnJournal';
import { useIndustryFeatures } from '@/hooks/useIndustryFeatures';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ReturnItem {
  id: string;
  car_id?: string;
  invoice_item_id?: string;
  description: string;
  item_name: string;
  quantity: number;
  returnedQty: number;
  unit: string;
  cost: number;
  total: number;
  vat: number;
  grandTotal: number;
  selected: boolean;
}

export interface FoundCarData {
  id: string;
  inventory_number: number;
  name: string;
  model: string | null;
  color: string | null;
  chassis_number: string;
  purchase_price: number;
  purchase_date: string;
  status: string;
  supplier?: { name: string } | null;
  batch_id: string | null;
}

export interface FoundInvoiceData {
  id: string;
  invoice_number: string;
  supplier_id: string | null;
  supplier_name: string;
  invoice_date: string;
  subtotal: number;
  vat_amount: number;
  total: number;
  status: string;
  items: any[];
}

export function usePurchaseReturns() {
  const { language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { hasCarInventory: isCarDealership } = useIndustryFeatures();

  const [searchList, setSearchList] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundCar, setFoundCar] = useState<FoundCarData | null>(null);
  const [foundInvoice, setFoundInvoice] = useState<FoundInvoiceData | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    invoiceType: 'normal',
    paymentMethod: 'cash',
    fullInvoice: true,
    returnDate: new Date().toISOString().split('T')[0],
    notes: '',
    costCenter: '',
    reference: '',
    partialAmount: 0,
  });
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [editingReturn, setEditingReturn] = useState<any>(null);
  const [editForm, setEditForm] = useState({ note_date: '', total_amount: 0, tax_amount: 0, reason: '' });

  const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA').format(v);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['purchase-returns', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_debit_notes')
        .select('*')
        .eq('company_id', companyId!)
        .eq('note_type', 'debit')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const processFoundInvoice = useCallback((invoice: any) => {
    const invoiceData: FoundInvoiceData = {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      supplier_id: invoice.supplier_id,
      supplier_name: invoice.supplier?.name || invoice.customer_name || '-',
      invoice_date: invoice.invoice_date?.split('T')[0] || '',
      subtotal: Number(invoice.subtotal) || 0,
      vat_amount: Number(invoice.vat_amount) || 0,
      total: Number(invoice.total) || 0,
      status: invoice.status,
      items: invoice.invoice_items || [],
    };
    setFoundInvoice(invoiceData);
    setFoundCar(null);

    const invoiceItems = invoice.invoice_items || [];
    if (invoiceItems.length > 0) {
      setItems(invoiceItems.map((item: any, idx: number) => {
        const unitPrice = Number(item.unit_price) || 0;
        const qty = Number(item.quantity) || 1;
        const itemTotal = unitPrice * qty;
        const itemVat = Number(item.vat_amount) || (itemTotal * 0.15);
        return {
          id: String(idx + 1), invoice_item_id: item.id,
          item_name: item.item_description || '',
          description: `${item.item_description || ''} ${item.item_code ? `(${item.item_code})` : ''}`.trim(),
          quantity: qty, returnedQty: qty, unit: item.unit || 'وحدة',
          cost: unitPrice, total: itemTotal, vat: itemVat, grandTotal: itemTotal + itemVat, selected: true,
        };
      }));
    } else {
      const subtotal = invoiceData.subtotal;
      const vat = invoiceData.vat_amount;
      setItems([{
        id: '1', item_name: language === 'ar' ? 'إجمالي الفاتورة' : 'Invoice Total',
        description: `${language === 'ar' ? 'فاتورة رقم' : 'Invoice #'} ${invoiceData.invoice_number}`,
        quantity: 1, returnedQty: 1, unit: language === 'ar' ? 'فاتورة' : 'Invoice',
        cost: subtotal, total: subtotal, vat, grandTotal: subtotal + vat, selected: true,
      }]);
    }
    toast.success(language === 'ar' ? 'تم العثور على الفاتورة' : 'Invoice found');
  }, [language]);

  const searchCar = useCallback(async () => {
    if (!searchQuery.trim() || !companyId) return;
    setIsSearching(true);
    try {
      const { data: car, error: cErr } = await supabase
        .from('cars')
        .select('id, inventory_number, name, model, color, chassis_number, purchase_price, purchase_date, status, batch_id, supplier_id')
        .eq('company_id', companyId)
        .eq('inventory_number', parseInt(searchQuery))
        .single();
      if (cErr || !car) { toast.error(language === 'ar' ? 'لم يتم العثور على السيارة بهذا الرقم' : 'Car not found'); setFoundCar(null); setItems([]); return; }
      if (car.status !== 'available') { toast.error(language === 'ar' ? 'السيارة غير متاحة للإرجاع' : 'Car not available'); setFoundCar(null); setItems([]); return; }
      let supplierName = '-';
      if (car.supplier_id) { const { data: sup } = await supabase.from('suppliers').select('name').eq('id', car.supplier_id).single(); if (sup) supplierName = sup.name; }
      setFoundCar({ ...car, supplier: { name: supplierName } });
      setFoundInvoice(null);
      const cost = Number(car.purchase_price);
      const vat = cost * 0.15;
      setItems([{ id: '1', car_id: car.id, item_name: `${car.name || ''} ${car.model || ''}`, description: `${car.name || ''} ${car.model || ''} - ${car.color || ''} - شاسيه: ${car.chassis_number || ''}`, quantity: 1, returnedQty: 1, unit: 'سيارة', cost, total: cost, vat, grandTotal: cost + vat, selected: true }]);
      toast.success(language === 'ar' ? 'تم العثور على السيارة' : 'Car found');
    } catch { toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error'); }
    finally { setIsSearching(false); }
  }, [searchQuery, companyId, language]);

  const searchInvoice = useCallback(async () => {
    if (!searchQuery.trim() || !companyId) return;
    setIsSearching(true);
    try {
      const { data: invoice, error: iErr } = await (supabase as any)
        .from('invoices').select('*, invoice_items(*), supplier:suppliers!invoices_supplier_id_fkey(name)')
        .eq('company_id', companyId).eq('invoice_type', 'purchase')
        .or(`invoice_number.eq.${searchQuery},invoice_number.ilike.%${searchQuery}%`)
        .limit(1).single();
      if (iErr || !invoice) {
        const { data: inv2, error: iErr2 } = await (supabase as any)
          .from('invoices').select('*, invoice_items(*), supplier:suppliers!invoices_supplier_id_fkey(name)')
          .eq('company_id', companyId).eq('invoice_type', 'purchase')
          .ilike('invoice_number', `%${searchQuery}%`).limit(1).single();
        if (iErr2 || !inv2) { toast.error(language === 'ar' ? 'لم يتم العثور على الفاتورة' : 'Invoice not found'); setFoundInvoice(null); setItems([]); setIsSearching(false); return; }
        processFoundInvoice(inv2); return;
      }
      processFoundInvoice(invoice);
    } catch { toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error'); }
    finally { setIsSearching(false); }
  }, [searchQuery, companyId, language, processFoundInvoice]);

  const handleSearch = useCallback(() => { isCarDealership ? searchCar() : searchInvoice(); }, [isCarDealership, searchCar, searchInvoice]);

  const updateItem = useCallback((index: number, field: keyof ReturnItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const item = updated[index];
      item.total = item.returnedQty * item.cost;
      item.vat = item.total * 0.15;
      item.grandTotal = item.total + item.vat;
      return updated;
    });
  }, []);

  const totals = items.filter(i => i.selected).reduce((acc, item) => ({
    quantity: acc.quantity + item.returnedQty,
    total: acc.total + item.total,
    vat: acc.vat + item.vat,
    grandTotal: acc.grandTotal + item.grandTotal,
  }), { quantity: 0, total: 0, vat: 0, grandTotal: 0 });

  const resetForm = useCallback(() => {
    setFoundCar(null); setFoundInvoice(null); setItems([]); setSearchQuery('');
    setForm({ invoiceType: 'normal', paymentMethod: 'cash', fullInvoice: true, returnDate: new Date().toISOString().split('T')[0], notes: '', costCenter: '', reference: '', partialAmount: 0 });
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!foundCar && !foundInvoice) throw new Error('No item found');
      const returnedItems = items.filter(i => i.selected && i.returnedQty > 0);
      if (isCarDealership && foundCar) {
        for (const item of returnedItems) { if (item.car_id) { const { error: carErr } = await supabase.from('cars').update({ status: 'returned' }).eq('id', item.car_id); if (carErr) throw carErr; } }
        if (form.fullInvoice && foundCar.batch_id) { await supabase.from('journal_entries').delete().eq('reference_type', 'purchase').eq('reference_id', foundCar.batch_id); }
      }
      const num = `PR-${String(returns.length + 1).padStart(4, '0')}`;
      const isPartial = !form.fullInvoice;
      const reason = isCarDealership && foundCar
        ? `مرتجع شراء سيارة رقم مخزون ${foundCar.inventory_number}${isPartial ? ` (إرجاع جزئي: ${formatCurrency(totals.total)} ريال)` : ''}${form.notes ? ' - ' + form.notes : ''}`
        : `مرتجع فاتورة مشتريات رقم ${foundInvoice?.invoice_number || ''}${isPartial ? ` (إرجاع جزئي: ${formatCurrency(totals.total)} ريال)` : ''}${form.notes ? ' - ' + form.notes : ''}`;
      const { error } = await supabase.from('credit_debit_notes').insert({ company_id: companyId!, note_number: num, note_type: 'debit', note_date: form.returnDate, total_amount: totals.grandTotal, tax_amount: totals.vat, supplier_id: foundInvoice?.supplier_id || null, related_invoice_id: foundInvoice?.id || null, reason, status: 'approved' });
      if (error) throw error;
      const { data: insertedNote } = await supabase.from('credit_debit_notes').select('id').eq('company_id', companyId!).eq('note_number', num).single();
      if (insertedNote) {
        if (returnedItems.length > 0) {
          const linesWithId = returnedItems.map(item => ({ note_id: insertedNote.id, item_name: item.item_name || item.description, quantity: item.returnedQty, unit_price: item.cost, notes: item.description }));
          await supabase.from('credit_debit_note_lines').insert(linesWithId);
        }
        await createPurchaseReturnJournal(insertedNote.id);
      }
    },
    onSuccess: () => {
      ['purchase-returns', 'credit-debit-notes', 'purchase-batches', 'purchase-invoices', 'cars', 'stats', 'trial-balance', 'journal-entries'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      toast.success(language === 'ar' ? 'تم اعتماد مرتجع المشتريات وتسجيل القيد المحاسبي' : 'Purchase return approved with journal entry');
      resetForm();
    },
    onError: (e) => { console.error(e); toast.error(language === 'ar' ? 'حدث خطأ أثناء اعتماد المرتجع' : 'Error approving return'); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-returns'] }); toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted'); },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingReturn) return;
      const { error } = await supabase.from('credit_debit_notes').update({ note_date: editForm.note_date, total_amount: editForm.total_amount, tax_amount: editForm.tax_amount, reason: editForm.reason }).eq('id', editingReturn.id);
      if (error) throw error;
    },
    onSuccess: () => {
      ['purchase-returns', 'vat-return-report', 'credit-debit-notes'].forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      setEditingReturn(null); toast.success(language === 'ar' ? 'تم تحديث المرتجع بنجاح' : 'Return updated');
    },
    onError: (e) => { console.error(e); toast.error(language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Error updating return'); },
  });

  const openEdit = useCallback((r: any) => {
    setEditingReturn(r);
    setEditForm({ note_date: r.note_date || '', total_amount: Number(r.total_amount) || 0, tax_amount: Number(r.tax_amount) || 0, reason: r.reason || '' });
  }, []);

  const filtered = returns.filter((r: any) => r.note_number?.includes(searchList) || r.reason?.includes(searchList));
  const hasValidReturn = (foundCar || foundInvoice) && items.filter(i => i.selected && i.returnedQty > 0).length > 0;
  const supplierName = foundCar?.supplier?.name || foundInvoice?.supplier_name || '';

  return {
    // State
    language, isCarDealership, isLoading, isSearching, activeTab, setActiveTab,
    searchQuery, setSearchQuery, searchList, setSearchList,
    form, setForm, items, setItems, editingReturn, setEditingReturn, editForm, setEditForm,
    foundCar, foundInvoice, confirmOpen, setConfirmOpen,
    // Computed
    returns, filtered, totals, hasValidReturn, supplierName,
    // Actions
    handleSearch, updateItem, resetForm, openEdit, formatCurrency,
    saveMutation, deleteMutation, updateMutation,
  };
}
