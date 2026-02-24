import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';
import { ArrowUp, ArrowDown, History } from 'lucide-react';

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

  const totalAdded = changes.reduce((s, c) => s + (c.change_amount > 0 ? c.change_amount : 0), 0);
  const totalReduced = changes.reduce((s, c) => s + (c.change_amount < 0 ? Math.abs(c.change_amount) : 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            سجل تعديلات المبلغ - {custodyName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-4">
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

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
        ) : changes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد تعديلات مسجلة على مبلغ هذه العهدة</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/10">
                <TableHead className="text-right font-bold w-12">#</TableHead>
                <TableHead className="text-right font-bold">التاريخ</TableHead>
                <TableHead className="text-right font-bold">المبلغ القديم</TableHead>
                <TableHead className="text-right font-bold">المبلغ الجديد</TableHead>
                <TableHead className="text-right font-bold">الفرق</TableHead>
                <TableHead className="text-right font-bold">ملاحظات</TableHead>
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
                    <Badge
                      variant={change.change_amount > 0 ? 'default' : 'destructive'}
                      className="gap-1"
                    >
                      {change.change_amount > 0 ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {change.change_amount > 0 ? '+' : ''}{formatNumber(change.change_amount)} ر.س
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {change.notes || '-'}
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
                  +{formatNumber(totalAdded - totalReduced)} ر.س
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
