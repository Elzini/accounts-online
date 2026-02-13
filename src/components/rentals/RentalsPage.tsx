import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Home, Key, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function RentalsPage() {
  const units = [
    { id: '1', unit: 'مكتب 101', building: 'برج الأعمال', tenant: 'شركة التقنية', rent: 8000, startDate: '2024-01-01', endDate: '2025-12-31', status: 'occupied', dueAmount: 0 },
    { id: '2', unit: 'معرض A3', building: 'المجمع التجاري', tenant: 'مؤسسة البناء', rent: 15000, startDate: '2023-06-01', endDate: '2025-05-31', status: 'occupied', dueAmount: 15000 },
    { id: '3', unit: 'مكتب 205', building: 'برج الأعمال', tenant: '', rent: 6000, startDate: '', endDate: '', status: 'vacant', dueAmount: 0 },
    { id: '4', unit: 'شقة 12', building: 'المجمع السكني', tenant: 'أحمد محمد', rent: 3500, startDate: '2024-02-01', endDate: '2025-01-31', status: 'occupied', dueAmount: 3500 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الإيجارات والوحدات</h1>
          <p className="text-muted-foreground">إدارة العقارات والوحدات والمستأجرين</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إضافة وحدة جديدة')}><Plus className="w-4 h-4" />وحدة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Home className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{units.length}</div><p className="text-sm text-muted-foreground">الوحدات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Key className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{units.filter(u => u.status === 'occupied').length}</div><p className="text-sm text-muted-foreground">مؤجرة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{units.reduce((s, u) => s + u.rent, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الإيجارات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><AlertTriangle className="w-8 h-8 mx-auto mb-2 text-destructive" /><div className="text-2xl font-bold">{units.reduce((s, u) => s + u.dueAmount, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">مستحقات متأخرة</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>الوحدة</TableHead><TableHead>المبنى</TableHead><TableHead>المستأجر</TableHead><TableHead>الإيجار</TableHead><TableHead>البداية</TableHead><TableHead>النهاية</TableHead><TableHead>المستحق</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {units.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unit}</TableCell>
                  <TableCell>{u.building}</TableCell>
                  <TableCell>{u.tenant || '-'}</TableCell>
                  <TableCell>{u.rent.toLocaleString()} ر.س</TableCell>
                  <TableCell>{u.startDate || '-'}</TableCell>
                  <TableCell>{u.endDate || '-'}</TableCell>
                  <TableCell className={u.dueAmount > 0 ? 'text-destructive font-bold' : ''}>{u.dueAmount > 0 ? `${u.dueAmount.toLocaleString()} ر.س` : '-'}</TableCell>
                  <TableCell><Badge variant={u.status === 'occupied' ? 'default' : 'secondary'}>{u.status === 'occupied' ? 'مؤجرة' : 'شاغرة'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
