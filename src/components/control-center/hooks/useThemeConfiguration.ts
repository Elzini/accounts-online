/**
 * Theme Configuration - Logic Hook
 * Extracted from ThemeConfigurationTab.tsx (639 lines)
 */
import { useState, useEffect } from 'react';
import { useMenuConfiguration, useSaveMenuConfiguration } from '@/hooks/useSystemControl';
import { toast } from 'sonner';
import { themePresets } from '@/components/themes/ThemePresets';

export const FONT_FAMILIES = [
  { value: 'Cairo', label: 'Cairo (الافتراضي)' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
];

export const PRESET_COLORS = [
  { value: '#3b82f6', label: 'أزرق' }, { value: '#10b981', label: 'أخضر' },
  { value: '#8b5cf6', label: 'بنفسجي' }, { value: '#f59e0b', label: 'برتقالي' },
  { value: '#ef4444', label: 'أحمر' }, { value: '#06b6d4', label: 'سماوي' },
  { value: '#ec4899', label: 'وردي' }, { value: '#14b8a6', label: 'فيروزي' },
  { value: '#f97316', label: 'برتقالي داكن' }, { value: '#6366f1', label: 'نيلي' },
];

export const SIDEBAR_COLORS = [
  { value: '#1e293b', label: 'رمادي داكن' }, { value: '#0f172a', label: 'أزرق داكن' },
  { value: '#18181b', label: 'أسود' }, { value: '#1e1b4b', label: 'بنفسجي داكن' },
  { value: '#164e63', label: 'سماوي داكن' }, { value: '#1c1917', label: 'بني داكن' },
  { value: '#14532d', label: 'أخضر داكن' }, { value: '#7c2d12', label: 'برتقالي داكن' },
];

export const HOVER_EFFECTS = [
  { value: 'none', label: 'بدون تأثير', description: 'لا يوجد تأثير عند التحويم', icon: '⭕' },
  { value: 'lift', label: 'رفع عند التحويم', description: 'رفع العنصر للأعلى مع ظل', icon: '⬆️' },
  { value: 'scale', label: 'تكبير عند التحويم', description: 'تكبير العنصر قليلاً', icon: '🔍' },
  { value: 'glow', label: 'توهج عند التحويم', description: 'إضافة توهج ملون حول العنصر', icon: '✨' },
  { value: 'bounce', label: 'ارتداد عند التحويم', description: 'تأثير ارتداد حيوي', icon: '🏀' },
  { value: 'rotate', label: 'دوران عند التحويم', description: 'دوران خفيف مع تكبير', icon: '🔄' },
  { value: 'border', label: 'إطار متوهج', description: 'إبراز الإطار باللون الأساسي', icon: '🔲' },
  { value: 'shimmer', label: 'بريق متحرك', description: 'تأثير بريق يمر على العنصر', icon: '💫' },
  { value: 'pulse', label: 'نبض مستمر', description: 'تأثير نبض عند التحويم', icon: '💓' },
  { value: 'tilt', label: 'ميل ثلاثي الأبعاد', description: 'ميل العنصر بمنظور 3D', icon: '📐' },
  { value: 'slide-up', label: 'انزلاق للأعلى', description: 'انزلاق العنصر للأعلى', icon: '⏫' },
  { value: 'color-shift', label: 'تغير الألوان', description: 'تحول في درجة اللون', icon: '🌈' },
  { value: 'gradient-border', label: 'إطار متدرج', description: 'إطار بتدرج لوني جميل', icon: '🖼️' },
];

export const ANIMATION_SPEEDS = [
  { value: 'fast', label: 'سريع جداً', duration: '100ms' },
  { value: 'normal', label: 'سريع', duration: '200ms' },
  { value: 'medium', label: 'متوسط', duration: '300ms' },
  { value: 'slow', label: 'بطيء', duration: '500ms' },
];

export interface ExtendedThemeSettings {
  primaryColor: string;
  sidebarColor: string;
  fontFamily: string;
  fontSize: string;
  hoverEffect: string;
  animationSpeed: string;
  enableAnimations: boolean;
  cardStyle: string;
  borderRadius: string;
  shadowIntensity: string;
}

const DEFAULT_THEME: ExtendedThemeSettings = {
  primaryColor: '#3b82f6', sidebarColor: '#1e293b', fontFamily: 'Cairo',
  fontSize: '16', hoverEffect: 'lift', animationSpeed: 'normal',
  enableAnimations: true, cardStyle: 'default', borderRadius: '12', shadowIntensity: 'medium',
};

export const hexToHsl = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '221.2 83.2% 53.3%';
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const applyThemeToDocument = (settings: ExtendedThemeSettings) => {
  const root = document.documentElement;
  root.style.setProperty('--primary', hexToHsl(settings.primaryColor));
  root.style.setProperty('--ring', hexToHsl(settings.primaryColor));
  root.style.setProperty('--sidebar-primary', hexToHsl(settings.primaryColor));
  root.style.setProperty('--sidebar-background', hexToHsl(settings.sidebarColor));
  root.style.setProperty('--radius', `${settings.borderRadius}px`);
  const duration = ANIMATION_SPEEDS.find(s => s.value === settings.animationSpeed)?.duration || '300ms';
  root.style.setProperty('--animation-duration', duration);
  if (settings.hoverEffect && settings.hoverEffect !== 'none') {
    document.body.setAttribute('data-hover-effect', settings.hoverEffect);
  } else {
    document.body.removeAttribute('data-hover-effect');
  }
  if (!settings.enableAnimations) document.body.classList.add('no-animations');
  else document.body.classList.remove('no-animations');
};

export function useThemeConfiguration() {
  const { data: config, isLoading } = useMenuConfiguration();
  const saveConfig = useSaveMenuConfiguration();

  const [themeSettings, setThemeSettings] = useState<ExtendedThemeSettings>(DEFAULT_THEME);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('presets');

  useEffect(() => {
    if (config?.theme_settings && Object.keys(config.theme_settings).length > 0) {
      setThemeSettings({ ...DEFAULT_THEME, ...config.theme_settings as unknown as ExtendedThemeSettings });
    }
  }, [config]);

  useEffect(() => { applyThemeToDocument(themeSettings); }, [themeSettings]);

  const handleChange = (key: keyof ExtendedThemeSettings, value: string | boolean) => {
    setThemeSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const applyPreset = (preset: typeof themePresets[0]) => {
    setThemeSettings(prev => ({ ...prev, primaryColor: preset.colors.primary, sidebarColor: preset.colors.sidebar }));
    setHasChanges(true);
    toast.success(`تم تطبيق ثيم "${preset.name}"`);
  };

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({
        menu_items: config?.menu_items || [],
        theme_settings: themeSettings as unknown as Record<string, string>,
      });
      toast.success('تم حفظ إعدادات المظهر');
      setHasChanges(false);
    } catch { toast.error('حدث خطأ أثناء الحفظ'); }
  };

  const handleReset = () => { setThemeSettings(DEFAULT_THEME); setHasChanges(true); };

  return {
    themeSettings, hasChanges, activeTab, setActiveTab,
    isLoading, saveConfig,
    handleChange, applyPreset, handleSave, handleReset,
  };
}
