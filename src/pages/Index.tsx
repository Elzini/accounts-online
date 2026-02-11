import { useState, useRef } from 'react';
import { LogOut, Building2, Calendar, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar, MobileSidebarRef } from '@/components/MobileSidebar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Dashboard } from '@/components/Dashboard';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { CheckUpdateButton } from '@/components/pwa/CheckUpdateButton';
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
import { BankingPage } from '@/components/banking/BankingPage';
import { FiscalYearSelectionDialog } from '@/components/FiscalYearSelectionDialog';
import { TrialBalanceAnalysisPage } from '@/components/reports/TrialBalanceAnalysisPage';
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
import { LeavesPage } from '@/components/hr/LeavesPage';
import { ManufacturingPage } from '@/components/manufacturing/ManufacturingPage';
import { IntegrationsPage } from '@/components/integrations/IntegrationsPage';
import { CurrenciesPage } from '@/components/currencies/CurrenciesPage';
import { BranchesPage } from '@/components/branches/BranchesPage';
import { JournalAttachments } from '@/components/accounting/JournalAttachments';
import { AIChatWidget } from '@/components/chat/AIChatWidget';
import { NotificationsBell } from '@/components/notifications/NotificationsBell';
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

const Index = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { data: stats } = useStats();
  const { signOut, user, permissions } = useAuth();
  const { isSuperAdmin, viewAsCompanyId, setViewAsCompanyId, company: currentCompany } = useCompany();
  const { fiscalYears, selectedFiscalYear, setSelectedFiscalYear, isLoading: isFiscalYearLoading } = useFiscalYear();

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
  
  // Fiscal year dialog for changing selection (accessible from header badge)
  const [showFiscalYearDialog, setShowFiscalYearDialog] = useState(false);

  // Mandatory fiscal year gate: if fiscal years exist but none is selected, force selection
  const mustSelectFiscalYear = !isFiscalYearLoading && fiscalYears.length > 0 && !selectedFiscalYear;

  const handleFiscalYearSelect = (fy: typeof fiscalYears[0]) => {
    setSelectedFiscalYear(fy);
    setShowFiscalYearDialog(false);
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
      case 'dashboard': return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} />;
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
      case 'quotations': return <QuotationsPage />;
      case 'installments': return <InstallmentsPage />;
      case 'vouchers': return <VouchersPage />;
      case 'audit-logs': return <AuditLogsPage />;
      case 'backups': return <BackupsPage />;
      case 'financing': return <FinancingPage />;
      case 'banking': return <BankingPage />;
      case 'zakat-reports': return <ZakatReportsPage />;
      case 'fiscal-years': return <FiscalYearsPage />;
      case 'trial-balance-analysis': return <TrialBalanceAnalysisPage />;
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
      case 'approvals': return <ApprovalsPage />;
      case 'attendance': return <AttendancePage />;
      case 'leaves': return <LeavesPage />;
      case 'manufacturing': return <ManufacturingPage />;
      case 'integrations': return <IntegrationsPage />;
      case 'currencies': return <CurrenciesPage />;
      case 'branches': return <BranchesPage />;
      default: return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} />;
    }
  };

  const isMobile = useIsMobile();

  const handleMenuClick = () => {
    mobileSidebarRef.current?.open();
  };

  return (
    <>
      {/* Mandatory Fiscal Year Selection Dialog - blocks access until selected */}
      <FiscalYearSelectionDialog
        open={mustSelectFiscalYear || showFiscalYearDialog}
        fiscalYears={fiscalYears}
        currentSelectedId={selectedFiscalYear?.id}
        onSelect={handleFiscalYearSelect}
      />
      
      <div className="flex min-h-screen min-h-[100dvh] bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
        </div>
        
        {/* Mobile Sidebar */}
        <MobileSidebar ref={mobileSidebarRef} activePage={activePage} setActivePage={setActivePage} />
        
        <main className="flex-1 min-w-0 overflow-x-hidden pb-20 md:pb-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-lg border-b-2 border-border/80 shadow-md px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 safe-area-top">
            <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <p className="text-responsive-sm text-muted-foreground truncate">
                  مرحباً، <span className="font-medium text-foreground">{user?.email?.split('@')[0]}</span>
                </p>
                {/* Super Admin Company Selector */}
                {isSuperAdmin && allCompanies.length > 0 && (
                  <Select
                    value={viewAsCompanyId || 'default'}
                    onValueChange={(val) => setViewAsCompanyId(val === 'default' ? null : val)}
                  >
                    <SelectTrigger className="h-8 w-auto min-w-[140px] max-w-[220px] text-xs gap-1 border-primary/50 bg-primary/5">
                      <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
                      <SelectValue placeholder="عرض كشركة..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">شركتي الأصلية</SelectItem>
                      {allCompanies.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {viewAsCompanyId && currentCompany && (
                  <Badge variant="secondary" className="gap-1 shrink-0 bg-primary/10 text-primary">
                    <Building2 className="w-3 h-3" />
                    <span className="hidden sm:inline text-xs">{currentCompany.name}</span>
                  </Badge>
                )}
                {selectedFiscalYear && fiscalYears.length > 1 && (
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-accent gap-1 shrink-0"
                    onClick={() => setShowFiscalYearDialog(true)}
                  >
                    <Calendar className="w-3 h-3" />
                    <span className="hidden sm:inline">{selectedFiscalYear.name}</span>
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <NotificationsBell />
                <CheckUpdateButton />
                <PWAInstallButton />
                {permissions.super_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/companies')}
                    className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3"
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs sm:text-sm">إدارة الشركات</span>
                  </Button>
                )}
                <CarSearch />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={signOut} 
                  className="gap-1.5 h-8 sm:h-9 px-2 sm:px-3 text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs sm:text-sm">خروج</span>
                </Button>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            {renderContent()}
          </div>
        </main>

        {/* Bottom Navigation for Mobile */}
        {/* Always render but CSS will hide on desktop */}
        <BottomNavigation 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onMenuClick={handleMenuClick}
        />

        {/* AI Chat Widget */}
        <AIChatWidget />
      </div>
    </>
  );
};

export default Index;
