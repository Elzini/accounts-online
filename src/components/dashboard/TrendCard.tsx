import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendCardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger';
}

const gradientThemes = {
  primary: {
    border: 'hsl(var(--primary))',
    iconBg: 'hsl(var(--primary) / 0.12)',
    iconColor: 'hsl(var(--primary))',
  },
  success: {
    border: 'hsl(var(--success))',
    iconBg: 'hsl(var(--success) / 0.12)',
    iconColor: 'hsl(var(--success))',
  },
  warning: {
    border: 'hsl(var(--warning))',
    iconBg: 'hsl(var(--warning) / 0.12)',
    iconColor: 'hsl(var(--warning))',
  },
  danger: {
    border: 'hsl(var(--destructive))',
    iconBg: 'hsl(var(--destructive) / 0.12)',
    iconColor: 'hsl(var(--destructive))',
  },
};

export function TrendCard({ title, value, trend, icon: Icon, gradient }: TrendCardProps) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-success' : trend < 0 ? 'text-destructive' : 'text-muted-foreground';
  const trendBg = trend > 0 ? 'bg-success/10' : trend < 0 ? 'bg-destructive/10' : 'bg-muted';
  const theme = gradientThemes[gradient];

  return (
    <div
      className="relative overflow-hidden bg-card rounded-lg p-3 md:p-5 border border-border/50 hover:shadow-md transition-all duration-300"
    >
      {/* Colored top border stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
        style={{ backgroundColor: theme.border }}
      />

      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: theme.iconBg }}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: theme.iconColor }} />
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
