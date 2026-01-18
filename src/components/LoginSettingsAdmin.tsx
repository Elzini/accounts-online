import { useState, useEffect, useRef } from 'react';
import { Save, Upload, Palette, LogIn, Image, Eye, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { defaultSettings } from '@/services/settings';

interface LoginSettings {
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

export function LoginSettingsAdmin() {
  const [settings, setSettings] = useState<LoginSettings>({
    login_title: defaultSettings.login_title,
    login_subtitle: defaultSettings.login_subtitle,
    login_bg_color: defaultSettings.login_bg_color,
    login_card_color: defaultSettings.login_card_color,
    login_header_gradient_start: defaultSettings.login_header_gradient_start,
    login_header_gradient_end: defaultSettings.login_header_gradient_end,
    login_button_text: defaultSettings.login_button_text,
    login_logo_url: '',
    register_title: 'تسجيل شركة جديدة',
    register_subtitle: 'انضم إلى منصة إدارة المعارض',
    register_button_text: 'تسجيل الشركة',
  });
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Fetch existing global settings (company_id = null)
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
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        company_id: null,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            key: update.key,
            value: update.value,
            company_id: null,
          }, {
            onConflict: 'key',
          });
        
        if (error) throw error;
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
      
      const { data } = supabase.storage
        .from('app-logos')
        .getPublicUrl(fileName);
      
      setSettings({ ...settings, login_logo_url: data.publicUrl });
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setSettings({ ...settings, login_logo_url: '' });
  };

  const headerGradient = `linear-gradient(135deg, ${settings.login_header_gradient_start}, ${settings.login_header_gradient_end})`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              شعار شاشة الدخول
            </CardTitle>
            <CardDescription>
              الشعار الذي يظهر في صفحات الدخول والتسجيل
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => logoInputRef.current?.click()}
              >
                {settings.login_logo_url ? (
                  <img 
                    src={settings.login_logo_url} 
                    alt="Login Logo" 
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">اضغط للرفع</p>
                  </div>
                )}
              </div>
              
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 ml-2" />
                  {uploading ? 'جاري الرفع...' : 'رفع شعار'}
                </Button>
                
                {settings.login_logo_url && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveLogo}
                  >
                    إزالة
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Page Text */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              نصوص صفحة الدخول
            </CardTitle>
            <CardDescription>
              العناوين والنصوص في صفحة تسجيل الدخول
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان صفحة الدخول</Label>
              <Input
                value={settings.login_title}
                onChange={(e) => setSettings({ ...settings, login_title: e.target.value })}
                placeholder="أشبال النمر"
              />
            </div>
            
            <div className="space-y-2">
              <Label>الوصف الفرعي</Label>
              <Input
                value={settings.login_subtitle}
                onChange={(e) => setSettings({ ...settings, login_subtitle: e.target.value })}
                placeholder="نظام إدارة معرض السيارات"
              />
            </div>

            <div className="space-y-2">
              <Label>نص زر تسجيل الدخول</Label>
              <Input
                value={settings.login_button_text}
                onChange={(e) => setSettings({ ...settings, login_button_text: e.target.value })}
                placeholder="تسجيل الدخول"
              />
            </div>
          </CardContent>
        </Card>

        {/* Register Page Text */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              نصوص صفحة التسجيل
            </CardTitle>
            <CardDescription>
              العناوين والنصوص في صفحة تسجيل شركة جديدة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>عنوان صفحة التسجيل</Label>
              <Input
                value={settings.register_title}
                onChange={(e) => setSettings({ ...settings, register_title: e.target.value })}
                placeholder="تسجيل شركة جديدة"
              />
            </div>
            
            <div className="space-y-2">
              <Label>الوصف الفرعي</Label>
              <Input
                value={settings.register_subtitle}
                onChange={(e) => setSettings({ ...settings, register_subtitle: e.target.value })}
                placeholder="أنشئ حساب شركتك الآن"
              />
            </div>

            <div className="space-y-2">
              <Label>نص زر التسجيل</Label>
              <Input
                value={settings.register_button_text}
                onChange={(e) => setSettings({ ...settings, register_button_text: e.target.value })}
                placeholder="تسجيل الشركة"
              />
            </div>
          </CardContent>
        </Card>

        {/* Colors Settings */}
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              ألوان شاشة الدخول والتسجيل
            </CardTitle>
            <CardDescription>
              تخصيص ألوان الخلفية والتدرجات اللونية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>لون خلفية الصفحة</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.login_bg_color}
                    onChange={(e) => setSettings({ ...settings, login_bg_color: e.target.value })}
                    placeholder="hsl(222.2, 84%, 4.9%)"
                    className="flex-1"
                  />
                  <div 
                    className="w-12 h-10 rounded-md border"
                    style={{ backgroundColor: settings.login_bg_color }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>لون البطاقة</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.login_card_color}
                    onChange={(e) => setSettings({ ...settings, login_card_color: e.target.value })}
                    placeholder="hsl(222.2, 84%, 6%)"
                    className="flex-1"
                  />
                  <div 
                    className="w-12 h-10 rounded-md border"
                    style={{ backgroundColor: settings.login_card_color }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>لون بداية التدرج</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.login_header_gradient_start}
                    onChange={(e) => setSettings({ ...settings, login_header_gradient_start: e.target.value })}
                    placeholder="hsl(221.2, 83.2%, 53.3%)"
                    className="flex-1"
                  />
                  <div 
                    className="w-12 h-10 rounded-md border"
                    style={{ backgroundColor: settings.login_header_gradient_start }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>لون نهاية التدرج</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.login_header_gradient_end}
                    onChange={(e) => setSettings({ ...settings, login_header_gradient_end: e.target.value })}
                    placeholder="hsl(250, 95%, 65%)"
                    className="flex-1"
                  />
                  <div 
                    className="w-12 h-10 rounded-md border"
                    style={{ backgroundColor: settings.login_header_gradient_end }}
                  />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Live Preview Section */}
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              معاينة مباشرة
            </CardTitle>
            <CardDescription>
              شاهد كيف ستظهر شاشات الدخول والتسجيل للمستخدمين
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Login Preview */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  معاينة صفحة الدخول
                </Label>
                <div 
                  className="rounded-xl overflow-hidden border-2 shadow-lg"
                  style={{ backgroundColor: settings.login_bg_color }}
                >
                  <div className="p-6 flex items-center justify-center min-h-[400px]">
                    <div 
                      className="w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-white/10"
                      style={{ backgroundColor: settings.login_card_color }}
                    >
                      {/* Card Header */}
                      <div 
                        className="p-6 text-center"
                        style={{ background: headerGradient }}
                      >
                        {settings.login_logo_url && (
                          <div className="mb-4 flex justify-center">
                            <img 
                              src={settings.login_logo_url} 
                              alt="Logo" 
                              className="w-16 h-16 object-contain bg-white/10 rounded-xl p-2"
                            />
                          </div>
                        )}
                        <h2 className="text-xl font-bold text-white">
                          {settings.login_title || 'أشبال النمر'}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                          {settings.login_subtitle || 'نظام إدارة معرض السيارات'}
                        </p>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400">البريد الإلكتروني</div>
                          <div className="h-10 rounded-lg bg-white/5 border border-white/10"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-gray-400">كلمة المرور</div>
                          <div className="h-10 rounded-lg bg-white/5 border border-white/10"></div>
                        </div>
                        <div 
                          className="h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm"
                          style={{ background: headerGradient }}
                        >
                          {settings.login_button_text || 'تسجيل الدخول'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Register Preview */}
              <div className="space-y-2">
                <Label className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  معاينة صفحة التسجيل
                </Label>
                <div 
                  className="rounded-xl overflow-hidden border-2 shadow-lg"
                  style={{ backgroundColor: settings.login_bg_color }}
                >
                  <div className="p-6 flex items-center justify-center min-h-[400px]">
                    <div 
                      className="w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-white/10"
                      style={{ backgroundColor: settings.login_card_color }}
                    >
                      {/* Card Header */}
                      <div 
                        className="p-6 text-center"
                        style={{ background: headerGradient }}
                      >
                        {settings.login_logo_url && (
                          <div className="mb-4 flex justify-center">
                            <img 
                              src={settings.login_logo_url} 
                              alt="Logo" 
                              className="w-16 h-16 object-contain bg-white/10 rounded-xl p-2"
                            />
                          </div>
                        )}
                        <h2 className="text-xl font-bold text-white">
                          {settings.register_title || 'تسجيل شركة جديدة'}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                          {settings.register_subtitle || 'أنشئ حساب شركتك الآن'}
                        </p>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-6 space-y-3">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">اسم الشركة</div>
                          <div className="h-9 rounded-lg bg-white/5 border border-white/10"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">اسم المستخدم</div>
                          <div className="h-9 rounded-lg bg-white/5 border border-white/10"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">البريد الإلكتروني</div>
                          <div className="h-9 rounded-lg bg-white/5 border border-white/10"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-gray-400">كلمة المرور</div>
                          <div className="h-9 rounded-lg bg-white/5 border border-white/10"></div>
                        </div>
                        <div 
                          className="h-10 rounded-lg flex items-center justify-center text-white font-medium text-sm mt-4"
                          style={{ background: headerGradient }}
                        >
                          {settings.register_button_text || 'تسجيل الشركة'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={handleSave} 
        className="w-full gradient-primary"
        disabled={saving}
      >
        <Save className="w-4 h-4 ml-2" />
        {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
      </Button>
    </div>
  );
}