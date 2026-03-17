import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, Snowflake, UserCheck, FileCode, Activity as ActivityIcon, 
  Cpu, Lock, Clock, ShieldAlert, Eye, Database, Fingerprint, Bell,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp, ShieldCheck,
  ShieldOff, Zap, FileText, BarChart3, ArrowLeftRight
} from 'lucide-react';
import { FreezeModePanel } from './security/FreezeModePanel';
import { TwoPersonApprovalPanel } from './security/TwoPersonApprovalPanel';
import { CodeIntegrityMonitor } from './security/CodeIntegrityMonitor';
import { SecurityIncidentsPanel } from './security/SecurityIncidentsPanel';
import { EngineVersionManager } from './security/EngineVersionManager';
import { FinancialPeriodLockManager } from './security/FinancialPeriodLockManager';
import { FinancialTimeMachine } from './security/FinancialTimeMachine';
import { ProtectionStatusPanel } from './security/ProtectionStatusPanel';
import { ImpactAnalysisPanel } from './security/ImpactAnalysisPanel';
import { SystemChangeLogPanel } from './security/SystemChangeLogPanel';
import { TamperDetectorPanel } from './security/TamperDetectorPanel';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { BackupManagementPanel } from './BackupManagementPanel';
import { SystemChangeDetailView } from '@/components/system-alerts/SystemChangeDetailView';
import { useSystemChangeAlerts, SystemChangeAlert } from '@/hooks/useSystemChangeAlerts';
import { cn } from '@/lib/utils';

// ─── Detailed drill-down tabs ───
const detailTabs = [
  { value: 'freeze', label: 'التجميد', icon: Snowflake },
  { value: 'two-person', label: 'الموافقة الثنائية', icon: UserCheck },
  { value: 'code-integrity', label: 'سلامة الكود', icon: FileCode },
  { value: 'incidents', label: 'الحوادث', icon: ShieldAlert },
  { value: 'engine-versions', label: 'نسخ المحرك', icon: Cpu },
  { value: 'period-lock', label: 'قفل الفترات', icon: Lock },
  { value: 'time-machine', label: 'آلة الزمن', icon: Clock },
  { value: 'change-log', label: 'سجل التغييرات', icon: ActivityIcon },
  { value: 'impact', label: 'تحليل الأثر', icon: Eye },
  { value: 'backups', label: 'النسخ الاحتياطي', icon: Database },
  { value: 'tamper', label: 'كاشف التلاعب', icon: Fingerprint },
  { value: '2fa', label: 'المصادقة الثنائية', icon: Lock },
];

export function EnterpriseSecurityDashboard() {
  const { 
    alerts, pendingAlerts, approvedAlerts, rejectedAlerts,
    isFrozen, securityStatus, approveAlert, rejectAlert
  } = useSystemChangeAlerts();

  const [selectedAlert, setSelectedAlert] = useState<SystemChangeAlert | null>(null);
  const [drillView, setDrillView] = useState<string | null>(null);

  // Recent live alerts (last 20)
  const liveAlerts = useMemo(() => alerts.slice(0, 20), [alerts]);

  // ─── If drill-down is active, show the detailed panel ───
  if (drillView) {
    return (
      <div dir="rtl" className="space-y-4">
        <Button variant="ghost" className="gap-2" onClick={() => setDrillView(null)}>
          ← العودة لمركز التحكم الأمني
        </Button>
        {drillView === 'freeze' && <FreezeModePanel />}
        {drillView === 'two-person' && <TwoPersonApprovalPanel />}
        {drillView === 'code-integrity' && <CodeIntegrityMonitor />}
        {drillView === 'incidents' && <SecurityIncidentsPanel />}
        {drillView === 'engine-versions' && <EngineVersionManager />}
        {drillView === 'period-lock' && <FinancialPeriodLockManager />}
        {drillView === 'time-machine' && <FinancialTimeMachine />}
        {drillView === 'change-log' && <SystemChangeLogPanel />}
        {drillView === 'impact' && <ImpactAnalysisPanel />}
        {drillView === 'backups' && <BackupManagementPanel />}
        {drillView === 'tamper' && <TamperDetectorPanel />}
        {drillView === '2fa' && <TwoFactorSetup />}
        {drillView === 'protection' && <ProtectionStatusPanel />}
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5">
      {/* ════════════════ Hero Header ════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 p-5">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary))_1px,transparent_1px)] bg-[length:20px_20px]" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors',
              securityStatus === 'frozen' ? 'bg-sky-500/10 border-sky-500/30' :
              securityStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-emerald-500/10 border-emerald-500/30'
            )}>
              {securityStatus === 'frozen' ? <Snowflake className="h-7 w-7 text-sky-500 animate-pulse" /> :
               securityStatus === 'warning' ? <ShieldAlert className="h-7 w-7 text-amber-500" /> :
               <ShieldCheck className="h-7 w-7 text-emerald-500" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">مركز التحكم الأمني</h2>
              <p className="text-sm text-muted-foreground mt-0.5">رؤية شاملة — لا يتم أي تغيير بدون موافقتك</p>
            </div>
          </div>
          
          {/* System Status Pill */}
          <div className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold text-sm',
            securityStatus === 'frozen' ? 'bg-sky-500/10 border-sky-300 text-sky-700 dark:text-sky-400' :
            securityStatus === 'warning' ? 'bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-400' :
            'bg-emerald-500/10 border-emerald-300 text-emerald-700 dark:text-emerald-400'
          )}>
            <div className={cn(
              'w-2.5 h-2.5 rounded-full animate-pulse',
              securityStatus === 'frozen' ? 'bg-sky-500' :
              securityStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
            )} />
            {securityStatus === 'frozen' ? '🔒 النظام مُجمّد' :
             securityStatus === 'warning' ? '⚠️ تحذيرات أمنية' :
             '✅ النظام آمن'}
          </div>
        </div>
      </div>

      {/* ════════════════ 3-Column Control Grid ════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ──── LEFT: System Status Panel ──── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Status Overview */}
          <Card className="border-2 border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                حالة النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusRow 
                icon={<Snowflake className="w-4 h-4" />}
                label="وضع التجميد" 
                active={isFrozen} 
                activeLabel="مُفعّل" 
                inactiveLabel="غير مفعّل"
                onClick={() => setDrillView('freeze')}
              />
              <StatusRow 
                icon={<FileCode className="w-4 h-4" />}
                label="حراسة الكود" 
                active={true} 
                activeLabel="نشط"
                onClick={() => setDrillView('code-integrity')}
              />
              <StatusRow 
                icon={<UserCheck className="w-4 h-4" />}
                label="الموافقة الثنائية" 
                active={true} 
                activeLabel="نشط"
                onClick={() => setDrillView('two-person')}
              />
              <StatusRow 
                icon={<Lock className="w-4 h-4" />}
                label="قفل الفترات" 
                active={true} 
                activeLabel="نشط"
                onClick={() => setDrillView('period-lock')}
              />
              <StatusRow 
                icon={<Fingerprint className="w-4 h-4" />}
                label="كاشف التلاعب" 
                active={true} 
                activeLabel="نشط"
                onClick={() => setDrillView('tamper')}
              />
              <StatusRow 
                icon={<Database className="w-4 h-4" />}
                label="النسخ الاحتياطي" 
                active={true} 
                activeLabel="نشط"
                onClick={() => setDrillView('backups')}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <QuickMetric icon={<BarChart3 className="w-4 h-4" />} label="إجمالي التنبيهات" value={alerts.length} color="text-primary" />
              <QuickMetric icon={<AlertTriangle className="w-4 h-4" />} label="معلقة" value={pendingAlerts.length} color="text-amber-600" />
              <QuickMetric icon={<CheckCircle2 className="w-4 h-4" />} label="تمت الموافقة" value={approvedAlerts.length} color="text-emerald-600" />
              <QuickMetric icon={<XCircle className="w-4 h-4" />} label="مرفوضة" value={rejectedAlerts.length} color="text-destructive" />
            </CardContent>
          </Card>

          {/* Deep Dive Links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">أدوات متقدمة</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {detailTabs.map(t => (
                  <Button 
                    key={t.value} 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start gap-2 text-xs h-8"
                    onClick={() => setDrillView(t.value)}
                  >
                    <t.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    {t.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ──── CENTER: Live Alerts Feed ──── */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                التنبيهات المباشرة
                {pendingAlerts.length > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 h-5 animate-pulse">
                    {pendingAlerts.length} جديد
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                <div className="divide-y">
                  {liveAlerts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">لا توجد تنبيهات — النظام آمن</p>
                    </div>
                  ) : liveAlerts.map((alert) => (
                    <AlertRow 
                      key={alert.id} 
                      alert={alert} 
                      onView={() => setSelectedAlert(alert)} 
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* ──── RIGHT: Pending Approvals ──── */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-violet-600" />
                الموافقات المعلقة
                <Badge variant="secondary" className="text-[10px]">{pendingAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                {pendingAlerts.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">لا توجد موافقات معلقة</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingAlerts.map(alert => (
                      <div key={alert.id} className="p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{alert.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] h-4">{alert.affected_module}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(alert.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* Impact summary */}
                        {alert.impact_analysis && (
                          <div className="flex gap-2 flex-wrap mb-2">
                            <ImpactChip label="فواتير" value={alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} />
                            <ImpactChip label="قيود" value={alert.impact_analysis.journal_entries} />
                            <ImpactChip label="حسابات" value={alert.impact_analysis.account_balances_affected} />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="h-7 text-xs gap-1 flex-1" 
                            onClick={() => approveAlert.mutate({ id: alert.id })}
                            disabled={approveAlert.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            موافقة
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-7 text-xs gap-1 flex-1"
                            onClick={() => rejectAlert.mutate({ id: alert.id })}
                            disabled={rejectAlert.isPending}
                          >
                            <XCircle className="w-3 h-3" />
                            رفض
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-xs gap-1"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════════════ Bottom: Audit Timeline ════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              الجدول الزمني للتدقيق
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setDrillView('change-log')}>
              عرض الكل <ArrowLeftRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-0 bottom-0 right-4 w-px bg-border" />
            
            <div className="space-y-0">
              {alerts.slice(0, 8).map((alert, i) => (
                <div key={alert.id} className="flex gap-4 group relative">
                  {/* Dot */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 border-2',
                    alert.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/40' :
                    alert.status === 'rejected' ? 'bg-destructive/10 border-destructive/40' :
                    'bg-amber-500/10 border-amber-500/40'
                  )}>
                    {alert.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                     alert.status === 'rejected' ? <XCircle className="w-3.5 h-3.5 text-destructive" /> :
                     <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    'flex-1 pb-4 cursor-pointer group-hover:bg-muted/30 rounded-lg p-2 -mt-1 transition-colors',
                  )} onClick={() => setSelectedAlert(alert)}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">{alert.description}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(alert.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-3.5 px-1">{alert.affected_module}</Badge>
                      <Badge variant="outline" className="text-[9px] h-3.5 px-1">{changeTypeLabel(alert.change_type)}</Badge>
                      {alert.impact_analysis && (
                        <span className="text-[10px]">
                          أثر: {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} فاتورة · {alert.impact_analysis.journal_entries} قيد
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">لا توجد أحداث مسجلة</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════ Detail Sheet ════════════════ */}
      <Sheet open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <SheetContent side="left" className="w-[600px] sm:max-w-[600px] overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              تفاصيل التغيير
            </SheetTitle>
          </SheetHeader>
          {selectedAlert && (
            <div className="mt-4">
              <SystemChangeDetailView alert={selectedAlert} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Sub-components ───

function StatusRow({ icon, label, active, activeLabel, inactiveLabel, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; activeLabel: string; inactiveLabel?: string; onClick?: () => void;
}) {
  return (
    <div 
      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <Badge className={cn(
        'text-[10px] h-5',
        active 
          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400' 
          : 'bg-muted text-muted-foreground'
      )}>
        {active ? activeLabel : (inactiveLabel || 'غير مفعّل')}
      </Badge>
    </div>
  );
}

function QuickMetric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className={cn('text-lg font-bold', color)}>{value}</span>
    </div>
  );
}

function AlertRow({ alert, onView }: { alert: SystemChangeAlert; onView: () => void }) {
  return (
    <div 
      className={cn(
        'px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors',
        alert.status === 'pending' && 'bg-amber-500/[0.03]'
      )}
      onClick={onView}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          'w-2 h-2 rounded-full mt-1.5 shrink-0',
          alert.status === 'approved' ? 'bg-emerald-500' :
          alert.status === 'rejected' ? 'bg-destructive' :
          'bg-amber-500 animate-pulse'
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{alert.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] h-4 px-1">{alert.affected_module}</Badge>
            <span className="text-[10px] text-muted-foreground">{changeTypeLabel(alert.change_type)}</span>
            <span className="text-[10px] text-muted-foreground mr-auto">
              {new Date(alert.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          </div>
          {alert.impact_analysis && (
            <div className="flex gap-1.5 mt-1.5">
              <ImpactChip label="فواتير" value={alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} />
              <ImpactChip label="قيود" value={alert.impact_analysis.journal_entries} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImpactChip({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
      {value} {label}
    </span>
  );
}

function changeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    code_change: '💻 كود',
    accounting_logic: '📊 محاسبة',
    tax_calculation: '🏛️ ضريبة',
    system_config: '⚙️ إعدادات',
    database_structure: '🗃️ قاعدة بيانات',
    config_change: '⚙️ تهيئة',
  };
  return labels[type] || type;
}
