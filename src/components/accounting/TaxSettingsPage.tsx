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
import { useLanguage } from '@/contexts/LanguageContext';

export function TaxSettingsPage() {
  const { t, direction } = useLanguage();
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
      toast.success(t.tax_saved);
    } catch (error) {
      toast.error(t.tax_save_error);
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
    <div className="space-y-6" dir={direction}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t.tax_title}</h1>
        <p className="text-muted-foreground">{t.tax_subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t.tax_company_title}
          </CardTitle>
          <CardDescription>{t.tax_company_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company_name_ar">{t.tax_company_name}</Label>
              <Input id="company_name_ar" value={formData.company_name_ar} onChange={(e) => setFormData({ ...formData, company_name_ar: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_number">{t.tax_vat_number}</Label>
              <Input id="tax_number" value={formData.tax_number} onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })} maxLength={15} dir="ltr" />
              <p className="text-xs text-muted-foreground">{t.tax_vat_digits}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="commercial_register">{t.tax_commercial_register}</Label>
              <Input id="commercial_register" value={formData.commercial_register} onChange={(e) => setFormData({ ...formData, commercial_register: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t.tax_city}</Label>
              <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{t.tax_national_address}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="building_number">{t.tax_building_number}</Label>
              <Input id="building_number" value={formData.building_number} onChange={(e) => setFormData({ ...formData, building_number: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">{t.tax_postal_code}</Label>
              <Input id="postal_code" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="national_address">{t.tax_detailed_address}</Label>
              <Input id="national_address" value={formData.national_address} onChange={(e) => setFormData({ ...formData, national_address: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5" />
            {t.tax_settings_title}
          </CardTitle>
          <CardDescription>{t.tax_settings_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_name">{t.tax_name}</Label>
              <Input id="tax_name" value={formData.tax_name} onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">{t.tax_rate}</Label>
              <Input id="tax_rate" type="number" min="0" max="100" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <Label htmlFor="is_active" className="text-base font-medium">{t.tax_enable}</Label>
                <p className="text-sm text-muted-foreground">{t.tax_enable_desc}</p>
              </div>
              <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <Label htmlFor="apply_to_sales" className="text-base font-medium">{t.tax_apply_sales}</Label>
                <p className="text-sm text-muted-foreground">{t.tax_apply_sales_desc}</p>
              </div>
              <Switch id="apply_to_sales" checked={formData.apply_to_sales} onCheckedChange={(checked) => setFormData({ ...formData, apply_to_sales: checked })} disabled={!formData.is_active} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
              <div>
                <Label htmlFor="apply_to_purchases" className="text-base font-medium">{t.tax_apply_purchases}</Label>
                <p className="text-sm text-muted-foreground">{t.tax_apply_purchases_desc}</p>
              </div>
              <Switch id="apply_to_purchases" checked={formData.apply_to_purchases} onCheckedChange={(checked) => setFormData({ ...formData, apply_to_purchases: checked })} disabled={!formData.is_active} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={upsertTaxSettings.isPending} className="w-full">
            {upsertTaxSettings.isPending ? (
              <><Loader2 className="w-4 h-4 ml-2 animate-spin" />{t.tax_saving}</>
            ) : (
              <><Save className="w-4 h-4 ml-2" />{t.tax_save}</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
