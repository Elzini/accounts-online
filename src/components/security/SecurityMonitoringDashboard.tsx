import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchIntegrityChecks, fetchSensitiveOperations, fetchRecentAuditLogs } from '@/services/securityMonitoring';
import { useCompany } from '@/contexts/CompanyContext';
import { runFullIntegrityCheck, IntegrityCheckResult } from '@/services/dataIntegrity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield, ShieldCheck, ShieldAlert, ShieldX,
  RefreshCw, Clock, Activity, Lock, Database,
  CheckCircle2, XCircle, AlertTriangle, Loader2,
  Eye, FileWarning, Link2
} from 'lucide-react';
import { toast } from 'sonner';

const statusConfig = {
  pass: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', label: 'ناجح', badge: 'default' as const },
  fail: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'فاشل', badge: 'destructive' as const },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'تحذير', badge: 'secondary' as const },
};

export function SecurityMonitoringDashboard() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [checkResults, setCheckResults] = useState<IntegrityCheckResult[]>([]);

  const { data: lastChecks, isLoading: loadingChecks } = useQuery({
    queryKey: ['integrity-checks', companyId],
    queryFn: fetchIntegrityChecks,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sensitiveOps, isLoading: loadingOps } = useQuery({
    queryKey: ['sensitive-operations', companyId],
    queryFn: fetchSensitiveOperations,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentAudits } = useQuery({
    queryKey: ['recent-audits', companyId],
    queryFn: fetchRecentAuditLogs,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });

  // تشغيل الفحص الشامل
  const runCheckMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('لا يوجد سياق شركة');
      return runFullIntegrityCheck(companyId);
    },
    onSuccess: (results) => {
      setCheckResults(results);
      queryClient.invalidateQueries({ queryKey: ['integrity-checks'] });
      const failCount = results.filter(r => r.status === 'fail').length;
      if (failCount === 0) {
        toast.success('✅ جميع الفحوصات ناجحة');
      } else {
        toast.error(`⚠️ تم اكتشاف ${failCount} مشكلة`);
      }
    },
    onError: (err: any) => toast.error(err.message),
  });

  const displayResults = checkResults.length > 0 ? checkResults : 
    (lastChecks ? lastChecks.slice(0, 4).map((c: any) => ({
      checkType: c.check_type,
      checkName: c.check_name,
      status: c.status as 'pass' | 'fail' | 'warning',
      details: c.details,
      issuesFound: c.issues_found,
    })) : []);

  const passCount = displayResults.filter(r => r.status === 'pass').length;
  const failCount = displayResults.filter(r => r.status === 'fail').length;
  const warnCount = displayResults.filter(r => r.status === 'warning').length;

  const overallStatus = failCount > 0 ? 'critical' : warnCount > 0 ? 'warning' : 'secure';

  const operationLabels: Record<string, string> = {
    'delete_account': 'حذف حساب',
    'edit_account': 'تعديل حساب أساسي',
    'delete_journal': 'حذف قيد',
    'edit_posted_journal': 'تعديل قيد مرحّل',
    'reset_database': 'تصفير قاعدة البيانات',
    'delete_fiscal_year': 'حذف سنة مالية',
    'edit_settings': 'تعديل إعدادات',
    'bulk_delete': 'حذف جماعي',
    'change_permissions': 'تغيير صلاحيات',
    'export_sensitive': 'تصدير بيانات حساسة',
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* شريط الحالة العامة */}
      <Card className={`border-2 ${
        overallStatus === 'secure' ? 'border-green-500/30 bg-green-500/5' :
        overallStatus === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
        'border-red-500/30 bg-red-500/5'
      }`}>
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            {overallStatus === 'secure' ? (
              <ShieldCheck className="h-12 w-12 text-green-500" />
            ) : overallStatus === 'warning' ? (
              <ShieldAlert className="h-12 w-12 text-yellow-500" />
            ) : (
              <ShieldX className="h-12 w-12 text-red-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {overallStatus === 'secure' ? 'النظام آمن ✅' :
                 overallStatus === 'warning' ? 'تحذيرات ⚠️' :
                 'مشاكل حرجة 🚨'}
              </h2>
              <p className="text-muted-foreground">
                {passCount} ناجح • {warnCount} تحذير • {failCount} فاشل
              </p>
            </div>
          </div>
          <Button
            onClick={() => runCheckMutation.mutate()}
            disabled={runCheckMutation.isPending}
            size="lg"
          >
            {runCheckMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جاري الفحص...</>
            ) : (
              <><RefreshCw className="h-4 w-4 ml-2" /> فحص شامل</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* بطاقات الفحوصات */}
      {displayResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayResults.map((result, idx) => {
            const config = statusConfig[result.status];
            const Icon = config.icon;
            const checkIcons: Record<string, any> = {
              tenant_isolation: Link2,
              audit_chain: Shield,
              balance_parity: Database,
              template_protection: FileWarning,
            };
            const CheckIcon = checkIcons[result.checkType] || Shield;

            return (
              <Card key={idx} className={`${config.bg} border`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <CheckIcon className="h-8 w-8 text-muted-foreground" />
                    <Icon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  <h3 className="font-semibold mb-1">{result.checkName}</h3>
                  <Badge variant={config.badge}>{config.label}</Badge>
                  {result.issuesFound > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {result.issuesFound} مشكلة مكتشفة
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* التفاصيل */}
      <Tabs defaultValue="operations" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="operations" className="flex items-center gap-1">
            <Lock className="h-4 w-4" /> العمليات الحساسة
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1">
            <Activity className="h-4 w-4" /> سجل التدقيق
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1">
            <Eye className="h-4 w-4" /> تفاصيل الفحص
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                سجل العمليات الحساسة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {loadingOps ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : sensitiveOps && sensitiveOps.length > 0 ? (
                  <div className="space-y-3">
                    {sensitiveOps.map((op: any) => (
                      <div key={op.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {op.otp_verified ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : op.status === 'pending' ? (
                            <Clock className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {operationLabels[op.operation_type] || op.operation_type}
                            </p>
                            {op.operation_description && (
                              <p className="text-xs text-muted-foreground">{op.operation_description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant={op.otp_verified ? 'default' : 'secondary'}>
                            {op.otp_verified ? 'موافق عليه' : op.status === 'pending' ? 'معلق' : op.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(op.created_at).toLocaleString('ar-SA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-10">لا توجد عمليات حساسة مسجلة</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                آخر سجلات التدقيق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {recentAudits && recentAudits.length > 0 ? (
                  <div className="space-y-2">
                    {recentAudits.map((audit: any) => (
                      <div key={audit.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border text-sm">
                        <div>
                          <span className="font-medium">{audit.entity_type}</span>
                          <span className="text-muted-foreground mx-2">•</span>
                          <span className={
                            audit.action === 'delete' ? 'text-red-500' :
                            audit.action === 'create' ? 'text-green-500' :
                            'text-blue-500'
                          }>
                            {audit.action === 'create' ? 'إنشاء' :
                             audit.action === 'update' ? 'تعديل' :
                             audit.action === 'delete' ? 'حذف' : audit.action}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {audit.integrity_hash && (
                            <Shield className="h-3 w-3 text-green-500" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(audit.created_at).toLocaleString('ar-SA')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-10">لا توجد سجلات تدقيق</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                تفاصيل الفحوصات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {displayResults.length > 0 ? (
                  <div className="space-y-4">
                    {displayResults.map((result, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{result.checkName}</h4>
                          <Badge variant={statusConfig[result.status].badge}>
                            {statusConfig[result.status].label}
                          </Badge>
                        </div>
                        {result.details?.issues && result.details.issues.length > 0 && (
                          <div className="space-y-1">
                            {result.details.issues.map((issue: string, i: number) => (
                              <p key={i} className="text-sm text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> {issue}
                              </p>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">
                          {result.details?.totalLogs !== undefined && <span>السجلات: {result.details.totalLogs} | </span>}
                          {result.details?.totalEntries !== undefined && <span>القيود: {result.details.totalEntries} | </span>}
                          {result.details?.tablesChecked !== undefined && <span>الجداول: {result.details.tablesChecked}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-10">قم بتشغيل الفحص الشامل لرؤية التفاصيل</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
