import { useState, useEffect } from 'react';
import { Database, HardDrive, CloudOff, RefreshCw } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function OfflineDataIndicator() {
  const { isOnline } = useNetworkStatus();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const queryClient = useQueryClient();
  const [pendingActions, setPendingActions] = useState<number>(0);

  // Track offline actions in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('offline_pending_actions');
    if (stored) setPendingActions(parseInt(stored, 10));
  }, []);

  // When back online, sync pending actions
  useEffect(() => {
    if (isOnline && pendingActions > 0) {
      toast.info(
        isAr ? `${pendingActions} عملية بانتظار المزامنة` : `${pendingActions} actions pending sync`,
        {
          action: {
            label: isAr ? 'مزامنة' : 'Sync',
            onClick: async () => {
              queryClient.invalidateQueries();
              localStorage.removeItem('offline_pending_actions');
              setPendingActions(0);
              toast.success(isAr ? 'تمت المزامنة بنجاح' : 'Sync completed');
            },
          },
        }
      );
    }
  }, [isOnline, pendingActions, isAr, queryClient]);

  if (isOnline) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">
          <HardDrive className="w-3.5 h-3.5" />
          <span>{isAr ? 'وضع أوفلاين' : 'Offline Mode'}</span>
          {pendingActions > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">
              {pendingActions}
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {isAr 
            ? 'أنت تعمل بدون اتصال. البيانات المخزنة مؤقتاً متاحة للعرض.'
            : 'Working offline. Cached data is available for viewing.'}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
