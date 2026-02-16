import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Layers, Plus, GitBranch, FileText, CheckCircle, Clock } from 'lucide-react';

export function PLMPage() {
  const products = [
    { id: 1, name: 'فلتر هواء PRO-X', version: 'v3.2', stage: 'production', bom: 'BOM-045', changes: 12, lastUpdate: '2024-01-15' },
    { id: 2, name: 'زيت محرك ULTRA', version: 'v2.0', stage: 'testing', bom: 'BOM-032', changes: 5, lastUpdate: '2024-01-18' },
    { id: 3, name: 'بطارية PowerMax', version: 'v1.5', stage: 'design', bom: 'BOM-058', changes: 3, lastUpdate: '2024-01-17' },
  ];

  const ecos = [
    { id: 'ECO-001', title: 'تحسين مواد الفلتر', product: 'فلتر هواء PRO-X', type: 'تحسين', requestedBy: 'فريق الجودة', date: '2024-01-10', status: 'approved' },
    { id: 'ECO-002', title: 'تغيير مورد المادة الخام', product: 'زيت محرك ULTRA', type: 'تغيير مورد', requestedBy: 'فريق المشتريات', date: '2024-01-15', status: 'in_review' },
    { id: 'ECO-003', title: 'تصميم جديد للعلبة', product: 'بطارية PowerMax', type: 'تصميم', requestedBy: 'التسويق', date: '2024-01-18', status: 'draft' },
  ];

  const stageColors: Record<string, string> = { design: 'bg-blue-100 text-blue-800', testing: 'bg-yellow-100 text-yellow-800', production: 'bg-green-100 text-green-800' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">PLM - إدارة دورة المنتج</h1>
            <p className="text-sm text-muted-foreground">إدارة الإصدارات وأوامر التغيير الهندسية</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />منتج جديد</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Layers className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">منتجات</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><GitBranch className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{ecos.length}</p><p className="text-xs text-muted-foreground">أوامر تغيير</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{products.filter(p => p.stage === 'production').length}</p><p className="text-xs text-muted-foreground">في الإنتاج</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{ecos.filter(e => e.status === 'in_review').length}</p><p className="text-xs text-muted-foreground">قيد المراجعة</p></CardContent></Card>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="ecos">أوامر التغيير (ECO)</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المنتج</TableHead><TableHead>الإصدار</TableHead><TableHead>المرحلة</TableHead>
                <TableHead>BOM</TableHead><TableHead>التغييرات</TableHead><TableHead>آخر تحديث</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono">{p.version}</TableCell>
                    <TableCell><Badge className={stageColors[p.stage]}>{p.stage === 'design' ? 'تصميم' : p.stage === 'testing' ? 'اختبار' : 'إنتاج'}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{p.bom}</TableCell>
                    <TableCell>{p.changes}</TableCell>
                    <TableCell>{p.lastUpdate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="ecos" className="mt-4">
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الرقم</TableHead><TableHead>العنوان</TableHead><TableHead>المنتج</TableHead>
                <TableHead>النوع</TableHead><TableHead>الطالب</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {ecos.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono">{e.id}</TableCell>
                    <TableCell className="font-medium">{e.title}</TableCell>
                    <TableCell>{e.product}</TableCell>
                    <TableCell><Badge variant="outline">{e.type}</Badge></TableCell>
                    <TableCell>{e.requestedBy}</TableCell>
                    <TableCell>{e.date}</TableCell>
                    <TableCell><Badge variant={e.status === 'approved' ? 'default' : e.status === 'in_review' ? 'secondary' : 'outline'}>
                      {e.status === 'approved' ? 'معتمد' : e.status === 'in_review' ? 'قيد المراجعة' : 'مسودة'}
                    </Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
