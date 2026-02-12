import { LucideIcon, TrendingUp as TrendUpIcon, TrendingDown as TrendDownIcon, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { numberToArabicWordsShort } from '@/lib/numberToArabicWords';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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
    iconBg: 'hsl(var(--primary) / 0.10)',
    iconColor: 'hsl(var(--primary))',
    progressTrack: 'hsl(var(--primary) / 0.08)',
    progressBar: 'hsl(var(--primary))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
  success: {
    border: 'hsl(var(--success))',
    iconBg: 'hsl(var(--success) / 0.10)',
    iconColor: 'hsl(var(--success))',
    progressTrack: 'hsl(var(--success) / 0.08)',
    progressBar: 'hsl(var(--success))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
  warning: {
    border: 'hsl(var(--warning))',
    iconBg: 'hsl(var(--warning) / 0.10)',
    iconColor: 'hsl(var(--warning))',
    progressTrack: 'hsl(var(--warning) / 0.08)',
    progressBar: 'hsl(var(--warning))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
  danger: {
    border: 'hsl(var(--destructive))',
    iconBg: 'hsl(var(--destructive) / 0.10)',
    iconColor: 'hsl(var(--destructive))',
    progressTrack: 'hsl(var(--destructive) / 0.08)',
    progressBar: 'hsl(var(--destructive))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
};

const sizeClasses = {
  small: 'p-3 sm:p-4',
  medium: 'p-4 sm:p-5',
  large: 'p-5 sm:p-6',
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
  const { t, language } = useLanguage();

  const theme = gradientThemes[gradient];
  const hasCustomGradient = gradientFrom && gradientTo;
  const useGradientMode = hasCustomGradient || bgColor;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationIndex * 60);
    return () => clearTimeout(timer);
  }, [animationIndex]);

  useEffect(() => {
    if (progress == null) return;
    const timer = setTimeout(() => {
      setAnimatedProgress(Math.min(progress, 100));
    }, animationIndex * 60 + 300);
    return () => clearTimeout(timer);
  }, [progress, animationIndex]);

  const getArabicWords = () => {
    if (!showAsWords || language !== 'ar') return null;
    let numericValue: number | null = null;
    if (typeof value === 'number') {
      numericValue = value;
    } else if (typeof value === 'string') {
      const cleanedValue = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
      numericValue = parseFloat(cleanedValue);
    }
    if (numericValue !== null && !isNaN(numericValue) && numericValue !== 0) {
      return numberToArabicWordsShort(numericValue) + ' SAR';
    }
    return null;
  };

  const arabicWords = getArabicWords();

  // Colors based on mode
  const titleColor = textColor || (useGradientMode ? 'rgba(255,255,255,0.80)' : 'hsl(var(--muted-foreground))');
  const valueColor = textColor || (useGradientMode ? 'white' : 'hsl(var(--foreground))');
  const subtitleColor = textColor ? `${textColor}99` : (useGradientMode ? 'rgba(255,255,255,0.60)' : 'hsl(var(--muted-foreground))');
  const arabicWordsColor = textColor ? `${textColor}80` : (useGradientMode ? 'rgba(255,255,255,0.50)' : 'hsl(var(--muted-foreground) / 0.6)');

  // Trend display
  const showTrendIndicator = showTrend && trend != null && trend !== 0;
  const trendIsUp = trend != null && trend > 0;
  const trendIsDown = trend != null && trend < 0;
  const TrendIcon = trendIsUp ? TrendUpIcon : trendIsDown ? TrendDownIcon : Minus;
  const trendDisplayColor = trendColor || (trendIsUp ? 'hsl(var(--success))' : trendIsDown ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))');
  const trendBgColor = useGradientMode
    ? (trendIsUp ? 'rgba(34,197,94,0.20)' : trendIsDown ? 'rgba(239,68,68,0.20)' : 'rgba(255,255,255,0.15)')
    : (trendIsUp ? theme.trendUpBg : trendIsDown ? theme.trendDownBg : 'hsl(var(--muted) / 0.5)');

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
        minHeight: height ? `${height}px` : (size === 'small' ? '100px' : size === 'large' ? '140px' : '120px'),
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
        transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease-out, box-shadow 0.3s ease',
        boxShadow: 'var(--shadow-sm)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        e.currentTarget.style.transform = 'translateY(-3px) scale(1.01)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Colored top border stripe */}
      {!useGradientMode && (
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl"
          style={{ backgroundColor: theme.border }}
        />
      )}

      {/* Main Content - Vertical Stack */}
      <div className="relative flex flex-col h-full justify-between gap-2">
        {/* Top: Icon + Title row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{
                backgroundColor: useGradientMode ? 'rgba(255,255,255,0.15)' : theme.iconBg,
              }}
            >
              <Icon
                className="w-4.5 h-4.5 sm:w-5 sm:h-5"
                style={{ color: useGradientMode ? 'white' : theme.iconColor }}
              />
            </div>
            <p
              className="font-medium truncate leading-tight"
              style={{ fontSize: `clamp(0.68rem, ${0.45 * fontScale}vw + 0.3rem, ${0.78 * fontScale}rem)`, color: titleColor }}
            >
              {title}
            </p>
          </div>

          {/* Trend indicator - top right */}
          {showTrendIndicator && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
              style={{ backgroundColor: trendBgColor }}
            >
              <TrendIcon className="w-3 h-3" style={{ color: trendDisplayColor }} />
              <span className="text-[10px] font-semibold" style={{ color: trendDisplayColor }}>
                {Math.abs(trend!).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {/* Center: Main Value */}
        <div className="flex-1 flex flex-col justify-center">
          <p
            className="font-bold tracking-tight leading-none"
            style={{
              fontSize: `clamp(1.1rem, ${1.1 * fontScale}vw + 0.5rem, ${1.75 * fontScale}rem)`,
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
              className="mt-0.5 leading-tight"
              style={{ fontSize: `${0.65 * fontScale}rem`, color: arabicWordsColor }}
            >
              {arabicWords}
            </p>
          )}
        </div>

        {/* Bottom: Subtitle + Badge */}
        <div className="flex items-center justify-between gap-2">
          {subtitle && (
            <p
              className="truncate leading-tight"
              style={{ fontSize: `clamp(0.6rem, ${0.38 * fontScale}vw + 0.25rem, ${0.68 * fontScale}rem)`, color: subtitleColor }}
            >
              {subtitle}
            </p>
          )}
          {badge && (
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0"
              style={{
                backgroundColor: useGradientMode ? 'rgba(255,255,255,0.20)' : theme.iconBg,
                color: useGradientMode ? 'rgba(255,255,255,0.90)' : theme.iconColor,
              }}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress != null && (
        <div className="relative mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: subtitleColor }}>{t.monthly_progress}</span>
            <span className="text-[10px] font-bold" style={{ color: valueColor }}>{Math.round(progress)}%</span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: useGradientMode ? 'rgba(255,255,255,0.10)' : theme.progressTrack }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${animatedProgress}%`,
                background: useGradientMode ? 'rgba(255,255,255,0.50)' : theme.progressBar,
                transition: 'width 1s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
