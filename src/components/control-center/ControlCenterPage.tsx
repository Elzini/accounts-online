import { 
  Settings2, 
  Database, 
  FileText, 
  PanelLeft, 
  Palette,
  Calculator,
  GitBranch,
  LayoutGrid,
  FunctionSquare,
  Code2,
  Shield,
  ShieldCheck
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountMappingsTab } from './tabs/AccountMappingsTab';
import { JournalRulesTab } from './tabs/JournalRulesTab';
import { CustomReportsTab } from './tabs/CustomReportsTab';
import { FinancialStatementsConfigTab } from './tabs/FinancialStatementsConfigTab';
import { MenuConfigurationTab } from './tabs/MenuConfigurationTab';
import { ThemeConfigurationTab } from './tabs/ThemeConfigurationTab';
import { DashboardConfigTab } from './tabs/DashboardConfigTab';
import { FormulaBuilderTab } from './tabs/FormulaBuilderTab';
import { CardFormulasTab } from './tabs/CardFormulasTab';
import { TwoFactorSetup } from '@/components/auth/TwoFactorSetup';
import { SecurityMonitoringDashboard } from '@/components/security/SecurityMonitoringDashboard';
import { AccountingHealthDashboard } from '@/components/security/AccountingHealthDashboard';
import { useLanguage } from '@/contexts/LanguageContext';

export function ControlCenterPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Settings2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t.cc_title}</h1>
          <p className="text-muted-foreground">{t.cc_subtitle}</p>
        </div>
      </div>

      <Tabs defaultValue="formula-builder" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-11 lg:w-auto lg:inline-grid overflow-x-auto">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /><span className="hidden sm:inline">الأمان</span>
          </TabsTrigger>
          <TabsTrigger value="security-monitor" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /><span className="hidden sm:inline">المراقبة الأمنية</span>
          </TabsTrigger>
          <TabsTrigger value="formula-builder" className="flex items-center gap-2">
            <FunctionSquare className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_formula_builder}</span>
          </TabsTrigger>
          <TabsTrigger value="card-formulas" className="flex items-center gap-2">
            <Code2 className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_card_formulas}</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard-config" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_dashboard_config}</span>
          </TabsTrigger>
          <TabsTrigger value="account-mappings" className="flex items-center gap-2">
            <Database className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_account_mappings}</span>
          </TabsTrigger>
          <TabsTrigger value="journal-rules" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_journal_rules}</span>
          </TabsTrigger>
          <TabsTrigger value="custom-reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_custom_reports}</span>
          </TabsTrigger>
          <TabsTrigger value="financial-statements" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_financial_statements}</span>
          </TabsTrigger>
          <TabsTrigger value="menu-config" className="flex items-center gap-2">
            <PanelLeft className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_menu_config}</span>
          </TabsTrigger>
          <TabsTrigger value="theme-config" className="flex items-center gap-2">
            <Palette className="w-4 h-4" /><span className="hidden sm:inline">{t.cc_theme_config}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="mt-6"><TwoFactorSetup /></TabsContent>
        <TabsContent value="security-monitor" className="mt-6">
          <AccountingHealthDashboard />
          <div className="mt-6"><SecurityMonitoringDashboard /></div>
        </TabsContent>
        <TabsContent value="formula-builder" className="mt-6"><FormulaBuilderTab /></TabsContent>
        <TabsContent value="card-formulas" className="mt-6"><CardFormulasTab /></TabsContent>
        <TabsContent value="dashboard-config" className="mt-6"><DashboardConfigTab /></TabsContent>
        <TabsContent value="account-mappings" className="mt-6"><AccountMappingsTab /></TabsContent>
        <TabsContent value="journal-rules" className="mt-6"><JournalRulesTab /></TabsContent>
        <TabsContent value="custom-reports" className="mt-6"><CustomReportsTab /></TabsContent>
        <TabsContent value="financial-statements" className="mt-6"><FinancialStatementsConfigTab /></TabsContent>
        <TabsContent value="menu-config" className="mt-6"><MenuConfigurationTab /></TabsContent>
        <TabsContent value="theme-config" className="mt-6"><ThemeConfigurationTab /></TabsContent>
      </Tabs>
    </div>
  );
}
