import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, FileText, CheckCircle, AlertTriangle, BookOpen, 
  Scale, Shield, Clock, ArrowRight 
} from 'lucide-react';

export function IFRSPluginPage() {
  const standards = [
    { code: 'IFRS 9', name: 'الأدوات المالية', status: 'compliant', progress: 100 },
    { code: 'IFRS 15', name: 'الإيرادات من العقود', status: 'compliant', progress: 100 },
    { code: 'IFRS 16', name: 'عقود الإيجار', status: 'partial', progress: 75 },
    { code: 'IAS 1', name: 'عرض القوائم المالية', status: 'compliant', progress: 100 },
    { code: 'IAS 2', name: 'المخزون', status: 'compliant', progress: 100 },
    { code: 'IAS 16', name: 'الممتلكات والمعدات', status: 'partial', progress: 60 },
    { code: 'IAS 36', name: 'انخفاض قيمة الأصول', status: 'review', progress: 40 },
    { code: 'IAS 37', name: 'المخصصات والالتزامات', status: 'compliant', progress: 100 },
  ];

  const reports = [
    { name: 'قائمة المركز المالي (IFRS)', date: '2024-01-15', status: 'ready' },
    { name: 'قائمة الدخل الشامل', date: '2024-01-15', status: 'ready' },
    { name: 'قائمة التغيرات في حقوق الملكية', date: '2024-01-15', status: 'draft' },
    { name: 'قائمة التدفقات النقدية', date: '2024-01-15', status: 'ready' },
    { name: 'الإيضاحات المتممة', date: '2024-01-10', status: 'draft' },
  ];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      compliant: { label: 'متوافق', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      partial: { label: 'جزئي', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
      review: { label: 'قيد المراجعة', variant: 'outline', icon: <AlertTriangle className="w-3 h-3" /> },
    };
    const info = map[status] || { label: status, variant: 'outline' as const, icon: null };
    return <Badge variant={info.variant} className="gap-1">{info.icon}{info.label}</Badge>;
  };

  const compliantCount = standards.filter(s => s.status === 'compliant').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">🌍</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">معايير IFRS الدولية</h1>
          <p className="text-muted-foreground">الامتثال لمعايير المحاسبة الدولية مع التقارير المطلوبة</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.0.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Scale className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">{compliantCount}/{standards.length}</p><p className="text-xs text-muted-foreground">معايير متوافقة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">5</p><p className="text-xs text-muted-foreground">تقارير IFRS</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Shield className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">82%</p><p className="text-xs text-muted-foreground">نسبة الامتثال</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold">15</p><p className="text-xs text-muted-foreground">إيضاحات</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="standards">
        <TabsList>
          <TabsTrigger value="standards" className="gap-2"><Globe className="w-4 h-4" />المعايير</TabsTrigger>
          <TabsTrigger value="reports" className="gap-2"><FileText className="w-4 h-4" />التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="standards" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">حالة الامتثال بالمعايير</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {standards.map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-20 font-mono font-bold text-sm text-primary">{s.code}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <Progress value={s.progress} className="mt-1 h-2" />
                  </div>
                  <span className="text-xs text-muted-foreground">{s.progress}%</span>
                  {getStatusBadge(s.status)}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">التقارير المالية وفق IFRS</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التقرير</TableHead><TableHead>آخر تحديث</TableHead>
                    <TableHead>الحالة</TableHead><TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'ready' ? 'default' : 'outline'}>
                          {r.status === 'ready' ? 'جاهز' : 'مسودة'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="gap-1">عرض <ArrowRight className="w-3 h-3" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
