import { useState, useEffect } from 'react';
import { Palette, Save, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useMenuConfiguration, useSaveMenuConfiguration } from '@/hooks/useSystemControl';
import { ThemeSettings } from '@/services/systemControl';
import { toast } from 'sonner';

const FONT_FAMILIES = [
  { value: 'Cairo', label: 'Cairo (الافتراضي)' },
  { value: 'Tajawal', label: 'Tajawal' },
  { value: 'Almarai', label: 'Almarai' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex Sans Arabic' },
  { value: 'Noto Sans Arabic', label: 'Noto Sans Arabic' },
];

const PRESET_COLORS = [
  { value: '#3b82f6', label: 'أزرق (الافتراضي)' },
  { value: '#10b981', label: 'أخضر' },
  { value: '#8b5cf6', label: 'بنفسجي' },
  { value: '#f59e0b', label: 'برتقالي' },
  { value: '#ef4444', label: 'أحمر' },
  { value: '#06b6d4', label: 'سماوي' },
  { value: '#ec4899', label: 'وردي' },
];

const DEFAULT_THEME: ThemeSettings = {
  primaryColor: '#3b82f6',
  sidebarColor: '#1e293b',
  fontFamily: 'Cairo',
  fontSize: '16',
};

export function ThemeConfigurationTab() {
  const { data: config, isLoading } = useMenuConfiguration();
  const saveConfig = useSaveMenuConfiguration();

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(DEFAULT_THEME);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (config?.theme_settings && Object.keys(config.theme_settings).length > 0) {
      setThemeSettings({ ...DEFAULT_THEME, ...config.theme_settings });
    }
  }, [config]);

  const handleChange = (key: keyof ThemeSettings, value: string) => {
    setThemeSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({ 
        menu_items: config?.menu_items || [],
        theme_settings: themeSettings 
      });
      toast.success('تم حفظ إعدادات المظهر');
      setHasChanges(false);
      
      // Apply theme changes
      document.documentElement.style.setProperty('--primary', hexToHsl(themeSettings.primaryColor || '#3b82f6'));
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleReset = () => {
    setThemeSettings(DEFAULT_THEME);
    setHasChanges(true);
  };

  // Helper function to convert hex to HSL
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary" />
            <div>
              <CardTitle>إعدادات المظهر</CardTitle>
              <CardDescription>
                تخصيص ألوان وخطوط البرنامج
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Color Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">الألوان</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اللون الرئيسي</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={themeSettings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={themeSettings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#3b82f6"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleChange('primaryColor', color.value)}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>لون القائمة الجانبية</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="color"
                    value={themeSettings.sidebarColor}
                    onChange={(e) => handleChange('sidebarColor', e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={themeSettings.sidebarColor}
                    onChange={(e) => handleChange('sidebarColor', e.target.value)}
                    className="flex-1 font-mono"
                    placeholder="#1e293b"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography Settings */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">الخطوط</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>نوع الخط</Label>
                <Select
                  value={themeSettings.fontFamily}
                  onValueChange={(value) => handleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem 
                        key={font.value} 
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>حجم الخط الأساسي: {themeSettings.fontSize}px</Label>
                <Slider
                  value={[parseInt(themeSettings.fontSize || '16')]}
                  onValueChange={(value) => handleChange('fontSize', value[0].toString())}
                  min={12}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="col-span-full">
            <h3 className="text-lg font-semibold mb-4">معاينة</h3>
            <div 
              className="rounded-xl overflow-hidden border shadow-lg"
              style={{ fontFamily: themeSettings.fontFamily }}
            >
              <div 
                className="p-4 text-white"
                style={{ backgroundColor: themeSettings.sidebarColor }}
              >
                <h4 className="font-bold">القائمة الجانبية</h4>
                <div className="mt-2 space-y-2">
                  <div 
                    className="px-3 py-2 rounded-lg text-white"
                    style={{ backgroundColor: themeSettings.primaryColor }}
                  >
                    الرئيسية
                  </div>
                  <div className="px-3 py-2 rounded-lg hover:bg-white/10">
                    المبيعات
                  </div>
                  <div className="px-3 py-2 rounded-lg hover:bg-white/10">
                    المشتريات
                  </div>
                </div>
              </div>
              <div 
                className="p-6 bg-background"
                style={{ fontSize: `${themeSettings.fontSize}px` }}
              >
                <h2 className="text-2xl font-bold mb-2">عنوان الصفحة</h2>
                <p className="text-muted-foreground">
                  هذا نص تجريبي لمعاينة حجم ونوع الخط المختار
                </p>
                <div className="mt-4 flex gap-2">
                  <Button style={{ backgroundColor: themeSettings.primaryColor }}>
                    زر رئيسي
                  </Button>
                  <Button variant="outline">
                    زر ثانوي
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
