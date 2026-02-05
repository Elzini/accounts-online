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

export function ThemeSettingsPage() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [selectedTheme, setSelectedTheme] = useState<string>('royal-blue');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [previewTheme, setPreviewTheme] = useState<ThemePreset | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
          setIsDarkMode(settings.darkMode);
        }
        if (settings.enableAnimations !== undefined) {
          setEnableAnimations(settings.enableAnimations);
        }
      }

      // Check current dark mode from document
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    loadCurrentTheme();
  }, [companyId]);

  // Apply preview theme temporarily
  const handlePreview = (theme: ThemePreset) => {
    setPreviewTheme(theme);
    applyThemeColors(theme.colors);
  };

  // Cancel preview and restore current theme
  const cancelPreview = () => {
    setPreviewTheme(null);
    const currentTheme = themePresets.find(t => t.id === selectedTheme);
    if (currentTheme) {
      applyThemeColors(currentTheme.colors);
    }
  };

  // Apply theme colors to CSS variables
  const applyThemeColors = (colors: ThemePreset['colors']) => {
    const root = document.documentElement;
    
    // Convert hex to HSL for CSS variables
    const hexToHsl = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '210 85% 45%';
      
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

    root.style.setProperty('--primary', hexToHsl(colors.primary));
    root.style.setProperty('--ring', hexToHsl(colors.primary));
    root.style.setProperty('--sidebar-background', hexToHsl(colors.sidebar));
    root.style.setProperty('--accent', hexToHsl(colors.accent));
    root.style.setProperty('--success', hexToHsl(colors.success));
    root.style.setProperty('--warning', hexToHsl(colors.warning));
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

  // Save theme settings
  const saveTheme = async () => {
    if (!companyId) return;

    setIsSaving(true);
    try {
      const themeToApply = previewTheme || themePresets.find(t => t.id === selectedTheme);
      if (!themeToApply) return;

      // Apply the theme
      applyThemeColors(themeToApply.colors);
      setSelectedTheme(themeToApply.id);
      setPreviewTheme(null);

      // Save to database
      const { error } = await supabase
        .from('menu_configuration')
        .upsert({
          company_id: companyId,
          theme_settings: {
            themeId: themeToApply.id,
            primaryColor: themeToApply.colors.primary,
            sidebarColor: themeToApply.colors.sidebar,
            darkMode: isDarkMode,
            enableAnimations,
          },
        }, {
          onConflict: 'company_id',
        });

      if (error) throw error;

      // Invalidate queries to refresh theme
      queryClient.invalidateQueries({ queryKey: ['menu-configuration'] });

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
          <p className="text-muted-foreground mt-1">
            اختر الثيم والألوان المناسبة لتطبيقك
          </p>
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
                    "cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group",
                    isSelected && "ring-2 ring-primary",
                    isPreviewing && "ring-2 ring-accent"
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
                    <CardDescription className="text-xs">
                      {theme.description}
                    </CardDescription>
                    
                    {/* Color swatches */}
                    <div className="flex gap-1.5 mt-3">
                      {Object.values(theme.colors).slice(0, 4).map((color, i) => (
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
              <CardDescription>
                اختر بين الوضع الفاتح والداكن
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="dark-mode" className="text-base font-medium">
                    الوضع الداكن
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    تفعيل الوضع الداكن لتقليل إجهاد العين
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>

              {/* Preview Cards */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Card
                  className={cn(
                    "cursor-pointer transition-all p-4 text-center",
                    !isDarkMode && "ring-2 ring-primary"
                  )}
                  onClick={() => handleDarkModeToggle(false)}
                >
                  <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium">فاتح</p>
                </Card>
                <Card
                  className={cn(
                    "cursor-pointer transition-all p-4 text-center bg-slate-900 text-white",
                    isDarkMode && "ring-2 ring-primary"
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
              <CardDescription>
                تحكم في الحركات والتأثيرات البصرية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="animations" className="text-base font-medium">
                    تفعيل الحركات
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    إظهار حركات انتقالية سلسة عند التنقل
                  </p>
                </div>
                <Switch
                  id="animations"
                  checked={enableAnimations}
                  onCheckedChange={handleAnimationsToggle}
                />
              </div>

              {/* Animation Demo */}
              {enableAnimations && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-3">معاينة التأثيرات:</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-card rounded-lg shadow-sm hover-lift cursor-pointer text-center">
                      <span className="text-sm">رفع عند التحويم</span>
                    </div>
                    <div className="p-4 bg-card rounded-lg shadow-sm hover-scale cursor-pointer text-center">
                      <span className="text-sm">تكبير عند التحويم</span>
                    </div>
                    <div className="p-4 bg-primary text-primary-foreground rounded-lg shadow-sm hover-glow cursor-pointer text-center">
                      <span className="text-sm">توهج عند التحويم</span>
                    </div>
                  </div>
                </div>
              )}
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
