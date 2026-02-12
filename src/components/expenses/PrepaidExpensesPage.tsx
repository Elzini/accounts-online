import React, { useState, useMemo, useEffect } from 'react';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { Plus, Eye, Clock, CheckCircle, XCircle, Play, Calendar, Banknote, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { usePrepaidExpenses, usePrepaidExpenseAmortizations, useCreatePrepaidExpense, useUpdatePrepaidExpense, useDeletePrepaidExpense, useProcessAmortization, useProcessAllDueAmortizations } from '@/hooks/usePrepaidExpenses';
import { useExpenseCategories } from '@/hooks/useExpenses';
import { useAccounts } from '@/hooks/useAccounting';
import { PrepaidExpense, PrepaidExpenseAmortization } from '@/services/prepaidExpenses';
import { AccountSearchSelect } from '@/components/accounting/AccountSearchSelect';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PrepaidExpensesPage() {
  const { t } = useLanguage();
  const { data: prepaidExpenses = [], isLoading } = usePrepaidExpenses();
  const { data: categories = [] } = useExpenseCategories();
  const { data: accounts = [] } = useAccounts();
  const createMutation = useCreatePrepaidExpense();
  const updateMutation = useUpdatePrepaidExpense();
  const deleteMutation = useDeletePrepaidExpense();
  const processAllMutation = useProcessAllDueAmortizations();
  
  const expenseAccounts = useMemo(() => accounts.filter(acc => acc.code.startsWith('5') && acc.code.length === 4), [accounts]);
  const prepaidAssetAccounts = useMemo(() => accounts.filter(acc => acc.code.startsWith('13') && acc.code.length === 4), [accounts]);
  const cashBankAccounts = useMemo(() => accounts.filter(acc => acc.code.startsWith('11') && acc.code.length === 4), [accounts]);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<PrepaidExpense | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [numberOfMonths, setNumberOfMonths] = useState('12');
  const [categoryId, setCategoryId] = useState('');
  const [expenseAccountId, setExpenseAccountId] = useState('');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const resetForm = () => { setDescription(''); setTotalAmount(''); setStartDate(format(new Date(), 'yyyy-MM-dd')); setNumberOfMonths('12'); setCategoryId(''); setExpenseAccountId(''); setDebitAccountId(''); setPaymentAccountId(''); setPaymentDate(format(new Date(), 'yyyy-MM-dd')); setPaymentMethod('cash'); setNotes(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !totalAmount || !startDate || !numberOfMonths || !expenseAccountId || !debitAccountId || !paymentAccountId) { toast.error(t.fill_required); return; }
    const months = parseInt(numberOfMonths);
    const endDate = format(addMonths(new Date(startDate), months - 1), 'yyyy-MM-dd');
    try {
      await createMutation.mutateAsync({ description, total_amount: parseFloat(totalAmount), start_date: startDate, end_date: endDate, number_of_months: months, category_id: categoryId || null, expense_account_id: expenseAccountId || null, prepaid_asset_account_id: debitAccountId, payment_account_id: paymentAccountId, payment_date: paymentDate, payment_method: paymentMethod, notes: notes || undefined });
      toast.success(t.success); setShowAddDialog(false); resetForm();
    } catch (error) { toast.error(t.error_occurred); }
  };

  const handleProcessAll = async () => {
    try { const count = await processAllMutation.mutateAsync(); if (count > 0) { toast.success(`${count} processed`); } else { toast.info(t.no_data); } } catch (error) { toast.error(t.error_occurred); }
  };

  const handleEdit = (expense: PrepaidExpense) => {
    setSelectedExpense(expense); setDescription(expense.description); setTotalAmount(expense.total_amount.toString()); setStartDate(expense.start_date); setNumberOfMonths(expense.number_of_months.toString()); setCategoryId(expense.category_id || ''); setPaymentDate(expense.payment_date); setPaymentMethod(expense.payment_method || 'cash'); setNotes(expense.notes || ''); setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedExpense) return;
    try { await updateMutation.mutateAsync({ id: selectedExpense.id, updates: { description, total_amount: parseFloat(totalAmount), number_of_months: parseInt(numberOfMonths), monthly_amount: parseFloat(totalAmount) / parseInt(numberOfMonths), category_id: categoryId || null, payment_date: paymentDate, payment_method: paymentMethod, notes: notes || null } }); toast.success(t.success); setShowEditDialog(false); resetForm(); setSelectedExpense(null); } catch (error) { toast.error(t.error_occurred); }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try { await deleteMutation.mutateAsync(selectedExpense.id); toast.success(t.success); setShowDeleteDialog(false); setSelectedExpense(null); } catch (error) { toast.error(t.error_occurred); }
  };

  const openDeleteDialog = (expense: PrepaidExpense) => { setSelectedExpense(expense); setShowDeleteDialog(true); };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default" className="bg-blue-500">{t.active_status}</Badge>;
      case 'completed': return <Badge variant="default" className="bg-green-500">{t.approved_status}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{t.cancelled_status}</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculateProgress = (expense: PrepaidExpense) => ((expense.amortized_amount / expense.total_amount) * 100).toFixed(0);

  if (isLoading) { return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>; }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-2xl font-bold">{t.prepaid_expenses_title}</h1><p className="text-muted-foreground">{t.prepaid_expenses_subtitle}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleProcessAll} disabled={processAllMutation.isPending}><Play className="h-4 w-4 ml-2" />{t.process_due_amortizations}</Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 ml-2" />{t.add_prepaid_expense}</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{t.add_prepaid_expense}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label>{t.description} *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.amount} *</Label><Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} /></div>
                  <div className="space-y-2"><Label>{t.number_of_months} *</Label><Input type="number" value={numberOfMonths} onChange={(e) => setNumberOfMonths(e.target.value)} min="1" max="60" /></div>
                </div>
                {totalAmount && numberOfMonths && <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">{t.monthly_installment}: <span className="font-bold text-foreground">{(parseFloat(totalAmount) / parseInt(numberOfMonths || '1')).toLocaleString()} {t.riyal}</span></p></div>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.start_date_label} *</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>{t.date}</Label><Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>{t.expense_account_amort} *</Label><AccountSearchSelect accounts={expenseAccounts} value={expenseAccountId} onChange={setExpenseAccountId} placeholder={t.search + '...'} /></div>
                <div className="space-y-2"><Label>{t.prepaid_asset_account} *</Label><AccountSearchSelect accounts={prepaidAssetAccounts} value={debitAccountId} onChange={setDebitAccountId} placeholder={t.search + '...'} /></div>
                <div className="space-y-2"><Label>{t.payment_account} *</Label><AccountSearchSelect accounts={cashBankAccounts} value={paymentAccountId} onChange={setPaymentAccountId} placeholder={t.search + '...'} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.classification}</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue placeholder={t.classification} /></SelectTrigger><SelectContent>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>{t.payment_method_label}</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">{t.cash_payment}</SelectItem><SelectItem value="bank">{t.bank_payment}</SelectItem><SelectItem value="check">{t.check_payment}</SelectItem></SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>{t.notes}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
                <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>{t.cancel}</Button><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? t.btn_saving : t.save}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Banknote className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">{t.total_prepaid}</p><p className="text-xl font-bold">{prepaidExpenses.filter(e => e.status === 'active').reduce((sum, e) => sum + e.total_amount, 0).toLocaleString()} {t.riyal}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">{t.amortized_amount}</p><p className="text-xl font-bold">{prepaidExpenses.reduce((sum, e) => sum + e.amortized_amount, 0).toLocaleString()} {t.riyal}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-orange-100 rounded-lg"><Clock className="h-5 w-5 text-orange-600" /></div><div><p className="text-sm text-muted-foreground">{t.remaining_amount_label}</p><p className="text-xl font-bold">{prepaidExpenses.filter(e => e.status === 'active').reduce((sum, e) => sum + e.remaining_amount, 0).toLocaleString()} {t.riyal}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><Calendar className="h-5 w-5 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">{t.active_count}</p><p className="text-xl font-bold">{prepaidExpenses.filter(e => e.status === 'active').length}</p></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t.prepaid_list}</CardTitle></CardHeader>
        <CardContent>
          {prepaidExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t.no_data}</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t.description}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{t.monthly_installment}</TableHead>
                <TableHead>{t.amortized_amount}</TableHead><TableHead>{t.remaining_amount_label}</TableHead><TableHead>{t.progress_label}</TableHead>
                <TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {prepaidExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell><div><p className="font-medium">{expense.description}</p><p className="text-xs text-muted-foreground">{format(new Date(expense.start_date), 'MMM yyyy', { locale: arLocale })} - {format(new Date(expense.end_date), 'MMM yyyy', { locale: arLocale })}</p></div></TableCell>
                    <TableCell>{expense.total_amount.toLocaleString()} {t.riyal}</TableCell>
                    <TableCell>{expense.monthly_amount.toLocaleString()} {t.riyal}</TableCell>
                    <TableCell className="text-green-600">{expense.amortized_amount.toLocaleString()} {t.riyal}</TableCell>
                    <TableCell className="text-orange-600">{expense.remaining_amount.toLocaleString()} {t.riyal}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="w-20 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${calculateProgress(expense)}%` }} /></div><span className="text-xs">{calculateProgress(expense)}%</span></div></TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => { setSelectedExpense(expense); setShowDetailsDialog(true); }}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => openDeleteDialog(expense)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AmortizationDetailsDialog expense={selectedExpense} open={showDetailsDialog} onOpenChange={setShowDetailsDialog} />

      <Dialog open={showEditDialog} onOpenChange={(open) => { setShowEditDialog(open); if (!open) { resetForm(); setSelectedExpense(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t.edit}</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2"><Label>{t.description} *</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t.amount} *</Label><Input type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t.number_of_months} *</Label><Input type="number" value={numberOfMonths} onChange={(e) => setNumberOfMonths(e.target.value)} min="1" max="60" /></div>
            </div>
            {totalAmount && numberOfMonths && <div className="p-3 bg-muted rounded-lg"><p className="text-sm text-muted-foreground">{t.monthly_installment}: <span className="font-bold text-foreground">{(parseFloat(totalAmount) / parseInt(numberOfMonths || '1')).toLocaleString()} {t.riyal}</span></p></div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t.classification}</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>{t.payment_method_label}</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">{t.cash_payment}</SelectItem><SelectItem value="bank">{t.bank_payment}</SelectItem><SelectItem value="check">{t.check_payment}</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>{t.notes}</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={() => { setShowEditDialog(false); resetForm(); setSelectedExpense(null); }}>{t.cancel}</Button><Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? t.btn_saving : t.save_changes}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t.confirm_delete}</AlertDialogTitle><AlertDialogDescription>{t.confirm_delete_desc}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="gap-2"><AlertDialogCancel onClick={() => { setShowDeleteDialog(false); setSelectedExpense(null); }}>{t.cancel}</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>{deleteMutation.isPending ? t.btn_saving : t.delete}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AmortizationDetailsDialog({ expense, open, onOpenChange }: { expense: PrepaidExpense | null; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { t } = useLanguage();
  const { data: amortizations = [] } = usePrepaidExpenseAmortizations(expense?.id || null);
  const processMutation = useProcessAmortization();

  const handleProcess = async (amort: PrepaidExpenseAmortization) => {
    if (!expense) return;
    try { await processMutation.mutateAsync({ amortizationId: amort.id, prepaidExpenseId: expense.id, amount: amort.amount, description: expense.description, categoryId: expense.category_id, amortizationDate: amort.amortization_date, monthNumber: amort.month_number }); toast.success(t.success); } catch (error) { toast.error(t.error_occurred); }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{t.details}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div><p className="text-sm text-muted-foreground">{t.description}</p><p className="font-medium">{expense.description}</p></div>
            <div><p className="text-sm text-muted-foreground">{t.amount}</p><p className="font-medium">{expense.total_amount.toLocaleString()} {t.riyal}</p></div>
            <div><p className="text-sm text-muted-foreground">{t.start_date_label}</p><p className="font-medium">{format(new Date(expense.start_date), 'yyyy/MM/dd')}</p></div>
            <div><p className="text-sm text-muted-foreground">{t.date}</p><p className="font-medium">{format(new Date(expense.end_date), 'yyyy/MM/dd')}</p></div>
          </div>
          <div>
            <Table>
              <TableHeader><TableRow><TableHead>#</TableHead><TableHead>{t.date}</TableHead><TableHead>{t.amount}</TableHead><TableHead>{t.status}</TableHead><TableHead>{t.actions}</TableHead></TableRow></TableHeader>
              <TableBody>
                {amortizations.map((amort) => (
                  <TableRow key={amort.id}>
                    <TableCell>{amort.month_number}</TableCell>
                    <TableCell>{format(new Date(amort.amortization_date), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>{amort.amount.toLocaleString()} {t.riyal}</TableCell>
                    <TableCell>
                      {amort.status === 'processed' ? <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 ml-1" />{t.approved_status}</Badge> : new Date(amort.amortization_date) <= new Date() ? <Badge variant="destructive"><Clock className="h-3 w-3 ml-1" />{t.pending_status}</Badge> : <Badge variant="secondary"><Clock className="h-3 w-3 ml-1" />{t.pending_status}</Badge>}
                    </TableCell>
                    <TableCell>
                      {amort.status === 'pending' && new Date(amort.amortization_date) <= new Date() && <Button size="sm" variant="outline" onClick={() => handleProcess(amort)} disabled={processMutation.isPending}><Play className="h-3 w-3 ml-1" />{t.approve}</Button>}
                      {amort.status === 'processed' && <span className="text-xs text-muted-foreground">{amort.processed_at && format(new Date(amort.processed_at), 'yyyy/MM/dd')}</span>}
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
