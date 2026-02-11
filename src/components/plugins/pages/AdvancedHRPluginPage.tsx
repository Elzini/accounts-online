import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Users, GraduationCap, Shield, Star, Calendar, Heart, 
  TrendingUp, Award, CheckCircle, Clock, UserCheck 
} from 'lucide-react';

export function AdvancedHRPluginPage() {
  const employees = [
    { name: 'أحمد محمد', department: 'المبيعات', insurance: 'GOSI مسجل', evaluation: 4.5, training: 3 },
    { name: 'سارة أحمد', department: 'المحاسبة', insurance: 'GOSI مسجل', evaluation: 4.8, training: 5 },
    { name: 'خالد عبدالله', department: 'تقنية المعلومات', insurance: 'قيد التسجيل', evaluation: 4.2, training: 2 },
    { name: 'فاطمة حسن', department: 'الموارد البشرية', insurance: 'GOSI مسجل', evaluation: 4.7, training: 4 },
  ];

  const trainings = [
    { name: 'دورة القيادة الإدارية', provider: 'معهد الإدارة', date: '2024-02-15', attendees: 8, status: 'upcoming' },
    { name: 'أمن المعلومات', provider: 'SANS', date: '2024-01-20', attendees: 12, status: 'completed' },
    { name: 'مهارات التواصل', provider: 'داخلي', date: '2024-03-01', attendees: 15, status: 'upcoming' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-4xl">👥</div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">الموارد البشرية المتقدمة</h1>
          <p className="text-muted-foreground">إدارة شاملة تشمل التأمينات والتقييم والتدريب</p>
        </div>
        <Badge variant="outline" className="ms-auto gap-1"><CheckCircle className="w-3 h-3 text-green-500" />v1.5.0</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">45</p><p className="text-xs text-muted-foreground">إجمالي الموظفين</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Shield className="w-8 h-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">38</p><p className="text-xs text-muted-foreground">مسجلين بالتأمينات</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <GraduationCap className="w-8 h-8 mx-auto text-purple-500 mb-2" />
          <p className="text-2xl font-bold">12</p><p className="text-xs text-muted-foreground">دورات تدريبية</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold">4.5</p><p className="text-xs text-muted-foreground">متوسط التقييم</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="insurance">
        <TabsList>
          <TabsTrigger value="insurance" className="gap-2"><Shield className="w-4 h-4" />التأمينات</TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-2"><Star className="w-4 h-4" />التقييم</TabsTrigger>
          <TabsTrigger value="training" className="gap-2"><GraduationCap className="w-4 h-4" />التدريب</TabsTrigger>
        </TabsList>

        <TabsContent value="insurance" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">سجل التأمينات الاجتماعية (GOSI)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموظف</TableHead><TableHead>القسم</TableHead>
                    <TableHead>حالة التأمين</TableHead><TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell>{emp.department}</TableCell>
                      <TableCell>
                        <Badge variant={emp.insurance.includes('مسجل') ? 'default' : 'outline'}>{emp.insurance}</Badge>
                      </TableCell>
                      <TableCell><Button size="sm" variant="ghost"><UserCheck className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">تقييم الأداء</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {employees.map((emp, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.department}</p>
                  </div>
                  <div className="flex items-center gap-2 w-48">
                    <Progress value={emp.evaluation * 20} className="flex-1" />
                    <span className="text-sm font-bold">{emp.evaluation}/5</span>
                  </div>
                  <Award className="w-5 h-5 text-yellow-500" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">الدورات التدريبية</CardTitle>
              <Button size="sm">+ إضافة دورة</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الدورة</TableHead><TableHead>الجهة</TableHead>
                    <TableHead>التاريخ</TableHead><TableHead>المشاركين</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((t, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>{t.provider}</TableCell>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.attendees}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'completed' ? 'default' : 'outline'}>
                          {t.status === 'completed' ? 'مكتملة' : 'قادمة'}
                        </Badge>
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
