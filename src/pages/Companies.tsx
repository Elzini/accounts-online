/**
 * Companies Page - Slim Orchestrator
 * Super Admin dashboard with modular tab components.
 */
import { Building2, Users, PanelLeft, DollarSign, Shield, LogOut, ArrowRight, Settings, LogIn, BookOpen, FileBarChart, Cog, Globe, Activity, BarChart3, Package, Monitor, Headphones, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import defaultLogo from '@/assets/logo.png';

// Sub-components
import { LoginSettingsAdmin } from '@/components/LoginSettingsAdmin';
import { AllUsersManagement } from '@/components/super-admin/AllUsersManagement';
import { CompaniesReport } from '@/components/super-admin/CompaniesReport';
import { DefaultCompanySettings } from '@/components/super-admin/DefaultCompanySettings';
import { SystemLabelsManagement } from '@/components/super-admin/SystemLabelsManagement';
import { SubdomainManagement } from '@/components/super-admin/SubdomainManagement';
import { CompanyAdminDashboard } from '@/components/super-admin/CompanyAdminDashboard';
import { SaaSExecutiveDashboard } from '@/components/super-admin/SaaSExecutiveDashboard';
import { PlansManagement } from '@/components/super-admin/PlansManagement';
import { RevenueControl } from '@/components/super-admin/RevenueControl';
import { SystemControlCenter } from '@/components/super-admin/SystemControlCenter';
import { EnterpriseSecurityDashboard } from '@/components/super-admin/EnterpriseSecurityDashboard';
import { SystemMonitoring } from '@/components/super-admin/SystemMonitoring';
import { SupportCenter } from '@/components/super-admin/SupportCenter';
import { RBACManagement } from '@/components/super-admin/RBACManagement';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { SecurityMonitoringDashboard } from '@/components/security/SecurityMonitoringDashboard';
import { AccountingHealthDashboard } from '@/components/security/AccountingHealthDashboard';
import { MenuConfigurationTab } from '@/components/control-center/tabs/MenuConfigurationTab';
import { SensitiveOperationsLog } from '@/components/super-admin/SensitiveOperationsLog';
import { CompanyPerformanceComparison } from '@/components/super-admin/CompanyPerformanceComparison';
import { CentralSmartAlerts } from '@/components/super-admin/CentralSmartAlerts';
import { BackupManagementPanel } from '@/components/super-admin/BackupManagementPanel';

// Modular page components
import { useCompaniesData } from './companies/useCompaniesData';
import { CompaniesTabContent } from './companies/CompaniesTabContent';
import { CompanyDialogs } from './companies/CompanyDialogs';

export default function Companies() {
  const { permissions, signOut, user } = useAuth();
  const navigate = useNavigate();
  const hook = useCompaniesData();
  const { headerLogoUrl, headerLogoLoaded, isLoading } = hook;

  if (!permissions.super_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-12 text-center bg-background">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">غير مصرح</h2>
        <p className="text-muted-foreground">هذه الصفحة متاحة فقط لمدير النظام</p>
        <Button onClick={() => navigate('/')} className="mt-4">العودة للرئيسية</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {headerLogoLoaded ? (
              <img src={headerLogoUrl || defaultLogo} alt="شعار النظام" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }} />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
            )}
            <div><h1 className="font-bold text-lg text-foreground">إدارة الشركات</h1><p className="text-xs text-muted-foreground">لوحة تحكم مدير النظام</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/')} className="gap-2"><ArrowRight className="w-4 h-4" />العودة للوحة التحكم</Button>
            <p className="text-sm text-muted-foreground hidden sm:block">{user?.email}</p>
            <Button variant="ghost" onClick={signOut} className="gap-2"><LogOut className="w-4 h-4" /><span className="hidden sm:inline">خروج</span></Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="executive-dashboard" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="executive-dashboard" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /><span>لوحة المؤشرات</span></TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2"><Building2 className="w-4 h-4" /><span>الشركات</span></TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2"><Package className="w-4 h-4" /><span>الباقات</span></TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2"><DollarSign className="w-4 h-4" /><span>الإيرادات</span></TabsTrigger>
            <TabsTrigger value="system-control" className="flex items-center gap-2"><Settings className="w-4 h-4" /><span>التحكم</span></TabsTrigger>
            <TabsTrigger value="enterprise-security" className="flex items-center gap-2"><Shield className="w-4 h-4" /><span>الأمان المؤسسي</span></TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2"><Monitor className="w-4 h-4" /><span>المراقبة</span></TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2"><Headphones className="w-4 h-4" /><span>الدعم</span></TabsTrigger>
            <TabsTrigger value="rbac" className="flex items-center gap-2"><Lock className="w-4 h-4" /><span>الصلاحيات</span></TabsTrigger>
            <TabsTrigger value="security-2fa" className="flex items-center gap-2"><Shield className="w-4 h-4" /><span>الأمان</span></TabsTrigger>
            <TabsTrigger value="admin-dashboard" className="flex items-center gap-2"><Activity className="w-4 h-4" /><span>الإدارة</span></TabsTrigger>
            <TabsTrigger value="subdomains" className="flex items-center gap-2"><Globe className="w-4 h-4" /><span>النطاقات</span></TabsTrigger>
            <TabsTrigger value="all-users" className="flex items-center gap-2"><Users className="w-4 h-4" /><span>المستخدمين</span></TabsTrigger>
            <TabsTrigger value="menu-config" className="flex items-center gap-2"><PanelLeft className="w-4 h-4" /><span>القائمة</span></TabsTrigger>
            <TabsTrigger value="system-labels" className="flex items-center gap-2"><Cog className="w-4 h-4" /><span>المسميات</span></TabsTrigger>
            <TabsTrigger value="default-settings" className="flex items-center gap-2"><Cog className="w-4 h-4" /><span>الإعدادات</span></TabsTrigger>
            <TabsTrigger value="accounting-health" className="flex items-center gap-2"><Activity className="w-4 h-4" /><span>صحة النظام</span></TabsTrigger>
            <TabsTrigger value="sensitive-ops" className="flex items-center gap-2"><Shield className="w-4 h-4" /><span>العمليات الحساسة</span></TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /><span>أداء الشركات</span></TabsTrigger>
            <TabsTrigger value="central-alerts" className="flex items-center gap-2"><Activity className="w-4 h-4" /><span>التنبيهات</span></TabsTrigger>
            <TabsTrigger value="backup-mgmt" className="flex items-center gap-2"><Monitor className="w-4 h-4" /><span>النسخ الاحتياطية</span></TabsTrigger>
            <TabsTrigger value="report" className="flex items-center gap-2"><FileBarChart className="w-4 h-4" /><span>التقرير</span></TabsTrigger>
            <TabsTrigger value="login-settings" className="flex items-center gap-2"><LogIn className="w-4 h-4" /><span>شاشة الدخول</span></TabsTrigger>
          </TabsList>

          <TabsContent value="executive-dashboard"><SaaSExecutiveDashboard /></TabsContent>
          <TabsContent value="companies"><CompaniesTabContent hook={hook} /></TabsContent>
          <TabsContent value="plans"><PlansManagement /></TabsContent>
          <TabsContent value="revenue"><RevenueControl /></TabsContent>
          <TabsContent value="enterprise-security"><EnterpriseSecurityDashboard /></TabsContent>
          <TabsContent value="system-control"><SystemControlCenter /></TabsContent>
          <TabsContent value="monitoring"><SystemMonitoring /><div className="mt-6"><AccountingHealthDashboard /></div><div className="mt-6"><SecurityMonitoringDashboard /></div></TabsContent>
          <TabsContent value="support"><SupportCenter /></TabsContent>
          <TabsContent value="rbac"><RBACManagement /></TabsContent>
          <TabsContent value="security-2fa"><div className="space-y-6"><div><h2 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> المصادقة الثنائية (2FA)</h2><p className="text-muted-foreground">تفعيل وإدارة المصادقة الثنائية لحساب السوبر أدمن</p></div><TwoFactorSetup /><SecurityMonitoringDashboard /></div></TabsContent>
          <TabsContent value="admin-dashboard"><CompanyAdminDashboard /></TabsContent>
          <TabsContent value="subdomains"><SubdomainManagement /></TabsContent>
          <TabsContent value="menu-config"><MenuConfigurationTab /></TabsContent>
          <TabsContent value="system-labels"><SystemLabelsManagement /></TabsContent>
          <TabsContent value="default-settings"><DefaultCompanySettings /></TabsContent>
          <TabsContent value="accounting-health"><AccountingHealthDashboard /></TabsContent>
          <TabsContent value="sensitive-ops"><SensitiveOperationsLog /></TabsContent>
          <TabsContent value="performance"><CompanyPerformanceComparison /></TabsContent>
          <TabsContent value="central-alerts"><CentralSmartAlerts /></TabsContent>
          <TabsContent value="backup-mgmt"><BackupManagementPanel /></TabsContent>
          <TabsContent value="report"><CompaniesReport /></TabsContent>
          <TabsContent value="all-users"><AllUsersManagement /></TabsContent>
          <TabsContent value="login-settings"><div className="space-y-6"><div><h2 className="text-3xl font-bold text-foreground flex items-center gap-3"><LogIn className="w-8 h-8 text-primary" />إعدادات شاشة الدخول والتسجيل</h2><p className="text-muted-foreground mt-1">تخصيص مظهر صفحات الدخول وتسجيل الشركات الجديدة</p></div><LoginSettingsAdmin /></div></TabsContent>
        </Tabs>
      </main>

      <CompanyDialogs hook={hook} />
    </div>
  );
}
