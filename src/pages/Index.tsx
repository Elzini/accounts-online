import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { CustomerForm } from '@/components/forms/CustomerForm';
import { SupplierForm } from '@/components/forms/SupplierForm';
import { PurchaseForm } from '@/components/forms/PurchaseForm';
import { SaleForm } from '@/components/forms/SaleForm';
import { CustomersTable } from '@/components/tables/CustomersTable';
import { SuppliersTable } from '@/components/tables/SuppliersTable';
import { PurchasesTable } from '@/components/tables/PurchasesTable';
import { SalesTable } from '@/components/tables/SalesTable';
import { InventoryReport } from '@/components/reports/InventoryReport';
import { ProfitReport } from '@/components/reports/ProfitReport';
import { PurchasesReport } from '@/components/reports/PurchasesReport';
import { SalesReport } from '@/components/reports/SalesReport';
import { UsersManagement } from '@/components/UsersManagement';
import { AppSettingsPage } from '@/components/AppSettings';
import { useStats } from '@/hooks/useDatabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ActivePage } from '@/types';

const Index = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { data: stats } = useStats();
  const { signOut, user } = useAuth();

  const defaultStats = { availableCars: 0, todaySales: 0, totalProfit: 0, monthSales: 0 };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} />;
      case 'customers': return <CustomersTable setActivePage={setActivePage} />;
      case 'suppliers': return <SuppliersTable setActivePage={setActivePage} />;
      case 'purchases': return <PurchasesTable setActivePage={setActivePage} />;
      case 'sales': return <SalesTable setActivePage={setActivePage} />;
      case 'add-customer': return <CustomerForm setActivePage={setActivePage} />;
      case 'add-supplier': return <SupplierForm setActivePage={setActivePage} />;
      case 'add-purchase': return <PurchaseForm setActivePage={setActivePage} />;
      case 'add-sale': return <SaleForm setActivePage={setActivePage} />;
      case 'inventory-report': return <InventoryReport />;
      case 'profit-report': return <ProfitReport />;
      case 'purchases-report': return <PurchasesReport />;
      case 'sales-report': return <SalesReport />;
      case 'users-management': return <UsersManagement setActivePage={setActivePage} />;
      case 'app-settings': return <AppSettingsPage setActivePage={setActivePage} />;
      default: return <Dashboard stats={stats || defaultStats} setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            مرحباً، {user?.email}
          </p>
          <Button variant="ghost" onClick={signOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </Button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
