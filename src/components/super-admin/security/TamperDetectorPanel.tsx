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

  // Fetch scan runs
  const { data: scanRuns = [], isLoading: loadingRuns } = useQuery({
    queryKey: ['tamper-scan-runs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tamper_scan_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tamper events
  const { data: tamperEvents = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['tamper-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tamper_detection_events')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch integrity stats
  const { data: integrityStats } = useQuery({
    queryKey: ['integrity-stats'],
    queryFn: async () => {
      const { count: totalHashes } = await supabase
        .from('integrity_hashes')
        .select('*', { count: 'exact', head: true });
      const { count: validHashes } = await supabase
        .from('integrity_hashes')
        .select('*', { count: 'exact', head: true })
        .eq('is_valid', true);
      const { count: invalidHashes } = await supabase
        .from('integrity_hashes')
        .select('*', { count: 'exact', head: true })
        .eq('is_valid', false);
      return {
        total: totalHashes || 0,
        valid: validHashes || 0,
        invalid: invalidHashes || 0,
      };
    },
  });

  // Run scan mutation
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
      queryClient.invalidateQueries({ queryKey: ['tamper-scan-runs'] });
      queryClient.invalidateQueries({ queryKey: ['tamper-events'] });
      queryClient.invalidateQueries({ queryKey: ['integrity-stats'] });
      if (data.mismatches_found > 0) {
        toast.error(`🚨 تم اكتشاف ${data.mismatches_found} تعديل مشبوه!`);
      } else {
        toast.success(`✅ الفحص مكتمل - ${data.total_records_checked} سجل، لا توجد تعديلات مشبوهة`);
      }
    },
    onError: (error) => {
      toast.error('فشل تشغيل الفحص: ' + (error as Error).message);
    },
  });

  // Resolve event
  const resolveEvent = useMutation({
    mutationFn: async ({ eventId, notes }: { eventId: string; notes: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tamper_detection_events')
        .update({
          status: 'resolved',
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tamper-events'] });
      toast.success('تم وضع علامة تم الحل');
    },
  });

  const lastScan = scanRuns[0];
  const unresolvedCount = tamperEvents.filter((e: any) => e.status === 'detected').length;
  const criticalCount = tamperEvents.filter((e: any) => e.severity === 'critical' && e.status === 'detected').length;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />حرج</Badge>;
      case 'high': return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 gap-1"><AlertTriangle className="w-3 h-3" />عالي</Badge>;
      default: return <Badge variant="secondary" className="gap-1">متوسط</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'detected': return <Badge variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" />مكتشف</Badge>;
      case 'resolved': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><CheckCircle2 className="w-3 h-3" />تم الحل</Badge>;
      case 'false_positive': return <Badge variant="secondary" className="gap-1">إنذار كاذب</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getScanStatusBadge = (status: string) => {
    switch (status) {
      case 'clean': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><ShieldCheck className="w-3 h-3" />نظيف</Badge>;
      case 'tampering_detected': return <Badge variant="destructive" className="gap-1"><ShieldAlert className="w-3 h-3" />تعديلات مكتشفة</Badge>;
      case 'running': return <Badge variant="secondary" className="gap-1"><Activity className="w-3 h-3 animate-spin" />قيد التشغيل</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
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
            <p className="text-2xl font-bold text-destructive">{unresolvedCount}</p>
            <p className="text-xs text-muted-foreground">تعديل غير محلول</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileWarning className="w-8 h-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold text-orange-600">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">تهديد حرج</p>
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
            <div className="flex gap-2">
              {unresolvedCount > 0 && (
                <Button variant="destructive" size="sm" className="gap-1">
                  <Snowflake className="w-4 h-4" />
                  تجميد النظام
                </Button>
              )}
              <Button
                onClick={() => runScan.mutate()}
                disabled={runScan.isPending}
                className="gap-2"
                size="sm"
              >
                <Play className="w-4 h-4" />
                {runScan.isPending ? 'جاري الفحص...' : 'تشغيل الفحص الآن'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            يقوم الفاحص بحساب بصمات تشفيرية (SHA-256) لكل سجل مالي ومقارنتها مع البصمات المخزنة.
            أي اختلاف يشير إلى تعديل غير مصرح به في قاعدة البيانات.
          </div>
          <div className="text-xs text-muted-foreground">
            <strong>الجداول المراقبة:</strong> {Object.values(TABLE_LABELS).join(' • ')}
          </div>
        </CardContent>
      </Card>

      {/* Tamper Events */}
      {tamperEvents.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" />
              سجل التعديلات المكتشفة
              <Badge variant="destructive">{tamperEvents.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الجدول</TableHead>
                    <TableHead className="text-right">معرف السجل</TableHead>
                    <TableHead className="text-center">الخطورة</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">التاريخ</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tamperEvents.map((event: any) => (
                    <TableRow key={event.id} className={event.status === 'detected' ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-medium">
                        {TABLE_LABELS[event.table_name] || event.table_name}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{event.record_id?.substring(0, 8)}...</TableCell>
                      <TableCell className="text-center">{getSeverityBadge(event.severity)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="text-center text-xs">
                        {new Date(event.detected_at).toLocaleString('ar-SA')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(event)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <ShieldAlert className="w-5 h-5 text-destructive" />
                                  تفاصيل التعديل المكتشف
                                </DialogTitle>
                              </DialogHeader>
                              {selectedEvent && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted p-3 rounded-lg">
                                      <p className="text-xs text-muted-foreground">الجدول</p>
                                      <p className="font-semibold">{TABLE_LABELS[selectedEvent.table_name] || selectedEvent.table_name}</p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg">
                                      <p className="text-xs text-muted-foreground">معرف السجل</p>
                                      <p className="font-mono text-xs">{selectedEvent.record_id}</p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg">
                                      <p className="text-xs text-muted-foreground">البصمة السابقة</p>
                                      <p className="font-mono text-[10px] break-all text-green-600">{selectedEvent.previous_hash}</p>
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg">
                                      <p className="text-xs text-muted-foreground">البصمة الحالية</p>
                                      <p className="font-mono text-[10px] break-all text-destructive">{selectedEvent.current_hash}</p>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Fields comparison */}
                                  {selectedEvent.fields_before && selectedEvent.fields_after && (
                                    <div>
                                      <h4 className="font-semibold mb-2">مقارنة الحقول</h4>
                                      <div className="bg-muted rounded-lg overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead className="text-right">الحقل</TableHead>
                                              <TableHead className="text-right">القيمة السابقة</TableHead>
                                              <TableHead className="text-right">القيمة الحالية</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {Object.keys(selectedEvent.fields_after).map(key => {
                                              const before = selectedEvent.fields_before?.[key];
                                              const after = selectedEvent.fields_after?.[key];
                                              const changed = JSON.stringify(before) !== JSON.stringify(after);
                                              return (
                                                <TableRow key={key} className={changed ? 'bg-destructive/10' : ''}>
                                                  <TableCell className="font-medium text-xs">{key}</TableCell>
                                                  <TableCell className="text-xs">{String(before ?? '-')}</TableCell>
                                                  <TableCell className={`text-xs ${changed ? 'text-destructive font-bold' : ''}`}>
                                                    {String(after ?? '-')}
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}

                                  <Separator />

                                  {/* Impact Analysis */}
                                  {selectedEvent.impact_analysis && (
                                    <div>
                                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        تحليل الأثر المالي
                                      </h4>
                                      <div className="space-y-2">
                                        {selectedEvent.impact_analysis.affected_areas?.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {selectedEvent.impact_analysis.affected_areas.map((area: string, i: number) => (
                                              <Badge key={i} variant="outline" className="text-xs">{area}</Badge>
                                            ))}
                                          </div>
                                        )}
                                        {selectedEvent.impact_analysis.financial_impact && (
                                          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
                                            {Object.entries(selectedEvent.impact_analysis.financial_impact).map(([key, val]) => (
                                              <div key={key} className="flex justify-between py-1">
                                                <span className="text-muted-foreground">{key}</span>
                                                <span className="font-mono font-semibold">{String(val)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  {selectedEvent.status === 'detected' && (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="default"
                                        className="gap-2"
                                        onClick={() => {
                                          resolveEvent.mutate({
                                            eventId: selectedEvent.id,
                                            notes: 'تم المراجعة والتأكيد',
                                          });
                                          setSelectedEvent(null);
                                        }}
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        تأكيد المراجعة
                                      </Button>
                                      <Button variant="destructive" className="gap-2">
                                        <Snowflake className="w-4 h-4" />
                                        تجميد النظام
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {event.status === 'detected' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => resolveEvent.mutate({ eventId: event.id, notes: 'تم المراجعة' })}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            سجل عمليات الفحص
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRuns ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : scanRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لم يتم إجراء أي فحص بعد</p>
              <p className="text-xs mt-1">اضغط "تشغيل الفحص الآن" لبدء أول فحص سلامة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">وقت البدء</TableHead>
                  <TableHead className="text-center">النوع</TableHead>
                  <TableHead className="text-center">السجلات المفحوصة</TableHead>
                  <TableHead className="text-center">سجلات جديدة</TableHead>
                  <TableHead className="text-center">تعديلات مكتشفة</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanRuns.map((run: any) => (
                  <TableRow key={run.id}>
                    <TableCell className="text-sm">
                      {new Date(run.started_at).toLocaleString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {run.scan_type === 'manual' ? 'يدوي' : run.scan_type === 'scheduled' ? 'مجدول' : run.scan_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">{run.total_records_checked}</TableCell>
                    <TableCell className="text-center">{run.new_records_hashed}</TableCell>
                    <TableCell className="text-center">
                      <span className={run.mismatches_found > 0 ? 'text-destructive font-bold' : 'text-green-600'}>
                        {run.mismatches_found}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{getScanStatusBadge(run.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
