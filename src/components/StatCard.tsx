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
    <div className="bg-card rounded-xl md:rounded-2xl p-3 md:p-6 card-shadow hover-lift animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
          <p className="text-lg md:text-3xl font-bold text-card-foreground truncate">{value}</p>
          {subtitle && (
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2 truncate">{subtitle}</p>
          )}
        </div>
        <div className={cn("w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl flex items-center justify-center shrink-0", gradientClasses[gradient])}>
          <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
        </div>
      </div>
    </div>
  );
}
