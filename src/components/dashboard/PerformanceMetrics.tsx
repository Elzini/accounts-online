import { DollarSign, Percent, RefreshCcw, Clock } from 'lucide-react';

interface PerformanceMetricsProps {
  averageSalePrice: number;
  averageProfitMargin: number;
  inventoryTurnover: number;
  averageDaysToSell: number;
}

export function PerformanceMetrics({
  averageSalePrice,
  averageProfitMargin,
  inventoryTurnover,
  averageDaysToSell
}: PerformanceMetricsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const metrics = [
    {
      title: 'متوسط سعر البيع',
      value: formatCurrency(averageSalePrice),
      icon: DollarSign,
      color: 'bg-primary/10 text-primary'
    },
    {
      title: 'متوسط هامش الربح',
      value: `${averageProfitMargin.toFixed(1)}%`,
      icon: Percent,
      color: 'bg-success/10 text-success'
    },
    {
      title: 'معدل دوران المخزون',
      value: `${inventoryTurnover.toFixed(1)}%`,
      icon: RefreshCcw,
      color: 'bg-warning/10 text-warning'
    },
    {
      title: 'متوسط أيام البيع',
      value: `${averageDaysToSell} يوم`,
      icon: Clock,
      color: 'bg-blue-500/10 text-blue-500'
    }
  ];

  return (
    <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
      <h3 className="text-lg font-bold text-card-foreground mb-4">مؤشرات الأداء</h3>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="p-3 md:p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${metric.color}`}>
                <metric.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-1">{metric.title}</p>
            <p className="text-lg md:text-xl font-bold">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
