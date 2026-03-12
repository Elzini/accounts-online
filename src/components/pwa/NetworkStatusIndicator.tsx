import { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, Database } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function NetworkStatusIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [cachedPagesCount, setCachedPagesCount] = useState(0);
  const queryClient = useQueryClient();

  // Count cached pages
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(names => {
        let total = 0;
        Promise.all(
          names.map(name => 
            caches.open(name).then(cache => cache.keys().then(keys => { total += keys.length; }))
          )
        ).then(() => setCachedPagesCount(total));
      });
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      // Auto-refresh data on reconnect
      queryClient.invalidateQueries();
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, queryClient]);

  // Don't show anything when online and no recent reconnection
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300",
        isOnline
          ? "bg-success text-success-foreground"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>تم استعادة الاتصال - جاري تحديث البيانات...</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>لا يوجد اتصال بالإنترنت - الوضع غير متصل</span>
          {cachedPagesCount > 0 && (
            <span className="flex items-center gap-1 text-xs opacity-80 mr-2">
              <Database className="w-3 h-3" />
              {cachedPagesCount} صفحة مخزنة
            </span>
          )}
        </>
      )}
    </div>
  );
}
