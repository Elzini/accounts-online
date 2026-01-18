import { useState } from 'react';
import { LogOut, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { MobileSidebar } from '@/components/MobileSidebar';
import { Dashboard } from '@/components/Dashboard';
import { CustomerForm } from '@/components/forms/CustomerForm';
import { SupplierForm } from '@/components/forms/SupplierForm';
import { BatchPurchaseForm } from '@/components/forms/BatchPurchaseForm';
import { MultiCarSaleForm } from '@/components/forms/MultiCarSaleForm';
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
import { useStats } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { data: stats } = useStats();
  const { signOut, user, permissions } = useAuth();

  const defaultStats = { availableCars: 0, todaySales: 0, totalProfit: 0, monthSales: 0, totalPurchases: 0, monthSalesAmount: 0 };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} />;
      case 'customers': return <CustomersTable setActivePage={setActivePage} />;
      case 'suppliers': return <SuppliersTable setActivePage={setActivePage} />;
      case 'purchases': return <PurchasesTable setActivePage={setActivePage} />;
      case 'sales': return <SalesTable setActivePage={setActivePage} />;
      case 'add-customer': return <CustomerForm setActivePage={setActivePage} />;
      case 'add-supplier': return <SupplierForm setActivePage={setActivePage} />;
      case 'add-purchase': return <BatchPurchaseForm setActivePage={setActivePage} />;
      case 'add-sale': return <MultiCarSaleForm setActivePage={setActivePage} />;
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
      default: return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} />;
    }
  };

  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar activePage={activePage} setActivePage={setActivePage} />
      </div>
      
      {/* Mobile Sidebar */}
      <MobileSidebar activePage={activePage} setActivePage={setActivePage} />
      
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto w-full">
        <div className="flex justify-between items-center mb-4 pt-14 lg:pt-0">
          <p className="text-xs md:text-sm text-muted-foreground truncate max-w-[200px] md:max-w-none">
            مرحباً، {user?.email}
          </p>
          <div className="flex items-center gap-2">
            {permissions.super_admin && (
              <Button
                variant="outline"
                onClick={() => navigate('/companies')}
                className="gap-2 text-sm"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">إدارة الشركات</span>
              </Button>
            )}
            <CarSearch />
            <Button variant="ghost" onClick={signOut} className="gap-2 text-sm">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل خروج</span>
            </Button>
          </div>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
