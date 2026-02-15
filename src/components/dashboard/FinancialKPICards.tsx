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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t, language } = useLanguage();
  const grossProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const opexRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
  const avgInventory = inventoryCount > 0 ? inventoryCount : 1;
  const netProfitMargin = totalRevenue > 0 ? ((totalProfit - totalExpenses) / totalRevenue) * 100 : 0;
  const salesEfficiency = purchasesThisMonth > 0 ? (salesThisMonth / purchasesThisMonth) * 100 : 0;
  const avgDealSize = salesCount > 0 ? totalRevenue / salesCount : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const kpis: KPIItem[] = [
    {
      label: t.kpi_gross_profit_margin,
      value: `${grossProfitMargin.toFixed(1)}%`,
      description: t.kpi_gross_profit_desc,
      icon: Percent,
      color: 'hsl(var(--success))',
      bgColor: 'hsl(var(--success) / 0.12)',
      borderColor: 'hsl(var(--success))',
      trend: grossProfitMargin > 15 ? 'up' : grossProfitMargin > 5 ? 'neutral' : 'down',
    },
    {
      label: t.kpi_net_profit_margin,
      value: `${netProfitMargin.toFixed(1)}%`,
      description: t.kpi_net_profit_desc,
      icon: DollarSign,
      color: netProfitMargin >= 0 ? 'hsl(var(--info))' : 'hsl(var(--destructive))',
      bgColor: netProfitMargin >= 0 ? 'hsl(var(--info) / 0.12)' : 'hsl(var(--destructive) / 0.12)',
      borderColor: netProfitMargin >= 0 ? 'hsl(var(--info))' : 'hsl(var(--destructive))',
      trend: netProfitMargin > 10 ? 'up' : netProfitMargin >= 0 ? 'neutral' : 'down',
    },
    {
      label: t.kpi_opex_ratio,
      value: `${opexRatio.toFixed(1)}%`,
      description: t.kpi_opex_desc,
      icon: BarChart3,
      color: 'hsl(var(--warning))',
      bgColor: 'hsl(var(--warning) / 0.12)',
      borderColor: 'hsl(var(--warning))',
      trend: opexRatio < 30 ? 'up' : opexRatio < 60 ? 'neutral' : 'down',
    },
    {
      label: t.kpi_avg_days_to_sell,
      value: `${averageDaysToSell} ${t.kpi_avg_days_unit}`,
      description: t.kpi_avg_days_desc,
      icon: Clock,
      color: 'hsl(var(--primary))',
      bgColor: 'hsl(var(--primary) / 0.12)',
      borderColor: 'hsl(var(--primary))',
      trend: averageDaysToSell < 30 ? 'up' : averageDaysToSell < 90 ? 'neutral' : 'down',
    },
    {
      label: t.kpi_sales_efficiency,
      value: `${salesEfficiency.toFixed(0)}%`,
      description: t.kpi_sales_efficiency_desc,
      icon: Target,
      color: 'hsl(var(--info))',
      bgColor: 'hsl(var(--info) / 0.12)',
      borderColor: 'hsl(var(--info))',
      trend: salesEfficiency > 80 ? 'up' : salesEfficiency > 40 ? 'neutral' : 'down',
    },
    {
      label: t.kpi_avg_deal_size,
      value: formatCurrency(avgDealSize),
      description: t.kpi_avg_deal_desc,
      icon: Layers,
      color: 'hsl(var(--primary))',
      bgColor: 'hsl(var(--primary) / 0.12)',
      borderColor: 'hsl(var(--primary))',
      trend: 'neutral',
    },
  ];

  return (
    <div className="relative overflow-hidden bg-card rounded-lg p-4 md:p-6 border border-border/50">
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg" style={{ backgroundColor: 'hsl(var(--primary))' }} />
      <h3 className="text-sm sm:text-lg font-bold text-card-foreground mb-4">{t.kpi_advanced_title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        {kpis.map((kpi) => {
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : BarChart3;

          return (
            <div
              key={kpi.label}
              className="relative overflow-hidden p-3 sm:p-4 rounded-lg bg-card border border-border/50 hover:shadow-md transition-all"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg" style={{ backgroundColor: kpi.borderColor }} />
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
