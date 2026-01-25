import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Save, RotateCcw, Loader2 } from 'lucide-react';
import { useAppSettings, useUpdateAppSetting } from '@/hooks/useSettings';
import { defaultSettings } from '@/services/settings';
import { toast } from 'sonner';

export function MenuLabelsSettingsTab() {
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateAppSetting();

  // Main menu
  const [dashboardTitle, setDashboardTitle] = useState(defaultSettings.dashboard_title);
  const [customersTitle, setCustomersTitle] = useState(defaultSettings.customers_title);
  const [suppliersTitle, setSuppliersTitle] = useState(defaultSettings.suppliers_title);
  const [purchasesTitle, setPurchasesTitle] = useState(defaultSettings.purchases_title);
  const [salesTitle, setSalesTitle] = useState(defaultSettings.sales_title);

  // Transfers
  const [transfersSectionTitle, setTransfersSectionTitle] = useState(defaultSettings.transfers_section_title);
  const [partnerDealershipsTitle, setPartnerDealershipsTitle] = useState(defaultSettings.partner_dealerships_title);
  const [carTransfersTitle, setCarTransfersTitle] = useState(defaultSettings.car_transfers_title);

  // Finance
  const [financeSectionTitle, setFinanceSectionTitle] = useState(defaultSettings.finance_section_title);
  const [expensesTitle, setExpensesTitle] = useState(defaultSettings.expenses_title);
  const [prepaidExpensesTitle, setPrepaidExpensesTitle] = useState(defaultSettings.prepaid_expenses_title);
  const [quotationsTitle, setQuotationsTitle] = useState(defaultSettings.quotations_title);
  const [installmentsTitle, setInstallmentsTitle] = useState(defaultSettings.installments_title);
  const [vouchersTitle, setVouchersTitle] = useState(defaultSettings.vouchers_title);
  const [financingTitle, setFinancingTitle] = useState(defaultSettings.financing_title);
  const [bankingTitle, setBankingTitle] = useState(defaultSettings.banking_title);

  // Reports
  const [reportsTitle, setReportsTitle] = useState(defaultSettings.reports_title);
  const [inventoryReportTitle, setInventoryReportTitle] = useState(defaultSettings.inventory_report_title);
  const [profitReportTitle, setProfitReportTitle] = useState(defaultSettings.profit_report_title);
  const [purchasesReportTitle, setPurchasesReportTitle] = useState(defaultSettings.purchases_report_title);
  const [salesReportTitle, setSalesReportTitle] = useState(defaultSettings.sales_report_title);
  const [customersReportTitle, setCustomersReportTitle] = useState(defaultSettings.customers_report_title);
  const [suppliersReportTitle, setSuppliersReportTitle] = useState(defaultSettings.suppliers_report_title);
  const [commissionsReportTitle, setCommissionsReportTitle] = useState(defaultSettings.commissions_report_title);
  const [transfersReportTitle, setTransfersReportTitle] = useState(defaultSettings.transfers_report_title);
  const [partnerReportTitle, setPartnerReportTitle] = useState(defaultSettings.partner_report_title);

  // Accounting
  const [accountingSectionTitle, setAccountingSectionTitle] = useState(defaultSettings.accounting_section_title);
  const [taxSettingsTitle, setTaxSettingsTitle] = useState(defaultSettings.tax_settings_title);
  const [chartOfAccountsTitle, setChartOfAccountsTitle] = useState(defaultSettings.chart_of_accounts_title);
  const [journalEntriesTitle, setJournalEntriesTitle] = useState(defaultSettings.journal_entries_title);
  const [generalLedgerTitle, setGeneralLedgerTitle] = useState(defaultSettings.general_ledger_title);
  const [financialReportsTitle, setFinancialReportsTitle] = useState(defaultSettings.financial_reports_title);

  // Admin
  const [adminSectionTitle, setAdminSectionTitle] = useState(defaultSettings.admin_section_title);
  const [usersManagementTitle, setUsersManagementTitle] = useState(defaultSettings.users_management_title);
  const [appSettingsTitle, setAppSettingsTitle] = useState(defaultSettings.app_settings_title);
  const [auditLogsTitle, setAuditLogsTitle] = useState(defaultSettings.audit_logs_title);
  const [backupsTitle, setBackupsTitle] = useState(defaultSettings.backups_title);

  // Sync state with loaded settings
  useEffect(() => {
    if (settings) {
      setDashboardTitle(settings.dashboard_title || defaultSettings.dashboard_title);
      setCustomersTitle(settings.customers_title || defaultSettings.customers_title);
      setSuppliersTitle(settings.suppliers_title || defaultSettings.suppliers_title);
      setPurchasesTitle(settings.purchases_title || defaultSettings.purchases_title);
      setSalesTitle(settings.sales_title || defaultSettings.sales_title);
      setTransfersSectionTitle(settings.transfers_section_title || defaultSettings.transfers_section_title);
      setPartnerDealershipsTitle(settings.partner_dealerships_title || defaultSettings.partner_dealerships_title);
      setCarTransfersTitle(settings.car_transfers_title || defaultSettings.car_transfers_title);
      setFinanceSectionTitle(settings.finance_section_title || defaultSettings.finance_section_title);
      setExpensesTitle(settings.expenses_title || defaultSettings.expenses_title);
      setPrepaidExpensesTitle(settings.prepaid_expenses_title || defaultSettings.prepaid_expenses_title);
      setQuotationsTitle(settings.quotations_title || defaultSettings.quotations_title);
      setInstallmentsTitle(settings.installments_title || defaultSettings.installments_title);
      setVouchersTitle(settings.vouchers_title || defaultSettings.vouchers_title);
      setFinancingTitle(settings.financing_title || defaultSettings.financing_title);
      setBankingTitle(settings.banking_title || defaultSettings.banking_title);
      setReportsTitle(settings.reports_title || defaultSettings.reports_title);
      setInventoryReportTitle(settings.inventory_report_title || defaultSettings.inventory_report_title);
      setProfitReportTitle(settings.profit_report_title || defaultSettings.profit_report_title);
      setPurchasesReportTitle(settings.purchases_report_title || defaultSettings.purchases_report_title);
      setSalesReportTitle(settings.sales_report_title || defaultSettings.sales_report_title);
      setCustomersReportTitle(settings.customers_report_title || defaultSettings.customers_report_title);
      setSuppliersReportTitle(settings.suppliers_report_title || defaultSettings.suppliers_report_title);
      setCommissionsReportTitle(settings.commissions_report_title || defaultSettings.commissions_report_title);
      setTransfersReportTitle(settings.transfers_report_title || defaultSettings.transfers_report_title);
      setPartnerReportTitle(settings.partner_report_title || defaultSettings.partner_report_title);
      setAccountingSectionTitle(settings.accounting_section_title || defaultSettings.accounting_section_title);
      setTaxSettingsTitle(settings.tax_settings_title || defaultSettings.tax_settings_title);
      setChartOfAccountsTitle(settings.chart_of_accounts_title || defaultSettings.chart_of_accounts_title);
      setJournalEntriesTitle(settings.journal_entries_title || defaultSettings.journal_entries_title);
      setGeneralLedgerTitle(settings.general_ledger_title || defaultSettings.general_ledger_title);
      setFinancialReportsTitle(settings.financial_reports_title || defaultSettings.financial_reports_title);
      setAdminSectionTitle(settings.admin_section_title || defaultSettings.admin_section_title);
      setUsersManagementTitle(settings.users_management_title || defaultSettings.users_management_title);
      setAppSettingsTitle(settings.app_settings_title || defaultSettings.app_settings_title);
      setAuditLogsTitle(settings.audit_logs_title || defaultSettings.audit_logs_title);
      setBackupsTitle(settings.backups_title || defaultSettings.backups_title);
    }
  }, [settings]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const handleSaveAll = async () => {
    try {
      const updates = [
        // Main menu
        { key: 'dashboard_title', value: dashboardTitle },
        { key: 'customers_title', value: customersTitle },
        { key: 'suppliers_title', value: suppliersTitle },
        { key: 'purchases_title', value: purchasesTitle },
        { key: 'sales_title', value: salesTitle },
        // Transfers
        { key: 'transfers_section_title', value: transfersSectionTitle },
        { key: 'partner_dealerships_title', value: partnerDealershipsTitle },
        { key: 'car_transfers_title', value: carTransfersTitle },
        // Finance
        { key: 'finance_section_title', value: financeSectionTitle },
        { key: 'expenses_title', value: expensesTitle },
        { key: 'prepaid_expenses_title', value: prepaidExpensesTitle },
        { key: 'quotations_title', value: quotationsTitle },
        { key: 'installments_title', value: installmentsTitle },
        { key: 'vouchers_title', value: vouchersTitle },
        { key: 'financing_title', value: financingTitle },
        { key: 'banking_title', value: bankingTitle },
        // Reports
        { key: 'reports_title', value: reportsTitle },
        { key: 'inventory_report_title', value: inventoryReportTitle },
        { key: 'profit_report_title', value: profitReportTitle },
        { key: 'purchases_report_title', value: purchasesReportTitle },
        { key: 'sales_report_title', value: salesReportTitle },
        { key: 'customers_report_title', value: customersReportTitle },
        { key: 'suppliers_report_title', value: suppliersReportTitle },
        { key: 'commissions_report_title', value: commissionsReportTitle },
        { key: 'transfers_report_title', value: transfersReportTitle },
        { key: 'partner_report_title', value: partnerReportTitle },
        // Accounting
        { key: 'accounting_section_title', value: accountingSectionTitle },
        { key: 'tax_settings_title', value: taxSettingsTitle },
        { key: 'chart_of_accounts_title', value: chartOfAccountsTitle },
        { key: 'journal_entries_title', value: journalEntriesTitle },
        { key: 'general_ledger_title', value: generalLedgerTitle },
        { key: 'financial_reports_title', value: financialReportsTitle },
        // Admin
        { key: 'admin_section_title', value: adminSectionTitle },
        { key: 'users_management_title', value: usersManagementTitle },
        { key: 'app_settings_title', value: appSettingsTitle },
        { key: 'audit_logs_title', value: auditLogsTitle },
        { key: 'backups_title', value: backupsTitle },
      ];
      
      for (const update of updates) {
        await updateSetting.mutateAsync(update);
      }
      
      toast.success('تم حفظ تسميات القائمة بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleReset = () => {
    // Main menu
    setDashboardTitle(defaultSettings.dashboard_title);
    setCustomersTitle(defaultSettings.customers_title);
    setSuppliersTitle(defaultSettings.suppliers_title);
    setPurchasesTitle(defaultSettings.purchases_title);
    setSalesTitle(defaultSettings.sales_title);
    // Transfers
    setTransfersSectionTitle(defaultSettings.transfers_section_title);
    setPartnerDealershipsTitle(defaultSettings.partner_dealerships_title);
    setCarTransfersTitle(defaultSettings.car_transfers_title);
    // Finance
    setFinanceSectionTitle(defaultSettings.finance_section_title);
    setExpensesTitle(defaultSettings.expenses_title);
    setPrepaidExpensesTitle(defaultSettings.prepaid_expenses_title);
    setQuotationsTitle(defaultSettings.quotations_title);
    setInstallmentsTitle(defaultSettings.installments_title);
    setVouchersTitle(defaultSettings.vouchers_title);
    setFinancingTitle(defaultSettings.financing_title);
    setBankingTitle(defaultSettings.banking_title);
    // Reports
    setReportsTitle(defaultSettings.reports_title);
    setInventoryReportTitle(defaultSettings.inventory_report_title);
    setProfitReportTitle(defaultSettings.profit_report_title);
    setPurchasesReportTitle(defaultSettings.purchases_report_title);
    setSalesReportTitle(defaultSettings.sales_report_title);
    setCustomersReportTitle(defaultSettings.customers_report_title);
    setSuppliersReportTitle(defaultSettings.suppliers_report_title);
    setCommissionsReportTitle(defaultSettings.commissions_report_title);
    setTransfersReportTitle(defaultSettings.transfers_report_title);
    setPartnerReportTitle(defaultSettings.partner_report_title);
    // Accounting
    setAccountingSectionTitle(defaultSettings.accounting_section_title);
    setTaxSettingsTitle(defaultSettings.tax_settings_title);
    setChartOfAccountsTitle(defaultSettings.chart_of_accounts_title);
    setJournalEntriesTitle(defaultSettings.journal_entries_title);
    setGeneralLedgerTitle(defaultSettings.general_ledger_title);
    setFinancialReportsTitle(defaultSettings.financial_reports_title);
    // Admin
    setAdminSectionTitle(defaultSettings.admin_section_title);
    setUsersManagementTitle(defaultSettings.users_management_title);
    setAppSettingsTitle(defaultSettings.app_settings_title);
    setAuditLogsTitle(defaultSettings.audit_logs_title);
    setBackupsTitle(defaultSettings.backups_title);
    
    toast.info('تم إعادة التسميات إلى الإعدادات الافتراضية');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>تسميات القائمة الجانبية</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 ml-2" />
              إعادة تعيين
            </Button>
            <Button size="sm" onClick={handleSaveAll} disabled={updateSetting.isPending}>
              <Save className="w-4 h-4 ml-2" />
              حفظ الكل
            </Button>
          </div>
        </CardTitle>
        <CardDescription>تخصيص أسماء جميع العناصر في القائمة الجانبية</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Main Menu */}
          <AccordionItem value="main">
            <AccordionTrigger className="text-base font-semibold">القائمة الرئيسية</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                <div className="space-y-2">
                  <Label>الرئيسية</Label>
                  <Input value={dashboardTitle} onChange={(e) => setDashboardTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>العملاء</Label>
                  <Input value={customersTitle} onChange={(e) => setCustomersTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الموردين</Label>
                  <Input value={suppliersTitle} onChange={(e) => setSuppliersTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>المشتريات</Label>
                  <Input value={purchasesTitle} onChange={(e) => setPurchasesTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>المبيعات</Label>
                  <Input value={salesTitle} onChange={(e) => setSalesTitle(e.target.value)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Transfers */}
          <AccordionItem value="transfers">
            <AccordionTrigger className="text-base font-semibold">التحويلات</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                <div className="space-y-2">
                  <Label>عنوان القسم</Label>
                  <Input value={transfersSectionTitle} onChange={(e) => setTransfersSectionTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>المعارض الشريكة</Label>
                  <Input value={partnerDealershipsTitle} onChange={(e) => setPartnerDealershipsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تحويلات السيارات</Label>
                  <Input value={carTransfersTitle} onChange={(e) => setCarTransfersTitle(e.target.value)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Finance */}
          <AccordionItem value="finance">
            <AccordionTrigger className="text-base font-semibold">المالية</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                <div className="space-y-2">
                  <Label>عنوان القسم</Label>
                  <Input value={financeSectionTitle} onChange={(e) => setFinanceSectionTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>المصروفات</Label>
                  <Input value={expensesTitle} onChange={(e) => setExpensesTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>المصروفات المقدمة</Label>
                  <Input value={prepaidExpensesTitle} onChange={(e) => setPrepaidExpensesTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>عروض الأسعار</Label>
                  <Input value={quotationsTitle} onChange={(e) => setQuotationsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الأقساط</Label>
                  <Input value={installmentsTitle} onChange={(e) => setInstallmentsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>سندات القبض والصرف</Label>
                  <Input value={vouchersTitle} onChange={(e) => setVouchersTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>شركات التمويل</Label>
                  <Input value={financingTitle} onChange={(e) => setFinancingTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>إدارة البنوك</Label>
                  <Input value={bankingTitle} onChange={(e) => setBankingTitle(e.target.value)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Reports */}
          <AccordionItem value="reports">
            <AccordionTrigger className="text-base font-semibold">التقارير</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                <div className="space-y-2">
                  <Label>عنوان القسم</Label>
                  <Input value={reportsTitle} onChange={(e) => setReportsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير المخزون</Label>
                  <Input value={inventoryReportTitle} onChange={(e) => setInventoryReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير الأرباح</Label>
                  <Input value={profitReportTitle} onChange={(e) => setProfitReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير المشتريات</Label>
                  <Input value={purchasesReportTitle} onChange={(e) => setPurchasesReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير المبيعات</Label>
                  <Input value={salesReportTitle} onChange={(e) => setSalesReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير العملاء</Label>
                  <Input value={customersReportTitle} onChange={(e) => setCustomersReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير الموردين</Label>
                  <Input value={suppliersReportTitle} onChange={(e) => setSuppliersReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير العمولات</Label>
                  <Input value={commissionsReportTitle} onChange={(e) => setCommissionsReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير التحويلات</Label>
                  <Input value={transfersReportTitle} onChange={(e) => setTransfersReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>تقرير المعرض الشريك</Label>
                  <Input value={partnerReportTitle} onChange={(e) => setPartnerReportTitle(e.target.value)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Accounting */}
          <AccordionItem value="accounting">
            <AccordionTrigger className="text-base font-semibold">المحاسبة</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                <div className="space-y-2">
                  <Label>عنوان القسم</Label>
                  <Input value={accountingSectionTitle} onChange={(e) => setAccountingSectionTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>إعدادات الضريبة</Label>
                  <Input value={taxSettingsTitle} onChange={(e) => setTaxSettingsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>شجرة الحسابات</Label>
                  <Input value={chartOfAccountsTitle} onChange={(e) => setChartOfAccountsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>دفتر اليومية</Label>
                  <Input value={journalEntriesTitle} onChange={(e) => setJournalEntriesTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>دفتر الأستاذ</Label>
                  <Input value={generalLedgerTitle} onChange={(e) => setGeneralLedgerTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>التقارير المالية</Label>
                  <Input value={financialReportsTitle} onChange={(e) => setFinancialReportsTitle(e.target.value)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Admin */}
          <AccordionItem value="admin">
            <AccordionTrigger className="text-base font-semibold">الإدارة</AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
                <div className="space-y-2">
                  <Label>عنوان القسم</Label>
                  <Input value={adminSectionTitle} onChange={(e) => setAdminSectionTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>إدارة المستخدمين</Label>
                  <Input value={usersManagementTitle} onChange={(e) => setUsersManagementTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>إعدادات النظام</Label>
                  <Input value={appSettingsTitle} onChange={(e) => setAppSettingsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>سجل التدقيق</Label>
                  <Input value={auditLogsTitle} onChange={(e) => setAuditLogsTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>النسخ الاحتياطي</Label>
                  <Input value={backupsTitle} onChange={(e) => setBackupsTitle(e.target.value)} />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
