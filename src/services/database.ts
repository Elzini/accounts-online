import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];
type Car = Database['public']['Tables']['cars']['Row'];
type CarInsert = Database['public']['Tables']['cars']['Insert'];
type CarUpdate = Database['public']['Tables']['cars']['Update'];
type Sale = Database['public']['Tables']['sales']['Row'];
type SaleInsert = Database['public']['Tables']['sales']['Insert'];
type SaleUpdate = Database['public']['Tables']['sales']['Update'];
type PurchaseBatch = Database['public']['Tables']['purchase_batches']['Row'];
type PurchaseBatchInsert = Database['public']['Tables']['purchase_batches']['Insert'];
type SaleItem = Database['public']['Tables']['sale_items']['Row'];
type SaleItemInsert = Database['public']['Tables']['sale_items']['Insert'];

// Helper function to get current user's company_id
async function getCurrentCompanyId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  
  return profile?.company_id || null;
}

// Types for multi-car operations
export interface CarWithSaleInfo extends Omit<CarInsert, 'batch_id'> {
  sale_price?: number;
}

export interface MultiCarSaleData {
  customer_id: string;
  seller_name?: string;
  commission?: number;
  other_expenses?: number;
  sale_date: string;
  payment_account_id?: string;
  cars: Array<{
    car_id: string;
    sale_price: number;
    purchase_price: number;
  }>;
}

// Customers
export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function addCustomer(customer: CustomerInsert) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('customers')
    .insert({ ...customer, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCustomer(id: string, customer: CustomerUpdate) {
  const { data, error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Suppliers
export async function fetchSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function addSupplier(supplier: SupplierInsert) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplier, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSupplier(id: string, supplier: SupplierUpdate) {
  const { data, error } = await supabase
    .from('suppliers')
    .update(supplier)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Cars
export async function fetchCars() {
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      supplier:suppliers(name),
      payment_account:account_categories!cars_payment_account_id_fkey(id, name, code)
    `)
    .order('inventory_number', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function addCar(car: CarInsert) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('cars')
    .insert({ ...car, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCar(id: string, car: CarUpdate) {
  const { data, error } = await supabase
    .from('cars')
    .update(car)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCar(id: string) {
  const { error } = await supabase
    .from('cars')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function updateCarStatus(carId: string, status: 'available' | 'sold') {
  const { error } = await supabase
    .from('cars')
    .update({ status })
    .eq('id', carId);
  
  if (error) throw error;
}

// Sales
export async function fetchSales() {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      car:cars(*),
      customer:customers(name, phone, address, id_number, registration_number),
      sale_items:sale_items(
        *,
        car:cars(*)
      ),
      payment_account:account_categories!sales_payment_account_id_fkey(id, name, code)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function addSale(sale: SaleInsert) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  const { data, error } = await supabase
    .from('sales')
    .insert({ ...sale, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  
  // Update car status to sold
  await updateCarStatus(sale.car_id, 'sold');
  
  return data;
}

export async function updateSale(id: string, sale: SaleUpdate) {
  const { data, error } = await supabase
    .from('sales')
    .update(sale)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSale(id: string, carId: string) {
  // First check if there are sale_items for this sale (multi-car sale)
  const { data: saleItems, error: fetchError } = await supabase
    .from('sale_items')
    .select('car_id')
    .eq('sale_id', id);
  
  if (fetchError) throw fetchError;

  // If there are sale_items, delete them first
  if (saleItems && saleItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', id);
    
    if (itemsError) throw itemsError;
  }

  // Delete the sale
  const { error } = await supabase
    .from('sales')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Restore all cars to available status
  if (saleItems && saleItems.length > 0) {
    // Multi-car sale: restore all cars from sale_items
    for (const item of saleItems) {
      await updateCarStatus(item.car_id, 'available');
    }
  } else {
    // Single car sale: restore the main car
    await updateCarStatus(carId, 'available');
  }
}

// Stats
export async function fetchStats() {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Available cars count
  const { count: availableCars } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');

  // Today's sales
  const { count: todaySales } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('sale_date', today);

  // Total gross profit from sales
  const { data: salesData } = await supabase
    .from('sales')
    .select('profit, car_id');
  
  const totalGrossProfit = salesData?.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0) || 0;

  // Get all expenses
  const { data: expensesData } = await supabase
    .from('expenses')
    .select('amount, car_id');
  
  // Calculate car-specific expenses (linked to sold cars)
  const soldCarIds = salesData?.map(s => s.car_id) || [];
  const carExpenses = expensesData?.filter(exp => exp.car_id && soldCarIds.includes(exp.car_id))
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  
  // Calculate general expenses (not linked to any car)
  const generalExpenses = expensesData?.filter(exp => !exp.car_id)
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  
  // Net profit = Gross profit - Car expenses - General expenses
  const totalProfit = totalGrossProfit - carExpenses - generalExpenses;

  // Month sales count
  const { count: monthSales } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('sale_date', startOfMonth);

  // Total purchases (sum of all car purchase prices)
  const { data: purchasesData } = await supabase
    .from('cars')
    .select('purchase_price');
  
  const totalPurchases = purchasesData?.reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0) || 0;

  // Month sales amount (sum of sale prices this month)
  const { data: monthSalesData } = await supabase
    .from('sales')
    .select('sale_price')
    .gte('sale_date', startOfMonth);
  
  const monthSalesAmount = monthSalesData?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;

  return {
    availableCars: availableCars || 0,
    todaySales: todaySales || 0,
    totalProfit,
    monthSales: monthSales || 0,
    totalPurchases,
    monthSalesAmount,
    // Additional breakdown for transparency
    totalGrossProfit,
    totalCarExpenses: carExpenses,
    totalGeneralExpenses: generalExpenses,
  };
}

// Monthly chart data
export async function fetchMonthlyChartData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const startDate = sixMonthsAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, sale_price, profit')
    .gte('sale_date', startDate)
    .order('sale_date', { ascending: true });

  if (error) throw error;

  // Group by month
  const monthlyData: Record<string, { sales: number; profit: number }> = {};
  
  data?.forEach(sale => {
    const date = new Date(sale.sale_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { sales: 0, profit: 0 };
    }
    
    monthlyData[monthKey].sales += Number(sale.sale_price) || 0;
    monthlyData[monthKey].profit += Number(sale.profit) || 0;
  });

  // Convert to array with Arabic month names
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const result = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = arabicMonths[date.getMonth()];
    
    result.push({
      month: monthName,
      sales: monthlyData[monthKey]?.sales || 0,
      profit: monthlyData[monthKey]?.profit || 0,
    });
  }

  return result;
}

// Purchase Batches
export async function addPurchaseBatch(
  batchData: PurchaseBatchInsert & { payment_account_id?: string },
  cars: Array<Omit<CarInsert, 'batch_id'>>
) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  // Create the batch first
  const { data: batch, error: batchError } = await supabase
    .from('purchase_batches')
    .insert({ 
      supplier_id: batchData.supplier_id,
      purchase_date: batchData.purchase_date,
      notes: batchData.notes,
      company_id: companyId 
    })
    .select()
    .single();
  
  if (batchError) throw batchError;

  // Add all cars with the batch_id, company_id, and payment_account_id
  const carsWithBatch = cars.map(car => ({
    ...car,
    batch_id: batch.id,
    supplier_id: batchData.supplier_id,
    purchase_date: batchData.purchase_date,
    company_id: companyId,
    payment_account_id: batchData.payment_account_id || null,
  }));

  const { data: addedCars, error: carsError } = await supabase
    .from('cars')
    .insert(carsWithBatch)
    .select();
  
  if (carsError) throw carsError;

  return { batch, cars: addedCars };
}

export async function fetchPurchaseBatches() {
  const { data, error } = await supabase
    .from('purchase_batches')
    .select(`
      *,
      supplier:suppliers(name),
      cars:cars(*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// Multi-car Sales
export async function addMultiCarSale(saleData: MultiCarSaleData) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');
  
  // Calculate totals
  const totalSalePrice = saleData.cars.reduce((sum, car) => sum + car.sale_price, 0);
  const totalPurchasePrice = saleData.cars.reduce((sum, car) => sum + car.purchase_price, 0);
  const commission = saleData.commission || 0;
  const otherExpenses = saleData.other_expenses || 0;
  const totalProfit = totalSalePrice - totalPurchasePrice - commission - otherExpenses;

  // Use the first car as the primary car for the sale record
  const primaryCar = saleData.cars[0];

  // Create the main sale record
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      customer_id: saleData.customer_id,
      car_id: primaryCar.car_id,
      sale_price: totalSalePrice,
      seller_name: saleData.seller_name || null,
      commission: commission,
      other_expenses: otherExpenses,
      profit: totalProfit,
      sale_date: saleData.sale_date,
      company_id: companyId,
      payment_account_id: saleData.payment_account_id || null,
    })
    .select()
    .single();
  
  if (saleError) throw saleError;

  // Add sale items for each car
  const saleItems = saleData.cars.map(car => ({
    sale_id: sale.id,
    car_id: car.car_id,
    sale_price: car.sale_price,
    profit: car.sale_price - car.purchase_price,
  }));

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems);
  
  if (itemsError) throw itemsError;

  // Update all cars status to sold
  for (const car of saleData.cars) {
    await updateCarStatus(car.car_id, 'sold');
  }

  return sale;
}

export async function fetchSalesWithItems() {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(name),
      sale_items:sale_items(
        *,
        car:cars(*)
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function deleteMultiCarSale(saleId: string) {
  // Get sale items first to restore car statuses
  const { data: saleItems, error: fetchError } = await supabase
    .from('sale_items')
    .select('car_id')
    .eq('sale_id', saleId);
  
  if (fetchError) throw fetchError;

  // Delete sale items
  const { error: itemsError } = await supabase
    .from('sale_items')
    .delete()
    .eq('sale_id', saleId);
  
  if (itemsError) throw itemsError;

  // Delete the sale
  const { error: saleError } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId);
  
  if (saleError) throw saleError;

  // Restore car statuses
  for (const item of saleItems || []) {
    await updateCarStatus(item.car_id, 'available');
  }
}
