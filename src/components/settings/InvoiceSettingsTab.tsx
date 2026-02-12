import { useState, useEffect, useRef, useMemo } from 'react';
import { FileText, Upload, X, Check, Palette, Eye, QrCode, FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';
import { ZatcaInvoice } from '@/components/invoices/ZatcaInvoice';

interface InvoiceSettings {
  template: 'modern' | 'classic' | 'minimal';
  primary_color: string; show_logo: boolean; show_qr: boolean; show_terms: boolean;
  terms_text: string; footer_text: string;
  logo_position: 'right' | 'left' | 'center'; qr_position: 'right' | 'left' | 'center';
  seller_position: 'top' | 'bottom'; buyer_position: 'top' | 'bottom';
  seller_title: string; buyer_title: string;
}

const defaultInvoiceSettings: InvoiceSettings = {
  template: 'modern', primary_color: '#059669', show_logo: true, show_qr: true, show_terms: true,
  terms_text: 'شكراً لتعاملكم معنا',
  footer_text: 'هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية',
  logo_position: 'right', qr_position: 'left', seller_position: 'top', buyer_position: 'bottom',
  seller_title: 'معلومات البائع', buyer_title: 'معلومات المشتري',
};

export function InvoiceSettingsTab() {
  const { company, companyId, refreshCompany } = useCompany();
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
  const [invoiceLogoUrl, setInvoiceLogoUrl] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = [
    { id: 'modern', name: t.inv_template_modern, description: language === 'ar' ? 'تصميم عصري بألوان متدرجة' : 'Modern design with gradients', preview: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
    { id: 'classic', name: t.inv_template_classic, description: language === 'ar' ? 'تصميم تقليدي أنيق' : 'Elegant classic design', preview: 'bg-gradient-to-br from-gray-700 to-gray-900' },
    { id: 'minimal', name: t.inv_template_minimal, description: language === 'ar' ? 'تصميم بسيط ونظيف' : 'Clean minimal design', preview: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
  ];

  const colorOptions = [
    { color: '#059669', name: t.inv_color_green }, { color: '#2563eb', name: t.inv_color_blue },
    { color: '#7c3aed', name: t.inv_color_purple }, { color: '#dc2626', name: t.inv_color_red },
    { color: '#ea580c', name: t.inv_color_orange }, { color: '#0891b2', name: t.inv_color_cyan },
    { color: '#4f46e5', name: t.inv_color_indigo }, { color: '#1f2937', name: t.inv_color_gray },
  ];

  const positionLabels = language === 'ar'
    ? [{ value: 'right', label: 'يمين' }, { value: 'center', label: 'وسط' }, { value: 'left', label: 'يسار' }]
    : [{ value: 'right', label: 'Right' }, { value: 'center', label: 'Center' }, { value: 'left', label: 'Left' }];

  useEffect(() => {
    if (company) {
      const companyData = company as any;
      if (companyData.invoice_settings) setSettings({ ...defaultInvoiceSettings, ...companyData.invoice_settings });
      if (companyData.invoice_logo_url) { setInvoiceLogoUrl(companyData.invoice_logo_url); setLogoPreview(companyData.invoice_logo_url); }
    }
  }, [company]);

  const handleSaveSettings = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('companies').update({ invoice_settings: JSON.parse(JSON.stringify(settings)), invoice_logo_url: invoiceLogoUrl }).eq('id', companyId);
      if (error) throw error;
      await refreshCompany();
      toast.success(t.inv_saved);
    } catch (error) { console.error('Error saving invoice settings:', error); toast.error(t.inv_save_error); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t.settings_image_too_large); return; }
    if (!file.type.startsWith('image/')) { toast.error(t.settings_select_image); return; }
    setUploading(true);
    try {
      const reader = new FileReader(); reader.onloadend = () => { setLogoPreview(reader.result as string); }; reader.readAsDataURL(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `invoice-logo-${companyId}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('app-logos').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('app-logos').getPublicUrl(fileName);
      setInvoiceLogoUrl(data.publicUrl);
      toast.success(t.inv_logo_uploaded);
    } catch (error) { console.error('Error uploading logo:', error); toast.error(t.settings_save_error); }
    finally { setUploading(false); }
  };

  const handleRemoveLogo = () => { setInvoiceLogoUrl(null); setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const useCompanyLogo = () => {
    if (company?.logo_url) { setInvoiceLogoUrl(company.logo_url); setLogoPreview(company.logo_url); toast.success(t.inv_company_logo_used); }
    else { toast.error(t.inv_no_company_logo); }
  };

  const sampleInvoiceData = useMemo(() => ({
    invoiceNumber: '2024-001234', invoiceDate: new Date().toISOString(), invoiceType: 'sale' as const,
    sellerName: company?.name || 'اسم الشركة', sellerTaxNumber: '300123456789003',
    sellerAddress: company?.address || 'الرياض، المملكة العربية السعودية',
    buyerName: 'عميل تجريبي', buyerPhone: '0501234567', buyerAddress: 'جدة، المملكة العربية السعودية', buyerIdNumber: '1234567890',
    items: [{ description: 'سيارة تويوتا كامري 2024', quantity: 1, unitPrice: 85000, taxRate: 15, taxAmount: 12750, total: 97750 }],
    subtotal: 85000, taxAmount: 12750, total: 97750,
    taxSettings: { id: 'preview', company_id: 'preview', tax_name: 'ضريبة القيمة المضافة', tax_rate: 15, is_active: true, apply_to_sales: true, apply_to_purchases: true, tax_number: '300123456789003', company_name_ar: company?.name || 'اسم الشركة', national_address: company?.address || 'الرياض، المملكة العربية السعودية', commercial_register: '1010123456', building_number: null, city: 'الرياض', postal_code: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    companyLogoUrl: logoPreview, invoiceSettings: settings,
  }), [company, logoPreview, settings]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-6">
        {/* Invoice Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />{t.inv_settings_logo}</CardTitle>
            <CardDescription>{t.inv_settings_logo_desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                  {logoPreview ? <img src={logoPreview} alt="" className="w-full h-full object-contain p-2" onError={() => setLogoPreview(null)} /> : <FileText className="w-12 h-12 text-muted-foreground/50" />}
                </div>
                {logoPreview && <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={handleRemoveLogo}><X className="h-3 w-3" /></Button>}
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4 ml-2" />{uploading ? t.settings_uploading : t.inv_upload_new}
                  </Button>
                  <Button variant="secondary" onClick={useCompanyLogo} disabled={!company?.logo_url}>{t.inv_use_company_logo}</Button>
                </div>
                <p className="text-xs text-muted-foreground">{t.settings_max_size}</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />{t.inv_template}</CardTitle>
            <CardDescription>{t.inv_template_desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={settings.template} onValueChange={(value) => setSettings({ ...settings, template: value as InvoiceSettings['template'] })} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Label key={template.id} htmlFor={template.id} className={cn("relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all hover:border-primary/50", settings.template === template.id ? "border-primary bg-primary/5" : "border-muted")}>
                  <RadioGroupItem value={template.id} id={template.id} className="sr-only" />
                  <div className={cn("w-full h-24 rounded-lg", template.preview)}>
                    <div className="h-full flex flex-col items-center justify-center text-white"><FileText className="w-8 h-8 mb-1" /><span className="text-xs opacity-75">{t.inv_preview}</span></div>
                  </div>
                  <div className="text-center"><p className="font-semibold">{template.name}</p><p className="text-xs text-muted-foreground">{template.description}</p></div>
                  {settings.template === template.id && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                </Label>
              ))}
            </RadioGroup>

            <div className="space-y-3">
              <Label>{t.inv_primary_color}</Label>
              <div className="flex flex-wrap gap-3">
                {colorOptions.map((option) => (
                  <button key={option.color} type="button" onClick={() => setSettings({ ...settings, primary_color: option.color })} className={cn("w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center", settings.primary_color === option.color ? "border-foreground scale-110" : "border-transparent hover:scale-105")} style={{ backgroundColor: option.color }} title={option.name}>
                    {settings.primary_color === option.color && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <Input type="color" value={settings.primary_color} onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })} className="w-10 h-10 p-1 rounded-full cursor-pointer" />
                  <span className="text-sm text-muted-foreground">{t.inv_custom_color}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />{t.inv_display_options}</CardTitle>
            <CardDescription>{t.inv_display_desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label>{t.inv_show_logo}</Label><p className="text-xs text-muted-foreground">{t.inv_show_logo_desc}</p></div>
              <Switch checked={settings.show_logo} onCheckedChange={(checked) => setSettings({ ...settings, show_logo: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label className="flex items-center gap-2"><QrCode className="w-4 h-4" />{t.inv_show_qr}</Label><p className="text-xs text-muted-foreground">{t.inv_show_qr_desc}</p></div>
              <Switch checked={settings.show_qr} onCheckedChange={(checked) => setSettings({ ...settings, show_qr: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5"><Label className="flex items-center gap-2"><FileSignature className="w-4 h-4" />{t.inv_show_terms}</Label><p className="text-xs text-muted-foreground">{t.inv_show_terms_desc}</p></div>
              <Switch checked={settings.show_terms} onCheckedChange={(checked) => setSettings({ ...settings, show_terms: checked })} />
            </div>
          </CardContent>
        </Card>

        {/* Layout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />{t.inv_layout}</CardTitle>
            <CardDescription>{t.inv_layout_desc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>{t.inv_logo_position}</Label>
              <div className="flex gap-2">
                {positionLabels.map((pos) => (
                  <Button key={pos.value} type="button" variant={settings.logo_position === pos.value ? 'default' : 'outline'} size="sm" onClick={() => setSettings({ ...settings, logo_position: pos.value as any })}>{pos.label}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'موقع رمز QR' : 'QR Position'}</Label>
              <div className="flex gap-2">
                {positionLabels.map((pos) => (
                  <Button key={pos.value} type="button" variant={settings.qr_position === pos.value ? 'default' : 'outline'} size="sm" onClick={() => setSettings({ ...settings, qr_position: pos.value as any })}>{pos.label}</Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'ترتيب البائع والمشتري' : 'Seller/Buyer Order'}</Label>
              <div className="flex gap-2">
                <Button type="button" variant={settings.seller_position === 'top' ? 'default' : 'outline'} size="sm" onClick={() => setSettings({ ...settings, seller_position: 'top', buyer_position: 'bottom' })}>
                  {language === 'ar' ? 'البائع أولاً' : 'Seller First'}
                </Button>
                <Button type="button" variant={settings.seller_position === 'bottom' ? 'default' : 'outline'} size="sm" onClick={() => setSettings({ ...settings, seller_position: 'bottom', buyer_position: 'top' })}>
                  {language === 'ar' ? 'المشتري أولاً' : 'Buyer First'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'عنوان قسم البائع' : 'Seller Section Title'}</Label>
                <Input value={settings.seller_title} onChange={(e) => setSettings({ ...settings, seller_title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'عنوان قسم المشتري' : 'Buyer Section Title'}</Label>
                <Input value={settings.buyer_title} onChange={(e) => setSettings({ ...settings, buyer_title: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSignature className="w-5 h-5" />{language === 'ar' ? 'نصوص الفاتورة' : 'Invoice Texts'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'تخصيص النصوص التي تظهر في الفاتورة' : 'Customize texts displayed on invoices'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'نص الشكر' : 'Thank You Text'}</Label>
              <Input value={settings.terms_text} onChange={(e) => setSettings({ ...settings, terms_text: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'نص التذييل' : 'Footer Text'}</Label>
              <Textarea value={settings.footer_text} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={saving} className="min-w-[150px]">
            {saving ? t.settings_saving : t.save}
          </Button>
        </div>
      </div>

      {/* Live Invoice Preview */}
      <div className="xl:sticky xl:top-4 h-fit">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />{t.inv_preview}</CardTitle>
            <CardDescription>{language === 'ar' ? 'معاينة مباشرة للتغييرات التي تقوم بها' : 'Live preview of your changes'}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-4 bg-muted/30">
                <div className="transform scale-[0.55] origin-top"><ZatcaInvoice data={sampleInvoiceData} /></div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
