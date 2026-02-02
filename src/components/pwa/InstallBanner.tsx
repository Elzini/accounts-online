import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallBanner() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed before
    const dismissed = localStorage.getItem('pwa-install-banner-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem('pwa-install-banner-dismissed');
      } else {
        setIsDismissed(true);
      }
    }

    // Show banner after 30 seconds of use
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-banner-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsDismissed(true);
    }
  };

  // Don't show if installed, not installable, dismissed, or not ready
  if (isInstalled || !isInstallable || isDismissed || !showBanner) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[150] animate-fade-in">
      <div className="bg-gradient-to-br from-primary to-accent text-primary-foreground rounded-xl shadow-xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base">ثبّت التطبيق</p>
              <p className="text-sm opacity-90 mt-0.5">
                احصل على وصول سريع وتجربة أفضل على جهازك
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mt-1 -mr-1 text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleDismiss}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleInstall}
            size="sm"
            variant="secondary"
            className="flex-1 gap-2 bg-white text-primary hover:bg-white/90"
          >
            <Download className="w-4 h-4" />
            تثبيت التطبيق
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleDismiss}
          >
            ليس الآن
          </Button>
        </div>
      </div>
    </div>
  );
}
