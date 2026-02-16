import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, Briefcase, Plus, UserCheck, Clock, FileText, MapPin, Star, Mail, Phone, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const stageColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800', screening: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-purple-100 text-purple-800', offer: 'bg-green-100 text-green-800',
  hired: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800',
};

export function RecruitmentPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

  const jobs = [
    { id: 1, title: 'مطور واجهات أمامية', department: 'تقنية المعلومات', location: 'الرياض', type: 'دوام كامل', applications: 12, status: 'open', posted: '2024-01-05' },
    { id: 2, title: 'محاسب أول', department: 'المالية', location: 'جدة', type: 'دوام كامل', applications: 8, status: 'open', posted: '2024-01-10' },
    { id: 3, title: 'مدير مبيعات', department: 'المبيعات', location: 'الرياض', type: 'دوام كامل', applications: 15, status: 'open', posted: '2024-01-02' },
    { id: 4, title: 'مصمم جرافيك', department: 'التسويق', location: 'عن بعد', type: 'دوام جزئي', applications: 20, status: 'closed', posted: '2023-12-15' },
  ];

  const candidates = [
    { id: 1, name: 'سارة أحمد', email: 'sara@email.com', phone: '0501234567', job: 'مطور واجهات أمامية', stage: 'interview', rating: 4, appliedDate: '2024-01-08' },
    { id: 2, name: 'محمد خالد', email: 'mk@email.com', phone: '0559876543', job: 'محاسب أول', stage: 'screening', rating: 3, appliedDate: '2024-01-12' },
    { id: 3, name: 'فاطمة علي', email: 'fatima@email.com', phone: '0541112233', job: 'مدير مبيعات', stage: 'offer', rating: 5, appliedDate: '2024-01-04' },
    { id: 4, name: 'عمر سعد', email: 'omar@email.com', phone: '0567778899', job: 'مطور واجهات أمامية', stage: 'new', rating: 0, appliedDate: '2024-01-15' },
    { id: 5, name: 'نورة محمد', email: 'noura@email.com', phone: '0533344556', job: 'مصمم جرافيك', stage: 'hired', rating: 5, appliedDate: '2023-12-20' },
  ];

  const stageLabels: Record<string, string> = { new: 'جديد', screening: 'فرز', interview: 'مقابلة', offer: 'عرض وظيفي', hired: 'تم التوظيف', rejected: 'مرفوض' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">التوظيف</h1>
            <p className="text-sm text-muted-foreground">إدارة الوظائف الشاغرة وتتبع المرشحين</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Briefcase className="w-8 h-8 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'open').length}</p><p className="text-xs text-muted-foreground">وظائف مفتوحة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <FileText className="w-8 h-8 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{candidates.length}</p><p className="text-xs text-muted-foreground">إجمالي المرشحين</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Clock className="w-8 h-8 mx-auto text-orange-500 mb-1" />
          <p className="text-2xl font-bold">{candidates.filter(c => c.stage === 'interview').length}</p><p className="text-xs text-muted-foreground">مقابلات مجدولة</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserCheck className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{candidates.filter(c => c.stage === 'hired').length}</p><p className="text-xs text-muted-foreground">تم توظيفهم</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">خط التوظيف</TabsTrigger>
          <TabsTrigger value="jobs">الوظائف</TabsTrigger>
          <TabsTrigger value="candidates">المرشحون</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['new', 'screening', 'interview', 'offer', 'hired'].map(stage => (
              <Card key={stage}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">
                  {stageLabels[stage]}
                  <Badge variant="secondary">{candidates.filter(c => c.stage === stage).length}</Badge>
                </CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {candidates.filter(c => c.stage === stage).map(c => (
                    <Card key={c.id} className="p-2 cursor-pointer hover:shadow-md transition-shadow">
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.job}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= c.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button className="gap-1" onClick={() => setShowAddJob(true)}><Plus className="w-4 h-4" />إضافة وظيفة</Button>
          </div>
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>المسمى الوظيفي</TableHead><TableHead>القسم</TableHead><TableHead>الموقع</TableHead>
                <TableHead>النوع</TableHead><TableHead>المتقدمين</TableHead><TableHead>تاريخ النشر</TableHead><TableHead>الحالة</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {jobs.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell>{j.department}</TableCell>
                    <TableCell className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</TableCell>
                    <TableCell>{j.type}</TableCell>
                    <TableCell><Badge>{j.applications}</Badge></TableCell>
                    <TableCell>{j.posted}</TableCell>
                    <TableCell><Badge variant={j.status === 'open' ? 'default' : 'secondary'}>{j.status === 'open' ? 'مفتوحة' : 'مغلقة'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="candidates" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button className="gap-1" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" />إضافة مرشح</Button>
          </div>
          <Card><CardContent className="pt-4">
            <Table>
              <TableHeader><TableRow>
                <TableHead>الاسم</TableHead><TableHead>البريد</TableHead><TableHead>الهاتف</TableHead>
                <TableHead>الوظيفة</TableHead><TableHead>المرحلة</TableHead><TableHead>التقييم</TableHead><TableHead>تاريخ التقديم</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {candidates.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell dir="ltr">{c.phone}</TableCell>
                    <TableCell>{c.job}</TableCell>
                    <TableCell><Badge className={stageColors[c.stage]}>{stageLabels[c.stage]}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= c.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />)}</div>
                    </TableCell>
                    <TableCell>{c.appliedDate}</TableCell>
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
