import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/components/financial-statements/utils/numberFormatting';

interface CustodySummaryCardsProps {
  summary: {
    isCarried: boolean;
    carriedBalance: number;
    custodyAmount: number;
    totalSpent: number;
    returnedAmount: number;
  };
  amountChanges: any[];
}

export function CustodySummaryCards({ summary, amountChanges }: CustodySummaryCardsProps) {
  const netChanges = amountChanges.reduce((s: number, c: any) => s + (c.change_amount || 0), 0);
  const hasChanges = amountChanges.length > 0;

  if (summary.isCarried) {
    return (
      <div className={`grid grid-cols-2 ${hasChanges ? 'md:grid-cols-6' : 'md:grid-cols-4'} gap-4`}>
        <Card className="col-span-2 md:col-span-6">
          <CardContent className="pt-4 text-center">
            <div className="text-sm text-muted-foreground">رصيد مرحّل (مستحق للموظف)</div>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(summary.carriedBalance)} ر.س</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 ${hasChanges ? 'md:grid-cols-6' : 'md:grid-cols-4'} gap-4`}>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">مبلغ العهدة الأصلي</div>
          <div className="text-xl font-bold text-primary">{formatNumber(hasChanges ? (summary.custodyAmount - netChanges) : summary.custodyAmount)} ر.س</div>
        </CardContent>
      </Card>
      {hasChanges && (
        <>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">مبلغ التعديل</div>
              <div className={`text-xl font-bold ${netChanges > 0 ? 'text-green-600' : 'text-destructive'}`}>
                {netChanges > 0 ? '+' : ''}{formatNumber(netChanges)} ر.س
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">الإجمالي بعد التعديل</div>
              <div className="text-xl font-bold text-primary">{formatNumber(summary.custodyAmount)} ر.س</div>
            </CardContent>
          </Card>
        </>
      )}
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">إجمالي المصروفات</div>
          <div className="text-xl font-bold text-red-600">{formatNumber(summary.totalSpent)} ر.س</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">رصيد الخزينة الآن</div>
          <div className="text-xl font-bold text-green-600">{formatNumber(summary.returnedAmount)} ر.س</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">الرصيد المرحل</div>
          <div className="text-xl font-bold text-orange-600">{formatNumber(summary.carriedBalance)} ر.س</div>
        </CardContent>
      </Card>
    </div>
  );
}
