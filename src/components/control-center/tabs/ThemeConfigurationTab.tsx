import { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw, Sparkles, MousePointer, Zap, Moon, Sun, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMenuConfiguration, useSaveMenuConfiguration } from '@/hooks/useSystemControl';
import { toast } from 'sonner';

const FONT_FAMILIES = [
  { value: 'Cairo', label: 'Cairo (الافتراضي)' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
];

const PRESET_COLORS = [
  { value: '#3b82f6', label: 'أزرق' },
  { value: '#10b981', label: 'أخضر' },
  { value: '#8b5cf6', label: 'بنفسجي' },
  { value: '#f59e0b', label: 'برتقالي' },
  { value: '#ef4444', label: 'أحمر' },
  { value: '#06b6d4', label: 'سماوي' },
  { value: '#ec4899', label: 'وردي' },
  { value: '#14b8a6', label: 'فيروزي' },
  { value: '#f97316', label: 'برتقالي داكن' },
  { value: '#6366f1', label: 'نيلي' },
];

const SIDEBAR_COLORS = [
  { value: '#1e293b', label: 'رمادي داكن' },
  { value: '#0f172a', label: 'أزرق داكن' },
  { value: '#18181b', label: 'أسود' },
  { value: '#1e1b4b', label: 'بنفسجي داكن' },
  { value: '#164e63', label: 'سماوي داكن' },
  { value: '#1c1917', label: 'بني داكن' },
  { value: '#14532d', label: 'أخضر داكن' },
  { value: '#7c2d12', label: 'برتقالي داكن' },
];

// Pre-made themes
const THEME_PRESETS = [
  {
    id: 'ocean',
    name: 'المحيط',
    icon: '🌊',
    primaryColor: '#0ea5e9',
    sidebarColor: '#0c4a6e',
    description: 'ألوان زرقاء هادئة',
  },
  {
    id: 'forest',
    name: 'الغابة',
    icon: '🌲',
    primaryColor: '#22c55e',
    sidebarColor: '#14532d',
    description: 'ألوان خضراء طبيعية',
  },
  {
    id: 'sunset',
    name: 'الغروب',
    icon: '🌅',
    primaryColor: '#f97316',
    sidebarColor: '#7c2d12',
    description: 'ألوان دافئة',
  },
  {
    id: 'royal',
    name: 'ملكي',
    icon: '👑',
    primaryColor: '#8b5cf6',
    sidebarColor: '#1e1b4b',
    description: 'ألوان بنفسجية فاخرة',
  },
  {
    id: 'midnight',
    name: 'منتصف الليل',
    icon: '🌙',
    primaryColor: '#6366f1',
    sidebarColor: '#0f172a',
    description: 'ألوان ليلية داكنة',
  },
  {
    id: 'rose',
    name: 'الورد',
    icon: '🌸',
    primaryColor: '#ec4899',
    sidebarColor: '#831843',
    description: 'ألوان وردية أنيقة',
  },
  {
    id: 'emerald',
    name: 'الزمرد',
    icon: '💎',
    primaryColor: '#10b981',
    sidebarColor: '#064e3b',
    description: 'ألوان زمردية راقية',
  },
  {
    id: 'amber',
    name: 'العنبر',
    icon: '✨',
    primaryColor: '#f59e0b',
    sidebarColor: '#78350f',
    description: 'ألوان ذهبية دافئة',
  },
];

// Hover effects options
const HOVER_EFFECTS = [
  { value: 'none', label: 'بدون تأثير', description: 'لا يوجد تأثير عند التحويم' },
  { value: 'lift', label: 'رفع', description: 'رفع العنصر للأعلى', className: 'hover-lift' },
  { value: 'scale', label: 'تكبير', description: 'تكبير العنصر قليلاً', className: 'hover-scale' },
  { value: 'glow', label: 'توهج', description: 'إضافة توهج حول العنصر', className: 'hover-glow' },
  { value: 'bounce', label: 'ارتداد', description: 'تأثير ارتداد ممتع', className: 'hover-bounce' },
  { value: 'rotate', label: 'دوران', description: 'دوران خفيف عند التحويم', className: 'hover-rotate' },
  { value: 'border', label: 'إطار', description: 'إبراز الإطار', className: 'card-hover' },
];

// Animation speeds
const ANIMATION_SPEEDS = [
  { value: 'fast', label: 'سريع', duration: '150ms' },
  { value: 'normal', label: 'عادي', duration: '300ms' },
  { value: 'slow', label: 'بطيء', duration: '500ms' },
];

interface ExtendedThemeSettings {
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
  primaryColor: '#3b82f6',
  sidebarColor: '#1e293b',
  fontFamily: 'Cairo',
  fontSize: '16',
  hoverEffect: 'lift',
  animationSpeed: 'normal',
  enableAnimations: true,
  cardStyle: 'default',
  borderRadius: '12',
  shadowIntensity: 'medium',
};

export function ThemeConfigurationTab() {
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

  const handleChange = (key: keyof ExtendedThemeSettings, value: string | boolean) => {
    setThemeSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setThemeSettings(prev => ({
      ...prev,
      primaryColor: preset.primaryColor,
      sidebarColor: preset.sidebarColor,
    }));
    setHasChanges(true);
    toast.success(`تم تطبيق ثيم "${preset.name}"`);
  };

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({ 
        menu_items: config?.menu_items || [],
        theme_settings: themeSettings as unknown as Record<string, string>
      });
      toast.success('تم حفظ إعدادات المظهر');
      setHasChanges(false);
      applyThemeToDocument(themeSettings);
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleReset = () => {
    setThemeSettings(DEFAULT_THEME);
    setHasChanges(true);
  };

  const applyThemeToDocument = (settings: ExtendedThemeSettings) => {
    const root = document.documentElement;
    
    // Apply primary color
    root.style.setProperty('--primary', hexToHsl(settings.primaryColor));
    root.style.setProperty('--ring', hexToHsl(settings.primaryColor));
    root.style.setProperty('--sidebar-primary', hexToHsl(settings.primaryColor));
    
    // Apply sidebar color
    root.style.setProperty('--sidebar-background', hexToHsl(settings.sidebarColor));
    
    // Apply border radius
    root.style.setProperty('--radius', `${settings.borderRadius}px`);
    
    // Apply animation speed
    const duration = ANIMATION_SPEEDS.find(s => s.value === settings.animationSpeed)?.duration || '300ms';
    root.style.setProperty('--animation-duration', duration);
    
    // Toggle animations
    if (!settings.enableAnimations) {
      document.body.classList.add('no-animations');
    } else {
      document.body.classList.remove('no-animations');
    }
  };

  const hexToHsl = (hex: string): string => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>إعدادات المظهر والتأثيرات</CardTitle>
              <CardDescription>
                تخصيص ألوان وخطوط وتأثيرات البرنامج
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 ml-2" />
              استعادة الافتراضي
            </Button>
            {hasChanges && (
              <Button onClick={handleSave} disabled={saveConfig.isPending}>
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="presets" className="gap-2">
              <Layers className="w-4 h-4" />
              الثيمات
            </TabsTrigger>
            <TabsTrigger value="colors" className="gap-2">
              <Palette className="w-4 h-4" />
              الألوان
            </TabsTrigger>
            <TabsTrigger value="effects" className="gap-2">
              <Sparkles className="w-4 h-4" />
              التأثيرات
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-2">
              <span className="text-lg font-bold">Aa</span>
              الخطوط
            </TabsTrigger>
          </TabsList>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`relative group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    themeSettings.primaryColor === preset.primaryColor && themeSettings.sidebarColor === preset.sidebarColor
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div 
                    className="w-full h-20 rounded-lg mb-3 flex items-end overflow-hidden"
                    style={{ backgroundColor: preset.sidebarColor }}
                  >
                    <div 
                      className="w-full h-8 rounded-t-lg"
                      style={{ backgroundColor: preset.primaryColor }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-2xl mb-1 block">{preset.icon}</span>
                    <h4 className="font-semibold">{preset.name}</h4>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold">اللون الرئيسي</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={themeSettings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-16 h-12 p-1 cursor-pointer rounded-lg"
                  />
                  <Input
                    value={themeSettings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#3b82f6"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleChange('primaryColor', color.value)}
                      className={`w-10 h-10 rounded-full border-2 shadow-md hover:scale-110 transition-transform ${
                        themeSettings.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : 'border-white'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">لون القائمة الجانبية</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={themeSettings.sidebarColor}
                    onChange={(e) => handleChange('sidebarColor', e.target.value)}
                    className="w-16 h-12 p-1 cursor-pointer rounded-lg"
                  />
                  <Input
                    value={themeSettings.sidebarColor}
                    onChange={(e) => handleChange('sidebarColor', e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#1e293b"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {SIDEBAR_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleChange('sidebarColor', color.value)}
                      className={`w-10 h-10 rounded-full border-2 shadow-md hover:scale-110 transition-transform ${
                        themeSettings.sidebarColor === color.value ? 'ring-2 ring-offset-2 ring-primary' : 'border-white'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <div>
                      <Label className="text-base font-semibold">تفعيل التأثيرات</Label>
                      <p className="text-sm text-muted-foreground">تشغيل/إيقاف جميع التأثيرات</p>
                    </div>
                  </div>
                  <Switch
                    checked={themeSettings.enableAnimations}
                    onCheckedChange={(checked) => handleChange('enableAnimations', checked)}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <MousePointer className="w-4 h-4" />
                    تأثير التحويم
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {HOVER_EFFECTS.map((effect) => (
                      <button
                        key={effect.value}
                        onClick={() => handleChange('hoverEffect', effect.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-right ${
                          themeSettings.hoverEffect === effect.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        } ${effect.className || ''}`}
                      >
                        <h4 className="font-semibold">{effect.label}</h4>
                        <p className="text-xs text-muted-foreground">{effect.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">سرعة التأثيرات</Label>
                  <Select
                    value={themeSettings.animationSpeed}
                    onValueChange={(value) => handleChange('animationSpeed', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANIMATION_SPEEDS.map((speed) => (
                        <SelectItem key={speed.value} value={speed.value}>
                          {speed.label} ({speed.duration})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    انحناء الزوايا: {themeSettings.borderRadius}px
                  </Label>
                  <Slider
                    value={[parseInt(themeSettings.borderRadius)]}
                    onValueChange={(value) => handleChange('borderRadius', value[0].toString())}
                    min={0}
                    max={24}
                    step={2}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>حاد</span>
                    <span>دائري</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">شدة الظل</Label>
                  <Select
                    value={themeSettings.shadowIntensity}
                    onValueChange={(value) => handleChange('shadowIntensity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون ظل</SelectItem>
                      <SelectItem value="light">خفيف</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="strong">قوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Effects Preview */}
            <div className="mt-6 p-6 bg-muted/30 rounded-xl">
              <h4 className="font-semibold mb-4">معاينة التأثيرات</h4>
              <div className="grid grid-cols-3 gap-4">
                {['hover-lift', 'hover-scale', 'hover-glow', 'hover-bounce', 'hover-rotate', 'card-hover'].map((effect, index) => (
                  <div
                    key={effect}
                    className={`p-4 bg-card rounded-xl border text-center cursor-pointer ${effect}`}
                    style={{ 
                      borderRadius: `${themeSettings.borderRadius}px`,
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: themeSettings.primaryColor }}
                    />
                    <span className="text-sm">{HOVER_EFFECTS[index + 1]?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold">نوع الخط</Label>
                <Select
                  value={themeSettings.fontFamily}
                  onValueChange={(value) => handleChange('fontFamily', value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem 
                        key={font.value} 
                        value={font.value}
                        style={{ fontFamily: font.value }}
                        className="text-base"
                      >
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  حجم الخط الأساسي: {themeSettings.fontSize}px
                </Label>
                <Slider
                  value={[parseInt(themeSettings.fontSize)]}
                  onValueChange={(value) => handleChange('fontSize', value[0].toString())}
                  min={12}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>صغير (12px)</span>
                  <span>كبير (20px)</span>
                </div>
              </div>
            </div>

            {/* Typography Preview */}
            <div 
              className="mt-6 p-6 bg-card rounded-xl border"
              style={{ fontFamily: themeSettings.fontFamily }}
            >
              <h4 className="font-semibold mb-4">معاينة الخط</h4>
              <div className="space-y-3" style={{ fontSize: `${themeSettings.fontSize}px` }}>
                <h1 className="text-2xl font-bold">عنوان رئيسي</h1>
                <h2 className="text-xl font-semibold">عنوان فرعي</h2>
                <p className="text-muted-foreground">
                  هذا نص تجريبي لمعاينة حجم ونوع الخط المختار. يمكنك تغيير الإعدادات لترى كيف سيظهر النص في التطبيق.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button style={{ backgroundColor: themeSettings.primaryColor }}>
                    زر رئيسي
                  </Button>
                  <Button variant="outline">زر ثانوي</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Live Preview */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            المعاينة الحية
          </h3>
          <div 
            className="rounded-xl overflow-hidden border shadow-lg"
            style={{ 
              fontFamily: themeSettings.fontFamily,
              borderRadius: `${themeSettings.borderRadius}px`,
            }}
          >
            <div 
              className="p-4 text-white"
              style={{ backgroundColor: themeSettings.sidebarColor }}
            >
              <h4 className="font-bold text-lg">القائمة الجانبية</h4>
              <div className="mt-3 space-y-2">
                <div 
                  className={`px-4 py-3 rounded-lg text-white cursor-pointer transition-all ${themeSettings.enableAnimations ? themeSettings.hoverEffect !== 'none' ? `hover-${themeSettings.hoverEffect === 'border' ? 'glow' : themeSettings.hoverEffect}` : '' : ''}`}
                  style={{ 
                    backgroundColor: themeSettings.primaryColor,
                    borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px`,
                  }}
                >
                  الرئيسية
                </div>
                <div 
                  className={`px-4 py-3 rounded-lg hover:bg-white/10 transition-all cursor-pointer ${themeSettings.enableAnimations && themeSettings.hoverEffect !== 'none' ? 'hover-lift' : ''}`}
                  style={{ borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}
                >
                  المبيعات
                </div>
                <div 
                  className={`px-4 py-3 rounded-lg hover:bg-white/10 transition-all cursor-pointer ${themeSettings.enableAnimations && themeSettings.hoverEffect !== 'none' ? 'hover-lift' : ''}`}
                  style={{ borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}
                >
                  المشتريات
                </div>
              </div>
            </div>
            <div 
              className="p-6 bg-background"
              style={{ fontSize: `${themeSettings.fontSize}px` }}
            >
              <h2 className="text-2xl font-bold mb-2">عنوان الصفحة</h2>
              <p className="text-muted-foreground mb-4">
                هذا نص تجريبي لمعاينة الإعدادات المختارة
              </p>
              <div className="flex gap-3 flex-wrap">
                <Button 
                  className={themeSettings.enableAnimations && themeSettings.hoverEffect !== 'none' ? 'hover-scale' : ''}
                  style={{ 
                    backgroundColor: themeSettings.primaryColor,
                    borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px`,
                  }}
                >
                  زر رئيسي
                </Button>
                <Button 
                  variant="outline"
                  className={themeSettings.enableAnimations && themeSettings.hoverEffect !== 'none' ? 'hover-lift' : ''}
                  style={{ borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}
                >
                  زر ثانوي
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
