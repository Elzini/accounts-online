/**
 * ZakatReportsPage - Equity Changes Tab
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Scale } from 'lucide-react';
import { ExportActions, DateRangePicker } from './ExportActions';
import type { ChangesInEquityStatement } from '@/services/zakatReports';

interface EquityChangesTabProps {
  data: ChangesInEquityStatement | null | undefined;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function EquityChangesTab({ data, dateRange, onDateRangeChange, onExport }: EquityChangesTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5" />
              قائمة التغيرات في حقوق الملكية
            </CardTitle>
            <CardDescription>توضح التغيرات في رأس المال والاحتياطيات والأرباح المحتجزة</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportActions onExport={onExport} />
            <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>البيان</TableHead>
                <TableHead className="text-center">رأس المال</TableHead>
                <TableHead className="text-center">الاحتياطيات</TableHead>
                <TableHead className="text-center">الأرباح المحتجزة</TableHead>
                <TableHead className="text-center">الإجمالي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.details.map((row, idx) => (
                <TableRow key={idx} className={idx === 0 || idx === data.details.length - 1 ? "bg-muted/50 font-medium" : ""}>
                  <TableCell>{row.description}</TableCell>
                  <TableCell className="text-center">{row.capital.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{row.reserves.toLocaleString()}</TableCell>
                  <TableCell className="text-center">{row.retainedEarnings.toLocaleString()}</TableCell>
                  <TableCell className="text-center font-bold">{row.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">اختر فترة لعرض التقرير</p>
        )}
      </CardContent>
    </Card>
  );
}
