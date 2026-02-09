import { RefreshCw, Calendar, Clock, Sun, Moon, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useAppSettings } from '@/hooks/useSettings';
import { AmountDisplaySelector, AmountDisplayMode } from './AmountDisplaySelector';

interface WelcomeHeaderProps {
  amountDisplayMode: AmountDisplayMode;
  onAmountDisplayModeChange: (mode: AmountDisplayMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function WelcomeHeader({
  amountDisplayMode,
  onAmountDisplayModeChange,
  onRefresh,
  isRefreshing,
}: WelcomeHeaderProps) {
  const { user } = useAuth();
  const { selectedFiscalYear } = useFiscalYear();
  const { data: settings } = useAppSettings();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'صباح الخير', icon: Sunrise };
    if (hour >= 12 && hour < 18) return { text: 'مساء الخير', icon: Sun };
    return { text: 'مساء الخير', icon: Moon };
  };

  const greeting = getGreeting();
  const userName = user?.email?.split('@')[0] || 'المستخدم';
  const currentTime = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-4 md:p-6 min-w-0">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-40 sm:w-64 h-40 sm:h-64 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-32 sm:w-48 h-32 sm:h-48 bg-purple-500/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Right side - Welcome message */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
            <span className="text-lg sm:text-2xl md:text-3xl">👋</span>
          </div>
          <div className="text-right min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 text-[10px] sm:text-sm mb-0.5 sm:mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {currentTime}
              </span>
              <span>•</span>
              <span className="hidden xs:inline">متصل الآن</span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white truncate">
              أهلاً, {userName} <greeting.icon className="inline-block w-4 h-4 sm:w-6 sm:h-6 text-amber-400" />
            </h1>
            <p className="text-white/70 text-[10px] sm:text-sm mt-0.5 sm:mt-1 truncate">
              {settings?.welcome_message || 'لوحة التحكم الرئيسية • نظرة شاملة على الأداء'}
            </p>
          </div>
        </div>

        {/* Left side - Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 w-full sm:w-auto justify-end flex-wrap">
          {/* Period buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white/10 backdrop-blur-sm rounded-lg p-0.5 sm:p-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-3"
            >
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 sm:ml-1" />
              اليوم
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white hover:bg-white/10 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-3"
            >
              الأسبوع
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white hover:bg-white/10 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-3"
            >
              الشهر
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white hover:bg-white/10 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-3"
            >
              الكل
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-white/70 hover:text-white hover:bg-white/10 h-7 w-7 sm:h-8 sm:w-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
