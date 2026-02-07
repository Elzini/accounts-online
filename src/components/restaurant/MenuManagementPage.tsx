import { useState } from 'react';
import { Plus, Search, Edit, Trash2, UtensilsCrossed, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  description: string | null;
  is_available: boolean;
  company_id: string;
  created_at: string;
}

const categories = [
  'مقبلات', 'أطباق رئيسية', 'مشروبات ساخنة', 'مشروبات باردة',
  'حلويات', 'سلطات', 'شوربات', 'وجبات خفيفة', 'أخرى'
];

export function MenuManagementPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'أطباق رئيسية', price: '', cost: '', description: '' });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['menu-items', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('restaurant_menu_items')
        .select('*')
        .eq('company_id', companyId!)
        .order('category', { ascending: true });
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!companyId,
  });

  const createItem = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from('restaurant_menu_items').insert({
        company_id: companyId!,
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        cost: parseFloat(form.cost) || 0,
        description: form.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setIsDialogOpen(false);
      setForm({ name: '', category: 'أطباق رئيسية', price: '', cost: '', description: '' });
      toast.success('تم إضافة الصنف بنجاح');
    },
    onError: (e) => toast.error('خطأ: ' + (e as Error).message),
  });

  const filtered = items.filter(i => i.name.includes(search) || i.category.includes(search));
  const totalProfit = items.reduce((s, i) => s + (i.price - i.cost), 0);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6" />
            قائمة الطعام
          </h1>
          <p className="text-muted-foreground mt-1">{items.length} صنف - متوسط هامش الربح: {items.length ? (totalProfit / items.length).toFixed(0) : 0} ر.س</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />إضافة صنف</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة صنف جديد</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم الصنف *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: برجر كلاسيك" />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>سعر البيع *</Label>
                  <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>التكلفة</Label>
                  <Input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف الصنف..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
              <Button onClick={() => createItem.mutate()} disabled={!form.name || !form.price || createItem.isPending}>
                {createItem.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}إضافة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث في القائمة..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>سعر البيع</TableHead>
                <TableHead>التكلفة</TableHead>
                <TableHead>الربح</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                  <TableCell>{item.price.toLocaleString()} ر.س</TableCell>
                  <TableCell>{item.cost.toLocaleString()} ر.س</TableCell>
                  <TableCell className="font-medium">{(item.price - item.cost).toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <Badge variant={item.is_available ? 'secondary' : 'destructive'}>
                      {item.is_available ? 'متاح' : 'غير متاح'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد أصناف</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
