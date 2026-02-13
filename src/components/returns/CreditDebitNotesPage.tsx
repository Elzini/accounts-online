import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, RotateCcw, RotateCw } from 'lucide-react';
import { toast } from 'sonner';

export function CreditDebitNotesPage() {
  const notes = [
    { id: '1', number: 'CN-001', type: 'credit', party: 'عميل - أحمد محمد', invoice: 'INV-045', date: '2024-01-18', amount: 1500, reason: 'مرتجع بضاعة تالفة', status: 'approved' },
    { id: '2', number: 'DN-001', type: 'debit', party: 'مورد - شركة الأمل', invoice: 'PI-023', date: '2024-01-17', amount: 850, reason: 'بضاعة ناقصة', status: 'approved' },
    { id: '3', number: 'CN-002', type: 'credit', party: 'عميل - سعيد علي', invoice: 'INV-051', date: '2024-01-19', amount: 2200, reason: 'خطأ في التسعير', status: 'pending' },
    { id: '4', number: 'DN-002', type: 'debit', party: 'مورد - مؤسسة النجاح', invoice: 'PI-031', date: '2024-01-20', amount: 430, reason: 'جودة غير مطابقة', status: 'draft' },
  ];

  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إشعارات دائنة / مدينة</h1>
          <p className="text-muted-foreground">إدارة المرتجعات والتعديلات على الفواتير</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء إشعار جديد')}><Plus className="w-4 h-4" />إشعار جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><RotateCcw className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{notes.filter(n => n.type === 'credit').length}</div><p className="text-sm text-muted-foreground">إشعارات دائنة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><RotateCw className="w-8 h-8 mx-auto mb-2 text-red-600" /><div className="text-2xl font-bold">{notes.filter(n => n.type === 'debit').length}</div><p className="text-sm text-muted-foreground">إشعارات مدينة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{notes.filter(n => n.type === 'credit').reduce((s, n) => s + n.amount, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي الدائن</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-red-600">{notes.filter(n => n.type === 'debit').reduce((s, n) => s + n.amount, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي المدين</p></CardContent></Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="credit" className="gap-1"><RotateCcw className="w-3 h-3" />دائنة</TabsTrigger>
          <TabsTrigger value="debit" className="gap-1"><RotateCw className="w-3 h-3" />مدينة</TabsTrigger>
        </TabsList>
        {['all', 'credit', 'debit'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader><TableRow><TableHead>الرقم</TableHead><TableHead>النوع</TableHead><TableHead>الطرف</TableHead><TableHead>الفاتورة</TableHead><TableHead>التاريخ</TableHead><TableHead>المبلغ</TableHead><TableHead>السبب</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {notes.filter(n => tab === 'all' || n.type === tab).map(n => (
                      <TableRow key={n.id}>
                        <TableCell className="font-mono">{n.number}</TableCell>
                        <TableCell><Badge variant={n.type === 'credit' ? 'default' : 'destructive'}>{n.type === 'credit' ? 'دائنة' : 'مدينة'}</Badge></TableCell>
                        <TableCell>{n.party}</TableCell>
                        <TableCell className="font-mono text-xs">{n.invoice}</TableCell>
                        <TableCell>{n.date}</TableCell>
                        <TableCell>{n.amount.toLocaleString()} ر.س</TableCell>
                        <TableCell className="text-sm">{n.reason}</TableCell>
                        <TableCell><Badge variant={n.status === 'approved' ? 'default' : 'secondary'}>{n.status === 'approved' ? 'معتمد' : n.status === 'pending' ? 'بانتظار' : 'مسودة'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
