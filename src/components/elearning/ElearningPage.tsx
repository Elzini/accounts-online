import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Plus, BookOpen, Users, Award, Clock } from 'lucide-react';

export function ElearningPage() {
  const courses = [
    { id: 1, title: 'أساسيات المحاسبة المالية', category: 'مالية', lessons: 24, students: 85, completion: 72, rating: 4.5, duration: '12 ساعة', status: 'published' },
    { id: 2, title: 'إدارة المخزون المتقدمة', category: 'مستودعات', lessons: 18, students: 42, completion: 60, rating: 4.2, duration: '8 ساعات', status: 'published' },
    { id: 3, title: 'خدمة العملاء الاحترافية', category: 'مبيعات', lessons: 12, students: 120, completion: 88, rating: 4.8, duration: '6 ساعات', status: 'published' },
    { id: 4, title: 'سلامة بيئة العمل', category: 'موارد بشرية', lessons: 8, students: 0, completion: 0, rating: 0, duration: '4 ساعات', status: 'draft' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التعلم الإلكتروني</h1>
            <p className="text-sm text-muted-foreground">إنشاء وإدارة الدورات التدريبية</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />دورة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><BookOpen className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{courses.length}</p><p className="text-xs text-muted-foreground">دورات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{courses.reduce((s, c) => s + c.students, 0)}</p><p className="text-xs text-muted-foreground">متدربين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Award className="w-8 h-8 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{courses.reduce((s, c) => s + c.lessons, 0)}</p><p className="text-xs text-muted-foreground">دروس</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">30</p><p className="text-xs text-muted-foreground">ساعة محتوى</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>الدورة</TableHead><TableHead>الفئة</TableHead><TableHead>الدروس</TableHead>
            <TableHead>المتدربين</TableHead><TableHead>الإتمام</TableHead><TableHead>المدة</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {courses.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell><Badge variant="outline">{c.category}</Badge></TableCell>
                <TableCell>{c.lessons}</TableCell>
                <TableCell>{c.students}</TableCell>
                <TableCell><div className="flex items-center gap-2 w-24"><Progress value={c.completion} className="h-2" /><span className="text-xs">{c.completion}%</span></div></TableCell>
                <TableCell>{c.duration}</TableCell>
                <TableCell><Badge variant={c.status === 'published' ? 'default' : 'secondary'}>{c.status === 'published' ? 'منشور' : 'مسودة'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
