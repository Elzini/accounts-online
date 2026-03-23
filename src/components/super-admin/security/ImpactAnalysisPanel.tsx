import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, AlertTriangle } from 'lucide-react';
import { useFinancialProtectionStats } from '@/hooks/modules/useSuperAdminServices';

export function ImpactAnalysisPanel() {
  const { data: stats } = useFinancialProtectionStats();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-amber-500" />
          تحليل الأثر - البيانات المحمية
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="text-3xl font-bold text-primary">{stats?.protectedInvoices || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">فاتورة محمية</p>
            <p className="text-xs text-muted-foreground">لا يمكن تعديلها أو حذفها</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="text-3xl font-bold text-primary">{stats?.protectedEntries || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">قيد مرحّل محمي</p>
            <p className="text-xs text-muted-foreground">يمكن عكسه فقط</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg border">
            <div className="text-3xl font-bold text-primary">{stats?.totalItems || 0}</div>
            <p className="text-sm text-muted-foreground mt-1">بند فاتورة</p>
            <p className="text-xs text-muted-foreground">محمية تبعاً للفاتورة</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">سياسة التصحيح</p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                <li>• الفواتير المعتمدة: استخدم إشعار دائن (Credit Note) للتصحيح</li>
                <li>• القيود المرحّلة: استخدم قيد عكسي (Reversal Entry) للتصحيح</li>
                <li>• لا يمكن حذف أي سجل مالي معتمد بأي طريقة</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
