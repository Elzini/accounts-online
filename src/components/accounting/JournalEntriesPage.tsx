import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useJournalEntries, useAccounts, useCreateJournalEntry, useDeleteJournalEntry, useJournalEntry } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { Loader2, Plus, Eye, Trash2, BookOpen, CalendarIcon, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface JournalLine {
  account_id: string;
  description: string;
  debit: number;
  credit: number;
}

export function JournalEntriesPage() {
  const { data: entries = [], isLoading } = useJournalEntries();
  const { data: accounts = [] } = useAccounts();
  const createJournalEntry = useCreateJournalEntry();
  const deleteJournalEntry = useDeleteJournalEntry();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const { data: viewingEntry } = useJournalEntry(viewingEntryId);
  
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([
    { account_id: '', description: '', debit: 0, credit: 0 },
    { account_id: '', description: '', debit: 0, credit: 0 },
  ]);

  const resetForm = () => {
    setEntryDate(new Date());
    setDescription('');
    setLines([
      { account_id: '', description: '', debit: 0, credit: 0 },
      { account_id: '', description: '', debit: 0, credit: 0 },
    ]);
  };

  const addLine = () => {
    setLines([...lines, { account_id: '', description: '', debit: 0, credit: 0 }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string | number) => {
    const newLines = [...lines];
    if (field === 'debit' || field === 'credit') {
      newLines[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    } else {
      newLines[index][field] = value as string;
    }
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async () => {
    if (!description) {
      toast.error('يرجى إدخال وصف القيد');
      return;
    }

    const validLines = lines.filter(line => line.account_id && (line.debit > 0 || line.credit > 0));
    if (validLines.length < 2) {
      toast.error('يجب إضافة حسابين على الأقل');
      return;
    }

    if (!isBalanced) {
      toast.error('مجموع المدين يجب أن يساوي مجموع الدائن');
      return;
    }

    try {
      await createJournalEntry.mutateAsync({
        entry: {
          entry_date: format(entryDate, 'yyyy-MM-dd'),
          description,
          is_posted: true,
          total_debit: totalDebit,
          total_credit: totalCredit,
          reference_type: 'manual',
          reference_id: null,
          created_by: null,
        },
        lines: validLines,
      });
      toast.success('تم إنشاء القيد بنجاح');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('حدث خطأ أثناء إنشاء القيد');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry.mutateAsync(id);
      toast.success('تم حذف القيد بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حذف القيد');
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">دفتر اليومية</h1>
          <p className="text-muted-foreground">إدارة القيود المحاسبية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              قيد جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إضافة قيد يومية</DialogTitle>
              <DialogDescription>إنشاء قيد محاسبي جديد</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label>تاريخ القيد</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right font-normal",
                          !entryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {entryDate ? format(entryDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={entryDate}
                        onSelect={(date) => date && setEntryDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف *</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف القيد"
                  />
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">الحساب</TableHead>
                      <TableHead>البيان</TableHead>
                      <TableHead className="w-[120px]">مدين</TableHead>
                      <TableHead className="w-[120px]">دائن</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={line.account_id}
                            onValueChange={(value) => updateLine(index, 'account_id', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="اختر الحساب" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                            placeholder="البيان"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(index, 'debit', e.target.value)}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(index, 'credit', e.target.value)}
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell>
                          {lines.length > 2 && (
                            <Button variant="ghost" size="icon" onClick={() => removeLine(index)}>
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell colSpan={2} className="text-left font-bold">الإجمالي</TableCell>
                      <TableCell className="font-bold">{totalDebit.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">{totalCredit.toLocaleString()}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={addLine}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة سطر
                </Button>
                {!isBalanced && totalDebit + totalCredit > 0 && (
                  <Badge variant="destructive">القيد غير متوازن</Badge>
                )}
                {isBalanced && (
                  <Badge variant="default" className="bg-green-500">القيد متوازن</Badge>
                )}
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={createJournalEntry.isPending || !isBalanced}
              >
                {createJournalEntry.isPending ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : null}
                حفظ القيد
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Entry Dialog */}
      <Dialog open={!!viewingEntryId} onOpenChange={(open) => !open && setViewingEntryId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل القيد #{viewingEntry?.entry_number}</DialogTitle>
            <DialogDescription>
              {viewingEntry && format(new Date(viewingEntry.entry_date), "PPP", { locale: ar })}
            </DialogDescription>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-4">
              <p className="text-foreground">{viewingEntry.description}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحساب</TableHead>
                    <TableHead>البيان</TableHead>
                    <TableHead>مدين</TableHead>
                    <TableHead>دائن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingEntry.lines?.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>{getAccountName(line.account_id)}</TableCell>
                      <TableCell>{line.description || '-'}</TableCell>
                      <TableCell>{line.debit > 0 ? line.debit.toLocaleString() : '-'}</TableCell>
                      <TableCell>{line.credit > 0 ? line.credit.toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>الإجمالي</TableCell>
                    <TableCell>{viewingEntry.total_debit.toLocaleString()}</TableCell>
                    <TableCell>{viewingEntry.total_credit.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            القيود المحاسبية
          </CardTitle>
          <CardDescription>جميع القيود المسجلة في دفتر اليومية</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد قيود مسجلة</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">الرقم</TableHead>
                  <TableHead className="w-32">التاريخ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead className="w-28">المدين</TableHead>
                  <TableHead className="w-28">الدائن</TableHead>
                  <TableHead className="w-24">الحالة</TableHead>
                  <TableHead className="w-24">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.entry_number}</TableCell>
                    <TableCell>{format(new Date(entry.entry_date), "yyyy/MM/dd")}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>{entry.total_debit.toLocaleString()}</TableCell>
                    <TableCell>{entry.total_credit.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={entry.is_posted ? "default" : "secondary"}>
                        {entry.is_posted ? 'مُرحّل' : 'مسودة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingEntryId(entry.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من حذف هذا القيد؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
