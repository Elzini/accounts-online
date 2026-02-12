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
import { useLanguage } from '@/contexts/LanguageContext';

interface ItemForm {
  name: string; barcode: string; category_id: string; unit_id: string; item_type: string;
  warehouse_id: string; cost_price: number; sale_price_1: number; sale_price_2: number; sale_price_3: number;
  wholesale_price: number; min_quantity: number; max_quantity: number; reorder_level: number;
  current_quantity: number; opening_quantity: number; commission_rate: number; purchase_discount: number;
  expiry_date: string; notes: string;
}

const emptyForm: ItemForm = {
  name: '', barcode: '', category_id: '', unit_id: '', item_type: 'product',
  warehouse_id: '', cost_price: 0, sale_price_1: 0, sale_price_2: 0, sale_price_3: 0,
  wholesale_price: 0, min_quantity: 0, max_quantity: 0, reorder_level: 0,
  current_quantity: 0, opening_quantity: 0, commission_rate: 0, purchase_discount: 0,
  expiry_date: '', notes: '',
};

export function ItemsPage() {
  const { t, language } = useLanguage();

  const ITEM_TYPES = [
    { value: 'product', label: t.items_type_product },
    { value: 'service', label: t.items_type_service },
    { value: 'raw_material', label: t.items_type_raw },
  ];

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

  const categoryTree = useMemo(() => {
    const map = new Map<string | null, any[]>();
    categories.forEach((c: any) => { const parent = c.parent_id || null; if (!map.has(parent)) map.set(parent, []); map.get(parent)!.push(c); });
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

  const groupedItems = useMemo(() => {
    const groups: Record<string, { category: any; items: any[] }> = {};
    filteredItems.forEach(item => {
      const catId = item.category_id || 'uncategorized';
      if (!groups[catId]) { const cat = categories.find((c: any) => c.id === catId); groups[catId] = { category: cat || { id: 'uncategorized', name: t.items_no_category }, items: [] }; }
      groups[catId].items.push(item);
    });
    return Object.values(groups);
  }, [filteredItems, categories, t]);

  const handleOpen = (item?: any) => {
    if (item) {
      setEditId(item.id);
      setForm({ name: item.name, barcode: item.barcode || '', category_id: item.category_id || '', unit_id: item.unit_id || '', item_type: item.item_type || 'product', warehouse_id: item.warehouse_id || '', cost_price: item.cost_price || 0, sale_price_1: item.sale_price_1 || 0, sale_price_2: item.sale_price_2 || 0, sale_price_3: item.sale_price_3 || 0, wholesale_price: item.wholesale_price || 0, min_quantity: item.min_quantity || 0, max_quantity: item.max_quantity || 0, reorder_level: item.reorder_level || 0, current_quantity: item.current_quantity || 0, opening_quantity: item.opening_quantity || 0, commission_rate: item.commission_rate || 0, purchase_discount: item.purchase_discount || 0, expiry_date: item.expiry_date || '', notes: item.notes || '' });
    } else { setEditId(null); setForm(emptyForm); }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t.items_name_required); return; }
    try {
      const payload: any = { ...form };
      if (!payload.category_id) delete payload.category_id;
      if (!payload.unit_id) delete payload.unit_id;
      if (!payload.warehouse_id) delete payload.warehouse_id;
      if (!payload.expiry_date) delete payload.expiry_date;
      if (editId) { await updateMutation.mutateAsync({ id: editId, ...payload }); toast.success(t.items_updated); }
      else { await addMutation.mutateAsync(payload); toast.success(t.items_added); }
      setDialogOpen(false);
    } catch { toast.error(t.wh_error); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.items_delete_confirm)) return;
    try { await deleteMutation.mutateAsync(id); toast.success(t.items_deleted); } catch { toast.error(t.wh_error); }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'product': return <Badge variant="secondary">{t.items_type_product}</Badge>;
      case 'service': return <Badge variant="outline">{t.items_type_service}</Badge>;
      case 'raw_material': return <Badge className="bg-warning/10 text-warning border-warning/20">{t.items_type_raw}</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div>
          <div><h1 className="text-xl font-bold text-foreground">{t.items_title}</h1><p className="text-sm text-muted-foreground">{filteredItems.length} {t.items_count}</p></div>
        </div>
        <Button onClick={() => handleOpen()} className="gap-2"><Plus className="w-4 h-4" /> {t.items_add}</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.items_search_placeholder} className="pr-10" />
            </div>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 ml-2" /><SelectValue placeholder={t.items_category} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.items_all_categories}</SelectItem>
              {(categories as any[]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder={t.items_type} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.items_all_types}</SelectItem>
              {ITEM_TYPES.map(t2 => <SelectItem key={t2.value} value={t2.value}>{t2.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="gap-1.5 h-8"><List className="w-4 h-4" /> {t.items_list_view}</Button>
            <Button size="sm" variant={viewMode === 'tree' ? 'default' : 'ghost'} onClick={() => setViewMode('tree')} className="gap-1.5 h-8"><FolderTree className="w-4 h-4" /> {t.items_tree_view}</Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t.items_loading}</div>
      ) : filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">{t.items_no_items}</p>
          <Button onClick={() => handleOpen()} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" /> {t.items_add}</Button>
        </Card>
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-right">{t.items_number}</TableHead>
                <TableHead className="text-right">{t.items_name}</TableHead>
                <TableHead className="text-right">{t.items_type}</TableHead>
                <TableHead className="text-right">{t.items_category}</TableHead>
                <TableHead className="text-right">{t.items_unit}</TableHead>
                <TableHead className="text-right">{t.items_warehouse}</TableHead>
                <TableHead className="text-right">{t.items_cost}</TableHead>
                <TableHead className="text-right">{t.items_sale_price}</TableHead>
                <TableHead className="text-right">{t.items_quantity}</TableHead>
                <TableHead className="text-right">{t.actions}</TableHead>
              </TableRow></TableHeader>
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
                    <TableCell><span className={Number(item.current_quantity) <= Number(item.reorder_level) ? 'text-destructive font-medium' : ''}>{Number(item.current_quantity).toLocaleString()}</span></TableCell>
                    <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleOpen(item)}><Edit className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button></div></TableCell>
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
                      <TableCell><span className={Number(item.current_quantity) <= Number(item.reorder_level) ? 'text-destructive font-medium' : ''}>{Number(item.current_quantity).toLocaleString()}</span></TableCell>
                      <TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => handleOpen(item)}><Edit className="w-4 h-4" /></Button><Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? t.items_edit_title : t.items_add_title}</DialogTitle></DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">{t.items_general_tab}</TabsTrigger>
              <TabsTrigger value="pricing">{t.items_pricing_tab}</TabsTrigger>
              <TabsTrigger value="extra">{t.items_extra_tab}</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>{t.items_name} *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>{t.items_barcode}</Label><Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} /></div>
                <div>
                  <Label>{t.items_type}</Label>
                  <Select value={form.item_type} onValueChange={v => setForm(f => ({ ...f, item_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ITEM_TYPES.map(t2 => <SelectItem key={t2.value} value={t2.value}>{t2.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.items_category}</Label>
                  <Select value={form.category_id || 'none'} onValueChange={v => setForm(f => ({ ...f, category_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder={t.items_category} /></SelectTrigger>
                    <SelectContent><SelectItem value="none">{t.items_no_category}</SelectItem>{(categories as any[]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.items_unit}</Label>
                  <Select value={form.unit_id || 'none'} onValueChange={v => setForm(f => ({ ...f, unit_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder={t.items_unit} /></SelectTrigger>
                    <SelectContent><SelectItem value="none">{t.items_no_unit}</SelectItem>{(units as any[]).map(u => <SelectItem key={u.id} value={u.id}>{u.name} {u.abbreviation ? `(${u.abbreviation})` : ''}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.items_warehouse}</Label>
                  <Select value={form.warehouse_id || 'none'} onValueChange={v => setForm(f => ({ ...f, warehouse_id: v === 'none' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder={t.items_warehouse} /></SelectTrigger>
                    <SelectContent><SelectItem value="none">{t.items_no_warehouse}</SelectItem>{(warehouses as any[]).map(w => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="pricing" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.items_cost}</Label><Input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: Number(e.target.value) }))} /></div>
                <div><Label>{t.items_sale_price} 1</Label><Input type="number" value={form.sale_price_1} onChange={e => setForm(f => ({ ...f, sale_price_1: Number(e.target.value) }))} /></div>
                <div><Label>{t.items_sale_price} 2</Label><Input type="number" value={form.sale_price_2} onChange={e => setForm(f => ({ ...f, sale_price_2: Number(e.target.value) }))} /></div>
                <div><Label>{t.items_sale_price} 3</Label><Input type="number" value={form.sale_price_3} onChange={e => setForm(f => ({ ...f, sale_price_3: Number(e.target.value) }))} /></div>
                <div><Label>{language === 'ar' ? 'سعر الجملة' : 'Wholesale Price'}</Label><Input type="number" value={form.wholesale_price} onChange={e => setForm(f => ({ ...f, wholesale_price: Number(e.target.value) }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t.items_quantity}</Label><Input type="number" value={form.current_quantity} onChange={e => setForm(f => ({ ...f, current_quantity: Number(e.target.value) }))} /></div>
                <div><Label>{language === 'ar' ? 'الكمية الافتتاحية' : 'Opening Quantity'}</Label><Input type="number" value={form.opening_quantity} onChange={e => setForm(f => ({ ...f, opening_quantity: Number(e.target.value) }))} /></div>
                <div><Label>{language === 'ar' ? 'الحد الأدنى' : 'Min Quantity'}</Label><Input type="number" value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: Number(e.target.value) }))} /></div>
                <div><Label>{language === 'ar' ? 'الحد الأقصى' : 'Max Quantity'}</Label><Input type="number" value={form.max_quantity} onChange={e => setForm(f => ({ ...f, max_quantity: Number(e.target.value) }))} /></div>
                <div><Label>{language === 'ar' ? 'حد إعادة الطلب' : 'Reorder Level'}</Label><Input type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: Number(e.target.value) }))} /></div>
              </div>
            </TabsContent>
            <TabsContent value="extra" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{language === 'ar' ? 'نسبة العمولة %' : 'Commission Rate %'}</Label><Input type="number" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))} /></div>
                <div><Label>{language === 'ar' ? 'خصم الشراء %' : 'Purchase Discount %'}</Label><Input type="number" value={form.purchase_discount} onChange={e => setForm(f => ({ ...f, purchase_discount: Number(e.target.value) }))} /></div>
                <div><Label>{language === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              </div>
              <div><Label>{t.notes}</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>{editId ? t.tasks_update : t.add}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
