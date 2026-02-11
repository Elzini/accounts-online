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
  /** 0-100 progress toward monthly target */
  progress?: number;
  /** Stagger delay index for entry animation */
  animationIndex?: number;
  /** Trend percentage vs previous period (positive = up, negative = down) */
  trend?: number;
  /** Additional metric label shown as a badge (e.g., "هامش 15%") */
  badge?: string;
  /** Show/hide trend indicator */
  showTrend?: boolean;
  /** Custom trend text color */
  trendColor?: string;
}

const gradientStyles = {
  primary: {
    bg: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
    glow: 'hsl(var(--primary) / 0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
    accent: 'hsl(var(--primary) / 0.7)',
    progressTrack: 'rgba(255,255,255,0.12)',
    progressBar: 'rgba(255,255,255,0.55)',
  },
  success: {
    bg: 'linear-gradient(135deg, hsl(var(--success)) 0%, hsl(var(--success) / 0.7) 100%)',
    glow: 'hsl(var(--success) / 0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
    accent: 'hsl(var(--success) / 0.6)',
    progressTrack: 'rgba(255,255,255,0.12)',
    progressBar: 'rgba(255,255,255,0.55)',
  },
  warning: {
    bg: 'linear-gradient(135deg, hsl(var(--warning)) 0%, hsl(var(--warning) / 0.7) 100%)',
    glow: 'hsl(var(--warning) / 0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
    accent: 'hsl(var(--warning) / 0.7)',
    progressTrack: 'rgba(255,255,255,0.12)',
    progressBar: 'rgba(255,255,255,0.55)',
  },
  danger: {
    bg: 'linear-gradient(135deg, hsl(var(--destructive)) 0%, hsl(var(--destructive) / 0.7) 100%)',
    glow: 'hsl(var(--destructive) / 0.35)',
    iconBg: 'rgba(255,255,255,0.18)',
    accent: 'hsl(var(--destructive) / 0.7)',
    progressTrack: 'rgba(255,255,255,0.12)',
    progressBar: 'rgba(255,255,255,0.55)',
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
  const [tilt, setTilt] = useState({ x: 0, y: 0, active: false });
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const style = gradientStyles[gradient];

  // Staggered entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationIndex * 80);
    return () => clearTimeout(timer);
  }, [animationIndex]);

  // Animate progress bar
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -15;
    const tiltY = (x - 0.5) * 15;
    setTilt({ x: tiltX, y: tiltY, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-2xl group cursor-pointer',
        sizeClasses[size],
      )}
      style={{
        background: gradientFrom && gradientTo
          ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
          : bgColor || style.bg,
        height: height ? `${height}px` : undefined,
        minHeight: height ? `${height}px` : (size === 'small' ? '90px' : size === 'large' ? '130px' : '110px'),
        perspective: '1000px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? tilt.active
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.03, 1.03, 1.03)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateY(0px)'
          : 'perspective(1000px) translateY(30px) scale3d(0.95, 0.95, 0.95)',
        transformStyle: 'preserve-3d',
        transition: isVisible
          ? tilt.active
            ? 'transform 0.1s ease-out, opacity 0.5s ease-out'
            : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease-out'
          : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.5s ease-out',
        boxShadow: tilt.active
          ? `0 20px 40px -10px ${style.glow}, 0 8px 20px -8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15)`
          : `0 8px 24px -6px ${style.glow}, 0 4px 12px -4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`,
      }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
      
      {/* Animated shine effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: tilt.active
            ? `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 + tilt.x * 3}%, rgba(255,255,255,0.2) 0%, transparent 60%)`
            : 'none',
        }}
      />

      {/* Decorative circles */}
      <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/5 blur-sm" />
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/5 blur-sm" />

      {/* Content */}
      <div className="relative flex items-center justify-between gap-3" style={{ transform: 'translateZ(10px)' }}>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p
            className="font-medium mb-1 truncate"
            style={{ fontSize: `clamp(0.65rem, ${0.5 * fontScale}vw + 0.3rem, ${0.8 * fontScale}rem)`, color: textColor ? `${textColor}bb` : 'rgba(255,255,255,0.75)' }}
          >
            {title}
          </p>
          <p
            className="font-bold tracking-tight drop-shadow-sm leading-tight"
            style={{ 
              fontSize: `clamp(0.9rem, ${0.9 * fontScale}vw + 0.4rem, ${1.5 * fontScale}rem)`,
              color: textColor || 'white',
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
              style={{ fontSize: `${0.7 * fontScale}rem`, color: textColor ? `${textColor}80` : 'rgba(255,255,255,0.5)' }}
            >
              {arabicWords}
            </p>
          )}
          {subtitle && (
            <p
              className="mt-1 truncate"
              style={{ fontSize: `clamp(0.55rem, ${0.4 * fontScale}vw + 0.25rem, ${0.7 * fontScale}rem)`, color: textColor ? `${textColor}99` : 'rgba(255,255,255,0.6)' }}
            >
              {subtitle}
            </p>
          )}
          {/* Trend indicator */}
          {showTrend && trend !== undefined && trend !== 0 && (
            <div className="flex items-center gap-1 mt-1">
              {trend > 0 ? (
                <TrendUpIcon className="w-3 h-3" style={{ color: trendColor || (trend > 0 ? '#86efac' : '#fca5a5') }} />
              ) : (
                <TrendDownIcon className="w-3 h-3" style={{ color: trendColor || '#fca5a5' }} />
              )}
              <span
                className="text-[10px] font-bold"
                style={{ color: trendColor || (trend > 0 ? '#86efac' : '#fca5a5') }}
              >
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% عن الشهر السابق
              </span>
            </div>
          )}
          {/* Badge */}
          {badge && (
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
              {badge}
            </span>
          )}
        </div>
        
        {/* Icon with glass background */}
        <div
          className={cn(
            'rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3',
            iconSizeClasses[size],
          )}
          style={{
            background: style.iconBg,
            border: '1px solid rgba(255,255,255,0.12)',
            transform: tilt.active ? 'translateZ(30px)' : 'translateZ(0px)',
            transition: 'transform 0.3s ease',
          }}
        >
          <Icon className={cn(iconInnerClasses[size], 'text-white drop-shadow-sm')} />
        </div>
      </div>

      {/* Progress bar */}
      {progress != null && (
        <div className="relative mt-3" style={{ transform: 'translateZ(5px)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/50">التقدم الشهري</span>
            <span className="text-[10px] font-bold text-white/70">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: style.progressTrack }}
          >
            <div
              className="h-full rounded-full relative"
              style={{
                width: `${animatedProgress}%`,
                background: style.progressBar,
                transition: 'width 1s cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              {/* Shimmer on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-l from-white/30 via-transparent to-transparent animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
