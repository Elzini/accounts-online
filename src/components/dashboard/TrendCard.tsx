import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendCardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger';
}

const gradientClasses = {
  primary: 'gradient-primary',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

export function TrendCard({ title, value, trend, icon: Icon, gradient }: TrendCardProps) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground';
  const trendBg = trend > 0 ? 'bg-green-500/10' : trend < 0 ? 'bg-red-500/10' : 'bg-muted';

  return (
    <div className="bg-card rounded-xl md:rounded-2xl p-3 md:p-5 card-shadow hover-lift animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={cn("w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center", gradientClasses[gradient])}>
          <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", trendBg, trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(trend).toFixed(1)}%</span>
        </div>
      </div>
      <div>
        <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <p className="text-lg md:text-2xl font-bold text-card-foreground">{value}</p>
      </div>
    </div>
  );
}
