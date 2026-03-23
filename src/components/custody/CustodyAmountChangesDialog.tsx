import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';
import { ArrowUp, ArrowDown, History, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyId } from '@/hooks/useCompanyId';

interface CustodyAmountChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodyId: string;
  custodyName: string;
}

interface AmountChange {
  id: string;
  old_amount: number;
  new_amount: number;
  change_amount: number;
  changed_at: string;
  notes: string | null;
}

export function CustodyAmountChangesDialog({ open, onOpenChange, custodyId, custodyName }: CustodyAmountChangesDialogProps) {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formChangeAmount, setFormChangeAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const { data: changes = [], isLoading } = useQuery({
    queryKey: ['custody-amount-changes', custodyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custody_amount_changes')
        .select('id, old_amount, new_amount, change_amount, changed_at, notes')
        .eq('custody_id', custodyId)
        .order('changed_at', { ascending: true });
      if (error) throw error;
      return (data || []) as AmountChange[];
    },
    enabled: open && !!custodyId,
  });

  const addChangeMutation = useMutation({
    mutationFn: async (entry: { change_amount: number; changed_at: string; notes: string }) => {
      if (!companyId) throw new Error('Company ID is required');

      // Read current custody amount
      const { data: currentCustody, error: custodyError } = await supabase
        .from('custodies')
        .select('custody_amount')
        .eq('id', custodyId)
        .eq('company_id', companyId)
        .single();
      if (custodyError) throw custodyError;

      const oldAmount = Number(currentCustody?.custody_amount || 0);
      const newAmount = oldAmount + entry.change_amount;

      // Update custody amount (DB trigger creates the history row)
      const { error: updateError } = await supabase
        .from('custodies')
        .update({ custody_amount: newAmount })
        .eq('id', custodyId)
        .eq('company_id', companyId);
      if (updateError) throw updateError;

      // Update the auto-created history row with selected date/notes
      const { data: createdChange, error: createdChangeError } = await supabase
        .from('custody_amount_changes')
        .select('id')
        .eq('custody_id', custodyId)
        .eq('company_id', companyId)
        .eq('old_amount', oldAmount)
        .eq('new_amount', newAmount)
        .order('changed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (createdChangeError) throw createdChangeError;

      if (createdChange?.id) {
        const { error: patchChangeError } = await supabase
          .from('custody_amount_changes')
          .update({
            changed_at: entry.changed_at,
            notes: entry.notes || null,
          })
          .eq('id', createdChange.id)
          .eq('company_id', companyId);
        if (patchChangeError) throw patchChangeError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custody-amount-changes', custodyId] });
      queryClient.invalidateQueries({ queryKey: ['custody', custodyId] });
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم تعديل مبلغ العهدة بنجاح');
      setShowForm(false);
      setFormChangeAmount(''); setFormNotes('');
      setFormDate(new Date().toISOString().split('T')[0]);
    },
    onError: (e: Error) => toast.error(`خطأ: ${e.message}`),
  });

  const deleteChangeMutation = useMutation({
    mutationFn: async (change: AmountChange) => {
      if (!companyId) throw new Error('Company ID is required');

      const { error } = await supabase
        .from('custody_amount_changes')
        .delete()
        .eq('id', change.id)
        .eq('custody_id', custodyId)
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custody-amount-changes', custodyId] });
      queryClient.invalidateQueries({ queryKey: ['custody', custodyId] });
      queryClient.invalidateQueries({ queryKey: ['custodies'] });
      toast.success('تم حذف السجل بنجاح');
    },
    onError: (e: Error) => toast.error(`خطأ: ${e.message}`),
  });

  const handleAdd = () => {
    const changeAmt = parseFloat(formChangeAmount);
    if (isNaN(changeAmt) || changeAmt === 0) { toast.error('يرجى إدخال مبلغ التعديل'); return; }
    addChangeMutation.mutate({
      change_amount: changeAmt,
      changed_at: formDate,
      notes: formNotes,
    });
  };

  const totalAdded = changes.reduce((s, c) => s + (c.change_amount > 0 ? c.change_amount : 0), 0);
  const totalReduced = changes.reduce((s, c) => s + (c.change_amount < 0 ? Math.abs(c.change_amount) : 0), 0);
  const netChange = changes.reduce((s, c) => s + c.change_amount, 0);

  const handleShowForm = () => {
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              سجل تعديلات المبلغ - {custodyName}
            </span>
            <Button size="sm" onClick={handleShowForm} className="gap-1">
              <Plus className="h-4 w-4" /> إضافة تعديل
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-sm text-muted-foreground">عدد التعديلات</div>
            <div className="text-2xl font-bold text-primary">{changes.length}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-sm text-muted-foreground">إجمالي الإضافات</div>
            <div className="text-2xl font-bold text-green-600">+{formatNumber(totalAdded)} ر.س</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-sm text-muted-foreground">إجمالي التخفيضات</div>
            <div className="text-2xl font-bold text-destructive">-{formatNumber(totalReduced)} ر.س</div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <h4 className="font-semibold text-sm">إضافة تعديل</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">التاريخ</label>
                <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">مبلغ التعديل (+ إضافة / - تخفيض)</label>
                <Input type="number" placeholder="مثال: 3050 أو -500" value={formChangeAmount} onChange={e => setFormChangeAmount(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ملاحظات</label>
              <Textarea placeholder="مثال: تم تحديث العهدة وإضافة مبلغ 3050 ر.س" value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>إلغاء</Button>
              <Button size="sm" onClick={handleAdd} disabled={addChangeMutation.isPending}>
                {addChangeMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : changes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد تعديلات مسجلة - اضغط "إضافة تعديل" لتسجيل التعديلات السابقة</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="text-right font-bold w-12">#</TableHead>
                <TableHead className="text-right font-bold">التاريخ</TableHead>
                <TableHead className="text-right font-bold">المبلغ القديم</TableHead>
                <TableHead className="text-right font-bold">المبلغ الجديد</TableHead>
                <TableHead className="text-right font-bold">المبلغ المضاف</TableHead>
                <TableHead className="text-right font-bold">ملاحظات</TableHead>
                <TableHead className="text-right font-bold w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {changes.map((change, idx) => (
                <TableRow key={change.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{new Date(change.changed_at).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>{formatNumber(change.old_amount)} ر.س</TableCell>
                  <TableCell className="font-semibold">{formatNumber(change.new_amount)} ر.س</TableCell>
                  <TableCell>
                    <Badge variant={change.change_amount > 0 ? 'default' : 'destructive'} className="gap-1">
                      {change.change_amount > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {change.change_amount > 0 ? '+' : ''}{formatNumber(change.change_amount)} ر.س
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                    {change.notes || '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                      onClick={() => { if (confirm('حذف هذا السجل؟')) deleteChangeMutation.mutate(change); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={2} className="text-right font-bold">الإجمالي</TableCell>
                <TableCell className="font-bold">{changes.length > 0 ? `${formatNumber(changes[0].old_amount)} ر.س` : '-'}</TableCell>
                <TableCell className="font-bold">{changes.length > 0 ? `${formatNumber(changes[changes.length - 1].new_amount)} ر.س` : '-'}</TableCell>
                <TableCell className="font-bold text-primary">
                  {netChange >= 0 ? '+' : '-'}{formatNumber(Math.abs(netChange))} ر.س
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
