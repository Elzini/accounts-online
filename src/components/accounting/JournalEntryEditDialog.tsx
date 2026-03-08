import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useJournalEntry, useAccounts, useUpdateJournalEntry } from '@/hooks/useAccounting';
import { AccountSearchSelect } from './AccountSearchSelect';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, Eye, Pencil, AlertCircle } from 'lucide-react';
import { JournalAttachments } from './JournalAttachments';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface JournalLine {
  id?: string;
  account_id: string;
  account_code?: string;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
}

interface JournalEntryEditDialogProps {
  entryId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  referenceType?: string;
}

const getReferenceTypeName = (type: string | null): string => {
  switch (type) {
    case 'sale': return 'مبيعات';
    case 'purchase': return 'مشتريات';
    case 'payroll': return 'رواتب';
    case 'voucher': return 'سند';
    case 'expense': return 'مصروفات';
    case 'prepaid_expense': return 'مصروفات مقدمة';
    case 'manual': return 'يدوي';
    default: return type || 'غير محدد';
  }
};

export function JournalEntryEditDialog({
  entryId,
  open,
  onOpenChange,
  title = 'القيد المحاسبي',
  referenceType,
}: JournalEntryEditDialogProps) {
  const { data: entry, isLoading } = useJournalEntry(entryId);
  const { data: accounts = [] } = useAccounts();
  const updateJournalEntry = useUpdateJournalEntry();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([]);

  // Reset state when entry changes
  useEffect(() => {
    if (entry) {
      setDescription(entry.description || '');
      setEntryDate(entry.entry_date || '');
      setLines(
        (entry.lines || []).map((line: any) => ({
          id: line.id,
          account_id: line.account_id,
          account_code: line.account?.code,
          account_name: line.account?.name,
          description: line.description || '',
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        }))
      );
    }
  }, [entry]);

  const handleClose = () => {
    setIsEditMode(false);
    onOpenChange(false);
  };

  const addLine = () => {
    setLines([
      ...lines,
      { account_id: '', description: '', debit: 0, credit: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, i) => i !== index));
    } else {
      toast.error('يجب أن يحتوي القيد على سطرين على الأقل');
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
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSave = async () => {
    if (!entryId) return;

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
      await updateJournalEntry.mutateAsync({
        entryId,
        entry: {
          entry_date: entryDate,
          description,
          total_debit: totalDebit,
          total_credit: totalCredit,
        },
        lines: validLines.map(line => ({
          id: line.id,
          account_id: line.account_id,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        })),
      });
      toast.success('تم تحديث القيد بنجاح');
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast.error('حدث خطأ أثناء تحديث القيد');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  if (!entryId) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              {title}
              {entry && (
                <Badge variant="outline" className="mr-2">
                  قيد رقم: {entry.entry_number}
                </Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                  <Pencil className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditMode(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={updateJournalEntry.isPending || !isBalanced}
                  >
                    {updateJournalEntry.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin ml-1" />
                    ) : (
                      <Save className="w-4 h-4 ml-1" />
                    )}
                    حفظ التعديلات
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : entry ? (
          <div className="space-y-6 py-4">
            {/* Entry Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">رقم القيد</Label>
                <p className="font-bold text-lg">{entry.entry_number}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">التاريخ</Label>
                {isEditMode ? (
                  <Input
                    type="date"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="h-9"
                  />
                ) : (
                  <p className="font-medium">
                    {entry.entry_date ? format(new Date(entry.entry_date), 'yyyy-MM-dd') : '-'}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">نوع المرجع</Label>
                <Badge variant="secondary">
                  {getReferenceTypeName(entry.reference_type)}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">الحالة</Label>
                <Badge variant={entry.is_posted ? 'default' : 'outline'}>
                  {entry.is_posted ? 'مرحّل' : 'مسودة'}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">البيان</Label>
              {isEditMode ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[60px]"
                />
              ) : (
                <p className="p-3 bg-muted/30 rounded-md text-sm">{entry.description}</p>
              )}
            </div>

            {/* Lines Table */}
            <div className="border rounded-lg overflow-hidden">
              {isEditMode && (
                <div className="bg-muted/50 p-2 flex items-center gap-2 border-b">
                  <Button variant="outline" size="sm" onClick={addLine}>
                    <Plus className="w-4 h-4 ml-1" />
                    سطر جديد
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead className="w-24">رمز الحساب</TableHead>
                      <TableHead className="min-w-[180px]">اسم الحساب</TableHead>
                      <TableHead className="min-w-[150px]">البيان</TableHead>
                      <TableHead className="w-32 text-left">مدين</TableHead>
                      <TableHead className="w-32 text-left">دائن</TableHead>
                      {isEditMode && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line, index) => (
                      <TableRow key={index} className="hover:bg-muted/20">
                        <TableCell className="text-center font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        {isEditMode ? (
                          <>
                            <TableCell colSpan={2}>
                              <AccountSearchSelect
                                accounts={accounts}
                                value={line.account_id}
                                onChange={(value) => updateLine(index, 'account_id', value)}
                              />
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-mono text-sm">
                              {line.account_code}
                            </TableCell>
                            <TableCell>{line.account_name}</TableCell>
                          </>
                        )}
                        <TableCell>
                          {isEditMode ? (
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(index, 'description', e.target.value)}
                              placeholder="البيان"
                              className="text-sm h-9"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">{line.description}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-left">
                          {isEditMode ? (
                            <Input
                              type="number"
                              min="0"
                              value={line.debit || ''}
                              onChange={(e) => updateLine(index, 'debit', e.target.value)}
                              placeholder="0"
                              className="text-left h-9"
                            />
                          ) : (
                            <span className={line.debit > 0 ? 'font-medium' : 'text-muted-foreground'}>
                              {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-left">
                          {isEditMode ? (
                            <Input
                              type="number"
                              min="0"
                              value={line.credit || ''}
                              onChange={(e) => updateLine(index, 'credit', e.target.value)}
                              placeholder="0"
                              className="text-left h-9"
                            />
                          ) : (
                            <span className={line.credit > 0 ? 'font-medium' : 'text-muted-foreground'}>
                              {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                            </span>
                          )}
                        </TableCell>
                        {isEditMode && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLine(index)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              disabled={lines.length <= 2}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={isEditMode ? 4 : 4} className="text-left">
                        الإجمالي
                      </TableCell>
                      <TableCell className="text-left">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-left">{formatCurrency(totalCredit)}</TableCell>
                      {isEditMode && <TableCell></TableCell>}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Attachments */}
            {entryId && <JournalAttachments journalEntryId={entryId} />}

            {/* Balance Warning */}
            {isEditMode && !isBalanced && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">
                  القيد غير متوازن! الفرق: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            لم يتم العثور على القيد
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
