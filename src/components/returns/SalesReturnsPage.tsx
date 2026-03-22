import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Trash2, RotateCcw, Printer, Save, FileText, Loader2, ArrowRight, AlertTriangle, CheckCircle, ChevronDown, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useCompany, CompanyActivityType } from '@/contexts/CompanyContext';

interface ReturnItem {
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

interface SaleData {
  id: string;
  sale_number: number;
  sale_price: number;
  sale_date: string;
  car_id: string;
  customer_id: string | null;
  customer?: { name: string; phone?: string } | null;
  car?: { id: string; name: string; model: string | null; color: string | null; chassis_number: string; purchase_price: number } | null;
  sale_items?: Array<{
    id: string;
    car_id: string;
    sale_price: number;
    car?: { id: string; name: string; model: string | null; color: string | null; chassis_number: string; purchase_price: number } | null;
  }> | null;
}

export function SalesReturnsPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const { company } = useCompany();
  const companyType: CompanyActivityType = company?.company_type || 'general_trading';
  const isCarDealership = companyType === 'car_dealership';
  const queryClient = useQueryClient();
  const [searchList, setSearchList] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<SaleData | null>(null);
  const [foundInvoice, setFoundInvoice] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    invoiceType: 'normal',
    paymentMethod: 'cash',
    fullInvoice: true,
    returnDate: new Date().toISOString().split('T')[0],
    notes: '',
    costCenter: '',
    salesman: '',
    reference: '',
  });
  const [items, setItems] = useState<ReturnItem[]>([]);

  const formatCurrency = (v: number) => new Intl.NumberFormat('ar-SA').format(v);

  // Fetch available sales invoices for selection dropdown
  const { data: availableInvoices = [] } = useQuery({
    queryKey: ['available-invoices-for-return', companyId, isCarDealership],
    queryFn: async () => {
      if (isCarDealership) {
        const { data, error } = await supabase
          .from('sales')
          .select('id, sale_number, sale_date, sale_price, customer:customers(name)')
          .eq('company_id', companyId!)
          .order('sale_number', { ascending: false })
          .limit(200);
        if (error) throw error;
        return (data || []).map((s: any) => ({
          id: s.id,
          number: s.sale_number,
          date: s.sale_date,
          total: s.sale_price,
          customerName: s.customer?.name || '',
          source: 'sales' as const,
        }));
      } else {
        const { data, error } = await supabase
          .from('invoices')
          .select('id, invoice_number, invoice_date, total, customer_name')
          .eq('company_id', companyId!)
          .eq('invoice_type', 'sales')
          .order('invoice_number', { ascending: false })
          .limit(200);
        if (error) throw error;
        return (data || []).map((inv: any) => ({
          id: inv.id,
          number: inv.invoice_number,
          date: inv.invoice_date,
          total: inv.total,
          customerName: inv.customer_name || '',
          source: 'invoices' as const,
        }));
      }
    },
    enabled: !!companyId,
  });

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['sales-returns', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_debit_notes')
        .select('*')
        .eq('company_id', companyId!)
        .eq('note_type', 'credit')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const searchInvoice = useCallback(async () => {
    if (!invoiceSearch.trim() || !companyId) return;
    setIsSearching(true);
    try {
      if (isCarDealership) {
        const { data: sale, error } = await supabase
          .from('sales')
          .select(`
            *,
            car:cars(*),
            customer:customers(name, phone),
            sale_items:sale_items(*, car:cars(*))
          `)
          .eq('company_id', companyId)
          .eq('sale_number', parseInt(invoiceSearch))
          .single();

        if (error || !sale) {
          toast.error(language === 'ar' ? 'لم يتم العثور على الفاتورة' : 'Invoice not found');
          setFoundSale(null);
          setFoundInvoice(null);
          setItems([]);
          return;
        }

        setFoundSale(sale as any);
        setFoundInvoice(null);

        const saleItems = (sale as any).sale_items || [];
        if (saleItems.length > 0) {
          setItems(saleItems.map((item: any, idx: number) => {
            const price = Number(item.sale_price);
            const vat = price * 0.15;
            return {
              id: String(idx + 1),
              car_id: item.car_id,
              description: `${item.car?.name || ''} ${item.car?.model || ''} - ${item.car?.color || ''} - شاسيه: ${item.car?.chassis_number || ''}`,
              quantity: 1,
              returnedQty: 1,
              unit: 'سيارة',
              price,
              total: price,
              discountPercent: 0,
              discount: 0,
              net: price,
              vat,
              grandTotal: price + vat,
            };
          }));
        } else {
          const car = (sale as any).car;
          const price = Number(sale.sale_price);
          const vat = price * 0.15;
          setItems([{
            id: '1',
            car_id: sale.car_id,
            description: `${car?.name || ''} ${car?.model || ''} - ${car?.color || ''} - شاسيه: ${car?.chassis_number || ''}`,
            quantity: 1,
            returnedQty: 1,
            unit: 'سيارة',
            price,
            total: price,
            discountPercent: 0,
            discount: 0,
            net: price,
            vat,
            grandTotal: price + vat,
          }]);
        }
      } else {
        const searchNum = invoiceSearch.trim();
        const { data: invoice, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('company_id', companyId)
          .eq('invoice_type', 'sales')
          .eq('invoice_number', searchNum)
          .single();

        if (error || !invoice) {
          toast.error(language === 'ar' ? 'لم يتم العثور على الفاتورة' : 'Invoice not found');
          setFoundSale(null);
          setFoundInvoice(null);
          setItems([]);
          return;
        }

        setFoundInvoice(invoice);
        setFoundSale(null);

        const invoiceItems = Array.isArray((invoice as any).items) ? (invoice as any).items : [];
        if (invoiceItems.length > 0) {
          setItems(invoiceItems.map((item: any, idx: number) => {
            const qty = Number(item.quantity) || 1;
            const price = Number(item.unitPrice || item.unit_price || item.price) || 0;
            const total = qty * price;
            const taxRate = Number(item.taxRate || item.tax_rate) || 0.15;
            const vat = total * taxRate;
            return {
              id: String(idx + 1),
              car_id: '',
              description: item.description || item.name || item.item_name || `صنف ${idx + 1}`,
              quantity: qty,
              returnedQty: qty,
              unit: item.unit || 'وحدة',
              price,
              total,
              discountPercent: 0,
              discount: 0,
              net: total,
              vat,
              grandTotal: total + vat,
            };
          }));
        } else {
          const price = Number(invoice.subtotal) || Number(invoice.total) || 0;
          const vat = Number(invoice.vat_amount) || price * 0.15;
          setItems([{
            id: '1',
            car_id: '',
            description: `فاتورة رقم ${invoice.invoice_number}`,
            quantity: 1,
            returnedQty: 1,
            unit: 'وحدة',
            price,
            total: price,
            discountPercent: 0,
            discount: 0,
            net: price,
            vat,
            grandTotal: price + vat,
          }]);
        }
      }
      toast.success(language === 'ar' ? 'تم العثور على الفاتورة' : 'Invoice found');
    } catch (e) {
      toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error');
    } finally {
      setIsSearching(false);
    }
  }, [invoiceSearch, companyId, language, isCarDealership]);

  const handleSelectInvoice = useCallback((invoiceId: string) => {
    const selected = availableInvoices.find(i => i.id === invoiceId);
    if (selected) {
      setInvoiceSearch(String(selected.number));
      setTimeout(() => {
        setInvoiceSearch(String(selected.number));
      }, 0);
    }
  }, [availableInvoices]);

  const updateItem = (index: number, field: keyof ReturnItem, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      const item = updated[index];
      item.total = item.returnedQty * item.price;
      item.discount = item.total * (item.discountPercent / 100);
      item.net = item.total - item.discount;
      item.vat = item.net * 0.15;
      item.grandTotal = item.net + item.vat;
      return updated;
    });
  };

  const totals = items.reduce((acc, item) => ({
    quantity: acc.quantity + item.returnedQty,
    total: acc.total + item.total,
    discount: acc.discount + item.discount,
    net: acc.net + item.net,
    vat: acc.vat + item.vat,
    grandTotal: acc.grandTotal + item.grandTotal,
  }), { quantity: 0, total: 0, discount: 0, net: 0, vat: 0, grandTotal: 0 });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!foundSale && !foundInvoice) throw new Error('No sale/invoice found');

      if (isCarDealership && foundSale) {
        const returnedItems = items.filter(i => i.returnedQty > 0);
        for (const item of returnedItems) {
          if (item.car_id) {
            const { error: carErr } = await supabase
              .from('cars')
              .update({ status: 'available' })
              .eq('id', item.car_id);
            if (carErr) throw carErr;
          }
        }

        await supabase
          .from('journal_entries')
          .delete()
          .eq('reference_type', 'sale')
          .eq('reference_id', foundSale.id);

        if (form.fullInvoice) {
          await supabase.from('sale_items').delete().eq('sale_id', foundSale.id);
          await supabase.from('sales').delete().eq('id', foundSale.id);
        }
      } else if (foundInvoice) {
        await supabase
          .from('journal_entries')
          .delete()
          .eq('reference_type', 'invoice')
          .eq('reference_id', foundInvoice.id);

        if (form.fullInvoice) {
          await supabase.from('invoices').delete().eq('id', foundInvoice.id);
        }
      }

      const refNumber = foundSale ? foundSale.sale_number : foundInvoice?.invoice_number;
      const num = `SR-${String(returns.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('credit_debit_notes').insert({
        company_id: companyId!,
        note_number: num,
        note_type: 'credit',
        note_date: form.returnDate,
        total_amount: totals.grandTotal,
        reason: `مرتجع فاتورة رقم ${refNumber}${form.notes ? ' - ' + form.notes : ''}`,
        status: 'approved',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['available-invoices-for-return'] });
      queryClient.invalidateQueries({ queryKey: ['company-invoices'] });
      toast.success(language === 'ar' ? 'تم اعتماد مرتجع المبيعات' : 'Sales return approved');
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
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success(language === 'ar' ? 'تم الحذف' : 'Deleted');
    },
  });

  const resetForm = () => {
    setFoundSale(null);
    setFoundInvoice(null);
    setItems([]);
    setInvoiceSearch('');
    setForm({
      invoiceType: 'normal',
      paymentMethod: 'cash',
      fullInvoice: true,
      returnDate: new Date().toISOString().split('T')[0],
      notes: '',
      costCenter: '',
      salesman: '',
      reference: '',
    });
  };

  const filtered = returns.filter((r: any) => r.note_number?.includes(searchList) || r.reason?.includes(searchList));
  const hasValidReturn = (foundSale || foundInvoice) && items.filter(i => i.returnedQty > 0).length > 0;

  return (
    <>
      <div className="max-w-full mx-auto animate-fade-in p-2 sm:p-4" dir="rtl">
        <div className="bg-card rounded-xl border shadow-lg overflow-hidden">

          {/* ===== Header - Rose/Red theme for Sales Returns ===== */}
          <div className="bg-gradient-to-l from-rose-600 via-red-500 to-orange-500 text-white px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 opacity-80" />
                  <h1 className="text-lg font-bold tracking-wide">
                    {language === 'ar' ? 'مرتجع مبيعات / إشعار دائن' : 'Sales Returns / Credit Note'}
                  </h1>
                </div>
                {(foundSale || foundInvoice) && (
                  <span className="text-[11px] px-3 py-1 rounded-full font-bold shadow-sm bg-white text-rose-700">
                    {language === 'ar' ? `فاتورة #${foundSale?.sale_number || foundInvoice?.invoice_number}` : `Invoice #${foundSale?.sale_number || foundInvoice?.invoice_number}`}
                  </span>
                )}
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-white/15 backdrop-blur-sm h-8">
                  <TabsTrigger value="form" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-rose-700 h-7 px-3">
                    {language === 'ar' ? 'بيانات أساسية' : 'Basic Data'}
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-[11px] text-white data-[state=active]:bg-white data-[state=active]:text-rose-700 h-7 px-3">
                    {language === 'ar' ? 'السجلات' : 'Records'} ({returns.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Found invoice banner */}
          {(foundSale || foundInvoice) && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border-b-2 border-rose-200 dark:border-rose-800 px-5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-800 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-200 block">
                    {language === 'ar' ? `فاتورة بيع رقم ${foundSale?.sale_number || foundInvoice?.invoice_number} - العميل: ${foundSale?.customer?.name || foundInvoice?.customer_name || '-'}` : `Sale Invoice #${foundSale?.sale_number || foundInvoice?.invoice_number}`}
                  </span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400">
                    {language === 'ar' ? `المبلغ: ${formatCurrency(foundSale?.sale_price || foundInvoice?.total || 0)} ريال` : `Amount: ${formatCurrency(foundSale?.sale_price || foundInvoice?.total || 0)}`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600 hover:bg-rose-100" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {activeTab === 'form' && (
            <>
              {/* ===== Invoice Search & Header Form ===== */}
              <div className="p-4 border-b space-y-4 bg-card">
                {/* Section: Search */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
                  <span className="text-xs font-bold text-foreground tracking-wide">{language === 'ar' ? 'بحث عن فاتورة البيع' : 'Search Sale Invoice'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'اختر من الفواتير' : 'Select Invoice'}</Label>
                    <Select
                      value=""
                      onValueChange={(val) => {
                        const selected = availableInvoices.find(i => i.id === val);
                        if (selected) {
                          setInvoiceSearch(String(selected.number));
                          setTimeout(() => {
                            const el = document.getElementById('search-invoice-btn');
                            el?.click();
                          }, 100);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-rose-500 shadow-none transition-colors">
                        <SelectValue placeholder={language === 'ar' ? 'اختر فاتورة...' : 'Select invoice...'} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {availableInvoices.map(inv => (
                          <SelectItem key={inv.id} value={inv.id}>
                            #{inv.number} - {inv.customerName || (language === 'ar' ? 'بدون عميل' : 'No customer')} - {Number(inv.total).toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'أو أدخل رقم الفاتورة' : 'Or Enter Invoice #'}</Label>
                    <div className="flex gap-2">
                      <Input
                        className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-rose-500 shadow-none font-mono flex-1"
                        placeholder={language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}
                        value={invoiceSearch}
                        onChange={e => setInvoiceSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchInvoice()}
                      />
                      <Button id="search-invoice-btn" size="sm" className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg gap-1.5" onClick={searchInvoice} disabled={isSearching}>
                        {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {language === 'ar' ? 'بحث' : 'Search'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Section: Return Info */}
                <div className="flex items-center gap-2 mt-4 mb-1">
                  <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
                  <span className="text-xs font-bold text-foreground tracking-wide">{language === 'ar' ? 'بيانات المرتجع' : 'Return Details'}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'رقم الإشعار' : 'Note #'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none font-mono" value={`SR-${String(returns.length + 1).padStart(4, '0')}`} readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date'}</Label>
                    <Input type="date" className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</Label>
                    <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
                      <SelectTrigger className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none transition-colors">
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
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'العميل' : 'Customer'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-muted/30 shadow-none" value={foundSale?.customer?.name || foundInvoice?.customer_name || ''} readOnly />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المندوب' : 'Salesman'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none" value={form.salesman} onChange={e => setForm(p => ({ ...p, salesman: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ar' ? 'المرجع' : 'Reference'}</Label>
                    <Input className="h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-orange-500 shadow-none" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
                  </div>
                </div>

                {/* Options Row */}
                <div className="flex items-center gap-6 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <Checkbox id="fullInvoice" checked={form.fullInvoice} onCheckedChange={(v) => setForm(p => ({ ...p, fullInvoice: !!v }))} className="h-4 w-4" />
                    <Label htmlFor="fullInvoice" className="text-xs cursor-pointer text-muted-foreground font-semibold">
                      {language === 'ar' ? 'كامل الفاتورة' : 'Full Invoice'}
                    </Label>
                  </div>
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
                    <TableRow className="bg-gradient-to-l from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border-b-2 border-rose-200 dark:border-rose-800">
                      <TableHead className="text-right text-[11px] font-bold w-8 text-rose-700 dark:text-rose-400">#</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[120px] text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الصنف' : 'Item'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold min-w-[160px] text-rose-700 dark:text-rose-400">{language === 'ar' ? 'البيان' : 'Description'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'صادرة' : 'Issued'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'مرتجعة' : 'Returned'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-16 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-14 text-rose-700 dark:text-rose-400">% {language === 'ar' ? 'خصم' : 'Disc'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الخصم' : 'Discount'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الصافي' : 'Net'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-20 text-rose-700 dark:text-rose-400">VAT</TableHead>
                      <TableHead className="text-center text-[11px] font-bold w-24 text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الإجمالي' : 'Grand'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20 border-b transition-colors">
                        <TableCell className="text-center text-xs py-2 font-mono text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="text-xs py-2 font-medium">{item.description.split(' - ')[0]}</TableCell>
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
                        <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.price)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.total)}</TableCell>
                        <TableCell className="py-1">
                          <Input type="number" className="h-7 text-xs w-14 text-center border-0 border-b border-border rounded-none bg-transparent" value={item.discountPercent || ''}
                            onChange={e => updateItem(idx, 'discountPercent', Number(e.target.value))}
                            min={0} max={100}
                          />
                        </TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono">{formatCurrency(item.discount)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono font-semibold">{formatCurrency(item.net)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono text-warning">{formatCurrency(item.vat)}</TableCell>
                        <TableCell className="text-center text-xs py-2 font-mono font-bold">{formatCurrency(item.grandTotal)}</TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-8 h-8 text-muted-foreground/30" />
                            <span className="text-sm">{language === 'ar' ? 'أدخل رقم فاتورة البيع للبحث عنها' : 'Enter sale invoice number to search'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ===== Totals Section ===== */}
              <div className="p-4 border-t bg-card">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-xl p-3 text-center text-white shadow-lg md:col-span-2">
                    <div className="text-2xl font-black">{formatCurrency(totals.grandTotal)}</div>
                    <div className="text-[10px] font-medium mt-0.5 opacity-90">{language === 'ar' ? 'إجمالي المرتجع' : 'Total Return'}</div>
                  </div>
                  <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-foreground">{formatCurrency(totals.total)}</div>
                    <div className="text-[9px] text-muted-foreground font-semibold">{language === 'ar' ? 'المجموع' : 'Total'}</div>
                  </div>
                  <div className="bg-muted/60 border-2 border-border rounded-xl p-3 text-center">
                    <div className="text-lg font-black text-foreground">{formatCurrency(totals.discount)}</div>
                    <div className="text-[9px] text-muted-foreground font-semibold">{language === 'ar' ? 'الخصم' : 'Discount'}</div>
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
              <div className="border-t-2 border-rose-100 dark:border-rose-900 bg-gradient-to-b from-card to-muted/30">
                <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs h-9 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-md"
                    onClick={() => {
                      if (!hasValidReturn) {
                        toast.error(language === 'ar' ? 'يرجى البحث عن فاتورة وتحديد بنود للإرجاع' : 'Please search for an invoice and select items to return');
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
                    <Plus className="w-3.5 h-3.5 text-rose-600" /> {language === 'ar' ? 'سند جديد' : 'New'}
                  </Button>

                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg shadow-sm" disabled>
                    <Printer className="w-3.5 h-3.5 text-muted-foreground" /> {language === 'ar' ? 'طباعة' : 'Print'}
                  </Button>

                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 shadow-sm" disabled={!foundSale && !foundInvoice}>
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
                  <Input className="pr-9 h-9 text-xs border-0 border-b-2 border-border rounded-none bg-transparent focus:border-rose-500 shadow-none" placeholder={language === 'ar' ? 'بحث في السجلات...' : 'Search records...'} value={searchList} onChange={e => setSearchList(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-l from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30 border-b-2 border-rose-200 dark:border-rose-800">
                      <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'رقم السند' : 'Note #'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead className="text-right text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
                      <TableHead className="text-center text-[11px] font-bold text-rose-700 dark:text-rose-400">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r: any) => (
                      <TableRow key={r.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors">
                        <TableCell className="font-mono font-bold text-xs">{r.note_number}</TableCell>
                        <TableCell className="text-xs">{r.note_date}</TableCell>
                        <TableCell className="font-bold text-xs">{Number(r.total_amount).toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.reason || '-'}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={r.status === 'approved' ? 'default' : 'secondary'} className="text-[10px]">
                            {r.status === 'approved' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}
                          </Badge>
                        </TableCell>
                        <TableCell>
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
                            <RotateCcw className="w-8 h-8 text-muted-foreground/30" />
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
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              {language === 'ar' ? 'تأكيد اعتماد المرتجع' : 'Confirm Return Approval'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>{language === 'ar' ? 'هل أنت متأكد من اعتماد هذا المرتجع؟' : 'Are you sure you want to approve this return?'}</p>
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 space-y-1">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{language === 'ar' ? `المبلغ: ${formatCurrency(totals.grandTotal)} ريال` : `Amount: ${formatCurrency(totals.grandTotal)}`}</p>
                <p className="text-xs text-rose-600 dark:text-rose-400">{language === 'ar' ? `عدد البنود: ${items.filter(i => i.returnedQty > 0).length}` : `Items: ${items.filter(i => i.returnedQty > 0).length}`}</p>
              </div>
              {form.fullInvoice && (
                <p className="text-destructive text-xs font-medium">{language === 'ar' ? '⚠️ سيتم حذف الفاتورة الأصلية والقيود المحاسبية المرتبطة بها' : '⚠️ Original invoice and journal entries will be deleted'}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>{language === 'ar' ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saveMutation.mutate()}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {saveMutation.isPending ? (language === 'ar' ? 'جاري الاعتماد...' : 'Approving...') : (language === 'ar' ? 'اعتماد' : 'Approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
