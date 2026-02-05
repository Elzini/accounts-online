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
// Use customers_safe view for read operations to mask sensitive PII (id_number, registration_number)
// The view shows only last 4 digits of identity documents for non-admin users
export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers_safe')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  // Map the masked fields back to expected field names for UI compatibility
  return data?.map(customer => ({
    ...customer,
    id_number: customer.id_number_masked,
    registration_number: customer.registration_number_masked,
    // Not exposed in safe view - provide null for type compatibility
    id_number_encrypted: null as string | null,
  })) || [];
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
// Use suppliers_safe view for read operations to mask sensitive data (phone, id_number, registration_number)
// The view shows only last 4 digits for non-admin users
export async function fetchSuppliers() {
  const { data, error } = await supabase
    .from('suppliers_safe')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  // Map the masked fields back to expected field names for UI compatibility
  return data?.map(supplier => ({
    id: supplier.id,
    company_id: supplier.company_id,
    name: supplier.name,
    phone: supplier.phone_masked,
    address: supplier.address,
    notes: supplier.notes,
    id_number: supplier.id_number_masked,
    registration_number: supplier.registration_number_masked,
    created_at: supplier.created_at,
    updated_at: supplier.updated_at,
    // Not exposed in safe view - provide null for type compatibility
    registration_number_encrypted: null as string | null,
  })) || [];
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
  
  // Recalculate profit when purchase price is provided
  if (car.purchase_price !== undefined && car.purchase_price !== null) {
    const purchasePrice = typeof car.purchase_price === 'string' 
      ? parseFloat(car.purchase_price) 
      : Number(car.purchase_price);
    
    if (!isNaN(purchasePrice)) {
      await recalculateSalesProfitForCar(id, purchasePrice);
    }
  }
  
  return data;
}

// Recalculate profit for all sales related to a car when purchase price changes
async function recalculateSalesProfitForCar(carId: string, newPurchasePrice: number) {
  // Update sale_items profit where this car was sold
  const { data: saleItems, error: fetchItemsError } = await supabase
    .from('sale_items')
    .select('id, sale_id, sale_price')
    .eq('car_id', carId);
  
  if (fetchItemsError) {
    console.error('Error fetching sale items:', fetchItemsError);
    return;
  }
  
  // Update each sale_item's profit
  for (const item of saleItems || []) {
    const newProfit = Number(item.sale_price) - newPurchasePrice;
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
  
  for (const sale of directSales || []) {
    const commission = Number(sale.commission) || 0;
    const otherExpenses = Number(sale.other_expenses) || 0;
    const newProfit = Number(sale.sale_price) - newPurchasePrice - commission - otherExpenses;
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

/**
 * Recalculate profits for ALL sales in the current company.
 * Useful when historical purchase prices were edited and you want to ensure every invoice reflects latest costs.
 */
export async function recalculateCompanySalesProfits(): Promise<{ salesUpdated: number; itemsUpdated: number }> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');

  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      id,
      sale_price,
      commission,
      other_expenses,
      car_id,
      car:cars(purchase_price),
      sale_items:sale_items(
        id,
        car_id,
        sale_price,
        car:cars(purchase_price)
      )
    `)
    .eq('company_id', companyId);

  if (error) throw error;

  let salesUpdated = 0;
  let itemsUpdated = 0;

  for (const sale of sales || []) {
    const commission = Number((sale as any).commission) || 0;
    const otherExpenses = Number((sale as any).other_expenses) || 0;
    const saleItems: Array<any> = (sale as any).sale_items || [];

    if (saleItems.length > 0) {
      let totalItemsProfit = 0;

      for (const item of saleItems) {
        const purchasePrice = Number(item?.car?.purchase_price) || 0;
        const itemSalePrice = Number(item.sale_price) || 0;
        const itemProfit = itemSalePrice - purchasePrice;
        totalItemsProfit += itemProfit;

        const { error: itemErr } = await supabase
          .from('sale_items')
          .update({ profit: itemProfit })
          .eq('id', item.id);

        if (itemErr) throw itemErr;
        itemsUpdated += 1;
      }

      const finalProfit = totalItemsProfit - commission - otherExpenses;
      const { error: saleErr } = await supabase
        .from('sales')
        .update({ profit: finalProfit })
        .eq('id', (sale as any).id);

      if (saleErr) throw saleErr;
      salesUpdated += 1;
    } else {
      // Legacy single-car sale without sale_items
      const purchasePrice = Number((sale as any).car?.purchase_price) || 0;
      const salePrice = Number((sale as any).sale_price) || 0;
      const profit = salePrice - purchasePrice - commission - otherExpenses;

      const { error: saleErr } = await supabase
        .from('sales')
        .update({ profit })
        .eq('id', (sale as any).id);

      if (saleErr) throw saleErr;
      salesUpdated += 1;
    }
  }

  return { salesUpdated, itemsUpdated };
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

// Update sale with items for multi-car sales
export async function updateSaleWithItems(
  saleId: string, 
  saleData: {
    sale_price: number;
    seller_name?: string | null;
    commission?: number;
    other_expenses?: number;
    sale_date: string;
    profit: number;
    payment_account_id?: string | null;
  },
  items: Array<{
    car_id: string;
    sale_price: number;
    purchase_price: number;
  }>
) {
  // Update the main sale record
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .update({
      sale_price: saleData.sale_price,
      seller_name: saleData.seller_name,
      commission: saleData.commission || 0,
      other_expenses: saleData.other_expenses || 0,
      sale_date: saleData.sale_date,
      profit: saleData.profit,
      payment_account_id: saleData.payment_account_id,
    })
    .eq('id', saleId)
    .select()
    .single();
  
  if (saleError) throw saleError;

  // Delete existing sale items
  const { error: deleteError } = await supabase
    .from('sale_items')
    .delete()
    .eq('sale_id', saleId);
  
  if (deleteError) throw deleteError;

  // Insert updated sale items
  if (items.length > 0) {
    const saleItems = items.map(item => ({
      sale_id: saleId,
      car_id: item.car_id,
      sale_price: item.sale_price,
      profit: item.sale_price - item.purchase_price,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);
    
    if (itemsError) throw itemsError;
  }

  return sale;
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
  const VAT_RATE = 1.15; // 15% VAT
  const now = new Date();
  const today = toDateOnly(now);
  // Current month boundaries (1st day to last day of current month)
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startOfMonth = toDateOnly(currentMonthStart);
  const endOfMonth = toDateOnly(currentMonthEnd);

  // Parse YYYY-MM-DD as a *local* date (avoid timezone shifting from Date("YYYY-MM-DD") which is UTC).
  const parseLocalISODate = (iso: string, endOfDay = false) => {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    if (endOfDay) dt.setHours(23, 59, 59, 999);
    else dt.setHours(0, 0, 0, 0);
    return dt;
  };

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

  // Available cars count - filter by purchase_date within fiscal year
  let availableCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available');

  if (fiscalYearStart && fiscalYearEnd) {
    availableCarsQuery = availableCarsQuery
      .gte('purchase_date', fiscalYearStart)
      .lte('purchase_date', fiscalYearEnd);
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
    .select('amount, car_id, expense_date, payment_method');
  
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
  
  // Separate prepaid amortization expenses (payment_method = 'prepaid') from other general expenses
  const processedPrepaidExpenses = expensesData?.filter(exp => !exp.car_id && exp.payment_method === 'prepaid')
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  
  // Calculate other general expenses (not linked to any car and NOT prepaid amortization)
  const otherOperatingExpenses = expensesData?.filter(exp => !exp.car_id && exp.payment_method !== 'prepaid')
    .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
  
  // Get approved payroll expenses (salaries are administrative expenses)
  // Actual salary expense = Gross salary - Absences
  // Advances are NOT deducted because they were already paid out earlier
  let payrollQuery = supabase
    .from('payroll_records')
    .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('status', 'approved');
  
  const { data: allPayrollData } = await payrollQuery;
  
  // Filter payroll by fiscal year using month/year fields instead of created_at
  let payrollData = allPayrollData;
  if (fiscalYearStart && fiscalYearEnd) {
    // IMPORTANT: use local date parsing to avoid excluding boundary months (e.g., month 1) بسبب فرق التوقيت.
    const fyStartDate = parseLocalISODate(fiscalYearStart, false);
    const fyEndDate = parseLocalISODate(fiscalYearEnd, true);
    payrollData = allPayrollData?.filter(p => {
      // Build a date from payroll month/year (first day of month)
      const payrollDate = new Date(Number(p.year), Number(p.month) - 1, 1);
      payrollDate.setHours(0, 0, 0, 0);
      return payrollDate >= fyStartDate && payrollDate <= fyEndDate;
    }) || [];
  }
  
  // Sum all approved payroll: (base + allowances + bonuses + overtime) - absences
  const payrollExpenses = payrollData?.reduce((sum, p) => {
    const base = Number(p.total_base_salaries) || 0;
    const allowances = Number(p.total_allowances) || 0;
    const bonuses = Number(p.total_bonuses) || 0;
    const overtime = Number(p.total_overtime) || 0;
    const absences = Number(p.total_absences) || 0;
    return sum + base + allowances + bonuses + overtime - absences;
  }, 0) || 0;
  
  // Get due prepaid expense amortizations (rent, etc.) - include pending ones that are due
  let prepaidAmortQuery = supabase
    .from('prepaid_expense_amortizations')
    .select(`
      amount,
      amortization_date,
      status,
      prepaid_expense:prepaid_expenses(company_id, status)
    `)
    .lte('amortization_date', toDateOnly(now)); // Due up to today
  
  if (fiscalYearStart && fiscalYearEnd) {
    prepaidAmortQuery = prepaidAmortQuery
      .gte('amortization_date', fiscalYearStart)
      .lte('amortization_date', fiscalYearEnd);
  }
  
  const { data: prepaidAmortData } = await prepaidAmortQuery;
  
  // Calculate pending (unprocessed) prepaid amortizations that are due
  const pendingPrepaidExpenses = prepaidAmortData?.filter(a => {
    const prepaid = a.prepaid_expense as any;
    return a.status === 'pending' && prepaid?.status === 'active';
  }).reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 0;
  
  // Total prepaid/rent expenses = processed (in expenses table) + pending (not yet processed)
  const totalPrepaidExpenses = processedPrepaidExpenses + pendingPrepaidExpenses;
  
  // Total general expenses = other operating + payroll + prepaid/rent
  const generalExpenses = otherOperatingExpenses + payrollExpenses + totalPrepaidExpenses;
  
  // Net profit = Gross profit - Car expenses - General expenses
  const totalProfit = totalGrossProfit - carExpenses - generalExpenses;

  // Month sales count (within current month and fiscal year)
  let monthSalesCount = 0;
  if (fiscalYearStart && fiscalYearEnd) {
    // Use current month boundaries strictly (not comparing with fiscal year)
    monthSalesCount = salesData?.filter(sale => {
      const saleDate = sale.sale_date;
      return saleDate >= startOfMonth && saleDate <= endOfMonth;
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
  
  // Total purchases - prices are already VAT-inclusive
  const totalPurchases = purchasesData?.reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0) || 0;

  // Month sales amount (sum of sale prices this month within fiscal year) - VAT-inclusive (15%)
  let monthSalesAmount = 0;
  if (fiscalYearStart && fiscalYearEnd) {
    const monthSalesFiltered = salesData?.filter(sale => {
      const saleDate = sale.sale_date;
      // Use current month boundaries strictly
      return saleDate >= startOfMonth && saleDate <= endOfMonth;
    }) || [];
    // Calculate base amount then add VAT (15%)
    const baseAmount = monthSalesFiltered.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0);
    monthSalesAmount = baseAmount * 1.15;
  } else {
    const baseAmount = salesData?.filter(sale => sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth)
      .reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;
    monthSalesAmount = baseAmount * 1.15;
  }

  // Count cars for purchases breakdown
  const purchasesCount = purchasesData?.length || 0;

  // Month sales breakdown - use strict month boundaries
  const monthSalesData = salesData?.filter(sale => {
    const saleDate = sale.sale_date;
    return saleDate >= startOfMonth && saleDate <= endOfMonth;
  }) || [];

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
    // Detailed expense breakdown
    payrollExpenses,
    prepaidExpensesDue: totalPrepaidExpenses,
    otherGeneralExpenses: otherOperatingExpenses,
    // Extended breakdown data
    purchasesCount,
    monthSalesProfit,
    totalSalesCount: salesData?.length || 0,
    totalSalesAmount: salesData?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0,
  };
}

// All-time stats (across all fiscal years) - amounts include 15% VAT
export async function fetchAllTimeStats() {
  const VAT_RATE = 1.15;
  
  // Total purchases across all years
  const { data: carsData } = await supabase
    .from('cars')
    .select('purchase_price');
  
  // Prices are already VAT-inclusive
  const allTimePurchases = carsData?.reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0) || 0;
  
  // Total sales across all years
  const { data: salesData } = await supabase
    .from('sales')
    .select('sale_price, profit');
  
  // Prices are already VAT-inclusive
  const allTimeSales = salesData?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;
  const allTimeSalesCount = salesData?.length || 0;
  const allTimeProfit = salesData?.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0) || 0;
  
  return {
    allTimePurchases,
    allTimeSales,
    allTimeSalesCount,
    allTimeProfit,
    totalCarsCount: carsData?.length || 0,
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
