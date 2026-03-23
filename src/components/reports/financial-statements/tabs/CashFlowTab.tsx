/**
 * Cash Flow Tab Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet } from 'lucide-react';
import { ExportActions } from '../ExportActions';
import { FinancialData } from '../types';

interface CashFlowTabProps {
  data: FinancialData;
  formatNumber: (num: number) => string;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function CashFlowTab({ data, formatNumber, onExport }: CashFlowTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> قائمة التدفق النقدي</CardTitle>
          <ExportActions onExport={onExport} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">البند</TableHead>
              <TableHead className="text-left w-40">المبلغ (ر.س)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-muted/50"><TableCell colSpan={2} className="font-bold">التدفقات النقدية من الأنشطة التشغيلية</TableCell></TableRow>
            {data.cashFlow.operating.map((item, idx) => (
              <TableRow key={`op-${idx}`}><TableCell className="pr-8">{item.name}</TableCell><TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell></TableRow>
            ))}
            <TableRow className="border-t"><TableCell className="font-medium">صافي التدفقات التشغيلية</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.totalOperating)}</TableCell></TableRow>

            {data.cashFlow.investing.length > 0 && (
              <>
                <TableRow className="bg-muted/50"><TableCell colSpan={2} className="font-bold">التدفقات النقدية من الأنشطة الاستثمارية</TableCell></TableRow>
                {data.cashFlow.investing.map((item, idx) => (
                  <TableRow key={`inv-${idx}`}><TableCell className="pr-8">{item.name}</TableCell><TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell></TableRow>
                ))}
                <TableRow className="border-t"><TableCell className="font-medium">صافي التدفقات الاستثمارية</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.totalInvesting)}</TableCell></TableRow>
              </>
            )}

            {data.cashFlow.financing.length > 0 && (
              <>
                <TableRow className="bg-muted/50"><TableCell colSpan={2} className="font-bold">التدفقات النقدية من الأنشطة التمويلية</TableCell></TableRow>
                {data.cashFlow.financing.map((item, idx) => (
                  <TableRow key={`fin-${idx}`}><TableCell className="pr-8">{item.name}</TableCell><TableCell className="text-left font-mono">{formatNumber(item.amount)}</TableCell></TableRow>
                ))}
                <TableRow className="border-t"><TableCell className="font-medium">صافي التدفقات التمويلية</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.totalFinancing)}</TableCell></TableRow>
              </>
            )}

            <TableRow className="bg-muted/50 border-t-2"><TableCell className="font-bold">صافي التغير في النقد</TableCell><TableCell className="text-left font-mono font-bold">{formatNumber(data.cashFlow.netChange)}</TableCell></TableRow>
            <TableRow><TableCell>النقد في بداية الفترة</TableCell><TableCell className="text-left font-mono">{formatNumber(data.cashFlow.openingCash)}</TableCell></TableRow>
            <TableRow className="bg-primary/10"><TableCell className="font-bold">النقد في نهاية الفترة</TableCell><TableCell className="text-left font-mono font-bold text-primary">{formatNumber(data.cashFlow.closingCash)}</TableCell></TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
