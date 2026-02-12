import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CheckUpdateButton() {
  const { needRefresh, updateServiceWorker, checkForUpdates, isChecking } = usePWAUpdate();
  const { t } = useLanguage();

  const handleCheck = async () => {
    const result = await checkForUpdates();
    
    if (result.hasUpdate) {
      toast.success(t.new_update_available, {
        description: t.update_available_desc,
        action: {
          label: t.update_now,
          onClick: updateServiceWorker,
        },
      });
    } else if (result.error) {
      toast.error(t.check_updates_failed, {
        description: t.check_internet,
      });
    } else {
      toast.info(t.no_new_updates, {
        description: t.using_latest_version,
      });
    }
  };

  const handleUpdate = () => {
    updateServiceWorker();
    toast.loading(t.updating_app, {
      description: t.page_will_reload,
    });
  };

  if (needRefresh) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="default"
            size="sm"
            onClick={handleUpdate}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">{t.update_available_toast}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t.click_update_now}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheck}
          disabled={isChecking}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {isChecking ? t.checking_updates : t.check_updates}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t.check_updates}</p>
      </TooltipContent>
    </Tooltip>
  );
}
