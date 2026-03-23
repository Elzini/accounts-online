import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { InvoiceSettings } from './useDefaultCompanySettings';

const templates = [
  { value: 'modern', label: 'حديث', description: 'تصميم عصري بألوان متدرجة' },
  { value: 'classic', label: 'كلاسيكي', description: 'تصميم تقليدي ورسمي' },
  { value: 'minimal', label: 'بسيط', description: 'تصميم نظيف ومبسط' },
];

const colorOptions = [
  { value: '#10b981', label: 'أخضر' },
  { value: '#3b82f6', label: 'أزرق' },
  { value: '#8b5cf6', label: 'بنفسجي' },
  { value: '#f59e0b', label: 'برتقالي' },
  { value: '#ef4444', label: 'أحمر' },
  { value: '#6366f1', label: 'نيلي' },
];

interface Props {
  invoiceSettings: InvoiceSettings;
  setInvoiceSettings: React.Dispatch<React.SetStateAction<InvoiceSettings>>;
  isSaving: boolean;
  onSave: () => void;
}

export function InvoiceSettingsTab({ invoiceSettings: s, setInvoiceSettings: set, isSaving, onSave }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات الفاتورة الافتراضية</CardTitle>
        <CardDescription>تصميم ومحتوى الفاتورة للشركات الجديدة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-3">
          <Label>قالب الفاتورة</Label>
          <div className="grid grid-cols-3 gap-3">
            {templates.map((t) => (
              <div key={t.value} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${s.template === t.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`} onClick={() => set(prev => ({ ...prev, template: t.value as any }))}>
                <p className="font-medium text-center">{t.label}</p>
                <p className="text-xs text-muted-foreground text-center mt-1">{t.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-3">
          <Label>اللون الرئيسي</Label>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((c) => (
              <button key={c.value} type="button" className={`w-10 h-10 rounded-full border-2 transition-all ${s.primary_color === c.value ? 'ring-2 ring-offset-2 ring-primary' : ''}`} style={{ backgroundColor: c.value }} onClick={() => set(prev => ({ ...prev, primary_color: c.value }))} title={c.label} />
            ))}
            <div className="flex items-center gap-2">
              <Input type="color" value={s.primary_color} onChange={(e) => set(prev => ({ ...prev, primary_color: e.target.value }))} className="w-10 h-10 p-1 cursor-pointer" />
              <span className="text-sm text-muted-foreground">مخصص</span>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <Label>خيارات العرض</Label>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">عرض الشعار</p><p className="text-sm text-muted-foreground">إظهار شعار الشركة في الفاتورة</p></div>
            <Switch checked={s.show_logo} onCheckedChange={(v) => set(prev => ({ ...prev, show_logo: v }))} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">عرض رمز QR</p><p className="text-sm text-muted-foreground">إظهار رمز الاستجابة السريعة للتحقق</p></div>
            <Switch checked={s.show_qr} onCheckedChange={(v) => set(prev => ({ ...prev, show_qr: v }))} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">عرض الشروط والأحكام</p><p className="text-sm text-muted-foreground">إظهار نص الشروط في أسفل الفاتورة</p></div>
            <Switch checked={s.show_terms} onCheckedChange={(v) => set(prev => ({ ...prev, show_terms: v }))} />
          </div>
        </div>

        {/* Layout Settings */}
        <div className="space-y-4">
          <Label>تخطيط الفاتورة</Label>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">موقع الشعار</p>
            <div className="flex gap-2">
              {[{ value: 'right', label: 'يمين' }, { value: 'center', label: 'وسط' }, { value: 'left', label: 'يسار' }].map((pos) => (
                <Button key={pos.value} type="button" variant={s.logo_position === pos.value ? 'default' : 'outline'} size="sm" onClick={() => set(prev => ({ ...prev, logo_position: pos.value as any }))}>{pos.label}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">موقع رمز QR</p>
            <div className="flex gap-2">
              {[{ value: 'right', label: 'يمين' }, { value: 'center', label: 'وسط' }, { value: 'left', label: 'يسار' }].map((pos) => (
                <Button key={pos.value} type="button" variant={s.qr_position === pos.value ? 'default' : 'outline'} size="sm" onClick={() => set(prev => ({ ...prev, qr_position: pos.value as any }))}>{pos.label}</Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">ترتيب البائع والمشتري</p>
            <div className="flex gap-2">
              <Button type="button" variant={s.seller_position === 'top' ? 'default' : 'outline'} size="sm" onClick={() => set(prev => ({ ...prev, seller_position: 'top', buyer_position: 'bottom' }))}>البائع أولاً</Button>
              <Button type="button" variant={s.seller_position === 'bottom' ? 'default' : 'outline'} size="sm" onClick={() => set(prev => ({ ...prev, seller_position: 'bottom', buyer_position: 'top' }))}>المشتري أولاً</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><p className="text-sm text-muted-foreground">عنوان قسم البائع</p><Input value={s.seller_title} onChange={(e) => set(prev => ({ ...prev, seller_title: e.target.value }))} placeholder="معلومات البائع" /></div>
            <div className="space-y-2"><p className="text-sm text-muted-foreground">عنوان قسم المشتري</p><Input value={s.buyer_title} onChange={(e) => set(prev => ({ ...prev, buyer_title: e.target.value }))} placeholder="معلومات المشتري" /></div>
          </div>
        </div>

        {/* Text Fields */}
        <div className="space-y-4">
          <div className="space-y-2"><Label>نص الشروط والأحكام</Label><Input value={s.terms_text} onChange={(e) => set(prev => ({ ...prev, terms_text: e.target.value }))} placeholder="الأسعار شاملة ضريبة القيمة المضافة 15%" /></div>
          <div className="space-y-2"><Label>نص التذييل</Label><Input value={s.footer_text} onChange={(e) => set(prev => ({ ...prev, footer_text: e.target.value }))} placeholder="شكراً لتعاملكم معنا" /></div>
        </div>

        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ إعدادات الفاتورة
        </Button>
      </CardContent>
    </Card>
  );
}
