import { FileCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function CustomsClearancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="w-6 h-6" />
          التخليص الجمركي
        </h1>
        <p className="text-muted-foreground mt-1">إدارة عمليات التخليص الجمركي والرسوم</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">شحنات بالجمارك</CardTitle>
            <CardDescription>الشحنات المنتظرة للتخليص</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">إجمالي الرسوم الجمركية</CardTitle>
            <CardDescription>الرسوم المدفوعة هذا الشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0 ر.س</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">شحنات تم تخليصها</CardTitle>
            <CardDescription>هذا الشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
