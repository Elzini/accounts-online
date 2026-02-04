import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'cyan' | 'pink';
  subtitle?: string;
  onClick?: () => void;
}

const colorConfig = {
  primary: {
    border: 'border-t-purple-500',
    iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
    lightBg: 'from-purple-50/50 to-white',
  },
  success: {
    border: 'border-t-emerald-500',
    iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    lightBg: 'from-emerald-50/50 to-white',
  },
  warning: {
    border: 'border-t-orange-500',
    iconBg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    lightBg: 'from-orange-50/50 to-white',
  },
  danger: {
    border: 'border-t-rose-500',
    iconBg: 'bg-gradient-to-br from-rose-400 to-red-500',
    lightBg: 'from-rose-50/50 to-white',
  },
  info: {
    border: 'border-t-blue-500',
    iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    lightBg: 'from-blue-50/50 to-white',
  },
  accent: {
    border: 'border-t-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    lightBg: 'from-amber-50/50 to-white',
  },
  cyan: {
    border: 'border-t-cyan-500',
    iconBg: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    lightBg: 'from-cyan-50/50 to-white',
  },
  pink: {
    border: 'border-t-pink-500',
    iconBg: 'bg-gradient-to-br from-pink-400 to-rose-500',
    lightBg: 'from-pink-50/50 to-white',
  },
};

export function StatCard({ title, value, icon: Icon, gradient, subtitle, onClick }: StatCardProps) {
  const colors = colorConfig[gradient] || colorConfig.primary;
  
  return (
    <div 
      className={cn(
        "rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm hover-lift animate-fade-in transition-all duration-300",
        "bg-gradient-to-br border border-border/30",
        colors.lightBg,
        "border-t-[5px]",
        colors.border,
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground truncate">
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shrink-0 shadow-lg",
          colors.iconBg
        )}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
        </div>
      </div>
    </div>
  );
}
