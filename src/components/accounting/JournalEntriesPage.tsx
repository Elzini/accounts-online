import { useState, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useJournalEntries, useAccounts, useCreateJournalEntry, useDeleteJournalEntry, useJournalEntry } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { Loader2, Plus, Eye, Trash2, BookOpen, CalendarIcon, X, Printer, FileDown, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface JournalLine {
  account_id: string;
  account_code?: string;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
  line_date?: string;
  cost_center?: string;
}

export function JournalEntriesPage() {
  const { data: entries = [], isLoading } = useJournalEntries();
  const { data: accounts = [] } = useAccounts();
  const createJournalEntry = useCreateJournalEntry();
  const deleteJournalEntry = useDeleteJournalEntry();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingEntryId, setViewingEntryId] = useState<string | null>(null);
  const { data: viewingEntry } = useJournalEntry(viewingEntryId);
  
  // Form state
  const [entryDate, setEntryDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [notes1, setNotes1] = useState('');
  const [notes2, setNotes2] = useState('');
  const [includeVat, setIncludeVat] = useState(false);
  const [vatType, setVatType] = useState<'sales' | 'purchases'>('purchases');
  const [taxNumber, setTaxNumber] = useState('');
  const [supplierCustomer, setSupplierCustomer] = useState('');
  const [searchAccount, setSearchAccount] = useState('');
  
  const [lines, setLines] = useState<JournalLine[]>([
    { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
    { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
  ]);

  // Filter accounts based on search
  const filteredAccounts = useMemo(() => {
    if (!searchAccount) return accounts;
    const search = searchAccount.toLowerCase();
    return accounts.filter(acc => 
      acc.code.toLowerCase().includes(search) || 
      acc.name.toLowerCase().includes(search)
    );
  }, [accounts, searchAccount]);

  const resetForm = () => {
    setEntryDate(new Date());
    setDescription('');
    setNotes1('');
    setNotes2('');
    setIncludeVat(false);
    setVatType('purchases');
    setTaxNumber('');
    setSupplierCustomer('');
    setSearchAccount('');
    setLines([
      { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
      { account_id: '', description: '', debit: 0, credit: 0, reference: '', line_date: format(new Date(), 'yyyy-MM-dd'), cost_center: '' },
    ]);
  };

  const addLine = () => {
    setLines([...lines, { 
      account_id: '', 
      description: '', 
      debit: 0, 
      credit: 0, 
      reference: '', 
      line_date: format(new Date(), 'yyyy-MM-dd'), 
      cost_center: '' 
    }]);
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
    } else if (field === 'account_id') {
      const account = accounts.find(a => a.id === value);
      newLines[index].account_id = value as string;
      newLines[index].account_code = account?.code;
      newLines[index].account_name = account?.name;
    } else {
      (newLines[index] as any)[field] = value;
    }
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async () => {
    if (!description) {
      toast.error('يرجى إدخال البيان');
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
          description: `${description}${notes1 ? ` | ${notes1}` : ''}${notes2 ? ` | ${notes2}` : ''}`,
          is_posted: true,
          total_debit: totalDebit,
          total_credit: totalCredit,
          reference_type: 'manual',
          reference_id: null,
          created_by: null,
        },
        lines: validLines.map(line => ({
          account_id: line.account_id,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        })),
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

  // Get next entry number
  const nextEntryNumber = entries.length > 0 ? Math.max(...entries.map(e => e.entry_number)) + 1 : 1;

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
          <p className="text-muted-foreground">إدارة القيود المحاسبية اليدوية والتلقائية</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              قيد يومية جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl">قيد يومية</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Header Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">رقم السند</Label>
                  <Input 
                    value={nextEntryNumber} 
                    disabled 
                    className="bg-primary/10 font-bold text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">التاريخ</Label>
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
                        {entryDate ? format(entryDate, "yyyy-MM-dd") : "اختر التاريخ"}
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
                  <Label className="text-sm font-medium">رقم القيد</Label>
                  <Input 
                    value={nextEntryNumber} 
                    disabled 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">سند دوري</Label>
                  <Select defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون</SelectItem>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="quarterly">ربع سنوي</SelectItem>
                      <SelectItem value="yearly">سنوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">البيان *</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="وصف القيد المحاسبي..."
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">ملاحظة 1</Label>
                    <Input
                      value={notes1}
                      onChange={(e) => setNotes1(e.target.value)}
                      placeholder="ملاحظة إضافية"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">ملاحظة 2</Label>
                    <Input
                      value={notes2}
                      onChange={(e) => setNotes2(e.target.value)}
                      placeholder="ملاحظة إضافية"
                    />
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-2 flex items-center gap-2 border-b">
                  <Button variant="outline" size="sm" onClick={addLine}>
                    <Plus className="w-4 h-4 ml-1" />
                    سطر جديد
                  </Button>
                  <div className="flex-1" />
                  <div className="relative">
                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchAccount}
                      onChange={(e) => setSearchAccount(e.target.value)}
                      placeholder="بحث في الحسابات..."
                      className="pr-8 w-48"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="w-24">الحساب</TableHead>
                        <TableHead className="min-w-[180px]">اسم الحساب</TableHead>
                        <TableHead className="w-28">مدين</TableHead>
                        <TableHead className="w-28">دائن</TableHead>
                        <TableHead className="min-w-[140px]">البيان</TableHead>
                        <TableHead className="w-28">المرجع</TableHead>
                        <TableHead className="w-32">التاريخ</TableHead>
                        <TableHead className="w-28">مركز التكلفة</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={index} className="hover:bg-muted/20">
                          <TableCell className="text-center font-medium text-muted-foreground">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={line.account_id}
                              onValueChange={(value) => updateLine(index, 'account_id', value)}
                            >
                              <SelectTrigger className="w-full font-mono text-sm">
                                <SelectValue placeholder="الكود" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.account_name || ''}
                              readOnly
                              className="bg-muted/30 text-sm"
                              placeholder="اسم الحساب"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={line.debit || ''}
                              onChange={(e) => updateLine(index, 'debit', e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={line.credit || ''}
                              onChange={(e) => updateLine(index, 'credit', e.target.value)}
                              placeholder="0"
                              className="text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              placeholder="البيان"
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.reference || ''}
                              onChange={(e) => updateLine(index, 'reference', e.target.value)}
                              placeholder="المرجع"
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={line.line_date || ''}
                              onChange={(e) => updateLine(index, 'line_date', e.target.value)}
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.cost_center || ''}
                              onChange={(e) => updateLine(index, 'cost_center', e.target.value)}
                              placeholder="م.تكلفة"
                              className="text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            {lines.length > 2 && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeLine(index)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* VAT Section */}
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="include-vat" 
                      checked={includeVat}
                      onCheckedChange={(checked) => setIncludeVat(!!checked)}
                    />
                    <Label htmlFor="include-vat" className="text-sm cursor-pointer">إضافة قيد الضريبة</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="vat-enabled" 
                      checked={includeVat}
                      onCheckedChange={(checked) => setIncludeVat(!!checked)}
                    />
                    <Label htmlFor="vat-enabled" className="text-sm cursor-pointer">تسجيل الضريبة</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">العميل/المورد</Label>
                    <Input
                      value={supplierCustomer}
                      onChange={(e) => setSupplierCustomer(e.target.value)}
                      placeholder="اسم العميل أو المورد"
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">الرقم الضريبي</Label>
                    <Input
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="الرقم الضريبي"
                      className="w-40"
                    />
                  </div>
                  <Select value={vatType} onValueChange={(v) => setVatType(v as 'sales' | 'purchases')}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchases">مشتريات بالنسبة الأساسية</SelectItem>
                      <SelectItem value="sales">مبيعات بالنسبة الأساسية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Totals Section */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <Label className="text-sm text-muted-foreground">إجمالي المدين</Label>
                    <p className="text-xl font-bold text-primary">{totalDebit.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">إجمالي الدائن</Label>
                    <p className="text-xl font-bold text-primary">{totalCredit.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">الفرق</Label>
                    <p className={cn(
                      "text-xl font-bold",
                      difference === 0 ? "text-green-600" : "text-destructive"
                    )}>
                      {difference.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">الحالة</Label>
                    <div className="mt-1">
                      {isBalanced ? (
                        <Badge className="bg-green-500">القيد متوازن ✓</Badge>
                      ) : (
                        <Badge variant="destructive">القيد غير متوازن</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    خروج
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Printer className="w-4 h-4 ml-2" />
                    طباعة
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    جديد
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={createJournalEntry.isPending || !isBalanced}
                    className="min-w-[120px]"
                  >
                    {createJournalEntry.isPending ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : null}
                    اعتماد
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Entry Dialog */}
      <Dialog open={!!viewingEntryId} onOpenChange={(open) => !open && setViewingEntryId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>تفاصيل القيد #{viewingEntry?.entry_number}</DialogTitle>
            <DialogDescription>
              {viewingEntry && format(new Date(viewingEntry.entry_date), "PPP", { locale: ar })}
            </DialogDescription>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-foreground font-medium">{viewingEntry.description}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحساب</TableHead>
                    <TableHead>البيان</TableHead>
                    <TableHead className="text-center">مدين</TableHead>
                    <TableHead className="text-center">دائن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewingEntry.lines?.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono">{getAccountName(line.account_id)}</TableCell>
                      <TableCell>{line.description || '-'}</TableCell>
                      <TableCell className="text-center">{line.debit > 0 ? line.debit.toLocaleString() : '-'}</TableCell>
                      <TableCell className="text-center">{line.credit > 0 ? line.credit.toLocaleString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2}>الإجمالي</TableCell>
                    <TableCell className="text-center">{viewingEntry.total_debit.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{viewingEntry.total_credit.toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewingEntryId(null)}>
                  إغلاق
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 ml-2" />
                  طباعة
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            القيود المحاسبية
          </CardTitle>
          <CardDescription>جميع القيود المسجلة في دفتر اليومية - يدوية وتلقائية</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>لا توجد قيود مسجلة</p>
              <p className="text-sm">اضغط على "قيد يومية جديد" لإنشاء قيد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">الرقم</TableHead>
                  <TableHead className="w-28">التاريخ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead className="w-20">النوع</TableHead>
                  <TableHead className="w-28 text-center">المدين</TableHead>
                  <TableHead className="w-28 text-center">الدائن</TableHead>
                  <TableHead className="w-24">الحالة</TableHead>
                  <TableHead className="w-24">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono font-bold">{entry.entry_number}</TableCell>
                    <TableCell>{format(new Date(entry.entry_date), "yyyy/MM/dd")}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                    <TableCell>
                      <Badge variant={entry.reference_type === 'manual' ? 'outline' : 'secondary'}>
                        {entry.reference_type === 'manual' ? 'يدوي' : 
                         entry.reference_type === 'sale' ? 'مبيعات' :
                         entry.reference_type === 'purchase' ? 'مشتريات' :
                         entry.reference_type === 'expense' ? 'مصروفات' : 'تلقائي'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{entry.total_debit.toLocaleString()}</TableCell>
                    <TableCell className="text-center font-medium">{entry.total_credit.toLocaleString()}</TableCell>
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
                                هل أنت متأكد من حذف القيد رقم {entry.entry_number}؟ لا يمكن التراجع عن هذا الإجراء.
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
