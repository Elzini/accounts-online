import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, Users, CheckCircle, Star, Trash2 } from 'lucide-react';
import { useSurveys, useAddSurvey, useDeleteSurvey } from '@/hooks/useModuleData';

export function SurveysPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newSurvey, setNewSurvey] = useState({ title: '', description: '', survey_type: 'customer' });

  const { data: surveys = [], isLoading } = useSurveys();
  const addSurvey = useAddSurvey();
  const deleteSurvey = useDeleteSurvey();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">الاستبيانات</h1><p className="text-sm text-muted-foreground">استطلاعات رأي العملاء والموظفين</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />استبيان جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardList className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{surveys.length}</p><p className="text-xs text-muted-foreground">استبيانات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{surveys.reduce((s: number, sv: any) => s + (sv.responses_count || 0), 0)}</p><p className="text-xs text-muted-foreground">إجابات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Star className="w-8 h-8 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{surveys.filter((s: any) => s.status === 'active' || s.status === 'draft').length}</p><p className="text-xs text-muted-foreground">نشطة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{surveys.filter((s: any) => s.status === 'closed').length}</p><p className="text-xs text-muted-foreground">مغلقة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        surveys.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد استبيانات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>العنوان</TableHead><TableHead>النوع</TableHead><TableHead>الإجابات</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{surveys.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.title}</TableCell>
              <TableCell><Badge variant="outline">{s.survey_type === 'customer' ? 'عملاء' : s.survey_type === 'employee' ? 'موظفين' : s.survey_type}</Badge></TableCell>
              <TableCell>{s.responses_count || 0}</TableCell>
              <TableCell><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status === 'active' ? 'نشط' : s.status === 'draft' ? 'مسودة' : 'مغلق'}</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSurvey.mutate(s.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>استبيان جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>العنوان *</Label><Input value={newSurvey.title} onChange={e => setNewSurvey(p => ({ ...p, title: e.target.value }))} /></div>
            <div><Label>النوع</Label><Select value={newSurvey.survey_type} onValueChange={v => setNewSurvey(p => ({ ...p, survey_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">عملاء</SelectItem><SelectItem value="employee">موظفين</SelectItem><SelectItem value="product">منتج</SelectItem></SelectContent></Select></div>
            <div><Label>الوصف</Label><Textarea value={newSurvey.description} onChange={e => setNewSurvey(p => ({ ...p, description: e.target.value }))} /></div>
            <Button onClick={() => { if (!newSurvey.title) return; addSurvey.mutate(newSurvey, { onSuccess: () => { setShowAdd(false); setNewSurvey({ title: '', description: '', survey_type: 'customer' }); } }); }} disabled={addSurvey.isPending} className="w-full">{addSurvey.isPending ? 'جاري...' : 'إضافة الاستبيان'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
