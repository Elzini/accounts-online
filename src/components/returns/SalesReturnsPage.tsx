import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Trash2, RotateCcw, Printer, Save, FileText, Loader2 } from 'lucide-react';
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
  const [showAdd, setShowAdd] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<SaleData | null>(null);
  const [form, setForm] = useState({
    invoiceType: 'normal',
    paymentMethod: 'cash',
    fullInvoice: true,
    returnDate: new Date().toISOString().split('T')[0],
    notes: '',
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

      // Build items from sale
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

      // 1. Return cars to available status
      const returnedItems = items.filter(i => i.returnedQty > 0);
      for (const item of returnedItems) {
        const { error: carErr } = await supabase
          .from('cars')
          .update({ status: 'available' })
          .eq('id', item.car_id);
        if (carErr) throw carErr;
      }

      // 2. Delete journal entry for this sale
      await supabase
        .from('journal_entries')
        .delete()
        .eq('reference_type', 'sale')
        .eq('reference_id', foundSale.id);

      // 3. If full return, delete the sale and sale_items
      if (form.fullInvoice) {
        await supabase.from('sale_items').delete().eq('sale_id', foundSale.id);
        await supabase.from('sales').delete().eq('id', foundSale.id);
      }

      // 4. Save credit note record
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
      setShowAdd(false);
      setFoundSale(null);
      setItems([]);
      setInvoiceSearch('');
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

  const filtered = returns.filter((r: any) => r.note_number?.includes(searchList) || r.reason?.includes(searchList));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'مرتجع مبيعات / إشعار دائن' : 'Sales Returns / Credit Note'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة مرتجعات المبيعات وإشعارات الدائن' : 'Manage sales returns and credit notes'}
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) { setFoundSale(null); setItems([]); setInvoiceSearch(''); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'مرتجع جديد' : 'New Return'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'مرتجع مبيعات / إشعار دائن' : 'Sales Return / Credit Note'}</DialogTitle>
            </DialogHeader>

            {/* Invoice Search */}
            <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-3">
              <Label className="font-bold text-base">{language === 'ar' ? 'بحث عن فاتورة البيع' : 'Search Sales Invoice'}</Label>
              <div className="flex gap-2">
                <Input
                  className="h-10 text-base font-mono"
                  placeholder={language === 'ar' ? 'أدخل رقم فاتورة البيع...' : 'Enter sale invoice number...'}
                  value={invoiceSearch}
                  onChange={e => setInvoiceSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchInvoice()}
                  type="number"
                />
                <Button onClick={searchInvoice} disabled={isSearching} className="gap-2 min-w-[120px]">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {language === 'ar' ? 'بحث' : 'Search'}
                </Button>
              </div>

              {foundSale && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-card rounded-lg border">
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</span>
                    <p className="font-bold text-primary">{foundSale.sale_number}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'العميل' : 'Customer'}</span>
                    <p className="font-medium">{foundSale.customer?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'المبلغ' : 'Amount'}</span>
                    <p className="font-bold">{Number(foundSale.sale_price).toLocaleString()} ر.س</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'تاريخ البيع' : 'Sale Date'}</span>
                    <p className="font-medium">{foundSale.sale_date}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Form Options */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0">{language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date'}</Label>
                <Input type="date" className="h-8 text-sm" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} />
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
                <Checkbox id="fullInvoice" checked={form.fullInvoice} onCheckedChange={(v) => setForm(p => ({ ...p, fullInvoice: !!v }))} />
                <Label htmlFor="fullInvoice" className="text-xs">{language === 'ar' ? 'إرجاع كامل الفاتورة' : 'Full Invoice Return'}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0">{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                <Input className="h-8 text-sm" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <>
                <div className="border rounded-lg overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-8 text-xs">#</TableHead>
                        <TableHead className="text-xs">{language === 'ar' ? 'الصنف / السيارة' : 'Item / Car'}</TableHead>
                        <TableHead className="text-xs w-16">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                        <TableHead className="text-xs w-16">{language === 'ar' ? 'مرتجع' : 'Return'}</TableHead>
                        <TableHead className="text-xs w-24">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                        <TableHead className="text-xs w-24">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                        <TableHead className="text-xs w-20">VAT 15%</TableHead>
                        <TableHead className="text-xs w-24">{language === 'ar' ? 'الإجمالي' : 'Grand'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{idx + 1}</TableCell>
                          <TableCell className="text-xs font-medium">{item.description}</TableCell>
                          <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                          <TableCell>
                            <Input type="number" className="h-7 text-xs w-16" value={item.returnedQty || ''} 
                              onChange={e => updateItem(idx, 'returnedQty', Math.min(Number(e.target.value), item.quantity))} 
                              max={item.quantity} min={0}
                            />
                          </TableCell>
                          <TableCell className="text-xs font-mono">{item.price.toLocaleString()}</TableCell>
                          <TableCell className="text-xs font-mono">{item.total.toLocaleString()}</TableCell>
                          <TableCell className="text-xs font-mono text-orange-600">{item.vat.toFixed(2)}</TableCell>
                          <TableCell className="text-xs font-mono font-bold">{item.grandTotal.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border text-sm">
                  <div className="flex gap-6">
                    <span>{language === 'ar' ? 'المجموع' : 'Total'}: <strong>{totals.total.toLocaleString()}</strong></span>
                    <span>{language === 'ar' ? 'الكمية' : 'Qty'}: <strong>{totals.quantity}</strong></span>
                  </div>
                  <div className="flex gap-6">
                    <span>{language === 'ar' ? 'الضريبة' : 'VAT'}: <strong className="text-orange-600">{totals.vat.toFixed(2)}</strong></span>
                    <span className="text-primary font-bold text-lg">{language === 'ar' ? 'الإجمالي' : 'Total'}: {totals.grandTotal.toFixed(2)} ر.س</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button 
                    size="sm" 
                    className="gap-2 bg-orange-600 hover:bg-orange-700" 
                    onClick={() => saveMutation.mutate()} 
                    disabled={saveMutation.isPending || items.filter(i => i.returnedQty > 0).length === 0}
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    {language === 'ar' ? 'اعتماد المرتجع وإرجاع للمخزون' : 'Approve & Return to Inventory'}
                  </Button>
                </div>
              </>
            )}

            {!foundSale && items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{language === 'ar' ? 'أدخل رقم فاتورة البيع للبحث عنها' : 'Enter sale invoice number to search'}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Returns List */}
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
    </div>
  );
}
