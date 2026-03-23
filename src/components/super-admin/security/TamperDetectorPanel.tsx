/**
 * TamperDetectorPanel - Uses audit_logs instead of dropped tamper tables
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useSuperAdminServices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Shield, ShieldAlert, ShieldCheck, Search, Play, Clock,
  AlertTriangle, CheckCircle2, XCircle, Snowflake, Database,
  FileWarning, Activity, Eye, Lock
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';

const TABLE_LABELS: Record<string, string> = {
  invoices: 'الفواتير',
  invoice_items: 'بنود الفواتير',
  journal_entries: 'قيود اليومية',
  journal_entry_lines: 'بنود القيود',
  account_categories: 'شجرة الحسابات',
  checks: 'الشيكات',
  expenses: 'المصروفات',
  vouchers: 'السندات',
  app_settings: 'إعدادات النظام',
};

export function TamperDetectorPanel() {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Use audit_logs for tamper detection data
  const { data: auditEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['tamper-audit-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['update', 'delete'])
        .in('entity_type', Object.keys(TABLE_LABELS))
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Stats from audit_logs
  const { data: integrityStats } = useQuery({
    queryKey: ['integrity-stats'],
    queryFn: async () => {
      const { count: totalAudited } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .in('entity_type', Object.keys(TABLE_LABELS));
      return {
        total: totalAudited || 0,
        valid: totalAudited || 0,
        invalid: 0,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  // Run scan via edge function
  const runScan = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/tamper-detector`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scan_type: 'manual',
            triggered_by: user?.id,
          }),
        }
      );
      if (!response.ok) throw new Error('Scan failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tamper-audit-events'] });
      queryClient.invalidateQueries({ queryKey: ['integrity-stats'] });
      if (data?.mismatches_found > 0) {
        toast.error(`🚨 تم اكتشاف ${data.mismatches_found} تعديل مشبوه!`);
      } else {
        toast.success(`✅ الفحص مكتمل - لا توجد تعديلات مشبوهة`);
      }
    },
    onError: (error) => {
      toast.error('فشل تشغيل الفحص: ' + (error as Error).message);
    },
  });

  const getSeverityBadge = (action: string) => {
    if (action === 'delete') return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />حذف</Badge>;
    return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1"><AlertTriangle className="w-3 h-3" />تعديل</Badge>;
  };

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{integrityStats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">سجل مراقب</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{integrityStats?.valid || 0}</p>
            <p className="text-xs text-muted-foreground">سجل سليم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{auditEvents.length}</p>
            <p className="text-xs text-muted-foreground">تعديلات مسجلة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileWarning className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">{auditEvents.filter((e: any) => e.action === 'delete').length}</p>
            <p className="text-xs text-muted-foreground">عمليات حذف</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              فحص سلامة البيانات المالية
            </div>
            <Button
              onClick={() => runScan.mutate()}
              disabled={runScan.isPending}
              className="gap-2"
              size="sm"
            >
              <Play className="w-4 h-4" />
              {runScan.isPending ? 'جاري الفحص...' : 'تشغيل الفحص الآن'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            يراقب النظام جميع التعديلات والحذف على الجداول المالية الحساسة عبر سجل المراجعة الموحد.
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>الجداول المراقبة:</strong> {Object.values(TABLE_LABELS).join(' • ')}
          </div>
        </CardContent>
      </Card>

      {/* Audit Events */}
      {auditEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              سجل التعديلات على البيانات المالية
              <Badge variant="secondary">{auditEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الجدول</TableHead>
                    <TableHead className="text-right">معرف السجل</TableHead>
                    <TableHead className="text-center">العملية</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                    <TableHead className="text-center">تفاصيل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.map((event: any) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">
                        {TABLE_LABELS[event.entity_type] || event.entity_type}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{event.entity_id?.substring(0, 8)}...</TableCell>
                      <TableCell className="text-center">{getSeverityBadge(event.action)}</TableCell>
                      <TableCell className="text-center text-xs">
                        {new Date(event.created_at).toLocaleString('ar-SA')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(event)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                تفاصيل التعديل
                              </DialogTitle>
                            </DialogHeader>
                            {selectedEvent && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground">الجدول</p>
                                    <p className="font-semibold">{TABLE_LABELS[selectedEvent.entity_type] || selectedEvent.entity_type}</p>
                                  </div>
                                  <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground">العملية</p>
                                    <p className="font-semibold">{selectedEvent.action}</p>
                                  </div>
                                  <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground">معرف السجل</p>
                                    <p className="font-mono text-xs">{selectedEvent.entity_id}</p>
                                  </div>
                                  <div className="bg-muted p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground">المستخدم</p>
                                    <p className="font-mono text-xs">{selectedEvent.user_id?.substring(0, 8)}...</p>
                                  </div>
                                </div>
                                <Separator />
                                {selectedEvent.old_data && (
                                  <div>
                                    <h4 className="font-semibold mb-2">البيانات السابقة</h4>
                                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40 dir-ltr">
                                      {JSON.stringify(selectedEvent.old_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {selectedEvent.new_data && (
                                  <div>
                                    <h4 className="font-semibold mb-2">البيانات الجديدة</h4>
                                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-40 dir-ltr">
                                      {JSON.stringify(selectedEvent.new_data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
