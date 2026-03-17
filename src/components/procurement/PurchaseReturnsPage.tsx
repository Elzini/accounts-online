import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Trash2, RotateCw, Printer, Save, Loader2, AlertTriangle, CheckCircle, Package, X, FileText, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompany } from '@/contexts/CompanyContext';

interface ReturnItem {
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

interface FoundCarData {
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

interface FoundInvoiceData {
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

export function PurchaseReturnsPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const queryClient = useQueryClient();
  const isCarDealership = company?.company_type === 'car_dealership';

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

  // Search for car (car dealership)
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

      if (cErr || !car) {
        toast.error(language === 'ar' ? 'لم يتم العثور على السيارة بهذا الرقم' : 'Car not found with this number');
        setFoundCar(null);
        setItems([]);
        return;
      }

      if (car.status !== 'available') {
        toast.error(language === 'ar' ? 'السيارة غير متاحة للإرجاع (قد تكون مباعة أو مرتجعة)' : 'Car not available for return');
        setFoundCar(null);
        setItems([]);
        return;
      }

      let supplierName = '-';
      if (car.supplier_id) {
        const { data: sup } = await supabase.from('suppliers').select('name').eq('id', car.supplier_id).single();
        if (sup) supplierName = sup.name;
      }

      const foundCarData: FoundCarData = { ...car, supplier: { name: supplierName } };
      setFoundCar(foundCarData);
      setFoundInvoice(null);

      const cost = Number(car.purchase_price);
      const vat = cost * 0.15;
      setItems([{
        id: '1',
        car_id: car.id,
        item_name: `${car.name || ''} ${car.model || ''}`,
        description: `${car.name || ''} ${car.model || ''} - ${car.color || ''} - شاسيه: ${car.chassis_number || ''}`,
        quantity: 1,
        returnedQty: 1,
        unit: 'سيارة',
        cost,
        total: cost,
        vat,
        grandTotal: cost + vat,
        selected: true,
      }]);
      toast.success(language === 'ar' ? 'تم العثور على السيارة' : 'Car found');
    } catch (e) {
      toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, companyId, language]);

  // Search for invoice (non-car companies)
  const searchInvoice = useCallback(async () => {
    if (!searchQuery.trim() || !companyId) return;
    setIsSearching(true);
    try {
      const { data: invoice, error: iErr } = await (supabase as any)
        .from('invoices')
        .select('*, invoice_items(*), supplier:suppliers!invoices_supplier_id_fkey(name)')
        .eq('company_id', companyId)
        .eq('invoice_type', 'purchase')
        .or(`invoice_number.eq.${searchQuery},invoice_number.ilike.%${searchQuery}%`)
        .limit(1)
        .single();

      if (iErr || !invoice) {
        // Try numeric search
        const { data: inv2, error: iErr2 } = await (supabase as any)
          .from('invoices')
          .select('*, invoice_items(*), supplier:suppliers!invoices_supplier_id_fkey(name)')
          .eq('company_id', companyId)
          .eq('invoice_type', 'purchase')
          .ilike('invoice_number', `%${searchQuery}%`)
          .limit(1)
          .single();

        if (iErr2 || !inv2) {
          toast.error(language === 'ar' ? 'لم يتم العثور على الفاتورة بهذا الرقم' : 'Invoice not found');
          setFoundInvoice(null);
          setItems([]);
          setIsSearching(false);
          return;
        }
        processFoundInvoice(inv2);
        return;
      }
      processFoundInvoice(invoice);
    } catch (e) {
      toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, companyId, language]);

  const processFoundInvoice = (invoice: any) => {
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
          id: String(idx + 1),
          invoice_item_id: item.id,
          item_name: item.item_description || '',
          description: `${item.item_description || ''} ${item.item_code ? `(${item.item_code})` : ''}`.trim(),
          quantity: qty,
          returnedQty: qty,
          unit: item.unit || 'وحدة',
          cost: unitPrice,
          total: itemTotal,
          vat: itemVat,
          grandTotal: itemTotal + itemVat,
          selected: true,
        };
      }));
    } else {
      // No line items, create single item from header
      const subtotal = invoiceData.subtotal;
      const vat = invoiceData.vat_amount;
      setItems([{
        id: '1',
        item_name: language === 'ar' ? 'إجمالي الفاتورة' : 'Invoice Total',
        description: `${language === 'ar' ? 'فاتورة رقم' : 'Invoice #'} ${invoiceData.invoice_number}`,
        quantity: 1,
        returnedQty: 1,
        unit: language === 'ar' ? 'فاتورة' : 'Invoice',
        cost: subtotal,
        total: subtotal,
        vat,
        grandTotal: subtotal + vat,
        selected: true,
      }]);
    }
    toast.success(language === 'ar' ? 'تم العثور على الفاتورة' : 'Invoice found');
  };

  const handleSearch = () => {
    if (isCarDealership) {
      searchCar();
    } else {
      searchInvoice();
    }
  };

  const updateItem = (index: number, field: keyof ReturnItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const item = updated[index];
      item.total = item.returnedQty * item.cost;
      item.vat = item.total * 0.15;
      item.grandTotal = item.total + item.vat;
      return updated;
    });
  };

  const totals = items.filter(i => i.selected).reduce((acc, item) => ({
    quantity: acc.quantity + item.returnedQty,
    total: acc.total + item.total,
    vat: acc.vat + item.vat,
    grandTotal: acc.grandTotal + item.grandTotal,
  }), { quantity: 0, total: 0, vat: 0, grandTotal: 0 });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!foundCar && !foundInvoice) throw new Error('No item found');

      const returnedItems = items.filter(i => i.selected && i.returnedQty > 0);

      if (isCarDealership && foundCar) {
        // Car return logic
        for (const item of returnedItems) {
          if (item.car_id) {
            const { error: carErr } = await supabase
              .from('cars')
              .update({ status: 'returned' })
              .eq('id', item.car_id);
            if (carErr) throw carErr;
          }
        }

        if (form.fullInvoice && foundCar.batch_id) {
          await supabase
            .from('journal_entries')
            .delete()
            .eq('reference_type', 'purchase')
            .eq('reference_id', foundCar.batch_id);
        }
      }

      const num = `PR-${String(returns.length + 1).padStart(4, '0')}`;
      const isPartial = !form.fullInvoice;
      const reason = isCarDealership && foundCar
        ? `مرتجع شراء سيارة رقم مخزون ${foundCar.inventory_number}${isPartial ? ` (إرجاع جزئي: ${formatCurrency(totals.total)} ريال)` : ''}${form.notes ? ' - ' + form.notes : ''}`
        : `مرتجع فاتورة مشتريات رقم ${foundInvoice?.invoice_number || ''}${isPartial ? ` (إرجاع جزئي: ${formatCurrency(totals.total)} ريال)` : ''}${form.notes ? ' - ' + form.notes : ''}`;

      const { error } = await supabase.from('credit_debit_notes').insert({
        company_id: companyId!,
        note_number: num,
        note_type: 'debit',
        note_date: form.returnDate,
        total_amount: totals.grandTotal,
        tax_amount: totals.vat,
        supplier_id: foundInvoice?.supplier_id || null,
        related_invoice_id: foundInvoice?.id || null,
        reason,
        status: 'approved',
      });
      if (error) throw error;

      // Insert return line items
      if (returnedItems.length > 0) {
        const noteLines = returnedItems.map(item => ({
          note_id: '', // will need the note id
          item_name: item.item_name || item.description,
          quantity: item.returnedQty,
          unit_price: item.cost,
          notes: item.description,
        }));
        // Get the just-inserted note
        const { data: insertedNote } = await supabase.from('credit_debit_notes')
          .select('id')
          .eq('company_id', companyId!)
          .eq('note_number', num)
          .single();
        if (insertedNote) {
          const linesWithId = noteLines.map(l => ({ ...l, note_id: insertedNote.id }));
          await supabase.from('credit_debit_note_lines').insert(linesWithId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-batches'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(language === 'ar' ? 'تم اعتماد مرتجع المشتريات' : 'Purchase return approved');
      resetForm();
    },
    onError: (e) => {
      console.error(e);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء اعتماد المرتجع' : 'Error approving return');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingReturn) return;
      const { error } = await supabase.from('credit_debit_notes')
        .update({
          note_date: editForm.note_date,
          total_amount: editForm.total_amount,
          tax_amount: editForm.tax_amount,
          reason: editForm.reason,
        })
        .eq('id', editingReturn.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      queryClient.invalidateQueries({ queryKey: ['vat-return-report'] });
      queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] });
      setEditingReturn(null);
      toast.success(language === 'ar' ? 'تم تحديث المرتجع بنجاح' : 'Return updated');
    },
    onError: (e) => {
      console.error(e);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء التحديث' : 'Error updating return');
    },
  });

  const openEdit = (r: any) => {
    setEditingReturn(r);
    setEditForm({
      note_date: r.note_date || '',
      total_amount: Number(r.total_amount) || 0,
      tax_amount: Number(r.tax_amount) || 0,
      reason: r.reason || '',
    });
  };

  const resetForm = () => {
    setFoundCar(null);
    setFoundInvoice(null);
    setItems([]);
    setSearchQuery('');
    setForm({
      invoiceType: 'normal',
      paymentMethod: 'cash',
      fullInvoice: true,
      returnDate: new Date().toISOString().split('T')[0],
      notes: '',
      costCenter: '',
      reference: '',
      partialAmount: 0,
    });
  };

  const filtered = returns.filter((r: any) => r.note_number?.includes(searchList) || r.reason?.includes(searchList));
  const hasValidReturn = (foundCar || foundInvoice) && items.filter(i => i.selected && i.returnedQty > 0).length > 0;
  const supplierName = foundCar?.supplier?.name || foundInvoice?.supplier_name || '';

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4" dir="rtl">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">

          {/* ===== Header ===== */}
          <div className="bg-gradient-to-l from-violet-600 via-purple-500 to-fuchsia-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 opacity-80" />
                  <h1 className="text-lg font-bold tracking-wide">
                    {language === 'ar' ? 'مرتجع مشتريات / إشعار مدين' : 'Purchase Returns / Debit Note'}
                  </h1>
                </div>
                {(foundCar || foundInvoice) && (
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold shadow-sm bg-white text-violet-700">
                    {foundCar
                      ? (language === 'ar' ? `مخزون #${foundCar.inventory_number}` : `Inv #${foundCar.inventory_number}`)
                      : (language === 'ar' ? `فاتورة #${foundInvoice?.invoice_number}` : `Invoice #${foundInvoice?.invoice_number}`)}
                  </span>
                )}
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-white/15 backdrop-blur-sm h-8">
                  <TabsTrigger value="form" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-violet-700 h-7 px-3">
                    {language === 'ar' ? 'بيانات أساسية' : 'Basic Data'}
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-violet-700 h-7 px-3">
                    {language === 'ar' ? 'السجلات' : 'Records'} ({returns.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Found item banner */}
          {foundCar && (
            <div className="bg-violet-50 dark:bg-violet-900/20 border-b-2 border-violet-200 dark:border-violet-800 px-5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-200 block">
                    {foundCar.name} {foundCar.model} - {foundCar.color} - شاسيه: {foundCar.chassis_number}
                  </span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400">
                    {language === 'ar' ? `المورد: ${foundCar.supplier?.name || '-'} | سعر الشراء: ${formatCurrency(foundCar.purchase_price)} ريال` : `Supplier: ${foundCar.supplier?.name} | Price: ${formatCurrency(foundCar.purchase_price)}`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-600 hover:bg-violet-100" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {foundInvoice && (
            <div className="bg-violet-50 dark:bg-violet-900/20 border-b-2 border-violet-200 dark:border-violet-800 px-5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-200 block">
                    {language === 'ar' ? `فاتورة مشتريات رقم ${foundInvoice.invoice_number}` : `Purchase Invoice #${foundInvoice.invoice_number}`}
                  </span>
                  <span className="text-[10px] text-violet-600 dark:text-violet-400">
                    {language === 'ar'
                      ? `المورد: ${foundInvoice.supplier_name} | الإجمالي: ${formatCurrency(foundInvoice.total)} ريال | التاريخ: ${foundInvoice.invoice_date}`
                      : `Supplier: ${foundInvoice.supplier_name} | Total: ${formatCurrency(foundInvoice.total)} | Date: ${foundInvoice.invoice_date}`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-violet-600 hover:bg-violet-100" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {activeTab === 'form' && (
            <>
              {/* ===== Search & Header Form ===== */}
              <div className="p-4 border-b space-y-4 bg-card">
                {/* Section: Search */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-violet-500 rounded-full"></div>
                  <span className="text-xs font-bold text-foreground tracking-wide">
                    {isCarDealership
                      ? (language === 'ar' ? 'بحث عن سيارة بالمخزون' : 'Search Car by Inventory #')
                      : (language === 'ar' ? 'بحث عن فاتورة مشتريات' : 'Search Purchase Invoice')}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isCarDealership
                        ? (language === 'ar' ? 'رقم المخزون' : 'Inventory Number')
                        : (language === 'ar' ? 'رقم الفاتورة' : 'Invoice Number')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-violet-500 shadow-none font-mono flex-1"
                        placeholder={isCarDealership
                          ? (language === 'ar' ? 'أدخل رقم المخزون' : 'Enter inventory #')
                          : (language === 'ar' ? 'أدخل رقم الفاتورة' : 'Enter invoice #')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        type={isCarDealership ? 'number' : 'text'}
                      />
                      <Button size="sm" className="h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-lg gap-1.5" onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {language === 'ar' ? 'بحث' : 'Search'}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'رقم الإشعار' : 'Note #'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none font-mono" value={`PR-${String(returns.length + 1).padStart(4, '0')}`} readOnly />
                  </div>
                </div>

                {/* Section: Return Info */}
                <div className="flex items-center gap-2 mt-4 mb-1">
                  <div className="w-1 h-5 bg-fuchsia-500 rounded-full"></div>
                  <span className="text-xs font-bold text-foreground tracking-wide">{language === 'ar' ? 'بيانات المرتجع' : 'Return Details'}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date'}</Label>
                    <Input type="date" className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</Label>
                    <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
                      <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{language === 'ar' ? 'نقدية' : 'Cash'}</SelectItem>
                        <SelectItem value="credit">{language === 'ar' ? 'آجل' : 'Credit'}</SelectItem>
                        <SelectItem value="bank">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المورد' : 'Supplier'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none" value={supplierName} readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'م. التكلفة' : 'Cost Center'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none" value={form.costCenter} onChange={e => setForm(p => ({ ...p, costCenter: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المرجع' : 'Reference'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-fuchsia-500 shadow-none" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المستودع' : 'Warehouse'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none" value={language === 'ar' ? '1 - الرئيسي' : '1 - Main'} readOnly />
                  </div>
                </div>

                {/* Options Row */}
                <div className="flex items-center gap-6 pt-3 border-t border-border/40 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Checkbox id="fullInvoicePR" checked={form.fullInvoice} onCheckedChange={(v) => {
                      const isFullInvoice = !!v;
                      setForm(p => ({ ...p, fullInvoice: isFullInvoice, partialAmount: 0 }));
                      if (isFullInvoice) {
                        // Reset items to original quantities
                        setItems(prev => prev.map(item => {
                          const total = item.quantity * item.cost;
                          const vat = total * 0.15;
                          return { ...item, returnedQty: item.quantity, total, vat, grandTotal: total + vat };
                        }));
                      }
                    }} className="h-4 w-4" />
                    <Label htmlFor="fullInvoicePR" className="text-xs cursor-pointer text-muted-foreground font-semibold">
                      {language === 'ar' ? 'كامل الفاتورة' : 'Full Invoice'}
                    </Label>
                  </div>
                  {!form.fullInvoice && (foundInvoice || foundCar) && (
                    <div className="flex items-center gap-2">
                      <Label className="text-[10px] font-semibold text-muted-foreground">{language === 'ar' ? 'مبلغ الإرجاع (قبل الضريبة)' : 'Return Amount (excl. VAT)'}</Label>
                      <Input 
                        type="number" 
                        className="h-7 text-xs border-0 border-b-2 border-fuchsia-400 rounded-none bg-transparent w-40 font-mono text-center"
                        value={form.partialAmount || ''}
                        placeholder={language === 'ar' ? 'أدخل المبلغ' : 'Enter amount'}
                        onChange={e => {
                          const val = Number(e.target.value);
                          const maxAmount = foundInvoice ? foundInvoice.subtotal : (foundCar ? foundCar.purchase_price : 0);
                          const amount = Math.min(Math.max(0, val), maxAmount);
                          setForm(p => ({ ...p, partialAmount: amount }));
                          // Update items to reflect partial amount
                          if (items.length === 1) {
                            setItems(prev => [{
                              ...prev[0],
                              returnedQty: 1,
                              cost: amount,
                              total: amount,
                              vat: amount * 0.15,
                              grandTotal: amount + (amount * 0.15),
                            }]);
                          }
                        }}
                        max={foundInvoice ? foundInvoice.subtotal : (foundCar ? foundCar.purchase_price : 0)}
                        min={0}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {language === 'ar' ? `من أصل ${formatCurrency(foundInvoice?.subtotal || foundCar?.purchase_price || 0)} ريال` : `of ${formatCurrency(foundInvoice?.subtotal || foundCar?.purchase_price || 0)}`}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0 flex items-center gap-2 mr-auto">
                    <Label className="text-[10px] text-muted-foreground">{language === 'ar' ? 'ملاحظات' : 'Notes'}:</Label>
                    <Input className="h-7 text-xs border-0 border-b border-border rounded-none bg-transparent w-64" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder={language === 'ar' ? 'أضف ملاحظات...' : 'Add notes...'} />
                  </div>
                </div>
              </div>

              {/* ===== Items Table ===== */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-b-2 border-violet-200 dark:border-violet-800">
                      <TableHead className="text-center text-[11px] font-bold w-10 text-violet-700 dark:text-violet-400">
                        <Checkbox 
                          checked={items.length > 0 && items.every(i => i.selected)} 
                          onCheckedChange={(v) => setItems(prev => prev.map(i => {
                            const selected = !!v;
                            return { ...i, selected, returnedQty: selected ? i.quantity : 0 };
                          }))}
                          className="h-4 w-4"
                        />
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-bold w-8 text-violet-700 dark:text-violet-400">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[120px] text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الصنف' : 'Item'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[160px] text-violet-700 dark:text-violet-400">{language === 'ar' ? 'البيان' : 'Description'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-20 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'صادرة' : 'Issued'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-20 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'مرتجعة' : 'Returned'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'التكلفة' : 'Cost'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-20 text-violet-700 dark:text-violet-400">VAT</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الإجمالي' : 'Grand'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx} className={`hover:bg-violet-50/50 dark:hover:bg-violet-950/20 border-b transition-colors ${!item.selected ? 'opacity-40' : ''}`}>
                        <TableCell className="text-center py-2">
                          <Checkbox 
                            checked={item.selected} 
                            onCheckedChange={(v) => {
                              setItems(prev => {
                                const updated = [...prev];
                                const selected = !!v;
                                updated[idx] = { ...updated[idx], selected, returnedQty: selected ? updated[idx].quantity : 0 };
                                if (selected) {
                                  const i = updated[idx];
                                  i.total = i.returnedQty * i.cost;
                                  i.vat = i.total * 0.15;
                                  i.grandTotal = i.total + i.vat;
                                }
                                return updated;
                              });
                            }}
                            className="h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs py-2 font-medium">{item.item_name}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{item.description}</TableCell>
                        <TableCell className="text-center text-xs py-2">{item.quantity}</TableCell>
                        <TableCell className="text-center text-xs py-2">{item.quantity}</TableCell>
                        <TableCell className="py-1">
                          <Input type="number" className="h-7 text-xs w-16 text-center border-0 border-b border-border rounded-none bg-transparent" value={item.returnedQty || ''}
                            onChange={e => updateItem(idx, 'returnedQty', Math.min(Number(e.target.value), item.quantity))}
                            max={item.quantity} min={0}
                          />
                        </TableCell>
                        <TableCell className="text-center text-xs py-2">{item.unit}</TableCell>
                        <TableCell className="py-1">
                          {!form.fullInvoice ? (
                            <Input type="number" className="h-7 text-xs w-20 text-center border-0 border-b border-border rounded-none bg-transparent font-mono" 
                              value={item.cost || ''}
                              onChange={e => {
                                const maxCost = foundInvoice?.items?.[idx] ? (Number(foundInvoice.items[idx].unit_price) || 0) : (foundCar?.purchase_price || Infinity);
                                updateItem(idx, 'cost', Math.min(Number(e.target.value), maxCost));
                              }}
                              min={0}
                            />
                          ) : (
                            <span className="font-mono">{formatCurrency(item.cost)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.total)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono text-warning">{formatCurrency(item.vat)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono font-bold">{formatCurrency(item.grandTotal)}</TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            {isCarDealership ? <Package className="w-8 h-8 text-muted-foreground/30" /> : <FileText className="w-8 h-8 text-muted-foreground/30" />}
                            <span className="text-sm">
                              {isCarDealership
                                ? (language === 'ar' ? 'أدخل رقم المخزون للبحث' : 'Enter inventory number to search')
                                : (language === 'ar' ? 'أدخل رقم الفاتورة للبحث' : 'Enter invoice number to search')}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ===== Totals Section ===== */}
              <div className="p-4 border-t bg-card">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-3 text-center text-white shadow-lg md:col-span-2">
                    <div className="text-2xl font-black">{formatCurrency(totals.grandTotal)}</div>
                    <div className="text-[10px] font-medium mt-0.5 opacity-90">{language === 'ar' ? 'إجمالي المرتجع' : 'Total Return'}</div>
                  </div>
                  <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-foreground">{formatCurrency(totals.total)}</div>
                    <div className="text-[9px] text-muted-foreground font-semibold">{language === 'ar' ? 'المجموع' : 'Total'}</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-warning">{formatCurrency(totals.vat)}</div>
                    <div className="text-[9px] text-warning font-semibold">VAT 15%</div>
                  </div>
                  <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-foreground">{totals.quantity}</div>
                    <div className="text-[9px] text-muted-foreground font-semibold">{language === 'ar' ? 'الكمية' : 'Qty'}</div>
                  </div>
                </div>
              </div>

              {/* ===== Action Bar ===== */}
              <div className="border-t-2 border-violet-100 dark:border-violet-900 bg-gradient-to-b from-card to-muted/30">
                <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-md"
                    onClick={() => {
                      if (!hasValidReturn) {
                        toast.error(language === 'ar'
                          ? (isCarDealership ? 'يرجى البحث عن سيارة وتحديد كمية الإرجاع' : 'يرجى البحث عن فاتورة وتحديد كمية الإرجاع')
                          : 'Please search and set return quantity');
                        return;
                      }
                      setConfirmOpen(true);
                    }}
                    disabled={saveMutation.isPending || !hasValidReturn}
                  >
                    {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    {language === 'ar' ? 'اعتماد المرتجع' : 'Approve Return'}
                  </Button>

                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" onClick={resetForm}>
                    <Plus className="w-3.5 h-3.5 text-violet-600" /> {language === 'ar' ? 'سند جديد' : 'New'}
                  </Button>

                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled>
                    <Printer className="w-3.5 h-3.5 text-muted-foreground" /> {language === 'ar' ? 'طباعة' : 'Print'}
                  </Button>

                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm" disabled={!foundCar && !foundInvoice}>
                    <Trash2 className="w-3.5 h-3.5" /> {language === 'ar' ? 'حذف' : 'Delete'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'list' && (
            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pr-9 h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-violet-500 shadow-none" placeholder={language === 'ar' ? 'بحث في السجلات...' : 'Search records...'} value={searchList} onChange={e => setSearchList(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-l from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-b-2 border-violet-200 dark:border-violet-800">
                      <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'رقم السند' : 'Note #'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold text-violet-700 dark:text-violet-400">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r: any) => (
                      <TableRow key={r.id} className="hover:bg-violet-50/50 dark:hover:bg-violet-950/20 transition-colors">
                        <TableCell className="font-mono font-bold text-xs">{r.note_number}</TableCell>
                        <TableCell className="text-xs">{r.note_date}</TableCell>
                        <TableCell className="font-bold text-xs">{Number(r.total_amount).toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.reason || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={r.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">
                            {r.status === 'approved' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-full" onClick={() => openEdit(r)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-full" onClick={() => deleteMutation.mutate(r.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <RotateCw className="w-8 h-8 text-muted-foreground/30" />
                            <span className="text-sm">{language === 'ar' ? 'لا توجد مرتجعات' : 'No returns found'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-violet-500" />
              {language === 'ar' ? 'تأكيد اعتماد المرتجع' : 'Confirm Return Approval'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{language === 'ar' ? 'هل أنت متأكد من اعتماد هذا المرتجع؟' : 'Are you sure you want to approve this return?'}</p>
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-3 space-y-1">
                {foundCar && (
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">{foundCar.name} {foundCar.model}</p>
                )}
                {foundInvoice && (
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                    {language === 'ar' ? `فاتورة رقم ${foundInvoice.invoice_number} - ${foundInvoice.supplier_name}` : `Invoice #${foundInvoice.invoice_number} - ${foundInvoice.supplier_name}`}
                  </p>
                )}
                <p className="text-xs text-violet-600 dark:text-violet-400">{language === 'ar' ? `المبلغ: ${formatCurrency(totals.grandTotal)} ريال` : `Amount: ${formatCurrency(totals.grandTotal)}`}</p>
              </div>
              {isCarDealership && foundCar && (
                <p className="text-destructive text-xs font-medium">{language === 'ar' ? '⚠️ سيتم تحديث حالة السيارة إلى "مرتجعة" وحذف القيود المحاسبية' : '⚠️ Car status will be set to "returned" and journal entries deleted'}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saveMutation.mutate()}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {saveMutation.isPending ? (language === 'ar' ? 'جاري الاعتماد...' : 'Approving...') : (language === 'ar' ? 'اعتماد' : 'Approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingReturn} onOpenChange={(open) => !open && setEditingReturn(null)}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-violet-600" />
              {language === 'ar' ? `تعديل المرتجع ${editingReturn?.note_number || ''}` : `Edit Return ${editingReturn?.note_number || ''}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === 'ar' ? 'تاريخ المرتجع' : 'Return Date'}</Label>
              <Input type="date" className="h-9 text-sm" value={editForm.note_date} onChange={e => setEditForm(p => ({ ...p, note_date: e.target.value }))} dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</Label>
                <Input type="number" className="h-9 text-sm font-mono" value={editForm.total_amount || ''} onChange={e => {
                  const total = Number(e.target.value) || 0;
                  const netAmount = total / 1.15;
                  setEditForm(p => ({ ...p, total_amount: total, tax_amount: Math.round((total - netAmount) * 100) / 100 }));
                }} min={0} step="0.01" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{language === 'ar' ? 'مبلغ الضريبة' : 'Tax Amount'}</Label>
                <Input type="number" className="h-9 text-sm font-mono" value={editForm.tax_amount || ''} onChange={e => setEditForm(p => ({ ...p, tax_amount: Number(e.target.value) || 0 }))} min={0} step="0.01" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{language === 'ar' ? 'السبب / الملاحظات' : 'Reason / Notes'}</Label>
              <Input className="h-9 text-sm" value={editForm.reason} onChange={e => setEditForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingReturn(null)}>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
