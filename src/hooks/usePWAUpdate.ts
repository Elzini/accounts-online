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
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

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

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [registration]);

  const dismissUpdate = useCallback(() => {
    setNeedRefresh(false);
  }, []);

  return {
    needRefresh,
    updateServiceWorker,
    dismissUpdate,
  };
}
