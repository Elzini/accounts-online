import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AssetsSummaryCardsProps {
  summary: { totalAssets: number; activeAssets: number; totalValue: number; totalAccumulatedDepreciation: number; totalBookValue: number };
  formatCurrency: (n: number) => string;
  t: any;
}

export function AssetsSummaryCards({ summary, formatCurrency, t }: AssetsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.fa_total}</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{summary.totalAssets}</div><p className="text-xs text-muted-foreground">{summary.activeAssets} {t.fa_active_count}</p></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.fa_purchase_value}</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.fa_accumulated_dep}</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-destructive">{formatCurrency(summary.totalAccumulatedDepreciation)}</div></CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t.fa_book_value}</CardTitle></CardHeader>
        <CardContent><div className="text-2xl font-bold text-primary">{formatCurrency(summary.totalBookValue)}</div></CardContent>
      </Card>
    </div>
  );
}
