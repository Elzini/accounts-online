import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseOrder {
  id: string;
  number: string;
  supplier: string;
  date: string;
  deliveryDate: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  items: { name: string; qty: number; price: number }[];
  total: number;
  notes: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  received: 'bg-primary/10 text-primary',
  cancelled: 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  sent: 'مرسل',
  confirmed: 'مؤكد',
  received: 'مستلم',
  cancelled: 'ملغي',
};

export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([
    { id: '1', number: 'PO-001', supplier: 'شركة الأمل للتجارة', date: '2024-01-15', deliveryDate: '2024-02-01', status: 'confirmed', items: [{ name: 'زيت محرك', qty: 100, price: 85 }], total: 8500, notes: '' },
    { id: '2', number: 'PO-002', supplier: 'مؤسسة النجاح', date: '2024-01-18', deliveryDate: '2024-02-10', status: 'draft', items: [{ name: 'فلتر هواء', qty: 50, price: 45 }], total: 2250, notes: '' },
    { id: '3', number: 'PO-003', supplier: 'شركة المستقبل', date: '2024-01-20', deliveryDate: '2024-02-15', status: 'sent', items: [{ name: 'بطارية', qty: 20, price: 350 }], total: 7000, notes: '' },
  ]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = orders.filter(o => o.number.includes(search) || o.supplier.includes(search));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">أوامر الشراء</h1>
          <p className="text-muted-foreground">إدارة دورة المشتريات من الطلب حتى الاستلام</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />أمر شراء جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>أمر شراء جديد</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>المورد</Label><Input placeholder="اختر المورد" /></div>
              <div><Label>تاريخ التسليم المتوقع</Label><Input type="date" /></div>
              <div><Label>الأصناف</Label><Textarea placeholder="أدخل الأصناف المطلوبة..." /></div>
              <div><Label>ملاحظات</Label><Textarea placeholder="ملاحظات إضافية..." /></div>
              <Button className="w-full" onClick={() => { toast.success('تم إنشاء أمر الشراء'); setShowAdd(false); }}>حفظ</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{orders.length}</div><p className="text-sm text-muted-foreground">إجمالي الطلبات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'sent').length}</div><p className="text-sm text-muted-foreground">مرسلة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'confirmed').length}</div><p className="text-sm text-muted-foreground">مؤكدة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-primary">{orders.reduce((s, o) => s + o.total, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي القيمة</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم</TableHead><TableHead>المورد</TableHead><TableHead>التاريخ</TableHead>
                <TableHead>التسليم</TableHead><TableHead>الحالة</TableHead><TableHead>المبلغ</TableHead><TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(o => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono">{o.number}</TableCell>
                  <TableCell>{o.supplier}</TableCell>
                  <TableCell>{o.date}</TableCell>
                  <TableCell>{o.deliveryDate}</TableCell>
                  <TableCell><Badge className={statusColors[o.status]}>{statusLabels[o.status]}</Badge></TableCell>
                  <TableCell>{o.total.toLocaleString()} ر.س</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="w-3 h-3" /></Button>
                      {o.status === 'draft' && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"><Trash2 className="w-3 h-3" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
