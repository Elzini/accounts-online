import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, LayoutGrid, BarChart3, Calendar, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function AdvancedProjectsPage() {
  const projects = [
    { id: '1', name: 'مشروع ERP', status: 'active', progress: 65, tasks: 45, completedTasks: 29, team: 5, startDate: '2024-01-01', endDate: '2024-06-30', budget: 250000 },
    { id: '2', name: 'تطوير الموقع', status: 'active', progress: 40, tasks: 20, completedTasks: 8, team: 3, startDate: '2024-02-01', endDate: '2024-04-30', budget: 80000 },
    { id: '3', name: 'تطبيق الجوال', status: 'planning', progress: 10, tasks: 30, completedTasks: 3, team: 4, startDate: '2024-03-01', endDate: '2024-08-31', budget: 150000 },
  ];

  const kanbanColumns = [
    { title: 'قيد الانتظار', color: 'bg-muted', tasks: [
      { title: 'تصميم قاعدة البيانات', assignee: 'أحمد', priority: 'high' },
      { title: 'كتابة التوثيق', assignee: 'سارة', priority: 'low' },
    ]},
    { title: 'قيد التنفيذ', color: 'bg-blue-50 dark:bg-blue-950', tasks: [
      { title: 'تطوير واجهة API', assignee: 'خالد', priority: 'high' },
      { title: 'اختبار الوحدات', assignee: 'فهد', priority: 'medium' },
    ]},
    { title: 'مراجعة', color: 'bg-yellow-50 dark:bg-yellow-950', tasks: [
      { title: 'تصميم الشعار', assignee: 'نورة', priority: 'medium' },
    ]},
    { title: 'مكتمل', color: 'bg-green-50 dark:bg-green-950', tasks: [
      { title: 'إعداد البيئة', assignee: 'أحمد', priority: 'high' },
      { title: 'تحليل المتطلبات', assignee: 'سارة', priority: 'high' },
    ]},
  ];

  // Simple Gantt data
  const ganttTasks = [
    { name: 'تحليل المتطلبات', start: 0, duration: 15, color: 'bg-primary' },
    { name: 'التصميم', start: 10, duration: 20, color: 'bg-blue-500' },
    { name: 'التطوير', start: 25, duration: 40, color: 'bg-green-500' },
    { name: 'الاختبار', start: 55, duration: 15, color: 'bg-orange-500' },
    { name: 'النشر', start: 65, duration: 10, color: 'bg-purple-500' },
  ];

  const priorityColors: Record<string, string> = { high: 'border-r-destructive', medium: 'border-r-yellow-500', low: 'border-r-green-500' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المشاريع المتقدمة</h1>
          <p className="text-muted-foreground">Gantt Chart و Kanban Board لتتبع المشاريع</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء مشروع جديد')}><Plus className="w-4 h-4" />مشروع جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><LayoutGrid className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{projects.length}</div><p className="text-sm text-muted-foreground">المشاريع</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{projects.reduce((s, p) => s + p.completedTasks, 0)}</div><p className="text-sm text-muted-foreground">مهام مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{projects.reduce((s, p) => s + p.team, 0)}</div><p className="text-sm text-muted-foreground">أعضاء الفريق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{projects.reduce((s, p) => s + p.budget, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الميزانية</p></CardContent></Card>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-1"><LayoutGrid className="w-3 h-3" />Kanban</TabsTrigger>
          <TabsTrigger value="gantt" className="gap-1"><BarChart3 className="w-3 h-3" />Gantt</TabsTrigger>
          <TabsTrigger value="list" className="gap-1"><Calendar className="w-3 h-3" />المشاريع</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kanbanColumns.map(col => (
              <div key={col.title} className={`rounded-lg p-3 ${col.color}`}>
                <h3 className="font-semibold text-sm mb-3 flex items-center justify-between">
                  {col.title}
                  <Badge variant="secondary" className="text-xs">{col.tasks.length}</Badge>
                </h3>
                <div className="space-y-2">
                  {col.tasks.map((task, i) => (
                    <Card key={i} className={`border-r-4 ${priorityColors[task.priority]}`}>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{task.assignee}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">مخطط جانت - مشروع ERP</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ganttTasks.map(task => (
                  <div key={task.name} className="flex items-center gap-3">
                    <span className="text-sm w-32 text-left">{task.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 relative">
                      <div className={`${task.color} h-full rounded-full absolute`} style={{ left: `${(task.start / 75) * 100}%`, width: `${(task.duration / 75) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-muted-foreground mt-2 px-32">
                  <span>يناير</span><span>فبراير</span><span>مارس</span><span>أبريل</span><span>مايو</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <div className="space-y-4">
            {projects.map(p => (
              <Card key={p.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.startDate} → {p.endDate}</p>
                    </div>
                    <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>{p.status === 'active' ? 'نشط' : 'تخطيط'}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1"><Progress value={p.progress} className="h-2" /></div>
                    <span className="text-sm font-medium">{p.progress}%</span>
                    <span className="text-sm text-muted-foreground">{p.completedTasks}/{p.tasks} مهمة</span>
                    <span className="text-sm text-muted-foreground">{p.team} أعضاء</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
