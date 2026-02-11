import {
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  BarChart3,
  Clock,
  Layers,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinancialKPICardsProps {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalExpenses: number;
  averageDaysToSell: number;
  inventoryCount: number;
  soldCount: number;
  salesCount: number;
  purchasesThisMonth: number;
  salesThisMonth: number;
}

interface KPIItem {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function FinancialKPICards({
  totalRevenue,
  totalCost,
  totalProfit,
  totalExpenses,
  averageDaysToSell,
  inventoryCount,
  soldCount,
  salesCount,
  purchasesThisMonth,
  salesThisMonth,
}: FinancialKPICardsProps) {
  // Gross Profit Margin
  const grossProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Operating Expense Ratio
  const opexRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  // Inventory Turnover Rate
  const avgInventory = inventoryCount > 0 ? inventoryCount : 1;
  const inventoryTurnover = totalCost > 0 ? totalCost / (avgInventory * (totalCost / Math.max(soldCount + inventoryCount, 1))) : 0;

  // Net Profit Margin
  const netProfitMargin = totalRevenue > 0 ? ((totalProfit - totalExpenses) / totalRevenue) * 100 : 0;

  // Sales Efficiency (sales/purchases ratio)
  const salesEfficiency = purchasesThisMonth > 0 ? (salesThisMonth / purchasesThisMonth) * 100 : 0;

  // Average Deal Size
  const avgDealSize = salesCount > 0 ? totalRevenue / salesCount : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kpis: KPIItem[] = [
    {
      label: 'هامش الربح الإجمالي',
      value: `${grossProfitMargin.toFixed(1)}%`,
      description: 'نسبة الربح من إجمالي الإيرادات',
      icon: Percent,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      trend: grossProfitMargin > 15 ? 'up' : grossProfitMargin > 5 ? 'neutral' : 'down',
    },
    {
      label: 'هامش صافي الربح',
      value: `${netProfitMargin.toFixed(1)}%`,
      description: 'بعد خصم المصروفات التشغيلية',
      icon: DollarSign,
      color: netProfitMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400',
      bgColor: netProfitMargin >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10',
      trend: netProfitMargin > 10 ? 'up' : netProfitMargin >= 0 ? 'neutral' : 'down',
    },
    {
      label: 'نسبة المصروفات التشغيلية',
      value: `${opexRatio.toFixed(1)}%`,
      description: 'المصروفات كنسبة من الإيرادات',
      icon: BarChart3,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      trend: opexRatio < 30 ? 'up' : opexRatio < 60 ? 'neutral' : 'down',
    },
    {
      label: 'متوسط أيام البيع',
      value: `${averageDaysToSell} يوم`,
      description: 'متوسط المدة من الشراء للبيع',
      icon: Clock,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
      trend: averageDaysToSell < 30 ? 'up' : averageDaysToSell < 90 ? 'neutral' : 'down',
    },
    {
      label: 'كفاءة المبيعات',
      value: `${salesEfficiency.toFixed(0)}%`,
      description: 'نسبة المبيعات إلى المشتريات الشهرية',
      icon: Target,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      trend: salesEfficiency > 80 ? 'up' : salesEfficiency > 40 ? 'neutral' : 'down',
    },
    {
      label: 'متوسط قيمة الصفقة',
      value: formatCurrency(avgDealSize),
      description: 'متوسط قيمة البيع الواحد',
      icon: Layers,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      trend: 'neutral',
    },
  ];

  return (
    <div className="bg-card rounded-xl md:rounded-2xl p-4 md:p-6 card-shadow">
      <h3 className="text-sm sm:text-lg font-bold text-card-foreground mb-4">مؤشرات الأداء المالي المتقدمة</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        {kpis.map((kpi) => {
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : BarChart3;
          const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

          return (
            <div
              key={kpi.label}
              className="p-3 sm:p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors border border-border/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center', kpi.bgColor)}>
                  <kpi.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', kpi.color)} />
                </div>
                <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 leading-tight">{kpi.label}</p>
              <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{kpi.value}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 mt-1 leading-tight hidden sm:block">
                {kpi.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
