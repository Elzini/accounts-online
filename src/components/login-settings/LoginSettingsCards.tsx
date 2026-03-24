import { Upload, Palette, LogIn, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginSettings } from './useLoginSettings';

interface LoginSettingsCardsProps {
  settings: LoginSettings;
  setSettings: React.Dispatch<React.SetStateAction<LoginSettings>>;
  uploading: boolean;
  logoInputRef: React.RefObject<HTMLInputElement>;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveLogo: () => void;
}

export function LoginSettingsCards({ settings, setSettings, uploading, logoInputRef, handleLogoUpload, handleRemoveLogo }: LoginSettingsCardsProps) {
  return (
    <>
      {/* Logo Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />شعار شاشة الدخول</CardTitle>
          <CardDescription>الشعار الذي يظهر في صفحات الدخول والتسجيل</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => logoInputRef.current?.click()}
            >
              {settings.login_logo_url ? (
                <img src={settings.login_logo_url} alt="Login Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center p-4">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">اضغط للرفع</p>
                </div>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4 ml-2" />
                {uploading ? 'جاري الرفع...' : 'رفع شعار'}
              </Button>
              {settings.login_logo_url && (
                <Button variant="destructive" size="sm" onClick={handleRemoveLogo}>إزالة</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Page Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogIn className="w-5 h-5" />نصوص صفحة الدخول</CardTitle>
          <CardDescription>العناوين والنصوص في صفحة تسجيل الدخول</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان صفحة الدخول</Label>
            <Input value={settings.login_title} onChange={(e) => setSettings(s => ({ ...s, login_title: e.target.value }))} placeholder="أشبال النمر" />
          </div>
          <div className="space-y-2">
            <Label>الوصف الفرعي</Label>
            <Input value={settings.login_subtitle} onChange={(e) => setSettings(s => ({ ...s, login_subtitle: e.target.value }))} placeholder="نظام إدارة معرض السيارات" />
          </div>
          <div className="space-y-2">
            <Label>نص زر تسجيل الدخول</Label>
            <Input value={settings.login_button_text} onChange={(e) => setSettings(s => ({ ...s, login_button_text: e.target.value }))} placeholder="تسجيل الدخول" />
          </div>
        </CardContent>
      </Card>

      {/* Register Page Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogIn className="w-5 h-5" />نصوص صفحة التسجيل</CardTitle>
          <CardDescription>العناوين والنصوص في صفحة تسجيل شركة جديدة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>عنوان صفحة التسجيل</Label>
            <Input value={settings.register_title} onChange={(e) => setSettings(s => ({ ...s, register_title: e.target.value }))} placeholder="تسجيل شركة جديدة" />
          </div>
          <div className="space-y-2">
            <Label>الوصف الفرعي</Label>
            <Input value={settings.register_subtitle} onChange={(e) => setSettings(s => ({ ...s, register_subtitle: e.target.value }))} placeholder="أنشئ حساب شركتك الآن" />
          </div>
          <div className="space-y-2">
            <Label>نص زر التسجيل</Label>
            <Input value={settings.register_button_text} onChange={(e) => setSettings(s => ({ ...s, register_button_text: e.target.value }))} placeholder="تسجيل الشركة" />
          </div>
        </CardContent>
      </Card>

      {/* Colors Settings */}
      <Card className="lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />ألوان شاشة الدخول والتسجيل</CardTitle>
          <CardDescription>تخصيص ألوان الخلفية والتدرجات اللونية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'لون خلفية الصفحة', key: 'login_bg_color' as const, placeholder: 'hsl(222.2, 84%, 4.9%)' },
              { label: 'لون البطاقة', key: 'login_card_color' as const, placeholder: 'hsl(222.2, 84%, 6%)' },
              { label: 'لون بداية التدرج', key: 'login_header_gradient_start' as const, placeholder: 'hsl(221.2, 83.2%, 53.3%)' },
              { label: 'لون نهاية التدرج', key: 'login_header_gradient_end' as const, placeholder: 'hsl(250, 95%, 65%)' },
            ].map(({ label, key, placeholder }) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <div className="flex gap-2">
                  <Input value={settings[key]} onChange={(e) => setSettings(s => ({ ...s, [key]: e.target.value }))} placeholder={placeholder} className="flex-1" />
                  <div className="w-12 h-10 rounded-md border" style={{ backgroundColor: settings[key] }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
