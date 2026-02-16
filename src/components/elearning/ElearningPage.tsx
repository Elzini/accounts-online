import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Plus, BookOpen, Users, Award, Clock, Trash2 } from 'lucide-react';
import { useElearningCourses, useAddElearningCourse, useDeleteElearningCourse } from '@/hooks/useModuleData';

export function ElearningPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', category: '', instructor_name: '', duration_hours: 0, price: 0, description: '' });

  const { data: courses = [], isLoading } = useElearningCourses();
  const addCourse = useAddElearningCourse();
  const deleteCourse = useDeleteElearningCourse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">التعلم الإلكتروني</h1><p className="text-sm text-muted-foreground">إنشاء وإدارة الدورات التدريبية</p></div>
        </div>
        <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />دورة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><BookOpen className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{courses.length}</p><p className="text-xs text-muted-foreground">دورات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{courses.reduce((s: number, c: any) => s + (c.enrolled_count || 0), 0)}</p><p className="text-xs text-muted-foreground">متدربين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Award className="w-8 h-8 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{courses.filter((c: any) => c.status === 'published').length}</p><p className="text-xs text-muted-foreground">منشورة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{courses.reduce((s: number, c: any) => s + (c.duration_hours || 0), 0)}</p><p className="text-xs text-muted-foreground">ساعة محتوى</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        {isLoading ? <p className="text-center py-8 text-muted-foreground">جاري التحميل...</p> :
        courses.length === 0 ? <p className="text-center py-8 text-muted-foreground">لا توجد دورات.</p> :
        <Table>
          <TableHeader><TableRow><TableHead>الدورة</TableHead><TableHead>الفئة</TableHead><TableHead>المدرب</TableHead><TableHead>المتدربين</TableHead><TableHead>الإتمام</TableHead><TableHead>المدة</TableHead><TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead></TableRow></TableHeader>
          <TableBody>{courses.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.title}</TableCell>
              <TableCell><Badge variant="outline">{c.category || '-'}</Badge></TableCell>
              <TableCell>{c.instructor_name || '-'}</TableCell>
              <TableCell>{c.enrolled_count || 0}</TableCell>
              <TableCell><div className="flex items-center gap-2 w-24"><Progress value={c.completion_rate || 0} className="h-2" /><span className="text-xs">{c.completion_rate || 0}%</span></div></TableCell>
              <TableCell>{c.duration_hours || 0}h</TableCell>
              <TableCell><Badge variant={c.status === 'published' ? 'default' : 'secondary'}>{c.status === 'published' ? 'منشور' : 'مسودة'}</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCourse.mutate(c.id)}><Trash2 className="w-4 h-4" /></Button></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>}
      </CardContent></Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>دورة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>عنوان الدورة *</Label><Input value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>الفئة</Label><Input value={newCourse.category} onChange={e => setNewCourse(p => ({ ...p, category: e.target.value }))} /></div>
              <div><Label>المدرب</Label><Input value={newCourse.instructor_name} onChange={e => setNewCourse(p => ({ ...p, instructor_name: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>المدة (ساعات)</Label><Input type="number" value={newCourse.duration_hours} onChange={e => setNewCourse(p => ({ ...p, duration_hours: Number(e.target.value) }))} /></div>
              <div><Label>السعر</Label><Input type="number" value={newCourse.price} onChange={e => setNewCourse(p => ({ ...p, price: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>الوصف</Label><Textarea value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} /></div>
            <Button onClick={() => { if (!newCourse.title) return; addCourse.mutate(newCourse, { onSuccess: () => { setShowAdd(false); setNewCourse({ title: '', category: '', instructor_name: '', duration_hours: 0, price: 0, description: '' }); } }); }} disabled={addCourse.isPending} className="w-full">{addCourse.isPending ? 'جاري...' : 'إضافة الدورة'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
