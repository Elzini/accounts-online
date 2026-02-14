import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Trash2, RotateCcw, Printer, Save, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReturnItem {
  id: string;
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

export function SalesReturnsPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    invoiceNumber: '',
    invoiceType: 'normal',
    paymentMethod: 'cash',
    fullInvoice: false,
    returnDate: new Date().toISOString().split('T')[0],
    customerNumber: '',
    cashAccount: '',
    warehouse: '1',
    taxType: 'sales_return',
    costCenter: '',
    salesRep: '',
    reference: '',
    notes: '',
  });
  const [items, setItems] = useState<ReturnItem[]>([{
    id: '1', description: '', quantity: 0, returnedQty: 0, unit: '', price: 0,
    total: 0, discountPercent: 0, discount: 0, net: 0, vat: 0, grandTotal: 0,
  }]);

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

  const addItem = () => {
    setItems(prev => [...prev, {
      id: String(prev.length + 1), description: '', quantity: 0, returnedQty: 0,
      unit: '', price: 0, total: 0, discountPercent: 0, discount: 0, net: 0, vat: 0, grandTotal: 0,
    }]);
  };

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

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const totals = items.reduce((acc, item) => ({
    quantity: acc.quantity + item.returnedQty,
    total: acc.total + item.total,
    discountPercent: 0,
    discount: acc.discount + item.discount,
    net: acc.net + item.net,
    vat: acc.vat + item.vat,
    grandTotal: acc.grandTotal + item.grandTotal,
  }), { quantity: 0, total: 0, discountPercent: 0, discount: 0, net: 0, vat: 0, grandTotal: 0 });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const num = `SR-${String(returns.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('credit_debit_notes').insert({
        company_id: companyId!,
        note_number: num,
        note_type: 'credit',
        note_date: form.returnDate,
        total_amount: totals.grandTotal,
        reason: form.notes || null,
        status: 'draft',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] });
      toast.success(language === 'ar' ? 'تم حفظ مرتجع المبيعات' : 'Sales return saved');
      setShowAdd(false);
    },
    onError: () => toast.error(t.mod_error),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_debit_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] });
      toast.success(t.mod_deleted);
    },
  });

  const filtered = returns.filter((r: any) => r.note_number?.includes(search) || r.reason?.includes(search));

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
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'سند جديد' : 'New Return'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'مرتجع مبيعات / إشعار دائن' : 'Sales Return / Credit Note'}</DialogTitle>
            </DialogHeader>
            
            {/* Header Form - matching ERP layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
              {/* Right column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-28 text-xs shrink-0">{language === 'ar' ? 'الرقم' : 'Number'}</Label>
                  <Input className="h-8 text-sm bg-primary/10 font-mono" readOnly placeholder={language === 'ar' ? 'تلقائي' : 'Auto'} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-28 text-xs shrink-0">{language === 'ar' ? 'رقم فاتورة البيع' : 'Sales Invoice #'}</Label>
                  <Input className="h-8 text-sm" value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-28 text-xs shrink-0">{language === 'ar' ? 'رقم العميل' : 'Customer #'}</Label>
                  <Input className="h-8 text-sm" value={form.customerNumber} onChange={e => setForm(p => ({ ...p, customerNumber: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-28 text-xs shrink-0">{language === 'ar' ? 'حساب النقدية' : 'Cash Account'}</Label>
                  <Input className="h-8 text-sm" value={form.cashAccount} onChange={e => setForm(p => ({ ...p, cashAccount: e.target.value }))} placeholder={language === 'ar' ? '12051 الصندوق - نقدية' : '12051 Cash Box'} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-28 text-xs shrink-0">{language === 'ar' ? 'المستودع' : 'Warehouse'}</Label>
                  <div className="flex gap-1 flex-1">
                    <Input className="h-8 text-sm w-12" value={form.warehouse} onChange={e => setForm(p => ({ ...p, warehouse: e.target.value }))} />
                    <Input className="h-8 text-sm flex-1" readOnly placeholder={language === 'ar' ? 'الرئيسي' : 'Main'} />
                  </div>
                </div>
              </div>

              {/* Middle column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-xs shrink-0">{language === 'ar' ? 'نوع الفاتورة' : 'Invoice Type'}</Label>
                  <Select value={form.invoiceType} onValueChange={v => setForm(p => ({ ...p, invoiceType: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{language === 'ar' ? 'عادية' : 'Normal'}</SelectItem>
                      <SelectItem value="simplified">{language === 'ar' ? 'مبسطة' : 'Simplified'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-xs shrink-0">{language === 'ar' ? 'طريقة الدفع' : 'Payment'}</Label>
                  <Select value={form.paymentMethod} onValueChange={v => setForm(p => ({ ...p, paymentMethod: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{language === 'ar' ? 'نقدية' : 'Cash'}</SelectItem>
                      <SelectItem value="credit">{language === 'ar' ? 'آجل' : 'Credit'}</SelectItem>
                      <SelectItem value="bank">{language === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Checkbox id="fullInvoice" checked={form.fullInvoice} onCheckedChange={(v) => setForm(p => ({ ...p, fullInvoice: !!v }))} />
                    <Label htmlFor="fullInvoice" className="text-xs">{language === 'ar' ? 'كامل الفاتورة' : 'Full Invoice'}</Label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-xs shrink-0">{language === 'ar' ? 'تاريخ الإرجاع' : 'Return Date'}</Label>
                  <Input type="date" className="h-8 text-sm" value={form.returnDate} onChange={e => setForm(p => ({ ...p, returnDate: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-24 text-xs shrink-0">{language === 'ar' ? 'الضريبة' : 'Tax Type'}</Label>
                  <Select value={form.taxType} onValueChange={v => setForm(p => ({ ...p, taxType: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_return">{language === 'ar' ? 'مرتجع مبيعات' : 'Sales Return'}</SelectItem>
                      <SelectItem value="exempt">{language === 'ar' ? 'معفاة' : 'Exempt'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Left column */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="w-20 text-xs shrink-0">{language === 'ar' ? 'م. التكلفة' : 'Cost Center'}</Label>
                  <Input className="h-8 text-sm" value={form.costCenter} onChange={e => setForm(p => ({ ...p, costCenter: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-20 text-xs shrink-0">{language === 'ar' ? 'المندوب' : 'Sales Rep'}</Label>
                  <Input className="h-8 text-sm" value={form.salesRep} onChange={e => setForm(p => ({ ...p, salesRep: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-20 text-xs shrink-0">{language === 'ar' ? 'المرجع' : 'Reference'}</Label>
                  <Input className="h-8 text-sm" value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-20 text-xs shrink-0">{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                  <Input className="h-8 text-sm" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8 text-xs">{language === 'ar' ? 'م' : '#'}</TableHead>
                    <TableHead className="text-xs">{language === 'ar' ? 'الصنف' : 'Item'}</TableHead>
                    <TableHead className="text-xs">{language === 'ar' ? 'البيان' : 'Description'}</TableHead>
                    <TableHead className="text-xs w-20">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                    <TableHead className="text-xs w-20">{language === 'ar' ? 'كمية مرتجعة' : 'Returned'}</TableHead>
                    <TableHead className="text-xs w-16">{language === 'ar' ? 'الوحدة' : 'Unit'}</TableHead>
                    <TableHead className="text-xs w-20">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                    <TableHead className="text-xs w-20">{language === 'ar' ? 'المجموع' : 'Total'}</TableHead>
                    <TableHead className="text-xs w-14">{language === 'ar' ? '% الخصم' : 'Disc%'}</TableHead>
                    <TableHead className="text-xs w-20">{language === 'ar' ? 'الخصم' : 'Discount'}</TableHead>
                    <TableHead className="text-xs w-20">{language === 'ar' ? 'الصافي' : 'Net'}</TableHead>
                    <TableHead className="text-xs w-20">VAT</TableHead>
                    <TableHead className="text-xs w-20">{language === 'ar' ? 'المجموع' : 'Grand'}</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs">{idx + 1}</TableCell>
                      <TableCell><Input className="h-7 text-xs w-20" /></TableCell>
                      <TableCell><Input className="h-7 text-xs" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} /></TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} /></TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={item.returnedQty || ''} onChange={e => updateItem(idx, 'returnedQty', Number(e.target.value))} /></TableCell>
                      <TableCell><Input className="h-7 text-xs" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} /></TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={item.price || ''} onChange={e => updateItem(idx, 'price', Number(e.target.value))} /></TableCell>
                      <TableCell className="text-xs font-mono">{item.total.toFixed(2)}</TableCell>
                      <TableCell><Input type="number" className="h-7 text-xs" value={item.discountPercent || ''} onChange={e => updateItem(idx, 'discountPercent', Number(e.target.value))} /></TableCell>
                      <TableCell className="text-xs font-mono">{item.discount.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono">{item.net.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono">{item.vat.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono font-bold">{item.grandTotal.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}><Trash2 className="w-3 h-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Button variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="w-3 h-3" />{language === 'ar' ? 'إضافة صنف' : 'Add Item'}
            </Button>

            {/* Totals Footer */}
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border text-sm">
              <div className="flex gap-6">
                <span>{language === 'ar' ? 'المجموع' : 'Total'}: <strong>{totals.total.toFixed(2)}</strong></span>
                <span>{language === 'ar' ? 'الكمية' : 'Qty'}: <strong>{totals.quantity}</strong></span>
                <span>{language === 'ar' ? 'الخصم' : 'Discount'}: <strong>{totals.discount.toFixed(2)}</strong></span>
              </div>
              <div className="flex gap-6">
                <span>{language === 'ar' ? 'الإجمالي' : 'Subtotal'}: <strong>{totals.net.toFixed(2)}</strong></span>
                <span>{language === 'ar' ? 'الضريبة' : 'VAT'}: <strong>{totals.vat.toFixed(2)}</strong></span>
                <span className="text-primary font-bold">{language === 'ar' ? 'الصافي' : 'Net'}: {totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="gap-1"><Printer className="w-4 h-4" />{language === 'ar' ? 'طباعة' : 'Print'}</Button>
              <Button size="sm" className="gap-1" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4" />{language === 'ar' ? 'اعتماد' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{returns.length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المرتجعات' : 'Total Returns'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{returns.filter((r: any) => r.status === 'draft').length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'مسودة' : 'Draft'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{returns.filter((r: any) => r.status === 'approved').length}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'معتمدة' : 'Approved'}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{returns.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0).toLocaleString()} {t.mod_currency}</div><p className="text-sm text-muted-foreground">{language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</p></CardContent></Card>
      </div>

      {/* Returns List */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder={t.mod_search} value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          </div>
        </div>
        <CardContent>
          {isLoading ? <p className="text-center py-8 text-muted-foreground">{t.loading}</p> : filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد مرتجعات' : 'No returns found'}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'رقم المرتجع' : 'Return #'}</TableHead>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{t.amount}</TableHead>
                  <TableHead>{language === 'ar' ? 'السبب' : 'Reason'}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.note_number}</TableCell>
                    <TableCell>{r.note_date}</TableCell>
                    <TableCell>{Number(r.total_amount || 0).toLocaleString()} {t.mod_currency}</TableCell>
                    <TableCell className="text-sm">{r.reason || '-'}</TableCell>
                    <TableCell><Badge variant={r.status === 'approved' ? 'default' : 'secondary'}>{r.status === 'approved' ? (language === 'ar' ? 'معتمد' : 'Approved') : (language === 'ar' ? 'مسودة' : 'Draft')}</Badge></TableCell>
                    <TableCell>{r.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-3 h-3" /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
