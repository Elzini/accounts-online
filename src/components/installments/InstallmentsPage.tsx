import { useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, Clock, Loader2, Eye, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useInstallmentSales, useOverduePayments, useRecordPayment } from '@/hooks/useInstallments';
import { InstallmentSale, InstallmentPayment } from '@/services/installments';

export function InstallmentsPage() {
  const { data: installmentSales = [], isLoading } = useInstallmentSales();
  const { data: overduePayments = [] } = useOverduePayments();
  const recordPayment = useRecordPayment();
  
  const [selectedSale, setSelectedSale] = useState<InstallmentSale | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<InstallmentPayment | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash',
    date: new Date().toISOString().split('T')[0]
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  const handleRecordPayment = async () => {
    if (!selectedPayment || !paymentForm.amount) {
      toast.error('يرجى إدخال المبلغ');
      return;
    }

    try {
      await recordPayment.mutateAsync({
        paymentId: selectedPayment.id,
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        date: paymentForm.date
      });
      toast.success('تم تسجيل الدفعة بنجاح');
      setIsPaymentDialogOpen(false);
      setSelectedPayment(null);
      setPaymentForm({ amount: '', method: 'cash', date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">نشط</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'overdue':
        return <Badge variant="destructive">متأخر</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" /> مدفوع</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 ml-1" /> جزئي</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 ml-1" /> قيد الانتظار</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 ml-1" /> متأخر</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalActive = installmentSales.filter(s => s.status === 'active').length;
  const totalRemaining = installmentSales
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.remaining_amount), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأقساط</p>
                <p className="text-2xl font-bold">{installmentSales.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عقود نشطة</p>
                <p className="text-2xl font-bold">{totalActive}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المبلغ المتبقي</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRemaining)}</p>
              </div>
              <Banknote className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className={overduePayments.length > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">دفعات متأخرة</p>
                <p className="text-2xl font-bold text-destructive">{overduePayments.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">جميع العقود</TabsTrigger>
          <TabsTrigger value="overdue" className="text-destructive">
            متأخرة ({overduePayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>عقود التقسيط</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العميل</TableHead>
                    <TableHead>السيارة</TableHead>
                    <TableHead>المبلغ الإجمالي</TableHead>
                    <TableHead>الدفعة المقدمة</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>عدد الأقساط</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installmentSales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        لا توجد عقود تقسيط
                      </TableCell>
                    </TableRow>
                  ) : (
                    installmentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>{sale.sale?.customer?.name || '-'}</TableCell>
                        <TableCell>{sale.sale?.car?.name || '-'}</TableCell>
                        <TableCell>{formatCurrency(Number(sale.total_amount))}</TableCell>
                        <TableCell>{formatCurrency(Number(sale.down_payment))}</TableCell>
                        <TableCell className="font-semibold text-destructive">
                          {formatCurrency(Number(sale.remaining_amount))}
                        </TableCell>
                        <TableCell>{sale.number_of_installments}</TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedSale(sale);
                              setIsDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">الدفعات المتأخرة</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم القسط</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>المتبقي</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد دفعات متأخرة
                      </TableCell>
                    </TableRow>
                  ) : (
                    overduePayments.map((payment) => (
                      <TableRow key={payment.id} className="bg-destructive/5">
                        <TableCell>القسط #{payment.payment_number}</TableCell>
                        <TableCell className="text-destructive">
                          {new Date(payment.due_date).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                        <TableCell>{formatCurrency(Number(payment.paid_amount || 0))}</TableCell>
                        <TableCell className="font-semibold text-destructive">
                          {formatCurrency(Number(payment.amount) - Number(payment.paid_amount || 0))}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setPaymentForm({
                                amount: String(Number(payment.amount) - Number(payment.paid_amount || 0)),
                                method: 'cash',
                                date: new Date().toISOString().split('T')[0]
                              });
                              setIsPaymentDialogOpen(true);
                            }}
                          >
                            تسجيل دفعة
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل عقد التقسيط</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">العميل</p>
                  <p className="font-semibold">{selectedSale.sale?.customer?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السيارة</p>
                  <p className="font-semibold">{selectedSale.sale?.car?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
                  <p className="font-semibold">{formatCurrency(Number(selectedSale.total_amount))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">قيمة القسط</p>
                  <p className="font-semibold">{formatCurrency(Number(selectedSale.installment_amount))}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم القسط</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>المدفوع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSale.payments?.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>القسط #{payment.payment_number}</TableCell>
                      <TableCell>{new Date(payment.due_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>{formatCurrency(Number(payment.amount))}</TableCell>
                      <TableCell>{formatCurrency(Number(payment.paid_amount || 0))}</TableCell>
                      <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setPaymentForm({
                                amount: String(Number(payment.amount) - Number(payment.paid_amount || 0)),
                                method: 'cash',
                                date: new Date().toISOString().split('T')[0]
                              });
                              setIsPaymentDialogOpen(true);
                            }}
                          >
                            تسجيل دفعة
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المبلغ *</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({...paymentForm, method: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="bank">تحويل بنكي</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ الدفع</Label>
              <Input
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
              />
            </div>
            <Button onClick={handleRecordPayment} className="w-full" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              تأكيد الدفعة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
