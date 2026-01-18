import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTaxSettings, useUpsertTaxSettings } from '@/hooks/useAccounting';
import { toast } from 'sonner';
import { Loader2, Percent, Save } from 'lucide-react';

export function TaxSettingsPage() {
  const { data: taxSettings, isLoading } = useTaxSettings();
  const upsertTaxSettings = useUpsertTaxSettings();

  const [formData, setFormData] = useState({
    tax_name: 'ضريبة القيمة المضافة',
    tax_rate: 15,
    is_active: true,
    apply_to_sales: true,
    apply_to_purchases: true,
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
        <h1 className="text-2xl font-bold text-foreground">إعدادات الضريبة</h1>
        <p className="text-muted-foreground">إدارة إعدادات الضريبة للشركة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            إعدادات الضريبة الموحدة
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
