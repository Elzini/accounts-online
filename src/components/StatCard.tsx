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
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
  success: {
    bg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
  danger: {
    bg: 'bg-gradient-to-br from-rose-400 to-red-500',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
  info: {
    bg: 'bg-gradient-to-br from-sky-400 to-blue-500',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
  accent: {
    bg: 'bg-gradient-to-br from-orange-400 to-amber-500',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
  cyan: {
    bg: 'bg-gradient-to-br from-cyan-400 to-teal-500',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
  pink: {
    bg: 'bg-gradient-to-br from-pink-400 to-rose-500',
    text: 'text-white',
    iconBg: 'bg-white/20',
  },
};

export function StatCard({ title, value, icon: Icon, gradient, subtitle, onClick }: StatCardProps) {
  const colors = colorConfig[gradient] || colorConfig.primary;
  
  return (
    <div 
      className={cn(
        "rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg hover-lift animate-fade-in transition-all duration-300",
        colors.bg,
        onClick && "cursor-pointer hover:shadow-xl hover:scale-[1.02]"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs sm:text-sm font-medium mb-1 truncate opacity-90", colors.text)}>
            {title}
          </p>
          <p className={cn("text-2xl sm:text-3xl md:text-4xl font-bold truncate", colors.text)}>
            {value}
          </p>
          {subtitle && (
            <p className={cn("text-[11px] sm:text-xs mt-1.5 truncate opacity-80", colors.text)}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shrink-0",
          colors.iconBg
        )}>
          <Icon className={cn("w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8", colors.text)} />
        </div>
      </div>
    </div>
  );
}
