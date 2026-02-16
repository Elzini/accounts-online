import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ClipboardCheck, Target, TrendingUp, Users, Star, Calendar, Plus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export function AppraisalsPage() {
  const appraisals = [
    { id: 1, employee: 'أحمد محمد', department: 'تقنية المعلومات', manager: 'خالد سعد', period: 'Q4 2024', score: 4.2, status: 'completed', goals: 5, goalsAchieved: 4 },
    { id: 2, employee: 'سارة علي', department: 'المالية', manager: 'فهد أحمد', period: 'Q4 2024', score: 3.8, status: 'in_progress', goals: 4, goalsAchieved: 2 },
    { id: 3, employee: 'محمد خالد', department: 'المبيعات', manager: 'عمر سعد', period: 'Q4 2024', score: 0, status: 'pending', goals: 6, goalsAchieved: 0 },
    { id: 4, employee: 'نورة فهد', department: 'الموارد البشرية', manager: 'ريم محمد', period: 'Q4 2024', score: 4.5, status: 'completed', goals: 3, goalsAchieved: 3 },
    { id: 5, employee: 'عبدالله سعد', department: 'التسويق', manager: 'خالد سعد', period: 'Q4 2024', score: 3.5, status: 'in_progress', goals: 5, goalsAchieved: 3 },
  ];

  const goals = [
    { id: 1, employee: 'أحمد محمد', goal: 'إنهاء مشروع التطبيق الجديد', weight: 30, progress: 100, deadline: '2024-12-31', status: 'achieved' },
    { id: 2, employee: 'أحمد محمد', goal: 'تدريب الفريق على React', weight: 20, progress: 80, deadline: '2024-11-30', status: 'in_progress' },
    { id: 3, employee: 'سارة علي', goal: 'إعداد التقارير المالية الربعية', weight: 40, progress: 60, deadline: '2024-12-15', status: 'in_progress' },
    { id: 4, employee: 'نورة فهد', goal: 'تحديث سياسات الموارد البشرية', weight: 50, progress: 100, deadline: '2024-12-01', status: 'achieved' },
  ];

  const statusLabels: Record<string, string> = { completed: 'مكتمل', in_progress: 'قيد التقييم', pending: 'بانتظار' };
  const statusColors: Record<string, string> = { completed: 'bg-green-100 text-green-800', in_progress: 'bg-blue-100 text-blue-800', pending: 'bg-gray-100 text-gray-800' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">تقييم الأداء</h1>
            <p className="text-sm text-muted-foreground">تقييمات الموظفين وتتبع الأهداف</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />تقييم جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-8 h-8 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{appraisals.length}</p><p className="text-xs text-muted-foreground">إجمالي التقييمات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ClipboardCheck className="w-8 h-8 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{appraisals.filter(a => a.status === 'completed').length}</p><p className="text-xs text-muted-foreground">مكتملة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-1" />
          <p className="text-2xl font-bold">{(appraisals.filter(a => a.score > 0).reduce((s, a) => s + a.score, 0) / appraisals.filter(a => a.score > 0).length).toFixed(1)}</p><p className="text-xs text-muted-foreground">متوسط التقييم</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Target className="w-8 h-8 mx-auto text-purple-500 mb-1" />
          <p className="text-2xl font-bold">{goals.filter(g => g.status === 'achieved').length}/{goals.length}</p><p className="text-xs text-muted-foreground">أهداف محققة</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="appraisals">
        <TabsList>
          <TabsTrigger value="appraisals">التقييمات</TabsTrigger>
          <TabsTrigger value="goals">الأهداف</TabsTrigger>
          <TabsTrigger value="skills">المهارات</TabsTrigger>
        </TabsList>

        <TabsContent value="appraisals" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الموظف</TableHead><TableHead>القسم</TableHead><TableHead>المدير</TableHead>
                <TableHead>الفترة</TableHead><TableHead>التقييم</TableHead><TableHead>الأهداف</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {appraisals.map(a => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.employee}</TableCell>
                    <TableCell>{a.department}</TableCell>
                    <TableCell>{a.manager}</TableCell>
                    <TableCell>{a.period}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {a.score > 0 && <><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /><span className="font-bold">{a.score}</span></>}
                        {a.score === 0 && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>{a.goalsAchieved}/{a.goals}</TableCell>
                    <TableCell><Badge className={statusColors[a.status]}>{statusLabels[a.status]}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الموظف</TableHead><TableHead>الهدف</TableHead><TableHead>الوزن</TableHead>
                <TableHead>التقدم</TableHead><TableHead>الموعد</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {goals.map(g => (
                  <TableRow key={g.id}>
                    <TableCell>{g.employee}</TableCell>
                    <TableCell className="font-medium">{g.goal}</TableCell>
                    <TableCell>{g.weight}%</TableCell>
                    <TableCell><div className="flex items-center gap-2 w-32"><Progress value={g.progress} className="h-2" /><span className="text-xs">{g.progress}%</span></div></TableCell>
                    <TableCell>{g.deadline}</TableCell>
                    <TableCell><Badge variant={g.status === 'achieved' ? 'default' : 'secondary'}>{g.status === 'achieved' ? 'محقق' : 'جاري'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['أحمد محمد', 'سارة علي'].map(emp => (
              <Card key={emp}>
                <CardHeader><CardTitle className="text-base">{emp}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[{ name: 'التواصل', level: 85 }, { name: 'القيادة', level: 70 }, { name: 'المهارات التقنية', level: 90 }, { name: 'العمل الجماعي', level: 80 }].map(skill => (
                    <div key={skill.name} className="space-y-1">
                      <div className="flex justify-between text-sm"><span>{skill.name}</span><span>{skill.level}%</span></div>
                      <Progress value={skill.level} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
