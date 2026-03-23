/**
 * ZakatReportsPage - Detailed Income Statement Tab
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowUpCircle, TrendingUp, Scale, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportActions, DateRangePicker } from './ExportActions';
import type { DetailedIncomeStatement } from '@/services/zakatReports';

interface DetailedIncomeTabProps {
  data: DetailedIncomeStatement | null | undefined;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function DetailedIncomeTab({ data, dateRange, onDateRangeChange, onExport }: DetailedIncomeTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              قائمة الدخل المفصلة
            </CardTitle>
            <CardDescription>قائمة الدخل مع تفاصيل الإيرادات والمصروفات وصافي الربح قبل وبعد الزكاة</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportActions onExport={onExport} />
            <DateRangePicker dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data ? (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpCircle className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">إجمالي الإيرادات</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{data.revenue.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{data.stats.totalSalesCount} عملية بيع</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="text-sm text-muted-foreground">مجمل الربح</span>
                  </div>
                  <p className={cn("text-2xl font-bold", data.grossProfit >= 0 ? "text-primary" : "text-destructive")}>
                    {data.grossProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">هامش {data.stats.grossProfitMargin}%</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5" />
                    <span className="text-sm text-muted-foreground">الربح التشغيلي</span>
                  </div>
                  <p className={cn("text-2xl font-bold", data.operatingIncome >= 0 ? "text-primary" : "text-destructive")}>
                    {data.operatingIncome.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className={cn("border-2", data.netIncomeBeforeZakat >= 0 ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-5 h-5" />
                    <span className="text-sm text-muted-foreground">صافي الربح</span>
                  </div>
                  <p className={cn("text-2xl font-bold", data.netIncomeBeforeZakat >= 0 ? "text-primary" : "text-destructive")}>
                    {data.netIncomeBeforeZakat.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">هامش {data.stats.netProfitMargin}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Zakat Note */}
            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">ملاحظة هامة عن الزكاة</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{data.zakatNote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income Statement Table */}
            <Table>
              <TableBody>
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={2}>الإيرادات</TableCell>
                </TableRow>
                {data.revenue.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pr-8">
                      <span className="text-xs text-muted-foreground ml-2">{item.code}</span>
                      {item.name}
                    </TableCell>
                    <TableCell className="text-left text-primary">{item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {data.revenue.items.length === 0 && (
                  <TableRow><TableCell className="pr-8 text-muted-foreground">لا توجد إيرادات</TableCell><TableCell className="text-left">-</TableCell></TableRow>
                )}
                <TableRow className="font-medium bg-primary/5">
                  <TableCell>إجمالي الإيرادات</TableCell>
                  <TableCell className="text-left text-primary font-bold">{data.revenue.total.toLocaleString()}</TableCell>
                </TableRow>

                <TableRow className="bg-muted/50"><TableCell colSpan={2}></TableCell></TableRow>
                <TableRow className="bg-destructive/10 font-bold">
                  <TableCell colSpan={2}>تكلفة المبيعات (سعر الشراء)</TableCell>
                </TableRow>
                {data.costOfSales.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pr-8">
                      <span className="text-xs text-muted-foreground ml-2">{item.code}</span>
                      {item.name}
                    </TableCell>
                    <TableCell className="text-left text-destructive">({item.amount.toLocaleString()})</TableCell>
                  </TableRow>
                ))}
                {data.costOfSales.items.length === 0 && (
                  <TableRow><TableCell className="pr-8 text-muted-foreground">لا توجد تكاليف مبيعات</TableCell><TableCell className="text-left">-</TableCell></TableRow>
                )}
                <TableRow className="font-medium bg-destructive/5">
                  <TableCell>إجمالي تكلفة المبيعات</TableCell>
                  <TableCell className="text-left text-destructive font-bold">({data.costOfSales.total.toLocaleString()})</TableCell>
                </TableRow>

                <TableRow className="bg-primary/20 font-bold text-lg">
                  <TableCell>
                    مجمل الربح
                    <span className="text-sm font-normal text-muted-foreground mr-2">(هامش {data.stats.grossProfitMargin}%)</span>
                  </TableCell>
                  <TableCell className={cn("text-left", data.grossProfit >= 0 ? "text-primary" : "text-destructive")}>
                    {data.grossProfit.toLocaleString()}
                  </TableCell>
                </TableRow>

                <TableRow className="bg-muted/50"><TableCell colSpan={2}></TableCell></TableRow>
                <TableRow className="bg-orange-100 dark:bg-orange-900/30 font-bold">
                  <TableCell colSpan={2}>المصروفات التشغيلية والإدارية</TableCell>
                </TableRow>
                {data.operatingExpenses.items.map((exp, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="pr-8">
                      <span className="text-xs text-muted-foreground ml-2">{exp.code}</span>
                      {exp.name}
                    </TableCell>
                    <TableCell className="text-left text-destructive">({exp.amount.toLocaleString()})</TableCell>
                  </TableRow>
                ))}
                {data.operatingExpenses.items.length === 0 && (
                  <TableRow><TableCell className="pr-8 text-muted-foreground">لا توجد مصروفات تشغيلية</TableCell><TableCell className="text-left">-</TableCell></TableRow>
                )}
                <TableRow className="font-medium bg-orange-50 dark:bg-orange-900/20">
                  <TableCell>إجمالي المصروفات التشغيلية</TableCell>
                  <TableCell className="text-left text-destructive font-bold">({data.operatingExpenses.total.toLocaleString()})</TableCell>
                </TableRow>

                <TableRow className="bg-primary/10 font-bold">
                  <TableCell>الربح التشغيلي</TableCell>
                  <TableCell className={cn("text-left", data.operatingIncome >= 0 ? "text-primary" : "text-destructive")}>
                    {data.operatingIncome.toLocaleString()}
                  </TableCell>
                </TableRow>

                {data.otherExpenses.items.length > 0 && (
                  <>
                    <TableRow className="bg-muted/50"><TableCell colSpan={2}></TableCell></TableRow>
                    <TableRow className="bg-muted font-bold">
                      <TableCell colSpan={2}>مصروفات أخرى</TableCell>
                    </TableRow>
                    {data.otherExpenses.items.map((exp, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pr-8">
                          <span className="text-xs text-muted-foreground ml-2">{exp.code}</span>
                          {exp.name}
                        </TableCell>
                        <TableCell className="text-left text-destructive">({exp.amount.toLocaleString()})</TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                <TableRow className="bg-muted/50"><TableCell colSpan={2}></TableCell></TableRow>
                <TableRow className="bg-primary font-bold text-lg text-primary-foreground">
                  <TableCell>
                    صافي الربح
                    <span className="text-sm font-normal opacity-80 mr-2">(هامش {data.stats.netProfitMargin}%)</span>
                  </TableCell>
                  <TableCell className="text-left">{data.netIncomeBeforeZakat.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">اختر فترة لعرض التقرير</p>
        )}
      </CardContent>
    </Card>
  );
}
