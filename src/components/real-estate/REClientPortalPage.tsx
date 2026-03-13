import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Wrench, Eye, Copy, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useREUnits, useREInstallments, useREProjects } from '@/hooks/useRealEstate';
import { useREMaintenanceRequests } from '@/hooks/useRealEstateCRM';
import { toast } from 'sonner';

export function REClientPortalPage() {
  const { data: units } = useREUnits();
  const { data: projects } = useREProjects();
  const { data: installments } = useREInstallments();
  const { data: maintenanceRequests } = useREMaintenanceRequests();

  const soldUnits = (units || []).filter((u: any) => u.status === 'sold');
  const fmt = (n: number) => new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(n);

  // Generate a mock portal link for a unit
  const generatePortalLink = (unitId: string) => {
    const token = btoa(`${unitId}-${Date.now()}`).slice(0, 20);
    const link = `${window.location.origin}/portal?token=${token}&type=re-unit`;
    navigator.clipboard.writeText(link);
    toast.success('تم نسخ رابط البوابة');
  };

  // Aggregate installment stats
  const totalDue = (installments || []).reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const totalPaid = (installments || []).filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
  const overdueInstallments = (installments || []).filter((i: any) => i.status === 'pending' && new Date(i.due_date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">بوابة العملاء والمستثمرين</h2>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><Building2 className="w-6 h-6 mx-auto mb-1 text-primary" /><div className="text-2xl font-bold">{soldUnits.length}</div><div className="text-xs text-muted-foreground">وحدات مباعة</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><CreditCard className="w-6 h-6 mx-auto mb-1 text-green-500" /><div className="text-2xl font-bold">{fmt(totalPaid)}</div><div className="text-xs text-muted-foreground">إجمالي المحصل</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Clock className="w-6 h-6 mx-auto mb-1 text-orange-500" /><div className="text-2xl font-bold">{fmt(totalDue - totalPaid)}</div><div className="text-xs text-muted-foreground">المتبقي</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><Wrench className="w-6 h-6 mx-auto mb-1 text-red-500" /><div className="text-2xl font-bold">{overdueInstallments.length}</div><div className="text-xs text-muted-foreground">أقساط متأخرة</div></CardContent></Card>
      </div>

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units">الوحدات المباعة</TabsTrigger>
          <TabsTrigger value="installments">الأقساط</TabsTrigger>
          <TabsTrigger value="maintenance">طلبات الصيانة</TabsTrigger>
          <TabsTrigger value="portal-links">روابط البوابة</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          <Card>
            <CardHeader><CardTitle>الوحدات المباعة وحالة الإنجاز</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {soldUnits.map((u: any) => {
                  const project = (projects || []).find((p: any) => p.id === u.project_id);
                  return (
                    <Card key={u.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg">{u.unit_number}</h4>
                            <p className="text-sm text-muted-foreground">{project?.name || 'مشروع غير محدد'}</p>
                            <p className="text-sm">المشتري: {u.customers?.name || '-'}</p>
                            <p className="text-sm">سعر البيع: {fmt(u.sale_price || 0)}</p>
                          </div>
                          <div className="text-left">
                            <div className="text-sm text-muted-foreground mb-1">نسبة إنجاز المشروع</div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-3 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${project?.progress_percentage || 0}%` }} />
                              </div>
                              <span className="font-bold text-primary">{project?.progress_percentage || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {soldUnits.length === 0 && <p className="text-center text-muted-foreground py-8">لا توجد وحدات مباعة</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="installments">
          <Card>
            <CardHeader><CardTitle>جدول الأقساط</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>الوحدة</TableHead><TableHead>المشروع</TableHead><TableHead>المبلغ</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead><TableHead>الحالة</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(installments || []).map((i: any) => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.re_units?.unit_number}</TableCell>
                      <TableCell>{i.re_units?.re_projects?.name || '-'}</TableCell>
                      <TableCell>{fmt(i.amount || 0)}</TableCell>
                      <TableCell>{new Date(i.due_date).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <Badge className={i.status === 'paid' ? 'bg-green-100 text-green-800' : new Date(i.due_date) < new Date() ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                          {i.status === 'paid' ? 'مدفوع' : new Date(i.due_date) < new Date() ? 'متأخر' : 'معلق'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader><CardTitle>طلبات صيانة العملاء</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>الوحدة</TableHead><TableHead>الوصف</TableHead><TableHead>الأولوية</TableHead>
                  <TableHead>الحالة</TableHead><TableHead>التاريخ</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(maintenanceRequests || []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.re_units?.unit_number}</TableCell>
                      <TableCell className="max-w-48 truncate">{r.description}</TableCell>
                      <TableCell><Badge variant="outline">{r.priority}</Badge></TableCell>
                      <TableCell><Badge className={r.status === 'resolved' ? 'bg-green-100 text-green-800' : r.status === 'open' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{r.status === 'open' ? 'مفتوح' : r.status === 'in_progress' ? 'قيد التنفيذ' : 'تم الحل'}</Badge></TableCell>
                      <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString('ar-SA')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portal-links">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ExternalLink className="w-5 h-5" />إنشاء روابط بوابة العملاء</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">يمكنك إنشاء رابط فريد لكل عميل لمتابعة حالة وحدته ونسبة الإنجاز والأقساط</p>
              <div className="space-y-3">
                {soldUnits.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <span className="font-medium">{u.unit_number}</span>
                      <span className="text-sm text-muted-foreground mr-2">- {u.customers?.name || 'عميل'}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => generatePortalLink(u.id)}>
                      <Copy className="w-4 h-4 ml-1" />نسخ الرابط
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
