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
    <div className="bg-card rounded-2xl p-6 card-shadow hover-lift animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", gradientClasses[gradient])}>
          <Icon className="w-7 h-7 text-white" />
        </div>
      </div>
    </div>
  );
}
