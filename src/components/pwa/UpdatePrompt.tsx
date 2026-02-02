import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';

export function UpdatePrompt() {
  const { needRefresh, updateServiceWorker, dismissUpdate } = usePWAUpdate();

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[150] animate-fade-in">
      <div className="bg-card border border-border rounded-xl shadow-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">تحديث جديد متاح</p>
              <p className="text-xs text-muted-foreground">
                قم بتحديث التطبيق للحصول على أحدث الميزات
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1"
            onClick={dismissUpdate}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            onClick={updateServiceWorker}
            size="sm"
            className="flex-1 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث الآن
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={dismissUpdate}
          >
            لاحقاً
          </Button>
        </div>
      </div>
    </div>
  );
}
