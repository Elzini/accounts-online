import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, Snowflake, UserCheck, FileCode, Activity as ActivityIcon, 
  Cpu, Lock, Clock, ShieldAlert, Eye, Database, Fingerprint, Bell,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp, ShieldCheck,
  ShieldOff, Zap, FileText, BarChart3, ArrowLeftRight, Settings,
  LockOpen, ChevronDown, RefreshCw, Filter
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
  const [approvalModal, setApprovalModal] = useState<{ alert: SystemChangeAlert; action: 'approve' | 'reject' } | null>(null);

  const liveAlerts = useMemo(() => alerts.slice(0, 20), [alerts]);
  const lastAuditTime = alerts.length > 0 
    ? new Date(alerts[0].created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
    : 'لا يوجد';

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

  const handleApprovalAction = (alert: SystemChangeAlert, action: 'approve' | 'reject') => {
    setApprovalModal({ alert, action });
  };

  const confirmApproval = () => {
    if (!approvalModal) return;
    if (approvalModal.action === 'approve') {
      approveAlert.mutate({ id: approvalModal.alert.id });
    } else {
      rejectAlert.mutate({ id: approvalModal.alert.id });
    }
    setApprovalModal(null);
  };

  return (
    <div dir="rtl" className="space-y-4">
      {/* ════════════════ HEADER ════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5">
        <div className="absolute inset-0 bg-gradient-to-l from-primary/5 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-14 h-14 rounded-2xl border-2 flex items-center justify-center',
              securityStatus === 'frozen' ? 'bg-sky-500/10 border-sky-500/40' :
              securityStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/40' :
              'bg-emerald-500/10 border-emerald-500/40'
            )}>
              {securityStatus === 'frozen' ? <Snowflake className="h-7 w-7 text-sky-500 animate-pulse" /> :
               securityStatus === 'warning' ? <ShieldAlert className="h-7 w-7 text-amber-500" /> :
               <ShieldCheck className="h-7 w-7 text-emerald-500" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Security Control Center</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full animate-pulse',
                  securityStatus === 'frozen' ? 'bg-sky-500' :
                  securityStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                )} />
                <span className={cn(
                  'text-sm font-semibold',
                  securityStatus === 'frozen' ? 'text-sky-600 dark:text-sky-400' :
                  securityStatus === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                  'text-emerald-600 dark:text-emerald-400'
                )}>
                  {securityStatus === 'frozen' ? '🔒 مُجمّد — قراءة فقط' :
                   securityStatus === 'warning' ? '⚠️ تحذيرات أمنية' :
                   '✅ النظام آمن'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant={isFrozen ? 'outline' : 'default'}
              size="sm" 
              className={cn(
                'gap-2 font-semibold',
                !isFrozen && 'bg-destructive/90 hover:bg-destructive text-destructive-foreground'
              )}
              onClick={() => setDrillView('freeze')}
            >
              <Snowflake className="w-4 h-4" />
              تجميد النظام
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setDrillView('freeze')}
            >
              <LockOpen className="w-4 h-4" />
              إلغاء التجميد
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setDrillView('two-person')}
            >
              <Settings className="w-4 h-4" />
              إعدادات الأمان
            </Button>
          </div>
        </div>
      </div>

      {/* ════════════════ 3-Column Control Grid ════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ──── LEFT: System Health ──── */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-2 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3">
              {/* Database Integrity */}
              <HealthStatusRow
                icon={<Database className="w-5 h-5" />}
                label="Database Integrity"
                status="ok"
                statusLabel="OK"
                onClick={() => setDrillView('tamper')}
              />
              {/* Code Status */}
              <HealthStatusRow
                icon={<Lock className="w-5 h-5" />}
                label="Code Status"
                status={isFrozen ? 'locked' : 'ok'}
                statusLabel={isFrozen ? 'Locked' : 'Active'}
                badge={isFrozen ? 'LOCK' : undefined}
                onClick={() => setDrillView('code-integrity')}
              />
              {/* Pending Changes */}
              <div 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setDrillView('change-log')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pending Changes</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingAlerts.length}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{pendingAlerts.length}</Badge>
              </div>
              {/* Last Audit */}
              <div 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setDrillView('change-log')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Last Audit</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lastAuditTime}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          {/* Quick Tools */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">أدوات متقدمة</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-0.5">
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

        {/* ──── CENTER: Live Alerts ──── */}
        <div className="lg:col-span-5">
          <Card className="h-full border-2 border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Live Alerts
                  {pendingAlerts.length > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 h-5 animate-pulse">
                      {pendingAlerts.length} جديد
                    </Badge>
                  )}
                </CardTitle>
                <span className="text-[11px] text-muted-foreground">
                  {alerts.length > 0 && new Date(alerts[0].created_at).toLocaleString('ar-SA', { timeStyle: 'short' })}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[540px]">
                <div className="divide-y divide-border">
                  {liveAlerts.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                      <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">لا توجد تنبيهات — النظام آمن</p>
                    </div>
                  ) : liveAlerts.map((alert) => (
                    <LiveAlertRow 
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
          <Card className="h-full border-2 border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Pending Approvals
                </CardTitle>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[540px]">
                {pendingAlerts.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">لا توجد موافقات معلقة</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {pendingAlerts.map((alert, idx) => (
                      <ApprovalRow 
                        key={alert.id} 
                        alert={alert} 
                        index={idx}
                        onApprove={() => handleApprovalAction(alert, 'approve')}
                        onReject={() => handleApprovalAction(alert, 'reject')}
                        onView={() => setSelectedAlert(alert)}
                      />
                    ))}
                  </div>
                )}

                {/* Resolved items */}
                {(approvedAlerts.length > 0 || rejectedAlerts.length > 0) && (
                  <>
                    <Separator />
                    <div className="p-3">
                      <p className="text-[10px] text-muted-foreground font-semibold mb-2">تمت المعالجة</p>
                      {[...approvedAlerts, ...rejectedAlerts].slice(0, 5).map((alert, idx) => (
                        <div key={alert.id} className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
                          {alert.status === 'approved' 
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 
                            : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />}
                          <span className="truncate">{alert.description}</span>
                          <span className="mr-auto text-[10px]">
                            {alert.status === 'approved' ? 'موافق' : 'مرفوض'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ════════════════ Bottom: Audit Timeline ════════════════ */}
      <Card className="border-2 border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Audit Timeline
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Filter className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7" onClick={() => setDrillView('change-log')}>
                عرض الكل <ArrowLeftRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute top-0 bottom-0 right-4 w-px bg-border" />
            <div className="space-y-0">
              {alerts.slice(0, 8).map((alert) => (
                <TimelineRow key={alert.id} alert={alert} onClick={() => setSelectedAlert(alert)} />
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">لا توجد أحداث مسجلة</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════ Change Request Approval Modal ════════════════ */}
      <Dialog open={!!approvalModal} onOpenChange={() => setApprovalModal(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalModal?.action === 'approve' 
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                : <XCircle className="w-5 h-5 text-destructive" />}
              {approvalModal?.action === 'approve' ? 'تأكيد الموافقة على التغيير' : 'تأكيد رفض التغيير'}
            </DialogTitle>
            <DialogDescription>
              يرجى مراجعة تفاصيل التغيير وتأثيره قبل اتخاذ القرار
            </DialogDescription>
          </DialogHeader>

          {approvalModal && (
            <div className="space-y-4 py-2">
              {/* Change Description */}
              <div className="rounded-xl border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">وصف التغيير</p>
                <p className="text-sm font-medium">{approvalModal.alert.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{approvalModal.alert.affected_module}</Badge>
                  <Badge variant="outline" className="text-[10px]">{changeTypeLabel(approvalModal.alert.change_type)}</Badge>
                </div>
              </div>

              {/* Impact Analysis */}
              {approvalModal.alert.impact_analysis && (
                <div className="rounded-xl border p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">تحليل الأثر المتوقع</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ImpactCard 
                      label="فواتير المبيعات" 
                      value={approvalModal.alert.impact_analysis.sales_invoices} 
                      icon={<FileText className="w-4 h-4" />} 
                    />
                    <ImpactCard 
                      label="فواتير المشتريات" 
                      value={approvalModal.alert.impact_analysis.purchase_invoices} 
                      icon={<FileText className="w-4 h-4" />} 
                    />
                    <ImpactCard 
                      label="القيود المحاسبية" 
                      value={approvalModal.alert.impact_analysis.journal_entries} 
                      icon={<BarChart3 className="w-4 h-4" />} 
                    />
                    <ImpactCard 
                      label="الأرصدة المتأثرة" 
                      value={approvalModal.alert.impact_analysis.account_balances_affected} 
                      icon={<TrendingUp className="w-4 h-4" />} 
                    />
                  </div>
                  {approvalModal.alert.impact_analysis.vat_report_affected && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">تقرير الضريبة سيتأثر</span>
                    </div>
                  )}
                  {approvalModal.alert.impact_analysis.trial_balance_affected && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">ميزان المراجعة سيتأثر</span>
                    </div>
                  )}
                </div>
              )}

              {/* Risk Level */}
              <div className="rounded-xl border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">مستوى المخاطر</p>
                <RiskBadge severity={approvalModal.alert.severity} />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApprovalModal(null)}>
              إلغاء
            </Button>
            {approvalModal?.action === 'approve' ? (
              <Button 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={confirmApproval}
                disabled={approveAlert.isPending}
              >
                <CheckCircle2 className="w-4 h-4" />
                تأكيد الموافقة
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                className="gap-2"
                onClick={confirmApproval}
                disabled={rejectAlert.isPending}
              >
                <XCircle className="w-4 h-4" />
                تأكيد الرفض
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

// ═══════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════

function HealthStatusRow({ icon, label, status, statusLabel, badge, onClick }: {
  icon: React.ReactNode; label: string; status: 'ok' | 'locked' | 'warning'; statusLabel: string; badge?: string; onClick?: () => void;
}) {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          status === 'ok' ? 'bg-emerald-500/10' :
          status === 'locked' ? 'bg-amber-500/10' : 'bg-destructive/10'
        )}>
          <span className={cn(
            status === 'ok' ? 'text-emerald-500' :
            status === 'locked' ? 'text-amber-500' : 'text-destructive'
          )}>{icon}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className={cn(
            'text-xs font-medium',
            status === 'ok' ? 'text-emerald-600 dark:text-emerald-400' :
            status === 'locked' ? 'text-amber-600 dark:text-amber-400' : 'text-destructive'
          )}>{statusLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {badge && (
          <Badge className="text-[9px] h-4 bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
            {badge}
          </Badge>
        )}
        <Badge className={cn(
          'text-[10px] h-5',
          status === 'ok' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400' :
          status === 'locked' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400' :
          'bg-destructive/10 text-destructive border-destructive/20'
        )}>
          {status === 'ok' ? '●' : status === 'locked' ? '🔒' : '⚠'}
        </Badge>
      </div>
    </div>
  );
}

function LiveAlertRow({ alert, onView }: { alert: SystemChangeAlert; onView: () => void }) {
  const severityColor = alert.severity === 'critical' || alert.severity === 'high'
    ? 'border-r-destructive bg-destructive/[0.03]'
    : alert.severity === 'medium'
    ? 'border-r-amber-500 bg-amber-500/[0.02]'
    : 'border-r-emerald-500';

  return (
    <div 
      className={cn(
        'px-4 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors border-r-4',
        severityColor
      )}
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        <SeverityDot severity={alert.severity} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate">{alert.description}</p>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(alert.created_at).toLocaleString('ar-SA', { timeStyle: 'short' })}
            </span>
          </div>
          {alert.impact_analysis && (
            <p className="text-xs text-muted-foreground mt-1">
              {alert.description.includes('Tax') || alert.description.includes('ضري') 
                ? 'Tax calculation logic modified.'
                : alert.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {alert.impact_analysis && (
              <>
                <ImpactChip icon="├" label={`Affects ${alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} invoices`} />
                <ImpactChip icon="├" label={`Affects ${alert.impact_analysis.journal_entries} journal entries`} />
                {alert.impact_analysis.vat_report_affected && (
                  <ImpactChip icon="└" label="Affects VAT report" />
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{alert.affected_module}</Badge>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5">{changeTypeLabel(alert.change_type)}</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApprovalRow({ alert, index, onApprove, onReject, onView }: { 
  alert: SystemChangeAlert; index: number; onApprove: () => void; onReject: () => void; onView: () => void 
}) {
  const num = String(alerts?.length ? alerts.length - index : index + 1).padStart(3, '0');
  return (
    <div className="p-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <SeverityDot severity={alert.severity} />
        <span className="text-[10px] text-muted-foreground font-mono">#{String(index + 1).padStart(3, '0')}</span>
        <span className="text-[10px] text-muted-foreground mr-auto">
          {new Date(alert.created_at).toLocaleString('ar-SA', { timeStyle: 'short' })}
        </span>
      </div>
      <p className="text-xs font-bold text-foreground mb-1.5 pr-6">{alert.description}</p>
      
      {alert.impact_analysis && (
        <div className="space-y-0.5 mb-2 pr-6">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Affects {alert.impact_analysis.vat_report_affected ? 'VAT report' : alert.affected_module}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Affects {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} invoices
          </div>
        </div>
      )}

      <div className="flex gap-2 pr-6">
        <Button 
          size="sm" 
          className="h-7 text-xs gap-1 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" 
          onClick={onApprove}
        >
          <CheckCircle2 className="w-3 h-3" />
          Approve
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          className="h-7 text-xs gap-1 flex-1"
          onClick={onReject}
        >
          <XCircle className="w-3 h-3" />
          Reject
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={onView}
        >
          <Eye className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

function TimelineRow({ alert, onClick }: { alert: SystemChangeAlert; onClick: () => void }) {
  return (
    <div className="flex gap-4 group relative">
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

      <div className="flex-1 pb-4 cursor-pointer group-hover:bg-muted/30 rounded-lg p-2 -mt-1 transition-colors" onClick={onClick}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold">{alert.description}</span>
          {alert.status === 'pending' && (
            <Badge className="text-[9px] h-4 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
              Pending Approval
            </Badge>
          )}
          {alert.status === 'rejected' && (
            <Badge className="text-[9px] h-4 bg-destructive/10 text-destructive border-destructive/20">
              Rejected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {new Date(alert.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
          <Badge variant="outline" className="text-[9px] h-3.5 px-1">{alert.affected_module}</Badge>
          <Badge variant="outline" className="text-[9px] h-3.5 px-1">{changeTypeLabel(alert.change_type)}</Badge>
          {alert.impact_analysis && (
            <span>
              Affects {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} invoices · {alert.impact_analysis.journal_entries} entries
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-primary/40 mr-auto" />
        </div>
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  return (
    <div className={cn(
      'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold',
      severity === 'critical' ? 'bg-destructive/15 text-destructive' :
      severity === 'high' ? 'bg-destructive/10 text-destructive' :
      severity === 'medium' ? 'bg-amber-500/15 text-amber-600' :
      'bg-emerald-500/15 text-emerald-600'
    )}>
      {severity === 'critical' ? '!' : severity === 'high' ? '!' : severity === 'medium' ? '●' : '●'}
    </div>
  );
}

function RiskBadge({ severity }: { severity: string }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold',
      severity === 'critical' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
      severity === 'high' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
      severity === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        severity === 'critical' || severity === 'high' ? 'bg-destructive animate-pulse' :
        severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
      )} />
      {severity === 'critical' ? 'حرج' : severity === 'high' ? 'عالي' : severity === 'medium' ? 'متوسط' : 'منخفض'}
    </div>
  );
}

function ImpactChip({ icon, label }: { icon?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      {icon && <span className="opacity-40 font-mono">{icon}</span>}
      {label}
    </span>
  );
}

function ImpactCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function changeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    code_change: '💻 Code',
    accounting_logic: '📊 Accounting',
    tax_calculation: '🏛️ Tax',
    system_config: '⚙️ Settings',
    database_structure: '🗃️ Database',
    config_change: '⚙️ Config',
  };
  return labels[type] || type;
}
