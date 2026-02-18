import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerRegistration {
  waiting: ServiceWorker | null;
  installing: ServiceWorker | null;
  active: ServiceWorker | null;
  update: () => Promise<void>;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
}

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(() => {
    // Restore from sessionStorage so it survives navigation/re-renders
    return sessionStorage.getItem('pwa-need-refresh') === 'true';
  });
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Sync needRefresh to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('pwa-need-refresh', String(needRefresh));
  }, [needRefresh]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg as unknown as ServiceWorkerRegistration);
      });

      // Check for updates periodically
      const intervalId = setInterval(() => {
        navigator.serviceWorker.ready.then((reg) => {
          reg.update();
        });
      }, 60 * 60 * 1000); // Check every hour

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      return () => clearInterval(intervalId);
    }
  }, []);

  useEffect(() => {
    if (!registration) return;

    const handleStateChange = () => {
      if (registration.waiting) {
        setNeedRefresh(true);
      }
    };

    if (registration.waiting) {
      setNeedRefresh(true);
    }

    if (registration.installing) {
      registration.installing.addEventListener('statechange', handleStateChange);
    }

    registration.addEventListener('updatefound', () => {
      if (registration.installing) {
        registration.installing.addEventListener('statechange', handleStateChange);
      }
    });
  }, [registration]);

  // Manual check for updates
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      return { hasUpdate: false, error: 'Service Worker not supported' };
    }

    setIsChecking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.update();
      setLastChecked(new Date());
      
      // Check if there's a waiting worker
      if (reg.waiting) {
        setNeedRefresh(true);
        return { hasUpdate: true };
      }
      
      return { hasUpdate: false };
    } catch (error) {
      console.error('Error checking for updates:', error);
      return { hasUpdate: false, error };
    } finally {
      setIsChecking(false);
    }
  }, []);

  const updateServiceWorker = useCallback(async () => {
    // Try the current registration first
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return;
    }

    // If needRefresh was restored from sessionStorage but registration.waiting is null,
    // try to get a fresh registration
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          return;
        }
        // No waiting worker found - force reload to get latest version
        sessionStorage.removeItem('pwa-need-refresh');
        window.location.reload();
      } catch {
        // Fallback: just reload
        sessionStorage.removeItem('pwa-need-refresh');
        window.location.reload();
      }
    }
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
    sessionStorage.removeItem('pwa-need-refresh');
  }, []);

  return {
    needRefresh,
    updateServiceWorker,
    dismissUpdate,
    checkForUpdates,
    isChecking,
    lastChecked,
  };
}
