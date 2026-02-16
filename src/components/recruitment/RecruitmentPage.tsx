import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, Briefcase, Plus, UserCheck, Clock, FileText, MapPin, Star, Trash2 } from 'lucide-react';
import { useRecruitmentJobs, useAddRecruitmentJob, useDeleteRecruitmentJob, useRecruitmentCandidates, useAddRecruitmentCandidate, useUpdateRecruitmentCandidate, useDeleteRecruitmentCandidate } from '@/hooks/useModuleData';

const stageColors: Record<string, string> = { new: 'bg-blue-100 text-blue-800', screening: 'bg-yellow-100 text-yellow-800', interview: 'bg-purple-100 text-purple-800', offer: 'bg-green-100 text-green-800', hired: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800' };
const stageLabels: Record<string, string> = { new: 'جديد', screening: 'فرز', interview: 'مقابلة', offer: 'عرض وظيفي', hired: 'تم التوظيف', rejected: 'مرفوض' };

export function RecruitmentPage() {
  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', department: '', location: '', employment_type: 'full_time', description: '' });
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', job_id: '', source: '', notes: '' });

  const { data: jobs = [], isLoading: loadingJobs } = useRecruitmentJobs();
  const { data: candidates = [], isLoading: loadingCandidates } = useRecruitmentCandidates();
  const addJob = useAddRecruitmentJob();
  const deleteJob = useDeleteRecruitmentJob();
  const addCandidate = useAddRecruitmentCandidate();
  const updateCandidate = useUpdateRecruitmentCandidate();
  const deleteCandidate = useDeleteRecruitmentCandidate();

  const handleAddJob = () => {
    if (!newJob.title) return;
    addJob.mutate(newJob, { onSuccess: () => { setShowAddJob(false); setNewJob({ title: '', department: '', location: '', employment_type: 'full_time', description: '' }); } });
  };

  const handleAddCandidate = () => {
    if (!newCandidate.name) return;
    addCandidate.mutate({ ...newCandidate, job_id: newCandidate.job_id || null }, { onSuccess: () => { setShowAddCandidate(false); setNewCandidate({ name: '', email: '', phone: '', job_id: '', source: '', notes: '' }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">التوظيف</h1><p className="text-sm text-muted-foreground">إدارة الوظائف الشاغرة وتتبع المرشحين</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Briefcase className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{jobs.filter((j: any) => j.status === 'open').length}</p><p className="text-xs text-muted-foreground">وظائف مفتوحة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{candidates.length}</p><p className="text-xs text-muted-foreground">إجمالي المرشحين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{candidates.filter((c: any) => c.stage === 'interview').length}</p><p className="text-xs text-muted-foreground">مقابلات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><UserCheck className="w-8 h-8 mx-auto text-emerald-500 mb-1" /><p className="text-2xl font-bold">{candidates.filter((c: any) => c.stage === 'hired').length}</p><p className="text-xs text-muted-foreground">تم توظيفهم</p></CardContent></Card>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList><TabsTrigger value="pipeline">خط التوظيف</TabsTrigger><TabsTrigger value="jobs">الوظائف</TabsTrigger><TabsTrigger value="candidates">المرشحون</TabsTrigger></TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['new', 'screening', 'interview', 'offer', 'hired'].map(stage => (
              <Card key={stage}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">{stageLabels[stage]}<Badge variant="secondary">{candidates.filter((c: any) => c.stage === stage).length}</Badge></CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {candidates.filter((c: any) => c.stage === stage).map((c: any) => (
                    <Card key={c.id} className="p-2 cursor-pointer hover:shadow-md transition-shadow">
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                      <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= (c.rating||0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}</div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="flex justify-end mb-4"><Button className="gap-1" onClick={() => setShowAddJob(true)}><Plus className="w-4 h-4" />إضافة وظيفة</Button></div>
          <Card><CardContent className="pt-4">
            {loadingJobs ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
            jobs.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد وظائف. أضف وظيفة جديدة.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>المسمى</TableHead><TableHead>القسم</TableHead><TableHead>الموقع</TableHead><TableHead>النوع</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>{jobs.map((j: any) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell>{j.department || '-'}</TableCell>
                  <TableCell className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location || '-'}</TableCell>
                  <TableCell>{j.employment_type === 'full_time' ? 'دوام كامل' : 'دوام جزئي'}</TableCell>
                  <TableCell><Badge variant={j.status === 'open' ? 'default' : 'secondary'}>{j.status === 'open' ? 'مفتوحة' : 'مغلقة'}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteJob.mutate(j.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="candidates" className="mt-4">
          <div className="flex justify-end mb-4"><Button className="gap-1" onClick={() => setShowAddCandidate(true)}><Plus className="w-4 h-4" />إضافة مرشح</Button></div>
          <Card><CardContent className="pt-4">
            {loadingCandidates ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
            candidates.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا يوجد مرشحون.</p> :
            <Table>
              <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>البريد</TableHead><TableHead>الهاتف</TableHead><TableHead>المرحلة</TableHead><TableHead>التقييم</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>{candidates.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.email || '-'}</TableCell>
                  <TableCell dir="ltr">{c.phone || '-'}</TableCell>
                  <TableCell>
                    <Select value={c.stage} onValueChange={v => updateCandidate.mutate({ id: c.id, stage: v })}>
                      <SelectTrigger className="w-28 h-7"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(stageLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 cursor-pointer ${s <= (c.rating||0) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} onClick={() => updateCandidate.mutate({ id: c.id, rating: s })} />)}</div></TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCandidate.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
        <DialogContent><DialogHeader><DialogTitle>إضافة وظيفة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>المسمى الوظيفي *</Label><Input value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>القسم</Label><Input value={newJob.department} onChange={e => setNewJob(p => ({ ...p, department: e.target.value }))} /></div>
              <div><Label>الموقع</Label><Input value={newJob.location} onChange={e => setNewJob(p => ({ ...p, location: e.target.value }))} /></div>
            </div>
            <div><Label>الوصف</Label><Textarea value={newJob.description} onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))} /></div>
            <Button onClick={handleAddJob} disabled={addJob.isPending} className="w-full">{addJob.isPending ? 'جاري...' : 'إضافة الوظيفة'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddCandidate} onOpenChange={setShowAddCandidate}>
        <DialogContent><DialogHeader><DialogTitle>إضافة مرشح</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم *</Label><Input value={newCandidate.name} onChange={e => setNewCandidate(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>البريد</Label><Input value={newCandidate.email} onChange={e => setNewCandidate(p => ({ ...p, email: e.target.value }))} /></div>
              <div><Label>الهاتف</Label><Input value={newCandidate.phone} onChange={e => setNewCandidate(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div><Label>الوظيفة</Label>
              <Select value={newCandidate.job_id} onValueChange={v => setNewCandidate(p => ({ ...p, job_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الوظيفة" /></SelectTrigger>
                <SelectContent>{jobs.map((j: any) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>المصدر</Label><Input value={newCandidate.source} onChange={e => setNewCandidate(p => ({ ...p, source: e.target.value }))} placeholder="LinkedIn, موقع الشركة..." /></div>
            <Button onClick={handleAddCandidate} disabled={addCandidate.isPending} className="w-full">{addCandidate.isPending ? 'جاري...' : 'إضافة المرشح'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
