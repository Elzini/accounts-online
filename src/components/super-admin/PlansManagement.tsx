import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { fetchPlans, createPlan, updatePlan, deletePlan, Plan } from '@/services/saasAdmin';

const EMPTY_FORM = {
  name: '', name_en: '', description: '',
  price_monthly: 0, price_yearly: 0, currency: 'SAR',
  max_users: 5, max_invoices: 0, max_storage_mb: 500,
  is_active: true, is_trial: false, trial_days: 14, sort_order: 0,
};

export function PlansManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: fetchPlans,
  });

  const createMut = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('تم إنشاء الباقة');
      closeDialog();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Plan> }) => updatePlan(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('تم تحديث الباقة');
      closeDialog();
    },
    onError: () => toast.error('حدث خطأ'),
  });

  const deleteMut = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('تم حذف الباقة');
      setDeleteDialogOpen(false);
    },
    onError: () => toast.error('لا يمكن حذف الباقة - قد تكون مرتبطة باشتراكات'),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      name_en: plan.name_en || '',
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency,
      max_users: plan.max_users,
      max_invoices: plan.max_invoices || 0,
      max_storage_mb: plan.max_storage_mb,
      is_active: plan.is_active,
      is_trial: plan.is_trial,
      trial_days: plan.trial_days,
      sort_order: plan.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name) return toast.error('اسم الباقة مطلوب');
    const payload: any = { ...form, max_invoices: form.max_invoices || null };
    if (editingPlan) {
      updateMut.mutate({ id: editingPlan.id, updates: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6" /> إدارة الباقات</h2>
          <p className="text-muted-foreground">إنشاء وتعديل خطط الاشتراك</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> باقة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}>
            {plan.is_trial && (
              <Badge className="absolute top-3 left-3" variant="secondary">تجريبية</Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setDeletingPlan(plan); setDeleteDialogOpen(true); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center border-b pb-3">
                <p className="text-3xl font-bold text-primary">{plan.price_monthly.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{plan.currency} / شهرياً</p>
                <p className="text-xs text-muted-foreground mt-1">{plan.price_yearly.toLocaleString()} {plan.currency} / سنوياً</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">المستخدمين</span><span className="font-medium">{plan.max_users}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الفواتير</span><span className="font-medium">{plan.max_invoices || '∞'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">التخزين</span><span className="font-medium">{plan.max_storage_mb} MB</span></div>
                {plan.is_trial && <div className="flex justify-between"><span className="text-muted-foreground">فترة التجربة</span><span className="font-medium">{plan.trial_days} يوم</span></div>}
              </div>
              <Badge variant={plan.is_active ? 'default' : 'secondary'}>{plan.is_active ? 'مفعلة' : 'معطلة'}</Badge>
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              لم يتم إنشاء أي باقات بعد. أضف أول باقة لتبدأ.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'تعديل الباقة' : 'باقة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الاسم بالعربي *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>الاسم بالإنجليزي</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
            </div>
            <div><Label>الوصف</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>السعر الشهري</Label><Input type="number" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: +e.target.value }))} /></div>
              <div><Label>السعر السنوي</Label><Input type="number" value={form.price_yearly} onChange={e => setForm(f => ({ ...f, price_yearly: +e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>المستخدمين</Label><Input type="number" value={form.max_users} onChange={e => setForm(f => ({ ...f, max_users: +e.target.value }))} /></div>
              <div><Label>حد الفواتير</Label><Input type="number" value={form.max_invoices} onChange={e => setForm(f => ({ ...f, max_invoices: +e.target.value }))} placeholder="0 = غير محدود" /></div>
              <div><Label>التخزين (MB)</Label><Input type="number" value={form.max_storage_mb} onChange={e => setForm(f => ({ ...f, max_storage_mb: +e.target.value }))} /></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>مفعلة</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_trial} onCheckedChange={v => setForm(f => ({ ...f, is_trial: v }))} /><Label>تجريبية</Label></div>
            </div>
            {form.is_trial && <div><Label>أيام التجربة</Label><Input type="number" value={form.trial_days} onChange={e => setForm(f => ({ ...f, trial_days: +e.target.value }))} /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
            <Button onClick={handleSave}>{editingPlan ? 'تحديث' : 'إنشاء'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الباقة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف باقة "{deletingPlan?.name}"؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingPlan && deleteMut.mutate(deletingPlan.id)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
