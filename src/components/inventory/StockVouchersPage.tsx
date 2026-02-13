import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

export function StockVouchersPage() {
  const [search, setSearch] = useState('');
  const vouchers = [
    { id: '1', number: 'SV-001', type: 'receipt', warehouse: 'المستودع الرئيسي', date: '2024-01-15', items: 5, status: 'approved', reference: 'PO-001' },
    { id: '2', number: 'SV-002', type: 'issue', warehouse: 'المستودع الرئيسي', date: '2024-01-16', items: 3, status: 'approved', reference: 'SO-012' },
    { id: '3', number: 'SV-003', type: 'transfer', warehouse: 'المستودع الرئيسي → الفرعي', date: '2024-01-17', items: 2, status: 'pending', reference: '' },
    { id: '4', number: 'SV-004', type: 'issue', warehouse: 'المستودع الفرعي', date: '2024-01-18', items: 1, status: 'draft', reference: '' },
  ];

  const typeLabels: Record<string, string> = { receipt: 'إضافة', issue: 'صرف', transfer: 'تحويل' };
  const typeIcons: Record<string, any> = { receipt: ArrowDownToLine, issue: ArrowUpFromLine, transfer: ArrowLeftRight };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الأذون المخزنية</h1>
          <p className="text-muted-foreground">أذون الصرف والإضافة والتحويل بين المستودعات</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إنشاء إذن مخزني جديد')}><Plus className="w-4 h-4" />إذن جديد</Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">الكل ({vouchers.length})</TabsTrigger>
          <TabsTrigger value="receipt" className="gap-1"><ArrowDownToLine className="w-3 h-3" />إضافة</TabsTrigger>
          <TabsTrigger value="issue" className="gap-1"><ArrowUpFromLine className="w-3 h-3" />صرف</TabsTrigger>
          <TabsTrigger value="transfer" className="gap-1"><ArrowLeftRight className="w-3 h-3" />تحويل</TabsTrigger>
        </TabsList>

        {['all', 'receipt', 'issue', 'transfer'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardHeader><div className="flex items-center gap-2"><Search className="w-4 h-4" /><Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" /></div></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>الرقم</TableHead><TableHead>النوع</TableHead><TableHead>المستودع</TableHead><TableHead>التاريخ</TableHead><TableHead>الأصناف</TableHead><TableHead>المرجع</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {vouchers.filter(v => tab === 'all' || v.type === tab).map(v => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono">{v.number}</TableCell>
                        <TableCell><Badge variant="outline">{typeLabels[v.type]}</Badge></TableCell>
                        <TableCell>{v.warehouse}</TableCell>
                        <TableCell>{v.date}</TableCell>
                        <TableCell>{v.items}</TableCell>
                        <TableCell className="font-mono text-xs">{v.reference || '-'}</TableCell>
                        <TableCell><Badge variant={v.status === 'approved' ? 'default' : 'secondary'}>{v.status === 'approved' ? 'معتمد' : v.status === 'pending' ? 'بانتظار' : 'مسودة'}</Badge></TableCell>
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
