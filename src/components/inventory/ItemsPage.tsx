import { useState, useMemo } from 'react';
import { Package, Plus, Edit, Trash2, Search, List, FolderTree, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useItems, useAddItem, useUpdateItem, useDeleteItem, useItemCategories, useUnits, useWarehouses } from '@/hooks/useInventory';
import { toast } from 'sonner';

interface ItemForm {
  name: string;
  barcode: string;
  category_id: string;
  unit_id: string;
  item_type: string;
  warehouse_id: string;
  cost_price: number;
  sale_price_1: number;
  sale_price_2: number;
  sale_price_3: number;
  wholesale_price: number;
  min_quantity: number;
  max_quantity: number;
  reorder_level: number;
  current_quantity: number;
  opening_quantity: number;
  commission_rate: number;
  purchase_discount: number;
  expiry_date: string;
  notes: string;
}

const emptyForm: ItemForm = {
  name: '', barcode: '', category_id: '', unit_id: '', item_type: 'product',
  warehouse_id: '', cost_price: 0, sale_price_1: 0, sale_price_2: 0, sale_price_3: 0,
  wholesale_price: 0, min_quantity: 0, max_quantity: 0, reorder_level: 0,
  current_quantity: 0, opening_quantity: 0, commission_rate: 0, purchase_discount: 0,
  expiry_date: '', notes: '',
};

const ITEM_TYPES = [
  { value: 'product', label: 'منتج' },
  { value: 'service', label: 'خدمة' },
  { value: 'raw_material', label: 'مادة خام' },
];

export function ItemsPage() {
  const { data: items = [], isLoading } = useItems();
  const { data: categories = [] } = useItemCategories();
  const { data: units = [] } = useUnits();
  const { data: warehouses = [] } = useWarehouses();
  const addMutation = useAddItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Build category tree
  const categoryTree = useMemo(() => {
    const map = new Map<string | null, any[]>();
    categories.forEach((c: any) => {
      const parent = c.parent_id || null;
      if (!map.has(parent)) map.set(parent, []);
      map.get(parent)!.push(c);
    });
    return map;
  }, [categories]);

  const filteredItems = useMemo(() => {
    return (items as any[]).filter(item => {
      const matchSearch = !search || item.name.includes(search) || item.barcode?.includes(search);
      const matchCategory = filterCategory === 'all' || item.category_id === filterCategory;
      const matchType = filterType === 'all' || item.item_type === filterType;
      return matchSearch && matchCategory && matchType;
    });
  }, [items, search, filterCategory, filterType]);

  // Group items by category for tree view
  const groupedItems = useMemo(() => {
    const groups: Record<string, { category: any; items: any[] }> = {};
    filteredItems.forEach(item => {
      const catId = item.category_id || 'uncategorized';
      if (!groups[catId]) {
        const cat = categories.find((c: any) => c.id === catId);
        groups[catId] = { category: cat || { id: 'uncategorized', name: 'بدون تصنيف' }, items: [] };
      }
      groups[catId].items.push(item);
    });
    return Object.values(groups);
  }, [filteredItems, categories]);

  const handleOpen = (item?: any) => {
    if (item) {
      setEditId(item.id);
      setForm({
        name: item.name, barcode: item.barcode || '', category_id: item.category_id || '',
        unit_id: item.unit_id || '', item_type: item.item_type || 'product',
        warehouse_id: item.warehouse_id || '', cost_price: item.cost_price || 0,
        sale_price_1: item.sale_price_1 || 0, sale_price_2: item.sale_price_2 || 0,
        sale_price_3: item.sale_price_3 || 0, wholesale_price: item.wholesale_price || 0,
        min_quantity: item.min_quantity || 0, max_quantity: item.max_quantity || 0,
        reorder_level: item.reorder_level || 0, current_quantity: item.current_quantity || 0,
        opening_quantity: item.opening_quantity || 0, commission_rate: item.commission_rate || 0,
        purchase_discount: item.purchase_discount || 0, expiry_date: item.expiry_date || '', notes: item.notes || '',
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('اسم الصنف مطلوب'); return; }
    try {
      const payload: any = { ...form };
      if (!payload.category_id) delete payload.category_id;
      if (!payload.unit_id) delete payload.unit_id;
      if (!payload.warehouse_id) delete payload.warehouse_id;
      if (!payload.expiry_date) delete payload.expiry_date;

      if (editId) {
        await updateMutation.mutateAsync({ id: editId, ...payload });
        toast.success('تم تحديث الصنف');
      } else {
        await addMutation.mutateAsync(payload);
        toast.success('تم إضافة الصنف');
      }
      setDialogOpen(false);
    } catch { toast.error('حدث خطأ'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('تم حذف الصنف');
    } catch { toast.error('حدث خطأ'); }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'product': return <Badge variant="secondary">منتج</Badge>;
      case 'service': return <Badge variant="outline">خدمة</Badge>;
      case 'raw_material': return <Badge className="bg-warning/10 text-warning border-warning/20">مادة خام</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ملف الأصناف</h1>
            <p className="text-sm text-muted-foreground">{filteredItems.length} صنف</p>
          </div>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة صنف
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الباركود..." className="pr-10" />
            </div>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 ml-2" /><SelectValue placeholder="الفئة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {(categories as any[]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="gap-1.5 h-8"><List className="w-4 h-4" /> قائمة</Button>
            <Button size="sm" variant={viewMode === 'tree' ? 'default' : 'ghost'} onClick={() => setViewMode('tree')} className="gap-1.5 h-8"><FolderTree className="w-4 h-4" /> شجري</Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">لا توجد أصناف</p>
          <Button onClick={() => handleOpen()} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" /> إضافة صنف</Button>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">#</TableHead>
                  <TableHead className="text-right">اسم الصنف</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">الوحدة</TableHead>
                  <TableHead className="text-right">المستودع</TableHead>
                  <TableHead className="text-right">التكلفة</TableHead>
                  <TableHead className="text-right">سعر البيع</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.item_number}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getTypeBadge(item.item_type)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.item_categories?.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.units_of_measure?.abbreviation || item.units_of_measure?.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{item.warehouses?.warehouse_name || '-'}</TableCell>
                    <TableCell>{Number(item.cost_price).toLocaleString()}</TableCell>
                    <TableCell>{Number(item.sale_price_1).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={Number(item.current_quantity) <= Number(item.reorder_level) ? 'text-destructive font-medium' : ''}>
                        {Number(item.current_quantity).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleOpen(item)}><Edit className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedItems.map(group => (
            <Card key={group.category.id} className="overflow-hidden">
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">{group.category.name}</span>
                <Badge variant="secondary" className="mr-auto">{group.items.length}</Badge>
              </div>
              <Table>
                <TableBody>
                  {group.items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs w-12">{item.item_number}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{getTypeBadge(item.item_type)}</TableCell>
                      <TableCell className="text-muted-foreground">{item.units_of_measure?.abbreviation || '-'}</TableCell>
                      <TableCell>{Number(item.cost_price).toLocaleString()}</TableCell>
                      <TableCell>{Number(item.sale_price_1).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={Number(item.current_quantity) <= Number(item.reorder_level) ? 'text-destructive font-medium' : ''}>
                          {Number(item.current_quantity).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpen(item)}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      )}

      {/* Item Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</DialogTitle></DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">بيانات عامة</TabsTrigger>
              <TabsTrigger value="pricing">الأسعار والكميات</TabsTrigger>
              <TabsTrigger value="extra">بيانات إضافية</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>اسم الصنف *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>الباركود</Label><Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} /></div>
                <div>
                  <Label>النوع</Label>
                  <Select value={form.item_type} onValueChange={v => setForm(f => ({ ...f, item_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ITEM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الفئة</Label>
                  <Select value={form.category_id || 'none'} onValueChange={v => setForm(f => ({ ...f, category_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون فئة</SelectItem>
                      {(categories as any[]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الوحدة</Label>
                  <Select value={form.unit_id || 'none'} onValueChange={v => setForm(f => ({ ...f, unit_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر الوحدة" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون وحدة</SelectItem>
                      {(units as any[]).map(u => <SelectItem key={u.id} value={u.id}>{u.name} {u.abbreviation ? `(${u.abbreviation})` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المستودع</Label>
                  <Select value={form.warehouse_id || 'none'} onValueChange={v => setForm(f => ({ ...f, warehouse_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المستودع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون مستودع</SelectItem>
                      {(warehouses as any[]).map(w => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>التكلفة</Label><Input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: +e.target.value }))} /></div>
                <div><Label>سعر البيع 1</Label><Input type="number" value={form.sale_price_1} onChange={e => setForm(f => ({ ...f, sale_price_1: +e.target.value }))} /></div>
                <div><Label>سعر البيع 2</Label><Input type="number" value={form.sale_price_2} onChange={e => setForm(f => ({ ...f, sale_price_2: +e.target.value }))} /></div>
                <div><Label>سعر البيع 3</Label><Input type="number" value={form.sale_price_3} onChange={e => setForm(f => ({ ...f, sale_price_3: +e.target.value }))} /></div>
                <div><Label>سعر الجملة</Label><Input type="number" value={form.wholesale_price} onChange={e => setForm(f => ({ ...f, wholesale_price: +e.target.value }))} /></div>
                <div className="border-t col-span-2 pt-2" />
                <div><Label>الكمية الحالية</Label><Input type="number" value={form.current_quantity} onChange={e => setForm(f => ({ ...f, current_quantity: +e.target.value }))} /></div>
                <div><Label>الكمية الافتتاحية</Label><Input type="number" value={form.opening_quantity} onChange={e => setForm(f => ({ ...f, opening_quantity: +e.target.value }))} /></div>
                <div><Label>الحد الأدنى</Label><Input type="number" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: +e.target.value }))} /></div>
                <div><Label>الحد الأعلى</Label><Input type="number" value={form.max_quantity} onChange={e => setForm(f => ({ ...f, max_quantity: +e.target.value }))} /></div>
                <div><Label>حد إعادة الطلب</Label><Input type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: +e.target.value }))} /></div>
              </div>
            </TabsContent>
            <TabsContent value="extra" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>نسبة العمولة %</Label><Input type="number" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: +e.target.value }))} /></div>
                <div><Label>خصم المشتريات %</Label><Input type="number" value={form.purchase_discount} onChange={e => setForm(f => ({ ...f, purchase_discount: +e.target.value }))} /></div>
                <div><Label>تاريخ الانتهاء</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              </div>
              <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>
              {editId ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
