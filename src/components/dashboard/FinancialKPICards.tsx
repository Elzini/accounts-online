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
  borderColor: string;
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
  const grossProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const opexRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
  const avgInventory = inventoryCount > 0 ? inventoryCount : 1;
  const inventoryTurnover = totalCost > 0 ? totalCost / (avgInventory * (totalCost / Math.max(soldCount + inventoryCount, 1))) : 0;
  const netProfitMargin = totalRevenue > 0 ? ((totalProfit - totalExpenses) / totalRevenue) * 100 : 0;
  const salesEfficiency = purchasesThisMonth > 0 ? (salesThisMonth / purchasesThisMonth) * 100 : 0;
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
      color: 'hsl(160 84% 39%)',
      bgColor: 'hsl(160 84% 39% / 0.12)',
      borderColor: 'hsl(160 84% 39%)',
      trend: grossProfitMargin > 15 ? 'up' : grossProfitMargin > 5 ? 'neutral' : 'down',
    },
    {
      label: 'هامش صافي الربح',
      value: `${netProfitMargin.toFixed(1)}%`,
      description: 'بعد خصم المصروفات التشغيلية',
      icon: DollarSign,
      color: netProfitMargin >= 0 ? 'hsl(217 91% 60%)' : 'hsl(0 84% 60%)',
      bgColor: netProfitMargin >= 0 ? 'hsl(217 91% 60% / 0.12)' : 'hsl(0 84% 60% / 0.12)',
      borderColor: netProfitMargin >= 0 ? 'hsl(217 91% 60%)' : 'hsl(0 84% 60%)',
      trend: netProfitMargin > 10 ? 'up' : netProfitMargin >= 0 ? 'neutral' : 'down',
    },
    {
      label: 'نسبة المصروفات التشغيلية',
      value: `${opexRatio.toFixed(1)}%`,
      description: 'المصروفات كنسبة من الإيرادات',
      icon: BarChart3,
      color: 'hsl(38 92% 50%)',
      bgColor: 'hsl(38 92% 50% / 0.12)',
      borderColor: 'hsl(38 92% 50%)',
      trend: opexRatio < 30 ? 'up' : opexRatio < 60 ? 'neutral' : 'down',
    },
    {
      label: 'متوسط أيام البيع',
      value: `${averageDaysToSell} يوم`,
      description: 'متوسط المدة من الشراء للبيع',
      icon: Clock,
      color: 'hsl(270 75% 55%)',
      bgColor: 'hsl(270 75% 55% / 0.12)',
      borderColor: 'hsl(270 75% 55%)',
      trend: averageDaysToSell < 30 ? 'up' : averageDaysToSell < 90 ? 'neutral' : 'down',
    },
    {
      label: 'كفاءة المبيعات',
      value: `${salesEfficiency.toFixed(0)}%`,
      description: 'نسبة المبيعات إلى المشتريات الشهرية',
      icon: Target,
      color: 'hsl(190 85% 45%)',
      bgColor: 'hsl(190 85% 45% / 0.12)',
      borderColor: 'hsl(190 85% 45%)',
      trend: salesEfficiency > 80 ? 'up' : salesEfficiency > 40 ? 'neutral' : 'down',
    },
    {
      label: 'متوسط قيمة الصفقة',
      value: formatCurrency(avgDealSize),
      description: 'متوسط قيمة البيع الواحد',
      icon: Layers,
      color: 'hsl(240 60% 60%)',
      bgColor: 'hsl(240 60% 60% / 0.12)',
      borderColor: 'hsl(240 60% 60%)',
      trend: 'neutral',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-card rounded-xl md:rounded-2xl p-4 md:p-6 border border-border/60">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl" style={{ backgroundColor: 'hsl(var(--primary))' }} />
      <h3 className="text-sm sm:text-lg font-bold text-card-foreground mb-4">مؤشرات الأداء المالي المتقدمة</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        {kpis.map((kpi) => {
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : BarChart3;

          return (
            <div
              key={kpi.label}
              className="relative overflow-hidden p-3 sm:p-4 rounded-xl bg-card border border-border/50 hover:shadow-md transition-all"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ backgroundColor: kpi.borderColor }} />
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: kpi.bgColor }}
                >
                  <kpi.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: kpi.color }} />
                </div>
                <TrendIcon className="w-3.5 h-3.5" style={{ color: kpi.trend === 'up' ? 'hsl(var(--success))' : kpi.trend === 'down' ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))' }} />
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
