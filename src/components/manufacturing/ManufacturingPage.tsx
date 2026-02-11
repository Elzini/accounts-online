import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Factory, Package, ClipboardList, Trash2, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function ManufacturingPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  // Products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['mfg-products', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('manufacturing_products')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Production Orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['production-orders', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('production_orders')
        .select('*, manufacturing_products(name)')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Add Product
  const [isProductDialog, setIsProductDialog] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', code: '', unit: 'وحدة', estimated_cost: 0, selling_price: 0, description: '' });

  const addProduct = useMutation({
    mutationFn: async (form: typeof productForm) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('manufacturing_products').insert({ company_id: companyId, ...form });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfg-products'] });
      toast.success('تم إضافة المنتج');
      setIsProductDialog(false);
      setProductForm({ name: '', code: '', unit: 'وحدة', estimated_cost: 0, selling_price: 0, description: '' });
    },
    onError: () => toast.error('خطأ في الإضافة'),
  });

  // Add Order
  const [isOrderDialog, setIsOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({ product_id: '', quantity: 1, start_date: '', notes: '' });

  const addOrder = useMutation({
    mutationFn: async (form: typeof orderForm) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('production_orders').insert({
        company_id: companyId,
        product_id: form.product_id,
        quantity: form.quantity,
        start_date: form.start_date || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('تم إنشاء أمر الإنتاج');
      setIsOrderDialog(false);
    },
    onError: () => toast.error('خطأ في الإنشاء'),
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed') updates.end_date = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('production_orders').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      toast.success('تم تحديث الحالة');
    },
  });

  const formatCurrency = (n: number) => new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2 }).format(n);

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    planned: { label: 'مخطط', variant: 'outline' },
    in_progress: { label: 'قيد التنفيذ', variant: 'default' },
    completed: { label: 'مكتمل', variant: 'secondary' },
    cancelled: { label: 'ملغي', variant: 'destructive' },
  };

  const isLoading = loadingProducts || loadingOrders;
  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Factory className="w-6 h-6" />
          موديول التصنيع
        </h1>
        <p className="text-muted-foreground">إدارة المنتجات وأوامر الإنتاج ومراحل التصنيع</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{products.length}</div><p className="text-sm text-muted-foreground">المنتجات</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'in_progress').length}</div><p className="text-sm text-muted-foreground">قيد التنفيذ</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'completed').length}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{orders.filter((o: any) => o.status === 'planned').length}</div><p className="text-sm text-muted-foreground">مخططة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">المنتجات (BOM)</TabsTrigger>
          <TabsTrigger value="orders">أوامر الإنتاج</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" />قائمة المنتجات</CardTitle>
              <Dialog open={isProductDialog} onOpenChange={setIsProductDialog}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-4 h-4" />منتج جديد</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إضافة منتج</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); addProduct.mutate(productForm); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>اسم المنتج *</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required /></div>
                      <div className="space-y-2"><Label>الرمز</Label><Input value={productForm.code} onChange={(e) => setProductForm({ ...productForm, code: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>الوحدة</Label><Input value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} /></div>
                      <div className="space-y-2"><Label>التكلفة التقديرية</Label><Input type="number" value={productForm.estimated_cost} onChange={(e) => setProductForm({ ...productForm, estimated_cost: parseFloat(e.target.value) || 0 })} /></div>
                      <div className="space-y-2"><Label>سعر البيع</Label><Input type="number" value={productForm.selling_price} onChange={(e) => setProductForm({ ...productForm, selling_price: parseFloat(e.target.value) || 0 })} /></div>
                    </div>
                    <div className="space-y-2"><Label>الوصف</Label><Textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsProductDialog(false)}>إلغاء</Button>
                      <Button type="submit" disabled={addProduct.isPending}>{addProduct.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}إضافة</Button>
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
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الوحدة</TableHead>
                    <TableHead className="text-right">التكلفة</TableHead>
                    <TableHead className="text-right">سعر البيع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.code || '-'}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.unit}</TableCell>
                      <TableCell>{formatCurrency(p.estimated_cost)}</TableCell>
                      <TableCell>{formatCurrency(p.selling_price)}</TableCell>
                      <TableCell><Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'نشط' : 'متوقف'}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد منتجات</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />أوامر الإنتاج</CardTitle>
              <Dialog open={isOrderDialog} onOpenChange={setIsOrderDialog}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="w-4 h-4" />أمر إنتاج</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>إنشاء أمر إنتاج</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); addOrder.mutate(orderForm); }} className="space-y-4">
                    <div className="space-y-2">
                      <Label>المنتج *</Label>
                      <Select value={orderForm.product_id} onValueChange={(v) => setOrderForm({ ...orderForm, product_id: v })}>
                        <SelectTrigger><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                        <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>الكمية *</Label><Input type="number" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: parseFloat(e.target.value) || 1 })} required /></div>
                      <div className="space-y-2"><Label>تاريخ البدء</Label><Input type="date" value={orderForm.start_date} onChange={(e) => setOrderForm({ ...orderForm, start_date: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>ملاحظات</Label><Textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} /></div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsOrderDialog(false)}>إلغاء</Button>
                      <Button type="submit" disabled={addOrder.isPending || !orderForm.product_id}>{addOrder.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}إنشاء</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الكمية</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ البدء</TableHead>
                    <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o: any) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.order_number}</TableCell>
                      <TableCell className="font-medium">{o.manufacturing_products?.name}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[o.status]?.variant || 'default'}>
                          {statusLabels[o.status]?.label || o.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{o.start_date || '-'}</TableCell>
                      <TableCell>{o.end_date || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {o.status === 'planned' && (
                            <Button size="sm" variant="outline" onClick={() => updateOrderStatus.mutate({ id: o.id, status: 'in_progress' })}>بدء</Button>
                          )}
                          {o.status === 'in_progress' && (
                            <Button size="sm" variant="outline" onClick={() => updateOrderStatus.mutate({ id: o.id, status: 'completed' })}>إنهاء</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد أوامر إنتاج</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
