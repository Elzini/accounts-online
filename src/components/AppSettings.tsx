import { useState, useEffect, useRef } from 'react';
import { Settings, Palette, AlertTriangle, Save, RotateCcw, Upload, LayoutDashboard, Tag, LogIn, Image, Lock, Eye, EyeOff, Building2, X } from 'lucide-react';
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
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { defaultSettings, uploadLoginLogo } from '@/services/settings';

interface AppSettingsProps {
  setActivePage: (page: ActivePage) => void;
}

export function AppSettingsPage({ setActivePage }: AppSettingsProps) {
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateAppSetting();
  const resetDb = useResetDatabase();
  const { permissions } = useAuth();
  const { companyId, company } = useCompany();
  
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
      // Login settings
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
      
      toast.success('تم حفظ إعدادات الهوية بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
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
      
      toast.success('تم حفظ تسميات الأقسام بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
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
      
      toast.success('تم حفظ إعدادات شاشة الدخول بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleLoginLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setLoginLogoUploading(true);
    try {
      const url = await uploadLoginLogo(file);
      setLoginLogoUrl(url);
      await updateSetting.mutateAsync({ key: 'login_logo_url', value: url });
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
    } finally {
      setLoginLogoUploading(false);
    }
  };

  const handleRemoveLoginLogo = async () => {
    try {
      setLoginLogoUrl('');
      await updateSetting.mutateAsync({ key: 'login_logo_url', value: '' });
      toast.success('تم إزالة الشعار');
    } catch (error) {
      toast.error('حدث خطأ أثناء إزالة الشعار');
    }
  };

  const handleResetDatabase = async () => {
    if (confirmText !== 'تأكيد الحذف') {
      toast.error('يرجى كتابة "تأكيد الحذف" للمتابعة');
      return;
    }
    try {
      await resetDb.mutateAsync();
      toast.success('تم تصفير قاعدة البيانات بنجاح');
      setResetDialogOpen(false);
      setConfirmText('');
    } catch (error) {
      toast.error('حدث خطأ أثناء تصفير قاعدة البيانات');
    }
  };

  // Company logo handlers
  const handleCompanyLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const url = await uploadCompanyLogo.mutateAsync(file);
      setCompanyLogoPreview(url);
      toast.success('تم رفع شعار الشركة بنجاح');
    } catch (error) {
      console.error('Error uploading company logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
    }
  };

  const handleRemoveCompanyLogo = async () => {
    try {
      await updateCompanySettings.mutateAsync({ logo_url: '' });
      setCompanyLogoPreview(null);
      toast.success('تم إزالة شعار الشركة');
    } catch (error) {
      toast.error('حدث خطأ أثناء إزالة الشعار');
    }
  };

  const handleSaveCompanySettings = async () => {
    try {
      await updateCompanySettings.mutateAsync({
        welcome_message: companyWelcomeMessage,
        app_name: companyAppName,
        app_subtitle: companyAppSubtitle,
      });
      toast.success('تم حفظ إعدادات الشركة بنجاح');
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast.info('لتغيير الشعار بشكل دائم، يرجى رفع الصورة الجديدة إلى المشروع');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة غير متطابقة');
      return;
    }

    setPasswordChanging(true);
    try {
      // First verify current password by trying to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error('حدث خطأ في جلب بيانات المستخدم');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error('كلمة المرور الحالية غير صحيحة');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error('حدث خطأ أثناء تغيير كلمة المرور');
        return;
      }

      toast.success('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('حدث خطأ غير متوقع');
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
          <h1 className="text-3xl font-bold text-foreground">إعدادات النظام</h1>
          <p className="text-muted-foreground">تخصيص مظهر وإعدادات البرنامج</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">شركتي</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">الهوية</span>
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">التسميات</span>
          </TabsTrigger>
          <TabsTrigger value="login" className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">شاشة الدخول</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">كلمة المرور</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">الخطر</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings Tab */}
        <TabsContent value="company" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Logo Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  شعار الشركة
                </CardTitle>
                <CardDescription>
                  شعار شركتك الذي سيظهر في الشريط الجانبي
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div 
                    className="relative w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                    onClick={() => companyLogoInputRef.current?.click()}
                  >
                    {companyLogoPreview ? (
                      <>
                        <img 
                          src={companyLogoPreview} 
                          alt="Company Logo" 
                          className="w-full h-full object-contain p-2"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Upload className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <span className="text-xs">رفع شعار</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={companyLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCompanyLogoUpload}
                    className="hidden"
                  />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      انقر على الصورة لرفع شعار جديد
                    </p>
                    <p className="text-xs text-muted-foreground">
                      الحد الأقصى: 2 ميجابايت | PNG, JPG, SVG
                    </p>
                    {companyLogoPreview && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveCompanyLogo}
                        className="text-destructive hover:text-destructive"
                        disabled={uploadCompanyLogo.isPending}
                      >
                        <X className="w-4 h-4 ml-1" />
                        إزالة الشعار
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  معلومات الشركة
                </CardTitle>
                <CardDescription>
                  اسم ووصف شركتك الذي سيظهر للمستخدمين
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-app-name">اسم الشركة في التطبيق</Label>
                  <Input
                    id="company-app-name"
                    value={companyAppName}
                    onChange={(e) => setCompanyAppName(e.target.value)}
                    placeholder={company?.name || 'اسم الشركة'}
                    disabled={!isAdmin}
                  />
                  <p className="text-xs text-muted-foreground">
                    سيظهر هذا الاسم في الشريط الجانبي ولوحة التحكم
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company-app-subtitle">وصف الشركة</Label>
                  <Input
                    id="company-app-subtitle"
                    value={companyAppSubtitle}
                    onChange={(e) => setCompanyAppSubtitle(e.target.value)}
                    placeholder="وصف قصير للشركة"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-welcome-message">رسالة الترحيب</Label>
                  <Textarea
                    id="company-welcome-message"
                    value={companyWelcomeMessage}
                    onChange={(e) => setCompanyWelcomeMessage(e.target.value)}
                    placeholder="رسالة ترحيب تظهر في لوحة التحكم..."
                    disabled={!isAdmin}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    ستظهر هذه الرسالة في لوحة التحكم لجميع مستخدمي الشركة
                  </p>
                </div>

                {isAdmin && (
                  <Button 
                    onClick={handleSaveCompanySettings} 
                    className="w-full gradient-primary"
                    disabled={updateCompanySettings.isPending}
                  >
                    <Save className="w-4 h-4 ml-2" />
                    {updateCompanySettings.isPending ? 'جاري الحفظ...' : 'حفظ إعدادات الشركة'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  شعار البرنامج
                </CardTitle>
                <CardDescription>
                  انقر على الشعار لتغييره (الحد الأقصى 2 ميجابايت)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="flex justify-center cursor-pointer group"
                  onClick={handleLogoClick}
                >
                  <div className="relative">
                    <img 
                      src={logoPreview || logo} 
                      alt="Logo" 
                      className="w-40 h-40 object-contain rounded-xl border-2 border-dashed border-muted-foreground/30 p-4 transition-all group-hover:border-primary group-hover:bg-primary/5" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <p className="text-sm text-muted-foreground text-center">
                  انقر لاختيار صورة جديدة
                </p>
              </CardContent>
            </Card>

            {/* App Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5" />
                  معلومات البرنامج
                </CardTitle>
                <CardDescription>
                  اسم البرنامج ورسالة الترحيب
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">اسم البرنامج</Label>
                  <Input
                    id="app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="أشبال النمر"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="app-subtitle">وصف البرنامج</Label>
                  <Input
                    id="app-subtitle"
                    value={appSubtitle}
                    onChange={(e) => setAppSubtitle(e.target.value)}
                    placeholder="لتجارة السيارات"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcome-message">رسالة الترحيب</Label>
                  <Textarea
                    id="welcome-message"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="مرحباً بك في نظام..."
                    disabled={!isAdmin}
                    rows={3}
                  />
                </div>

                {isAdmin && (
                  <Button 
                    onClick={handleSaveBranding} 
                    className="w-full gradient-primary"
                    disabled={updateSetting.isPending}
                  >
                    <Save className="w-4 h-4 ml-2" />
                    {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ الهوية'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Labels Tab */}
        <TabsContent value="labels" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                تسميات الأقسام
              </CardTitle>
              <CardDescription>
                تغيير أسماء الأقسام في القائمة الجانبية ولوحة التحكم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dashboard-title">لوحة التحكم</Label>
                  <Input
                    id="dashboard-title"
                    value={dashboardTitle}
                    onChange={(e) => setDashboardTitle(e.target.value)}
                    placeholder="لوحة التحكم"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchases-title">المشتريات</Label>
                  <Input
                    id="purchases-title"
                    value={purchasesTitle}
                    onChange={(e) => setPurchasesTitle(e.target.value)}
                    placeholder="المشتريات"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sales-title">المبيعات</Label>
                  <Input
                    id="sales-title"
                    value={salesTitle}
                    onChange={(e) => setSalesTitle(e.target.value)}
                    placeholder="المبيعات"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customers-title">العملاء</Label>
                  <Input
                    id="customers-title"
                    value={customersTitle}
                    onChange={(e) => setCustomersTitle(e.target.value)}
                    placeholder="العملاء"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="suppliers-title">الموردين</Label>
                  <Input
                    id="suppliers-title"
                    value={suppliersTitle}
                    onChange={(e) => setSuppliersTitle(e.target.value)}
                    placeholder="الموردين"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reports-title">التقارير</Label>
                  <Input
                    id="reports-title"
                    value={reportsTitle}
                    onChange={(e) => setReportsTitle(e.target.value)}
                    placeholder="التقارير"
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              {isAdmin && (
                <Button 
                  onClick={handleSaveLabels} 
                  className="w-full gradient-primary"
                  disabled={updateSetting.isPending}
                >
                  <Save className="w-4 h-4 ml-2" />
                  {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ التسميات'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Login Page Tab */}
        <TabsContent value="login" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Login Logo Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  شعار شاشة الدخول
                </CardTitle>
                <CardDescription>
                  رفع شعار مخصص لشاشة تسجيل الدخول
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div 
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => isAdmin && loginLogoInputRef.current?.click()}
                  >
                    {loginLogoUrl ? (
                      <img 
                        src={loginLogoUrl} 
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
                    ref={loginLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLoginLogoUpload}
                    className="hidden"
                    disabled={!isAdmin}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loginLogoInputRef.current?.click()}
                      disabled={!isAdmin || loginLogoUploading}
                    >
                      <Upload className="w-4 h-4 ml-2" />
                      {loginLogoUploading ? 'جاري الرفع...' : 'رفع شعار'}
                    </Button>
                    
                    {loginLogoUrl && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveLoginLogo}
                        disabled={!isAdmin}
                      >
                        إزالة
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    الحد الأقصى 2 ميجابايت
                    <br />
                    PNG, JPG, WebP
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Login Text Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  نصوص شاشة الدخول
                </CardTitle>
                <CardDescription>
                  تخصيص العناوين والنصوص في شاشة تسجيل الدخول
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-title">عنوان شاشة الدخول</Label>
                  <Input
                    id="login-title"
                    value={loginTitle}
                    onChange={(e) => setLoginTitle(e.target.value)}
                    placeholder="أشبال النمر"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-subtitle">الوصف الفرعي</Label>
                  <Input
                    id="login-subtitle"
                    value={loginSubtitle}
                    onChange={(e) => setLoginSubtitle(e.target.value)}
                    placeholder="نظام إدارة معرض السيارات"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-button-text">نص زر تسجيل الدخول</Label>
                  <Input
                    id="login-button-text"
                    value={loginButtonText}
                    onChange={(e) => setLoginButtonText(e.target.value)}
                    placeholder="تسجيل الدخول"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-button-text">نص زر إنشاء حساب</Label>
                  <Input
                    id="signup-button-text"
                    value={signupButtonText}
                    onChange={(e) => setSignupButtonText(e.target.value)}
                    placeholder="إنشاء حساب"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-switch-text">نص التبديل لإنشاء حساب</Label>
                  <Input
                    id="login-switch-text"
                    value={loginSwitchText}
                    onChange={(e) => setLoginSwitchText(e.target.value)}
                    placeholder="ليس لديك حساب؟ إنشاء حساب جديد"
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-switch-text">نص التبديل لتسجيل الدخول</Label>
                  <Input
                    id="signup-switch-text"
                    value={signupSwitchText}
                    onChange={(e) => setSignupSwitchText(e.target.value)}
                    placeholder="لديك حساب؟ تسجيل الدخول"
                    disabled={!isAdmin}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Login Colors Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  ألوان شاشة الدخول
                </CardTitle>
                <CardDescription>
                  تخصيص ألوان الخلفية والتدرجات اللونية
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-bg-color">لون خلفية الصفحة</Label>
                  <div className="flex gap-2">
                    <Input
                      id="login-bg-color"
                      value={loginBgColor}
                      onChange={(e) => setLoginBgColor(e.target.value)}
                      placeholder="hsl(222.2, 84%, 4.9%)"
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                    <div 
                      className="w-12 h-10 rounded-md border"
                      style={{ backgroundColor: loginBgColor }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-card-color">لون البطاقة</Label>
                  <div className="flex gap-2">
                    <Input
                      id="login-card-color"
                      value={loginCardColor}
                      onChange={(e) => setLoginCardColor(e.target.value)}
                      placeholder="hsl(222.2, 84%, 6%)"
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                    <div 
                      className="w-12 h-10 rounded-md border"
                      style={{ backgroundColor: loginCardColor }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-gradient-start">لون بداية التدرج</Label>
                  <div className="flex gap-2">
                    <Input
                      id="login-gradient-start"
                      value={loginGradientStart}
                      onChange={(e) => setLoginGradientStart(e.target.value)}
                      placeholder="hsl(221.2, 83.2%, 53.3%)"
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                    <div 
                      className="w-12 h-10 rounded-md border"
                      style={{ backgroundColor: loginGradientStart }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-gradient-end">لون نهاية التدرج</Label>
                  <div className="flex gap-2">
                    <Input
                      id="login-gradient-end"
                      value={loginGradientEnd}
                      onChange={(e) => setLoginGradientEnd(e.target.value)}
                      placeholder="hsl(250, 95%, 65%)"
                      disabled={!isAdmin}
                      className="flex-1"
                    />
                    <div 
                      className="w-12 h-10 rounded-md border"
                      style={{ backgroundColor: loginGradientEnd }}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 rounded-lg border">
                  <Label className="mb-3 block">معاينة التدرج اللوني</Label>
                  <div 
                    className="h-20 rounded-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${loginGradientStart}, ${loginGradientEnd})`
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {isAdmin && (
            <Button 
              onClick={handleSaveLoginSettings} 
              className="w-full mt-6 gradient-primary"
              disabled={updateSetting.isPending}
            >
              <Save className="w-4 h-4 ml-2" />
              {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ إعدادات شاشة الدخول'}
            </Button>
          )}
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                تغيير كلمة المرور
              </CardTitle>
              <CardDescription>
                قم بتغيير كلمة مرور حسابك الحالي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleChangePassword} 
                className="w-full gradient-primary"
                disabled={passwordChanging}
              >
                <Lock className="w-4 h-4 ml-2" />
                {passwordChanging ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
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
                  منطقة الخطر
                </CardTitle>
                <CardDescription>
                  إجراءات لا يمكن التراجع عنها - استخدم بحذر شديد
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="font-bold text-destructive mb-2">تصفير قاعدة البيانات</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    سيؤدي هذا إلى حذف جميع البيانات (العملاء، الموردين، السيارات، المبيعات) نهائياً.
                    لا يمكن التراجع عن هذا الإجراء!
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setResetDialogOpen(true)}
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 ml-2" />
                    تصفير قاعدة البيانات
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  ليس لديك صلاحية الوصول لهذا القسم
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reset Database Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              تحذير! تصفير قاعدة البيانات
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                أنت على وشك حذف جميع البيانات في النظام بما في ذلك:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>جميع العملاء</li>
                <li>جميع الموردين</li>
                <li>جميع السيارات</li>
                <li>جميع عمليات البيع</li>
              </ul>
              <p className="font-bold text-destructive">
                هذا الإجراء لا يمكن التراجع عنه!
              </p>
              <div className="mt-4">
                <Label>اكتب "تأكيد الحذف" للمتابعة:</Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="تأكيد الحذف"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel onClick={() => setConfirmText('')}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetDatabase}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={resetDb.isPending || confirmText !== 'تأكيد الحذف'}
            >
              {resetDb.isPending ? 'جاري الحذف...' : 'تأكيد التصفير'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
