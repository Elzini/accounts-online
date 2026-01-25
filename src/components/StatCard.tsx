import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
}

const gradientClasses = {
  primary: 'gradient-primary',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

export function StatCard({ title, value, icon: Icon, gradient, subtitle }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm border border-border hover-lift animate-fade-in">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs md:text-sm font-medium text-muted-foreground mb-0.5 sm:mb-1 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-card-foreground truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 md:mt-2 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          gradientClasses[gradient]
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
        </div>
      </div>
    </div>
  );
}
