import { Shield, ShieldAlert, Snowflake, Bell, X, ChevronLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecurityStatus } from '@/hooks/useSystemChangeAlerts';
import { cn } from '@/lib/utils';

interface Props {
  securityStatus: SecurityStatus;
  pendingCount: number;
  onViewAlert: () => void;
  onClose: () => void;
}

const statusConfig: Record<SecurityStatus, {
  label: string;
  labelEn: string;
  icon: any;
  gradient: string;
  pulseColor: string;
  dotColor: string;
}> = {
  normal: {
    label: 'الحالة الأمنية: طبيعي',
    labelEn: 'Security: Normal',
    icon: Shield,
    gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
    pulseColor: 'bg-emerald-400',
    dotColor: 'bg-emerald-300',
  },
  warning: {
    label: 'الحالة الأمنية: تحذير',
    labelEn: 'Security: Warning',
    icon: ShieldAlert,
    gradient: 'from-amber-600 via-amber-500 to-orange-500',
    pulseColor: 'bg-amber-400',
    dotColor: 'bg-amber-300',
  },
  frozen: {
    label: 'النظام مجمّد',
    labelEn: 'System Frozen',
    icon: Snowflake,
    gradient: 'from-sky-700 via-blue-600 to-indigo-600',
    pulseColor: 'bg-sky-400',
    dotColor: 'bg-sky-300',
  },
};

export function SecurityTopBar({ securityStatus, pendingCount, onViewAlert, onClose }: Props) {
  const config = statusConfig[securityStatus];
  const Icon = config.icon;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-[100] text-white shadow-lg',
      `bg-gradient-to-l ${config.gradient}`
    )}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
      
      <div className="relative max-w-screen-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Right: Status */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5" />
            </div>
            {/* Live pulse dot */}
            <div className={cn('absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full', config.dotColor)}>
              <div className={cn('absolute inset-0 rounded-full animate-ping', config.pulseColor)} />
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">{config.label}</span>
            <div className="flex items-center gap-1.5 text-white/70 text-[10px]">
              <Activity className="w-3 h-3" />
              <span>مراقبة مباشرة</span>
            </div>
          </div>

          {securityStatus === 'frozen' && (
            <Badge className="bg-white/15 text-white border-white/25 text-[10px] font-bold animate-pulse backdrop-blur-sm">
              <Snowflake className="w-3 h-3 ml-1" />
              التغييرات محظورة
            </Badge>
          )}
        </div>

        {/* Center: Pending Count */}
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/15 gap-2 h-9 rounded-xl border border-white/20 backdrop-blur-sm px-4"
              onClick={onViewAlert}
            >
              <div className="relative">
                <Bell className="w-4 h-4" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              </div>
              <span className="text-xs font-semibold">تغييرات معلقة</span>
              <Badge className="bg-white text-foreground font-bold text-[10px] min-w-[22px] h-5 shadow-sm">
                {pendingCount}
              </Badge>
              <ChevronLeft className="w-3 h-3 opacity-60" />
            </Button>
          )}
        </div>

        {/* Left: Close */}
        <Button
          size="icon"
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/15 h-8 w-8 rounded-lg"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
