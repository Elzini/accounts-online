import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Home, Search, Grid3X3, List, Filter } from 'lucide-react';
import { useREUnits, useSaveREUnit, useREProjects, useREDashboardStats } from '@/hooks/useRealEstate';

const UNIT_STATUS: Record<string, { label: string; color: string; bgClass: string }> = {
  available: { label: 'متاحة', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', bgClass: 'bg-green-500' },
  reserved: { label: 'محجوزة', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', bgClass: 'bg-amber-500' },
  sold: { label: 'مباعة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', bgClass: 'bg-blue-500' },
  rented: { label: 'مؤجرة', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', bgClass: 'bg-purple-500' },
  under_construction: { label: 'قيد الإنشاء', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', bgClass: 'bg-gray-500' },
};

const UNIT_TYPE: Record<string, string> = {
  apartment: 'شقة', villa: 'فيلا', duplex: 'دوبلكس', studio: 'استديو',
  shop: 'محل تجاري', office: 'مكتب', land: 'أرض',
};

const emptyUnit = {
  unit_number: '', unit_type: 'apartment', floor_number: '', building_number: '',
  area: '', rooms: '', bathrooms: '', price: '', cost: '', status: 'available',
  project_id: '', payment_plan: 'cash', sakani_eligible: false, notes: '',
};

export function REUnitsPage() {
  const { data: projects = [] } = useREProjects();
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { data: units = [], isLoading } = useREUnits(selectedProject === 'all' ? null : selectedProject);
  const { data: stats } = useREDashboardStats();
  const saveUnit = useSaveREUnit();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyUnit);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const openNew = () => {
    setForm({ ...emptyUnit, project_id: selectedProject !== 'all' ? selectedProject : '' });
    setDialogOpen(true);
  };
  const openEdit = (u: any) => { setForm(u); setDialogOpen(true); };
  const handleSave = () => {
    if (!form.unit_number || !form.project_id) return;
    const payload = { ...form };
    delete payload.re_projects;
    delete payload.customers;
    saveUnit.mutate(payload, { onSuccess: () => setDialogOpen(false) });
  };

  const filtered = units.filter((u: any) => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search && !u.unit_number?.includes(search) && !u.building_number?.includes(search)) return false;
    return true;
  });

  const fmt = (n: number) => new Intl.NumberFormat('ar-SA').format(n);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(UNIT_STATUS).map(([key, { label, bgClass }]) => {
          const count = units.filter((u: any) => u.status === key).length;
          return (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${bgClass}`} />
                <div>
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Home className="w-6 h-6 text-primary" />
          الوحدات العقارية
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-48"><SelectValue placeholder="كل المشاريع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المشاريع</SelectItem>
              {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 w-40" />
          </div>
          <div className="flex border rounded-md">
            <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}><Grid3X3 className="w-4 h-4" /></Button>
            <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('table')}><List className="w-4 h-4" /></Button>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="w-4 h-4" />
            وحدة جديدة
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Home className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>لا توجد وحدات</p>
        </CardContent></Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((u: any) => {
            const st = UNIT_STATUS[u.status] || UNIT_STATUS.available;
            return (
              <Card key={u.id} className="hover:shadow-md cursor-pointer transition-all" onClick={() => openEdit(u)}>
                <CardContent className="p-3 text-center space-y-2">
                  <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-white font-bold ${st.bgClass}`}>
                    {u.unit_number}
                  </div>
                  <Badge className={st.color} variant="secondary">{st.label}</Badge>
                  <div className="text-xs text-muted-foreground">
                    <p>{UNIT_TYPE[u.unit_type] || u.unit_type}</p>
                    {u.area && <p>{u.area} م²</p>}
                    {u.price > 0 && <p className="font-semibold text-foreground">{fmt(Number(u.price))} ر.س</p>}
                  </div>
                  {u.customers?.name && <p className="text-xs text-primary truncate">{u.customers.name}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الوحدة</TableHead>
                <TableHead>المشروع</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المساحة</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>العميل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u: any) => (
                <TableRow key={u.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(u)}>
                  <TableCell className="font-medium">{u.unit_number}</TableCell>
                  <TableCell>{u.re_projects?.name}</TableCell>
                  <TableCell>{UNIT_TYPE[u.unit_type] || u.unit_type}</TableCell>
                  <TableCell>{u.area ? `${u.area} م²` : '-'}</TableCell>
                  <TableCell>{u.price > 0 ? fmt(Number(u.price)) : '-'}</TableCell>
                  <TableCell><Badge className={UNIT_STATUS[u.status]?.color}>{UNIT_STATUS[u.status]?.label}</Badge></TableCell>
                  <TableCell>{u.customers?.name || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? 'تعديل الوحدة' : 'وحدة جديدة'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المشروع *</Label>
              <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم الوحدة *</Label>
              <Input value={form.unit_number} onChange={e => setForm({ ...form, unit_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.unit_type} onValueChange={v => setForm({ ...form, unit_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIT_TYPE).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Input type="number" value={form.floor_number || ''} onChange={e => setForm({ ...form, floor_number: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المبنى</Label>
              <Input value={form.building_number || ''} onChange={e => setForm({ ...form, building_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المساحة (م²)</Label>
              <Input type="number" value={form.area || ''} onChange={e => setForm({ ...form, area: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>الغرف</Label>
              <Input type="number" value={form.rooms || ''} onChange={e => setForm({ ...form, rooms: +e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input type="number" value={form.price || ''} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>التكلفة</Label>
              <Input type="number" value={form.cost || ''} onChange={e => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={form.payment_plan || 'cash'} onValueChange={v => setForm({ ...form, payment_plan: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="installments">أقساط</SelectItem>
                  <SelectItem value="bank_finance">تمويل بنكي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم العقد</Label>
              <Input value={form.contract_number || ''} onChange={e => setForm({ ...form, contract_number: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saveUnit.isPending}>{saveUnit.isPending ? 'جاري الحفظ...' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
