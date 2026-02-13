import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp, Award, Users } from 'lucide-react';
import { toast } from 'sonner';

export function SalesTargetsPage() {
  const targets = [
    { id: '1', employee: 'أحمد محمد', target: 100000, achieved: 85000, period: 'يناير 2024', department: 'المبيعات' },
    { id: '2', employee: 'سارة الخالد', target: 80000, achieved: 92000, period: 'يناير 2024', department: 'المبيعات' },
    { id: '3', employee: 'خالد سعد', target: 120000, achieved: 65000, period: 'يناير 2024', department: 'مبيعات الجملة' },
    { id: '4', employee: 'فهد العلي', target: 60000, achieved: 58000, period: 'يناير 2024', department: 'مبيعات التجزئة' },
  ];

  const totalTarget = targets.reduce((s, t) => s + t.target, 0);
  const totalAchieved = targets.reduce((s, t) => s + t.achieved, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المبيعات المستهدفة</h1>
          <p className="text-muted-foreground">أهداف بيعية للموظفين والأقسام</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('تحديد هدف بيعي جديد')}><Plus className="w-4 h-4" />هدف جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Target className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{totalTarget.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الأهداف</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{totalAchieved.toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">المحقق</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Award className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><div className="text-2xl font-bold">{((totalAchieved/totalTarget)*100).toFixed(0)}%</div><p className="text-sm text-muted-foreground">نسبة الإنجاز</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{targets.filter(t => t.achieved >= t.target).length}/{targets.length}</div><p className="text-sm text-muted-foreground">حققوا الهدف</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>القسم</TableHead><TableHead>الفترة</TableHead><TableHead>الهدف</TableHead><TableHead>المحقق</TableHead><TableHead>التقدم</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {targets.map(t => {
                const pct = (t.achieved / t.target) * 100;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.employee}</TableCell>
                    <TableCell>{t.department}</TableCell>
                    <TableCell>{t.period}</TableCell>
                    <TableCell>{t.target.toLocaleString()} ر.س</TableCell>
                    <TableCell>{t.achieved.toLocaleString()} ر.س</TableCell>
                    <TableCell className="w-32"><div className="flex items-center gap-2"><Progress value={Math.min(pct, 100)} className="h-2" /><span className="text-xs">{pct.toFixed(0)}%</span></div></TableCell>
                    <TableCell><Badge variant={pct >= 100 ? 'default' : pct >= 80 ? 'secondary' : 'destructive'}>{pct >= 100 ? 'محقق' : pct >= 80 ? 'قريب' : 'متأخر'}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
