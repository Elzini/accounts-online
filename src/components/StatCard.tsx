import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToArabicWordsShort } from '@/lib/numberToArabicWords';
import { useState, useRef } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  bgColor?: string;
  fontSize?: number;
  showAsWords?: boolean;
  height?: number;
  enable3D?: boolean;
}

const gradientClasses = {
  primary: 'gradient-primary',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

const iconBgClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

const sizeClasses = {
  small: 'p-3 sm:p-3.5',
  medium: 'p-3.5 sm:p-4 md:p-5',
  large: 'p-4 sm:p-5 md:p-6',
};

const iconSizeClasses = {
  small: 'w-9 h-9',
  medium: 'w-11 h-11 sm:w-12 sm:h-12',
  large: 'w-12 h-12 sm:w-14 sm:h-14',
};

const iconInnerClasses = {
  small: 'w-4 h-4',
  medium: 'w-5 h-5 sm:w-6 sm:h-6',
  large: 'w-6 h-6 sm:w-7 sm:h-7',
};

const valueSizeClasses = {
  small: 'text-base sm:text-lg',
  medium: 'text-lg sm:text-xl md:text-2xl',
  large: 'text-xl sm:text-2xl md:text-3xl',
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
  height,
  enable3D = false,
}: StatCardProps) {
  const fontScale = fontSize / 100;
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

  const getArabicWords = () => {
    if (!showAsWords) return null;
    let numericValue: number | null = null;
    if (typeof value === 'number') {
      numericValue = value;
    } else if (typeof value === 'string') {
      const cleanedValue = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
      numericValue = parseFloat(cleanedValue);
    }
    if (numericValue !== null && !isNaN(numericValue) && numericValue !== 0) {
      return numberToArabicWordsShort(numericValue) + ' ريال';
    }
    return null;
  };
  
  const arabicWords = getArabicWords();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D || !cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    setTransform({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    if (enable3D) {
      setTransform({ rotateX: 0, rotateY: 0 });
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'bg-card rounded-xl sm:rounded-2xl border border-border/60 animate-fade-in group',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:border-primary/40',
        !enable3D && 'hover-lift shadow-sm hover:shadow-md transition-all duration-300'
      )}
      style={{
        backgroundColor: bgColor || undefined,
        height: height ? `${height}px` : undefined,
        minHeight: height ? `${height}px` : (size === 'small' ? '85px' : size === 'large' ? '120px' : '100px'),
        transform: enable3D 
          ? `perspective(1000px) rotateX(${transform.rotateX - 3}deg) rotateY(${transform.rotateY + 3}deg) scale(${transform.rotateX !== 0 || transform.rotateY !== 0 ? 1.03 : 1})`
          : undefined,
        transformStyle: enable3D ? 'preserve-3d' : undefined,
        transition: enable3D ? 'transform 0.15s ease-out, box-shadow 0.15s ease-out' : undefined,
        boxShadow: enable3D 
          ? `${-transform.rotateY * 1.5 - 4}px ${transform.rotateX * 1.5 + 8}px 25px rgba(0,0,0,0.2), 
             ${-transform.rotateY * 0.5 - 2}px ${transform.rotateX * 0.5 + 3}px 8px rgba(0,0,0,0.1)`
          : undefined,
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-center justify-between gap-3 h-full">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p
            className="font-medium text-muted-foreground mb-1.5 truncate"
            style={{ fontSize: `clamp(0.65rem, ${0.5 * fontScale}vw + 0.3rem, ${0.75 * fontScale}rem)` }}
          >
            {title}
          </p>
          <p
            className={cn(
              'font-bold text-card-foreground whitespace-nowrap overflow-hidden text-ellipsis tracking-tight',
              valueSizeClasses[size]
            )}
            style={{ fontSize: `clamp(0.8rem, ${0.85 * fontScale}vw + 0.4rem, ${1.4 * fontScale}rem)` }}
            title={typeof value === 'string' ? value : String(value)}
          >
            {value}
          </p>
          {arabicWords && (
            <p
              className="text-xs text-muted-foreground mt-0.5 leading-tight"
              style={{ fontSize: `${0.7 * fontScale}rem` }}
            >
              {arabicWords}
            </p>
          )}
          {subtitle && (
            <p
              className="text-muted-foreground mt-1 truncate"
              style={{ fontSize: `clamp(0.55rem, ${0.4 * fontScale}vw + 0.25rem, ${0.65 * fontScale}rem)` }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            'rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
            iconSizeClasses[size],
            iconBgClasses[gradient]
          )}
          style={{
            transform: enable3D ? 'translateZ(20px)' : undefined,
          }}
        >
          <Icon className={cn(iconInnerClasses[size])} />
        </div>
      </div>
    </div>
  );
}
