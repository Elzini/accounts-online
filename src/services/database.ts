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
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
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
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
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
      supplier:suppliers(name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function addCar(car: CarInsert) {
  const { data, error } = await supabase
    .from('cars')
    .insert(car)
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
      customer:customers(name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function addSale(sale: SaleInsert) {
  const { data, error } = await supabase
    .from('sales')
    .insert(sale)
    .select()
    .single();
  
  if (error) throw error;
  
  // Update car status to sold
  await updateCarStatus(sale.car_id, 'sold');
  
  return data;
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

  // Total profit
  const { data: profitData } = await supabase
    .from('sales')
    .select('profit');
  
  const totalProfit = profitData?.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0) || 0;

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
