import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
  subtitle?: string;
  onClick?: () => void;
}

const colorConfig = {
  primary: {
    border: 'border-t-[hsl(262,83%,58%)]',
    bg: 'bg-gradient-to-br from-purple-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    iconShadow: 'shadow-purple-200',
  },
  success: {
    border: 'border-t-[hsl(160,84%,39%)]',
    bg: 'bg-gradient-to-br from-emerald-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    iconShadow: 'shadow-emerald-200',
  },
  warning: {
    border: 'border-t-[hsl(38,92%,50%)]',
    bg: 'bg-gradient-to-br from-amber-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    iconShadow: 'shadow-amber-200',
  },
  danger: {
    border: 'border-t-[hsl(0,72%,51%)]',
    bg: 'bg-gradient-to-br from-rose-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-rose-500 to-red-600',
    iconShadow: 'shadow-rose-200',
  },
  info: {
    border: 'border-t-[hsl(199,89%,48%)]',
    bg: 'bg-gradient-to-br from-sky-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    iconShadow: 'shadow-sky-200',
  },
  accent: {
    border: 'border-t-[hsl(25,95%,53%)]',
    bg: 'bg-gradient-to-br from-orange-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
    iconShadow: 'shadow-orange-200',
  },
};

export function StatCard({ title, value, icon: Icon, gradient, subtitle, onClick }: StatCardProps) {
  const colors = colorConfig[gradient] || colorConfig.primary;
  
  return (
    <div 
      className={cn(
        "rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-border/50 hover-lift animate-fade-in transition-all duration-300",
        "border-t-4",
        colors.border,
        colors.bg,
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-muted-foreground mb-1 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground mt-1.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0",
          colors.iconBg,
          colors.iconShadow,
          "shadow-lg"
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
        </div>
      </div>
    </div>
  );
}
