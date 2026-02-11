import { LucideIcon, TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToArabicWordsShort } from '@/lib/numberToArabicWords';
import { useState, useRef, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient: 'primary' | 'success' | 'warning' | 'danger';
  subtitle?: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  bgColor?: string;
  textColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  fontSize?: number;
  showAsWords?: boolean;
  height?: number;
  enable3D?: boolean;
  progress?: number;
  animationIndex?: number;
  trend?: number;
  badge?: string;
  showTrend?: boolean;
  trendColor?: string;
}

const gradientThemes = {
  primary: {
    border: 'hsl(var(--primary))',
    iconBg: 'hsl(var(--primary) / 0.12)',
    iconColor: 'hsl(var(--primary))',
    progressTrack: 'hsl(var(--primary) / 0.1)',
    progressBar: 'hsl(var(--primary))',
  },
  success: {
    border: 'hsl(var(--success))',
    iconBg: 'hsl(var(--success) / 0.12)',
    iconColor: 'hsl(var(--success))',
    progressTrack: 'hsl(var(--success) / 0.1)',
    progressBar: 'hsl(var(--success))',
  },
  warning: {
    border: 'hsl(var(--warning))',
    iconBg: 'hsl(var(--warning) / 0.12)',
    iconColor: 'hsl(var(--warning))',
    progressTrack: 'hsl(var(--warning) / 0.1)',
    progressBar: 'hsl(var(--warning))',
  },
  danger: {
    border: 'hsl(var(--destructive))',
    iconBg: 'hsl(var(--destructive) / 0.12)',
    iconColor: 'hsl(var(--destructive))',
    progressTrack: 'hsl(var(--destructive) / 0.1)',
    progressBar: 'hsl(var(--destructive))',
  },
};

const sizeClasses = {
  small: 'p-3 sm:p-3.5',
  medium: 'p-4 sm:p-5',
  large: 'p-5 sm:p-6',
};

const iconSizeClasses = {
  small: 'w-10 h-10',
  medium: 'w-12 h-12 sm:w-14 sm:h-14',
  large: 'w-14 h-14 sm:w-16 sm:h-16',
};

const iconInnerClasses = {
  small: 'w-5 h-5',
  medium: 'w-6 h-6 sm:w-7 sm:h-7',
  large: 'w-7 h-7 sm:w-8 sm:h-8',
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
  textColor,
  gradientFrom,
  gradientTo,
  fontSize = 100,
  showAsWords = false,
  height,
  enable3D = false,
  progress,
  animationIndex = 0,
  trend,
  badge,
  showTrend = true,
  trendColor,
}: StatCardProps) {
  const fontScale = fontSize / 100;
  const cardRef = useRef<HTMLDivElement>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const theme = gradientThemes[gradient];
  const hasCustomGradient = gradientFrom && gradientTo;
  const useGradientMode = hasCustomGradient || bgColor;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationIndex * 80);
    return () => clearTimeout(timer);
  }, [animationIndex]);

  useEffect(() => {
    if (progress == null) return;
    const timer = setTimeout(() => {
      setAnimatedProgress(Math.min(progress, 100));
    }, animationIndex * 80 + 400);
    return () => clearTimeout(timer);
  }, [progress, animationIndex]);

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

  // Colors based on mode
  const titleColor = textColor || (useGradientMode ? 'rgba(255,255,255,0.75)' : 'hsl(var(--muted-foreground))');
  const valueColor = textColor || (useGradientMode ? 'white' : 'hsl(var(--foreground))');
  const subtitleColor = textColor ? `${textColor}99` : (useGradientMode ? 'rgba(255,255,255,0.6)' : 'hsl(var(--muted-foreground))');
  const arabicWordsColor = textColor ? `${textColor}80` : (useGradientMode ? 'rgba(255,255,255,0.5)' : 'hsl(var(--muted-foreground) / 0.6)');

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-xl group cursor-pointer border',
        sizeClasses[size],
      )}
      style={{
        background: hasCustomGradient
          ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
          : bgColor || 'hsl(var(--card))',
        borderColor: useGradientMode ? 'transparent' : 'hsl(var(--border) / 0.6)',
        height: height ? `${height}px` : undefined,
        minHeight: height ? `${height}px` : (size === 'small' ? '90px' : size === 'large' ? '130px' : '110px'),
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translateY(0px) scale(1)'
          : 'translateY(20px) scale(0.97)',
        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease-out, box-shadow 0.3s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)';
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.03)';
        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Colored top border stripe */}
      {!useGradientMode && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
          style={{ backgroundColor: theme.border }}
        />
      )}

      {/* Content */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p
            className="font-medium mb-1 truncate"
            style={{ fontSize: `clamp(0.65rem, ${0.5 * fontScale}vw + 0.3rem, ${0.8 * fontScale}rem)`, color: titleColor }}
          >
            {title}
          </p>
          <p
            className="font-bold tracking-tight leading-tight"
            style={{
              fontSize: `clamp(0.9rem, ${0.9 * fontScale}vw + 0.4rem, ${1.5 * fontScale}rem)`,
              color: valueColor,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
            }}
            title={typeof value === 'string' ? value : String(value)}
          >
            {value}
          </p>
          {arabicWords && (
            <p
              className="mt-0.5 leading-tight text-xs"
              style={{ fontSize: `${0.7 * fontScale}rem`, color: arabicWordsColor }}
            >
              {arabicWords}
            </p>
          )}
          {subtitle && (
            <p
              className="mt-1 truncate"
              style={{ fontSize: `clamp(0.55rem, ${0.4 * fontScale}vw + 0.25rem, ${0.7 * fontScale}rem)`, color: subtitleColor }}
            >
              {subtitle}
            </p>
          )}
          {/* Trend indicator */}
          {showTrend && trend !== undefined && trend !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              {trend > 0 ? (
                <TrendUpIcon className="w-3 h-3" style={{ color: trendColor || 'hsl(var(--success))' }} />
              ) : (
                <TrendDownIcon className="w-3 h-3" style={{ color: trendColor || 'hsl(var(--destructive))' }} />
              )}
              <span
                className="text-[10px] font-bold"
                style={{ color: trendColor || (trend > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))') }}
              >
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% عن الشهر السابق
              </span>
            </div>
          )}
          {/* Badge */}
          {badge && (
            <span
              className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full"
              style={{
                backgroundColor: useGradientMode ? 'rgba(255,255,255,0.2)' : theme.iconBg,
                color: useGradientMode ? 'rgba(255,255,255,0.9)' : theme.iconColor,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Icon */}
        <div
          className={cn(
            'rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110',
            iconSizeClasses[size],
          )}
          style={{
            backgroundColor: useGradientMode ? 'rgba(255,255,255,0.18)' : theme.iconBg,
          }}
        >
          <Icon
            className={cn(iconInnerClasses[size])}
            style={{ color: useGradientMode ? 'white' : theme.iconColor }}
          />
        </div>
      </div>

      {/* Progress bar */}
      {progress != null && (
        <div className="relative mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: subtitleColor }}>التقدم الشهري</span>
            <span className="text-[10px] font-bold" style={{ color: valueColor }}>{Math.round(progress)}%</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: useGradientMode ? 'rgba(255,255,255,0.12)' : theme.progressTrack }}
          >
            <div
              className="h-full rounded-full relative"
              style={{
                width: `${animatedProgress}%`,
                background: useGradientMode ? 'rgba(255,255,255,0.55)' : theme.progressBar,
                transition: 'width 1s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
