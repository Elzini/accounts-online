import { useState, useEffect, useRef } from 'react';
import { Building2, Upload, Save, X, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useCompanySettings, useUpdateCompanySettings, useUploadCompanyLogo } from '@/hooks/useCompanySettings';

interface CompanySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

export function CompanySettingsDialog({ 
  open, 
  onOpenChange, 
  companyId,
  companyName 
}: CompanySettingsDialogProps) {
  const { data: settings, isLoading } = useCompanySettings(companyId);
  const updateSettings = useUpdateCompanySettings(companyId);
  const uploadLogo = useUploadCompanyLogo(companyId);
  
  const [logoUrl, setLogoUrl] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [appName, setAppName] = useState('');
  const [appSubtitle, setAppSubtitle] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logo_url || '');
      setWelcomeMessage(settings.welcome_message || '');
      setAppName(settings.app_name || '');
      setAppSubtitle(settings.app_subtitle || '');
      setLogoPreview(settings.logo_url || null);
    }
  }, [settings]);

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

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const url = await uploadLogo.mutateAsync(file);
      setLogoUrl(url);
      toast.success('تم رفع الشعار بنجاح');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('حدث خطأ أثناء رفع الشعار');
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateSettings.mutateAsync({ logo_url: '' });
      setLogoUrl('');
      setLogoPreview(null);
      toast.success('تم إزالة الشعار');
    } catch (error) {
      toast.error('حدث خطأ أثناء إزالة الشعار');
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        welcome_message: welcomeMessage,
        app_name: appName,
        app_subtitle: appSubtitle,
      });
      toast.success('تم حفظ الإعدادات بنجاح');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]" dir="rtl">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            إعدادات شركة: {companyName}
          </DialogTitle>
          <DialogDescription>
            تخصيص الشعار ورسالة الترحيب لهذه الشركة
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Logo Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Image className="w-4 h-4" />
              شعار الشركة
            </Label>
            <div className="flex items-start gap-4">
              <div 
                className="relative w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <>
                    <img 
                      src={logoPreview} 
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  انقر على الصورة لرفع شعار جديد
                </p>
                <p className="text-xs text-muted-foreground">
                  الحد الأقصى: 2 ميجابايت | PNG, JPG, SVG
                </p>
                {logoPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                    disabled={uploadLogo.isPending}
                  >
                    <X className="w-4 h-4 ml-1" />
                    إزالة الشعار
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="app-name">اسم التطبيق للشركة</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="اسم يظهر في التطبيق لهذه الشركة"
            />
            <p className="text-xs text-muted-foreground">
              سيظهر هذا الاسم في الشريط الجانبي ولوحة التحكم لمستخدمي هذه الشركة
            </p>
          </div>

          {/* App Subtitle */}
          <div className="space-y-2">
            <Label htmlFor="app-subtitle">وصف التطبيق</Label>
            <Input
              id="app-subtitle"
              value={appSubtitle}
              onChange={(e) => setAppSubtitle(e.target.value)}
              placeholder="وصف قصير للتطبيق"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label htmlFor="welcome-message">رسالة الترحيب</Label>
            <Textarea
              id="welcome-message"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="رسالة ترحيب خاصة بهذه الشركة..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              ستظهر هذه الرسالة في لوحة التحكم لمستخدمي هذه الشركة
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="gradient-primary"
          >
            <Save className="w-4 h-4 ml-2" />
            حفظ الإعدادات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
