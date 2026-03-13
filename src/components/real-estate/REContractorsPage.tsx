import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, HardHat, Search, Star, Phone, Mail, FileText, Receipt } from 'lucide-react';
import { useREContractors, useSaveREContractor, useREWorkOrders, useSaveREWorkOrder, useREProgressBillings, useSaveREBilling, useREProjects, useREProjectPhases } from '@/hooks/useRealEstate';

const SPECIALTY: Record<string, string> = {
  general: 'مقاول عام', electrical: 'كهرباء', plumbing: 'سباكة',
  hvac: 'تكييف', finishing: 'تشطيبات', landscaping: 'تنسيق حدائق',
  structural: 'هيكل إنشائي', waterproofing: 'عزل',
};

const emptyContractor = {
  name: '', phone: '', email: '', specialty: 'general', license_number: '',
  tax_number: '', bank_name: '', iban: '', rating: 3, address: '', notes: '',
};

const emptyWO = {
  project_id: '', contractor_id: '', phase_id: '', title: '', description: '',
  work_type: '', contract_amount: '', retention_percentage: 10, status: 'draft',
  start_date: '', end_date: '',
};

const emptyBilling = {
  work_order_id: '', project_id: '', contractor_id: '', billing_date: new Date().toISOString().split('T')[0],
  period_from: '', period_to: '', gross_amount: '', retention_amount: '',
  previous_payments: '', net_amount: '', vat_amount: '', completion_percentage: '',
  status: 'draft', notes: '',
};

export function REContractorsPage() {
  const { data: contractors = [], isLoading } = useREContractors();
  const { data: projects = [] } = useREProjects();
  const { data: workOrders = [] } = useREWorkOrders();
  const { data: billings = [] } = useREProgressBillings();
  const saveContractor = useSaveREContractor();
  const saveWO = useSaveREWorkOrder();
  const saveBilling = useSaveREBilling();

  const [activeTab, setActiveTab] = useState('contractors');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'contractor' | 'wo' | 'billing'>('contractor');
  const [form, setForm] = useState<any>(emptyContractor);
  const [search, setSearch] = useState('');

  const openNewContractor = () => { setDialogType('contractor'); setForm(emptyContractor); setDialogOpen(true); };
  const openNewWO = () => { setDialogType('wo'); setForm(emptyWO); setDialogOpen(true); };
  const openNewBilling = () => { setDialogType('billing'); setForm(emptyBilling); setDialogOpen(true); };
  const openEdit = (item: any, type: 'contractor' | 'wo' | 'billing') => {
    setDialogType(type); setForm(item); setDialogOpen(true);
  };

  const handleSave = () => {
    if (dialogType === 'contractor') {
      if (!form.name) return;
      saveContractor.mutate(form, { onSuccess: () => setDialogOpen(false) });
    } else if (dialogType === 'wo') {
      if (!form.title || !form.project_id || !form.contractor_id) return;
      const payload = { ...form };
      delete payload.re_contractors; delete payload.re_projects; delete payload.re_project_phases;
      if (!payload.phase_id) delete payload.phase_id;
      saveWO.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    } else {
      if (!form.work_order_id || !form.gross_amount) return;
      const payload = { ...form };
      delete payload.re_work_orders; delete payload.re_contractors; delete payload.re_projects;
      saveBilling.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('ar-SA').format(n);

  const WO_STATUS: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-800' },
    approved: { label: 'معتمد', color: 'bg-blue-100 text-blue-800' },
    in_progress: { label: 'قيد التنفيذ', color: 'bg-amber-100 text-amber-800' },
    completed: { label: 'مكتمل', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800' },
  };

  const BILLING_STATUS: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-800' },
    submitted: { label: 'مقدم', color: 'bg-blue-100 text-blue-800' },
    approved: { label: 'معتمد', color: 'bg-green-100 text-green-800' },
    paid: { label: 'مدفوع', color: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800' },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <HardHat className="w-6 h-6 text-primary" />
          المقاولين والمستخلصات
        </h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contractors" className="gap-1"><HardHat className="w-4 h-4" />المقاولين ({contractors.length})</TabsTrigger>
          <TabsTrigger value="work-orders" className="gap-1"><FileText className="w-4 h-4" />أوامر العمل ({workOrders.length})</TabsTrigger>
          <TabsTrigger value="billings" className="gap-1"><Receipt className="w-4 h-4" />المستخلصات ({billings.length})</TabsTrigger>
        </TabsList>

        {/* Contractors Tab */}
        <TabsContent value="contractors" className="space-y-4">
          <div className="flex justify-between">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9 w-48" />
            </div>
            <Button onClick={openNewContractor} className="gap-2"><Plus className="w-4 h-4" />مقاول جديد</Button>
          </div>
          {isLoading ? <div className="text-center py-8">جاري التحميل...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractors.filter((c: any) => !search || c.name?.includes(search)).map((c: any) => (
                <Card key={c.id} className="hover:shadow-md cursor-pointer" onClick={() => openEdit(c, 'contractor')}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-lg">{c.name}</p>
                        <p className="text-sm text-muted-foreground">{SPECIALTY[c.specialty] || c.specialty}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= (c.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />)}
                      </div>
                    </div>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                      {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                    </div>
                    <Badge variant={c.is_active ? 'default' : 'secondary'}>{c.is_active ? 'نشط' : 'غير نشط'}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="work-orders" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewWO} className="gap-2"><Plus className="w-4 h-4" />أمر عمل جديد</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم</TableHead>
                  <TableHead>العنوان</TableHead>
                  <TableHead>المشروع</TableHead>
                  <TableHead>المقاول</TableHead>
                  <TableHead>قيمة العقد</TableHead>
                  <TableHead>المحجوز %</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد أوامر عمل</TableCell></TableRow>
                ) : workOrders.map((wo: any) => (
                  <TableRow key={wo.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(wo, 'wo')}>
                    <TableCell>{wo.order_number || '-'}</TableCell>
                    <TableCell className="font-medium">{wo.title}</TableCell>
                    <TableCell>{wo.re_projects?.name}</TableCell>
                    <TableCell>{wo.re_contractors?.name}</TableCell>
                    <TableCell>{fmt(Number(wo.contract_amount || 0))}</TableCell>
                    <TableCell>{wo.retention_percentage}%</TableCell>
                    <TableCell><Badge className={WO_STATUS[wo.status]?.color}>{WO_STATUS[wo.status]?.label}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Billings Tab */}
        <TabsContent value="billings" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewBilling} className="gap-2"><Plus className="w-4 h-4" />مستخلص جديد</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم</TableHead>
                  <TableHead>أمر العمل</TableHead>
                  <TableHead>المقاول</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>المحجوز</TableHead>
                  <TableHead>الصافي</TableHead>
                  <TableHead>الإنجاز %</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billings.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد مستخلصات</TableCell></TableRow>
                ) : billings.map((b: any) => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEdit(b, 'billing')}>
                    <TableCell>{b.billing_number || '-'}</TableCell>
                    <TableCell>{b.re_work_orders?.title || b.re_work_orders?.order_number}</TableCell>
                    <TableCell>{b.re_contractors?.name}</TableCell>
                    <TableCell>{fmt(Number(b.gross_amount || 0))}</TableCell>
                    <TableCell className="text-amber-600">{fmt(Number(b.retention_amount || 0))}</TableCell>
                    <TableCell className="font-semibold">{fmt(Number(b.net_amount || 0))}</TableCell>
                    <TableCell>{b.completion_percentage}%</TableCell>
                    <TableCell><Badge className={BILLING_STATUS[b.status]?.color}>{BILLING_STATUS[b.status]?.label}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'contractor' ? (form.id ? 'تعديل مقاول' : 'مقاول جديد') :
               dialogType === 'wo' ? (form.id ? 'تعديل أمر عمل' : 'أمر عمل جديد') :
               (form.id ? 'تعديل مستخلص' : 'مستخلص جديد')}
            </DialogTitle>
          </DialogHeader>

          {dialogType === 'contractor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>التخصص</Label>
                <Select value={form.specialty} onValueChange={v => setForm({ ...form, specialty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SPECIALTY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>الجوال</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-2"><Label>البريد</Label><Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>رقم الرخصة</Label><Input value={form.license_number || ''} onChange={e => setForm({ ...form, license_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>الرقم الضريبي</Label><Input value={form.tax_number || ''} onChange={e => setForm({ ...form, tax_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>البنك</Label><Input value={form.bank_name || ''} onChange={e => setForm({ ...form, bank_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>IBAN</Label><Input value={form.iban || ''} onChange={e => setForm({ ...form, iban: e.target.value })} /></div>
              <div className="space-y-2"><Label>التقييم (1-5)</Label><Input type="number" min={1} max={5} value={form.rating || 3} onChange={e => setForm({ ...form, rating: +e.target.value })} /></div>
              <div className="space-y-2"><Label>العنوان</Label><Input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            </div>
          )}

          {dialogType === 'wo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>العنوان *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>رقم الأمر</Label><Input value={form.order_number || ''} onChange={e => setForm({ ...form, order_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>المشروع *</Label>
                <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>المقاول *</Label>
                <Select value={form.contractor_id} onValueChange={v => setForm({ ...form, contractor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>{contractors.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>قيمة العقد</Label><Input type="number" value={form.contract_amount || ''} onChange={e => setForm({ ...form, contract_amount: e.target.value })} /></div>
              <div className="space-y-2"><Label>نسبة المحجوز %</Label><Input type="number" value={form.retention_percentage} onChange={e => setForm({ ...form, retention_percentage: +e.target.value })} /></div>
              <div className="space-y-2"><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(WO_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>نوع العمل</Label><Input value={form.work_type || ''} onChange={e => setForm({ ...form, work_type: e.target.value })} /></div>
              <div className="space-y-2"><Label>تاريخ البدء</Label><Input type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>تاريخ الانتهاء</Label><Input type="date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              <div className="md:col-span-2 space-y-2"><Label>الوصف</Label><Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            </div>
          )}

          {dialogType === 'billing' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>أمر العمل *</Label>
                <Select value={form.work_order_id} onValueChange={v => {
                  const wo = workOrders.find((w: any) => w.id === v);
                  setForm({ ...form, work_order_id: v, project_id: wo?.project_id || '', contractor_id: wo?.contractor_id || '' });
                }}>
                  <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>{workOrders.map((wo: any) => <SelectItem key={wo.id} value={wo.id}>{wo.title} ({wo.re_contractors?.name})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>رقم المستخلص</Label><Input value={form.billing_number || ''} onChange={e => setForm({ ...form, billing_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>تاريخ المستخلص</Label><Input type="date" value={form.billing_date || ''} onChange={e => setForm({ ...form, billing_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>نسبة الإنجاز %</Label><Input type="number" value={form.completion_percentage || ''} onChange={e => setForm({ ...form, completion_percentage: +e.target.value })} /></div>
              <div className="space-y-2"><Label>المبلغ الإجمالي *</Label><Input type="number" value={form.gross_amount || ''} onChange={e => {
                const gross = +e.target.value;
                const ret = gross * 0.10;
                const net = gross - ret;
                const vat = net * 0.15;
                setForm({ ...form, gross_amount: e.target.value, retention_amount: ret, net_amount: net, vat_amount: vat, total_with_vat: net + vat });
              }} /></div>
              <div className="space-y-2"><Label>المحجوز</Label><Input type="number" value={form.retention_amount || ''} readOnly className="bg-muted" /></div>
              <div className="space-y-2"><Label>الصافي</Label><Input type="number" value={form.net_amount || ''} readOnly className="bg-muted" /></div>
              <div className="space-y-2"><Label>ضريبة القيمة المضافة</Label><Input type="number" value={form.vat_amount || ''} readOnly className="bg-muted" /></div>
              <div className="space-y-2"><Label>الحالة</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(BILLING_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>الفترة من</Label><Input type="date" value={form.period_from || ''} onChange={e => setForm({ ...form, period_from: e.target.value })} /></div>
              <div className="space-y-2"><Label>الفترة إلى</Label><Input type="date" value={form.period_to || ''} onChange={e => setForm({ ...form, period_to: e.target.value })} /></div>
              <div className="md:col-span-2 space-y-2"><Label>ملاحظات</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave} disabled={saveContractor.isPending || saveWO.isPending || saveBilling.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
