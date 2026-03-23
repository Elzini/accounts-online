/**
 * Income Statement Tab Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { TrendingUp } from 'lucide-react';
import { ExportActions } from '../ExportActions';
import { FinancialData } from '../types';

interface IncomeStatementTabProps {
  data: FinancialData;
  setData: (data: FinancialData) => void;
  editMode: boolean;
  formatNumber: (num: number) => string;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function IncomeStatementTab({ data, setData, editMode, formatNumber, onExport }: IncomeStatementTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            قائمة الدخل الشامل
            {data.period.to && <span className="text-sm font-normal text-muted-foreground">للسنة المنتهية في {data.period.to}</span>}
          </CardTitle>
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
            <TableRow>
              <TableCell>الإيرادات</TableCell>
              <TableCell className="text-left font-mono">
                {editMode ? (
                  <Input type="number" value={data.incomeStatement.revenue}
                    onChange={(e) => setData({ ...data, incomeStatement: { ...data.incomeStatement, revenue: Number(e.target.value) } })}
                    className="w-32 text-left" />
                ) : formatNumber(data.incomeStatement.revenue)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>تكلفة الإيرادات</TableCell>
              <TableCell className="text-left font-mono text-destructive">({formatNumber(data.incomeStatement.costOfRevenue)})</TableCell>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell className="font-bold">إجمالي الربح</TableCell>
              <TableCell className="text-left font-mono font-bold">{formatNumber(data.incomeStatement.grossProfit)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>مصاريف عمومية وإدارية</TableCell>
              <TableCell className="text-left font-mono text-destructive">({formatNumber(data.incomeStatement.totalOperatingExpenses)})</TableCell>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell className="font-bold">ربح العمليات</TableCell>
              <TableCell className="text-left font-mono font-bold">{formatNumber(data.incomeStatement.operatingProfit)}</TableCell>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell className="font-bold">الربح قبل الزكاة</TableCell>
              <TableCell className="text-left font-mono font-bold">{formatNumber(data.incomeStatement.profitBeforeZakat)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>الزكاة</TableCell>
              <TableCell className="text-left font-mono text-destructive">({formatNumber(data.incomeStatement.zakat)})</TableCell>
            </TableRow>
            <TableRow className="bg-primary/10">
              <TableCell className="font-bold text-lg">صافي الربح</TableCell>
              <TableCell className="text-left font-mono font-bold text-lg text-primary">{formatNumber(data.incomeStatement.netProfit)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
