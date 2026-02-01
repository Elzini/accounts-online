import React, { useState } from 'react';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Eye, Clock, CheckCircle, XCircle, Play, Calendar, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  usePrepaidExpenses,
  usePrepaidExpenseAmortizations,
  useCreatePrepaidExpense,
  useProcessAmortization,
  useProcessAllDueAmortizations,
} from '@/hooks/usePrepaidExpenses';
import { useExpenseCategories } from '@/hooks/useExpenses';
import { useAccounts } from '@/hooks/useAccounting';
import { PrepaidExpense, PrepaidExpenseAmortization } from '@/services/prepaidExpenses';

export default function PrepaidExpensesPage() {
  const { data: prepaidExpenses = [], isLoading } = usePrepaidExpenses();
  const { data: categories = [] } = useExpenseCategories();
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreatePrepaidExpense();
  const processAllMutation = useProcessAllDueAmortizations();
  
  // Filter expense accounts (5xxx codes)
  const expenseAccounts = accounts.filter(acc => acc.code.startsWith('5') && acc.code.length === 4);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PrepaidExpense | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [numberOfMonths, setNumberOfMonths] = useState('12');
  const [categoryId, setCategoryId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setDescription('');
    setTotalAmount('');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setNumberOfMonths('12');
    setCategoryId('');
    setExpenseAccountId('');
    setPaymentDate(format(new Date(), 'yyyy-MM-dd'));
    setPaymentMethod('cash');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !totalAmount || !startDate || !numberOfMonths || !expenseAccountId) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const months = parseInt(numberOfMonths);
    const endDate = format(addMonths(new Date(startDate), months - 1), 'yyyy-MM-dd');

    try {
      await createMutation.mutateAsync({
        description,
        total_amount: parseFloat(totalAmount),
        start_date: startDate,
        end_date: endDate,
        number_of_months: months,
        category_id: categoryId || null,
        expense_account_id: expenseAccountId || null,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes: notes || undefined,
      });

      toast.success('تم إضافة المصروف المقدم بنجاح');
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة المصروف المقدم');
    }
  };

  const handleProcessAll = async () => {
    try {
      const count = await processAllMutation.mutateAsync();
      if (count > 0) {
        toast.success(`تم تنفيذ ${count} قيد إطفاء`);
      } else {
        toast.info('لا توجد أقساط مستحقة للتنفيذ');
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تنفيذ الإطفاءات');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-blue-500">نشط</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">مكتمل</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateProgress = (expense: PrepaidExpense) => {
    return ((expense.amortized_amount / expense.total_amount) * 100).toFixed(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">المصروفات المقدمة</h1>
          <p className="text-muted-foreground">إدارة المصروفات المدفوعة مقدماً مع الإطفاء الشهري</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleProcessAll}
            disabled={processAllMutation.isPending}
          >
            <Play className="h-4 w-4 ml-2" />
            تنفيذ الإطفاءات المستحقة
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مصروف مقدم
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>إضافة مصروف مقدم جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="مثال: إيجار المعرض لسنة 2026"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">المبلغ الإجمالي *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="120000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfMonths">عدد الأشهر *</Label>
                    <Input
                      id="numberOfMonths"
                      type="number"
                      value={numberOfMonths}
                      onChange={(e) => setNumberOfMonths(e.target.value)}
                      min="1"
                      max="60"
                    />
                  </div>
                </div>

                {totalAmount && numberOfMonths && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      القسط الشهري: <span className="font-bold text-foreground">
                        {(parseFloat(totalAmount) / parseInt(numberOfMonths || '1')).toLocaleString()} ر.س
                      </span>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">تاريخ البدء *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">تاريخ الدفع</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseAccount">حساب المصروف (من شجرة الحسابات) *</Label>
                  <Select value={expenseAccountId} onValueChange={setExpenseAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حساب المصروف" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    الحساب الذي سيتم ترحيل المصروف إليه عند الإطفاء
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">التصنيف</Label>
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر التصنيف" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقداً</SelectItem>
                        <SelectItem value="bank">تحويل بنكي</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ملاحظات إضافية..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Banknote className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المصروفات المقدمة</p>
                <p className="text-xl font-bold">
                  {prepaidExpenses
                    .filter(e => e.status === 'active')
                    .reduce((sum, e) => sum + e.total_amount, 0)
                    .toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المُطفأ</p>
                <p className="text-xl font-bold">
                  {prepaidExpenses
                    .reduce((sum, e) => sum + e.amortized_amount, 0)
                    .toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المتبقي</p>
                <p className="text-xl font-bold">
                  {prepaidExpenses
                    .filter(e => e.status === 'active')
                    .reduce((sum, e) => sum + e.remaining_amount, 0)
                    .toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">العدد النشط</p>
                <p className="text-xl font-bold">
                  {prepaidExpenses.filter(e => e.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المصروفات المقدمة</CardTitle>
        </CardHeader>
        <CardContent>
          {prepaidExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد مصروفات مقدمة</p>
              <p className="text-sm">اضغط على "إضافة مصروف مقدم" لإضافة مصروف جديد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الوصف</TableHead>
                  <TableHead>المبلغ الإجمالي</TableHead>
                  <TableHead>القسط الشهري</TableHead>
                  <TableHead>المُطفأ</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>التقدم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prepaidExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(expense.start_date), 'MMM yyyy', { locale: ar })} - {format(new Date(expense.end_date), 'MMM yyyy', { locale: ar })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{expense.total_amount.toLocaleString()} ر.س</TableCell>
                    <TableCell>{expense.monthly_amount.toLocaleString()} ر.س</TableCell>
                    <TableCell className="text-green-600">
                      {expense.amortized_amount.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell className="text-orange-600">
                      {expense.remaining_amount.toLocaleString()} ر.س
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${calculateProgress(expense)}%` }}
                          />
                        </div>
                        <span className="text-xs">{calculateProgress(expense)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <AmortizationDetailsDialog
        expense={selectedExpense}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
}

function AmortizationDetailsDialog({
  expense,
  open,
  onOpenChange,
}: {
  expense: PrepaidExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: amortizations = [] } = usePrepaidExpenseAmortizations(expense?.id || null);
  const processMutation = useProcessAmortization();

  const handleProcess = async (amort: PrepaidExpenseAmortization) => {
    if (!expense) return;

    try {
      await processMutation.mutateAsync({
        amortizationId: amort.id,
        prepaidExpenseId: expense.id,
        amount: amort.amount,
        description: expense.description,
        categoryId: expense.category_id,
        amortizationDate: amort.amortization_date,
        monthNumber: amort.month_number,
      });
      toast.success('تم تنفيذ قيد الإطفاء بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء تنفيذ القيد');
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تفاصيل المصروف المقدم</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">الوصف</p>
              <p className="font-medium">{expense.description}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">المبلغ الإجمالي</p>
              <p className="font-medium">{expense.total_amount.toLocaleString()} ر.س</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ البدء</p>
              <p className="font-medium">{format(new Date(expense.start_date), 'yyyy/MM/dd')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تاريخ الانتهاء</p>
              <p className="font-medium">{format(new Date(expense.end_date), 'yyyy/MM/dd')}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">جدول الإطفاء الشهري</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الشهر</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {amortizations.map((amort) => (
                  <TableRow key={amort.id}>
                    <TableCell>الشهر {amort.month_number}</TableCell>
                    <TableCell>
                      {format(new Date(amort.amortization_date), 'yyyy/MM/dd')}
                    </TableCell>
                    <TableCell>{amort.amount.toLocaleString()} ر.س</TableCell>
                    <TableCell>
                      {amort.status === 'processed' ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          تم التنفيذ
                        </Badge>
                      ) : new Date(amort.amortization_date) <= new Date() ? (
                        <Badge variant="destructive">
                          <Clock className="h-3 w-3 ml-1" />
                          مستحق
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 ml-1" />
                          قادم
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {amort.status === 'pending' && new Date(amort.amortization_date) <= new Date() && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcess(amort)}
                          disabled={processMutation.isPending}
                        >
                          <Play className="h-3 w-3 ml-1" />
                          تنفيذ
                        </Button>
                      )}
                      {amort.status === 'processed' && (
                        <span className="text-xs text-muted-foreground">
                          {amort.processed_at && format(new Date(amort.processed_at), 'yyyy/MM/dd')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
