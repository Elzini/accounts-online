import { useState } from 'react';
import { 
  Settings2, 
  Database, 
  FileText, 
  PanelLeft, 
  Palette,
  Calculator,
  GitBranch,
  LayoutGrid
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccountMappingsTab } from './tabs/AccountMappingsTab';
import { JournalRulesTab } from './tabs/JournalRulesTab';
import { CustomReportsTab } from './tabs/CustomReportsTab';
import { FinancialStatementsConfigTab } from './tabs/FinancialStatementsConfigTab';
import { MenuConfigurationTab } from './tabs/MenuConfigurationTab';
import { ThemeConfigurationTab } from './tabs/ThemeConfigurationTab';

export function ControlCenterPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
          <Settings2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">مركز التحكم الشامل</h1>
          <p className="text-muted-foreground">التحكم الكامل في الحسابات والقيود والتقارير وشكل البرنامج</p>
        </div>
      </div>

      <Tabs defaultValue="account-mappings" className="w-full">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid overflow-x-auto">
          <TabsTrigger value="account-mappings" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">ربط الحسابات</span>
          </TabsTrigger>
          <TabsTrigger value="journal-rules" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">قواعد القيود</span>
          </TabsTrigger>
          <TabsTrigger value="custom-reports" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">التقارير المخصصة</span>
          </TabsTrigger>
          <TabsTrigger value="financial-statements" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <span className="hidden sm:inline">القوائم المالية</span>
          </TabsTrigger>
          <TabsTrigger value="menu-config" className="flex items-center gap-2">
            <PanelLeft className="w-4 h-4" />
            <span className="hidden sm:inline">القائمة الجانبية</span>
          </TabsTrigger>
          <TabsTrigger value="theme-config" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">المظهر</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account-mappings" className="mt-6">
          <AccountMappingsTab />
        </TabsContent>

        <TabsContent value="journal-rules" className="mt-6">
          <JournalRulesTab />
        </TabsContent>

        <TabsContent value="custom-reports" className="mt-6">
          <CustomReportsTab />
        </TabsContent>

        <TabsContent value="financial-statements" className="mt-6">
          <FinancialStatementsConfigTab />
        </TabsContent>

        <TabsContent value="menu-config" className="mt-6">
          <MenuConfigurationTab />
        </TabsContent>

        <TabsContent value="theme-config" className="mt-6">
          <ThemeConfigurationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
