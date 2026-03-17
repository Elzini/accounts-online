import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, Snowflake, UserCheck, FileCode, Activity as ActivityIcon, 
  Cpu, Lock, Clock, ShieldAlert, Eye, Database, Fingerprint, Bell,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp
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
import { SystemChangeAuditLog } from '@/components/system-alerts/SystemChangeAuditLog';
import { useSystemChangeAlerts } from '@/hooks/useSystemChangeAlerts';
import { cn } from '@/lib/utils';

const tabs = [
  { value: 'overview', label: 'نظرة عامة', icon: Shield, color: 'text-primary' },
  { value: 'freeze', label: 'التجميد', icon: Snowflake, color: 'text-sky-600' },
  { value: 'two-person', label: 'الموافقة الثنائية', icon: UserCheck, color: 'text-violet-600' },
  { value: 'code-integrity', label: 'سلامة الكود', icon: FileCode, color: 'text-blue-600' },
  { value: 'incidents', label: 'الحوادث', icon: ShieldAlert, color: 'text-destructive' },
  { value: 'engine-versions', label: 'نسخ المحرك', icon: Cpu, color: 'text-emerald-600' },
  { value: 'period-lock', label: 'قفل الفترات', icon: Lock, color: 'text-amber-600' },
  { value: 'time-machine', label: 'آلة الزمن', icon: Clock, color: 'text-indigo-600' },
  { value: 'audit-log', label: 'سجل التغييرات', icon: ActivityIcon, color: 'text-teal-600' },
  { value: 'impact', label: 'تحليل الأثر', icon: Eye, color: 'text-orange-600' },
  { value: 'backups', label: 'النسخ الاحتياطي', icon: Database, color: 'text-cyan-600' },
  { value: 'tamper-detector', label: 'كاشف التلاعب', icon: Fingerprint, color: 'text-rose-600' },
  { value: 'change-alerts', label: 'تنبيهات التغييرات', icon: Bell, color: 'text-purple-600' },
  { value: '2fa', label: 'المصادقة الثنائية', icon: Lock, color: 'text-green-600' },
];

export function EnterpriseSecurityDashboard() {
  const { pendingAlerts, approvedAlerts, rejectedAlerts, alerts, isFrozen, securityStatus } = useSystemChangeAlerts();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div dir="rtl" className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/15 p-6">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary))_1px,transparent_1px)] bg-[length:24px_24px]" />
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">لوحة الأمان المؤسسي</h2>
              <p className="text-sm text-muted-foreground mt-0.5">حماية مؤسسية متعددة المستويات — تجميد، تفويض ثنائي، مراقبة، تدقيق</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-3">
            <QuickStat icon={<AlertTriangle className="w-4 h-4" />} value={pendingAlerts.length} label="معلقة" variant="warning" />
            <QuickStat icon={<CheckCircle2 className="w-4 h-4" />} value={approvedAlerts.length} label="مقبولة" variant="success" />
            <QuickStat icon={<XCircle className="w-4 h-4" />} value={rejectedAlerts.length} label="مرفوضة" variant="danger" />
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-sm',
              securityStatus === 'normal' ? 'bg-emerald-500/10 border-emerald-200 text-emerald-700' :
              securityStatus === 'frozen' ? 'bg-sky-500/10 border-sky-200 text-sky-700' :
              'bg-amber-500/10 border-amber-200 text-amber-700'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full animate-pulse',
                securityStatus === 'normal' ? 'bg-emerald-500' :
                securityStatus === 'frozen' ? 'bg-sky-500' : 'bg-amber-500'
              )} />
              <span className="text-xs font-bold">
                {securityStatus === 'normal' ? 'طبيعي' : securityStatus === 'frozen' ? 'مجمّد' : 'تحذير'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
        <div className="relative">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1.5 bg-muted/50 rounded-xl border border-border/50">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value} 
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg text-xs transition-all data-[state=active]:shadow-sm',
                    isActive && 'data-[state=active]:bg-background'
                  )}
                >
                  <TabIcon className={cn('w-3.5 h-3.5', isActive ? tab.color : 'text-muted-foreground')} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.value === 'change-alerts' && pendingAlerts.length > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-[9px] px-1 h-4 min-w-[16px] animate-pulse">
                      {pendingAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <div className="mt-5">
          <TabsContent value="overview"><ProtectionStatusPanel /></TabsContent>
          <TabsContent value="freeze"><FreezeModePanel /></TabsContent>
          <TabsContent value="two-person"><TwoPersonApprovalPanel /></TabsContent>
          <TabsContent value="code-integrity"><CodeIntegrityMonitor /></TabsContent>
          <TabsContent value="incidents"><SecurityIncidentsPanel /></TabsContent>
          <TabsContent value="engine-versions"><EngineVersionManager /></TabsContent>
          <TabsContent value="period-lock"><FinancialPeriodLockManager /></TabsContent>
          <TabsContent value="time-machine"><FinancialTimeMachine /></TabsContent>
          <TabsContent value="audit-log"><SystemChangeLogPanel /></TabsContent>
          <TabsContent value="impact"><ImpactAnalysisPanel /></TabsContent>
          <TabsContent value="backups"><BackupManagementPanel /></TabsContent>
          <TabsContent value="tamper-detector"><TamperDetectorPanel /></TabsContent>
          <TabsContent value="change-alerts"><SystemChangeAuditLog /></TabsContent>
          <TabsContent value="2fa"><TwoFactorSetup /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function QuickStat({ icon, value, label, variant }: { icon: React.ReactNode; value: number; label: string; variant: 'warning' | 'success' | 'danger' }) {
  const styles = {
    warning: 'bg-amber-500/10 border-amber-200/60 text-amber-700',
    success: 'bg-emerald-500/10 border-emerald-200/60 text-emerald-700',
    danger: 'bg-destructive/10 border-destructive/20 text-destructive',
  };
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border', styles[variant])}>
      {icon}
      <div className="text-center">
        <div className="text-lg font-bold leading-tight">{value}</div>
        <div className="text-[10px] opacity-70">{label}</div>
      </div>
    </div>
  );
}
