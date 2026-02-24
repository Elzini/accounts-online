import { useState } from 'react';
import { Settings2, Monitor, Columns3, RefreshCw, LayoutGrid } from 'lucide-react';
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
