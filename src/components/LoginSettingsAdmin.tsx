import { Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoginSettings } from './login-settings/useLoginSettings';
import { LoginSettingsCards } from './login-settings/LoginSettingsCards';
import { LoginPreview } from './login-settings/LoginPreview';

export function LoginSettingsAdmin() {
  const { settings, setSettings, saving, uploading, logoInputRef, handleSave, handleLogoUpload, handleRemoveLogo } = useLoginSettings();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <LoginSettingsCards
          settings={settings}
          setSettings={setSettings}
          uploading={uploading}
          logoInputRef={logoInputRef}
          handleLogoUpload={handleLogoUpload}
          handleRemoveLogo={handleRemoveLogo}
        />

        {/* Live Preview */}
        <Card className="lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />معاينة مباشرة</CardTitle>
            <CardDescription>شاهد كيف ستظهر شاشات الدخول والتسجيل للمستخدمين</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginPreview settings={settings} />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} className="w-full gradient-primary" disabled={saving}>
        <Save className="w-4 h-4 ml-2" />
        {saving ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
      </Button>
    </div>
  );
}
