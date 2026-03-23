import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Save, Loader2, Edit, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounting';
import { useCompany } from '@/contexts/CompanyContext';

interface JournalLine {
  id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string | null;
  account_name?: string;
  account_code?: string;
}

interface InvoiceJournalEntryProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function InvoiceJournalEntry({ invoiceId, invoiceNumber }: InvoiceJournalEntryProps) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const [isEditing, setIsEditing] = useState(false);
  const [editLines, setEditLines] = useState<JournalLine[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch journal entry for this invoice
  const { data: journalData, isLoading } = useQuery({
    queryKey: ['invoice-journal-entry', invoiceId],
    queryFn: async () => {
      // Find journal entry by reference_id
      const { data: je, error: jeError } = await (supabase as any)
        .from('journal_entries')
        .select('id, entry_number, entry_date, description')
        .eq('company_id', companyId)
        .eq('reference_id', invoiceId)
        .in('reference_type', ['invoice_purchase', 'purchase'])
        .limit(1)
        .single();

      if (jeError || !je) return null;

      // Fetch lines
      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select('id, account_id, debit, credit, description')
        .eq('journal_entry_id', je.id);

      if (linesError) return null;

      // Map account names
      const enrichedLines = (lines || []).map((line: any) => {
        const acc = accounts.find(a => a.id === line.account_id);
        return {
          ...line,
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
          account_name: acc?.name || '',
          account_code: acc?.code || '',
        };
      });

      return { ...je, lines: enrichedLines };
    },
    enabled: !!companyId && accounts.length > 0,
  });

  useEffect(() => {
    if (journalData?.lines) {
      setEditLines(journalData.lines);
    }
  }, [journalData]);

  const handleSave = async () => {
    if (!journalData) return;

    // Validate debit = credit
    const totalDebit = editLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = editLines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      toast.error('إجمالي المدين يجب أن يساوي إجمالي الدائن');
      return;
    }

    setIsSaving(true);
    try {
      // Delete old lines and re-insert
      await supabase.from('journal_entry_lines').delete().eq('journal_entry_id', journalData.id);

      const newLines = editLines.map(line => ({
        journal_entry_id: journalData.id,
        account_id: line.account_id,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
      }));

      const { error } = await supabase.from('journal_entry_lines').insert(newLines);
      if (error) throw error;

      toast.success('تم تحديث القيد المحاسبي بنجاح');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['invoice-journal-entry', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-trial-balance'] });
      queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ القيد');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    setEditLines(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'account_id') {
        const acc = accounts.find(a => a.id === value);
        updated[index].account_name = acc?.name || '';
        updated[index].account_code = acc?.code || '';
      }
      return updated;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground mr-2">جاري تحميل القيد...</span>
      </div>
    );
  }

  if (!journalData) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        <FileText className="w-5 h-5 mx-auto mb-1 opacity-40" />
        لا يوجد قيد محاسبي لهذه الفاتورة
      </div>
    );
  }

  const totalDebit = (isEditing ? editLines : journalData.lines).reduce((s: number, l: JournalLine) => s + l.debit, 0);
  const totalCredit = (isEditing ? editLines : journalData.lines).reduce((s: number, l: JournalLine) => s + l.credit, 0);
  const lines = isEditing ? editLines : journalData.lines;

  return (
    <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-semibold">قيد رقم {journalData.entry_number}</span>
          <span className="text-muted-foreground">- {journalData.description}</span>
        </div>
        <div className="flex gap-1">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditLines(journalData.lines); }} className="h-7 text-xs gap-1">
                <X className="w-3 h-3" /> إلغاء
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-7 text-xs gap-1 bg-primary text-primary-foreground">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                حفظ
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-7 text-xs gap-1">
              <Edit className="w-3 h-3" /> تعديل القيد
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right text-xs w-20">الكود</TableHead>
            <TableHead className="text-right text-xs">الحساب</TableHead>
            <TableHead className="text-right text-xs w-28">مدين</TableHead>
            <TableHead className="text-right text-xs w-28">دائن</TableHead>
            <TableHead className="text-right text-xs">البيان</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line: JournalLine, idx: number) => (
            <TableRow key={line.id || idx} className="text-sm">
              <TableCell className="font-mono text-xs py-1.5">
                {isEditing ? (
                  <span className="text-muted-foreground">{line.account_code}</span>
                ) : (
                  line.account_code
                )}
              </TableCell>
              <TableCell className="py-1.5">
                {isEditing ? (
                  <Select value={line.account_id} onValueChange={(v) => updateLine(idx, 'account_id', v)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.filter(a => !accounts.some(c => c.parent_id === a.id)).map(acc => (
                        <SelectItem key={acc.id} value={acc.id} className="text-xs">
                          {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={line.debit > 0 ? 'font-semibold' : ''}>{line.account_name}</span>
                )}
              </TableCell>
              <TableCell className="py-1.5 tabular-nums">
                {isEditing ? (
                  <Input
                    type="number"
                    value={line.debit || ''}
                    onChange={(e) => updateLine(idx, 'debit', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs text-center"
                    dir="ltr"
                  />
                ) : (
                  <span className={line.debit > 0 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-muted-foreground'}>
                    {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                  </span>
                )}
              </TableCell>
              <TableCell className="py-1.5 tabular-nums">
                {isEditing ? (
                  <Input
                    type="number"
                    value={line.credit || ''}
                    onChange={(e) => updateLine(idx, 'credit', parseFloat(e.target.value) || 0)}
                    className="h-7 text-xs text-center"
                    dir="ltr"
                  />
                ) : (
                  <span className={line.credit > 0 ? 'text-rose-700 dark:text-rose-400 font-semibold' : 'text-muted-foreground'}>
                    {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                  </span>
                )}
              </TableCell>
              <TableCell className="py-1.5 text-xs text-muted-foreground">
                {isEditing ? (
                  <Input
                    value={line.description || ''}
                    onChange={(e) => updateLine(idx, 'description', e.target.value)}
                    className="h-7 text-xs"
                  />
                ) : (
                  line.description || '-'
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="font-bold bg-muted/60 border-t-2">
            <TableCell colSpan={2} className="text-center text-xs py-1.5">الإجمالي</TableCell>
            <TableCell className="text-center tabular-nums text-xs py-1.5 text-emerald-700 dark:text-emerald-400">{totalDebit.toLocaleString()}</TableCell>
            <TableCell className="text-center tabular-nums text-xs py-1.5 text-rose-700 dark:text-rose-400">{totalCredit.toLocaleString()}</TableCell>
            <TableCell className="py-1.5">
              {Math.abs(totalDebit - totalCredit) > 0.01 && (
                <span className="text-destructive text-xs font-bold">⚠ غير متوازن</span>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
