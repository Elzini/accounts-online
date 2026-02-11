import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Plus, Coins, ArrowRightLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CurrenciesPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [isCurrencyDialog, setIsCurrencyDialog] = useState(false);
  const [isRateDialog, setIsRateDialog] = useState(false);
  const [currencyForm, setCurrencyForm] = useState({ code: '', name_ar: '', name_en: '', symbol: '', is_base: false, decimal_places: 2 });
  const [rateForm, setRateForm] = useState({ from_currency_id: '', to_currency_id: '', rate: 1, effective_date: new Date().toISOString().split('T')[0] });

  const { data: currencies = [], isLoading } = useQuery({
    queryKey: ['currencies', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('currencies').select('*').eq('company_id', companyId).order('is_base', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: rates = [] } = useQuery({
    queryKey: ['exchange-rates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('exchange_rates').select('*, from_currency:currencies!exchange_rates_from_currency_id_fkey(code, name_ar), to_currency:currencies!exchange_rates_to_currency_id_fkey(code, name_ar)').eq('company_id', companyId).order('effective_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const addCurrency = useMutation({
    mutationFn: async (form: typeof currencyForm) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('currencies').insert({ company_id: companyId, ...form });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('تم إضافة العملة');
      setIsCurrencyDialog(false);
      setCurrencyForm({ code: '', name_ar: '', name_en: '', symbol: '', is_base: false, decimal_places: 2 });
    },
    onError: (e: any) => toast.error(e.message?.includes('duplicate') ? 'العملة موجودة مسبقاً' : 'حدث خطأ'),
  });

  const addRate = useMutation({
    mutationFn: async (form: typeof rateForm) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('exchange_rates').insert({ company_id: companyId, ...form });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast.success('تم إضافة سعر الصرف');
      setIsRateDialog(false);
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteCurrency = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('currencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success('تم حذف العملة');
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Coins className="w-6 h-6" />العملات وأسعار الصرف</h1>
        <p className="text-muted-foreground">إدارة العملات المتعددة وأسعار الصرف</p>
      </div>

      <Tabs defaultValue="currencies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="currencies">العملات</TabsTrigger>
          <TabsTrigger value="rates">أسعار الصرف</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>العملات المسجلة</CardTitle>
              <Dialog open={isCurrencyDialog} onOpenChange={setIsCurrencyDialog}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-4 h-4" />إضافة عملة</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إضافة عملة جديدة</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); addCurrency.mutate(currencyForm); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>رمز العملة (ISO) *</Label><Input value={currencyForm.code} onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })} placeholder="SAR" maxLength={3} required dir="ltr" /></div>
                      <div className="space-y-2"><Label>الرمز</Label><Input value={currencyForm.symbol} onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })} placeholder="﷼" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>الاسم بالعربية *</Label><Input value={currencyForm.name_ar} onChange={(e) => setCurrencyForm({ ...currencyForm, name_ar: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>الاسم بالإنجليزية</Label><Input value={currencyForm.name_en} onChange={(e) => setCurrencyForm({ ...currencyForm, name_en: e.target.value })} dir="ltr" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>المنازل العشرية</Label><Input type="number" value={currencyForm.decimal_places} onChange={(e) => setCurrencyForm({ ...currencyForm, decimal_places: parseInt(e.target.value) || 2 })} /></div>
                      <div className="flex items-center gap-3 p-3 rounded-lg border"><Label>عملة أساسية</Label><Switch checked={currencyForm.is_base} onCheckedChange={(v) => setCurrencyForm({ ...currencyForm, is_base: v })} /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCurrencyDialog(false)}>إلغاء</Button>
                      <Button type="submit" disabled={addCurrency.isPending}>{addCurrency.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}إضافة</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الرمز</TableHead>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الرمز المختصر</TableHead>
                    <TableHead className="text-right">المنازل</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currencies.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono font-bold">{c.code}</TableCell>
                      <TableCell>{c.name_ar}</TableCell>
                      <TableCell>{c.symbol || '-'}</TableCell>
                      <TableCell>{c.decimal_places}</TableCell>
                      <TableCell>{c.is_base ? <Badge>أساسية</Badge> : <Badge variant="secondary">فرعية</Badge>}</TableCell>
                      <TableCell className="text-center">
                        {!c.is_base && <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCurrency.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {currencies.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد عملات مسجلة</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="w-5 h-5" />أسعار الصرف</CardTitle>
              <Dialog open={isRateDialog} onOpenChange={setIsRateDialog}>
                <DialogTrigger asChild><Button size="sm" className="gap-1" disabled={currencies.length < 2}><Plus className="w-4 h-4" />إضافة سعر صرف</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إضافة سعر صرف</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); addRate.mutate(rateForm); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>من عملة</Label>
                        <Select value={rateForm.from_currency_id} onValueChange={(v) => setRateForm({ ...rateForm, from_currency_id: v })}>
                          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                          <SelectContent>{currencies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name_ar}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>إلى عملة</Label>
                        <Select value={rateForm.to_currency_id} onValueChange={(v) => setRateForm({ ...rateForm, to_currency_id: v })}>
                          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                          <SelectContent>{currencies.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.code} - {c.name_ar}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>سعر الصرف</Label><Input type="number" step="0.000001" value={rateForm.rate} onChange={(e) => setRateForm({ ...rateForm, rate: parseFloat(e.target.value) || 1 })} dir="ltr" /></div>
                      <div className="space-y-2"><Label>تاريخ السريان</Label><Input type="date" value={rateForm.effective_date} onChange={(e) => setRateForm({ ...rateForm, effective_date: e.target.value })} /></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsRateDialog(false)}>إلغاء</Button>
                      <Button type="submit" disabled={addRate.isPending || !rateForm.from_currency_id || !rateForm.to_currency_id}>{addRate.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}إضافة</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">من</TableHead>
                    <TableHead className="text-right">إلى</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">تاريخ السريان</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.from_currency?.code} ({r.from_currency?.name_ar})</TableCell>
                      <TableCell className="font-mono">{r.to_currency?.code} ({r.to_currency?.name_ar})</TableCell>
                      <TableCell className="font-bold" dir="ltr">{r.rate}</TableCell>
                      <TableCell>{r.effective_date}</TableCell>
                    </TableRow>
                  ))}
                  {rates.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد أسعار صرف</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
