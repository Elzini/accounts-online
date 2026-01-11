import { useState, useEffect, useRef } from 'react';
import { Settings, Palette, AlertTriangle, Save, RotateCcw, Upload, FileText, LayoutDashboard, Tag } from 'lucide-react';
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
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { defaultSettings } from '@/services/settings';

interface AppSettingsProps {
  setActivePage: (page: ActivePage) => void;
}

export function AppSettingsPage({ setActivePage }: AppSettingsProps) {
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateAppSetting();
  const resetDb = useResetDatabase();
  const { permissions } = useAuth();
  
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
  
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">الهوية</span>
          </TabsTrigger>
          <TabsTrigger value="labels" className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">التسميات</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">الخطر</span>
          </TabsTrigger>
        </TabsList>

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
