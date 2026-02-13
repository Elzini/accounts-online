import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Star, Gift, Users, TrendingUp, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function LoyaltyPage() {
  const members = [
    { id: '1', name: 'أحمد محمد', phone: '0512345678', points: 2500, tier: 'gold', totalSpent: 45000, lastVisit: '2024-01-15' },
    { id: '2', name: 'سعيد علي', phone: '0556789012', points: 850, tier: 'silver', totalSpent: 18000, lastVisit: '2024-01-18' },
    { id: '3', name: 'فاطمة أحمد', phone: '0534567890', points: 3200, tier: 'platinum', totalSpent: 72000, lastVisit: '2024-01-20' },
    { id: '4', name: 'خالد سعد', phone: '0598765432', points: 150, tier: 'bronze', totalSpent: 3500, lastVisit: '2024-01-10' },
  ];

  const tierColors: Record<string, string> = { bronze: 'bg-orange-100 text-orange-800', silver: 'bg-gray-200 text-gray-800', gold: 'bg-yellow-100 text-yellow-800', platinum: 'bg-purple-100 text-purple-800' };
  const tierLabels: Record<string, string> = { bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي', platinum: 'بلاتيني' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">برنامج نقاط الولاء</h1>
          <p className="text-muted-foreground">إدارة نقاط ومكافآت العملاء</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Settings className="w-4 h-4" />إعدادات البرنامج</Button>
          <Button className="gap-2"><Plus className="w-4 h-4" />عضو جديد</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><Users className="w-8 h-8 mx-auto mb-2 text-primary" /><div className="text-2xl font-bold">{members.length}</div><p className="text-sm text-muted-foreground">الأعضاء</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" /><div className="text-2xl font-bold">{members.reduce((s, m) => s + m.points, 0).toLocaleString()}</div><p className="text-sm text-muted-foreground">إجمالي النقاط</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Gift className="w-8 h-8 mx-auto mb-2 text-green-600" /><div className="text-2xl font-bold">12</div><p className="text-sm text-muted-foreground">مكافآت مستبدلة</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-600" /><div className="text-2xl font-bold">{members.reduce((s, m) => s + m.totalSpent, 0).toLocaleString()} ر.س</div><p className="text-sm text-muted-foreground">إجمالي المشتريات</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>العضو</TableHead><TableHead>الهاتف</TableHead><TableHead>المستوى</TableHead><TableHead>النقاط</TableHead><TableHead>إجمالي المشتريات</TableHead><TableHead>آخر زيارة</TableHead></TableRow></TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell dir="ltr">{m.phone}</TableCell>
                  <TableCell><Badge className={tierColors[m.tier]}>{tierLabels[m.tier]}</Badge></TableCell>
                  <TableCell className="font-bold">{m.points.toLocaleString()}</TableCell>
                  <TableCell>{m.totalSpent.toLocaleString()} ر.س</TableCell>
                  <TableCell>{m.lastVisit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
