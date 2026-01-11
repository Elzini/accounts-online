import { useState, useCallback } from 'react';
import { Customer, Supplier, Car, Sale } from '@/types';

// Initial demo data
const initialCustomers: Customer[] = [
  {
    id: 1,
    name: 'أحمد محمد العلي',
    idNumber: '1234567890',
    registrationNumber: 'CR-001',
    phone: '0501234567',
    address: 'الرياض - حي النخيل',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 2,
    name: 'خالد عبدالله السعيد',
    idNumber: '0987654321',
    registrationNumber: 'CR-002',
    phone: '0559876543',
    address: 'جدة - حي الروضة',
    createdAt: new Date('2024-02-20'),
  },
];

const initialSuppliers: Supplier[] = [
  {
    id: 1,
    name: 'شركة السيارات المتحدة',
    idNumber: 'SUP-001',
    registrationNumber: 'SR-001',
    phone: '0112345678',
    address: 'الرياض - المنطقة الصناعية',
    notes: 'مورد رئيسي للسيارات اليابانية',
    createdAt: new Date('2024-01-01'),
  },
];

const initialCars: Car[] = [
  {
    id: 1,
    inventoryNumber: 1,
    chassisNumber: 'VIN-2024-001',
    name: 'تويوتا كامري',
    model: '2024',
    color: 'أبيض لؤلؤي',
    purchasePrice: 95000,
    purchaseDate: new Date('2024-01-10'),
    supplierId: 1,
    supplierName: 'شركة السيارات المتحدة',
    status: 'available',
  },
  {
    id: 2,
    inventoryNumber: 2,
    chassisNumber: 'VIN-2024-002',
    name: 'هوندا أكورد',
    model: '2024',
    color: 'أسود',
    purchasePrice: 105000,
    purchaseDate: new Date('2024-01-15'),
    supplierId: 1,
    supplierName: 'شركة السيارات المتحدة',
    status: 'available',
  },
  {
    id: 3,
    inventoryNumber: 3,
    chassisNumber: 'VIN-2024-003',
    name: 'نيسان ألتيما',
    model: '2023',
    color: 'فضي',
    purchasePrice: 85000,
    purchaseDate: new Date('2024-02-01'),
    supplierId: 1,
    supplierName: 'شركة السيارات المتحدة',
    status: 'sold',
  },
  {
    id: 4,
    inventoryNumber: 4,
    chassisNumber: 'VIN-2024-004',
    name: 'هيونداي سوناتا',
    model: '2024',
    color: 'أزرق',
    purchasePrice: 78000,
    purchaseDate: new Date('2024-02-10'),
    supplierId: 1,
    supplierName: 'شركة السيارات المتحدة',
    status: 'available',
  },
];

const initialSales: Sale[] = [
  {
    id: 1,
    carId: 3,
    customerId: 1,
    customerName: 'أحمد محمد العلي',
    carName: 'نيسان ألتيما',
    model: '2023',
    color: 'فضي',
    chassisNumber: 'VIN-2024-003',
    purchasePrice: 85000,
    salePrice: 98000,
    sellerName: 'محمد أحمد',
    commission: 1000,
    otherExpenses: 500,
    profit: 11500,
    saleDate: new Date('2024-02-15'),
  },
];

export function useStore() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [cars, setCars] = useState<Car[]>(initialCars);
  const [sales, setSales] = useState<Sale[]>(initialSales);

  // Customer operations
  const addCustomer = useCallback((customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: customers.length + 1,
      createdAt: new Date(),
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, [customers.length]);

  // Supplier operations
  const addSupplier = useCallback((supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: suppliers.length + 1,
      createdAt: new Date(),
    };
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
  }, [suppliers.length]);

  // Car operations
  const addCar = useCallback((car: Omit<Car, 'id' | 'inventoryNumber' | 'status'>) => {
    const newCar: Car = {
      ...car,
      id: cars.length + 1,
      inventoryNumber: cars.length + 1,
      status: 'available',
    };
    setCars(prev => [...prev, newCar]);
    return newCar;
  }, [cars.length]);

  // Sale operations
  const addSale = useCallback((sale: Omit<Sale, 'id' | 'profit'>) => {
    const profit = sale.salePrice - sale.purchasePrice - sale.commission - sale.otherExpenses;
    const newSale: Sale = {
      ...sale,
      id: sales.length + 1,
      profit,
    };
    setSales(prev => [...prev, newSale]);
    
    // Update car status
    setCars(prev => prev.map(car => 
      car.id === sale.carId ? { ...car, status: 'sold' as const } : car
    ));
    
    return newSale;
  }, [sales.length]);

  // Statistics
  const availableCars = cars.filter(car => car.status === 'available').length;
  const todaySales = sales.filter(sale => {
    const today = new Date();
    const saleDate = new Date(sale.saleDate);
    return saleDate.toDateString() === today.toDateString();
  }).length;
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const monthSales = sales.filter(sale => {
    const now = new Date();
    const saleDate = new Date(sale.saleDate);
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  }).length;

  return {
    customers,
    suppliers,
    cars,
    sales,
    addCustomer,
    addSupplier,
    addCar,
    addSale,
    stats: {
      availableCars,
      todaySales,
      totalProfit,
      monthSales,
    },
  };
}
