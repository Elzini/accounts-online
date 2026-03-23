import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';

interface Props {
  taxName: string; setTaxName: (v: string) => void;
  taxRate: string; setTaxRate: (v: string) => void;
  taxActive: boolean; setTaxActive: (v: boolean) => void;
  applyToSales: boolean; setApplyToSales: (v: boolean) => void;
  applyToPurchases: boolean; setApplyToPurchases: (v: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function TaxSettingsTab(p: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات الضريبة الافتراضية</CardTitle>
        <CardDescription>نسبة وتفعيل ضريبة القيمة المضافة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>اسم الضريبة</Label>
            <Input value={p.taxName} onChange={(e) => p.setTaxName(e.target.value)} placeholder="ضريبة القيمة المضافة" />
          </div>
          <div className="space-y-2">
            <Label>نسبة الضريبة (%)</Label>
            <Input type="number" value={p.taxRate} onChange={(e) => p.setTaxRate(e.target.value)} placeholder="15" min="0" max="100" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">تفعيل الضريبة</p><p className="text-sm text-muted-foreground">تفعيل احتساب الضريبة تلقائياً</p></div>
            <Switch checked={p.taxActive} onCheckedChange={p.setTaxActive} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">تطبيق على المبيعات</p><p className="text-sm text-muted-foreground">احتساب الضريبة على فواتير البيع</p></div>
            <Switch checked={p.applyToSales} onCheckedChange={p.setApplyToSales} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">تطبيق على المشتريات</p><p className="text-sm text-muted-foreground">احتساب الضريبة على فواتير الشراء</p></div>
            <Switch checked={p.applyToPurchases} onCheckedChange={p.setApplyToPurchases} />
          </div>
        </div>
        <Button onClick={p.onSave} disabled={p.isSaving}>
          {p.isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ إعدادات الضريبة
        </Button>
      </CardContent>
    </Card>
  );
}
