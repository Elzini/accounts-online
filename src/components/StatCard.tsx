import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToArabicWordsShort } from '@/lib/numberToArabicWords';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  onClick?: () => void;
  // Customization props
  size?: 'small' | 'medium' | 'large';
  bgColor?: string;
  fontSize?: number; // percentage 80-130
  showAsWords?: boolean; // عرض الرقم بالكلمات العربية
}

const gradientClasses = {
  primary: 'gradient-primary',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

const sizeClasses = {
  small: 'p-2 sm:p-2.5',
  medium: 'p-2.5 sm:p-3 md:p-4',
  large: 'p-3 sm:p-4 md:p-5',
};

const iconSizeClasses = {
  small: 'w-6 h-6 sm:w-7 sm:h-7',
  medium: 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10',
  large: 'w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12',
};

const iconInnerClasses = {
  small: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
  medium: 'w-4 h-4 sm:w-5 sm:h-5',
  large: 'w-5 h-5 sm:w-6 sm:h-6',
};

const valueSizeClasses = {
  small: 'text-lg sm:text-xl md:text-2xl',
  medium: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
  large: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  subtitle,
  onClick,
  size = 'medium',
  bgColor,
  fontSize = 100,
  showAsWords = false,
}: StatCardProps) {
  const fontScale = fontSize / 100;

  // تحويل القيمة إلى كلمات عربية إذا كانت رقمية ومطلوب العرض بالكلمات
  const displayValue = showAsWords && typeof value === 'number' 
    ? numberToArabicWordsShort(value) + ' ريال'
    : showAsWords && typeof value === 'string' && !isNaN(parseFloat(value.replace(/[^\d.-]/g, '')))
    ? numberToArabicWordsShort(parseFloat(value.replace(/[^\d.-]/g, ''))) + ' ريال'
    : value;

  return (
    <div
      className={cn(
        'bg-card rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-border hover-lift animate-fade-in',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:border-primary/50 transition-colors'
      )}
      style={{
        backgroundColor: bgColor || undefined,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-2.5">
        <div className="flex-1 min-w-0">
          <p
            className="font-medium text-muted-foreground mb-0.5 truncate"
            style={{ fontSize: `${0.65 * fontScale}rem` }}
          >
            {title}
          </p>
          <p
            className={cn(
              'font-bold text-card-foreground',
              showAsWords ? 'text-sm sm:text-base md:text-lg leading-tight' : valueSizeClasses[size]
            )}
            style={{ fontSize: showAsWords ? undefined : `${1.5 * fontScale}rem` }}
            title={typeof value === 'string' ? value : String(value)}
          >
            {displayValue}
          </p>
          {subtitle && (
            <p
              className="text-muted-foreground mt-0.5 sm:mt-1 truncate"
              style={{ fontSize: `${0.625 * fontScale}rem` }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg md:rounded-xl flex items-center justify-center shrink-0 shadow-sm',
            iconSizeClasses[size],
            gradientClasses[gradient]
          )}
        >
          <Icon className={cn('text-white', iconInnerClasses[size])} />
        </div>
      </div>
    </div>
  );
}
