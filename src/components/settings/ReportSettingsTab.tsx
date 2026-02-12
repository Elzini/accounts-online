import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useReportSettings, ReportSettings, defaultReportSettings } from '@/hooks/useUnifiedPrintReport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, FileText, Palette, Settings2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function ReportSettingsTab() {
  const { companyId } = useCompany();
  const { t } = useLanguage();
  const { data: currentSettings, isLoading } = useReportSettings();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<ReportSettings>(defaultReportSettings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentSettings) setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = async () => {
    if (!companyId) { toast.error(t.report_login_required); return; }
    setIsSaving(true);
    try {
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({ key: `report_${key}`, value: String(value) }));
      for (const setting of settingsToSave) {
        const { data: existing } = await supabase.from('app_settings').select('id').eq('company_id', companyId).eq('key', setting.key).single();
        if (existing) { await supabase.from('app_settings').update({ value: setting.value }).eq('id', existing.id); }
        else { await supabase.from('app_settings').insert({ company_id: companyId, key: setting.key, value: setting.value }); }
      }
      queryClient.invalidateQueries({ queryKey: ['report-settings', companyId] });
      toast.success(t.report_saved);
    } catch (error) {
      console.error('Error saving report settings:', error);
      toast.error(t.settings_save_error);
    } finally { setIsSaving(false); }
  };

  const handleResetDefaults = () => {
    setSettings(defaultReportSettings);
    toast.info(t.report_reset_done);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />{t.report_header_elements}</CardTitle>
          <CardDescription>{t.report_header_elements_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="show_logo">{t.report_show_logo}</Label>
              <Switch id="show_logo" checked={settings.show_logo} onCheckedChange={(checked) => setSettings({ ...settings, show_logo: checked })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="show_vat_number">{t.report_show_vat}</Label>
              <Switch id="show_vat_number" checked={settings.show_vat_number} onCheckedChange={(checked) => setSettings({ ...settings, show_vat_number: checked })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="show_company_address">{t.report_show_address}</Label>
              <Switch id="show_company_address" checked={settings.show_company_address} onCheckedChange={(checked) => setSettings({ ...settings, show_company_address: checked })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="show_company_phone">{t.report_show_phone}</Label>
              <Switch id="show_company_phone" checked={settings.show_company_phone} onCheckedChange={(checked) => setSettings({ ...settings, show_company_phone: checked })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />{t.report_formatting}</CardTitle>
          <CardDescription>{t.report_formatting_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="header_color">{t.report_header_color}</Label>
              <div className="flex gap-2">
                <Input id="header_color" type="color" value={settings.header_color} onChange={(e) => setSettings({ ...settings, header_color: e.target.value })} className="w-16 h-10 p-1 cursor-pointer" />
                <Input type="text" value={settings.header_color} onChange={(e) => setSettings({ ...settings, header_color: e.target.value })} className="flex-1" placeholder="#3b82f6" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paper_size">{t.report_paper_size}</Label>
              <Select value={settings.paper_size} onValueChange={(value: 'A4' | 'A4-landscape') => setSettings({ ...settings, paper_size: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">{t.report_paper_a4}</SelectItem>
                  <SelectItem value="A4-landscape">{t.report_paper_a4_landscape}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="font_size">{t.report_font_size}</Label>
              <Select value={settings.font_size} onValueChange={(value: 'small' | 'medium' | 'large') => setSettings({ ...settings, font_size: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">{t.report_font_small}</SelectItem>
                  <SelectItem value="medium">{t.report_font_medium}</SelectItem>
                  <SelectItem value="large">{t.report_font_large}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings2 className="w-5 h-5" />{t.report_footer}</CardTitle>
          <CardDescription>{t.report_footer_desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="show_footer">{t.report_show_footer}</Label>
              <Switch id="show_footer" checked={settings.show_footer} onCheckedChange={(checked) => setSettings({ ...settings, show_footer: checked })} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label htmlFor="show_page_numbers">{t.report_show_pages}</Label>
              <Switch id="show_page_numbers" checked={settings.show_page_numbers} onCheckedChange={(checked) => setSettings({ ...settings, show_page_numbers: checked })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer_text">{t.report_footer_text}</Label>
            <Textarea id="footer_text" value={settings.footer_text} onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })} rows={2} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t.report_preview}</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start border-b-2 pb-4" style={{ borderColor: settings.header_color }}>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-800">{t.report_company_name}</div>
                {settings.show_company_address && <div className="text-sm text-gray-500">{t.report_company_address}</div>}
                {settings.show_company_phone && <div className="text-sm text-gray-500">0500000000</div>}
                {settings.show_vat_number && (
                  <div className="flex gap-6 text-xs mt-2 text-gray-600">
                    <span>312876888500003</span>
                  </div>
                )}
              </div>
              {settings.show_logo && (
                <div className="w-20 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">Logo</div>
              )}
            </div>
            <div className="text-center mt-4">
              <h3 className="text-lg font-bold" style={{ color: settings.header_color }}>{t.report_report_title}</h3>
            </div>
            <div className="mt-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-white text-right" style={{ backgroundColor: settings.header_color }}>{t.report_column} 1</th>
                    <th className="p-2 text-white text-right" style={{ backgroundColor: settings.header_color }}>{t.report_column} 2</th>
                    <th className="p-2 text-white text-right" style={{ backgroundColor: settings.header_color }}>{t.report_column} 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="p-2 border border-gray-200">{t.report_data} 1</td>
                    <td className="p-2 border border-gray-200">{t.report_data} 2</td>
                    <td className="p-2 border border-gray-200">{t.report_data} 3</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {settings.show_footer && (
              <div className="mt-4 pt-4 border-t text-xs text-gray-400 flex justify-between">
                <span>{new Date().toLocaleDateString('ar-SA')}</span>
                {settings.show_page_numbers && <span>{t.report_page} 1</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleResetDefaults}>{t.report_reset_default}</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          {t.report_save}
        </Button>
      </div>
    </div>
  );
}
