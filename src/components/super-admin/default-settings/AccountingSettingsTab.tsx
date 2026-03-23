import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';

interface Props {
  autoJournalEnabled: boolean; setAutoJournalEnabled: (v: boolean) => void;
  autoSalesEntries: boolean; setAutoSalesEntries: (v: boolean) => void;
  autoPurchaseEntries: boolean; setAutoPurchaseEntries: (v: boolean) => void;
  autoExpenseEntries: boolean; setAutoExpenseEntries: (v: boolean) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function AccountingSettingsTab(p: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إعدادات القيود المحاسبية الافتراضية</CardTitle>
        <CardDescription>تفعيل إنشاء القيود تلقائياً</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">تفعيل القيود التلقائية</p><p className="text-sm text-muted-foreground">إنشاء قيود محاسبية تلقائياً عند العمليات</p></div>
            <Switch checked={p.autoJournalEnabled} onCheckedChange={p.setAutoJournalEnabled} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">قيود المبيعات</p><p className="text-sm text-muted-foreground">إنشاء قيد تلقائي عند كل عملية بيع</p></div>
            <Switch checked={p.autoSalesEntries} onCheckedChange={p.setAutoSalesEntries} disabled={!p.autoJournalEnabled} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">قيود المشتريات</p><p className="text-sm text-muted-foreground">إنشاء قيد تلقائي عند كل عملية شراء</p></div>
            <Switch checked={p.autoPurchaseEntries} onCheckedChange={p.setAutoPurchaseEntries} disabled={!p.autoJournalEnabled} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div><p className="font-medium">قيود المصروفات</p><p className="text-sm text-muted-foreground">إنشاء قيد تلقائي عند كل مصروف</p></div>
            <Switch checked={p.autoExpenseEntries} onCheckedChange={p.setAutoExpenseEntries} disabled={!p.autoJournalEnabled} />
          </div>
        </div>
        <Button onClick={p.onSave} disabled={p.isSaving}>
          {p.isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ إعدادات القيود
        </Button>
      </CardContent>
    </Card>
  );
}
