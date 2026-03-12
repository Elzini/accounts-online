import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// VAPID public key - needs to be generated and set
const VAPID_PUBLIC_KEY = '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PushPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    
    setPermission(Notification.permission as PushPermission);
    
    // Check existing subscription
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported || !user?.id) return false;
    
    setIsLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      
      if (perm !== 'granted') {
        setIsLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      
      // If no VAPID key configured, use notification API directly
      if (!VAPID_PUBLIC_KEY) {
        // Store preference in database
        await supabase.from('app_settings').upsert({
          key: `push_enabled_${user.id}`,
          value: 'true',
        }, { onConflict: 'key' });
        
        setIsSubscribed(true);
        setIsLoading(false);
        return true;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Save subscription to database
      const subJson = subscription.toJSON();
      await supabase.from('app_settings').upsert({
        key: `push_subscription_${user.id}`,
        value: JSON.stringify(subJson),
      }, { onConflict: 'key' });

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user?.id]);

  const unsubscribe = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      
      await supabase.from('app_settings').delete().eq('key', `push_subscription_${user.id}`);
      await supabase.from('app_settings').delete().eq('key', `push_enabled_${user.id}`);
      
      setIsSubscribed(false);
    } catch (error) {
      console.error('Push unsubscribe failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Send a local notification (fallback when no VAPID)
  const sendLocalNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') return;
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          dir: 'rtl',
          lang: 'ar',
          ...options,
        });
      });
    } else {
      new Notification(title, options);
    }
  }, [permission]);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
    sendLocalNotification,
  };
}
