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

function toDateOnly(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  
  // Always recalculate profit when purchase price is provided (even if same value)
  if (car.purchase_price !== undefined && car.purchase_price !== null) {
    const purchasePrice = typeof car.purchase_price === 'string' 
      ? parseFloat(car.purchase_price) 
      : Number(car.purchase_price);
    
    if (!isNaN(purchasePrice)) {
      console.log('Recalculating profit for car:', id, 'with price:', purchasePrice);
      await recalculateSalesProfitForCar(id, purchasePrice);
    }
  }
  
  return data;
}

// Recalculate profit for all sales related to a car when purchase price changes
async function recalculateSalesProfitForCar(carId: string, newPurchasePrice: number) {
  console.log('Starting profit recalculation for car:', carId, 'new price:', newPurchasePrice);
  
  // Update sale_items profit where this car was sold
  const { data: saleItems, error: fetchItemsError } = await supabase
    .from('sale_items')
    .select('id, sale_id, sale_price')
    .eq('car_id', carId);
  
  if (fetchItemsError) {
    console.error('Error fetching sale items:', fetchItemsError);
    return;
  }
  
  console.log('Found sale_items:', saleItems?.length || 0);
  
  // Update each sale_item's profit
  for (const item of saleItems || []) {
    const newProfit = Number(item.sale_price) - newPurchasePrice;
    console.log('Updating sale_item:', item.id, 'sale_price:', item.sale_price, 'new profit:', newProfit);
    const { error: updateItemError } = await supabase
      .from('sale_items')
      .update({ profit: newProfit })
      .eq('id', item.id);
    
    if (updateItemError) {
      console.error('Error updating sale_item profit:', updateItemError);
    }
  }
  
  // Update main sales table profit for single-car sales (where car_id matches directly)
  const { data: directSales, error: fetchSalesError } = await supabase
    .from('sales')
    .select('id, sale_price, commission, other_expenses')
    .eq('car_id', carId);
  
  if (fetchSalesError) {
    console.error('Error fetching sales:', fetchSalesError);
    return;
  }
  
  console.log('Found direct sales:', directSales?.length || 0);
  
  for (const sale of directSales || []) {
    const commission = Number(sale.commission) || 0;
    const otherExpenses = Number(sale.other_expenses) || 0;
    const newProfit = Number(sale.sale_price) - newPurchasePrice - commission - otherExpenses;
    console.log('Updating direct sale:', sale.id, 'new profit:', newProfit);
    const { error: updateSaleError } = await supabase
      .from('sales')
      .update({ profit: newProfit })
      .eq('id', sale.id);
    
    if (updateSaleError) {
      console.error('Error updating sale profit:', updateSaleError);
    }
  }
  
  // For multi-car sales, update the total profit by summing all sale_items
  const uniqueSaleIds = [...new Set((saleItems || []).map(item => item.sale_id))];
  for (const saleId of uniqueSaleIds) {
    // Get all items for this sale and sum their profits
    const { data: allItems } = await supabase
      .from('sale_items')
      .select('profit')
      .eq('sale_id', saleId);
    
    if (allItems && allItems.length > 0) {
      const totalItemsProfit = allItems.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
      
      // Get sale's commission and other_expenses
      const { data: saleData } = await supabase
        .from('sales')
        .select('commission, other_expenses')
        .eq('id', saleId)
        .single();
      
      const commission = Number(saleData?.commission) || 0;
      const otherExpenses = Number(saleData?.other_expenses) || 0;
      const finalProfit = totalItemsProfit - commission - otherExpenses;
      
      await supabase
        .from('sales')
        .update({ profit: finalProfit })
        .eq('id', saleId);
    }
  }
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

// Reverse sale (return invoice - إرجاع الفاتورة)
export async function reverseSale(saleId: string) {
  // Get sale with items
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        id,
        car_id,
        sale_price,
        profit
      )
    `)
    .eq('id', saleId)
    .single();
  
  if (saleError) throw saleError;
  if (!sale) throw new Error('Sale not found');
  
  // Check if there are sale_items (multi-car sale)
  const saleItems = (sale as any).sale_items || [];
  
  // Delete sale items first if exist
  if (saleItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('sale_items')
      .delete()
      .eq('sale_id', saleId);
    
    if (itemsError) throw itemsError;
    
    // Restore all cars to available status
    for (const item of saleItems) {
      await updateCarStatus(item.car_id, 'available');
    }
  } else {
    // Single car sale
    await updateCarStatus(sale.car_id, 'available');
  }
  
  // Delete related journal entry if exists
  await supabase
    .from('journal_entries')
    .delete()
    .eq('reference_type', 'sale')
    .eq('reference_id', saleId);
  
  // Delete the sale
  const { error: deleteError } = await supabase
    .from('sales')
    .delete()
    .eq('id', saleId);
  
  if (deleteError) throw deleteError;
  
  return sale;
}

// Stats
export async function fetchStats(fiscalYearId?: string | null) {
  const now = new Date();
  const today = toDateOnly(now);
  const startOfMonth = toDateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
  const endOfMonth = toDateOnly(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  // Get fiscal year date range if provided
  let fiscalYearStart: string | null = null;
  let fiscalYearEnd: string | null = null;
  
  if (fiscalYearId) {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years')
      .select('start_date, end_date')
      .eq('id', fiscalYearId)
      .single();
    
    if (fiscalYear) {
      fiscalYearStart = fiscalYear.start_date;
      fiscalYearEnd = fiscalYear.end_date;
    }
  }

  // Available cars count:
  // - نفلتر حسب fiscal_year_id حتى تظهر السيارات المُرحّلة في السنة الجديدة
  // - احتياط للبيانات القديمة: لو fiscal_year_id فارغ، نرجع لفلترة purchase_date داخل نطاق السنة
  let availableCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');

  if (fiscalYearId) {
    if (fiscalYearStart && fiscalYearEnd) {
      // (fiscal_year_id = fiscalYearId) OR (fiscal_year_id is null AND purchase_date within FY)
      availableCarsQuery = availableCarsQuery.or(
        `fiscal_year_id.eq.${fiscalYearId},and(fiscal_year_id.is.null,purchase_date.gte.${fiscalYearStart},purchase_date.lte.${fiscalYearEnd})`
      );
    } else {
      availableCarsQuery = availableCarsQuery.eq('fiscal_year_id', fiscalYearId);
    }
  }

  const { count: availableCars } = await availableCarsQuery;

  // Today's sales (within fiscal year based on sale_date)
  let todaySalesQuery = supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('sale_date', today);
  
  if (fiscalYearStart && fiscalYearEnd) {
    todaySalesQuery = todaySalesQuery
      .gte('sale_date', fiscalYearStart)
      .lte('sale_date', fiscalYearEnd);
  }
  
  const { count: todaySales } = await todaySalesQuery;

  // Sales data with fiscal year filter based on sale_date
  let salesQuery = supabase
    .from('sales')
    .select('profit, car_id, sale_date, sale_price');
  
  if (fiscalYearStart && fiscalYearEnd) {
    salesQuery = salesQuery
      .gte('sale_date', fiscalYearStart)
      .lte('sale_date', fiscalYearEnd);
  }
  
  const { data: salesData } = await salesQuery;
  
  const totalGrossProfit = salesData?.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0) || 0;

  // Get expenses with fiscal year filter based on expense_date
  let expensesQuery = supabase
    .from('expenses')
    .select('amount, car_id, expense_date');
  
  if (fiscalYearStart && fiscalYearEnd) {
    expensesQuery = expensesQuery
      .gte('expense_date', fiscalYearStart)
      .lte('expense_date', fiscalYearEnd);
  }
  
  const { data: expensesData } = await expensesQuery;
  
  // Calculate car-specific expenses (linked to sold cars)
  const soldCarIds = salesData?.map(s => s.car_id) || [];
  const carExpenses = expensesData?.filter(exp => exp.car_id && soldCarIds.includes(exp.car_id))
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  
  // Calculate general expenses (not linked to any car)
  const generalExpenses = expensesData?.filter(exp => !exp.car_id)
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  
  // Net profit = Gross profit - Car expenses - General expenses
  const totalProfit = totalGrossProfit - carExpenses - generalExpenses;

  // Month sales count (within current month and fiscal year)
  let monthSalesCount = 0;
  if (fiscalYearStart && fiscalYearEnd) {
    // Ensure we only count sales within the fiscal year AND current month
    monthSalesCount = salesData?.filter(sale => {
      const saleDate = sale.sale_date;
      const rangeStart = startOfMonth > fiscalYearStart ? startOfMonth : fiscalYearStart;
      const rangeEnd = endOfMonth < fiscalYearEnd ? endOfMonth : fiscalYearEnd;
      return saleDate >= rangeStart && saleDate <= rangeEnd;
    }).length || 0;
  } else {
    monthSalesCount = salesData?.filter(sale => sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth).length || 0;
  }

  // Total purchases (sum of all car purchase prices within fiscal year based on purchase_date)
  let purchasesQuery = supabase
    .from('cars')
    .select('purchase_price');
  
  if (fiscalYearId) {
    if (fiscalYearStart && fiscalYearEnd) {
      // (fiscal_year_id = fiscalYearId) OR (fiscal_year_id is null AND purchase_date within FY)
      purchasesQuery = purchasesQuery.or(
        `fiscal_year_id.eq.${fiscalYearId},and(fiscal_year_id.is.null,purchase_date.gte.${fiscalYearStart},purchase_date.lte.${fiscalYearEnd})`
      );
    } else {
      purchasesQuery = purchasesQuery.eq('fiscal_year_id', fiscalYearId);
    }
  }
  
  const { data: purchasesData } = await purchasesQuery;
  
  const totalPurchases = purchasesData?.reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0) || 0;

  // Month sales amount (sum of sale prices this month within fiscal year)
  let monthSalesAmount = 0;
  if (fiscalYearStart && fiscalYearEnd) {
    monthSalesAmount = salesData?.filter(sale => {
      const saleDate = sale.sale_date;
      const rangeStart = startOfMonth > fiscalYearStart ? startOfMonth : fiscalYearStart;
      const rangeEnd = endOfMonth < fiscalYearEnd ? endOfMonth : fiscalYearEnd;
      return saleDate >= rangeStart && saleDate <= rangeEnd;
    }).reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;
  } else {
    monthSalesAmount = salesData?.filter(sale => sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth)
      .reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;
  }

  // Count cars for purchases breakdown
  const purchasesCount = purchasesData?.length || 0;

  // Month sales breakdown
  const monthSalesData = fiscalYearStart && fiscalYearEnd
    ? salesData?.filter(sale => {
        const saleDate = sale.sale_date;
        const rangeStart = startOfMonth > fiscalYearStart ? startOfMonth : fiscalYearStart;
        const rangeEnd = endOfMonth < fiscalYearEnd ? endOfMonth : fiscalYearEnd;
        return saleDate >= rangeStart && saleDate <= rangeEnd;
      }) || []
    : salesData?.filter(sale => sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth) || [];

  const monthSalesProfit = monthSalesData.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0);

  return {
    availableCars: availableCars || 0,
    todaySales: todaySales || 0,
    totalProfit,
    monthSales: monthSalesCount,
    totalPurchases,
    monthSalesAmount,
    // Additional breakdown for transparency
    totalGrossProfit,
    totalCarExpenses: carExpenses,
    totalGeneralExpenses: generalExpenses,
    // Extended breakdown data
    purchasesCount,
    monthSalesProfit,
    totalSalesCount: salesData?.length || 0,
    totalSalesAmount: salesData?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0,
  };
}

// Monthly chart data
export async function fetchMonthlyChartData(fiscalYearId?: string) {
  // Get fiscal year dates if provided
  let fiscalYearStart: string | null = null;
  let fiscalYearEnd: string | null = null;
  
  if (fiscalYearId) {
    const { data: fiscalYear } = await supabase
      .from('fiscal_years')
      .select('start_date, end_date')
      .eq('id', fiscalYearId)
      .single();
    
    if (fiscalYear) {
      fiscalYearStart = fiscalYear.start_date;
      fiscalYearEnd = fiscalYear.end_date;
    }
  }

  // Determine date range based on fiscal year or default to last 6 months
  let startDate: string;
  let endDate: string;
  
  if (fiscalYearStart && fiscalYearEnd) {
    startDate = fiscalYearStart;
    endDate = fiscalYearEnd;
  } else {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    startDate = toDateOnly(sixMonthsAgo);
    endDate = toDateOnly(new Date());
  }

  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, sale_price, profit')
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
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
  
  // Generate months for display based on fiscal year or last 6 months
  const result = [];
  
  if (fiscalYearStart && fiscalYearEnd) {
    // Show months within the fiscal year
    const start = new Date(fiscalYearStart);
    const end = new Date(fiscalYearEnd);
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const monthName = arabicMonths[current.getMonth()];
      
      result.push({
        month: monthName,
        sales: monthlyData[monthKey]?.sales || 0,
        profit: monthlyData[monthKey]?.profit || 0,
      });
      
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Default: last 6 months
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
