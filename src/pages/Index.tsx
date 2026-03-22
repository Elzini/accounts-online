import { useState, useRef, useEffect } from 'react';
import { LogOut, Building2, Calendar, Eye, LayoutDashboard, Clock, Search } from 'lucide-react';
import { CommandPalette } from '@/components/CommandPalette';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar, MobileSidebarRef } from '@/components/MobileSidebar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Dashboard } from '@/components/Dashboard';
import { FloatingMiniDashboard } from '@/components/dashboard/FloatingMiniDashboard';
import { useFocusMode, FocusModeOverlay } from '@/components/dashboard/FocusMode';

import { PWAInstallButton } from '@/components/PWAInstallButton';
import { CheckUpdateButton } from '@/components/pwa/CheckUpdateButton';
import { PushNotificationManager } from '@/components/pwa/PushNotificationManager';
import { OfflineDataIndicator } from '@/components/pwa/OfflineDataIndicator';
import { CustomerForm } from '@/components/forms/CustomerForm';
import { SupplierForm } from '@/components/forms/SupplierForm';
import { BatchPurchaseForm } from '@/components/forms/BatchPurchaseForm';
import { PurchaseInvoiceForm } from '@/components/forms/PurchaseInvoiceForm';
import { MultiCarSaleForm } from '@/components/forms/MultiCarSaleForm';
import { SalesInvoiceForm } from '@/components/forms/SalesInvoiceForm';
import { CustomersTable } from '@/components/tables/CustomersTable';
import { SuppliersTable } from '@/components/tables/SuppliersTable';
import { PurchasesTable } from '@/components/tables/PurchasesTable';
import { SalesTable } from '@/components/tables/SalesTable';
import { PartnerDealershipsTable } from '@/components/tables/PartnerDealershipsTable';
import { CarTransfersTable } from '@/components/tables/CarTransfersTable';
import { InventoryReport } from '@/components/reports/InventoryReport';
import { ProfitReport } from '@/components/reports/ProfitReport';
import { PurchasesReport } from '@/components/reports/PurchasesReport';
import { SalesReport } from '@/components/reports/SalesReport';
import { CustomersReport } from '@/components/reports/CustomersReport';
import { SuppliersReport } from '@/components/reports/SuppliersReport';
import { CommissionsReport } from '@/components/reports/CommissionsReport';
import { TransfersReport } from '@/components/reports/TransfersReport';
import { PartnerDealershipReport } from '@/components/reports/PartnerDealershipReport';
import { ExpensesReport } from '@/components/reports/ExpensesReport';
import { PrepaidExpensesReport } from '@/components/reports/PrepaidExpensesReport';
import { UsersManagement } from '@/components/UsersManagement';
import { AppSettingsPage } from '@/components/AppSettings';
import { CarSearch } from '@/components/CarSearch';
import { TaxSettingsPage } from '@/components/accounting/TaxSettingsPage';
import { ChartOfAccountsPage } from '@/components/accounting/ChartOfAccountsPage';
import { JournalEntriesPage } from '@/components/accounting/JournalEntriesPage';
import { CostCentersPage } from '@/components/accounting/CostCentersPage';
import { FinancialReportsPage } from '@/components/accounting/FinancialReportsPage';
import { GeneralLedgerPage } from '@/components/accounting/GeneralLedgerPage';
import { ZakatReportsPage } from '@/components/accounting/ZakatReportsPage';
import { FiscalYearsPage } from '@/components/accounting/FiscalYearsPage';
import { ExpensesPage } from '@/components/expenses/ExpensesPage';
import PrepaidExpensesPage from '@/components/expenses/PrepaidExpensesPage';
import { QuotationsPage } from '@/components/quotations/QuotationsPage';
import { InstallmentsPage } from '@/components/installments/InstallmentsPage';
import { VouchersPage } from '@/components/vouchers/VouchersPage';
import { AuditLogsPage } from '@/components/audit/AuditLogsPage';
import { BackupsPage } from '@/components/backups/BackupsPage';
import { FinancingPage } from '@/components/financing/FinancingPage';
import { SetupWizard } from '@/components/setup/SetupWizard';
import { BankingPage } from '@/components/banking/BankingPage';
import { FiscalYearSelectionDialog } from '@/components/FiscalYearSelectionDialog';
import { TrialBalancePage } from '@/components/accounting/TrialBalancePage';
import { ComprehensiveFinancialStatementsPage } from '@/components/financial-statements';
import { VATReturnReportPage } from '@/components/accounting/VATReturnReportPage';
import { EmployeesPage } from '@/components/payroll/EmployeesPage';
import { PayrollPage } from '@/components/payroll/PayrollPage';
import { AccountStatementReport } from '@/components/reports/AccountStatementReport';
import { AccountMovementReport } from '@/components/reports/AccountMovementReport';
import { ControlCenterPage } from '@/components/control-center/ControlCenterPage';
import { AccountingAuditPage } from '@/components/audit/AccountingAuditPage';
import { FixedAssetsPage } from '@/components/assets/FixedAssetsPage';
import { MedadImportPage } from '@/components/import/MedadImportPage';
import { ProjectsPage, ContractsPage, ProgressBillingsPage } from '@/components/construction';
import { CustodyPage } from '@/components/custody';
import { TripsPage } from '@/components/trips';
import { ThemeSettingsPage } from '@/components/themes/ThemeSettingsPage';
import { MenuManagementPage, OrdersPage, KitchenPage, TablesPage } from '@/components/restaurant';
import { ShipmentsPage, LettersOfCreditPage, CustomsClearancePage } from '@/components/export-import';
import { TasksPage } from '@/components/tasks/TasksPage';
import { WarehousesPage, ItemsPage, UnitsPage, CategoriesPage } from '@/components/inventory';
import { AgingReportPage } from '@/components/receivables/AgingReportPage';
import { ChecksPage } from '@/components/checks/ChecksPage';
import { BudgetsPage } from '@/components/budgets/BudgetsPage';
import { FinancialKPIsPage } from '@/components/reports/FinancialKPIsPage';
import { ApprovalsPage } from '@/components/approvals/ApprovalsPage';
import { AttendancePage } from '@/components/hr/AttendancePage';
import { AttendanceManagementHub } from '@/components/hr/attendance/AttendanceManagementHub';
import { FingerprintDevicesPage } from '@/components/hr/FingerprintDevicesPage';
import { LeavesPage } from '@/components/hr/LeavesPage';
import { ManufacturingPage } from '@/components/manufacturing/ManufacturingPage';
import { IntegrationsPage } from '@/components/integrations/IntegrationsPage';
import { CurrenciesPage } from '@/components/currencies/CurrenciesPage';
import { BranchesPage } from '@/components/branches/BranchesPage';
import { JournalAttachments } from '@/components/accounting/JournalAttachments';
import { AIChatWidget } from '@/components/chat/AIChatWidget';
import { ApiManagementPage } from '@/components/api/ApiManagementPage';
import { PluginsPage } from '@/components/plugins/PluginsPage';
import { ALL_PLUGINS } from '@/hooks/usePlugins';
import { WorkflowsPage } from '@/components/workflows';
import {
  ZatcaPluginPage, AdvancedHRPluginPage, MultiWarehousePluginPage,
  BIAnalyticsPluginPage, POSPluginPage, WhatsAppPluginPage,
  IFRSPluginPage, ProjectMgmtPluginPage
} from '@/components/plugins/pages';
import { CashFlowForecastPage } from '@/components/cashflow/CashFlowForecastPage';
import { ExecutiveKPIDashboard } from '@/components/kpi/ExecutiveKPIDashboard';
import { CommissionsSystemPage } from '@/components/commissions/CommissionsSystemPage';
import { BranchComparisonPage } from '@/components/branches/BranchComparisonPage';
import { AISalesForecastPage } from '@/components/sales-forecast/AISalesForecastPage';
import { PurchaseOrdersPage, GoodsReceiptPage, PurchaseReturnsPage, MaterialsRequestPage, ContractorPaymentPage } from '@/components/procurement';
import { StockVouchersPage } from '@/components/inventory/StockVouchersPage';
import { StocktakingPage } from '@/components/inventory/StocktakingPage';
import { CreditDebitNotesPage } from '@/components/returns/CreditDebitNotesPage';
import { SalesReturnsPage } from '@/components/returns/SalesReturnsPage';
import { CRMPage } from '@/components/crm/CRMPage';
import { LoyaltyPage } from '@/components/loyalty/LoyaltyPage';
import { SubscriptionsPage } from '@/components/subscriptions/SubscriptionsPage';
import { WorkOrdersPage } from '@/components/work-orders/WorkOrdersPage';
import { BookingsPage } from '@/components/bookings/BookingsPage';
import { TimeTrackingPage } from '@/components/time-tracking/TimeTrackingPage';
import { EmployeeContractsPage } from '@/components/hr/ContractsPage';
import { OrgStructurePage } from '@/components/hr/OrgStructurePage';
import { RentalsPage } from '@/components/rentals/RentalsPage';
import { SalesTargetsPage } from '@/components/sales-targets/SalesTargetsPage';
import { PaymentGatewayPage } from '@/components/payment-gateway/PaymentGatewayPage';
import { BookkeepingServicePage } from '@/components/bookkeeping/BookkeepingServicePage';
import { ZatcaSandboxPage } from '@/components/zatca-sandbox/ZatcaSandboxPage';
import { ZatcaTechnicalDocPage } from '@/components/zatca-sandbox/ZatcaTechnicalDocPage';
import { CustomerPortalPage } from '@/components/customer-portal/CustomerPortalPage';
import { SupplierPortalPage } from '@/components/supplier-portal/SupplierPortalPage';
import { ApprovalDashboard } from '@/components/approvals/ApprovalDashboard';
import { WhatsAppIntegration } from '@/components/integrations/WhatsAppIntegration';
import { AdvancedAnalyticsDashboard } from '@/components/reports/AdvancedAnalyticsDashboard';
import { AdvancedProjectsPage } from '@/components/advanced-projects/AdvancedProjectsPage';
import { REProjectsPage, REUnitsPage, REContractorsPage, RECRMPage, REReportsPage, REAfterSalesPage, REClientPortalPage } from '@/components/real-estate';
import { MobileInventoryPage } from '@/components/mobile-inventory/MobileInventoryPage';
import { MobileInvoiceReaderPage } from '@/components/mobile-invoice/MobileInvoiceReaderPage';
import { DeveloperApiPage } from '@/components/developer-api/DeveloperApiPage';
import { EcommercePage } from '@/components/ecommerce/EcommercePage';
import { SmsMarketingPage } from '@/components/marketing/SmsMarketingPage';
import { SocialMarketingPage } from '@/components/marketing/SocialMarketingPage';
import { EventsPage } from '@/components/events/EventsPage';
import { SurveysPage } from '@/components/surveys/SurveysPage';
import { ElearningPage } from '@/components/elearning/ElearningPage';
import { KnowledgeBasePage } from '@/components/knowledge/KnowledgeBasePage';
import { InternalChatPage } from '@/components/internal-chat/InternalChatPage';
import { ESignaturePage } from '@/components/e-signature/ESignaturePage';
import { PlanningPage } from '@/components/planning/PlanningPage';
import { AppointmentsPage } from '@/components/appointments/AppointmentsPage';
import { FieldServicePage } from '@/components/field-service/FieldServicePage';
import { PLMPage } from '@/components/plm/PLMPage';
import { BarcodeScannerPage } from '@/components/barcode/BarcodeScannerPage';
import { SupportContact } from '@/components/SupportContact';
import { FloatingQuickActions } from '@/components/FloatingQuickActions';
import { FieldLevelSecurityPage } from '@/components/security/FieldLevelSecurityPage';
import { InvoiceApprovalWorkflow } from '@/components/approvals/InvoiceApprovalWorkflow';
import { EcommerceIntegrationPage } from '@/components/integrations/EcommerceIntegrationPage';
import { PublicApiDocsPage } from '@/components/api-docs/PublicApiDocsPage';
import { DataImportPage } from '@/components/import/DataImportPage';
import { AutomationPage } from '@/components/automation/AutomationPage';
import { ExpenseOCRPage } from '@/components/expenses/ExpenseOCRPage';
import { OverdueInvoicesPage } from '@/components/notifications/OverdueInvoicesPage';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
import { GlobalSearchDialog } from '@/components/global-search/GlobalSearchDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useStats } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivePage } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpdeskPage } from '@/components/helpdesk/HelpdeskPage';
import { CMSPage } from '@/components/cms/CMSPage';
import { POSPage } from '@/components/pos/POSPage';
const Index = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const { data: stats, isLoading: isStatsLoading } = useStats();
  const { signOut, user, permissions } = useAuth();
  const { isSuperAdmin, viewAsCompanyId, setViewAsCompanyId, company: currentCompany } = useCompany();
  const { fiscalYears, selectedFiscalYear, setSelectedFiscalYear, isLoading: isFiscalYearLoading } = useFiscalYear();
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const { isFocusMode, toggleFocusMode, exitFocusMode } = useFocusMode();


  // Show setup wizard if no fiscal years exist
  useEffect(() => {
    if (!isFiscalYearLoading && fiscalYears.length === 0 && currentCompany) {
      setShowSetupWizard(true);
    }
  }, [isFiscalYearLoading, fiscalYears, currentCompany]);

  // Realtime notifications
  useRealtimeNotifications();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all companies for super admin selector
  const { data: allCompanies = [] } = useQuery({
    queryKey: ['all-companies-selector'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });
  const mobileSidebarRef = useRef<MobileSidebarRef>(null);
  
  // Fiscal year selection is locked after login - user must log out to change

  // Mandatory fiscal year gate: if fiscal years exist but none is selected, force selection
  const mustSelectFiscalYear = !isFiscalYearLoading && fiscalYears.length > 0 && !selectedFiscalYear;

  const handleFiscalYearSelect = (fy: typeof fiscalYears[0]) => {
    setSelectedFiscalYear(fy);
  };

  const defaultStats = { 
    availableCars: 0, 
    todaySales: 0, 
    totalProfit: 0, 
    monthSales: 0, 
    totalPurchases: 0, 
    monthSalesAmount: 0,
    totalGrossProfit: 0,
    totalCarExpenses: 0,
    totalGeneralExpenses: 0,
    purchasesCount: 0,
    monthSalesProfit: 0,
    totalSalesCount: 0,
    totalSalesAmount: 0,
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} isLoading={isStatsLoading} isFocusMode={isFocusMode} onToggleFocusMode={toggleFocusMode} />;
      case 'customers': return <CustomersTable setActivePage={setActivePage} />;
      case 'suppliers': return <SuppliersTable setActivePage={setActivePage} />;
      case 'purchases': return <PurchasesTable setActivePage={setActivePage} />;
      case 'sales': return <SalesTable setActivePage={setActivePage} />;
      case 'add-customer': return <CustomerForm setActivePage={setActivePage} />;
      case 'add-supplier': return <SupplierForm setActivePage={setActivePage} />;
      case 'add-purchase': return <PurchaseInvoiceForm setActivePage={setActivePage} />;
      case 'add-purchase-invoice': return <PurchaseInvoiceForm setActivePage={setActivePage} />;
      case 'add-sale': return <SalesInvoiceForm setActivePage={setActivePage} />;
      case 'add-sale-invoice': return <SalesInvoiceForm setActivePage={setActivePage} />;
      case 'partner-dealerships': return <PartnerDealershipsTable setActivePage={setActivePage} />;
      case 'car-transfers': return <CarTransfersTable setActivePage={setActivePage} />;
      case 'inventory-report': return <InventoryReport />;
      case 'profit-report': return <ProfitReport />;
      case 'purchases-report': return <PurchasesReport />;
      case 'sales-report': return <SalesReport />;
      case 'customers-report': return <CustomersReport />;
      case 'suppliers-report': return <SuppliersReport />;
      case 'commissions-report': return <CommissionsReport />;
      case 'transfers-report': return <TransfersReport />;
      case 'partner-report': return <PartnerDealershipReport setActivePage={setActivePage} />;
      case 'users-management': return <UsersManagement setActivePage={setActivePage} />;
      case 'app-settings': return <AppSettingsPage setActivePage={setActivePage} />;
      case 'tax-settings': return <TaxSettingsPage />;
      case 'chart-of-accounts': return <ChartOfAccountsPage />;
      case 'journal-entries': return <JournalEntriesPage />;
      case 'financial-reports': return <FinancialReportsPage />;
      case 'general-ledger': return <GeneralLedgerPage />;
      case 'expenses': return <ExpensesPage />;
      case 'prepaid-expenses': return <PrepaidExpensesPage />;
      case 'expenses-report': return <ExpensesReport />;
      case 'prepaid-expenses-report': return <PrepaidExpensesReport />;
      case 'quotations': return <QuotationsPage />;
      case 'installments': return <InstallmentsPage />;
      case 'vouchers': return <VouchersPage />;
      case 'audit-logs': return <AuditLogsPage />;
      case 'backups': return <BackupsPage />;
      case 'financing': return <FinancingPage />;
      case 'banking': return <BankingPage />;
      case 'zakat-reports': return <ZakatReportsPage />;
      case 'fiscal-years': return <FiscalYearsPage />;
      case 'trial-balance': return <TrialBalancePage />;
      case 'financial-statements': return <ComprehensiveFinancialStatementsPage />;
      case 'vat-return-report': return <VATReturnReportPage />;
      case 'employees': return <EmployeesPage />;
      case 'payroll': return <PayrollPage />;
      case 'account-statement': return <AccountStatementReport />;
      case 'control-center': return <ControlCenterPage />;
      case 'fixed-assets': return <FixedAssetsPage />;
      case 'medad-import': return <MedadImportPage />;
      // Construction module
      case 'projects': return <ProjectsPage />;
      case 'contracts': return <ContractsPage />;
      case 'progress-billings': return <ProgressBillingsPage />;
      // Custody module
      case 'custody': return <CustodyPage />;
      // Trips module
      case 'trips': return <TripsPage />;
      // Account Movement Report
      case 'account-movement': return <AccountMovementReport />;
      // Theme settings
      case 'theme-settings': return <ThemeSettingsPage />;
      // Restaurant module
      case 'menu-management': return <MenuManagementPage />;
      case 'restaurant-orders': return <OrdersPage />;
      case 'kitchen-display': return <KitchenPage />;
      case 'table-management': return <TablesPage />;
      // Export/Import module
      case 'shipments': return <ShipmentsPage />;
      case 'letters-of-credit': return <LettersOfCreditPage />;
      case 'customs-clearance': return <CustomsClearancePage />;
      // Accounting Audit
      case 'accounting-audit': return <AccountingAuditPage />;
      case 'cost-centers': return <CostCentersPage />;
      case 'tasks': return <TasksPage />;
      // Inventory module
      case 'warehouses': return <WarehousesPage />;
      case 'items-catalog': return <ItemsPage />;
      case 'item-categories': return <CategoriesPage />;
      case 'units-of-measure': return <UnitsPage />;
      // New modules
      case 'aging-report': return <AgingReportPage />;
      case 'checks': return <ChecksPage />;
      case 'budgets': return <BudgetsPage />;
      case 'financial-kpis': return <FinancialKPIsPage />;
      case 'approvals': return <ApprovalDashboard />;
      case 'attendance': return <AttendanceManagementHub />;
      case 'fingerprint-devices': return <FingerprintDevicesPage />;
      case 'leaves': return <LeavesPage />;
      case 'manufacturing': return <ManufacturingPage />;
      case 'integrations': return <IntegrationsPage />;
      case 'currencies': return <CurrenciesPage />;
      case 'branches': return <BranchesPage />;
      case 'api-management': return <ApiManagementPage />;
      case 'plugins': return <PluginsPage setActivePage={setActivePage as any} />;
      case 'plugin-zatca': return <ZatcaPluginPage />;
      case 'plugin-advanced-hr': return <AdvancedHRPluginPage />;
      case 'plugin-multi-warehouse': return <MultiWarehousePluginPage />;
      case 'plugin-bi-analytics': return <BIAnalyticsPluginPage />;
      case 'cashflow-forecast': return <CashFlowForecastPage />;
      case 'executive-kpis': return <ExecutiveKPIDashboard />;
      case 'commissions-system': return <CommissionsSystemPage />;
      case 'branch-comparison': return <BranchComparisonPage />;
      case 'ai-sales-forecast': return <AISalesForecastPage />;
      case 'plugin-pos': return <POSPluginPage />;
      case 'plugin-whatsapp': return <WhatsAppPluginPage />;
      case 'plugin-ifrs': return <IFRSPluginPage />;
      case 'plugin-project-mgmt': return <ProjectMgmtPluginPage />;
      // Workflow Engine
      case 'workflows': return <WorkflowsPage />;
      case 'automation': return <AutomationPage />;
      // Procurement
      case 'purchase-orders': return <PurchaseOrdersPage />;
      case 'goods-receipt': return <GoodsReceiptPage />;
      case 'purchase-returns': return <PurchaseReturnsPage />;
      case 'materials-request': return <MaterialsRequestPage />;
      case 'contractor-payment': return <ContractorPaymentPage />;
      // Inventory extensions
      case 'stock-vouchers': return <StockVouchersPage />;
      case 'stocktaking': return <StocktakingPage />;
      // Returns
      case 'credit-debit-notes': return <SalesReturnsPage />;
      // CRM
      case 'crm': return <CRMPage />;
      // Loyalty
      case 'loyalty': return <LoyaltyPage />;
      // Subscriptions
      case 'subscriptions': return <SubscriptionsPage />;
      // Work Orders
      case 'work-orders': return <WorkOrdersPage />;
      // Bookings
      case 'bookings': return <BookingsPage />;
      // Time Tracking
      case 'time-tracking': return <TimeTrackingPage />;
      // HR extensions
      case 'employee-contracts': return <EmployeeContractsPage />;
      case 'org-structure': return <OrgStructurePage />;
      // Rentals
      case 'rentals': return <RentalsPage />;
      // Sales Targets
      case 'sales-targets': return <SalesTargetsPage />;
      // Payment Gateway
      case 'payment-gateway': return <PaymentGatewayPage />;
      // Low priority features
      case 'bookkeeping-service': return <BookkeepingServicePage />;
      case 'zatca-sandbox': return <ZatcaSandboxPage />;
      case 'zatca-technical-doc': return <ZatcaTechnicalDocPage />;
      case 'customer-portal': return <CustomerPortalPage />;
      case 'supplier-portal': return <SupplierPortalPage />;
      case 'whatsapp-integration': return <WhatsAppIntegration />;
      case 'advanced-analytics': return <AdvancedAnalyticsDashboard />;
      case 'advanced-projects': return <AdvancedProjectsPage />;
      // Real Estate module
      case 're-projects': return <REProjectsPage />;
      case 're-units': return <REUnitsPage />;
      case 're-contractors': return <REContractorsPage />;
      case 're-crm': return <RECRMPage />;
      case 're-reports': return <REReportsPage />;
      case 're-after-sales': return <REAfterSalesPage />;
      case 're-client-portal': return <REClientPortalPage />;
      case 'mobile-inventory': return <MobileInventoryPage />;
      case 'mobile-invoice-reader': return <MobileInvoiceReaderPage />;
      case 'developer-api': return <DeveloperApiPage />;
      // New modules
      case 'ecommerce': return <EcommercePage />;
      case 'helpdesk': return <HelpdeskPage />;
      case 'cms': return <CMSPage />;
      // Odoo-parity modules
      case 'pos': return <POSPage />;
      case 'sms-marketing': return <SmsMarketingPage />;
      case 'social-marketing': return <SocialMarketingPage />;
      case 'events': return <EventsPage />;
      case 'surveys': return <SurveysPage />;
      case 'elearning': return <ElearningPage />;
      case 'knowledge-base': return <KnowledgeBasePage />;
      case 'internal-chat': return <InternalChatPage />;
      case 'e-signature': return <ESignaturePage />;
      case 'planning': return <PlanningPage />;
      case 'appointments': return <AppointmentsPage />;
      case 'field-service': return <FieldServicePage />;
      case 'plm': return <PLMPage />;
      case 'barcode-scanner': return <BarcodeScannerPage />;
      case 'support-contact': return <SupportContact />;
      case 'field-level-security': return <FieldLevelSecurityPage />;
      case 'invoice-approval-workflow': return <InvoiceApprovalWorkflow />;
      case 'ecommerce-integration': return <EcommerceIntegrationPage />;
      case 'public-api-docs': return <PublicApiDocsPage />;
      case 'data-import': return <DataImportPage />;
      case 'expense-ocr': return <ExpenseOCRPage />;
      case 'overdue-invoices': return <OverdueInvoicesPage />;
      default:
        return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} isLoading={isStatsLoading} isFocusMode={isFocusMode} onToggleFocusMode={toggleFocusMode} />;
    }
  };

  const isMobile = useIsMobile();

  const handleMenuClick = () => {
    mobileSidebarRef.current?.open();
  };

  // Wrap setActivePage
  const handleSetActivePage = (page: ActivePage) => {
    setActivePage(page);
  };

  // Handle module selection
  const handleModuleSelect = (moduleId: string) => {
    if (moduleId === 'super_admin') {
      navigate('/companies');
      return;
    }
    setActiveModule(moduleId);
    const firstPages: Record<string, ActivePage> = {
      sales: 'sales',
      purchases: 'purchases',
      accounting: 'vouchers',
      inventory: 'items-catalog',
      hr: 'employees',
      operations: 'work-orders',
      integrations: 'integrations',
      system: 'users-management',
      construction: 'projects',
      restaurant: 'menu-management',
      export_import: 'shipments',
      real_estate: 're-projects',
    };
    const firstPage = firstPages[moduleId];
    if (firstPage) {
      setActivePage(firstPage);
    }
  };

  // Back to dashboard
  const handleBackToLauncher = () => {
    setActivePage('dashboard');
    setActiveModule(null);
  };

  // Keyboard shortcuts (must be after handler declarations)
  useKeyboardShortcuts({
    setActivePage: handleSetActivePage,
    onOpenSearch: () => setShowGlobalSearch(true),
    onBackToLauncher: handleBackToLauncher,
  });

  return (
    <>
      {/* Mandatory Fiscal Year Selection Dialog - only shows if no FY selected (e.g. first login) */}
      {mustSelectFiscalYear && (
        <FiscalYearSelectionDialog
          open={true}
          fiscalYears={fiscalYears}
          currentSelectedId={selectedFiscalYear?.id}
          onSelect={handleFiscalYearSelect}
        />
      )}
      
      {showSetupWizard ? (
        <SetupWizard onComplete={() => setShowSetupWizard(false)} />
      ) : (
        <div className="flex min-h-screen min-h-[100dvh] bg-background">
          {/* Desktop Sidebar - hidden in focus mode */}
          {!isFocusMode && (
            <div className="hidden lg:block shrink-0">
              <Sidebar activePage={activePage} setActivePage={handleSetActivePage} />
            </div>
          )}
          
          {/* Mobile Sidebar */}
          {!isFocusMode && (
            <MobileSidebar ref={mobileSidebarRef} activePage={activePage} setActivePage={handleSetActivePage} />
          )}
          
          <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto pb-24 md:pb-4">
            {/* Top Header Bar - hidden in focus mode */}
            {!isFocusMode && (
            <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-lg border-b border-border/60 shadow-sm px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-2.5 safe-area-top">
              <div className="flex justify-between items-center gap-2">
                {/* Left: Back + Breadcrumb */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToLauncher}
                    className="gap-1.5 h-8 px-2 text-primary hover:bg-primary/10"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Button>
                  {/* Breadcrumb */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{t.nav_dashboard}</span>
                    {activePage !== 'dashboard' && (
                      <>
                        <span className="text-border">/</span>
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {(() => {
                            // Find the section containing this page
                            const pageLabel = activePage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            return pageLabel;
                          })()}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Super Admin Company Selector */}
                  {isSuperAdmin && allCompanies.length > 0 && (
                    <Select
                      value={viewAsCompanyId || 'default'}
                      onValueChange={(val) => setViewAsCompanyId(val === 'default' ? null : val)}
                    >
                      <SelectTrigger className="h-8 w-auto min-w-[140px] max-w-[220px] text-xs gap-1 border-primary/50 bg-primary/5">
                        <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
                        <SelectValue placeholder={t.view_as_company} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">{t.my_original_company}</SelectItem>
                        {allCompanies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedFiscalYear && (
                    <Badge 
                      variant="outline" 
                      className="gap-1 shrink-0 text-xs"
                      title="لتغيير السنة المالية، سجل خروج وأعد الدخول"
                    >
                      <Calendar className="w-3 h-3" />
                      <span className="hidden sm:inline">{selectedFiscalYear.name}</span>
                    </Badge>
                  )}
                </div>
                {/* Right: Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <CommandPalette setActivePage={handleSetActivePage} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowGlobalSearch(true)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground lg:hidden"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                  <NotificationsBell />
                  <div className="hidden sm:flex items-center gap-1">
                    <PushNotificationManager />
                    <OfflineDataIndicator />
                    {currentCompany?.company_type === 'car_dealership' && <CarSearch />}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={signOut} 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </header>
            )}
            
            {/* Focus Mode Overlay */}
            {isFocusMode && <FocusModeOverlay onExit={exitFocusMode} />}
            
            {/* Main Content */}
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              {renderContent()}
            </div>
          </main>

          {/* Bottom Navigation for Mobile - hidden in focus mode */}
          {!isFocusMode && (
            <BottomNavigation 
              activePage={activePage} 
              setActivePage={handleSetActivePage} 
              onMenuClick={handleMenuClick}
            />
          )}

          {/* AI Chat Widget */}
          <AIChatWidget />

          {/* Floating Quick Actions */}
          <FloatingQuickActions setActivePage={handleSetActivePage} />

          {/* Floating Mini Dashboard */}
          <FloatingMiniDashboard isOnDashboard={activePage === 'dashboard'} />
        </div>
      )}

      {/* Global Search Dialog */}
      <GlobalSearchDialog
        open={showGlobalSearch}
        onOpenChange={setShowGlobalSearch}
        setActivePage={handleSetActivePage}
      />
    </>
  );
};

export default Index;

