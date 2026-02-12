import { useState, useEffect, useRef } from 'react';
import { Settings, Palette, AlertTriangle, Save, RotateCcw, Upload, LayoutDashboard, Tag, LogIn, Image, Lock, Eye, EyeOff, Building2, X, BookOpen, FileText, FileImage, Printer, SlidersHorizontal, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ActivePage } from '@/types';
import { useAppSettings, useUpdateAppSetting, useResetDatabase } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanySettings, useUpdateCompanySettings, useUploadCompanyLogo } from '@/hooks/useCompanySettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { defaultSettings, uploadLoginLogo } from '@/services/settings';
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
  const { companyId, company } = useCompany();
  const { t } = useLanguage();
  
  // Company settings hooks
  const { data: companySettings, isLoading: companySettingsLoading } = useCompanySettings(companyId);
  const updateCompanySettings = useUpdateCompanySettings(companyId);
  const uploadCompanyLogo = useUploadCompanyLogo(companyId);
  
  // Company settings state
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const [companyAppName, setCompanyAppName] = useState('');
  const [companyAppSubtitle, setCompanyAppSubtitle] = useState('');
  const [companyWelcomeMessage, setCompanyWelcomeMessage] = useState('');
  const companyLogoInputRef = useRef<HTMLInputElement>(null);
  
  // Branding settings
  const [appName, setAppName] = useState('');
  const [appSubtitle, setAppSubtitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  // Section labels
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [purchasesTitle, setPurchasesTitle] = useState('');
  const [salesTitle, setSalesTitle] = useState('');
  const [customersTitle, setCustomersTitle] = useState('');
  const [suppliersTitle, setSuppliersTitle] = useState('');
  const [reportsTitle, setReportsTitle] = useState('');
  
  // Login page settings
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
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);

  // Load company settings when available
  useEffect(() => {
    if (companySettings) {
      setCompanyLogoPreview(companySettings.logo_url || null);
      setCompanyAppName(companySettings.app_name || '');
      setCompanyAppSubtitle(companySettings.app_subtitle || '');
      setCompanyWelcomeMessage(companySettings.welcome_message || '');
    }
  }, [companySettings]);

  const isAdmin = permissions.admin;

  // Set initial values when settings load
  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name || defaultSettings.app_name);
      setAppSubtitle(settings.app_subtitle || defaultSettings.app_subtitle);
      setWelcomeMessage(settings.welcome_message || defaultSettings.welcome_message);
      setDashboardTitle(settings.dashboard_title || defaultSettings.dashboard_title);
      setPurchasesTitle(settings.purchases_title || defaultSettings.purchases_title);
      setSalesTitle(settings.sales_title || defaultSettings.sales_title);
      setCustomersTitle(settings.customers_title || defaultSettings.customers_title);
      setSuppliersTitle(settings.suppliers_title || defaultSettings.suppliers_title);
      setReportsTitle(settings.reports_title || defaultSettings.reports_title);
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
      const updates = [
        { key: 'app_name', value: appName },
        { key: 'app_subtitle', value: appSubtitle },
        { key: 'welcome_message', value: welcomeMessage },
      ];
      for (const update of updates) {
        await updateSetting.mutateAsync(update);
      }
      toast.success(t.settings_branding_saved);
    } catch (error) {
      toast.error(t.settings_save_error);
    }
  };

  const handleSaveLabels = async () => {
    try {
      const updates = [
        { key: 'dashboard_title', value: dashboardTitle },
        { key: 'purchases_title', value: purchasesTitle },
        { key: 'sales_title', value: salesTitle },
        { key: 'customers_title', value: customersTitle },
        { key: 'suppliers_title', value: suppliersTitle },
        { key: 'reports_title', value: reportsTitle },
      ];
      for (const update of updates) {
        await updateSetting.mutateAsync(update);
      }
      toast.success(t.settings_labels_saved);
    } catch (error) {
      toast.error(t.settings_save_error);
    }
  };

  const handleSaveLoginSettings = async () => {
    try {
      const updates = [
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
      ];
      for (const update of updates) {
        await updateSetting.mutateAsync(update);
      }
      toast.success(t.settings_login_saved);
    } catch (error) {
      toast.error(t.settings_save_error);
    }
  };

  const handleLoginLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.settings_image_too_large);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(t.settings_select_image);
      return;
    }
    setLoginLogoUploading(true);
    try {
      const url = await uploadLoginLogo(file);
      setLoginLogoUrl(url);
      await updateSetting.mutateAsync({ key: 'login_logo_url', value: url });
      toast.success(t.settings_logo_uploaded);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(t.settings_save_error);
    } finally {
      setLoginLogoUploading(false);
    }
  };

  const handleRemoveLoginLogo = async () => {
    try {
      setLoginLogoUrl('');
      await updateSetting.mutateAsync({ key: 'login_logo_url', value: '' });
      toast.success(t.settings_logo_removed);
    } catch (error) {
      toast.error(t.settings_save_error);
    }
  };

  const handleResetDatabase = async () => {
    if (confirmText !== t.settings_reset_db_confirm_text) {
      toast.error(t.settings_reset_db_confirm_label);
      return;
    }
    try {
      await resetDb.mutateAsync();
      toast.success(t.settings_save_success);
      setResetDialogOpen(false);
      setConfirmText('');
    } catch (error) {
      toast.error(t.settings_save_error);
    }
  };

  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.settings_image_too_large);
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(t.settings_select_image);
      return;
    }
    try {
      const reader = new FileReader();
      reader.onloadend = () => { setCompanyLogoPreview(reader.result as string); };
      reader.readAsDataURL(file);
      const url = await uploadCompanyLogo.mutateAsync(file);
      setCompanyLogoPreview(url);
      toast.success(t.settings_logo_uploaded);
    } catch (error) {
      console.error('Error uploading company logo:', error);
      toast.error(t.settings_save_error);
    }
  };

  const handleRemoveCompanyLogo = async () => {
    try {
      await updateCompanySettings.mutateAsync({ logo_url: '' });
      setCompanyLogoPreview(null);
      toast.success(t.settings_logo_removed);
    } catch (error) {
      toast.error(t.settings_save_error);
    }
  };

  const handleSaveCompanySettings = async () => {
    try {
      await updateCompanySettings.mutateAsync({
        welcome_message: companyWelcomeMessage,
        app_name: companyAppName,
        app_subtitle: companyAppSubtitle,
      });
      toast.success(t.settings_save_success);
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast.error(t.settings_save_error);
    }
  };

  const handleLogoClick = () => { fileInputRef.current?.click(); };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t.settings_image_too_large);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t.settings_fill_all_fields);
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t.settings_password_min);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.settings_password_mismatch);
      return;
    }
    setPasswordChanging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error(t.settings_save_error);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error(t.settings_current_password_wrong);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        toast.error(t.settings_save_error);
        return;
      }
      toast.success(t.settings_password_changed);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(t.settings_save_error);
    } finally {
      setPasswordChanging(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
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
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_company}</span>
          </TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_invoice}</span>
          </TabsTrigger>
          <TabsTrigger value="custom-template" className="flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_custom_template}</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_reports}</span>
          </TabsTrigger>
          <TabsTrigger value="advanced-reports" className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_advanced_reports}</span>
          </TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_accounting}</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_branding}</span>
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_labels}</span>
          </TabsTrigger>
          <TabsTrigger value="login" className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_login}</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_password}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_security}</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings_tab_danger}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="mt-6"><ReportSettingsTab /></TabsContent>
        <TabsContent value="advanced-reports" className="mt-6"><AdvancedReportSettingsTab /></TabsContent>
        <TabsContent value="security" className="mt-6"><TwoFactorSetup /></TabsContent>
        <TabsContent value="invoice" className="mt-6"><InvoiceSettingsTab /></TabsContent>
        <TabsContent value="custom-template" className="mt-6"><CustomInvoiceTemplateTab /></TabsContent>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  {t.settings_company_logo}
                </CardTitle>
                <CardDescription>{t.settings_company_logo_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="relative w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                    onClick={() => companyLogoInputRef.current?.click()}
                  >
                    {companyLogoPreview ? (
                      <>
                        <img src={companyLogoPreview} alt="Company Logo" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-xs">{t.settings_upload_logo}</span>
                      </div>
                    )}
                  </div>
                  <input ref={companyLogoInputRef} type="file" accept="image/*" onChange={handleCompanyLogoUpload} className="hidden" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">{t.settings_click_to_upload}</p>
                    <p className="text-xs text-muted-foreground">{t.settings_max_size}</p>
                    {companyLogoPreview && (
                      <Button variant="outline" size="sm" onClick={handleRemoveCompanyLogo} className="text-destructive hover:text-destructive" disabled={uploadCompanyLogo.isPending}>
                        <X className="w-4 h-4 ml-1" />
                        {t.settings_remove_logo}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t.settings_company_info}
                </CardTitle>
                <CardDescription>{t.settings_company_info_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-app-name">{t.settings_company_app_name}</Label>
                  <Input id="company-app-name" value={companyAppName} onChange={(e) => setCompanyAppName(e.target.value)} placeholder={company?.name || ''} disabled={!isAdmin} />
                  <p className="text-xs text-muted-foreground">{t.settings_company_app_name_hint}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-app-subtitle">{t.settings_company_subtitle}</Label>
                  <Input id="company-app-subtitle" value={companyAppSubtitle} onChange={(e) => setCompanyAppSubtitle(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-welcome-message">{t.settings_welcome_message}</Label>
                  <Textarea id="company-welcome-message" value={companyWelcomeMessage} onChange={(e) => setCompanyWelcomeMessage(e.target.value)} disabled={!isAdmin} rows={3} />
                  <p className="text-xs text-muted-foreground">{t.settings_welcome_message_hint}</p>
                </div>
                {isAdmin && (
                  <Button onClick={handleSaveCompanySettings} className="w-full gradient-primary" disabled={updateCompanySettings.isPending}>
                    <Save className="w-4 h-4 ml-2" />
                    {updateCompanySettings.isPending ? t.settings_saving : t.settings_save_company}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounting" className="mt-6"><CompanyAccountingSettingsTab /></TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {t.settings_app_logo}
                </CardTitle>
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
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  {t.settings_app_info}
                </CardTitle>
                <CardDescription>{t.settings_app_info_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">{t.settings_app_name_label}</Label>
                  <Input id="app-name" value={appName} onChange={(e) => setAppName(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-subtitle">{t.settings_app_subtitle_label}</Label>
                  <Input id="app-subtitle" value={appSubtitle} onChange={(e) => setAppSubtitle(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">{t.settings_welcome_message}</Label>
                  <Textarea id="welcome-message" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} disabled={!isAdmin} rows={3} />
                </div>
                {isAdmin && (
                  <Button onClick={handleSaveBranding} className="w-full gradient-primary" disabled={updateSetting.isPending}>
                    <Save className="w-4 h-4 ml-2" />
                    {updateSetting.isPending ? t.settings_saving : t.settings_save_branding}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="labels" className="mt-6"><MenuLabelsSettingsTab /></TabsContent>

        {/* Login Page Tab */}
        <TabsContent value="login" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  {t.settings_login_logo}
                </CardTitle>
                <CardDescription>{t.settings_login_logo_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => isAdmin && loginLogoInputRef.current?.click()}
                  >
                    {loginLogoUrl ? (
                      <img src={loginLogoUrl} alt="Login Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{t.settings_click_upload}</p>
                      </div>
                    )}
                  </div>
                  <input ref={loginLogoInputRef} type="file" accept="image/*" onChange={handleLoginLogoUpload} className="hidden" disabled={!isAdmin} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => loginLogoInputRef.current?.click()} disabled={!isAdmin || loginLogoUploading}>
                      <Upload className="w-4 h-4 ml-2" />
                      {loginLogoUploading ? t.settings_uploading : t.settings_upload_new}
                    </Button>
                    {loginLogoUrl && (
                      <Button variant="destructive" size="sm" onClick={handleRemoveLoginLogo} disabled={!isAdmin}>
                        {t.settings_remove}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{t.settings_max_size}<br />PNG, JPG, WebP</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  {t.settings_login_texts}
                </CardTitle>
                <CardDescription>{t.settings_login_texts_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-title">{t.settings_login_title_label}</Label>
                  <Input id="login-title" value={loginTitle} onChange={(e) => setLoginTitle(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-subtitle">{t.settings_login_subtitle_label}</Label>
                  <Input id="login-subtitle" value={loginSubtitle} onChange={(e) => setLoginSubtitle(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-button-text">{t.settings_login_button_label}</Label>
                  <Input id="login-button-text" value={loginButtonText} onChange={(e) => setLoginButtonText(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-button-text">{t.settings_signup_button_label}</Label>
                  <Input id="signup-button-text" value={signupButtonText} onChange={(e) => setSignupButtonText(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-switch-text">{t.settings_login_switch_label}</Label>
                  <Input id="login-switch-text" value={loginSwitchText} onChange={(e) => setLoginSwitchText(e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-switch-text">{t.settings_signup_switch_label}</Label>
                  <Input id="signup-switch-text" value={signupSwitchText} onChange={(e) => setSignupSwitchText(e.target.value)} disabled={!isAdmin} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  {t.settings_login_colors}
                </CardTitle>
                <CardDescription>{t.settings_login_colors_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-bg-color">{t.settings_bg_color}</Label>
                  <div className="flex gap-2">
                    <Input id="login-bg-color" value={loginBgColor} onChange={(e) => setLoginBgColor(e.target.value)} disabled={!isAdmin} className="flex-1" />
                    <div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginBgColor }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-card-color">{t.settings_card_color}</Label>
                  <div className="flex gap-2">
                    <Input id="login-card-color" value={loginCardColor} onChange={(e) => setLoginCardColor(e.target.value)} disabled={!isAdmin} className="flex-1" />
                    <div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginCardColor }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-gradient-start">{t.settings_gradient_start}</Label>
                  <div className="flex gap-2">
                    <Input id="login-gradient-start" value={loginGradientStart} onChange={(e) => setLoginGradientStart(e.target.value)} disabled={!isAdmin} className="flex-1" />
                    <div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginGradientStart }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-gradient-end">{t.settings_gradient_end}</Label>
                  <div className="flex gap-2">
                    <Input id="login-gradient-end" value={loginGradientEnd} onChange={(e) => setLoginGradientEnd(e.target.value)} disabled={!isAdmin} className="flex-1" />
                    <div className="w-12 h-10 rounded-md border" style={{ backgroundColor: loginGradientEnd }} />
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg border">
                  <Label className="mb-3 block">{t.settings_gradient_preview}</Label>
                  <div className="h-20 rounded-lg" style={{ background: `linear-gradient(135deg, ${loginGradientStart}, ${loginGradientEnd})` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {isAdmin && (
            <Button onClick={handleSaveLoginSettings} className="w-full mt-6 gradient-primary" disabled={updateSetting.isPending}>
              <Save className="w-4 h-4 ml-2" />
              {updateSetting.isPending ? t.settings_saving : t.settings_save_login}
            </Button>
          )}
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t.settings_change_password}
              </CardTitle>
              <CardDescription>{t.settings_change_password_desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t.settings_current_password}</Label>
                <div className="relative">
                  <Input id="current-password" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="pl-10" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t.settings_new_password}</Label>
                <div className="relative">
                  <Input id="new-password" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t.settings_confirm_new_password}</Label>
                <div className="relative">
                  <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button onClick={handleChangePassword} className="w-full gradient-primary" disabled={passwordChanging}>
                <Lock className="w-4 h-4 ml-2" />
                {passwordChanging ? t.settings_password_changing : t.settings_change_password_btn}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Tab */}
        <TabsContent value="danger" className="mt-6">
          {isAdmin ? (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  {t.settings_danger_zone}
                </CardTitle>
                <CardDescription>{t.settings_danger_desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-bold text-destructive mb-2">{t.settings_reset_db}</h4>
                  <p className="text-sm text-muted-foreground mb-4">{t.settings_reset_db_desc}</p>
                  <Button variant="destructive" onClick={() => setResetDialogOpen(true)} className="w-full">
                    <RotateCcw className="w-4 h-4 ml-2" />
                    {t.settings_reset_db}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.settings_no_access}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reset Database Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">{t.settings_reset_db_warning}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>{t.settings_reset_db_items}</p>
              <p className="font-bold text-destructive">{t.settings_reset_db_irreversible}</p>
              <div className="mt-4">
                <Label>{t.settings_reset_db_confirm_label}</Label>
                <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={t.settings_reset_db_confirm_text} className="mt-2" />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel onClick={() => setConfirmText('')}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={resetDb.isPending || confirmText !== t.settings_reset_db_confirm_text}
            >
              {resetDb.isPending ? t.settings_deleting : t.settings_confirm_reset}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
