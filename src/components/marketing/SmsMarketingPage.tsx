import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Plus, Send, Users, BarChart3, Clock } from 'lucide-react';

export function SmsMarketingPage() {
  const campaigns = [
    { id: 1, name: 'عروض نهاية الأسبوع', recipients: 1500, sent: 1480, delivered: 1420, clicked: 320, date: '2024-01-15', status: 'sent' },
    { id: 2, name: 'تذكير بموعد الصيانة', recipients: 200, sent: 200, delivered: 195, clicked: 85, date: '2024-01-18', status: 'sent' },
    { id: 3, name: 'إطلاق منتج جديد', recipients: 3000, sent: 0, delivered: 0, clicked: 0, date: '2024-01-25', status: 'scheduled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التسويق عبر SMS</h1>
            <p className="text-sm text-muted-foreground">رسائل نصية ترويجية وتنبيهات</p>
          </div>
        </div>
        <Button className="gap-1"><Plus className="w-4 h-4" />حملة جديدة</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Send className="w-8 h-8 mx-auto text-blue-500 mb-1" /><p className="text-2xl font-bold">1,680</p><p className="text-xs text-muted-foreground">رسائل مرسلة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto text-green-500 mb-1" /><p className="text-2xl font-bold">1,615</p><p className="text-xs text-muted-foreground">تم التوصيل</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><BarChart3 className="w-8 h-8 mx-auto text-purple-500 mb-1" /><p className="text-2xl font-bold">24%</p><p className="text-xs text-muted-foreground">نسبة التفاعل</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" /><p className="text-2xl font-bold">1</p><p className="text-xs text-muted-foreground">مجدولة</p></CardContent></Card>
      </div>

      <Card><CardContent className="pt-4">
        <Table>
          <TableHeader><TableRow>
            <TableHead>الحملة</TableHead><TableHead>المستلمين</TableHead><TableHead>المرسلة</TableHead>
            <TableHead>التوصيل</TableHead><TableHead>التفاعل</TableHead><TableHead>التاريخ</TableHead><TableHead>الحالة</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {campaigns.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.recipients.toLocaleString()}</TableCell>
                <TableCell>{c.sent.toLocaleString()}</TableCell>
                <TableCell>{c.delivered.toLocaleString()}</TableCell>
                <TableCell>{c.clicked > 0 ? `${((c.clicked / c.delivered) * 100).toFixed(0)}%` : '-'}</TableCell>
                <TableCell>{c.date}</TableCell>
                <TableCell><Badge variant={c.status === 'sent' ? 'default' : 'secondary'}>{c.status === 'sent' ? 'مرسلة' : 'مجدولة'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
