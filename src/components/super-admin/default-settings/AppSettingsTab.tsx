import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';

interface Props {
  appName: string; setAppName: (v: string) => void;
  appSubtitle: string; setAppSubtitle: (v: string) => void;
  welcomeMessage: string; setWelcomeMessage: (v: string) => void;
  dashboardTitle: string; setDashboardTitle: (v: string) => void;
  purchasesTitle: string; setPurchasesTitle: (v: string) => void;
  salesTitle: string; setSalesTitle: (v: string) => void;
  customersTitle: string; setCustomersTitle: (v: string) => void;
  suppliersTitle: string; setSuppliersTitle: (v: string) => void;
  reportsTitle: string; setReportsTitle: (v: string) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function AppSettingsTab(p: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات التطبيق الافتراضية</CardTitle>
        <CardDescription>تسميات الأقسام ورسالة الترحيب</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>اسم التطبيق</Label>
            <Input value={p.appName} onChange={(e) => p.setAppName(e.target.value)} placeholder="Elzini SaaS" />
          </div>
          <div className="space-y-2">
            <Label>العنوان الفرعي</Label>
            <Input value={p.appSubtitle} onChange={(e) => p.setAppSubtitle(e.target.value)} placeholder="لتجارة السيارات" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>رسالة الترحيب</Label>
          <Input value={p.welcomeMessage} onChange={(e) => p.setWelcomeMessage(e.target.value)} placeholder="مرحباً بك..." />
        </div>
        <div className="border-t pt-4">
          <h4 className="font-medium mb-4">تسميات الأقسام</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>لوحة التحكم</Label><Input value={p.dashboardTitle} onChange={(e) => p.setDashboardTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>المشتريات</Label><Input value={p.purchasesTitle} onChange={(e) => p.setPurchasesTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>المبيعات</Label><Input value={p.salesTitle} onChange={(e) => p.setSalesTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>العملاء</Label><Input value={p.customersTitle} onChange={(e) => p.setCustomersTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>الموردين</Label><Input value={p.suppliersTitle} onChange={(e) => p.setSuppliersTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>التقارير</Label><Input value={p.reportsTitle} onChange={(e) => p.setReportsTitle(e.target.value)} /></div>
          </div>
        </div>
        <Button onClick={p.onSave} disabled={p.isSaving}>
          {p.isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ إعدادات التطبيق
        </Button>
      </CardContent>
    </Card>
  );
}
