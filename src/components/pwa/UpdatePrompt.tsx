import { useState } from 'react';
import { RefreshCw, X, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { useLanguage } from '@/contexts/LanguageContext';

const CHANGELOG = [
  {
    version: '2.6.0',
    date: '2026-03-10',
    changes: [
      { ar: 'تحسين تقرير المشتريات: إضافة رقم اللوحة والمصروفات والإجمالي', en: 'Purchase report: added plate number, expenses & total' },
      { ar: 'فلترة تقرير المشتريات حسب حالة السيارة (متاحة/مباعة)', en: 'Filter purchase report by car status (available/sold)' },
      { ar: 'إصلاح ترقيم المخزون ليبدأ من 1 لكل شركة', en: 'Fixed inventory numbering to start from 1 per company' },
      { ar: 'تحسينات الأداء والاستقرار', en: 'Performance and stability improvements' },
    ],
  },
];

export function UpdatePrompt() {
  const { needRefresh, updateServiceWorker, dismissUpdate } = usePWAUpdate();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [showChangelog, setShowChangelog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!needRefresh) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    setProgress(0);

    // Simulate progress while the service worker updates
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      await updateServiceWorker();
      setProgress(100);
      // Small delay to show 100% before reload
      setTimeout(() => {
        clearInterval(interval);
      }, 500);
    } catch {
      clearInterval(interval);
      setIsUpdating(false);
      setProgress(0);
    }
  };

  return (
    <>
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[150] animate-fade-in">
        <div className="bg-card border border-primary/30 rounded-xl shadow-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isUpdating ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {isUpdating
                    ? (isAr ? 'جاري التحديث...' : 'Updating...')
                    : (isAr ? 'تحديث جديد متاح! 🎉' : 'New update available! 🎉')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isUpdating
                    ? (isAr ? 'يرجى الانتظار حتى يكتمل التحديث' : 'Please wait until the update completes')
                    : (isAr ? 'نسخة جديدة جاهزة مع تحسينات وميزات جديدة' : 'A new version is ready with improvements')}
                </p>
              </div>
            </div>
            {!isUpdating && (
              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1" onClick={dismissUpdate}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isUpdating ? (
            <div className="mt-3 space-y-1.5">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {Math.round(progress)}%
              </p>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setShowChangelog(true)} className="text-xs">
                {isAr ? 'عرض التغييرات' : 'View Changes'}
              </Button>
              <Button onClick={handleUpdate} size="sm" className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" />
                {isAr ? 'تحديث الآن' : 'Update Now'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showChangelog} onOpenChange={setShowChangelog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              {isAr ? 'سجل التغييرات' : 'Changelog'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 max-h-80 overflow-y-auto">
            {CHANGELOG.map((release) => (
              <div key={release.version}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">{release.version}</Badge>
                  <span className="text-xs text-muted-foreground">{release.date}</span>
                </div>
                <ul className="space-y-1.5">
                  {release.changes.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      <span>{isAr ? c.ar : c.en}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangelog(false)}>
              {isAr ? 'لاحقاً' : 'Later'}
            </Button>
            <Button onClick={() => { setShowChangelog(false); handleUpdate(); }} className="gap-1.5">
              <RefreshCw className="w-4 h-4" />
              {isAr ? 'تحديث الآن' : 'Update Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
