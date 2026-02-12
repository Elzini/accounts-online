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
    headerBg: 'hsl(var(--primary))',
    iconBg: 'hsl(var(--primary) / 0.08)',
    iconColor: 'hsl(var(--primary))',
    progressTrack: 'hsl(var(--primary) / 0.08)',
    progressBar: 'hsl(var(--primary))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
  success: {
    headerBg: 'hsl(var(--success))',
    iconBg: 'hsl(var(--success) / 0.08)',
    iconColor: 'hsl(var(--success))',
    progressTrack: 'hsl(var(--success) / 0.08)',
    progressBar: 'hsl(var(--success))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
  warning: {
    headerBg: 'hsl(var(--warning))',
    iconBg: 'hsl(var(--warning) / 0.08)',
    iconColor: 'hsl(var(--warning))',
    progressTrack: 'hsl(var(--warning) / 0.08)',
    progressBar: 'hsl(var(--warning))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
  danger: {
    headerBg: 'hsl(var(--destructive))',
    iconBg: 'hsl(var(--destructive) / 0.08)',
    iconColor: 'hsl(var(--destructive))',
    progressTrack: 'hsl(var(--destructive) / 0.08)',
    progressBar: 'hsl(var(--destructive))',
    trendUpBg: 'hsl(var(--success) / 0.10)',
    trendDownBg: 'hsl(var(--destructive) / 0.10)',
  },
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

  // Trend display
  const showTrendIndicator = showTrend && trend != null && trend !== 0;
  const trendIsUp = trend != null && trend > 0;
  const trendIsDown = trend != null && trend < 0;
  const TrendIcon = trendIsUp ? TrendUpIcon : trendIsDown ? TrendDownIcon : Minus;
  const trendDisplayColor = trendColor || (trendIsUp ? 'hsl(var(--success))' : trendIsDown ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))');

  // Colors based on mode
  const valueColor = textColor || (useGradientMode ? 'white' : 'hsl(var(--foreground))');
  const subtitleColor = textColor ? `${textColor}99` : (useGradientMode ? 'rgba(255,255,255,0.60)' : 'hsl(var(--muted-foreground))');
  const arabicWordsColor = textColor ? `${textColor}80` : (useGradientMode ? 'rgba(255,255,255,0.50)' : 'hsl(var(--muted-foreground) / 0.6)');

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl group cursor-pointer border"
      style={{
        background: hasCustomGradient
          ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
          : bgColor || 'hsl(var(--card))',
        borderColor: useGradientMode ? 'transparent' : 'hsl(var(--border) / 0.5)',
        height: height ? `${height}px` : undefined,
        minHeight: height ? `${height}px` : (size === 'small' ? '120px' : size === 'large' ? '160px' : '140px'),
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
        transition: 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.4s ease-out, box-shadow 0.3s ease',
        boxShadow: '0 1px 3px 0 hsl(var(--foreground) / 0.04), 0 1px 2px -1px hsl(var(--foreground) / 0.04)',
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px -5px hsl(var(--foreground) / 0.08), 0 4px 10px -6px hsl(var(--foreground) / 0.04)';
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 hsl(var(--foreground) / 0.04), 0 1px 2px -1px hsl(var(--foreground) / 0.04)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Colored Header Band with Title */}
      {!useGradientMode && (
        <div
          className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between"
          style={{ backgroundColor: theme.headerBg }}
        >
          <p
            className="font-semibold text-white truncate leading-tight"
            style={{ fontSize: `clamp(0.7rem, ${0.48 * fontScale}vw + 0.3rem, ${0.82 * fontScale}rem)` }}
          >
            {title}
          </p>
          {showTrendIndicator && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0 bg-white/20">
              <TrendIcon className="w-3 h-3 text-white" />
              <span className="text-[10px] font-semibold text-white">
                {Math.abs(trend!).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* For gradient mode - show title inline */}
      {useGradientMode && (
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 flex items-center justify-between">
          <p
            className="font-semibold truncate leading-tight"
            style={{ fontSize: `clamp(0.7rem, ${0.48 * fontScale}vw + 0.3rem, ${0.82 * fontScale}rem)`, color: textColor || 'rgba(255,255,255,0.85)' }}
          >
            {title}
          </p>
          {showTrendIndicator && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0 bg-white/20">
              <TrendIcon className="w-3 h-3" style={{ color: 'white' }} />
              <span className="text-[10px] font-semibold" style={{ color: 'white' }}>
                {Math.abs(trend!).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-3 sm:pt-4 flex flex-col flex-1 justify-between gap-2">
        {/* Icon + Value */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: useGradientMode ? 'rgba(255,255,255,0.15)' : theme.iconBg,
            }}
          >
            <Icon
              className="w-5 h-5 sm:w-6 sm:h-6"
              style={{ color: useGradientMode ? 'white' : theme.iconColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-bold tracking-tight leading-none"
              style={{
                fontSize: `clamp(1.25rem, ${1.2 * fontScale}vw + 0.6rem, ${2 * fontScale}rem)`,
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
        </div>

        {/* Bottom: Subtitle + Badge */}
        <div className="flex items-center justify-between gap-2 mt-1">
          {subtitle && (
            <p
              className="truncate leading-tight flex items-center gap-1.5"
              style={{ fontSize: `clamp(0.65rem, ${0.4 * fontScale}vw + 0.28rem, ${0.72 * fontScale}rem)`, color: subtitleColor }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: useGradientMode ? 'rgba(255,255,255,0.4)' : theme.headerBg }} />
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
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: subtitleColor }}>{t.monthly_progress}</span>
            <span className="text-[10px] font-bold" style={{ color: valueColor }}>{Math.round(progress)}%</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
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
