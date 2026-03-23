/**
 * Default Company Settings - Slim Orchestrator
 * Decomposed from 817 lines → hook + 4 tab components
 */
import { Loader2, Building2, RefreshCw, Zap, Settings, Calculator, FileText, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDefaultCompanySettings } from './default-settings/useDefaultCompanySettings';
import { AppSettingsTab } from './default-settings/AppSettingsTab';
import { TaxSettingsTab } from './default-settings/TaxSettingsTab';
import { AccountingSettingsTab } from './default-settings/AccountingSettingsTab';
import { InvoiceSettingsTab } from './default-settings/InvoiceSettingsTab';

export function DefaultCompanySettings() {
  const h = useDefaultCompanySettings();

  if (h.isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإعدادات الافتراضية للشركات الجديدة</h1>
          <p className="text-muted-foreground">هذه الإعدادات ستُطبق تلقائياً على كل شركة جديدة</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between">
        <p className="text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />أي تغييرات هنا ستُطبق تلقائياً على الشركات الجديدة
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2"><Zap className="h-4 w-4" />تطبيق على الشركات الموجودة</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تطبيق الإعدادات على جميع الشركات</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم تطبيق جميع الإعدادات الافتراضية على كل الشركات الموجودة.
                <br /><br /><strong className="text-destructive">تحذير:</strong> هذا الإجراء سيستبدل الإعدادات الحالية. لا يمكن التراجع.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={() => h.applyToExisting.mutate()} disabled={h.applyToExisting.isPending} className="bg-primary">
                {h.applyToExisting.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Zap className="h-4 w-4 ml-2" />}
                تأكيد التطبيق
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Tabs defaultValue="app" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="app" className="flex items-center gap-2"><Settings className="w-4 h-4" />إعدادات التطبيق</TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-2"><Calculator className="w-4 h-4" />إعدادات الضريبة</TabsTrigger>
          <TabsTrigger value="accounting" className="flex items-center gap-2"><FileText className="w-4 h-4" />إعدادات القيود</TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-2"><Receipt className="w-4 h-4" />إعدادات الفاتورة</TabsTrigger>
        </TabsList>

        <TabsContent value="app" className="mt-6">
          <AppSettingsTab
            appName={h.appName} setAppName={h.setAppName}
            appSubtitle={h.appSubtitle} setAppSubtitle={h.setAppSubtitle}
            welcomeMessage={h.welcomeMessage} setWelcomeMessage={h.setWelcomeMessage}
            dashboardTitle={h.dashboardTitle} setDashboardTitle={h.setDashboardTitle}
            purchasesTitle={h.purchasesTitle} setPurchasesTitle={h.setPurchasesTitle}
            salesTitle={h.salesTitle} setSalesTitle={h.setSalesTitle}
            customersTitle={h.customersTitle} setCustomersTitle={h.setCustomersTitle}
            suppliersTitle={h.suppliersTitle} setSuppliersTitle={h.setSuppliersTitle}
            reportsTitle={h.reportsTitle} setReportsTitle={h.setReportsTitle}
            isSaving={h.isSaving} onSave={h.handleSaveAppSettings}
          />
        </TabsContent>
        <TabsContent value="tax" className="mt-6">
          <TaxSettingsTab
            taxName={h.taxName} setTaxName={h.setTaxName}
            taxRate={h.taxRate} setTaxRate={h.setTaxRate}
            taxActive={h.taxActive} setTaxActive={h.setTaxActive}
            applyToSales={h.applyToSales} setApplyToSales={h.setApplyToSales}
            applyToPurchases={h.applyToPurchases} setApplyToPurchases={h.setApplyToPurchases}
            isSaving={h.isSaving} onSave={h.handleSaveTaxSettings}
          />
        </TabsContent>
        <TabsContent value="accounting" className="mt-6">
          <AccountingSettingsTab
            autoJournalEnabled={h.autoJournalEnabled} setAutoJournalEnabled={h.setAutoJournalEnabled}
            autoSalesEntries={h.autoSalesEntries} setAutoSalesEntries={h.setAutoSalesEntries}
            autoPurchaseEntries={h.autoPurchaseEntries} setAutoPurchaseEntries={h.setAutoPurchaseEntries}
            autoExpenseEntries={h.autoExpenseEntries} setAutoExpenseEntries={h.setAutoExpenseEntries}
            isSaving={h.isSaving} onSave={h.handleSaveAccountingSettings}
          />
        </TabsContent>
        <TabsContent value="invoice" className="mt-6">
          <InvoiceSettingsTab
            invoiceSettings={h.invoiceSettings} setInvoiceSettings={h.setInvoiceSettings}
            isSaving={h.isSaving} onSave={h.handleSaveInvoiceSettings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
