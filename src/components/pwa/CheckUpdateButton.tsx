import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAUpdate } from '@/hooks/usePWAUpdate';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function CheckUpdateButton() {
  const { needRefresh, updateServiceWorker, checkForUpdates, isChecking } = usePWAUpdate();

  const handleCheck = async () => {
    const result = await checkForUpdates();
    
    if (result.hasUpdate) {
      toast.success('تحديث جديد متاح!', {
        description: 'اضغط على "تحديث الآن" لتطبيق التحديث',
        action: {
          label: 'تحديث الآن',
          onClick: updateServiceWorker,
        },
      });
    } else if (result.error) {
      toast.error('فشل التحقق من التحديثات', {
        description: 'تأكد من اتصالك بالإنترنت',
      });
    } else {
      toast.info('لا توجد تحديثات جديدة', {
        description: 'أنت تستخدم أحدث إصدار',
      });
    }
  };

  const handleUpdate = () => {
    updateServiceWorker();
    toast.loading('جاري تحديث التطبيق...', {
      description: 'سيتم إعادة تحميل الصفحة',
    });
  };

  // If update is available, show update button
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
            <span className="hidden sm:inline">تحديث متاح</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>تحديث جديد متاح - اضغط للتحديث</p>
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
            {isChecking ? 'جاري التحقق...' : 'تحقق من التحديثات'}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>تحقق من وجود تحديثات جديدة للتطبيق</p>
      </TooltipContent>
    </Tooltip>
  );
}
