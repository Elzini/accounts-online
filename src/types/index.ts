export interface Customer {
  id: number;
  name: string;
  idNumber: string;
  registrationNumber: string;
  phone: string;
  address: string;
  createdAt: Date;
}

export interface Supplier {
  id: number;
  name: string;
  idNumber: string;
  registrationNumber: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: Date;
}

export interface Car {
  id: number;
  inventoryNumber: number;
  chassisNumber: string;
  name: string;
  model: string;
  color: string;
  purchasePrice: number;
  purchaseDate: Date;
  supplierId: number;
  supplierName: string;
  status: 'available' | 'sold';
}

export interface Sale {
  id: number;
  carId: number;
  customerId: number;
  customerName: string;
  carName: string;
  model: string;
  color: string;
  chassisNumber: string;
  purchasePrice: number;
  salePrice: number;
  sellerName: string;
  commission: number;
  otherExpenses: number;
  profit: number;
  saleDate: Date;
}

export type ActivePage = 
  | 'dashboard' 
  | 'customers' 
  | 'suppliers' 
  | 'purchases' 
  | 'sales' 
  | 'add-customer'
  | 'add-supplier'
  | 'add-purchase'
  | 'add-sale'
  | 'inventory-report'
  | 'profit-report'
  | 'purchases-report'
  | 'sales-report'
  | 'customers-report'
  | 'suppliers-report'
  | 'commissions-report'
  | 'partner-dealerships'
  | 'car-transfers'
  | 'transfers-report'
  | 'partner-report'
  | 'users-management'
  | 'app-settings'
  | 'companies-management'
  | 'tax-settings'
  | 'chart-of-accounts'
  | 'journal-entries'
  | 'financial-reports'
  | 'general-ledger'
  | 'expenses'
  | 'quotations'
  | 'installments'
  | 'vouchers'
  | 'audit-logs';
