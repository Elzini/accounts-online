import { useState } from 'react';
import { Download, Upload, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const EXPORTABLE_KEYS = [
  'dashboard_quick_actions_config',
  'dashboard_smart_alerts_config',
  'dashboard-widgets-config',
  'pref_dashboard_display',
  'launcher_favorite_pages',
  'launcher_page_frequency',
  'pref_auto_theme_mode',
];

export function ExportImportSettings() {
  const { language } = useLanguage();
  const isRtl = language === 'ar';
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    const exportData: Record<string, any> = {};
    for (const key of EXPORTABLE_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          exportData[key] = JSON.parse(val);
        } catch {
          exportData[key] = val;
        }
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isRtl ? 'تم تصدير الإعدادات بنجاح' : 'Settings exported successfully');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          let count = 0;
          for (const [key, value] of Object.entries(data)) {
            if (EXPORTABLE_KEYS.includes(key)) {
              localStorage.setItem(key, JSON.stringify(value));
              count++;
            }
          }
          toast.success(isRtl ? `تم استيراد ${count} إعداد بنجاح — أعد تحميل الصفحة` : `Imported ${count} settings — please reload`);
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          toast.error(isRtl ? 'ملف غير صالح' : 'Invalid file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs">
          <Download className="w-3.5 h-3.5" />
          {isRtl ? 'نقل الإعدادات' : 'Settings'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{isRtl ? 'تصدير / استيراد الإعدادات' : 'Export / Import Settings'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {isRtl
              ? 'صدّر إعدادات الداشبورد كملف JSON لنقلها لحساب آخر أو جهاز آخر.'
              : 'Export your dashboard settings as JSON to transfer to another account or device.'}
          </p>
          <Button onClick={handleExport} className="w-full gap-2" variant="outline">
            <Download className="w-4 h-4" />
            {isRtl ? 'تصدير الإعدادات' : 'Export Settings'}
          </Button>
          <Button onClick={handleImport} className="w-full gap-2" variant="outline">
            <Upload className="w-4 h-4" />
            {isRtl ? 'استيراد الإعدادات' : 'Import Settings'}
          </Button>
          <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-[11px] text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {isRtl ? 'الاستيراد سيستبدل الإعدادات الحالية' : 'Import will replace current settings'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
