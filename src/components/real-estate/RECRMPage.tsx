import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Phone, TrendingUp, Target, Calendar, MessageSquare } from 'lucide-react';
import { useRELeads, useSaveRELead, useDeleteRELead, useREFollowUps, useSaveREFollowUp, useRECRMStats } from '@/hooks/useRealEstateCRM';
import { useREProjects } from '@/hooks/useRealEstate';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'جديد', color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'تم التواصل', color: 'bg-yellow-100 text-yellow-800' },
  qualified: { label: 'مؤهل', color: 'bg-purple-100 text-purple-800' },
  negotiation: { label: 'تفاوض', color: 'bg-orange-100 text-orange-800' },
  converted: { label: 'تم التحويل', color: 'bg-green-100 text-green-800' },
  lost: { label: 'خسارة', color: 'bg-red-100 text-red-800' },
};

const SOURCE_MAP: Record<string, string> = {
  walk_in: 'زيارة مباشرة',
  phone: 'اتصال هاتفي',
  website: 'الموقع الإلكتروني',
  social_media: 'وسائل التواصل',
  referral: 'توصية',
  exhibition: 'معرض',
  other: 'أخرى',
};

export function RECRMPage() {
  const { data: leads, isLoading } = useRELeads();
  const { data: projects } = useREProjects();
  const { data: stats } = useRECRMStats();
  const saveLead = useSaveRELead();
  const deleteLead = useDeleteRELead();
  const [showForm, setShowForm] = useState(false);
  const [editLead, setEditLead] = useState<any>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const [form, setForm] = useState({
    name: '', phone: '', email: '', source: 'walk_in', status: 'new',
    interest_project_id: '', interest_unit_type: '', budget_min: 0, budget_max: 0,
    assigned_to: '', notes: '',
  });

  const openNew = () => { setEditLead(null); setForm({ name: '', phone: '', email: '', source: 'walk_in', status: 'new', interest_project_id: '', interest_unit_type: '', budget_min: 0, budget_max: 0, assigned_to: '', notes: '' }); setShowForm(true); };
  const openEdit = (l: any) => { setEditLead(l); setForm({ name: l.name, phone: l.phone || '', email: l.email || '', source: l.source, status: l.status, interest_project_id: l.interest_project_id || '', interest_unit_type: l.interest_unit_type || '', budget_min: l.budget_min || 0, budget_max: l.budget_max || 0, assigned_to: l.assigned_to || '', notes: l.notes || '' }); setShowForm(true); };

  const handleSave = () => {
    const payload: any = { ...form };
    if (!payload.interest_project_id) delete payload.interest_project_id;
    if (editLead) payload.id = editLead.id;
    saveLead.mutate(payload, { onSuccess: () => setShowForm(false) });
  };

  const filtered = (leads || []).filter(l => filter === 'all' || l.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">نظام CRM العقاري</h2>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" />عميل محتمل جديد</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card><CardContent className="p-4 text-center"><Users className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{stats.totalLeads}</div><div className="text-xs text-muted-foreground">إجمالي العملاء</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="w-6 h-6 mx-auto mb-1 rounded-full bg-blue-500" /><div className="text-2xl font-bold">{stats.newLeads}</div><div className="text-xs text-muted-foreground">جدد</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Phone className="w-6 h-6 mx-auto mb-1 text-yellow-500" /><div className="text-2xl font-bold">{stats.contactedLeads}</div><div className="text-xs text-muted-foreground">تم التواصل</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><Target className="w-6 h-6 mx-auto mb-1 text-purple-500" /><div className="text-2xl font-bold">{stats.qualifiedLeads}</div><div className="text-xs text-muted-foreground">مؤهلين</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><TrendingUp className="w-6 h-6 mx-auto mb-1 text-green-500" /><div className="text-2xl font-bold">{stats.convertedLeads}</div><div className="text-xs text-muted-foreground">محولين</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{stats.conversionRate}%</div><div className="text-xs text-muted-foreground">معدل التحويل</div></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">قائمة العملاء</TabsTrigger>
          <TabsTrigger value="pipeline">خط الأنابيب</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>العملاء المحتملين</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>الاسم</TableHead><TableHead>الهاتف</TableHead><TableHead>المصدر</TableHead>
                  <TableHead>المشروع المهتم به</TableHead><TableHead>الحالة</TableHead><TableHead>الإجراءات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.map((l: any) => (
                    <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelectedLeadId(l.id)}>
                      <TableCell className="font-medium">{l.name}</TableCell>
                      <TableCell>{l.phone}</TableCell>
                      <TableCell>{SOURCE_MAP[l.source] || l.source}</TableCell>
                      <TableCell>{l.re_projects?.name || '-'}</TableCell>
                      <TableCell><Badge className={STATUS_MAP[l.status]?.color}>{STATUS_MAP[l.status]?.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); openEdit(l); }}>تعديل</Button>
                          <Button size="sm" variant="destructive" onClick={e => { e.stopPropagation(); deleteLead.mutate(l.id); }}>حذف</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(STATUS_MAP).map(([status, meta]) => {
              const items = (leads || []).filter((l: any) => l.status === status);
              return (
                <Card key={status}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{meta.label} ({items.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((l: any) => (
                      <div key={l.id} className="p-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80" onClick={() => openEdit(l)}>
                        <div className="font-medium">{l.name}</div>
                        <div className="text-xs text-muted-foreground">{l.phone}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Follow-ups for selected lead */}
      {selectedLeadId && <FollowUpSection leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />}

      {/* Lead Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editLead ? 'تعديل' : 'إضافة'} عميل محتمل</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="الاسم *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="الهاتف" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="البريد" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(SOURCE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.interest_project_id || 'none'} onValueChange={v => setForm({ ...form, interest_project_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder="المشروع المهتم به" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بدون</SelectItem>
                {(projects || []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="الميزانية من" type="number" value={form.budget_min} onChange={e => setForm({ ...form, budget_min: +e.target.value })} />
            <Input placeholder="الميزانية إلى" type="number" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: +e.target.value })} />
            <Input placeholder="المسؤول" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} className="col-span-2" />
            <Textarea placeholder="ملاحظات" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="col-span-2" />
          </div>
          <Button onClick={handleSave} disabled={!form.name || saveLead.isPending} className="w-full mt-4">حفظ</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FollowUpSection({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const { data: followUps } = useREFollowUps(leadId);
  const saveFollowUp = useSaveREFollowUp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ follow_up_date: new Date().toISOString().slice(0, 16), follow_up_type: 'call', notes: '', outcome: '', next_action: '', next_action_date: '' });

  const handleSave = () => {
    saveFollowUp.mutate({ ...form, lead_id: leadId }, { onSuccess: () => setShowForm(false) });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" />سجل المتابعات</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 ml-1" />متابعة جديدة</Button>
          <Button size="sm" variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <div className="grid grid-cols-2 gap-3 mb-4 p-4 border rounded-lg">
            <Input type="datetime-local" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
            <Select value={form.follow_up_type} onValueChange={v => setForm({ ...form, follow_up_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="call">اتصال</SelectItem>
                <SelectItem value="meeting">اجتماع</SelectItem>
                <SelectItem value="email">بريد</SelectItem>
                <SelectItem value="visit">زيارة</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="ملاحظات" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="col-span-2" />
            <Input placeholder="النتيجة" value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} />
            <Input placeholder="الإجراء التالي" value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} />
            <Button onClick={handleSave} disabled={saveFollowUp.isPending} className="col-span-2">حفظ المتابعة</Button>
          </div>
        )}
        <div className="space-y-3">
          {(followUps || []).map((fu: any) => (
            <div key={fu.id} className="flex gap-3 p-3 bg-muted rounded-lg">
              <Calendar className="w-5 h-5 text-primary mt-1" />
              <div>
                <div className="text-sm font-medium">{new Date(fu.follow_up_date).toLocaleDateString('ar-SA')} - {fu.follow_up_type === 'call' ? 'اتصال' : fu.follow_up_type === 'meeting' ? 'اجتماع' : fu.follow_up_type}</div>
                {fu.notes && <div className="text-sm text-muted-foreground">{fu.notes}</div>}
                {fu.outcome && <div className="text-sm"><span className="font-medium">النتيجة:</span> {fu.outcome}</div>}
                {fu.next_action && <div className="text-sm text-primary"><span className="font-medium">الإجراء التالي:</span> {fu.next_action}</div>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
