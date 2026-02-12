import { DollarSign, Percent, RefreshCcw, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PerformanceMetricsProps {
  averageSalePrice: number;
  averageProfitMargin: number;
  inventoryTurnover: number;
  averageDaysToSell: number;
}

const metricThemes = [
  { borderColor: 'hsl(var(--primary))', bgColor: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' },
  { borderColor: 'hsl(var(--success))', bgColor: 'hsl(var(--success) / 0.12)', color: 'hsl(var(--success))' },
  { borderColor: 'hsl(var(--warning))', bgColor: 'hsl(var(--warning) / 0.12)', color: 'hsl(var(--warning))' },
  { borderColor: 'hsl(217 91% 60%)', bgColor: 'hsl(217 91% 60% / 0.12)', color: 'hsl(217 91% 60%)' },
];

export function PerformanceMetrics({ averageSalePrice, averageProfitMargin, inventoryTurnover, averageDaysToSell }: PerformanceMetricsProps) {
  const { t, language } = useLanguage();
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA';

  const formatCurrency = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(value);

  const metrics = [
    { title: t.chart_avg_sale_price, value: formatCurrency(averageSalePrice), icon: DollarSign },
    { title: t.chart_avg_profit_margin, value: `${averageProfitMargin.toFixed(1)}%`, icon: Percent },
    { title: t.chart_inventory_turnover, value: `${inventoryTurnover.toFixed(1)}%`, icon: RefreshCcw },
    { title: t.chart_avg_days_to_sell, value: `${averageDaysToSell} ${t.chart_day}`, icon: Clock },
  ];

  return (
    <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-4 md:p-6 border border-border/60">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--warning))' }} />
      <h3 className="text-lg font-bold text-card-foreground mb-4">{t.chart_performance_metrics}</h3>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {metrics.map((metric, index) => {
          const theme = metricThemes[index];
          return (
            <div key={index} className="relative overflow-hidden p-3 md:p-4 bg-card rounded-lg border border-border/50">
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg" style={{ backgroundColor: theme.borderColor }} />
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.bgColor }}>
                  <metric.icon className="w-4 h-4" style={{ color: theme.color }} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{metric.title}</p>
              <p className="text-lg md:text-xl font-bold">{metric.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
