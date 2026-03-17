import { useState, useMemo } from 'react';
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

// Dark theme wrapper classes
const dk = {
  bg: 'bg-[#1a1d23]',
  card: 'bg-[#22262e] border-[#2d3240]',
  cardHover: 'hover:bg-[#2a2e38]',
  text: 'text-[#e4e6ea]',
  textMuted: 'text-[#8b919e]',
  textDim: 'text-[#5f6672]',
  border: 'border-[#2d3240]',
  divider: 'divide-[#2d3240]',
};

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
    <div dir="rtl" className={cn('rounded-2xl p-4 space-y-4 min-h-[700px]', dk.bg)}>
      {/* ════════════ HEADER ════════════ */}
      <div className={cn('rounded-xl p-4 border flex items-center justify-between flex-wrap gap-3', dk.card)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center',
            securityStatus === 'frozen' ? 'bg-sky-500/20' :
            securityStatus === 'warning' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          )}>
            {securityStatus === 'frozen' 
              ? <Snowflake className="h-6 w-6 text-sky-400 animate-pulse" />
              : securityStatus === 'warning' 
              ? <ShieldAlert className="h-6 w-6 text-amber-400" />
              : <ShieldCheck className="h-6 w-6 text-emerald-400" />}
          </div>
          <h2 className={cn('text-xl font-bold', dk.text)}>Security Control Center</h2>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setDrillView('freeze')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Freeze System
          </button>
          <button
            onClick={() => setDrillView('freeze')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors', dk.border, dk.text, dk.cardHover)}
          >
            <RefreshCw className="w-4 h-4" />
            Unfreeze System
          </button>
          <button
            onClick={() => setDrillView('two-person')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors', dk.border, dk.text, dk.cardHover)}
          >
            <Settings className="w-4 h-4" />
            Security Settings
          </button>
        </div>
      </div>

      {/* ════════════ 3-Column Grid ════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ──── LEFT: System Health ──── */}
        <div className="lg:col-span-3">
          <div className={cn('rounded-xl border p-4 h-full', dk.card)}>
            <h3 className={cn('text-base font-bold mb-4', dk.text)}>System Health</h3>

            {/* Database Integrity */}
            <div className={cn('flex items-center justify-between p-3 rounded-lg mb-2 cursor-pointer transition-colors', dk.cardHover)} onClick={() => setDrillView('tamper')}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', dk.text)}>Database<br/>Integrity</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={dk.textDim}>●</span>
                <span className="text-sm font-bold text-emerald-400">OK</span>
              </div>
            </div>

            {/* Code Status */}
            <div className={cn('flex items-center justify-between p-3 rounded-lg mb-2 cursor-pointer transition-colors', dk.cardHover)} onClick={() => setDrillView('code-integrity')}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', dk.text)}>Code Status</p>
                  <p className="text-xs text-amber-400 font-medium">Locked</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">LOCK</span>
            </div>

            {/* Pending Changes */}
            <div className={cn('flex items-center justify-between p-3 rounded-lg mb-2 cursor-pointer transition-colors', dk.cardHover)} onClick={() => setDrillView('change-log')}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', dk.text)}>Pending Changes</p>
                  <p className="text-2xl font-bold text-amber-400">{pendingAlerts.length}</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">{pendingAlerts.length}</span>
            </div>

            {/* Last Audit */}
            <div className={cn('flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors', dk.cardHover)} onClick={() => setDrillView('change-log')}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', dk.text)}>Last Audit</p>
                  <p className={cn('text-xs mt-0.5', dk.textMuted)}>{lastAuditTime}</p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* ──── CENTER: Live Alerts ──── */}
        <div className="lg:col-span-5">
          <div className={cn('rounded-xl border h-full', dk.card)}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                </div>
                <h3 className={cn('text-base font-bold', dk.text)}>Live Alerts</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('text-[11px]', dk.textMuted)}>
                  {alerts.length > 0 && new Date(alerts[0].created_at).toLocaleString('ar-SA', { timeStyle: 'short' })}
                </span>
                <ChevronDown className={cn('w-4 h-4', dk.textDim)} />
              </div>
            </div>
            <ScrollArea className="h-[500px]">
              <div className={cn('divide-y', dk.divider)}>
                {liveAlerts.length === 0 ? (
                  <div className="text-center py-20">
                    <ShieldCheck className={cn('w-12 h-12 mx-auto mb-3 opacity-20', dk.textDim)} />
                    <p className={cn('text-sm', dk.textMuted)}>لا توجد تنبيهات — النظام آمن</p>
                  </div>
                ) : liveAlerts.map((alert) => (
                  <DarkAlertRow 
                    key={alert.id} 
                    alert={alert} 
                    onView={() => setSelectedAlert(alert)} 
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* ──── RIGHT: Pending Approvals ──── */}
        <div className="lg:col-span-4">
          <div className={cn('rounded-xl border h-full', dk.card)}>
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className={cn('text-base font-bold', dk.text)}>Pending Approvals</h3>
              <ChevronDown className={cn('w-4 h-4', dk.textDim)} />
            </div>
            <ScrollArea className="h-[500px]">
              {pendingAlerts.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle2 className={cn('w-12 h-12 mx-auto mb-3 opacity-20', dk.textDim)} />
                  <p className={cn('text-sm', dk.textMuted)}>لا توجد موافقات معلقة</p>
                </div>
              ) : (
                <div className={cn('divide-y', dk.divider)}>
                  {pendingAlerts.map((alert, idx) => (
                    <DarkApprovalRow
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

              {/* Resolved */}
              {(approvedAlerts.length > 0 || rejectedAlerts.length > 0) && (
                <div className={cn('border-t px-4 py-3', dk.border)}>
                  {[...approvedAlerts, ...rejectedAlerts].slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center gap-2 py-1.5">
                      {a.status === 'approved'
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                      <span className={cn('text-xs truncate', dk.textMuted)}>{a.description}</span>
                      <span className={cn('text-[10px] mr-auto', dk.textDim)}>
                        {a.status === 'approved' ? 'Approved by Admin' : 'Rejected'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* ════════════ BOTTOM: Audit Timeline ════════════ */}
      <div className={cn('rounded-xl border p-4', dk.card)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className={cn('w-5 h-5', dk.textMuted)} />
            <h3 className={cn('text-base font-bold', dk.text)}>Audit Timeline</h3>
          </div>
          <div className="flex items-center gap-2">
            <button className={cn('p-1.5 rounded-lg transition-colors', dk.cardHover)}>
              <RefreshCw className={cn('w-4 h-4', dk.textDim)} />
            </button>
            <button className={cn('p-1.5 rounded-lg transition-colors', dk.cardHover)}>
              <Filter className={cn('w-4 h-4', dk.textDim)} />
            </button>
            <button 
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', dk.cardHover, dk.textMuted)}
              onClick={() => setDrillView('change-log')}
            >
              عرض الكل
            </button>
          </div>
        </div>

        <div className="relative">
          <div className={cn('absolute top-0 bottom-0 right-[15px] w-px', 'bg-[#2d3240]')} />
          <div className="space-y-0">
            {alerts.slice(0, 8).map((alert) => (
              <DarkTimelineRow key={alert.id} alert={alert} onClick={() => setSelectedAlert(alert)} />
            ))}
            {alerts.length === 0 && (
              <div className={cn('text-center py-10 text-sm', dk.textMuted)}>لا توجد أحداث مسجلة</div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════ Approval Confirmation Modal ════════════ */}
      <Dialog open={!!approvalModal} onOpenChange={() => setApprovalModal(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalModal?.action === 'approve' 
                ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                : <XCircle className="w-5 h-5 text-destructive" />}
              {approvalModal?.action === 'approve' ? 'تأكيد الموافقة على التغيير' : 'تأكيد رفض التغيير'}
            </DialogTitle>
            <DialogDescription>يرجى مراجعة تفاصيل التغيير وتأثيره قبل اتخاذ القرار</DialogDescription>
          </DialogHeader>

          {approvalModal && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">وصف التغيير</p>
                <p className="text-sm font-medium">{approvalModal.alert.description}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{approvalModal.alert.affected_module}</Badge>
                  <Badge variant="outline" className="text-[10px]">{changeTypeLabel(approvalModal.alert.change_type)}</Badge>
                </div>
              </div>

              {approvalModal.alert.impact_analysis && (
                <div className="rounded-xl border p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">تحليل الأثر المتوقع</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ImpactCard label="فواتير المبيعات" value={approvalModal.alert.impact_analysis.sales_invoices} icon={<FileText className="w-4 h-4" />} />
                    <ImpactCard label="فواتير المشتريات" value={approvalModal.alert.impact_analysis.purchase_invoices} icon={<FileText className="w-4 h-4" />} />
                    <ImpactCard label="القيود المحاسبية" value={approvalModal.alert.impact_analysis.journal_entries} icon={<BarChart3 className="w-4 h-4" />} />
                    <ImpactCard label="الأرصدة المتأثرة" value={approvalModal.alert.impact_analysis.account_balances_affected} icon={<TrendingUp className="w-4 h-4" />} />
                  </div>
                  {approvalModal.alert.impact_analysis.vat_reports_impact && approvalModal.alert.impact_analysis.vat_reports_impact !== 'none' && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">تقرير الضريبة سيتأثر</span>
                    </div>
                  )}
                  {approvalModal.alert.impact_analysis.trial_balance_impact && approvalModal.alert.impact_analysis.trial_balance_impact !== 'none' && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">ميزان المراجعة سيتأثر</span>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-xl border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">مستوى المخاطر</p>
                <RiskBadge severity={getSeverity(approvalModal.alert)} />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApprovalModal(null)}>إلغاء</Button>
            {approvalModal?.action === 'approve' ? (
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={confirmApproval} disabled={approveAlert.isPending}>
                <CheckCircle2 className="w-4 h-4" /> تأكيد الموافقة
              </Button>
            ) : (
              <Button variant="destructive" className="gap-2" onClick={confirmApproval} disabled={rejectAlert.isPending}>
                <XCircle className="w-4 h-4" /> تأكيد الرفض
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════ Detail Sheet ════════════ */}
      <Sheet open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <SheetContent side="left" className="w-[600px] sm:max-w-[600px] overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> تفاصيل التغيير
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

// ═══════════════════════════════════════
// Helper
// ═══════════════════════════════════════

function getSeverity(alert: SystemChangeAlert): string {
  if (!alert.impact_analysis) return 'low';
  const total = alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices + alert.impact_analysis.journal_entries;
  if (total > 100 || alert.impact_analysis.vat_reports_impact !== 'none') return 'high';
  if (total > 20) return 'medium';
  return 'low';
}

// ═══════════════════════════════════════
// Dark sub-components
// ═══════════════════════════════════════

function DarkAlertRow({ alert, onView }: { alert: SystemChangeAlert; onView: () => void }) {
  const sev = getSeverity(alert);
  const sevIcon = sev === 'high' ? '!' : sev === 'medium' ? 'C' : '✓';
  const sevColor = sev === 'high' ? 'bg-red-500/20 text-red-400' : sev === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400';

  return (
    <div className="px-4 py-3.5 hover:bg-[#2a2e38] cursor-pointer transition-colors" onClick={onView}>
      <div className="flex items-start gap-3">
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5', sevColor)}>
          {sevIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[#e4e6ea] truncate">{alert.description}</p>
            <span className="text-[10px] text-[#5f6672] shrink-0">
              {new Date(alert.created_at).toLocaleString('ar-SA', { timeStyle: 'short' })}
            </span>
          </div>
          {alert.impact_analysis && (
            <p className="text-xs text-[#8b919e] mt-1">
              {alert.change_type === 'tax_calculation' ? 'Tax calculation logic modified.' : alert.description}
            </p>
          )}
          {alert.impact_analysis && (
            <div className="mt-2 space-y-0.5">
              <p className="text-[11px] text-[#8b919e]">
                <span className="text-[#5f6672] font-mono mr-1">├</span>
                Affects {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} sales invoices
              </p>
              <p className="text-[11px] text-[#8b919e]">
                <span className="text-[#5f6672] font-mono mr-1">├</span>
                Affects {alert.impact_analysis.journal_entries} journal entries
              </p>
              {alert.impact_analysis.vat_reports_impact && alert.impact_analysis.vat_reports_impact !== 'none' && (
                <p className="text-[11px] text-[#8b919e]">
                  <span className="text-[#5f6672] font-mono mr-1">└</span>
                  Affects VAT report
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DarkApprovalRow({ alert, index, onApprove, onReject, onView }: {
  alert: SystemChangeAlert; index: number; onApprove: () => void; onReject: () => void; onView: () => void;
}) {
  const sev = getSeverity(alert);
  const sevColor = sev === 'high' ? 'text-amber-400' : sev === 'medium' ? 'text-amber-400' : 'text-blue-400';
  const sevIcon = sev === 'high' ? '⚠' : sev === 'medium' ? '#' : '○';

  return (
    <div className="px-4 py-3 hover:bg-[#2a2e38] transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('text-sm', sevColor)}>{sevIcon}</span>
        <span className="text-[11px] text-[#5f6672] font-mono">#{String(index + 1).padStart(3, '0')}</span>
        <span className="text-[10px] text-[#5f6672] mr-auto">
          {new Date(alert.created_at).toLocaleString('ar-SA', { timeStyle: 'short' })}
        </span>
      </div>
      
      <p className="text-xs font-bold text-[#e4e6ea] mb-1.5 pr-5">{alert.description}</p>
      
      {alert.impact_analysis && (
        <div className="space-y-0.5 mb-2.5 pr-5">
          <p className="text-[11px] text-[#8b919e] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            Affects {alert.impact_analysis.vat_reports_impact !== 'none' ? 'VAT report' : alert.affected_module}
          </p>
          <p className="text-[11px] text-[#8b919e] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            Affects {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} invoices
          </p>
        </div>
      )}

      <div className="flex gap-2 pr-5">
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(); }}
          className="flex-1 h-8 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
        >
          Approve
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onReject(); }}
          className="flex-1 h-8 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1 transition-colors"
        >
          <span className="w-1 h-1 rounded-full bg-white" />
          Reject
        </button>
      </div>
    </div>
  );
}

function DarkTimelineRow({ alert, onClick }: { alert: SystemChangeAlert; onClick: () => void }) {
  const statusColor = alert.status === 'approved' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' :
    alert.status === 'rejected' ? 'bg-red-500/20 border-red-500/40 text-red-400' :
    'bg-amber-500/20 border-amber-500/40 text-amber-400';

  const statusIcon = alert.status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
    alert.status === 'rejected' ? <XCircle className="w-3.5 h-3.5" /> :
    <AlertTriangle className="w-3.5 h-3.5" />;

  return (
    <div className="flex gap-4 group relative">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 border-2', statusColor)}>
        {statusIcon}
      </div>
      <div 
        className="flex-1 pb-4 cursor-pointer hover:bg-[#2a2e38] rounded-lg p-2 -mt-1 transition-colors" 
        onClick={onClick}
      >
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-xs font-bold text-[#e4e6ea]">{alert.description}</span>
          {alert.status === 'pending' && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-medium">Pending Approval</span>
          )}
          {alert.status === 'rejected' && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">Rejected</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[#5f6672] flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {new Date(alert.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#2d3240] text-[#8b919e] text-[9px]">{alert.affected_module}</span>
          <span className="px-1.5 py-0.5 rounded bg-[#2d3240] text-[#8b919e] text-[9px]">{changeTypeLabel(alert.change_type)}</span>
          {alert.impact_analysis && (
            <span className="text-[#8b919e]">
              Affects {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} invoices · {alert.impact_analysis.journal_entries} entries
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-[#3b82f6] mr-auto" />
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ severity }: { severity: string }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold',
      severity === 'high' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
      severity === 'medium' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' :
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        severity === 'high' ? 'bg-destructive animate-pulse' : severity === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
      )} />
      {severity === 'high' ? 'عالي' : severity === 'medium' ? 'متوسط' : 'منخفض'}
    </div>
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
