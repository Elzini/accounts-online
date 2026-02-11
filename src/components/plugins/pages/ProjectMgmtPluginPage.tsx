import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ClipboardList, Calendar, Users, DollarSign, CheckCircle, 
  Clock, AlertTriangle, BarChart3, Target 
} from 'lucide-react';

export function ProjectMgmtPluginPage() {
  const projects = [
    { name: 'مشروع البرج السكني', manager: 'أحمد محمد', budget: 5000000, spent: 3200000, progress: 64, status: 'active', deadline: '2024-06-30' },
    { name: 'تطوير المجمع التجاري', manager: 'خالد عبدالله', budget: 12000000, spent: 8500000, progress: 71, status: 'active', deadline: '2024-09-15' },
    { name: 'صيانة المبنى الإداري', manager: 'سارة أحمد', budget: 800000, spent: 750000, progress: 95, status: 'active', deadline: '2024-02-28' },
    { name: 'مشروع الحديقة العامة', manager: 'فاطمة حسن', budget: 2000000, spent: 2000000, progress: 100, status: 'completed', deadline: '2024-01-15' },
  ];

  const tasks = [
    { name: 'تصميم الواجهات', project: 'البرج السكني', assignee: 'فريق التصميم', due: '2024-02-15', status: 'in_progress' },
    { name: 'أعمال الأساسات', project: 'المجمع التجاري', assignee: 'المقاول الرئيسي', due: '2024-02-20', status: 'in_progress' },
    { name: 'فحص السلامة', project: 'المبنى الإداري', assignee: 'فريق السلامة', due: '2024-02-10', status: 'overdue' },
    { name: 'تسليم نهائي', project: 'الحديقة العامة', assignee: 'إدارة المشروع', due: '2024-01-15', status: 'completed' },
    { name: 'طلب مواد بناء', project: 'البرج السكني', assignee: 'قسم المشتريات', due: '2024-02-25', status: 'pending' },
  ];

  const resources = [
    { name: 'فريق التصميم', type: 'بشري', allocation: 85, projects: 2 },
    { name: 'معدات ثقيلة', type: 'معدات', allocation: 70, projects: 3 },
    { name: 'المقاول الرئيسي', type: 'مقاول', allocation: 100, projects: 1 },
    { name: 'فريق السلامة', type: 'بشري', allocation: 45, projects: 4 },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'نشط', variant: 'default' },
      completed: { label: 'مكتمل', variant: 'secondary' },
      in_progress: { label: 'قيد التنفيذ', variant: 'default' },
      overdue: { label: 'متأخر', variant: 'destructive' },
      pending: { label: 'معلق', variant: 'outline' },
    };
    const info = map[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">📋</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المشاريع المتقدمة</h1>
          <p className="text-muted-foreground">إدارة المشاريع مع تتبع الموارد والتكاليف والجدول الزمني</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.4.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <ClipboardList className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{projects.length}</p><p className="text-xs text-muted-foreground">مشاريع</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <DollarSign className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">19.8M</p><p className="text-xs text-muted-foreground">إجمالي الميزانيات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Target className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">73%</p><p className="text-xs text-muted-foreground">متوسط الإنجاز</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500 mb-2" />
          <p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">مهام متأخرة</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects" className="gap-2"><ClipboardList className="w-4 h-4" />المشاريع</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2"><Calendar className="w-4 h-4" />المهام</TabsTrigger>
          <TabsTrigger value="resources" className="gap-2"><Users className="w-4 h-4" />الموارد</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4 space-y-4">
          {projects.map((p, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">مدير: {p.manager} • الموعد: {p.deadline}</p>
                  </div>
                  {getStatusBadge(p.status)}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <Progress value={p.progress} className="flex-1" />
                  <span className="text-sm font-bold">{p.progress}%</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>الميزانية: {(p.budget / 1000000).toFixed(1)}M ر.س</span>
                  <span>المصروف: {(p.spent / 1000000).toFixed(1)}M ر.س</span>
                  <span>المتبقي: {((p.budget - p.spent) / 1000000).toFixed(1)}M ر.س</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">قائمة المهام</CardTitle>
              <Button size="sm">+ مهمة جديدة</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.project} • {t.assignee} • {t.due}</p>
                  </div>
                  {getStatusBadge(t.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">تخصيص الموارد</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {resources.map((r, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.type} • {r.projects} مشاريع</p>
                  </div>
                  <div className="flex items-center gap-2 w-48">
                    <Progress value={r.allocation} className="flex-1" />
                    <span className="text-sm font-bold">{r.allocation}%</span>
                  </div>
                  {r.allocation >= 100 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
