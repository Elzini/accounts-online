import { History, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';

interface AmountChangesTableProps {
  amountChanges: any[];
}

export function AmountChangesTable({ amountChanges }: AmountChangesTableProps) {
  if (amountChanges.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center gap-2 p-4 pb-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">سجل تعديلات مبلغ العهدة</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/10">
              <TableHead className="text-right font-bold w-10">#</TableHead>
              <TableHead className="text-right font-bold">التاريخ</TableHead>
              <TableHead className="text-right font-bold">المبلغ القديم</TableHead>
              <TableHead className="text-right font-bold">المبلغ الجديد</TableHead>
              <TableHead className="text-right font-bold">المبلغ المضاف</TableHead>
              <TableHead className="text-right font-bold">ملاحظات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {amountChanges.map((change: any, idx: number) => (
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
                <TableCell className="text-xs text-muted-foreground">{change.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted/50">
              <TableCell colSpan={4} className="text-right font-bold">صافي التعديلات</TableCell>
              <TableCell className="font-bold text-primary" colSpan={2}>
                {(() => {
                  const net = amountChanges.reduce((s: number, c: any) => s + (c.change_amount || 0), 0);
                  return `${net >= 0 ? '+' : ''}${formatNumber(net)} ر.س`;
                })()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
