import { useState, useEffect } from 'react';
import { Settings2, Monitor, Columns3, RefreshCw, LayoutGrid, Sun, Moon, Sunrise } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DashboardDensity,
  GridColumns,
  AutoRefreshInterval,
  DashboardDisplaySettings,
} from '@/hooks/useUserPreferences';

interface DisplaySettingsDialogProps {
  settings: DashboardDisplaySettings;
  onUpdate: (partial: Partial<DashboardDisplaySettings>) => void;
}

const DENSITY_OPTIONS: { value: DashboardDensity; labelAr: string; labelEn: string; desc: string }[] = [
  { value: 'compact', labelAr: 'مضغوط', labelEn: 'Compact', desc: 'أكثر بيانات في مساحة أقل' },
  { value: 'comfortable', labelAr: 'مريح', labelEn: 'Comfortable', desc: 'العرض الافتراضي' },
  { value: 'spacious', labelAr: 'واسع', labelEn: 'Spacious', desc: 'مساحات أكبر وأقل ازدحام' },
];

const COLUMN_OPTIONS: GridColumns[] = [2, 3, 4, 5, 6];

const REFRESH_OPTIONS: { value: AutoRefreshInterval; labelAr: string; labelEn: string }[] = [
  { value: 0, labelAr: 'إيقاف', labelEn: 'Off' },
  { value: 30, labelAr: 'كل 30 ثانية', labelEn: 'Every 30s' },
  { value: 60, labelAr: 'كل دقيقة', labelEn: 'Every 1m' },
  { value: 300, labelAr: 'كل 5 دقائق', labelEn: 'Every 5m' },
];

export function DisplaySettingsDialog({ settings, onUpdate }: DisplaySettingsDialogProps) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
          <Monitor className="w-3.5 h-3.5" />
          {isRtl ? 'إعدادات العرض' : 'Display'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            {isRtl ? 'إعدادات العرض' : 'Display Settings'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Density */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              {isRtl ? 'كثافة العرض' : 'Display Density'}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {DENSITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdate({ density: opt.value })}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all',
                    settings.density === opt.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div className="text-xs font-semibold">{isRtl ? opt.labelAr : opt.labelEn}</div>
                  {/* Visual preview */}
                  <div className={cn(
                    'mt-1.5 mx-auto flex flex-col gap-0.5',
                    opt.value === 'compact' && 'gap-[1px]',
                    opt.value === 'spacious' && 'gap-1.5',
                  )}>
                    {[1, 2, 3].map(i => (
                      <div key={i} className={cn(
                        'rounded-sm bg-muted-foreground/20',
                        opt.value === 'compact' && 'h-1.5',
                        opt.value === 'comfortable' && 'h-2',
                        opt.value === 'spacious' && 'h-3',
                      )} />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions Columns */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Columns3 className="w-3.5 h-3.5" />
              {isRtl ? 'أعمدة الإجراءات السريعة' : 'Quick Actions Columns'}
            </Label>
            <div className="flex gap-1.5">
              {COLUMN_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => onUpdate({ gridColumns: n })}
                  className={cn(
                    'flex-1 h-8 rounded-md border text-xs font-semibold transition-all',
                    settings.gridColumns === n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Columns */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Columns3 className="w-3.5 h-3.5" />
              {isRtl ? 'أعمدة بطاقات KPI' : 'KPI Card Columns'}
            </Label>
            <div className="flex gap-1.5">
              {COLUMN_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => onUpdate({ kpiColumns: n })}
                  className={cn(
                    'flex-1 h-8 rounded-md border text-xs font-semibold transition-all',
                    settings.kpiColumns === n
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              {isRtl ? 'التحديث التلقائي' : 'Auto Refresh'}
            </Label>
            <Select
              value={String(settings.autoRefreshInterval)}
              onValueChange={v => onUpdate({ autoRefreshInterval: Number(v) as AutoRefreshInterval })}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {isRtl ? opt.labelAr : opt.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {settings.autoRefreshInterval > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" />
                {isRtl ? 'نشط' : 'Active'}
              </Badge>
            )}
          </div>

          {/* Auto Theme */}
          <AutoThemeSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AutoThemeMode = 'manual' | 'auto' | 'schedule';
const AUTO_THEME_KEY = 'pref_auto_theme_mode';

function AutoThemeSection() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  
  const [mode, setMode] = useState<AutoThemeMode>(() => {
    try {
      return (localStorage.getItem(AUTO_THEME_KEY) as AutoThemeMode) || 'manual';
    } catch { return 'manual'; }
  });

  useEffect(() => {
    localStorage.setItem(AUTO_THEME_KEY, mode);
    if (mode === 'auto') {
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 19 || hour < 6;
      if (shouldBeDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  // Auto-check every minute if in auto mode
  useEffect(() => {
    if (mode !== 'auto') return;
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const shouldBeDark = hour >= 19 || hour < 6;
      if (shouldBeDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }, 60000);
    return () => clearInterval(interval);
  }, [mode]);

  const options: { value: AutoThemeMode; label: string; labelEn: string; icon: any }[] = [
    { value: 'manual', label: 'يدوي', labelEn: 'Manual', icon: Settings2 },
    { value: 'auto', label: 'تلقائي', labelEn: 'Auto', icon: Sunrise },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium flex items-center gap-1.5">
        <Moon className="w-3.5 h-3.5" />
        {isRtl ? 'الوضع الليلي/النهاري' : 'Dark/Light Mode'}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={cn(
                'p-2.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1',
                mode === opt.value
                  ? 'border-primary bg-primary/10 ring-1 ring-primary'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-semibold">{isRtl ? opt.label : opt.labelEn}</span>
            </button>
          );
        })}
      </div>
      {mode === 'auto' && (
        <p className="text-[10px] text-muted-foreground">
          {isRtl ? '🌙 الوضع الداكن من 7 مساءً إلى 6 صباحاً تلقائياً' : '🌙 Dark mode from 7 PM to 6 AM automatically'}
        </p>
      )}
    </div>
  );
}
