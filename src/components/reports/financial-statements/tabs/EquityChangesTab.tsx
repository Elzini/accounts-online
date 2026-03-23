/**
 * Equity Changes Tab Component
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale } from 'lucide-react';
import { ExportActions } from '../ExportActions';
import { FinancialData } from '../types';

interface EquityChangesTabProps {
  data: FinancialData;
  formatNumber: (num: number) => string;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function EquityChangesTab({ data, formatNumber, onExport }: EquityChangesTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5" /> قائمة التغير في حقوق الملكية</CardTitle>
          <ExportActions onExport={onExport} />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">البيان</TableHead>
              <TableHead className="text-center">رأس المال</TableHead>
              <TableHead className="text-center">احتياطي نظامي</TableHead>
              <TableHead className="text-center">أرباح مبقاة</TableHead>
              <TableHead className="text-center">الإجمالي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.equityChanges.items.map((item, idx) => (
              <TableRow key={idx} className={idx === data.equityChanges.items.length - 1 ? 'bg-primary/10 font-bold' : ''}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-center font-mono">{formatNumber(item.capital)}</TableCell>
                <TableCell className="text-center font-mono">{formatNumber(item.reserves)}</TableCell>
                <TableCell className="text-center font-mono">{formatNumber(item.retainedEarnings)}</TableCell>
                <TableCell className="text-center font-mono">{formatNumber(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
