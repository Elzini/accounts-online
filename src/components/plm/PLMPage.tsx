import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Layers, Plus, GitBranch, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { usePlmProducts, useAddPlmProduct, useDeletePlmProduct, usePlmEcos, useAddPlmEco } from '@/hooks/useModuleData';

export function PLMPage() {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddEco, setShowAddEco] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', version: 'v1.0', stage: 'design', bom_reference: '', description: '' });
  const [newEco, setNewEco] = useState({ title: '', eco_number: '', change_type: 'improvement', requested_by: '', description: '', product_id: '' });

  const { data: products = [], isLoading: loadingProducts } = usePlmProducts();
  const { data: ecos = [], isLoading: loadingEcos } = usePlmEcos();
  const addProduct = useAddPlmProduct();
  const deleteProduct = useDeletePlmProduct();
  const addEco = useAddPlmEco();

  const stageColors: Record<string, string> = { design: 'bg-blue-100 text-blue-800', testing: 'bg-yellow-100 text-yellow-800', production: 'bg-green-100 text-green-800' };

  const handleAddProduct = () => {
    if (!newProduct.name) return;
    addProduct.mutate(newProduct, { onSuccess: () => { setShowAddProduct(false); setNewProduct({ name: '', version: 'v1.0', stage: 'design', bom_reference: '', description: '' }); } });
  };

  const handleAddEco = () => {
    if (!newEco.title) return;
    addEco.mutate({ ...newEco, product_id: newEco.product_id || null }, { onSuccess: () => { setShowAddEco(false); setNewEco({ title: '', eco_number: '', change_type: 'improvement', requested_by: '', description: '', product_id: '' }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center"><Layers className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">PLM - إدارة دورة المنتج</h1>
            <p className="text-sm text-muted-foreground">إدارة الإصدارات وأوامر التغيير الهندسية</p>
          </div>
        </div>
        <Button className="gap-1" onClick={() => setShowAddProduct(true)}><Plus className="w-4 h-4" />منتج جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Layers className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">منتجات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><GitBranch className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{ecos.length}</p><p className="text-xs text-muted-foreground">أوامر تغيير</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{products.filter((p: any) => p.stage === 'production').length}</p><p className="text-xs text-muted-foreground">في الإنتاج</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{ecos.filter((e: any) => e.status === 'in_review').length}</p><p className="text-xs text-muted-foreground">قيد المراجعة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="ecos">أوامر التغيير (ECO)</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card><CardContent className="pt-4">
            {loadingProducts ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
            products.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد منتجات. أضف منتجاً جديداً.</p> :
            <Table>
              <TableHeader><TableRow>
                <TableHead>المنتج</TableHead><TableHead>الإصدار</TableHead><TableHead>المرحلة</TableHead>
                <TableHead>BOM</TableHead><TableHead>الوصف</TableHead><TableHead>إجراءات</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {products.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono">{p.version}</TableCell>
                    <TableCell><Badge className={stageColors[p.stage] || ''}>{p.stage === 'design' ? 'تصميم' : p.stage === 'testing' ? 'اختبار' : 'إنتاج'}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{p.bom_reference || '-'}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.description || '-'}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProduct.mutate(p.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="ecos" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button className="gap-1" onClick={() => setShowAddEco(true)}><Plus className="w-4 h-4" />أمر تغيير جديد</Button>
          </div>
          <Card><CardContent className="pt-4">
            {loadingEcos ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
            ecos.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد أوامر تغيير.</p> :
            <Table>
              <TableHeader><TableRow>
                <TableHead>الرقم</TableHead><TableHead>العنوان</TableHead><TableHead>النوع</TableHead>
                <TableHead>الطالب</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {ecos.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono">{e.eco_number || '-'}</TableCell>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell><Badge variant="outline">{e.change_type}</Badge></TableCell>
                    <TableCell>{e.requested_by || '-'}</TableCell>
                    <TableCell><Badge variant={e.status === 'approved' ? 'default' : e.status === 'in_review' ? 'secondary' : 'outline'}>
                      {e.status === 'approved' ? 'معتمد' : e.status === 'in_review' ? 'قيد المراجعة' : 'مسودة'}
                    </Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent><DialogHeader><DialogTitle>إضافة منتج جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>اسم المنتج *</Label><Input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الإصدار</Label><Input value={newProduct.version} onChange={e => setNewProduct(p => ({ ...p, version: e.target.value }))} /></div>
              <div><Label>المرحلة</Label>
                <Select value={newProduct.stage} onValueChange={v => setNewProduct(p => ({ ...p, stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="design">تصميم</SelectItem><SelectItem value="testing">اختبار</SelectItem><SelectItem value="production">إنتاج</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>مرجع BOM</Label><Input value={newProduct.bom_reference} onChange={e => setNewProduct(p => ({ ...p, bom_reference: e.target.value }))} /></div>
            <div><Label>الوصف</Label><Textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} /></div>
            <Button onClick={handleAddProduct} disabled={addProduct.isPending} className="w-full">{addProduct.isPending ? 'جاري الإضافة...' : 'إضافة المنتج'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add ECO Dialog */}
      <Dialog open={showAddEco} onOpenChange={setShowAddEco}>
        <DialogContent><DialogHeader><DialogTitle>أمر تغيير هندسي جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>العنوان *</Label><Input value={newEco.title} onChange={e => setNewEco(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>رقم ECO</Label><Input value={newEco.eco_number} onChange={e => setNewEco(p => ({ ...p, eco_number: e.target.value }))} /></div>
              <div><Label>النوع</Label>
                <Select value={newEco.change_type} onValueChange={v => setNewEco(p => ({ ...p, change_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="improvement">تحسين</SelectItem><SelectItem value="supplier_change">تغيير مورد</SelectItem><SelectItem value="design">تصميم</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>الطالب</Label><Input value={newEco.requested_by} onChange={e => setNewEco(p => ({ ...p, requested_by: e.target.value }))} /></div>
            <div><Label>المنتج</Label>
              <Select value={newEco.product_id} onValueChange={v => setNewEco(p => ({ ...p, product_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>الوصف</Label><Textarea value={newEco.description} onChange={e => setNewEco(p => ({ ...p, description: e.target.value }))} /></div>
            <Button onClick={handleAddEco} disabled={addEco.isPending} className="w-full">{addEco.isPending ? 'جاري الإضافة...' : 'إضافة أمر التغيير'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
