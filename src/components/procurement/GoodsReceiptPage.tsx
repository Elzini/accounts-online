import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, PackageCheck, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

export function GoodsReceiptPage() {
  const [search, setSearch] = useState('');
  const receipts = [
    { id: '1', number: 'GR-001', poNumber: 'PO-001', supplier: 'شركة الأمل للتجارة', date: '2024-02-01', items: 3, status: 'complete' },
    { id: '2', number: 'GR-002', poNumber: 'PO-003', supplier: 'شركة المستقبل', date: '2024-02-12', items: 1, status: 'partial' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">أذون الاستلام</h1>
          <p className="text-muted-foreground">إدارة استلام البضائع من أوامر الشراء</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('اختر أمر شراء لإنشاء إذن استلام')}><Plus className="w-4 h-4" />إذن استلام جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><PackageCheck className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">{receipts.length}</div><p className="text-sm text-muted-foreground">إجمالي الاستلامات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><ClipboardCheck className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{receipts.filter(r => r.status === 'complete').length}</div><p className="text-sm text-muted-foreground">مكتملة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-orange-600">{receipts.filter(r => r.status === 'partial').length}</div><p className="text-sm text-muted-foreground">جزئية</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><div className="flex items-center gap-2"><Search className="w-4 h-4" /><Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>رقم الإذن</TableHead><TableHead>أمر الشراء</TableHead><TableHead>المورد</TableHead><TableHead>التاريخ</TableHead><TableHead>الأصناف</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
            <TableBody>
              {receipts.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.number}</TableCell>
                  <TableCell className="font-mono">{r.poNumber}</TableCell>
                  <TableCell>{r.supplier}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.items}</TableCell>
                  <TableCell><Badge variant={r.status === 'complete' ? 'default' : 'secondary'}>{r.status === 'complete' ? 'مكتمل' : 'جزئي'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
