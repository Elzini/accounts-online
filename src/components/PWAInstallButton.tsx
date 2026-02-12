import { Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Don't show if already installed
  if (isInstalled) return null;

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
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
              <span className="hidden sm:inline">{t.install_app}</span>
            </>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">{t.install}</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{t.install_app_tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
