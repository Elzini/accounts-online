import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield, Lock, FileText, Database, Activity, Key, CheckCircle2
} from 'lucide-react';

export function ProtectionStatusPanel() {
  const protections = [
    { name: 'حماية الفواتير المعتمدة', desc: 'منع تعديل/حذف الفواتير بعد الاعتماد', active: true, icon: FileText },
    { name: 'حماية القيود المرحّلة', desc: 'منع تعديل/حذف القيود بعد الترحيل', active: true, icon: Lock },
    { name: 'حماية بنود الفواتير', desc: 'منع تعديل بنود الفواتير المعتمدة', active: true, icon: Shield },
    { name: 'حماية سطور القيود', desc: 'منع تعديل سطور القيود المرحّلة', active: true, icon: Database },
    { name: 'سجل التغييرات غير قابل للتعديل', desc: 'سجل التدقيق محمي من التلاعب', active: true, icon: Activity },
    { name: 'عزل بيانات الشركات (RLS)', desc: '328+ سياسة أمان مُطبّقة', active: true, icon: Key },
    { name: 'حماية سجل الحوادث الأمنية', desc: 'سجل لا يمكن تعديله أو حذفه', active: true, icon: Shield },
    { name: 'سلسلة التدقيق المشفرة', desc: 'ربط كل قيد بالقيد السابق تشفيرياً', active: true, icon: Lock },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          حالة الحماية الشاملة
          <Badge className="bg-green-500/10 text-green-600">{protections.filter(p => p.active).length}/{protections.length} مُفعّل</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {protections.map((p) => (
            <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-3">
                <p.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 ml-1" />
                مُفعّل
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
