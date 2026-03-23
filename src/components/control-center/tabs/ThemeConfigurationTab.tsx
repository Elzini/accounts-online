import { Palette, Save, RotateCcw, Sparkles, MousePointer, Zap, Layers, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { themePresets } from '@/components/themes/ThemePresets';
import {
  useThemeConfiguration,
  FONT_FAMILIES, PRESET_COLORS, SIDEBAR_COLORS,
  HOVER_EFFECTS, ANIMATION_SPEEDS,
} from '../hooks/useThemeConfiguration';

export function ThemeConfigurationTab() {
  const {
    themeSettings, hasChanges, activeTab, setActiveTab,
    isLoading, saveConfig,
    handleChange, applyPreset, handleSave, handleReset,
  } = useThemeConfiguration();

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary" />
            <div><CardTitle>إعدادات المظهر والتأثيرات</CardTitle><CardDescription>تخصيص ألوان وخطوط وتأثيرات البرنامج</CardDescription></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}><RotateCcw className="w-4 h-4 ml-2" />استعادة الافتراضي</Button>
            {hasChanges && <Button onClick={handleSave} disabled={saveConfig.isPending}><Save className="w-4 h-4 ml-2" />حفظ التغييرات</Button>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="presets" className="gap-2"><Layers className="w-4 h-4" />الثيمات</TabsTrigger>
            <TabsTrigger value="colors" className="gap-2"><Palette className="w-4 h-4" />الألوان</TabsTrigger>
            <TabsTrigger value="effects" className="gap-2"><Sparkles className="w-4 h-4" />التأثيرات</TabsTrigger>
            <TabsTrigger value="typography" className="gap-2"><span className="text-lg font-bold">Aa</span>الخطوط</TabsTrigger>
          </TabsList>

          {/* Presets */}
          <TabsContent value="presets" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themePresets.map((preset) => (
                <button key={preset.id} onClick={() => applyPreset(preset)}
                  className={`relative group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                    themeSettings.primaryColor === preset.colors.primary && themeSettings.sidebarColor === preset.colors.sidebar
                      ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}>
                  <div className="w-full h-24 rounded-lg mb-3 overflow-hidden" style={{ background: preset.preview.gradient }} />
                  <div className="text-center">
                    <h4 className="font-semibold">{preset.name}</h4>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                    <div className="flex justify-center gap-1 mt-2">
                      {Object.values(preset.colors).slice(0, 4).map((color, idx) => (
                        <span key={idx} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                  {themeSettings.primaryColor === preset.colors.primary && themeSettings.sidebarColor === preset.colors.sidebar && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1"><Check className="w-3 h-3" /></div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Colors */}
          <TabsContent value="colors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ColorPickerSection label="اللون الرئيسي" value={themeSettings.primaryColor} colors={PRESET_COLORS} onChange={(v) => handleChange('primaryColor', v)} />
              <ColorPickerSection label="لون القائمة الجانبية" value={themeSettings.sidebarColor} colors={SIDEBAR_COLORS} onChange={(v) => handleChange('sidebarColor', v)} />
            </div>
          </TabsContent>

          {/* Effects */}
          <TabsContent value="effects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary" />
                    <div><Label className="text-base font-semibold">تفعيل التأثيرات</Label><p className="text-sm text-muted-foreground">تشغيل/إيقاف جميع التأثيرات</p></div>
                  </div>
                  <Switch checked={themeSettings.enableAnimations} onCheckedChange={(c) => handleChange('enableAnimations', c)} />
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2"><MousePointer className="w-4 h-4" />تأثير التحويم</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {HOVER_EFFECTS.map((effect) => (
                      <button key={effect.value} onClick={() => handleChange('hoverEffect', effect.value)}
                        className={`p-4 rounded-xl border-2 transition-all text-right ${
                          themeSettings.hoverEffect === effect.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}>
                        <span className="text-xl mb-2 block">{effect.icon}</span>
                        <h4 className="font-semibold text-sm">{effect.label}</h4>
                        <p className="text-xs text-muted-foreground">{effect.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">سرعة التأثيرات</Label>
                  <Select value={themeSettings.animationSpeed} onValueChange={(v) => handleChange('animationSpeed', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ANIMATION_SPEEDS.map(s => <SelectItem key={s.value} value={s.value}>{s.label} ({s.duration})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">انحناء الزوايا: {themeSettings.borderRadius}px</Label>
                  <Slider value={[parseInt(themeSettings.borderRadius)]} onValueChange={(v) => handleChange('borderRadius', v[0].toString())} min={0} max={24} step={2} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>حاد</span><span>دائري</span></div>
                </div>
                <div className="space-y-3">
                  <Label className="text-base font-semibold">شدة الظل</Label>
                  <Select value={themeSettings.shadowIntensity} onValueChange={(v) => handleChange('shadowIntensity', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون ظل</SelectItem><SelectItem value="light">خفيف</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem><SelectItem value="strong">قوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="mt-6 p-6 bg-muted/30 rounded-xl">
              <h4 className="font-semibold mb-4">معاينة التأثيرات</h4>
              <div className="grid grid-cols-3 gap-4">
                {['hover-lift', 'hover-scale', 'hover-glow', 'hover-bounce', 'hover-rotate', 'card-hover'].map((effect, index) => (
                  <div key={effect} className={`p-4 bg-card rounded-xl border text-center cursor-pointer ${effect}`}
                    style={{ borderRadius: `${themeSettings.borderRadius}px` }}>
                    <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: themeSettings.primaryColor }} />
                    <span className="text-sm">{HOVER_EFFECTS[index + 1]?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Typography */}
          <TabsContent value="typography" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-base font-semibold">نوع الخط</Label>
                <Select value={themeSettings.fontFamily} onValueChange={(v) => handleChange('fontFamily', v)}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>{FONT_FAMILIES.map(f => <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }} className="text-base">{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <Label className="text-base font-semibold">حجم الخط الأساسي: {themeSettings.fontSize}px</Label>
                <Slider value={[parseInt(themeSettings.fontSize)]} onValueChange={(v) => handleChange('fontSize', v[0].toString())} min={12} max={20} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground"><span>صغير (12px)</span><span>كبير (20px)</span></div>
              </div>
            </div>
            <div className="mt-6 p-6 bg-card rounded-xl border" style={{ fontFamily: themeSettings.fontFamily }}>
              <h4 className="font-semibold mb-4">معاينة الخط</h4>
              <div className="space-y-3" style={{ fontSize: `${themeSettings.fontSize}px` }}>
                <h1 className="text-2xl font-bold">عنوان رئيسي</h1>
                <h2 className="text-xl font-semibold">عنوان فرعي</h2>
                <p className="text-muted-foreground">هذا نص تجريبي لمعاينة حجم ونوع الخط المختار.</p>
                <div className="flex gap-2 mt-4">
                  <Button style={{ backgroundColor: themeSettings.primaryColor }}>زر رئيسي</Button>
                  <Button variant="outline">زر ثانوي</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Live Preview */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />المعاينة الحية</h3>
          <div className="rounded-xl overflow-hidden border shadow-lg" style={{ fontFamily: themeSettings.fontFamily, borderRadius: `${themeSettings.borderRadius}px` }}>
            <div className="p-4 text-white" style={{ backgroundColor: themeSettings.sidebarColor }}>
              <h4 className="font-bold text-lg">القائمة الجانبية</h4>
              <div className="mt-3 space-y-2">
                <div className="px-4 py-3 rounded-lg text-white cursor-pointer transition-all" style={{ backgroundColor: themeSettings.primaryColor, borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}>الرئيسية</div>
                <div className="px-4 py-3 rounded-lg hover:bg-white/10 transition-all cursor-pointer" style={{ borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}>المبيعات</div>
                <div className="px-4 py-3 rounded-lg hover:bg-white/10 transition-all cursor-pointer" style={{ borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}>المشتريات</div>
              </div>
            </div>
            <div className="p-6 bg-background" style={{ fontSize: `${themeSettings.fontSize}px` }}>
              <h2 className="text-2xl font-bold mb-2">عنوان الصفحة</h2>
              <p className="text-muted-foreground mb-4">هذا نص تجريبي لمعاينة الإعدادات المختارة</p>
              <div className="flex gap-3 flex-wrap">
                <Button style={{ backgroundColor: themeSettings.primaryColor, borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}>زر رئيسي</Button>
                <Button variant="outline" style={{ borderRadius: `${Math.max(parseInt(themeSettings.borderRadius) - 4, 0)}px` }}>زر ثانوي</Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper sub-component
function ColorPickerSection({ label, value, colors, onChange }: { label: string; value: string; colors: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">{label}</Label>
      <div className="flex items-center gap-4">
        <Input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-16 h-12 p-1 cursor-pointer rounded-lg" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono" />
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button key={c.value} onClick={() => onChange(c.value)}
            className={`w-10 h-10 rounded-full border-2 shadow-md hover:scale-110 transition-transform ${value === c.value ? 'ring-2 ring-offset-2 ring-primary' : 'border-white'}`}
            style={{ backgroundColor: c.value }} title={c.label} />
        ))}
      </div>
    </div>
  );
}
