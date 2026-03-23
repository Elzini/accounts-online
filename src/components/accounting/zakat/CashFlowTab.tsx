/**
 * ZakatReportsPage - Cash Flow Tab Content
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, Receipt, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CashFlowTabProps {
  cashFlow: any;
}

export function CashFlowTab({ cashFlow }: CashFlowTabProps) {
  if (!cashFlow) return <p className="text-center text-muted-foreground py-8">اختر فترة لعرض التقرير</p>;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><ArrowUpCircle className="w-5 h-5 text-primary" /><span className="text-sm text-muted-foreground">التدفقات التشغيلية</span></div><p className={cn("text-2xl font-bold", cashFlow.operatingActivities.total >= 0 ? "text-primary" : "text-destructive")}>{cashFlow.operatingActivities.total.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-primary" /><span className="text-sm text-muted-foreground">التدفقات الاستثمارية</span></div><p className={cn("text-2xl font-bold", cashFlow.investingActivities.total >= 0 ? "text-primary" : "text-destructive")}>{cashFlow.investingActivities.total.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Receipt className="w-5 h-5 text-primary" /><span className="text-sm text-muted-foreground">التدفقات التمويلية</span></div><p className={cn("text-2xl font-bold", cashFlow.financingActivities.total >= 0 ? "text-primary" : "text-destructive")}>{cashFlow.financingActivities.total.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p></CardContent></Card>
        <Card className={cn("border-2", cashFlow.netChangeInCash >= 0 ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5")}><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5" /><span className="text-sm text-muted-foreground">صافي التغير</span></div><p className={cn("text-2xl font-bold", cashFlow.netChangeInCash >= 0 ? "text-primary" : "text-destructive")}>{cashFlow.netChangeInCash.toLocaleString()} <span className="text-sm font-normal">ر.س</span></p></CardContent></Card>
      </div>

      <div className="space-y-6">
        {/* Operating */}
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">التدفقات النقدية من الأنشطة التشغيلية</CardTitle></CardHeader><CardContent><Table><TableBody>
          <TableRow><TableCell className="font-medium">صافي الربح</TableCell><TableCell className="text-left">{cashFlow.operatingActivities.netIncome.toLocaleString()}</TableCell></TableRow>
          {cashFlow.operatingActivities.changesInWorkingCapital.map((item: any, idx: number) => (<TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>{item.amount.toLocaleString()}</TableCell></TableRow>))}
          <TableRow className="bg-muted/50 font-bold"><TableCell>إجمالي التدفقات التشغيلية</TableCell><TableCell className="text-left">{cashFlow.operatingActivities.total.toLocaleString()}</TableCell></TableRow>
        </TableBody></Table></CardContent></Card>

        {/* Investing */}
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">التدفقات النقدية من الأنشطة الاستثمارية</CardTitle></CardHeader><CardContent><Table><TableBody>
          {cashFlow.investingActivities.items.map((item: any, idx: number) => (<TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>{item.amount.toLocaleString()}</TableCell></TableRow>))}
          <TableRow className="bg-muted/50 font-bold"><TableCell>إجمالي التدفقات الاستثمارية</TableCell><TableCell className="text-left">{cashFlow.investingActivities.total.toLocaleString()}</TableCell></TableRow>
        </TableBody></Table></CardContent></Card>

        {/* Financing */}
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">التدفقات النقدية من الأنشطة التمويلية</CardTitle></CardHeader><CardContent><Table><TableBody>
          {cashFlow.financingActivities.items.map((item: any, idx: number) => (<TableRow key={idx}><TableCell>{item.description}</TableCell><TableCell className={cn("text-left", item.amount >= 0 ? "text-primary" : "text-destructive")}>{item.amount.toLocaleString()}</TableCell></TableRow>))}
          <TableRow className="bg-muted/50 font-bold"><TableCell>إجمالي التدفقات التمويلية</TableCell><TableCell className="text-left">{cashFlow.financingActivities.total.toLocaleString()}</TableCell></TableRow>
        </TableBody></Table></CardContent></Card>

        {/* Summary */}
        <Card className="border-primary"><CardContent className="p-4"><Table><TableBody>
          <TableRow><TableCell className="font-medium">صافي التغير في النقدية</TableCell><TableCell className={cn("text-left font-bold", cashFlow.netChangeInCash >= 0 ? "text-primary" : "text-destructive")}>{cashFlow.netChangeInCash.toLocaleString()}</TableCell></TableRow>
          <TableRow><TableCell>النقدية في بداية الفترة</TableCell><TableCell className="text-left">{cashFlow.cashAtBeginning.toLocaleString()}</TableCell></TableRow>
          <TableRow className="bg-primary/10"><TableCell className="font-bold">النقدية في نهاية الفترة</TableCell><TableCell className="text-left font-bold text-primary">{cashFlow.cashAtEnd.toLocaleString()}</TableCell></TableRow>
        </TableBody></Table></CardContent></Card>
      </div>
    </>
  );
}
