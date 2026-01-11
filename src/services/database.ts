import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];
type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type Car = Database['public']['Tables']['cars']['Row'];
type CarInsert = Database['public']['Tables']['cars']['Insert'];
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

  // Month sales
  const { count: monthSales } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('sale_date', startOfMonth);

  return {
    availableCars: availableCars || 0,
    todaySales: todaySales || 0,
    totalProfit,
    monthSales: monthSales || 0,
  };
}
