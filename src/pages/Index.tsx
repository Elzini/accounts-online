import { useState, useRef, useEffect } from 'react';
import { LogOut, Building2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar, MobileSidebarRef } from '@/components/MobileSidebar';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Dashboard } from '@/components/Dashboard';
import { PWAInstallButton } from '@/components/PWAInstallButton';
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
import { ControlCenterPage } from '@/components/control-center/ControlCenterPage';
import { FixedAssetsPage } from '@/components/assets/FixedAssetsPage';
import { MedadImportPage } from '@/components/import/MedadImportPage';
import { ProjectsPage, ContractsPage, ProgressBillingsPage } from '@/components/construction';
import { useStats } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActivePage } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { data: stats } = useStats();
  const { signOut, user, permissions } = useAuth();
  const { fiscalYears, selectedFiscalYear, setSelectedFiscalYear, isLoading: isFiscalYearLoading } = useFiscalYear();
  const mobileSidebarRef = useRef<MobileSidebarRef>(null);
  
  // Show fiscal year selection dialog if multiple years exist and none selected
  const [showFiscalYearDialog, setShowFiscalYearDialog] = useState(false);
  
  useEffect(() => {
    // Show fiscal year selection ONLY if there are multiple years AND none is selected yet
    if (!isFiscalYearLoading && fiscalYears.length > 1 && !selectedFiscalYear) {
      setShowFiscalYearDialog(true);
    } else {
      setShowFiscalYearDialog(false);
    }
  }, [fiscalYears, selectedFiscalYear, isFiscalYearLoading]);

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
      default: return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} />;
    }
  };

  const isMobile = useIsMobile();

  const handleMenuClick = () => {
    mobileSidebarRef.current?.open();
  };

  return (
    <>
      {/* Fiscal Year Selection Dialog */}
      <FiscalYearSelectionDialog
        open={showFiscalYearDialog}
        fiscalYears={fiscalYears}
        onSelect={handleFiscalYearSelect}
      />
      
      <div className="flex min-h-screen min-h-[100dvh] bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
        </div>
        
        {/* Mobile Sidebar */}
        <MobileSidebar ref={mobileSidebarRef} activePage={activePage} setActivePage={setActivePage} />
        
        <main className="flex-1 min-w-0 overflow-x-hidden pb-16 md:pb-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-lg border-b-2 border-border/80 shadow-md px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 sm:py-3 safe-area-top">
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <p className="text-responsive-sm text-muted-foreground truncate">
                  مرحباً، <span className="font-medium text-foreground">{user?.email?.split('@')[0]}</span>
                </p>
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
      </div>
    </>
  );
};

export default Index;
