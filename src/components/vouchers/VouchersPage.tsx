import { useState } from 'react';
import { Plus, Receipt, CreditCard, Trash2, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useVouchers, useReceiptVouchers, usePaymentVouchers, useAddVoucher, useDeleteVoucher } from '@/hooks/useVouchers';
import { useCompany } from '@/contexts/CompanyContext';
import { Voucher } from '@/services/vouchers';

export function VouchersPage() {
  const { companyId } = useCompany();
  const { data: allVouchers = [], isLoading } = useVouchers();
  const addVoucher = useAddVoucher();
  const deleteVoucher = useDeleteVoucher();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState({
    voucher_type: 'receipt' as 'receipt' | 'payment',
    amount: '',
    description: '',
    voucher_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    related_to: ''
  });

  const receiptVouchers = allVouchers.filter(v => v.voucher_type === 'receipt');
  const paymentVouchers = allVouchers.filter(v => v.voucher_type === 'payment');

  const handleSubmit = async () => {
    if (!form.amount || !form.description) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      await addVoucher.mutateAsync({
        company_id: companyId!,
        voucher_type: form.voucher_type,
        amount: parseFloat(form.amount),
        description: form.description,
        voucher_date: form.voucher_date,
        payment_method: form.payment_method,
        related_to: form.related_to || null,
        related_id: null,
        created_by: null
      });
      toast.success(`تم إنشاء ${form.voucher_type === 'receipt' ? 'سند القبض' : 'سند الصرف'} بنجاح`);
      setIsDialogOpen(false);
      setForm({
        voucher_type: 'receipt',
        amount: '',
        description: '',
        voucher_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        related_to: ''
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء الإنشاء');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      await deleteVoucher.mutateAsync(id);
      toast.success('تم الحذف');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  const totalReceipts = receiptVouchers.reduce((sum, v) => sum + Number(v.amount), 0);
  const totalPayments = paymentVouchers.reduce((sum, v) => sum + Number(v.amount), 0);

  const VoucherTable = ({ vouchers, type }: { vouchers: Voucher[], type: 'receipt' | 'payment' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>رقم السند</TableHead>
          <TableHead>التاريخ</TableHead>
          <TableHead>الوصف</TableHead>
          <TableHead>طريقة الدفع</TableHead>
          <TableHead>المبلغ</TableHead>
          <TableHead>إجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vouchers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              لا توجد سندات
            </TableCell>
          </TableRow>
        ) : (
          vouchers.map((voucher) => (
            <TableRow key={voucher.id}>
              <TableCell className="font-mono">
                {type === 'receipt' ? 'ق' : 'ص'}-{voucher.voucher_number}
              </TableCell>
              <TableCell>{new Date(voucher.voucher_date).toLocaleDateString('ar-SA')}</TableCell>
              <TableCell>{voucher.description}</TableCell>
              <TableCell>
                {voucher.payment_method === 'cash' && 'نقداً'}
                {voucher.payment_method === 'bank' && 'تحويل بنكي'}
                {voucher.payment_method === 'card' && 'بطاقة'}
                {voucher.payment_method === 'check' && 'شيك'}
              </TableCell>
              <TableCell className={`font-semibold ${type === 'receipt' ? 'text-green-600' : 'text-destructive'}`}>
                {formatCurrency(Number(voucher.amount))}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => window.print()}>
                    <Printer className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي سندات القبض</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceipts)}</p>
              </div>
              <Receipt className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي سندات الصرف</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalPayments)}</p>
              </div>
              <CreditCard className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الصافي</p>
                <p className={`text-2xl font-bold ${totalReceipts - totalPayments >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatCurrency(totalReceipts - totalPayments)}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({...form, voucher_type: 'receipt'})}>
              <Plus className="w-4 h-4 ml-2" /> سند قبض
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setForm({...form, voucher_type: 'payment'})}>
              <Plus className="w-4 h-4 ml-2" /> سند صرف
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {form.voucher_type === 'receipt' ? 'سند قبض جديد' : 'سند صرف جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>نوع السند</Label>
                <Select 
                  value={form.voucher_type} 
                  onValueChange={(v) => setForm({...form, voucher_type: v as 'receipt' | 'payment'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">سند قبض (استلام)</SelectItem>
                    <SelectItem value="payment">سند صرف (دفع)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المبلغ *</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({...form, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>الوصف *</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder={form.voucher_type === 'receipt' 
                    ? 'مثال: استلام دفعة من العميل أحمد...'
                    : 'مثال: دفع إيجار المعرض لشهر...'
                  }
                />
              </div>
              <div>
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={form.voucher_date}
                  onChange={(e) => setForm({...form, voucher_date: e.target.value})}
                />
              </div>
              <div>
                <Label>طريقة الدفع</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({...form, payment_method: v})}>
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
                <Label>مرتبط بـ</Label>
                <Select value={form.related_to} onValueChange={(v) => setForm({...form, related_to: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختياري" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">عميل</SelectItem>
                    <SelectItem value="supplier">مورد</SelectItem>
                    <SelectItem value="expense">مصروف</SelectItem>
                    <SelectItem value="installment">قسط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={addVoucher.isPending}>
                {addVoucher.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                حفظ السند
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="receipts" className="w-full">
        <TabsList>
          <TabsTrigger value="receipts" className="gap-2">
            <Receipt className="w-4 h-4" /> سندات القبض ({receiptVouchers.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" /> سندات الصرف ({paymentVouchers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts">
          <Card>
            <CardHeader>
              <CardTitle>سندات القبض</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable vouchers={receiptVouchers} type="receipt" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>سندات الصرف</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <VoucherTable vouchers={paymentVouchers} type="payment" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
