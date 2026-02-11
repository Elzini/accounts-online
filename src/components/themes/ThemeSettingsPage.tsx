import { useState, useEffect } from 'react';
import { Check, Moon, Sun, Palette, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { themePresets, ThemePreset } from './ThemePresets';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useQueryClient } from '@tanstack/react-query';

type HoverEffect = 'none' | 'lift' | 'scale' | 'glow';

const HOVER_EFFECT_OPTIONS: Array<{
  value: HoverEffect;
  label: string;
  description: string;
}> = [
  { value: 'lift', label: 'رفع عند التحويم', description: 'رفع العنصر للأعلى مع ظل' },
  { value: 'scale', label: 'تكبير عند التحويم', description: 'تكبير العنصر قليلاً' },
  { value: 'glow', label: 'توهج عند التحويم', description: 'توهج ملون حول العنصر' },
  { value: 'none', label: 'بدون تأثير', description: 'إيقاف تأثير التحويم' },
];

export function ThemeSettingsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [selectedTheme, setSelectedTheme] = useState<string>('royal-blue');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [hoverEffect, setHoverEffect] = useState<HoverEffect>('lift');
  const [previewTheme, setPreviewTheme] = useState<ThemePreset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const applyHoverEffectToDocument = (effect: HoverEffect, animationsEnabled: boolean) => {
    if (!animationsEnabled || effect === 'none') {
      document.body.removeAttribute('data-hover-effect');
      return;
    }
    document.body.setAttribute('data-hover-effect', effect);
  };

  // Load current theme settings
  useEffect(() => {
    const loadCurrentTheme = async () => {
      if (!companyId) return;

      const { data } = await supabase
        .from('menu_configuration')
        .select('theme_settings')
        .eq('company_id', companyId)
        .single();

      if (data?.theme_settings) {
        const settings = data.theme_settings as any;
        if (settings.themeId) {
          setSelectedTheme(settings.themeId);
        }
        if (settings.darkMode !== undefined) {
          setIsDarkMode(!!settings.darkMode);
        }
        if (settings.enableAnimations !== undefined) {
          setEnableAnimations(!!settings.enableAnimations);
        }
        if (settings.hoverEffect !== undefined) {
          setHoverEffect((settings.hoverEffect as HoverEffect) || 'lift');
          applyHoverEffectToDocument((settings.hoverEffect as HoverEffect) || 'lift', settings.enableAnimations ?? true);
        } else {
          applyHoverEffectToDocument('lift', settings.enableAnimations ?? true);
        }
      } else {
        applyHoverEffectToDocument('lift', true);
      }

      // Check current dark mode from document
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    loadCurrentTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // Keep hover effect synced to document for live preview
  useEffect(() => {
    applyHoverEffectToDocument(hoverEffect, enableAnimations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverEffect, enableAnimations]);

  // Apply preview theme temporarily
  const handlePreview = (theme: ThemePreset) => {
    setPreviewTheme(theme);
    applyThemeColors(theme.colors);
  };

  // Cancel preview and restore current theme
  const cancelPreview = () => {
    setPreviewTheme(null);
    const currentTheme = themePresets.find((t) => t.id === selectedTheme);
    if (currentTheme) {
      applyThemeColors(currentTheme.colors);
    }
  };

  // Apply theme colors to CSS variables
  const applyThemeColors = (colors: ThemePreset['colors']) => {
    const root = document.documentElement;

    const hexToHsl = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '210 85% 45%';

      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;

      const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const primaryHsl = hexToHsl(colors.primary);
    const sidebarHsl = hexToHsl(colors.sidebar);
    const accentHsl = hexToHsl(colors.accent);
    const successHsl = hexToHsl(colors.success);
    const warningHsl = hexToHsl(colors.warning);

    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--ring', primaryHsl);
    root.style.setProperty('--sidebar-background', sidebarHsl);
    root.style.setProperty('--accent', accentHsl);
    root.style.setProperty('--success', successHsl);
    root.style.setProperty('--warning', warningHsl);

    // Update gradients to match new theme
    root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${primaryHsl}) 0%, hsl(${accentHsl}) 100%)`);
    root.style.setProperty('--gradient-accent', `linear-gradient(135deg, hsl(${accentHsl}) 0%, hsl(${primaryHsl}) 100%)`);
    root.style.setProperty('--gradient-success', `linear-gradient(135deg, hsl(${successHsl}) 0%, hsl(${successHsl} / 0.7) 100%)`);
    root.style.setProperty('--gradient-warning', `linear-gradient(135deg, hsl(${warningHsl}) 0%, hsl(${warningHsl} / 0.7) 100%)`);
    root.style.setProperty('--gradient-header', `linear-gradient(135deg, hsl(${sidebarHsl}) 0%, hsl(${primaryHsl} / 0.3) 100%)`);
    root.style.setProperty('--shadow-primary', `0 4px 14px -3px hsl(${primaryHsl} / 0.25)`);
  };

  // Toggle dark mode
  const handleDarkModeToggle = (enabled: boolean) => {
    setIsDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle animations
  const handleAnimationsToggle = (enabled: boolean) => {
    setEnableAnimations(enabled);
    if (enabled) {
      document.documentElement.classList.remove('no-animations');
    } else {
      document.documentElement.classList.add('no-animations');
    }
  };

  const handleHoverEffectChange = (effect: HoverEffect) => {
    setHoverEffect(effect);
    // preview handled by effect syncing useEffect
  };

  // Save theme settings
  const saveTheme = async () => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const themeToApply = previewTheme || themePresets.find((t) => t.id === selectedTheme);
      if (!themeToApply) return;

      // Apply the theme
      applyThemeColors(themeToApply.colors);
      setSelectedTheme(themeToApply.id);
      setPreviewTheme(null);

      // Save to database
      const { error } = await supabase
        .from('menu_configuration')
        .upsert(
          {
            company_id: companyId,
            theme_settings: {
              themeId: themeToApply.id,
              primaryColor: themeToApply.colors.primary,
              sidebarColor: themeToApply.colors.sidebar,
              darkMode: isDarkMode,
              enableAnimations,
              hoverEffect,
            },
          },
          {
            onConflict: 'company_id',
          },
        );

      if (error) throw error;

      // Invalidate queries to refresh theme
      queryClient.invalidateQueries({ queryKey: ['menu-configuration', companyId] });

      toast.success('تم حفظ الثيم بنجاح!', {
        description: `تم تطبيق ثيم "${themeToApply.name}"`,
      });
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('حدث خطأ أثناء حفظ الثيم');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            إعدادات المظهر
          </h1>
          <p className="text-muted-foreground mt-1">اختر الثيم والألوان المناسبة لتطبيقك</p>
        </div>
        {previewTheme && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancelPreview}>
              إلغاء المعاينة
            </Button>
            <Button onClick={saveTheme} disabled={isSaving}>
              {isSaving ? 'جاري الحفظ...' : 'تطبيق الثيم'}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="themes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="themes" className="gap-2">
            <Palette className="w-4 h-4" />
            الثيمات
          </TabsTrigger>
          <TabsTrigger value="mode" className="gap-2">
            <Moon className="w-4 h-4" />
            الوضع
          </TabsTrigger>
          <TabsTrigger value="effects" className="gap-2">
            <Sparkles className="w-4 h-4" />
            التأثيرات
          </TabsTrigger>
        </TabsList>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {themePresets.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              const isPreviewing = previewTheme?.id === theme.id;

              return (
                <Card
                  key={theme.id}
                  className={cn(
                    'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group',
                    isSelected && 'ring-2 ring-primary',
                    isPreviewing && 'ring-2 ring-accent',
                  )}
                  onClick={() => handlePreview(theme)}
                >
                  <CardHeader className="p-0">
                    {/* Preview Gradient */}
                    <div
                      className="h-24 rounded-t-lg relative overflow-hidden"
                      style={{ background: theme.preview.gradient }}
                    >
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-white/90 text-primary gap-1">
                            <Check className="w-3 h-3" />
                            مُفعّل
                          </Badge>
                        </div>
                      )}
                      {isPreviewing && !isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="gap-1">
                            <Eye className="w-3 h-3" />
                            معاينة
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg mb-1">{theme.name}</CardTitle>
                    <CardDescription className="text-xs">{theme.description}</CardDescription>

                    {/* Color swatches */}
                    <div className="flex gap-1.5 mt-3">
                      {Object.values(theme.colors)
                        .slice(0, 4)
                        .map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {!previewTheme && (
            <div className="flex justify-end">
              <Button onClick={saveTheme} disabled={isSaving} size="lg">
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Dark/Light Mode Tab */}
        <TabsContent value="mode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                وضع العرض
              </CardTitle>
              <CardDescription>اختر بين الوضع الفاتح والداكن</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dark-mode" className="text-base font-medium">
                    الوضع الداكن
                  </Label>
                  <p className="text-sm text-muted-foreground">تفعيل الوضع الداكن لتقليل إجهاد العين</p>
                </div>
                <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
              </div>

              {/* Preview Cards */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card
                  className={cn('cursor-pointer transition-all p-4 text-center', !isDarkMode && 'ring-2 ring-primary')}
                  onClick={() => handleDarkModeToggle(false)}
                >
                  <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium">فاتح</p>
                </Card>
                <Card
                  className={cn(
                    'cursor-pointer transition-all p-4 text-center bg-slate-900 text-white',
                    isDarkMode && 'ring-2 ring-primary',
                  )}
                  onClick={() => handleDarkModeToggle(true)}
                >
                  <Moon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <p className="font-medium">داكن</p>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveTheme} disabled={isSaving} size="lg">
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                التأثيرات التفاعلية
              </CardTitle>
              <CardDescription>تحكم في الحركات والتأثيرات البصرية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="animations" className="text-base font-medium">
                    تفعيل الحركات
                  </Label>
                  <p className="text-sm text-muted-foreground">تشغيل/إيقاف جميع التأثيرات</p>
                </div>
                <Switch id="animations" checked={enableAnimations} onCheckedChange={handleAnimationsToggle} />
              </div>

              <div className={cn('space-y-3', !enableAnimations && 'opacity-60')}>
                <Label className="text-base font-medium">تأثير التحويم</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {HOVER_EFFECT_OPTIONS.map((opt) => {
                    const selected = hoverEffect === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleHoverEffectChange(opt.value)}
                        className={cn(
                          'hover-effect-target rounded-xl border px-4 py-3 text-sm text-right transition-all',
                          selected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-foreground border-border hover:bg-accent/40',
                        )}
                        aria-pressed={selected}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{opt.label}</span>
                          {selected && <Check className="w-4 h-4" />}
                        </div>
                        <p className={cn('mt-1 text-xs', selected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                          {opt.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  يتم تطبيق التأثير المختار على البطاقات والأزرار في النظام (قد يظهر على الجوال عند الضغط).
                </p>
              </div>

              {/* Demo */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">معاينة سريعة:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Card className="cursor-pointer">
                    <CardContent className="p-4 text-center text-sm">مرّر/اضغط هنا</CardContent>
                  </Card>
                  <Button className="w-full justify-center">زر تجريبي</Button>
                  <Card className="cursor-pointer">
                    <CardContent className="p-4 text-center text-sm">بطاقة تجريبية</CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={saveTheme} disabled={isSaving} size="lg">
              {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

