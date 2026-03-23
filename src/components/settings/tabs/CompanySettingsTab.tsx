/**
 * Company Settings Tab - Extracted from AppSettings
 */
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image, Building2, Upload, X, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanySettings, useUpdateCompanySettings, useUploadCompanyLogo } from '@/hooks/useCompanySettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export function CompanySettingsTab() {
  const { t } = useLanguage();
  const { permissions } = useAuth();
  const { companyId, company, refreshCompany } = useCompany();
  const { data: companySettings } = useCompanySettings(companyId);
  const updateCompanySettings = useUpdateCompanySettings(companyId);
  const uploadCompanyLogo = useUploadCompanyLogo(companyId);
  const isAdmin = permissions.admin;

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [appName, setAppName] = useState('');
  const [appSubtitle, setAppSubtitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (companySettings) {
      setLogoPreview(companySettings.logo_url || null);
      setAppName(companySettings.app_name || '');
      setAppSubtitle(companySettings.app_subtitle || '');
      setWelcomeMessage(companySettings.welcome_message || '');
    }
  }, [companySettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t.settings_image_too_large); return; }
    if (!file.type.startsWith('image/')) { toast.error(t.settings_select_image); return; }
    try {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
      const url = await uploadCompanyLogo.mutateAsync(file);
      setLogoPreview(url);
      toast.success(t.settings_logo_uploaded);
    } catch { toast.error(t.settings_save_error); }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateCompanySettings.mutateAsync({ logo_url: '' });
      setLogoPreview(null);
      toast.success(t.settings_logo_removed);
    } catch { toast.error(t.settings_save_error); }
  };

  const handleSave = async () => {
    try {
      await updateCompanySettings.mutateAsync({ welcome_message: welcomeMessage, app_name: appName, app_subtitle: appSubtitle });
      await refreshCompany();
      toast.success(t.settings_save_success);
    } catch { toast.error(t.settings_save_error); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />{t.settings_company_logo}</CardTitle>
          <CardDescription>{t.settings_company_logo_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="relative w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
              onClick={() => logoInputRef.current?.click()}
            >
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Upload className="w-8 h-8 mx-auto mb-2" /><span className="text-xs">{t.settings_upload_logo}</span>
                </div>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">{t.settings_click_to_upload}</p>
              <p className="text-xs text-muted-foreground">{t.settings_max_size}</p>
              {logoPreview && (
                <Button variant="outline" size="sm" onClick={handleRemoveLogo} className="text-destructive hover:text-destructive" disabled={uploadCompanyLogo.isPending}>
                  <X className="w-4 h-4 ml-1" />{t.settings_remove_logo}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />{t.settings_company_info}</CardTitle>
          <CardDescription>{t.settings_company_info_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.settings_company_app_name}</Label>
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder={company?.name || ''} disabled={!isAdmin} />
            <p className="text-xs text-muted-foreground">{t.settings_company_app_name_hint}</p>
          </div>
          <div className="space-y-2">
            <Label>{t.settings_company_subtitle}</Label>
            <Input value={appSubtitle} onChange={(e) => setAppSubtitle(e.target.value)} disabled={!isAdmin} />
          </div>
          <div className="space-y-2">
            <Label>{t.settings_welcome_message}</Label>
            <Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} disabled={!isAdmin} rows={3} />
            <p className="text-xs text-muted-foreground">{t.settings_welcome_message_hint}</p>
          </div>
          {isAdmin && (
            <Button onClick={handleSave} className="w-full gradient-primary" disabled={updateCompanySettings.isPending}>
              <Save className="w-4 h-4 ml-2" />{updateCompanySettings.isPending ? t.settings_saving : t.settings_save_company}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
