import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Receipt, FolderOpen, Loader2, Car, FileCheck } from 'lucide-react';
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
import { useFiscalYearFilter } from '@/hooks/useFiscalYearFilter';
import { useIndustryLabels } from '@/hooks/useIndustryLabels';
import { useLanguage } from '@/contexts/LanguageContext';

export function ExpensesPage() {
  const { t } = useLanguage();
  const { companyId } = useCompany();
  const { filterByFiscalYear } = useFiscalYearFilter();
  const labels = useIndustryLabels();
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
    category_id: '', account_id: '', car_id: '', amount: '', description: '',
    expense_date: new Date().toISOString().split('T')[0], payment_method: 'cash',
    reference_number: '', notes: '', has_vat_invoice: false
  });
  
  const expenseAccounts = accounts.filter(acc => acc.code.startsWith('5') && acc.code.length === 4);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const availableCars = cars.filter(car => car.status === 'available');

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.description) { toast.error(t.fill_required); return; }
    try {
      await addExpense.mutateAsync({
        company_id: companyId!, category_id: expenseForm.category_id || null, account_id: expenseForm.account_id || null,
        car_id: expenseForm.car_id || null, amount: parseFloat(expenseForm.amount), description: expenseForm.description,
        expense_date: expenseForm.expense_date, payment_method: expenseForm.payment_method,
        reference_number: expenseForm.reference_number || null, notes: expenseForm.notes || null,
        created_by: null, has_vat_invoice: expenseForm.has_vat_invoice
      });
      toast.success(t.expense_added);
      setIsExpenseDialogOpen(false);
      setExpenseForm({ category_id: '', account_id: '', car_id: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0], payment_method: 'cash', reference_number: '', notes: '', has_vat_invoice: false });
    } catch (error) { toast.error(t.error_occurred); }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name) { toast.error(t.fill_required); return; }
    try {
      await addCategory.mutateAsync({ company_id: companyId!, name: categoryForm.name, description: categoryForm.description || null, is_active: true });
      toast.success(t.success);
      setIsCategoryDialogOpen(false);
      setCategoryForm({ name: '', description: '' });
    } catch (error) { toast.error(t.error_occurred); }
  };

  const handleCreateDefaults = async () => {
    try { await createDefaultCategories.mutateAsync(companyId!); toast.success(t.success); } catch (error) { toast.error(t.error_occurred); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(t.confirm_delete)) return;
    try { await deleteExpense.mutateAsync(id); toast.success(t.expense_deleted); } catch (error) { toast.error(t.error_occurred); }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);

  const filteredExpenses = useMemo(() => filterByFiscalYear(expenses, 'expense_date'), [expenses, filterByFiscalYear]);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const carExpensesTotal = filteredExpenses.filter(exp => exp.car_id).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const generalExpensesTotal = filteredExpenses.filter(exp => !exp.car_id).reduce((sum, exp) => sum + Number(exp.amount), 0);
  const thisMonthExpenses = filteredExpenses.filter(exp => { const d = new Date(exp.expense_date); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).reduce((sum, exp) => sum + Number(exp.amount), 0);

  if (expensesLoading || categoriesLoading || carsLoading || accountsLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.total_expenses}</p><p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p></div><Receipt className="w-8 h-8 text-destructive" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.car_expenses}</p><p className="text-2xl font-bold text-orange-500">{formatCurrency(carExpensesTotal)}</p></div><Car className="w-8 h-8 text-orange-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.general_expenses}</p><p className="text-2xl font-bold text-blue-500">{formatCurrency(generalExpensesTotal)}</p></div><Receipt className="w-8 h-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">{t.this_month_expenses}</p><p className="text-2xl font-bold">{formatCurrency(thisMonthExpenses)}</p></div><Receipt className="w-8 h-8 text-warning" /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList>
          <TabsTrigger value="expenses">{t.expenses_tab}</TabsTrigger>
          <TabsTrigger value="categories">{t.categories_tab}</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t.expenses_list}</h2>
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" /> {t.add_expense}</Button></DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{t.add_new_expense}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t.expense_account}</Label>
                    <Select value={expenseForm.account_id} onValueChange={(v) => setExpenseForm({...expenseForm, account_id: v})}>
                      <SelectTrigger><SelectValue placeholder={t.form_select_car} /></SelectTrigger>
                      <SelectContent>{expenseAccounts.map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.category_optional}</Label>
                    <Select value={expenseForm.category_id} onValueChange={(v) => setExpenseForm({...expenseForm, category_id: v === 'none' ? '' : v})}>
                      <SelectTrigger><SelectValue placeholder={t.category_optional} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t.no_category}</SelectItem>
                        {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.link_to_car}</Label>
                    <Select value={expenseForm.car_id} onValueChange={(v) => setExpenseForm({...expenseForm, car_id: v === 'none' ? '' : v})}>
                      <SelectTrigger><SelectValue placeholder={t.general_expense} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{t.general_expense}</SelectItem>
                        {availableCars.map(car => (<SelectItem key={car.id} value={car.id}>{car.name} - {car.chassis_number}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">* {t.car_expense_note}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label>{expenseForm.has_vat_invoice ? t.base_amount_before_tax + ' *' : t.amount + ' *'}</Label>
                      <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} placeholder="0.00" />
                    </div>
                    {expenseForm.has_vat_invoice && expenseForm.amount && (
                      <div className="grid grid-cols-2 gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div><Label className="text-green-700 dark:text-green-300 text-xs">{t.vat_15}</Label><div className="text-lg font-bold text-green-600 dark:text-green-400">{new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(parseFloat(expenseForm.amount) * 0.15)}</div></div>
                        <div><Label className="text-green-700 dark:text-green-300 text-xs">{t.total_with_tax}</Label><div className="text-lg font-bold text-green-600 dark:text-green-400">{new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(parseFloat(expenseForm.amount) * 1.15)}</div></div>
                      </div>
                    )}
                  </div>
                  <div><Label>{t.description} *</Label><Input value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} placeholder={t.expense_description} /></div>
                  <div><Label>{t.date}</Label><Input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})} /></div>
                  <div>
                    <Label>{t.payment_method_label}</Label>
                    <Select value={expenseForm.payment_method} onValueChange={(v) => setExpenseForm({...expenseForm, payment_method: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">{t.cash_payment}</SelectItem>
                        <SelectItem value="bank">{t.bank_payment}</SelectItem>
                        <SelectItem value="card">{t.card_payment}</SelectItem>
                        <SelectItem value="check">{t.check_payment}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <input type="checkbox" id="has_vat_invoice" checked={expenseForm.has_vat_invoice} onChange={(e) => setExpenseForm({...expenseForm, has_vat_invoice: e.target.checked})} className="w-5 h-5 rounded border-blue-300" />
                    <div>
                      <Label htmlFor="has_vat_invoice" className="text-blue-700 dark:text-blue-300 font-medium cursor-pointer">{t.has_vat_invoice}</Label>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{t.vat_invoice_desc}</p>
                    </div>
                  </div>
                  <div><Label>{t.notes}</Label><Textarea value={expenseForm.notes} onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})} placeholder={t.additional_notes} /></div>
                  <Button onClick={handleAddExpense} className="w-full" disabled={addExpense.isPending}>
                    {addExpense.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}{t.save_expense}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t.date}</TableHead><TableHead>{t.accounting_account}</TableHead><TableHead>{t.categories_tab}</TableHead>
                  <TableHead>{labels.itemName}</TableHead><TableHead>{t.description}</TableHead><TableHead>{t.payment_method_label}</TableHead>
                  <TableHead>{t.has_vat_invoice}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{t.actions}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t.no_data}</TableCell></TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{new Date(expense.expense_date).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>{expense.account ? <Badge variant="outline" className="font-mono">{expense.account.code} - {expense.account.name}</Badge> : <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell><Badge variant="secondary">{expense.category?.name || t.no_category}</Badge></TableCell>
                        <TableCell>{expense.car ? <Badge variant="secondary" className="bg-orange-100 text-orange-700"><Car className="w-3 h-3 ml-1" />{expense.car.name}</Badge> : <span className="text-muted-foreground">{t.general_expense}</span>}</TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          {expense.payment_method === 'cash' && t.cash_payment}
                          {expense.payment_method === 'bank' && t.bank_payment}
                          {expense.payment_method === 'card' && t.card_payment}
                          {expense.payment_method === 'check' && t.check_payment}
                        </TableCell>
                        <TableCell>{expense.has_vat_invoice ? <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"><FileCheck className="w-3 h-3 ml-1" />{t.yes}</Badge> : <span className="text-muted-foreground">{t.no}</span>}</TableCell>
                        <TableCell className="font-semibold text-destructive">{formatCurrency(Number(expense.amount))}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
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
            <h2 className="text-xl font-semibold">{t.categories_tab}</h2>
            <div className="flex gap-2">
              {categories.length === 0 && <Button variant="outline" onClick={handleCreateDefaults} disabled={createDefaultCategories.isPending}>{t.create_defaults}</Button>}
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild><Button><Plus className="w-4 h-4 ml-2" /> {t.add_category}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>{t.add_category}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>{t.category_name} *</Label><Input value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} /></div>
                    <div><Label>{t.description}</Label><Textarea value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} /></div>
                    <Button onClick={handleAddCategory} className="w-full" disabled={addCategory.isPending}>{t.save}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}><CardContent className="pt-6"><div className="flex items-center justify-between"><div><h3 className="font-semibold">{category.name}</h3><p className="text-sm text-muted-foreground">{category.description || t.no_data}</p></div><FolderOpen className="w-6 h-6 text-muted-foreground" /></div></CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
