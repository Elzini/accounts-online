import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PenTool, Plus, FileText, CheckCircle, Clock, Send, Users } from 'lucide-react';

export function ESignaturePage() {
  const documents = [
    { id: 1, title: 'عقد توظيف - أحمد محمد', type: 'عقد عمل', sentTo: 'أحمد محمد', sentDate: '2024-01-18', signedDate: '2024-01-18', status: 'signed' },
    { id: 2, title: 'اتفاقية سرية المعلومات', type: 'اتفاقية', sentTo: 'سارة علي', sentDate: '2024-01-17', signedDate: null, status: 'pending' },
    { id: 3, title: 'أمر شراء #PO-2024-045', type: 'أمر شراء', sentTo: 'مورد الحمراني', sentDate: '2024-01-16', signedDate: '2024-01-17', status: 'signed' },
    { id: 4, title: 'عقد إيجار مركبة', type: 'عقد إيجار', sentTo: 'خالد فهد', sentDate: '2024-01-15', signedDate: null, status: 'expired' },
  ];

  const templates = [
    { id: 1, name: 'عقد عمل قياسي', fields: 8, usedCount: 45 },
    { id: 2, name: 'اتفاقية سرية (NDA)', fields: 5, usedCount: 22 },
    { id: 3, name: 'أمر شراء', fields: 12, usedCount: 120 },
    { id: 4, name: 'عقد إيجار', fields: 10, usedCount: 15 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <PenTool className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التوقيع الإلكتروني</h1>
            <p className="text-sm text-muted-foreground">توقيع العقود والمستندات إلكترونياً</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />إرسال للتوقيع</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">{documents.length}</p><p className="text-xs text-muted-foreground">مستندات مرسلة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">{documents.filter(d => d.status === 'signed').length}</p><p className="text-xs text-muted-foreground">موقّعة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">{documents.filter(d => d.status === 'pending').length}</p><p className="text-xs text-muted-foreground">بانتظار التوقيع</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><FileText className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">{templates.length}</p><p className="text-xs text-muted-foreground">قوالب</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <h3 className="font-bold mb-3">المستندات</h3>
        <Table>
          <TableHeader><TableRow>
            <TableHead>العنوان</TableHead><TableHead>النوع</TableHead><TableHead>المرسل إليه</TableHead>
            <TableHead>تاريخ الإرسال</TableHead><TableHead>تاريخ التوقيع</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {documents.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell><Badge variant="outline">{d.type}</Badge></TableCell>
                <TableCell>{d.sentTo}</TableCell>
                <TableCell>{d.sentDate}</TableCell>
                <TableCell>{d.signedDate || '-'}</TableCell>
                <TableCell><Badge variant={d.status === 'signed' ? 'default' : d.status === 'pending' ? 'secondary' : 'destructive'}>
                  {d.status === 'signed' ? 'موقّع ✓' : d.status === 'pending' ? 'بانتظار' : 'منتهي'}
                </Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <Card><CardContent className="pt-4">
        <h3 className="font-bold mb-3">القوالب</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {templates.map(t => (
            <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-4 text-center">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.fields} حقول • استخدم {t.usedCount} مرة</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
