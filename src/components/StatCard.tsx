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
  // Customization props
  size?: 'small' | 'medium' | 'large';
  bgColor?: string;
  fontSize?: number; // percentage 80-130
  showAsWords?: boolean; // عرض الرقم بالكلمات العربية
  height?: number; // ارتفاع البطاقة بالبكسل
  enable3D?: boolean; // تفعيل التأثير ثلاثي الأبعاد
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
  height,
  enable3D = false,
}: StatCardProps) {
  const fontScale = fontSize / 100;
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 });

  // الحصول على الكلمات العربية للرقم
  const getArabicWords = () => {
    if (!showAsWords) return null;
    
    let numericValue: number | null = null;
    
    if (typeof value === 'number') {
      numericValue = value;
    } else if (typeof value === 'string') {
      // إزالة الفواصل والرموز واستخراج الرقم
      const cleanedValue = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
      numericValue = parseFloat(cleanedValue);
    }
    
    if (numericValue !== null && !isNaN(numericValue) && numericValue !== 0) {
      return numberToArabicWordsShort(numericValue) + ' ريال';
    }
    
    return null;
  };
  
  const arabicWords = getArabicWords();

  // معالجة حركة الماوس للتأثير ثلاثي الأبعاد
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
        'bg-card rounded-lg sm:rounded-xl md:rounded-2xl border border-border animate-fade-in',
        sizeClasses[size],
        onClick && 'cursor-pointer hover:border-primary/50',
        !enable3D && 'hover-lift shadow-sm transition-colors'
      )}
      style={{
        backgroundColor: bgColor || undefined,
        height: height ? `${height}px` : undefined,
        minHeight: height ? `${height}px` : undefined,
        transform: enable3D 
          ? `perspective(1000px) rotateX(${transform.rotateX - 3}deg) rotateY(${transform.rotateY + 3}deg) scale(${transform.rotateX !== 0 || transform.rotateY !== 0 ? 1.03 : 1})`
          : undefined,
        transformStyle: enable3D ? 'preserve-3d' : undefined,
        transition: enable3D ? 'transform 0.15s ease-out, box-shadow 0.15s ease-out' : undefined,
        boxShadow: enable3D 
          ? `${-transform.rotateY * 1.5 - 4}px ${transform.rotateX * 1.5 + 8}px 25px rgba(0,0,0,0.2), 
             ${-transform.rotateY * 0.5 - 2}px ${transform.rotateX * 0.5 + 3}px 8px rgba(0,0,0,0.1),
             inset 0 1px 0 rgba(255,255,255,0.1)`
          : undefined,
        background: enable3D 
          ? `linear-gradient(145deg, ${bgColor || 'hsl(var(--card))'} 0%, ${bgColor ? bgColor : 'hsl(var(--card))'} 100%)`
          : bgColor || undefined,
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-2.5 h-full">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p
            className="font-medium text-muted-foreground mb-0.5 truncate"
            style={{ fontSize: `${0.65 * fontScale}rem` }}
          >
            {title}
          </p>
          <p
            className={cn(
              'font-bold text-card-foreground',
              valueSizeClasses[size]
            )}
            style={{ fontSize: `${1.5 * fontScale}rem` }}
            title={typeof value === 'string' ? value : String(value)}
          >
            {value}
          </p>
          {arabicWords && (
            <p
              className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-tight"
              style={{ fontSize: `${0.7 * fontScale}rem` }}
            >
              {arabicWords}
            </p>
          )}
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
          style={{
            transform: enable3D ? 'translateZ(20px)' : undefined,
          }}
        >
          <Icon className={cn('text-white', iconInnerClasses[size])} />
        </div>
      </div>
    </div>
  );
}
