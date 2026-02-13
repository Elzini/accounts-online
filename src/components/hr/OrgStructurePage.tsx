import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, GitFork } from 'lucide-react';
import { toast } from 'sonner';

export function OrgStructurePage() {
  const departments = [
    { id: '1', name: 'الإدارة العامة', manager: 'المدير العام', employees: 3, children: [
      { id: '2', name: 'المحاسبة والمالية', manager: 'مدير المالية', employees: 5, children: [] },
      { id: '3', name: 'المبيعات', manager: 'مدير المبيعات', employees: 8, children: [
        { id: '6', name: 'مبيعات التجزئة', manager: 'مشرف التجزئة', employees: 4, children: [] },
        { id: '7', name: 'مبيعات الجملة', manager: 'مشرف الجملة', employees: 3, children: [] },
      ]},
      { id: '4', name: 'تقنية المعلومات', manager: 'مدير التقنية', employees: 4, children: [] },
      { id: '5', name: 'الموارد البشرية', manager: 'مدير الموارد البشرية', employees: 3, children: [] },
    ]},
  ];

  const renderDept = (dept: any, level = 0) => (
    <div key={dept.id} className={`${level > 0 ? 'mr-8 border-r-2 border-border pr-4' : ''}`}>
      <Card className="mb-3">
        <CardContent className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">{dept.name}</h3>
              <p className="text-sm text-muted-foreground">{dept.manager}</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1"><Users className="w-3 h-3" />{dept.employees} موظف</Badge>
        </CardContent>
      </Card>
      {dept.children?.map((child: any) => renderDept(child, level + 1))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الهيكل التنظيمي</h1>
          <p className="text-muted-foreground">شجرة الإدارات والأقسام والمسميات الوظيفية</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إضافة قسم جديد')}><Plus className="w-4 h-4" />قسم جديد</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><GitFork className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">7</div><p className="text-sm text-muted-foreground">الأقسام</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">30</div><p className="text-sm text-muted-foreground">الموظفين</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Building2 className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">3</div><p className="text-sm text-muted-foreground">المستويات</p></CardContent></Card>
      </div>

      <div className="space-y-2">{departments.map(d => renderDept(d))}</div>
    </div>
  );
}
