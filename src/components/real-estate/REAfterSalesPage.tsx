import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Wrench, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useREMaintenanceRequests, useSaveREMaintenance } from '@/hooks/useRealEstateCRM';
import { useREUnits } from '@/hooks/useRealEstate';

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'مفتوح', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  in_progress: { label: 'قيد التنفيذ', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  closed: { label: 'مغلق', color: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفض', color: 'bg-blue-100 text-blue-800' },
  medium: { label: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'عالي', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'عاجل', color: 'bg-red-100 text-red-800' },
};

export function REAfterSalesPage() {
  const { data: requests, isLoading } = useREMaintenanceRequests();
  const { data: units } = useREUnits();
  const saveMaintenance = useSaveREMaintenance();
  const [showForm, setShowForm] = useState(false);
  const [editReq, setEditReq] = useState<any>(null);
  const [form, setForm] = useState({
    unit_id: '', category: 'general', priority: 'medium', status: 'open',
    description: '', resolution: '', assigned_to: '', warranty_covered: false,
    estimated_cost: 0, actual_cost: 0,
  });

  const openNew = () => {
    setEditReq(null);
    setForm({ unit_id: '', category: 'general', priority: 'medium', status: 'open', description: '', resolution: '', assigned_to: '', warranty_covered: false, estimated_cost: 0, actual_cost: 0 });
    setShowForm(true);
  };

  const openEdit = (r: any) => {
    setEditReq(r);
    setForm({ unit_id: r.unit_id, category: r.category, priority: r.priority, status: r.status, description: r.description, resolution: r.resolution || '', assigned_to: r.assigned_to || '', warranty_covered: r.warranty_covered, estimated_cost: r.estimated_cost || 0, actual_cost: r.actual_cost || 0 });
    setShowForm(true);
  };

  const handleSave = () => {
    const payload: any = { ...form };
    if (editReq) payload.id = editReq.id;
    if (form.status === 'resolved' && !editReq?.resolved_at) payload.resolved_at = new Date().toISOString();
    saveMaintenance.mutate(payload, { onSuccess: () => setShowForm(false) });
  };

  const openCount = (requests || []).filter((r: any) => r.status === 'open').length;
  const inProgressCount = (requests || []).filter((r: any) => r.status === 'in_progress').length;
  const resolvedCount = (requests || []).filter((r: any) => r.status === 'resolved' || r.status === 'closed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">إدارة ما بعد البيع</h2>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" />طلب صيانة جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Wrench className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{(requests || []).length}</div><div className="text-xs text-muted-foreground">إجمالي الطلبات</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><AlertTriangle className="w-6 h-6 mx-auto mb-1 text-red-500" /><div className="text-2xl font-bold">{openCount}</div><div className="text-xs text-muted-foreground">مفتوحة</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="w-6 h-6 mx-auto mb-1 text-yellow-500" /><div className="text-2xl font-bold">{inProgressCount}</div><div className="text-xs text-muted-foreground">قيد التنفيذ</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-500" /><div className="text-2xl font-bold">{resolvedCount}</div><div className="text-xs text-muted-foreground">تم الحل</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>الوحدة</TableHead><TableHead>المشروع</TableHead><TableHead>الوصف</TableHead>
              <TableHead>الأولوية</TableHead><TableHead>الحالة</TableHead><TableHead>الضمان</TableHead>
              <TableHead>التاريخ</TableHead><TableHead>إجراءات</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {(requests || []).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.re_units?.unit_number}</TableCell>
                  <TableCell>{r.re_units?.re_projects?.name || '-'}</TableCell>
                  <TableCell className="max-w-48 truncate">{r.description}</TableCell>
                  <TableCell><Badge className={PRIORITY_MAP[r.priority]?.color}>{PRIORITY_MAP[r.priority]?.label}</Badge></TableCell>
                  <TableCell><Badge className={STATUS_MAP[r.status]?.color}>{STATUS_MAP[r.status]?.label}</Badge></TableCell>
                  <TableCell>{r.warranty_covered ? <Badge className="bg-green-100 text-green-800">مغطى</Badge> : <Badge variant="outline">غير مغطى</Badge>}</TableCell>
                  <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => openEdit(r)}>تعديل</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editReq ? 'تعديل' : 'إضافة'} طلب صيانة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Select value={form.unit_id} onValueChange={v => setForm({ ...form, unit_id: v })}>
              <SelectTrigger className="col-span-2"><SelectValue placeholder="اختر الوحدة *" /></SelectTrigger>
              <SelectContent>{(units || []).filter((u: any) => u.status === 'sold').map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number} - {u.re_projects?.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">عام</SelectItem>
                <SelectItem value="plumbing">سباكة</SelectItem>
                <SelectItem value="electrical">كهرباء</SelectItem>
                <SelectItem value="structural">هيكلي</SelectItem>
                <SelectItem value="finishing">تشطيبات</SelectItem>
                <SelectItem value="hvac">تكييف</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(PRIORITY_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="المسؤول" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
            <Textarea placeholder="وصف المشكلة *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="col-span-2" />
            <Textarea placeholder="الحل" value={form.resolution} onChange={e => setForm({ ...form, resolution: e.target.value })} className="col-span-2" />
            <Input type="number" placeholder="التكلفة المقدرة" value={form.estimated_cost} onChange={e => setForm({ ...form, estimated_cost: +e.target.value })} />
            <Input type="number" placeholder="التكلفة الفعلية" value={form.actual_cost} onChange={e => setForm({ ...form, actual_cost: +e.target.value })} />
            <label className="flex items-center gap-2 col-span-2">
              <input type="checkbox" checked={form.warranty_covered} onChange={e => setForm({ ...form, warranty_covered: e.target.checked })} />
              مغطى بالضمان
            </label>
          </div>
          <Button onClick={handleSave} disabled={!form.unit_id || !form.description || saveMaintenance.isPending} className="w-full mt-4">حفظ</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
