import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataSource } from '@/hooks/useDataSource';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

export function SyncStatusIndicator() {
  const { 
    isElectronApp, 
    isOnline, 
    syncStatus, 
    triggerSync,
    refreshOnlineStatus 
  } = useDataSource();
  const { companyId } = useCompany();
  const [isSyncing, setIsSyncing] = useState(false);

  // Periodically check online status
  useEffect(() => {
    if (!isElectronApp) return;
    
    const interval = setInterval(refreshOnlineStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [isElectronApp, refreshOnlineStatus]);

  // Don't show in browser mode
  if (!isElectronApp) return null;

  const handleSync = async () => {
    if (!companyId) {
      toast.error('لا يمكن المزامنة بدون تحديد الشركة');
      return;
    }
    
    setIsSyncing(true);
    try {
      const result = await triggerSync(companyId);
      if (result.success && 'pushed' in result && 'pulled' in result) {
        toast.success(`تمت المزامنة: ${result.pushed} رفع، ${result.pulled} تنزيل`);
      } else if (!result.success) {
        toast.error('فشلت المزامنة: ' + ('reason' in result ? result.reason : 'خطأ غير معروف'));
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء المزامنة');
    } finally {
      setIsSyncing(false);
    }
  };

  const hasUnsynced = syncStatus && syncStatus.unsynced > 0;
  const lastSyncText = syncStatus?.lastSync 
    ? new Date(syncStatus.lastSync).toLocaleString('ar-SA')
    : 'لم تتم المزامنة بعد';

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Online/Offline Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isOnline 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isOnline ? (
                <>
                  <Cloud className="h-3 w-3" />
                  <span>متصل</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3" />
                  <span>غير متصل</span>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isOnline 
              ? 'متصل بالإنترنت - البيانات تُزامن تلقائياً'
              : 'غير متصل - البيانات محفوظة محلياً'}
          </TooltipContent>
        </Tooltip>

        {/* Unsynced Changes */}
        {hasUnsynced && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                <AlertCircle className="h-3 w-3" />
                <span>{syncStatus.unsynced} غير مُزامن</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {syncStatus.unsynced} تغيير بانتظار المزامنة مع السحابة
            </TooltipContent>
          </Tooltip>
        )}

        {/* Sync Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              disabled={!isOnline || isSyncing || syncStatus?.syncInProgress}
              className="h-7 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${
                isSyncing || syncStatus?.syncInProgress ? 'animate-spin' : ''
              }`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-center">
              <div>مزامنة الآن</div>
              <div className="text-xs text-muted-foreground">آخر مزامنة: {lastSyncText}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
