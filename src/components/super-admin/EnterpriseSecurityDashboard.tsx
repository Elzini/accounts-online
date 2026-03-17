import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Shield, Snowflake, UserCheck, FileCode, Activity as ActivityIcon, 
  Cpu, Lock, Clock, ShieldAlert, Eye, Database, Fingerprint,
  CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  Zap, FileText, BarChart3, Settings,
  RefreshCw, Search, CheckCheck, X
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

function getSeverity(alert: SystemChangeAlert): string {
  if (!alert.impact_analysis) return 'low';
  const total = alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices + alert.impact_analysis.journal_entries;
  if (total > 100 || alert.impact_analysis.vat_reports_impact !== 'none') return 'high';
  if (total > 20) return 'medium';
  return 'low';
}

function changeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    code_change: 'Code Change', accounting_logic: 'Accounting', tax_calculation: 'Tax Calculation',
    system_config: 'System Config', database_structure: 'Database', config_change: 'Config Change',
  };
  return labels[type] || type;
}

export function EnterpriseSecurityDashboard() {
  const { 
    alerts, pendingAlerts, approvedAlerts, rejectedAlerts,
    isFrozen, securityStatus, approveAlert, rejectAlert
  } = useSystemChangeAlerts();

  const [selectedAlert, setSelectedAlert] = useState<SystemChangeAlert | null>(null);
  const [drillView, setDrillView] = useState<string | null>(null);
  const [simulationAlert, setSimulationAlert] = useState<SystemChangeAlert | null>(null);

  const liveAlerts = useMemo(() => alerts.slice(0, 20), [alerts]);

  // Compute system risk
  const systemRisk = useMemo(() => {
    if (pendingAlerts.length === 0) return { level: 'LOW', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    const hasHigh = pendingAlerts.some(a => getSeverity(a) === 'high');
    if (hasHigh) return { level: 'HIGH', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
    return { level: 'MEDIUM', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
  }, [pendingAlerts]);

  const highestAlert = pendingAlerts[0];
  const riskReasons = useMemo(() => {
    if (!highestAlert?.impact_analysis) return [];
    const reasons: string[] = [];
    if (highestAlert.change_type.includes('tax')) reasons.push('Tax logic changed');
    else reasons.push(changeTypeLabel(highestAlert.change_type) + ' changed');
    const inv = highestAlert.impact_analysis.sales_invoices + highestAlert.impact_analysis.purchase_invoices;
    if (inv > 0) reasons.push(`${inv} invoices affected`);
    return reasons;
  }, [highestAlert]);

  // Drill-down views
  if (drillView) {
    return (
      <div dir="rtl" className="space-y-4">
        <Button variant="ghost" className="gap-2" onClick={() => setDrillView(null)}>← العودة لمركز التحكم الأمني</Button>
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
    <div dir="rtl" className="rounded-2xl bg-[#12151a] p-4 space-y-4 min-h-[700px]">
      
      {/* ═══════ HEADER ═══════ */}
      <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold text-[#e8eaed]">Threat Control Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDrillView('freeze')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
            <span className="w-2 h-2 rounded-full bg-green-300" /> Freeze Now
          </button>
          <button onClick={() => setDrillView('change-log')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#2a2f3a] hover:bg-[#353b48] text-[#c8ccd4] border border-[#3a4050] transition-colors">
            <Search className="w-4 h-4" /> Investigate
          </button>
          <button 
            onClick={() => pendingAlerts.forEach(a => approveAlert.mutate({ id: a.id }))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#2a2f3a] hover:bg-[#353b48] text-[#c8ccd4] border border-[#3a4050] transition-colors"
          >
            <CheckCheck className="w-4 h-4" /> Approve All
          </button>
          <button className="p-2 rounded-lg hover:bg-[#2a2f3a] text-[#5f6672] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ═══════ RISK LEVEL BANNER ═══════ */}
      <div className={cn('rounded-xl border p-4 flex items-center justify-between flex-wrap gap-4', systemRisk.bg, systemRisk.border)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1a1e26] flex items-center justify-center">
            {systemRisk.level === 'HIGH' ? <AlertTriangle className="w-7 h-7 text-red-400" /> :
             systemRisk.level === 'MEDIUM' ? <ShieldAlert className="w-7 h-7 text-amber-400" /> :
             <ShieldCheck className="w-7 h-7 text-emerald-400" />}
          </div>
          <div>
            <p className="text-[#8b919e] text-sm">SYSTEM RISK LEVEL: <span className={cn('font-black text-lg', systemRisk.color)}>{systemRisk.level}</span></p>
            {riskReasons.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-[#5f6672]">Reason:</span>
                {riskReasons.map((r, i) => (
                  <span key={i} className="text-xs text-[#8b919e]">• {r}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {riskReasons.length > 0 && (
            <div className="text-right">
              <p className={cn('text-sm font-semibold', systemRisk.color)}>Reason:</p>
              {riskReasons.map((r, i) => <p key={i} className="text-xs text-[#8b919e]">• {r}</p>)}
            </div>
          )}
          {pendingAlerts.length > 0 && (
            <button className="px-4 py-2 rounded-lg bg-sky-600/20 border border-sky-500/30 text-sky-400 text-sm font-bold hover:bg-sky-600/30 transition-colors">
              {pendingAlerts.length} Safe ›
            </button>
          )}
        </div>
      </div>

      {/* ═══════ MAIN LAYOUT: 3 Columns ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── LEFT+CENTER: Decision Cards (8 cols) ── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Decision Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CHANGE DETECTED */}
            <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-[#e8eaed]">CHANGE DETECTED</h4>
              </div>
              {pendingAlerts.length > 0 ? pendingAlerts.slice(0, 2).map(alert => {
                const sev = getSeverity(alert);
                return (
                  <div key={alert.id} className="rounded-lg bg-[#22272f] border border-[#2d3340] p-3 mb-2">
                    <p className="text-xs font-bold text-[#e8eaed] mb-1">{alert.description}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded',
                      sev === 'high' ? 'bg-red-500/20 text-red-400' : sev === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>{sev.toUpperCase()} Risk</span>
                    {alert.impact_analysis && (
                      <div className="mt-2 space-y-0.5">
                        <p className="text-[11px] text-[#8b919e] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} Invoices
                        </p>
                        {alert.impact_analysis.vat_reports_impact !== 'none' && (
                          <p className="text-[11px] text-[#8b919e] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> VAT Report
                          </p>
                        )}
                        <p className="text-[11px] text-[#8b919e] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Journal Entries
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => rejectAlert.mutate({ id: alert.id })} className="flex-1 h-7 rounded text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white transition-colors">Reject</button>
                      <button onClick={() => approveAlert.mutate({ id: alert.id })} className="flex-1 h-7 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1 transition-colors">
                        Approve <Search className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-xs text-[#5f6672] text-center py-6">No pending changes</p>
              )}
            </div>

            {/* SIMULATION */}
            <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-[#e8eaed]">SIMULATION</h4>
              </div>
              {pendingAlerts.length > 0 ? pendingAlerts.slice(0, 2).map(alert => {
                const sev = getSeverity(alert);
                return (
                  <div key={alert.id} className="rounded-lg bg-[#22272f] border border-[#2d3340] p-3 mb-2">
                    <p className="text-xs font-bold text-[#e8eaed] mb-1">{changeTypeLabel(alert.change_type)}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded',
                      sev === 'high' ? 'bg-red-500/20 text-red-400' : sev === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    )}>{sev.toUpperCase()}</span>
                    {alert.impact_analysis && (
                      <p className="text-[11px] text-[#8b919e] mt-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} Invoices
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => rejectAlert.mutate({ id: alert.id })} className="flex-1 h-7 rounded text-[11px] font-bold bg-red-600 hover:bg-red-700 text-white transition-colors">Reject</button>
                      <button onClick={() => setSimulationAlert(alert)} className="flex-1 h-7 rounded text-[11px] font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1 transition-colors">
                        Simulate <Search className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-xs text-[#5f6672] text-center py-6">No simulations available</p>
              )}
            </div>

            {/* DECISION CLEARED */}
            <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-[#e8eaed]">DECISION CLEARED</h4>
              </div>
              {[...approvedAlerts, ...rejectedAlerts].slice(0, 3).map(alert => (
                <div key={alert.id} className="rounded-lg bg-[#22272f] border border-[#2d3340] p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    {alert.status === 'approved' 
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    <p className="text-xs font-bold text-[#e8eaed]">{alert.description}</p>
                  </div>
                  <p className="text-[10px] text-[#5f6672]">{alert.status === 'approved' ? 'Approved' : 'Rejected'} • {new Date(alert.updated_at).toLocaleString('ar-SA', { timeStyle: 'short' })}</p>
                </div>
              ))}
              {approvedAlerts.length === 0 && rejectedAlerts.length === 0 && (
                <p className="text-xs text-[#5f6672] text-center py-6">No decisions yet</p>
              )}
            </div>
          </div>

          {/* ═══════ AUDIT LOG TIMELINE ═══════ */}
          <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8b919e]" />
                <h4 className="text-base font-bold text-[#e8eaed]">Audit Log Timeline</h4>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded hover:bg-[#2a2f3a] text-[#5f6672] transition-colors"><RefreshCw className="w-4 h-4" /></button>
                <button onClick={() => setDrillView('change-log')} className="text-xs text-[#8b919e] hover:text-[#c8ccd4] transition-colors">عرض الكل</button>
              </div>
            </div>
            <div className="space-y-0">
              {alerts.slice(0, 6).map((alert, i) => {
                const sev = getSeverity(alert);
                const sevLabel = sev === 'high' ? 'RED' : sev === 'medium' ? 'REMED' : 'SAFE';
                const sevLabelColor = sev === 'high' ? 'bg-red-500 text-white' : sev === 'medium' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white';
                const dotColor = sev === 'high' ? 'bg-red-400' : sev === 'medium' ? 'bg-amber-400' : 'bg-emerald-400';
                const time = new Date(alert.created_at);
                return (
                  <div key={alert.id} className="flex items-start gap-3 py-2.5 hover:bg-[#22272f] rounded-lg px-2 cursor-pointer transition-colors" onClick={() => setSelectedAlert(alert)}>
                    <div className={cn('w-2.5 h-2.5 rounded-full mt-1.5 shrink-0', dotColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-[#5f6672] font-mono">{time.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', sevLabelColor)}>{sevLabel}</span>
                        <span className="text-xs font-bold text-[#e8eaed]">#{String(alerts.length - i).padStart(3, '0')} - {alert.description}</span>
                        <span className="text-[10px] text-[#5f6672] mr-auto">
                          {time.toLocaleString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                        <span className={cn('w-2 h-2 rounded-full', dotColor)} />
                      </div>
                      {alert.impact_analysis && (
                        <p className="text-[10px] text-[#5f6672] mt-0.5">
                          <span className="text-[#5f6672]">▸</span> Affect {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} Invoices · {alert.impact_analysis.vat_reports_impact !== 'none' ? 'VAT Report · ' : ''}{alert.affected_module}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {alerts.length === 0 && <p className="text-center py-8 text-[#5f6672] text-sm">No events recorded</p>}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR (4 cols) ── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Risk Insight */}
          <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#e8eaed]">Risk Insight</h4>
              <button className="text-[#5f6672] hover:text-[#8b919e] transition-colors"><Settings className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] text-[#5f6672] mb-3">Smart Log Timeline</p>
            <ScrollArea className="h-[260px]">
              <div className="space-y-2">
                {alerts.slice(0, 8).map((alert) => {
                  const sev = getSeverity(alert);
                  const sevLabel = sev === 'high' ? 'CRITICAL' : sev === 'medium' ? 'WARNING' : 'SAFE';
                  const sevColor = sev === 'high' ? 'text-red-400' : sev === 'medium' ? 'text-amber-400' : 'text-emerald-400';
                  const sevIcon = sev === 'high' ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : sev === 'medium' ? <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
                  const cardBorder = sev === 'high' ? 'border-r-red-500' : sev === 'medium' ? 'border-r-amber-500' : 'border-r-emerald-500';
                  return (
                    <div key={alert.id} className={cn('rounded-lg bg-[#22272f] border border-[#2d3340] border-r-4 p-3', cardBorder)}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {sevIcon}
                          <span className={cn('text-[10px] font-bold', sevColor)}>{sevLabel}</span>
                        </div>
                        <span className="text-[9px] text-[#5f6672]">{new Date(alert.created_at).toLocaleString('en', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                      </div>
                      <p className="text-xs font-semibold text-[#e8eaed] mb-1">{alert.description}</p>
                      {alert.impact_analysis && (
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-[#8b919e] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-400" />
                            Affects {alert.impact_analysis.sales_invoices + alert.impact_analysis.purchase_invoices} invoices
                          </p>
                          {alert.impact_analysis.vat_reports_impact !== 'none' && (
                            <p className="text-[10px] text-[#8b919e] flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-amber-400" />
                              Affects VAT invoices
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Quick Lock */}
          <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#e8eaed]">Quick Lock</h4>
              <button className="text-[#5f6672] hover:text-[#8b919e] transition-colors"><Settings className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setDrillView('period-lock')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-600/30 transition-colors">
                <Lock className="w-3.5 h-3.5" /> Lock Invoices
              </button>
              <button onClick={() => setDrillView('period-lock')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-600/30 transition-colors">
                <Lock className="w-3.5 h-3.5" /> Lock Tax
              </button>
              <button onClick={() => setDrillView('freeze')} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-600/30 transition-colors">
                <Lock className="w-3.5 h-3.5" /> Lock Database
              </button>
            </div>
          </div>

          {/* Sidebar Audit Log */}
          <div className="rounded-xl bg-[#1a1e26] border border-[#2a2f3a] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8b919e]" />
                <h4 className="text-sm font-bold text-[#e8eaed]">Audit Log Timeline</h4>
              </div>
              <button className="text-[#5f6672] hover:text-[#8b919e] transition-colors"><Settings className="w-4 h-4" /></button>
            </div>
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-start gap-2 py-2 border-t border-[#2a2f3a]" onClick={() => setSelectedAlert(alert)}>
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#e8eaed]">#{String(alerts.indexOf(alert) + 1).padStart(3, '0')} - {alert.description}</p>
                  <p className="text-[10px] text-[#5f6672]">• {alert.affected_module}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ SIMULATION MODAL ═══════ */}
      <Dialog open={!!simulationAlert} onOpenChange={() => setSimulationAlert(null)}>
        <DialogContent className="sm:max-w-md bg-[#1e2229] border-[#2d3340] text-[#e8eaed]" dir="ltr">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#e8eaed]">SIMULATION</DialogTitle>
            <p className="text-sm text-[#8b919e]">Preview All Impacts</p>
          </DialogHeader>
          {simulationAlert?.impact_analysis && (
            <div className="space-y-4">
              {/* Before / After Table */}
              <div className="rounded-lg border border-[#2d3340] overflow-hidden">
                <div className="grid grid-cols-3 bg-[#22272f] px-4 py-2 border-b border-[#2d3340]">
                  <span className="text-xs font-bold text-[#8b919e]"></span>
                  <span className="text-xs font-bold text-[#8b919e] text-center">BEFORE</span>
                  <span className="text-xs font-bold text-[#8b919e] text-center">AFTER</span>
                </div>
                <SimRow label="Invoice Total" before={1000000} impact={simulationAlert.impact_analysis.sales_invoices * -1000} />
                <SimRow label="VAT" before={150000} impact={simulationAlert.impact_analysis.sales_invoices * -150} />
                <div className="grid grid-cols-3 px-4 py-2 border-t border-[#2d3340]">
                  <span className="text-xs text-[#8b919e]">Journal Entries</span>
                  <span className="text-xs text-[#8b919e] text-center"></span>
                  <span className="text-sm font-bold text-red-400 text-center">-{simulationAlert.impact_analysis.journal_entries}</span>
                </div>
              </div>
              {/* Total Impact */}
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#22272f] border border-[#2d3340]">
                <span className="text-sm text-[#8b919e]">Total Impact</span>
                <span className="text-xl font-black text-red-400">
                  -{((simulationAlert.impact_analysis.sales_invoices * 1000) + (simulationAlert.impact_analysis.sales_invoices * 150) + (simulationAlert.impact_analysis.journal_entries * 100)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => { if (simulationAlert) approveAlert.mutate({ id: simulationAlert.id }); setSimulationAlert(null); }}
              className="flex-1 h-10 rounded-lg text-sm font-bold bg-[#2a3040] hover:bg-[#353f55] text-[#c8ccd4] border border-[#3a4050] transition-colors"
            >
              Approve Change
            </button>
            <button
              onClick={() => { if (simulationAlert) rejectAlert.mutate({ id: simulationAlert.id }); setSimulationAlert(null); }}
              className="flex-1 h-10 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Reject Change
            </button>
          </DialogFooter>
          <div className="flex items-center gap-2 text-[10px] text-[#5f6672] justify-center">
            <Lock className="w-3 h-3" />
            Auto-lock prevents any changes during simulation.
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════ Detail Sheet ═══════ */}
      <Sheet open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
        <SheetContent side="left" className="w-[600px] sm:max-w-[600px] overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> تفاصيل التغيير
            </SheetTitle>
          </SheetHeader>
          {selectedAlert && <div className="mt-4"><SystemChangeDetailView alert={selectedAlert} /></div>}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SimRow({ label, before, impact }: { label: string; before: number; impact: number }) {
  const after = before + impact;
  return (
    <div className="grid grid-cols-3 px-4 py-2 border-b border-[#2d3340]">
      <span className="text-xs text-[#8b919e]">{label}</span>
      <span className="text-sm text-[#c8ccd4] text-center">{before.toLocaleString()}</span>
      <div className="text-center">
        <span className="text-sm text-[#c8ccd4]">→ {after.toLocaleString()}</span>
        <span className="text-xs text-red-400 ml-2">{impact.toLocaleString()}</span>
      </div>
    </div>
  );
}
