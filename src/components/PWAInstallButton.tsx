import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const navigate = useNavigate();

  // Don't show if already installed
  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      // Redirect to install page for manual instructions
      navigate('/install');
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className="gap-2 text-sm"
        >
          {isInstallable ? (
            <>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تثبيت التطبيق</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">تثبيت</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>ثبّت التطبيق على جهازك للوصول السريع</p>
      </TooltipContent>
    </Tooltip>
  );
}
