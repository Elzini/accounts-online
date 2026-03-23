import { useState } from 'react';
import { Plus, Search, ClipboardList, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { useCompany } from '@/contexts/CompanyContext';
import { useRestaurantOrders } from '@/hooks/modules/useRestaurantServices';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function OrdersPage() {
  const { companyId } = useCompany();
  const [search, setSearch] = useState('');
  const { data: orders = [], isLoading } = useRestaurantOrders(companyId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="secondary">مكتمل</Badge>;
      case 'preparing': return <Badge variant="secondary">قيد التحضير</Badge>;
      case 'cancelled': return <Badge variant="destructive">ملغي</Badge>;
      default: return <Badge variant="outline">جديد</Badge>;
    }
  };

  const getOrderTypeBadge = (type: string) => {
    switch (type) {
      case 'dine_in': return <Badge variant="outline">داخل الصالة</Badge>;
      case 'takeaway': return <Badge variant="outline">سفري</Badge>;
      case 'delivery': return <Badge variant="outline">توصيل</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filtered = orders.filter((o: any) => 
    String(o.order_number).includes(search) || 
    (o.customer_name || '').includes(search)
  );

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            الطلبات
          </h1>
          <p className="text-muted-foreground mt-1">{orders.length} طلب</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" />طلب جديد</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="بحث برقم الطلب أو اسم العميل..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الطلب</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>العميل / الطاولة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.order_number}</TableCell>
                  <TableCell>{getOrderTypeBadge(order.order_type)}</TableCell>
                  <TableCell>{order.customer_name || (order.table_number ? `طاولة ${order.table_number}` : '-')}</TableCell>
                  <TableCell className="font-medium">{order.total_amount?.toLocaleString()} ر.س</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{format(new Date(order.created_at), 'dd/MM HH:mm', { locale: ar })}</TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد طلبات</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
