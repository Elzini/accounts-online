import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Shield, Database, Globe, Lock, Key, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

export function SystemControlCenter() {
  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['system-audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  // Fetch backup info
  const { data: backups = [] } = useQuery({
    queryKey: ['system-backups'],
    queryFn: async () => {
      const { data } = await supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" /> مركز التحكم في النظام</h2>
        <p className="text-muted-foreground">إعدادات عامة، أمان، نسخ احتياطي</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" className="gap-2"><Globe className="w-4 h-4" /> إعدادات عامة</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> الأمان</TabsTrigger>
          <TabsTrigger value="backups" className="gap-2"><Database className="w-4 h-4" /> النسخ الاحتياطي</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">العملات المدعومة</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['SAR', 'USD', 'EUR', 'AED', 'KWD', 'BHD', 'QAR', 'OMR', 'EGP', 'JOD', 'IQD'].map(c => (
                    <Badge key={c} variant="secondary">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">الدول المتاحة</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['السعودية', 'الإمارات', 'الكويت', 'البحرين', 'قطر', 'عمان', 'مصر', 'الأردن', 'العراق'].map(c => (
                    <Badge key={c} variant="outline">{c}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">الضرائب الافتراضية</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>ضريبة القيمة المضافة (السعودية)</span><span className="font-bold">15%</span></div>
                  <div className="flex justify-between"><span>ضريبة القيمة المضافة (الإمارات)</span><span className="font-bold">5%</span></div>
                  <div className="flex justify-between"><span>ضريبة القيمة المضافة (البحرين)</span><span className="font-bold">10%</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">إعدادات التجربة المجانية</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>فترة التجربة الافتراضية</span><span className="font-bold">14 يوم</span></div>
                  <div className="flex justify-between"><span>تفعيل تلقائي</span><Badge>مفعل</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" /> المصادقة الثنائية</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>حالة 2FA</span><Badge>متاح</Badge></div>
                  <div className="flex justify-between"><span>إلزامي للمدراء</span><Badge variant="secondary">اختياري</Badge></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="w-4 h-4" /> مفاتيح API</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>الحد الافتراضي</span><span className="font-bold">1000 طلب/ساعة</span></div>
                  <div className="flex justify-between"><span>تشفير</span><Badge>AES-256-GCM</Badge></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Login Logs */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> سجل الأنشطة الأخيرة</CardTitle></CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النوع</TableHead>
                      <TableHead>الإجراء</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.slice(0, 20).map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell><Badge variant="outline">{log.entity_type}</Badge></TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ip_address || '-'}</TableCell>
                        <TableCell className="text-xs">{new Date(log.created_at).toLocaleString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">لا توجد سجلات</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">سجل النسخ الاحتياطية</CardTitle></CardHeader>
            <CardContent>
              {backups.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الحجم</TableHead>
                      <TableHead>التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backups.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell><Badge variant="outline">{b.backup_type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'completed' ? 'default' : 'secondary'}>
                            {b.status === 'completed' ? 'مكتمل' : b.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{b.file_size ? `${(b.file_size / 1024 / 1024).toFixed(1)} MB` : '-'}</TableCell>
                        <TableCell className="text-xs">{new Date(b.created_at).toLocaleString('ar-SA')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">لا توجد نسخ احتياطية مسجلة</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
