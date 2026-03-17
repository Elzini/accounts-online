import { Shield, ShieldAlert, Snowflake, Bell, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecurityStatus } from '@/hooks/useSystemChangeAlerts';

interface Props {
  securityStatus: SecurityStatus;
  pendingCount: number;
  onViewAlert: () => void;
  onClose: () => void;
}

const statusConfig: Record<SecurityStatus, { label: string; icon: any; bgClass: string; textClass: string }> = {
  normal: {
    label: 'الحالة الأمنية: طبيعي',
    icon: Shield,
    bgClass: 'bg-emerald-600',
    textClass: 'text-white',
  },
  warning: {
    label: 'الحالة الأمنية: تحذير',
    icon: ShieldAlert,
    bgClass: 'bg-amber-500',
    textClass: 'text-white',
  },
  frozen: {
    label: 'الحالة الأمنية: النظام مجمّد',
    icon: Snowflake,
    bgClass: 'bg-sky-600',
    textClass: 'text-white',
  },
};

export function SecurityTopBar({ securityStatus, pendingCount, onViewAlert, onClose }: Props) {
  const config = statusConfig[securityStatus];
  const Icon = config.icon;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] ${config.bgClass} ${config.textClass} shadow-lg`}>
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left: Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">{config.label}</span>
          </div>

          {securityStatus === 'frozen' && (
            <Badge className="bg-white/20 text-white border-white/30 text-xs animate-pulse">
              <Snowflake className="w-3 h-3 ml-1" />
              التغييرات محظورة
            </Badge>
          )}
        </div>

        {/* Center: Pending Count */}
        <div className="flex items-center gap-4">
          {pendingCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 gap-2"
              onClick={onViewAlert}
            >
              <Bell className="w-4 h-4" />
              <span>تغييرات معلقة</span>
              <Badge className="bg-white text-foreground font-bold text-xs min-w-[20px] h-5">
                {pendingCount}
              </Badge>
              <ChevronLeft className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Right: Close */}
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20 h-7 w-7"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
