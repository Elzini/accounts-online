import { useState } from 'react';
import { Plus, Pencil, Trash2, Receipt, FolderOpen, Loader2, Car } from 'lucide-react';
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
import { useExpenses, useExpenseCategories, useAddExpense, useDeleteExpense, useAddExpenseCategory, useCreateDefaultExpenseCategories } from '@/hooks/useExpenses';
import { useCars } from '@/hooks/useDatabase';
import { useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';
import { Expense, ExpenseCategory } from '@/services/expenses';

export function ExpensesPage() {
  const { companyId } = useCompany();
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: categories = [], isLoading: categoriesLoading } = useExpenseCategories();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: cars = [], isLoading: carsLoading } = useCars();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const addCategory = useAddExpenseCategory();
  const createDefaultCategories = useCreateDefaultExpenseCategories();
  
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category_id: '',
    account_id: '',
    car_id: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_number: '',
    notes: ''
  });
  
  // Filter expense accounts (5xxx codes)
  const expenseAccounts = accounts.filter(acc => acc.code.startsWith('5') && acc.code.length === 4);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Filter available cars (only available ones for expense linking)
  const availableCars = cars.filter(car => car.status === 'available');

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.description) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    try {
      await addExpense.mutateAsync({
        company_id: companyId!,
        category_id: expenseForm.category_id || null,
        account_id: expenseForm.account_id || null,
        car_id: expenseForm.car_id || null,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        expense_date: expenseForm.expense_date,
        payment_method: expenseForm.payment_method,
        reference_number: expenseForm.reference_number || null,
        notes: expenseForm.notes || null,
        created_by: null
      });
      toast.success('تم إضافة المصروف بنجاح');
      setIsExpenseDialogOpen(false);
      setExpenseForm({
        category_id: '',
        account_id: '',
        car_id: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        reference_number: '',
        notes: ''
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة المصروف');
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      toast.error('يرجى إدخال اسم الفئة');
      return;
    }

    try {
      await addCategory.mutateAsync({
        company_id: companyId!,
        name: categoryForm.name,
        description: categoryForm.description || null,
        is_active: true
      });
      toast.success('تم إضافة الفئة بنجاح');
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', description: '' });
    } catch (error) {
      toast.error('حدث خطأ أثناء إضافة الفئة');
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await createDefaultCategories.mutateAsync(companyId!);
      toast.success('تم إنشاء الفئات الافتراضية');
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء الفئات');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
      await deleteExpense.mutateAsync(id);
      toast.success('تم حذف المصروف');
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const carExpensesTotal = expenses.filter(exp => exp.car_id).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const generalExpensesTotal = expenses.filter(exp => !exp.car_id).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const thisMonthExpenses = expenses
    .filter(exp => {
      const expDate = new Date(exp.expense_date);
      const now = new Date();
      return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  if (expensesLoading || categoriesLoading || carsLoading || accountsLoading) {
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
                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
              </div>
              <Receipt className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مصروفات السيارات</p>
                <p className="text-2xl font-bold text-orange-500">{formatCurrency(carExpensesTotal)}</p>
              </div>
              <Car className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مصروفات عامة</p>
                <p className="text-2xl font-bold text-blue-500">{formatCurrency(generalExpensesTotal)}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مصروفات هذا الشهر</p>
                <p className="text-2xl font-bold">{formatCurrency(thisMonthExpenses)}</p>
              </div>
              <Receipt className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="categories">الفئات</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">قائمة المصروفات</h2>
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 ml-2" /> إضافة مصروف</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة مصروف جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>حساب المصروفات (من شجرة الحسابات)</Label>
                    <Select value={expenseForm.account_id} onValueChange={(v) => setExpenseForm({...expenseForm, account_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الحساب" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>الفئة (اختياري)</Label>
                    <Select value={expenseForm.category_id} onValueChange={(v) => setExpenseForm({...expenseForm, category_id: v === 'none' ? '' : v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون فئة</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ربط بسيارة (اختياري)</Label>
                    <Select value={expenseForm.car_id} onValueChange={(v) => setExpenseForm({...expenseForm, car_id: v === 'none' ? '' : v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السيارة (للمصروفات المرتبطة)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">مصروف عام (بدون سيارة)</SelectItem>
                        {availableCars.map(car => (
                          <SelectItem key={car.id} value={car.id}>
                            {car.name} - {car.chassis_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      * المصروفات المرتبطة بسيارة تُخصم من ربحها عند البيع
                    </p>
                  </div>
                  <div>
                    <Label>المبلغ *</Label>
                    <Input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>الوصف *</Label>
                    <Input
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                      placeholder="وصف المصروف"
                    />
                  </div>
                  <div>
                    <Label>التاريخ</Label>
                    <Input
                      type="date"
                      value={expenseForm.expense_date}
                      onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>طريقة الدفع</Label>
                    <Select value={expenseForm.payment_method} onValueChange={(v) => setExpenseForm({...expenseForm, payment_method: v})}>
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
                    <Label>ملاحظات</Label>
                    <Textarea
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>
                  <Button onClick={handleAddExpense} className="w-full" disabled={addExpense.isPending}>
                    {addExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                    حفظ المصروف
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحساب</TableHead>
                    <TableHead>الفئة</TableHead>
                    <TableHead>السيارة</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        لا توجد مصروفات مسجلة
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.expense_date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>
                          {expense.account ? (
                            <Badge variant="outline" className="font-mono">
                              {expense.account.code} - {expense.account.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{expense.category?.name || 'بدون فئة'}</Badge>
                        </TableCell>
                        <TableCell>
                          {expense.car ? (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                              <Car className="w-3 h-3 ml-1" />
                              {expense.car.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">عام</span>
                          )}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          {expense.payment_method === 'cash' && 'نقداً'}
                          {expense.payment_method === 'bank' && 'تحويل بنكي'}
                          {expense.payment_method === 'card' && 'بطاقة'}
                          {expense.payment_method === 'check' && 'شيك'}
                        </TableCell>
                        <TableCell className="font-semibold text-destructive">
                          {formatCurrency(Number(expense.amount))}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
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

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-xl font-semibold">فئات المصروفات</h2>
            <div className="flex gap-2">
              {categories.length === 0 && (
                <Button variant="outline" onClick={handleCreateDefaults} disabled={createDefaultCategories.isPending}>
                  إنشاء فئات افتراضية
                </Button>
              )}
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 ml-2" /> إضافة فئة</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة فئة جديدة</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>اسم الفئة *</Label>
                      <Input
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                        placeholder="مثال: إيجار"
                      />
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Textarea
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                        placeholder="وصف الفئة..."
                      />
                    </div>
                    <Button onClick={handleAddCategory} className="w-full" disabled={addCategory.isPending}>
                      حفظ الفئة
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description || 'بدون وصف'}</p>
                    </div>
                    <FolderOpen className="w-6 h-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}