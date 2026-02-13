import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Users, Target, TrendingUp, Phone, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function CRMPage() {
  const leads = [
    { id: '1', name: 'محمد أحمد', company: 'شركة التقنية', phone: '0512345678', email: 'mohammed@tech.sa', stage: 'new', value: 50000, source: 'موقع إلكتروني', nextAction: '2024-02-01' },
    { id: '2', name: 'فهد العلي', company: 'مؤسسة البناء', phone: '0556789012', email: 'fahad@build.sa', stage: 'qualified', value: 120000, source: 'إحالة', nextAction: '2024-01-25' },
    { id: '3', name: 'سارة الخالد', company: 'شركة الإبداع', phone: '0534567890', email: 'sara@creative.sa', stage: 'proposal', value: 85000, source: 'معرض', nextAction: '2024-01-28' },
    { id: '4', name: 'عبدالله سعد', company: 'مجموعة النخبة', phone: '0598765432', email: 'abdullah@elite.sa', stage: 'negotiation', value: 200000, source: 'اتصال مباشر', nextAction: '2024-01-30' },
    { id: '5', name: 'نورة العمري', company: 'دار الطباعة', phone: '0521234567', email: 'noura@print.sa', stage: 'won', value: 35000, source: 'إحالة', nextAction: '' },
  ];

  const stageLabels: Record<string, string> = { new: 'جديد', qualified: 'مؤهل', proposal: 'عرض سعر', negotiation: 'تفاوض', won: 'مكسوب', lost: 'خسارة' };
  const stageColors: Record<string, string> = { new: 'bg-blue-100 text-blue-800', qualified: 'bg-purple-100 text-purple-800', proposal: 'bg-orange-100 text-orange-800', negotiation: 'bg-yellow-100 text-yellow-800', won: 'bg-green-100 text-green-800', lost: 'bg-red-100 text-red-800' };

  const pipeline = [
    { stage: 'new', count: leads.filter(l => l.stage === 'new').length, value: leads.filter(l => l.stage === 'new').reduce((s, l) => s + l.value, 0) },
    { stage: 'qualified', count: leads.filter(l => l.stage === 'qualified').length, value: leads.filter(l => l.stage === 'qualified').reduce((s, l) => s + l.value, 0) },
    { stage: 'proposal', count: leads.filter(l => l.stage === 'proposal').length, value: leads.filter(l => l.stage === 'proposal').reduce((s, l) => s + l.value, 0) },
    { stage: 'negotiation', count: leads.filter(l => l.stage === 'negotiation').length, value: leads.filter(l => l.stage === 'negotiation').reduce((s, l) => s + l.value, 0) },
    { stage: 'won', count: leads.filter(l => l.stage === 'won').length, value: leads.filter(l => l.stage === 'won').reduce((s, l) => s + l.value, 0) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة علاقات العملاء CRM</h1>
          <p className="text-muted-foreground">تتبع فرص البيع وإدارة العملاء المحتملين</p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('إضافة فرصة بيع جديدة')}><Plus className="w-4 h-4" />فرصة جديدة</Button>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {pipeline.map(p => (
          <Card key={p.stage} className="border-t-4" style={{ borderTopColor: p.stage === 'won' ? 'hsl(var(--primary))' : undefined }}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">{stageLabels[p.stage]}</p>
              <div className="text-xl font-bold">{p.count}</div>
              <p className="text-xs text-muted-foreground">{p.value.toLocaleString()} ر.س</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead>الشركة</TableHead><TableHead>المرحلة</TableHead><TableHead>القيمة</TableHead><TableHead>المصدر</TableHead><TableHead>الإجراء التالي</TableHead></TableRow></TableHeader>
            <TableBody>
              {leads.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell>{l.company}</TableCell>
                  <TableCell><Badge className={stageColors[l.stage]}>{stageLabels[l.stage]}</Badge></TableCell>
                  <TableCell>{l.value.toLocaleString()} ر.س</TableCell>
                  <TableCell>{l.source}</TableCell>
                  <TableCell>{l.nextAction || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
