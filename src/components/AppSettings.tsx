/**
 * AppSettings Page - Slim Orchestrator
 * Heavy tabs extracted into dedicated components.
 */
import { useState, useEffect, useRef } from 'react';
import { Settings, Palette, AlertTriangle, Save, RotateCcw, Upload, LayoutDashboard, Tag, LogIn, Image, Lock, Eye, EyeOff, Building2, X, BookOpen, FileText, FileImage, Printer, SlidersHorizontal, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ActivePage } from '@/types';
import { useAppSettings, useUpdateAppSetting, useResetDatabase } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { defaultSettings, uploadLoginLogo } from '@/services/settings';

// Extracted tab components
import { CompanySettingsTab } from '@/components/settings/tabs/CompanySettingsTab';
import { PasswordSettingsTab } from '@/components/settings/tabs/PasswordSettingsTab';
import { CompanyAccountingSettingsTab } from '@/components/settings/CompanyAccountingSettingsTab';
import { InvoiceSettingsTab } from '@/components/settings/InvoiceSettingsTab';
import { MenuLabelsSettingsTab } from '@/components/settings/MenuLabelsSettingsTab';
import { CustomInvoiceTemplateTab } from '@/components/settings/CustomInvoiceTemplateTab';
import { ReportSettingsTab } from '@/components/settings/ReportSettingsTab';
import { AdvancedReportSettingsTab } from '@/components/settings/AdvancedReportSettingsTab';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';

interface AppSettingsProps {
  setActivePage: (page: ActivePage) => void;
}

export function AppSettingsPage({ setActivePage }: AppSettingsProps) {
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateAppSetting();
  const resetDb = useResetDatabase();
  const { permissions } = useAuth();
  const { t } = useLanguage();
  const isAdmin = permissions.admin;

  // Branding state
  const [appName, setAppName] = useState('');
  const [appSubtitle, setAppSubtitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Login page state
  const [loginTitle, setLoginTitle] = useState('');
  const [loginSubtitle, setLoginSubtitle] = useState('');
  const [loginBgColor, setLoginBgColor] = useState('');
  const [loginCardColor, setLoginCardColor] = useState('');
  const [loginGradientStart, setLoginGradientStart] = useState('');
  const [loginGradientEnd, setLoginGradientEnd] = useState('');
  const [loginButtonText, setLoginButtonText] = useState('');
  const [signupButtonText, setSignupButtonText] = useState('');
  const [loginSwitchText, setLoginSwitchText] = useState('');
  const [signupSwitchText, setSignupSwitchText] = useState('');
  const [loginLogoUrl, setLoginLogoUrl] = useState('');
  const [loginLogoUploading, setLoginLogoUploading] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginLogoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name || defaultSettings.app_name);
      setAppSubtitle(settings.app_subtitle || defaultSettings.app_subtitle);
      setWelcomeMessage(settings.welcome_message || defaultSettings.welcome_message);
      setLoginTitle(settings.login_title || defaultSettings.login_title);
      setLoginSubtitle(settings.login_subtitle || defaultSettings.login_subtitle);
      setLoginBgColor(settings.login_bg_color || defaultSettings.login_bg_color);
      setLoginCardColor(settings.login_card_color || defaultSettings.login_card_color);
      setLoginGradientStart(settings.login_header_gradient_start || defaultSettings.login_header_gradient_start);
      setLoginGradientEnd(settings.login_header_gradient_end || defaultSettings.login_header_gradient_end);
      setLoginButtonText(settings.login_button_text || defaultSettings.login_button_text);
      setSignupButtonText(settings.signup_button_text || defaultSettings.signup_button_text);
      setLoginSwitchText(settings.login_switch_text || defaultSettings.login_switch_text);
      setSignupSwitchText(settings.signup_switch_text || defaultSettings.signup_switch_text);
      setLoginLogoUrl(settings.login_logo_url || '');
    }
  }, [settings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleSaveBranding = async () => {
    try {
      for (const u of [
        { key: 'app_name', value: appName },
        { key: 'app_subtitle', value: appSubtitle },
        { key: 'welcome_message', value: welcomeMessage },
      ]) await updateSetting.mutateAsync(u);
      toast.success(t.settings_branding_saved);
    } catch { toast.error(t.settings_save_error); }
  };

  const handleSaveLoginSettings = async () => {
    try {
      for (const u of [
        { key: 'login_title', value: loginTitle },
        { key: 'login_subtitle', value: loginSubtitle },
        { key: 'login_bg_color', value: loginBgColor },
        { key: 'login_card_color', value: loginCardColor },
        { key: 'login_header_gradient_start', value: loginGradientStart },
        { key: 'login_header_gradient_end', value: loginGradientEnd },
        { key: 'login_button_text', value: loginButtonText },
        { key: 'signup_button_text', value: signupButtonText },
        { key: 'login_switch_text', value: loginSwitchText },
        { key: 'signup_switch_text', value: signupSwitchText },
      ]) await updateSetting.mutateAsync(u);
      toast.success(t.settings_login_saved);
    } catch { toast.error(t.settings_save_error); }
  };

  const handleLoginLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t.settings_image_too_large); return; }
    if (!file.type.startsWith('image/')) { toast.error(t.settings_select_image); return; }
    setLoginLogoUploading(true);
    try {
      const url = await uploadLoginLogo(file);
      setLoginLogoUrl(url);
      await updateSetting.mutateAsync({ key: 'login_logo_url', value: url });
      toast.success(t.settings_logo_uploaded);
    } catch { toast.error(t.settings_save_error); }
    finally { setLoginLogoUploading(false); }
  };

  const handleRemoveLoginLogo = async () => {
    try { setLoginLogoUrl(''); await updateSetting.mutateAsync({ key: 'login_logo_url', value: '' }); toast.success(t.settings_logo_removed); }
    catch { toast.error(t.settings_save_error); }
  };

  const handleResetDatabase = async () => {
    if (confirmText !== t.settings_reset_db_confirm_text) { toast.error(t.settings_reset_db_confirm_label); return; }
    try { await resetDb.mutateAsync(); toast.success(t.settings_save_success); setResetDialogOpen(false); setConfirmText(''); }
    catch { toast.error(t.settings_save_error); }
  };

  const handleLogoClick = () => fileInputRef.current?.click();
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { toast.error(t.settings_image_too_large); return; }
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.settings_title}</h1>
          <p className="text-muted-foreground">{t.settings_subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-12 lg:w-auto lg:inline-grid overflow-x-auto">
          <TabsTrigger value="company" className="flex items-center gap-2"><Building2 className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_company}</span></TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2"><FileText className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_invoice}</span></TabsTrigger>
          <TabsTrigger value="custom-template" className="flex items-center gap-2"><FileImage className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_custom_template}</span></TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2"><Printer className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_reports}</span></TabsTrigger>
          <TabsTrigger value="advanced-reports" className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_advanced_reports}</span></TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2"><BookOpen className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_accounting}</span></TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2"><Palette className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_branding}</span></TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2"><Tag className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_labels}</span></TabsTrigger>
          <TabsTrigger value="login" className="flex items-center gap-2"><LogIn className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_login}</span></TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2"><Lock className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_password}</span></TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2"><Shield className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_security}</span></TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /><span className="hidden sm:inline">{t.settings_tab_danger}</span></TabsTrigger>
        </TabsList>

        {/* Delegated tabs */}
        <TabsContent value="company" className="mt-6"><CompanySettingsTab /></TabsContent>
        <TabsContent value="reports" className="mt-6"><ReportSettingsTab /></TabsContent>
        <TabsContent value="advanced-reports" className="mt-6"><AdvancedReportSettingsTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><TwoFactorSetup /></TabsContent>
        <TabsContent value="invoice" className="mt-6"><InvoiceSettingsTab /></TabsContent>
        <TabsContent value="custom-template" className="mt-6"><CustomInvoiceTemplateTab /></TabsContent>
        <TabsContent value="accounting" className="mt-6"><CompanyAccountingSettingsTab /></TabsContent>
        <TabsContent value="labels" className="mt-6"><MenuLabelsSettingsTab /></TabsContent>
        <TabsContent value="password" className="mt-6"><PasswordSettingsTab /></TabsContent>

        {/* Branding Tab (inline - small) */}
        <TabsContent value="branding" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />{t.settings_app_logo}</CardTitle>
                <CardDescription>{t.settings_app_logo_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center cursor-pointer group" onClick={handleLogoClick}>
                  <div className="relative">
                    <img src={logoPreview || logo} alt="Logo" className="w-40 h-40 object-contain rounded-xl border-2 border-dashed border-muted-foreground/30 p-4 transition-all group-hover:border-primary group-hover:bg-primary/5" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                <p className="text-sm text-muted-foreground text-center">{t.settings_click_to_change}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LayoutDashboard className="w-5 h-5" />{t.settings_app_info}</CardTitle>
                <CardDescription>{t.settings_app_info_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>{t.settings_app_name_label}</Label><Input value={appName} onChange={(e) => setAppName(e.target.value)} disabled={!isAdmin} /></div>
                <div className="space-y-2"><Label>{t.settings_app_subtitle_label}</Label><Input value={appSubtitle} onChange={(e) => setAppSubtitle(e.target.value)} disabled={!isAdmin} /></div>
                <div className="space-y-2"><Label>{t.settings_welcome_message}</Label><Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} disabled={!isAdmin} rows={3} /></div>
                {isAdmin && (
                  <Button onClick={handleSaveBranding} className="w-full gradient-primary" disabled={updateSetting.isPending}>
                    <Save className="w-4 h-4 ml-2" />{updateSetting.isPending ? t.settings_saving : t.settings_save_branding}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Login Tab */}
        <TabsContent value="login" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Image className="w-5 h-5" />{t.settings_login_logo}</CardTitle><CardDescription>{t.settings_login_logo_desc}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors" onClick={() => isAdmin && loginLogoInputRef.current?.click()}>
                    {loginLogoUrl ? <img src={loginLogoUrl} alt="Login Logo" className="w-full h-full object-contain p-2" /> : <div className="text-center p-4"><Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" /><p className="text-xs text-muted-foreground">{t.settings_click_upload}</p></div>}
                  </div>
                  <input ref={loginLogoInputRef} type="file" accept="image/*" onChange={handleLoginLogoUpload} className="hidden" disabled={!isAdmin} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loginLogoInputRef.current?.click()} disabled={!isAdmin || loginLogoUploading}><Upload className="w-4 h-4 ml-2" />{loginLogoUploading ? t.settings_uploading : t.settings_upload_new}</Button>
                    {loginLogoUrl && <Button variant="destructive" size="sm" onClick={handleRemoveLoginLogo} disabled={!isAdmin}>{t.settings_remove}</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><LogIn className="w-5 h-5" />{t.settings_login_texts}</CardTitle><CardDescription>{t.settings_login_texts_desc}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>{t.settings_login_title_label}</Label><Input value={loginTitle} onChange={(e) => setLoginTitle(e.target.value)} disabled={!isAdmin} /></div>
                <div className="space-y-2"><Label>{t.settings_login_subtitle_label}</Label><Input value={loginSubtitle} onChange={(e) => setLoginSubtitle(e.target.value)} disabled={!isAdmin} /></div>
                <div className="space-y-2"><Label>{t.settings_login_button_label}</Label><Input value={loginButtonText} onChange={(e) => setLoginButtonText(e.target.value)} disabled={!isAdmin} /></div>
                <div className="space-y-2"><Label>{t.settings_signup_button_label}</Label><Input value={signupButtonText} onChange={(e) => setSignupButtonText(e.target.value)} disabled={!isAdmin} /></div>
                <div className="space-y-2"><Label>{t.settings_login_switch_label}</Label><Input value={loginSwitchText} onChange={(e) => setLoginSwitchText(e.target.value)} disabled={!isAdmin} /></div>
                <div className="space-y-2"><Label>{t.settings_signup_switch_label}</Label><Input value={signupSwitchText} onChange={(e) => setSignupSwitchText(e.target.value)} disabled={!isAdmin} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />{t.settings_login_colors}</CardTitle><CardDescription>{t.settings_login_colors_desc}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>{t.settings_bg_color}</Label><div className="flex gap-2"><Input value={loginBgColor} onChange={(e) => setLoginBgColor(e.target.value)} disabled={!isAdmin} className="flex-1" /><div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginBgColor }} /></div></div>
                <div className="space-y-2"><Label>{t.settings_card_color}</Label><div className="flex gap-2"><Input value={loginCardColor} onChange={(e) => setLoginCardColor(e.target.value)} disabled={!isAdmin} className="flex-1" /><div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginCardColor }} /></div></div>
                <div className="space-y-2"><Label>{t.settings_gradient_start}</Label><div className="flex gap-2"><Input value={loginGradientStart} onChange={(e) => setLoginGradientStart(e.target.value)} disabled={!isAdmin} className="flex-1" /><div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginGradientStart }} /></div></div>
                <div className="space-y-2"><Label>{t.settings_gradient_end}</Label><div className="flex gap-2"><Input value={loginGradientEnd} onChange={(e) => setLoginGradientEnd(e.target.value)} disabled={!isAdmin} className="flex-1" /><div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginGradientEnd }} /></div></div>
                <div className="mt-6 p-4 rounded-lg border"><Label className="mb-3 block">{t.settings_gradient_preview}</Label><div className="h-20 rounded-lg" style={{ background: `linear-gradient(135deg, ${loginGradientStart}, ${loginGradientEnd})` }} /></div>
              </CardContent>
            </Card>
          </div>
          {isAdmin && (
            <Button onClick={handleSaveLoginSettings} className="w-full mt-6 gradient-primary" disabled={updateSetting.isPending}>
              <Save className="w-4 h-4 ml-2" />{updateSetting.isPending ? t.settings_saving : t.settings_save_login}
            </Button>
          )}
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="mt-6">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" />{t.settings_danger_zone}</CardTitle>
              <CardDescription>{t.settings_danger_desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <Button variant="destructive" onClick={() => setResetDialogOpen(true)} disabled={!isAdmin}>
                  <RotateCcw className="w-4 h-4 ml-2" />{t.settings_reset_db}
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.settings_reset_db_title}</AlertDialogTitle>
                    <AlertDialogDescription>{t.settings_reset_db_desc}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label>{t.settings_reset_db_confirm_label}</Label>
                    <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={t.settings_reset_db_confirm_text} />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetDatabase} className="bg-destructive hover:bg-destructive/90">{t.settings_reset_db_confirm}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
