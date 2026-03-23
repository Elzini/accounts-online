/**
 * ZakatReportsPage - Cash Flow Tab
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowUpCircle, Building2, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportActions, DateRangePicker } from './ExportActions';
import type { CashFlowStatement } from '@/services/zakatReports';

interface CashFlowTabProps {
  data: CashFlowStatement | null | undefined;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onExport: (type: 'print' | 'excel' | 'pdf') => void;
}

export function CashFlowTab({ data, dateRange, onDateRangeChange, onExport }: CashFlowTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              قائمة التدفقات النقدية
            </CardTitle>
            <CardDescription>توضح حركة النقد من الأنشطة التشغيلية والاستثمارية والتمويلية</CardDescription>
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
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { icon: ArrowUpCircle, label: 'التدفقات التشغيلية', value: data.operatingActivities.total },
                { icon: Building2, label: 'التدفقات الاستثمارية', value: data.investingActivities.total },
                { icon: Receipt, label: 'التدفقات التمويلية', value: data.financingActivities.total },
              ].map(({ icon: Icon, label, value }, idx) => (
                <Card key={idx} className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <p className={cn("text-2xl font-bold", value >= 0 ? "text-primary" : "text-destructive")}>
                      {value.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Card className={cn("border-2", data.netChangeInCash >= 0 ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-sm text-muted-foreground">صافي التغير</span>
                  </div>
                  <p className={cn("text-2xl font-bold", data.netChangeInCash >= 0 ? "text-primary" : "text-destructive")}>
                    {data.netChangeInCash.toLocaleString()} <span className="text-sm font-normal">ر.س</span>
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg">التدفقات النقدية من الأنشطة التشغيلية</CardTitle></CardHeader>
                <CardContent>
                  <Table><TableBody>
                    <TableRow><TableCell className="font-medium">صافي الربح</TableCell><TableCell className="text-left">{data.operatingActivities.netIncome.toLocaleString()}</TableCell></TableRow>
                    {data.operatingActivities.changesInWorkingCapital.map((item, idx) => (
                      <TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>{item.amount.toLocaleString()}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold"><TableCell>إجمالي التدفقات التشغيلية</TableCell><TableCell className="text-left">{data.operatingActivities.total.toLocaleString()}</TableCell></TableRow>
                  </TableBody></Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg">التدفقات النقدية من الأنشطة الاستثمارية</CardTitle></CardHeader>
                <CardContent>
                  <Table><TableBody>
                    {data.investingActivities.items.map((item, idx) => (
                      <TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>{item.amount.toLocaleString()}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold"><TableCell>إجمالي التدفقات الاستثمارية</TableCell><TableCell className="text-left">{data.investingActivities.total.toLocaleString()}</TableCell></TableRow>
                  </TableBody></Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-lg">التدفقات النقدية من الأنشطة التمويلية</CardTitle></CardHeader>
                <CardContent>
                  <Table><TableBody>
                    {data.financingActivities.items.map((item, idx) => (
                      <TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>{item.amount.toLocaleString()}</TableCell></TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-bold"><TableCell>إجمالي التدفقات التمويلية</TableCell><TableCell className="text-left">{data.financingActivities.total.toLocaleString()}</TableCell></TableRow>
                  </TableBody></Table>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardContent className="p-4">
                  <Table><TableBody>
                    <TableRow><TableCell className="font-medium">صافي التغير في النقدية</TableCell><TableCell className={cn("text-left font-bold", data.netChangeInCash >= 0 ? "text-primary" : "text-destructive")}>{data.netChangeInCash.toLocaleString()}</TableCell></TableRow>
                    <TableRow><TableCell>النقدية في بداية الفترة</TableCell><TableCell className="text-left">{data.cashAtBeginning.toLocaleString()}</TableCell></TableRow>
                    <TableRow className="bg-primary/10"><TableCell className="font-bold">النقدية في نهاية الفترة</TableCell><TableCell className="text-left font-bold text-primary">{data.cashAtEnd.toLocaleString()}</TableCell></TableRow>
                  </TableBody></Table>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">اختر فترة لعرض التقرير</p>
        )}
      </CardContent>
    </Card>
  );
}
