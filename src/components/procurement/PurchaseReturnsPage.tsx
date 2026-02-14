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
import { Plus, Search, Trash2, RotateCcw, Loader2 } from 'lucide-react';
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
  cost: number;
  total: number;
  vat: number;
  grandTotal: number;
}

interface BatchData {
  id: string;
  batch_number: number;
  purchase_date: string;
  supplier?: { name: string } | null;
  cars?: Array<{
    id: string;
    name: string;
    model: string | null;
    color: string | null;
    chassis_number: string;
    purchase_price: number;
    status: string;
  }> | null;
}

export function PurchaseReturnsPage() {
  const { t, language } = useLanguage();
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [searchList, setSearchList] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundBatch, setFoundBatch] = useState<BatchData | null>(null);
  const [form, setForm] = useState({
    paymentMethod: 'cash',
    fullInvoice: true,
    returnDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [items, setItems] = useState<ReturnItem[]>([]);

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

  const searchBatch = useCallback(async () => {
    if (!batchSearch.trim() || !companyId) return;
    setIsSearching(true);
    try {
      // Fetch batch separately to avoid deep type issues
      const { data: batchArr, error: bErr } = await (supabase
        .from('purchase_batches') as any)
        .select('*')
        .eq('company_id', companyId)
        .eq('batch_number', parseInt(batchSearch))
        .limit(1);

      if (bErr || !batchArr || batchArr.length === 0) {
        toast.error(language === 'ar' ? 'لم يتم العثور على فاتورة الشراء' : 'Purchase invoice not found');
        setFoundBatch(null);
        setItems([]);
        return;
      }

      const batch = batchArr[0];

      // Fetch supplier name
      let supplierName = '-';
      if (batch.supplier_id) {
        const { data: sup } = await supabase.from('suppliers').select('name').eq('id', batch.supplier_id).single();
        if (sup) supplierName = sup.name;
      }

      // Fetch cars for this batch
      const { data: batchCars } = await supabase
        .from('cars')
        .select('id, name, model, color, chassis_number, purchase_price, status')
        .eq('batch_id', batch.id);

      setFoundBatch({ ...batch, supplier: { name: supplierName } } as any);
      const carsArr = batchCars || [];

      // Only show available cars (already in inventory)
      const availableCars = carsArr.filter((c: any) => c.status === 'available');
      
      if (availableCars.length === 0) {
        toast.error(language === 'ar' ? 'لا توجد سيارات متاحة للإرجاع (قد تكون مباعة)' : 'No available cars to return');
        setItems([]);
        return;
      }

      setItems(availableCars.map((car: any, idx: number) => {
        const cost = Number(car.purchase_price);
        const vat = cost * 0.15;
        return {
          id: String(idx + 1),
          car_id: car.id,
          description: `${car.name || ''} ${car.model || ''} - ${car.color || ''} - شاسيه: ${car.chassis_number || ''}`,
          quantity: 1,
          returnedQty: 1,
          unit: 'سيارة',
          cost,
          total: cost,
          vat,
          grandTotal: cost + vat,
        };
      }));
      toast.success(language === 'ar' ? `تم العثور على ${availableCars.length} سيارة متاحة للإرجاع` : `Found ${availableCars.length} available cars`);
    } catch (e) {
      toast.error(language === 'ar' ? 'خطأ في البحث' : 'Search error');
    } finally {
      setIsSearching(false);
    }
  }, [batchSearch, companyId, language]);

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

  const totals = items.reduce((acc, item) => ({
    quantity: acc.quantity + item.returnedQty,
    total: acc.total + item.total,
    vat: acc.vat + item.vat,
    grandTotal: acc.grandTotal + item.grandTotal,
  }), { quantity: 0, total: 0, vat: 0, grandTotal: 0 });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!foundBatch) throw new Error('No batch found');

      // 1. Remove returned cars from inventory (mark as returned)
      const returnedItems = items.filter(i => i.returnedQty > 0);
      for (const item of returnedItems) {
        const { error: carErr } = await supabase
          .from('cars')
          .update({ status: 'returned' })
          .eq('id', item.car_id);
        if (carErr) throw carErr;
      }

      // 2. Delete journal entry for this purchase if full return
      if (form.fullInvoice) {
        await supabase
          .from('journal_entries')
          .delete()
          .eq('reference_type', 'purchase')
          .eq('reference_id', foundBatch.id);
      }

      // 3. Save debit note record
      const num = `PR-${String(returns.length + 1).padStart(4, '0')}`;
      const { error } = await supabase.from('credit_debit_notes').insert({
        company_id: companyId!,
        note_number: num,
        note_type: 'debit',
        note_date: form.returnDate,
        total_amount: totals.grandTotal,
        reason: `مرتجع فاتورة شراء رقم ${foundBatch.batch_number}${form.notes ? ' - ' + form.notes : ''}`,
        status: 'approved',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] });
      queryClient.invalidateQueries({ queryKey: ['credit-debit-notes'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-batches'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success(language === 'ar' ? 'تم اعتماد مرتجع المشتريات وخصم السيارات من المخزون' : 'Purchase return approved, cars removed from inventory');
      setShowAdd(false);
      setFoundBatch(null);
      setItems([]);
      setBatchSearch('');
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

  const filtered = returns.filter((r: any) => r.note_number?.includes(searchList) || r.reason?.includes(searchList));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {language === 'ar' ? 'مرتجع مشتريات / إشعار مدين' : 'Purchase Returns / Debit Note'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة مرتجعات المشتريات وإشعارات المدين' : 'Manage purchase returns and debit notes'}
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) { setFoundBatch(null); setItems([]); setBatchSearch(''); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />{language === 'ar' ? 'مرتجع جديد' : 'New Return'}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'مرتجع مشتريات / إشعار مدين' : 'Purchase Return / Debit Note'}</DialogTitle>
            </DialogHeader>

            {/* Batch Search */}
            <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-3">
              <Label className="font-bold text-base">{language === 'ar' ? 'بحث عن فاتورة الشراء' : 'Search Purchase Invoice'}</Label>
              <div className="flex gap-2">
                <Input
                  className="h-10 text-base font-mono"
                  placeholder={language === 'ar' ? 'أدخل رقم فاتورة الشراء (رقم الدفعة)...' : 'Enter purchase batch number...'}
                  value={batchSearch}
                  onChange={e => setBatchSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchBatch()}
                  type="number"
                />
                <Button onClick={searchBatch} disabled={isSearching} className="gap-2 min-w-[120px]">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {language === 'ar' ? 'بحث' : 'Search'}
                </Button>
              </div>

              {foundBatch && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-card rounded-lg border">
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'رقم الدفعة' : 'Batch #'}</span>
                    <p className="font-bold text-primary">{foundBatch.batch_number}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'المورد' : 'Supplier'}</span>
                    <p className="font-medium">{foundBatch.supplier?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'عدد السيارات المتاحة' : 'Available Cars'}</span>
                    <p className="font-bold">{items.length}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? 'تاريخ الشراء' : 'Purchase Date'}</span>
                    <p className="font-medium">{foundBatch.purchase_date}</p>
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
                <Checkbox id="fullInvoicePR" checked={form.fullInvoice} onCheckedChange={(v) => setForm(p => ({ ...p, fullInvoice: !!v }))} />
                <Label htmlFor="fullInvoicePR" className="text-xs">{language === 'ar' ? 'إرجاع كامل الفاتورة' : 'Full Invoice Return'}</Label>
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
                        <TableHead className="text-xs w-24">{language === 'ar' ? 'التكلفة' : 'Cost'}</TableHead>
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
                          <TableCell className="text-xs font-mono">{item.cost.toLocaleString()}</TableCell>
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
                    {language === 'ar' ? 'اعتماد المرتجع وخصم من المخزون' : 'Approve & Remove from Inventory'}
                  </Button>
                </div>
              </>
            )}

            {!foundBatch && items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{language === 'ar' ? 'أدخل رقم فاتورة الشراء للبحث عنها' : 'Enter purchase invoice number to search'}</p>
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
