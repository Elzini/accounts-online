import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Snowflake, UserCheck, FileCode, Activity as ActivityIcon, Cpu, Lock, Clock, ShieldAlert, Eye, Database } from 'lucide-react';
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
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { BackupManagementPanel } from './BackupManagementPanel';

export function EnterpriseSecurityDashboard() {
  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">لوحة الأمان المؤسسي الشاملة</h2>
          <p className="text-sm text-muted-foreground">حماية مؤسسية متعددة المستويات - تجميد، تفويض ثنائي، مراقبة، تدقيق</p>
        </div>
      </div>

      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Shield className="w-4 h-4" /><span className="hidden sm:inline">نظرة عامة</span>
          </TabsTrigger>
          <TabsTrigger value="freeze" className="flex items-center gap-1">
            <Snowflake className="w-4 h-4" /><span className="hidden sm:inline">التجميد</span>
          </TabsTrigger>
          <TabsTrigger value="two-person" className="flex items-center gap-1">
            <UserCheck className="w-4 h-4" /><span className="hidden sm:inline">الموافقة الثنائية</span>
          </TabsTrigger>
          <TabsTrigger value="code-integrity" className="flex items-center gap-1">
            <FileCode className="w-4 h-4" /><span className="hidden sm:inline">سلامة الكود</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-1">
            <ShieldAlert className="w-4 h-4" /><span className="hidden sm:inline">الحوادث الأمنية</span>
          </TabsTrigger>
          <TabsTrigger value="engine-versions" className="flex items-center gap-1">
            <Cpu className="w-4 h-4" /><span className="hidden sm:inline">نسخ المحرك</span>
          </TabsTrigger>
          <TabsTrigger value="period-lock" className="flex items-center gap-1">
            <Lock className="w-4 h-4" /><span className="hidden sm:inline">قفل الفترات</span>
          </TabsTrigger>
          <TabsTrigger value="time-machine" className="flex items-center gap-1">
            <Clock className="w-4 h-4" /><span className="hidden sm:inline">آلة الزمن</span>
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="flex items-center gap-1">
            <ActivityIcon className="w-4 h-4" /><span className="hidden sm:inline">سجل التغييرات</span>
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center gap-1">
            <Eye className="w-4 h-4" /><span className="hidden sm:inline">تحليل الأثر</span>
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center gap-1">
            <Database className="w-4 h-4" /><span className="hidden sm:inline">النسخ الاحتياطي</span>
          </TabsTrigger>
          <TabsTrigger value="2fa" className="flex items-center gap-1">
            <Lock className="w-4 h-4" /><span className="hidden sm:inline">المصادقة الثنائية</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4"><ProtectionStatusPanel /></TabsContent>
        <TabsContent value="freeze" className="mt-4"><FreezeModePanel /></TabsContent>
        <TabsContent value="two-person" className="mt-4"><TwoPersonApprovalPanel /></TabsContent>
        <TabsContent value="code-integrity" className="mt-4"><CodeIntegrityMonitor /></TabsContent>
        <TabsContent value="incidents" className="mt-4"><SecurityIncidentsPanel /></TabsContent>
        <TabsContent value="engine-versions" className="mt-4"><EngineVersionManager /></TabsContent>
        <TabsContent value="period-lock" className="mt-4"><FinancialPeriodLockManager /></TabsContent>
        <TabsContent value="time-machine" className="mt-4"><FinancialTimeMachine /></TabsContent>
        <TabsContent value="audit-log" className="mt-4"><SystemChangeLogPanel /></TabsContent>
        <TabsContent value="impact" className="mt-4"><ImpactAnalysisPanel /></TabsContent>
        <TabsContent value="backups" className="mt-4"><BackupManagementPanel /></TabsContent>
        <TabsContent value="2fa" className="mt-4"><TwoFactorSetup /></TabsContent>
      </Tabs>
    </div>
  );
}
