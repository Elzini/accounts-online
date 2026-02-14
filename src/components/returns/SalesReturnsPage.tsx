import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Trash2, RotateCcw, Printer, Save, FileText, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const queryClient = useQueryClient();
  const [searchList, setSearchList] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<SaleData | null>(null);
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
        setItems([]);
        return;
      }

      setFoundSale(sale as any);

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
      toast.success(language === 'ar' ? 'تم العثور على الفاتورة' : 'Invoice found');
    } catch (e) {
      toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error');
    } finally {
      setIsSearching(false);
    }
  }, [invoiceSearch, companyId, language]);

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
      if (!foundSale) throw new Error('No sale found');

      const returnedItems = items.filter(i => i.returnedQty > 0);
      for (const item of returnedItems) {
        const { error: carErr } = await supabase
          .from('cars')
          .update({ status: 'available' })
          .eq('id', item.car_id);
        if (carErr) throw carErr;
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

      const num = `SR-${String(returns.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('credit_debit_notes').insert({
        company_id: companyId!,
        note_number: num,
        note_type: 'credit',
        note_date: form.returnDate,
        total_amount: totals.grandTotal,
        reason: `مرتجع فاتورة رقم ${foundSale.sale_number}${form.notes ? ' - ' + form.notes : ''}`,
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
      toast.success(language === 'ar' ? 'تم اعتماد مرتجع المبيعات وإعادة السيارات للمخزون' : 'Sales return approved, cars returned to inventory');
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

  return (
    <div className="space-y-4 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {language === 'ar' ? 'مرتجع مبيعات / إشعار دائن' : 'Sales Returns / Credit Note'}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="form">{language === 'ar' ? 'بيانات أساسية' : 'Basic Data'}</TabsTrigger>
          <TabsTrigger value="list">{language === 'ar' ? 'السجلات' : 'Records'}</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-3 mt-3">
          {/* Header Fields - matching desktop layout */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0 min-w-[80px]">{language === 'ar' ? 'الرقم' : 'Number'}</Label>
                  <Input className="h-8 text-sm bg-muted/50" value={`SR-${String(returns.length + 1).padStart(4, '0')}`} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'نوع الفاتورة' : 'Invoice Type'}</Label>
                  <Select value={form.invoiceType} onValueChange={v => setForm(p => ({ ...p, invoiceType: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{language === 'ar' ? 'عادية' : 'Normal'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'رقم القيد' : 'Entry #'}</Label>
                  <Input className="h-8 text-sm bg-muted/50" readOnly />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0 min-w-[80px]">{language === 'ar' ? 'رقم فاتورة البيع' : 'Sale Invoice #'}</Label>
                  <div className="flex gap-1 flex-1">
                    <Input
                      className="h-8 text-sm font-mono flex-1"
                      placeholder={language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}
                      value={invoiceSearch}
                      onChange={e => setInvoiceSearch(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchInvoice()}
                      type="number"
                    />
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={searchInvoice} disabled={isSearching}>
                      {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="fullInvoice" checked={form.fullInvoice} onCheckedChange={(v) => setForm(p => ({ ...p, fullInvoice: !!v }))} />
                  <Label htmlFor="fullInvoice" className="text-xs">{language === 'ar' ? 'كامل الفاتورة' : 'Full Invoice'}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</Label>
                  <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{language === 'ar' ? 'نقدية' : 'Cash'}</SelectItem>
                      <SelectItem value="credit">{language === 'ar' ? 'آجل' : 'Credit'}</SelectItem>
                      <SelectItem value="bank">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date'}</Label>
                  <Input type="date" className="h-8 text-sm" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0 min-w-[80px]">{language === 'ar' ? 'رقم العميل' : 'Customer #'}</Label>
                  <Input className="h-8 text-sm bg-muted/50" value={foundSale?.customer?.name || ''} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'م. التكلفة' : 'Cost Center'}</Label>
                  <Input className="h-8 text-sm" value={form.costCenter} onChange={e => setForm(p => ({ ...p, costCenter: e.target.value }))} />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0 min-w-[80px]">{language === 'ar' ? 'حساب النقدية' : 'Cash Account'}</Label>
                  <Input className="h-8 text-sm bg-muted/50" value="12051 الصندوق - نقدية" readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'المرجع' : 'Reference'}</Label>
                  <Input className="h-8 text-sm" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'المندوب' : 'Salesman'}</Label>
                  <Input className="h-8 text-sm" value={form.salesman} onChange={e => setForm(p => ({ ...p, salesman: e.target.value }))} />
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 col-span-2">
                  <Label className="text-xs shrink-0 min-w-[80px]">{language === 'ar' ? 'المستودع' : 'Warehouse'}</Label>
                  <Input className="h-8 text-sm bg-muted/50" value={language === 'ar' ? '1 - الرئيسي' : '1 - Main'} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'الضريبة' : 'Tax'}</Label>
                  <Input className="h-8 text-sm bg-muted/50" value={language === 'ar' ? 'مرتجع مبيعات' : 'Sales Return'} readOnly />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                  <Input className="h-8 text-sm" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-8 text-xs text-center">م</TableHead>
                      <TableHead className="text-xs">{language === 'ar' ? 'الصنف' : 'Item'}</TableHead>
                      <TableHead className="text-xs">{language === 'ar' ? 'البيان' : 'Description'}</TableHead>
                      <TableHead className="text-xs w-16 text-center">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                      <TableHead className="text-xs w-20 text-center">{language === 'ar' ? 'كمية صادرة' : 'Issued'}</TableHead>
                      <TableHead className="text-xs w-20 text-center">{language === 'ar' ? 'كمية مرتجعة' : 'Returned'}</TableHead>
                      <TableHead className="text-xs w-16 text-center">{language === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                      <TableHead className="text-xs w-24 text-center">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                      <TableHead className="text-xs w-24 text-center">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                      <TableHead className="text-xs w-14 text-center">% {language === 'ar' ? 'الخصم' : 'Disc'}</TableHead>
                      <TableHead className="text-xs w-20 text-center">{language === 'ar' ? 'الخصم' : 'Discount'}</TableHead>
                      <TableHead className="text-xs w-24 text-center">{language === 'ar' ? 'الصافي' : 'Net'}</TableHead>
                      <TableHead className="text-xs w-20 text-center">VAT</TableHead>
                      <TableHead className="text-xs w-24 text-center">{language === 'ar' ? 'المجموع' : 'Grand'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs text-center">{idx + 1}</TableCell>
                        <TableCell className="text-xs font-medium">{item.description.split(' - ')[0]}</TableCell>
                        <TableCell className="text-xs">{item.description}</TableCell>
                        <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                        <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                        <TableCell className="p-1">
                          <Input type="number" className="h-7 text-xs w-16 text-center" value={item.returnedQty || ''}
                            onChange={e => updateItem(idx, 'returnedQty', Math.min(Number(e.target.value), item.quantity))}
                            max={item.quantity} min={0}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-center">{item.unit}</TableCell>
                        <TableCell className="text-xs font-mono text-center">{item.price.toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono text-center">{item.total.toLocaleString()}</TableCell>
                        <TableCell className="p-1">
                          <Input type="number" className="h-7 text-xs w-14 text-center" value={item.discountPercent || ''}
                            onChange={e => updateItem(idx, 'discountPercent', Number(e.target.value))}
                            min={0} max={100}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-mono text-center">{item.discount.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono text-center">{item.net.toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono text-center text-orange-600">{item.vat.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono font-bold text-center">{item.grandTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                          {language === 'ar' ? 'أدخل رقم فاتورة البيع للبحث عنها' : 'Enter sale invoice number to search'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Totals Bar */}
          <Card>
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-4 justify-between items-center text-sm">
                <span>{language === 'ar' ? 'المجموع' : 'Total'}: <strong>{totals.total.toLocaleString()}</strong></span>
                <span>{language === 'ar' ? 'الكمية' : 'Qty'}: <strong>{totals.quantity}</strong></span>
                <span>{language === 'ar' ? 'الخصم' : 'Discount'}: <strong>{totals.discount.toFixed(2)}</strong></span>
                <span>% {language === 'ar' ? 'الإجمالي' : 'Subtotal'}: <strong>{totals.net.toLocaleString()}</strong></span>
                <span>{language === 'ar' ? 'الضريبة' : 'VAT'}: <strong className="text-orange-600">{totals.vat.toFixed(2)}</strong></span>
                <span className="text-primary font-bold text-base">{language === 'ar' ? 'الصافي' : 'Net'}: {totals.grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Actions */}
          <div className="flex gap-2 flex-wrap justify-between">
            <div className="flex gap-2">
              <Button
                className="gap-2"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || items.filter(i => i.returnedQty > 0).length === 0}
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {language === 'ar' ? 'اعتماد' : 'Approve'}
              </Button>
              <Button variant="outline" className="gap-2" onClick={resetForm}>
                <Plus className="w-4 h-4" />
                {language === 'ar' ? 'سند جديد' : 'New'}
              </Button>
              <Button variant="outline" className="gap-2" disabled>
                <Printer className="w-4 h-4" />
                {language === 'ar' ? 'طباعة' : 'Print'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pr-9" placeholder={language === 'ar' ? 'بحث...' : 'Search...'} value={searchList} onChange={e => setSearchList(e.target.value)} />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'ar' ? 'رقم السند' : 'Note #'}</TableHead>
                    <TableHead>{language === 'ar' ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableHead>
                    <TableHead>{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
                    <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-bold">{r.note_number}</TableCell>
                      <TableCell>{r.note_date}</TableCell>
                      <TableCell className="font-bold">{Number(r.total_amount).toLocaleString()} ر.س</TableCell>
                      <TableCell className="text-sm">{r.reason || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'approved' ? 'default' : 'secondary'}>
                          {r.status === 'approved' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {language === 'ar' ? 'لا توجد مرتجعات' : 'No returns found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
