import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/hooks/modules/useMiscServices';
import { toast } from 'sonner';
import { defaultSettings } from '@/services/settings';

export interface LoginSettings {
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

const initialSettings: LoginSettings = {
  login_title: defaultSettings.login_title,
  login_subtitle: defaultSettings.login_subtitle,
  login_bg_color: defaultSettings.login_bg_color,
  login_card_color: defaultSettings.login_card_color,
  login_header_gradient_start: defaultSettings.login_header_gradient_start,
  login_header_gradient_end: defaultSettings.login_header_gradient_end,
  login_button_text: defaultSettings.login_button_text,
  login_logo_url: '',
  register_title: 'تسجيل شركة جديدة',
  register_subtitle: 'انضم إلى Elzini SaaS',
  register_button_text: 'تسجيل الشركة',
};

export function useLoginSettings() {
  const [settings, setSettings] = useState<LoginSettings>({ ...initialSettings });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .is('company_id', null);

      if (error) {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data) {
        const newSettings = { ...settings };
        data.forEach(row => {
          if (row.key in newSettings && row.value) {
            (newSettings as any)[row.key] = row.value;
          }
        });
        setSettings(newSettings);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', key)
          .is('company_id', null)
          .maybeSingle();

        if (existing) {
          const { error } = await supabase.from('app_settings').update({ value }).eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('app_settings').insert({ key, value, company_id: null });
          if (error) throw error;
        }
      }
      toast.success('تم حفظ إعدادات شاشة الدخول بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `global-login-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('app-logos')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('app-logos').getPublicUrl(fileName);
      const newLogoUrl = data.publicUrl;
      setSettings(prev => ({ ...prev, login_logo_url: newLogoUrl }));

      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', 'login_logo_url')
        .is('company_id', null)
        .maybeSingle();

      if (existing) {
        await supabase.from('app_settings').update({ value: newLogoUrl }).eq('id', existing.id);
      } else {
        await supabase.from('app_settings').insert({ key: 'login_logo_url', value: newLogoUrl, company_id: null });
      }
      toast.success('تم رفع الشعار وحفظه بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, login_logo_url: '' }));
  };

  return {
    settings,
    setSettings,
    saving,
    uploading,
    logoInputRef,
    handleSave,
    handleLogoUpload,
    handleRemoveLogo,
  };
}
