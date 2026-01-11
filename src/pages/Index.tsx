import { useState } from 'react';
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
import { useStore } from '@/hooks/useStore';
import { ActivePage } from '@/types';

const Index = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { 
    customers, 
    suppliers, 
    cars, 
    sales, 
    addCustomer, 
    addSupplier, 
    addCar, 
    addSale,
    stats 
  } = useStore();

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard stats={stats} setActivePage={setActivePage} />;
      case 'customers':
        return <CustomersTable customers={customers} setActivePage={setActivePage} />;
      case 'suppliers':
        return <SuppliersTable suppliers={suppliers} setActivePage={setActivePage} />;
      case 'purchases':
        return <PurchasesTable cars={cars} setActivePage={setActivePage} />;
      case 'sales':
        return <SalesTable sales={sales} setActivePage={setActivePage} />;
      case 'add-customer':
        return <CustomerForm onSave={addCustomer} setActivePage={setActivePage} />;
      case 'add-supplier':
        return <SupplierForm onSave={addSupplier} setActivePage={setActivePage} />;
      case 'add-purchase':
        return (
          <PurchaseForm 
            suppliers={suppliers} 
            nextCarId={cars.length + 1} 
            onSave={addCar} 
            setActivePage={setActivePage} 
          />
        );
      case 'add-sale':
        return (
          <SaleForm 
            customers={customers} 
            cars={cars} 
            nextSaleId={sales.length + 1}
            onSave={addSale} 
            setActivePage={setActivePage} 
          />
        );
      case 'inventory-report':
        return <InventoryReport cars={cars} />;
      case 'profit-report':
        return <ProfitReport sales={sales} />;
      case 'purchases-report':
        return <PurchasesReport cars={cars} />;
      default:
        return <Dashboard stats={stats} setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
