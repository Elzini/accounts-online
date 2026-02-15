import { useQuery } from '@tanstack/react-query';
import { DollarSign, FileText, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchPayments } from '@/services/saasAdmin';
import { supabase } from '@/integrations/supabase/client';

export function RevenueControl() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['saas-payments'],
    queryFn: fetchPayments,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['saas-subscriptions-revenue'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, companies(name)')
        .order('end_date', { ascending: true });
      return data || [];
    },
  });

  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const pendingRevenue = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const totalTax = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.tax_amount), 0);
  const totalGatewayFees = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.gateway_fee), 0);
  const netProfit = totalRevenue - totalTax - totalGatewayFees;

  const expiringSoon = subscriptions.filter(s => {
    if (!s.end_date) return false;
    const daysLeft = Math.ceil((new Date(s.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'مدفوع', pending: 'معلق', failed: 'فشل', refunded: 'مسترد',
    };
    const variant = status === 'paid' ? 'default' : status === 'pending' ? 'secondary' : 'destructive';
    return <Badge variant={variant as any}>{map[status] || status}</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['رقم الفاتورة', 'الشركة', 'المبلغ', 'الضريبة', 'الصافي', 'الحالة', 'التاريخ'];
    const rows = payments.map(p => [
      p.invoice_number || '-', p.company_id, p.amount, p.tax_amount, p.net_amount, p.status, p.created_at.substring(0, 10)
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6" /> إدارة الإيرادات</h2>
          <p className="text-muted-foreground">تتبع المدفوعات والإيرادات</p>
        </div>
        <Button variant="outline" onClick={exportToCSV} className="gap-2">
          <Download className="w-4 h-4" /> تصدير Excel
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي الإيرادات</p>
            <p className="text-xl font-bold text-green-500">{totalRevenue.toLocaleString()} ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">الإيرادات المعلقة</p>
            <p className="text-xl font-bold text-amber-500">{pendingRevenue.toLocaleString()} ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي الضرائب</p>
            <p className="text-xl font-bold">{totalTax.toLocaleString()} ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">رسوم البوابة</p>
            <p className="text-xl font-bold text-destructive">{totalGatewayFees.toLocaleString()} ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">صافي الربح</p>
            <p className="text-xl font-bold text-primary">{netProfit.toLocaleString()} ر.س</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon */}
      {expiringSoon.length > 0 && (
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-500">
              <AlertCircle className="w-4 h-4" /> اشتراكات تنتهي قريباً ({expiringSoon.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expiringSoon.map((s: any) => {
                const daysLeft = Math.ceil((new Date(s.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="font-medium">{s.companies?.name || 'شركة'}</span>
                    <Badge variant="secondary">{daysLeft} يوم متبقي</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">سجل المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الضريبة</TableHead>
                  <TableHead>الصافي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>طريقة الدفع</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, 50).map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.invoice_number || '-'}</TableCell>
                    <TableCell className="font-medium">{Number(p.amount).toLocaleString()} {p.currency}</TableCell>
                    <TableCell>{Number(p.tax_amount).toLocaleString()}</TableCell>
                    <TableCell>{Number(p.net_amount).toLocaleString()}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell>{p.payment_method || '-'}</TableCell>
                    <TableCell>{p.created_at.substring(0, 10)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">لا توجد مدفوعات مسجلة بعد</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
