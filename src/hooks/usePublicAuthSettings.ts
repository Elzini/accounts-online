import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { defaultSettings } from '@/services/settings';

export interface PublicAuthSettings {
  login_title: string;
  login_subtitle: string;
  login_bg_color: string;
  login_card_color: string;
  login_header_gradient_start: string;
  login_header_gradient_end: string;
  login_button_text: string;
  login_logo_url: string;
  register_title: string;
  register_subtitle: string;
  register_button_text: string;
}

const defaultPublicSettings: PublicAuthSettings = {
  login_title: defaultSettings.login_title,
  login_subtitle: defaultSettings.login_subtitle,
  login_bg_color: defaultSettings.login_bg_color,
  login_card_color: defaultSettings.login_card_color,
  login_header_gradient_start: defaultSettings.login_header_gradient_start,
  login_header_gradient_end: defaultSettings.login_header_gradient_end,
  login_button_text: defaultSettings.login_button_text,
  login_logo_url: '',
  register_title: 'تسجيل شركة جديدة',
  register_subtitle: 'أنشئ حساب شركتك الآن',
  register_button_text: 'تسجيل الشركة',
};

/**
 * Fetches public authentication UI settings from secure edge function.
 * This replaces direct database access for unauthenticated users.
 */
export function usePublicAuthSettings() {
  const [settings, setSettings] = useState<PublicAuthSettings>(defaultPublicSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('public-auth-settings', {
          method: 'GET',
        });

        if (error) {
          console.error('Error fetching public auth settings:', error);
          setError(error);
          setLoading(false);
          return;
        }

        if (data?.success && data?.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch public auth settings:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}
