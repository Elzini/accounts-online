import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function EmployeeContractsPage() {
  const contracts = [
    { id: '1', employee: 'أحمد محمد', type: 'دوام كامل', startDate: '2023-01-01', endDate: '2025-12-31', salary: 12000, status: 'active', department: 'تقنية المعلومات' },
    { id: '2', employee: 'سارة الخالد', type: 'دوام كامل', startDate: '2023-06-15', endDate: '2025-06-14', salary: 9000, status: 'active', department: 'المحاسبة' },
    { id: '3', employee: 'خالد سعد', type: 'دوام جزئي', startDate: '2024-01-01', endDate: '2024-12-31', salary: 5000, status: 'expiring_soon', department: 'المبيعات' },
    { id: '4', employee: 'فهد العلي', type: 'عقد مؤقت', startDate: '2023-03-01', endDate: '2024-02-28', salary: 8000, status: 'expired', department: 'الصيانة' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">عقود الموظفين</h1>
          <p className="text-muted-foreground">إدارة عقود العمل وتجديدها</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء عقد جديد')}><Plus className="w-4 h-4" />عقد جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{contracts.length}</div><p className="text-sm text-muted-foreground">إجمالي العقود</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{contracts.filter(c => c.status === 'active').length}</div><p className="text-sm text-muted-foreground">سارية</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-orange-600" /><div className="text-2xl font-bold">{contracts.filter(c => c.status === 'expiring_soon').length}</div><p className="text-sm text-muted-foreground">قاربت على الانتهاء</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{contracts.filter(c => c.status === 'expired').length}</div><p className="text-sm text-muted-foreground">منتهية</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>الموظف</TableHead><TableHead>القسم</TableHead><TableHead>نوع العقد</TableHead><TableHead>البداية</TableHead><TableHead>النهاية</TableHead><TableHead>الراتب</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {contracts.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.employee}</TableCell>
                  <TableCell>{c.department}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.startDate}</TableCell>
                  <TableCell>{c.endDate}</TableCell>
                  <TableCell>{c.salary.toLocaleString()} ر.س</TableCell>
                  <TableCell><Badge variant={c.status === 'active' ? 'default' : c.status === 'expired' ? 'destructive' : 'secondary'}>{c.status === 'active' ? 'ساري' : c.status === 'expiring_soon' ? 'ينتهي قريباً' : 'منتهي'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
