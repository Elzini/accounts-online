import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTaxSettings, useUpsertTaxSettings } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { Loader2, Percent, Save, Building2, MapPin } from 'lucide-react';

export function TaxSettingsPage() {
  const { data: taxSettings, isLoading } = useTaxSettings();
  const upsertTaxSettings = useUpsertTaxSettings();

  const [formData, setFormData] = useState({
    tax_name: 'ضريبة القيمة المضافة',
    tax_rate: 15,
    is_active: true,
    apply_to_sales: true,
    apply_to_purchases: true,
    tax_number: '',
    company_name_ar: '',
    national_address: '',
    commercial_register: '',
    city: '',
    postal_code: '',
    building_number: '',
  });

  // Update form when data loads
  useEffect(() => {
    if (taxSettings) {
      setFormData({
        tax_name: taxSettings.tax_name,
        tax_rate: taxSettings.tax_rate,
        is_active: taxSettings.is_active,
        apply_to_sales: taxSettings.apply_to_sales,
        apply_to_purchases: taxSettings.apply_to_purchases,
        tax_number: taxSettings.tax_number || '',
        company_name_ar: taxSettings.company_name_ar || '',
        national_address: taxSettings.national_address || '',
        commercial_register: taxSettings.commercial_register || '',
        city: taxSettings.city || '',
        postal_code: taxSettings.postal_code || '',
        building_number: taxSettings.building_number || '',
      });
    }
  }, [taxSettings]);

  const handleSave = async () => {
    try {
      await upsertTaxSettings.mutateAsync(formData);
      toast.success('تم حفظ إعدادات الضريبة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">إعدادات الضريبة والفوترة</h1>
        <p className="text-muted-foreground">إدارة بيانات الضريبة والفوترة الإلكترونية المطابقة لهيئة الزكاة والضريبة</p>
      </div>

      {/* Company Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            بيانات الشركة للفوترة الإلكترونية
          </CardTitle>
          <CardDescription>
            بيانات الشركة المطلوبة للفاتورة الإلكترونية حسب متطلبات هيئة الزكاة والضريبة والجمارك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name_ar">اسم الشركة (بالعربي) *</Label>
              <Input
                id="company_name_ar"
                value={formData.company_name_ar}
                onChange={(e) => setFormData({ ...formData, company_name_ar: e.target.value })}
                placeholder="مثال: شركة السيارات المتحدة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_number">الرقم الضريبي (VAT Number) *</Label>
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="مثال: 300000000000003"
                maxLength={15}
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">الرقم الضريبي مكون من 15 رقم</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commercial_register">السجل التجاري</Label>
              <Input
                id="commercial_register"
                value={formData.commercial_register}
                onChange={(e) => setFormData({ ...formData, commercial_register: e.target.value })}
                placeholder="مثال: 1010000000"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="مثال: الرياض"
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">العنوان الوطني</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="building_number">رقم المبنى</Label>
              <Input
                id="building_number"
                value={formData.building_number}
                onChange={(e) => setFormData({ ...formData, building_number: e.target.value })}
                placeholder="مثال: 1234"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">الرمز البريدي</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="مثال: 12345"
                dir="ltr"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="national_address">العنوان التفصيلي</Label>
              <Input
                id="national_address"
                value={formData.national_address}
                onChange={(e) => setFormData({ ...formData, national_address: e.target.value })}
                placeholder="الحي، الشارع"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            إعدادات الضريبة
          </CardTitle>
          <CardDescription>
            تكوين نسبة الضريبة وتطبيقها على المبيعات والمشتريات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_name">اسم الضريبة</Label>
              <Input
                id="tax_name"
                value={formData.tax_name}
                onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                placeholder="ضريبة القيمة المضافة"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">نسبة الضريبة (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <Label htmlFor="is_active" className="text-base font-medium">تفعيل الضريبة</Label>
                <p className="text-sm text-muted-foreground">تفعيل أو تعطيل تطبيق الضريبة</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <Label htmlFor="apply_to_sales" className="text-base font-medium">تطبيق على المبيعات</Label>
                <p className="text-sm text-muted-foreground">إضافة الضريبة تلقائياً على فواتير البيع</p>
              </div>
              <Switch
                id="apply_to_sales"
                checked={formData.apply_to_sales}
                onCheckedChange={(checked) => setFormData({ ...formData, apply_to_sales: checked })}
                disabled={!formData.is_active}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <Label htmlFor="apply_to_purchases" className="text-base font-medium">تطبيق على المشتريات</Label>
                <p className="text-sm text-muted-foreground">إضافة الضريبة تلقائياً على فواتير الشراء</p>
              </div>
              <Switch
                id="apply_to_purchases"
                checked={formData.apply_to_purchases}
                onCheckedChange={(checked) => setFormData({ ...formData, apply_to_purchases: checked })}
                disabled={!formData.is_active}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={upsertTaxSettings.isPending} className="w-full">
            {upsertTaxSettings.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
