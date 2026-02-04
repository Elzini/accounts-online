import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  onClick?: () => void;
}

const gradientClasses = {
  primary: 'gradient-primary',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

export function StatCard({ title, value, icon: Icon, gradient, subtitle, onClick }: StatCardProps) {
  return (
    <div 
      className={cn(
        "bg-card rounded-lg sm:rounded-xl md:rounded-2xl p-2.5 sm:p-3 md:p-4 shadow-sm border border-border hover-lift animate-fade-in",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-[11px] md:text-xs font-medium text-muted-foreground mb-0.5 truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-card-foreground truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 sm:mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          gradientClasses[gradient]
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
