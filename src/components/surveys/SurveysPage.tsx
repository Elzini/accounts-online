import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Plus, BarChart3, Users, CheckCircle, Star } from 'lucide-react';

export function SurveysPage() {
  const surveys = [
    { id: 1, title: 'استبيان رضا العملاء Q4', questions: 15, responses: 245, target: 300, avgScore: 4.2, status: 'active', created: '2024-01-01' },
    { id: 2, title: 'تقييم بيئة العمل', questions: 20, responses: 45, target: 50, avgScore: 3.8, status: 'active', created: '2024-01-10' },
    { id: 3, title: 'استبيان المنتجات الجديدة', questions: 10, responses: 180, target: 180, avgScore: 4.5, status: 'closed', created: '2023-12-01' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الاستبيانات</h1>
            <p className="text-sm text-muted-foreground">استطلاعات رأي العملاء والموظفين</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />استبيان جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><ClipboardList className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{surveys.length}</p><p className="text-xs text-muted-foreground">استبيانات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{surveys.reduce((s, sv) => s + sv.responses, 0)}</p><p className="text-xs text-muted-foreground">إجابات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Star className="w-8 h-8 mx-auto text-yellow-500 mb-1" /><p className="text-2xl font-bold">{(surveys.reduce((s, sv) => s + sv.avgScore, 0) / surveys.length).toFixed(1)}</p><p className="text-xs text-muted-foreground">متوسط التقييم</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{surveys.filter(s => s.status === 'active').length}</p><p className="text-xs text-muted-foreground">نشطة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>العنوان</TableHead><TableHead>الأسئلة</TableHead><TableHead>الإجابات</TableHead>
            <TableHead>التقدم</TableHead><TableHead>التقييم</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {surveys.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.title}</TableCell>
                <TableCell>{s.questions}</TableCell>
                <TableCell>{s.responses}/{s.target}</TableCell>
                <TableCell><div className="flex items-center gap-2 w-32"><Progress value={(s.responses / s.target) * 100} className="h-2" /><span className="text-xs">{((s.responses / s.target) * 100).toFixed(0)}%</span></div></TableCell>
                <TableCell><div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{s.avgScore}</div></TableCell>
                <TableCell><Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status === 'active' ? 'نشط' : 'مغلق'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
