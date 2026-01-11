import { useState } from 'react';
import { Settings, Palette, AlertTriangle, Save, RotateCcw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface AppSettingsProps {
  setActivePage: (page: ActivePage) => void;
}

export function AppSettingsPage({ setActivePage }: AppSettingsProps) {
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateAppSetting();
  const resetDb = useResetDatabase();
  const { permissions } = useAuth();
  
  const [appName, setAppName] = useState('');
  const [appSubtitle, setAppSubtitle] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isAdmin = permissions.admin;

  // Set initial values when settings load
  useState(() => {
    if (settings) {
      setAppName(settings.app_name);
      setAppSubtitle(settings.app_subtitle);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    try {
      if (appName && appName !== settings?.app_name) {
        await updateSetting.mutateAsync({ key: 'app_name', value: appName });
      }
      if (appSubtitle && appSubtitle !== settings?.app_subtitle) {
        await updateSetting.mutateAsync({ key: 'app_subtitle', value: appSubtitle });
      }
      toast.success('تم حفظ الإعدادات بنجاح');
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              هوية البرنامج
            </CardTitle>
            <CardDescription>
              تخصيص اسم ومظهر البرنامج
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Logo" className="w-32 h-32 object-contain rounded-xl" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app-name">اسم البرنامج</Label>
              <Input
                id="app-name"
                value={appName || settings?.app_name || ''}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="أشبال النمر"
                disabled={!isAdmin}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app-subtitle">وصف البرنامج</Label>
              <Input
                id="app-subtitle"
                value={appSubtitle || settings?.app_subtitle || ''}
                onChange={(e) => setAppSubtitle(e.target.value)}
                placeholder="لتجارة السيارات"
                disabled={!isAdmin}
              />
            </div>

            {isAdmin && (
              <Button 
                onClick={handleSaveSettings} 
                className="w-full gradient-primary"
                disabled={updateSetting.isPending}
              >
                <Save className="w-4 h-4 ml-2" />
                {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isAdmin && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                منطقة الخطر
              </CardTitle>
              <CardDescription>
                إجراءات لا يمكن التراجع عنها
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
        )}
      </div>

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
