import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getCompanyOverride } from '@/lib/companyOverride';

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
  // Check for super admin override first
  const override = getCompanyOverride();
  if (override) return override;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('user_id', user.id)
    .single();
  
  return profile?.company_id || null;
}

// Strict version that requires company_id - returns empty results if not available
async function requireCompanyId(): Promise<string> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('COMPANY_REQUIRED');
  return companyId;
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
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('customers_safe')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data?.map(customer => ({
    ...customer,
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
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('suppliers_safe')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
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
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('cars')
    .select(`
      *,
      supplier:suppliers(name),
      payment_account:account_categories!cars_payment_account_id_fkey(id, name, code)
    `)
    .eq('company_id', companyId)
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

  // Auto-create purchase journal entry
  try {
    await createPurchaseJournalEntry(companyId, data, car.supplier_id || null);
  } catch (journalError) {
    console.error('Auto journal entry for purchase failed:', journalError);
  }

  return data;
}

async function createPurchaseJournalEntry(companyId: string, car: any, supplierId: string | null) {
  // Check if auto purchase entries are enabled
  const { data: settings } = await supabase
    .from('company_accounting_settings')
    .select('auto_journal_entries_enabled, auto_purchase_entries, purchase_inventory_account_id, suppliers_account_id')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!settings?.auto_journal_entries_enabled || !settings?.auto_purchase_entries) return;

  const purchasePrice = Number(car.purchase_price);
  if (!purchasePrice || purchasePrice <= 0) return;

  // Find inventory account - use configured or find by code 1301
  let inventoryAccountId = settings.purchase_inventory_account_id;
  if (!inventoryAccountId) {
    const { data: invAccount } = await supabase
      .from('account_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', '1301')
      .maybeSingle();
    inventoryAccountId = invAccount?.id || null;
  }

  // Find supplier sub-account under 2101
  let supplierAccountId = settings.suppliers_account_id;
  if (supplierId) {
    // Try to find the supplier's dedicated sub-account
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('name')
      .eq('id', supplierId)
      .maybeSingle();

    if (supplier?.name) {
      const { data: subAccount } = await supabase
        .from('account_categories')
        .select('id')
        .eq('company_id', companyId)
        .like('code', '2101%')
        .eq('name', supplier.name)
        .maybeSingle();
      
      if (subAccount) {
        supplierAccountId = subAccount.id;
      }
    }
  }

  // Fallback to parent suppliers account 2101
  if (!supplierAccountId) {
    const { data: parentAccount } = await supabase
      .from('account_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', '2101')
      .maybeSingle();
    supplierAccountId = parentAccount?.id || null;
  }

  if (!inventoryAccountId || !supplierAccountId) return;

  const description = `شراء سيارة: ${car.name} - هيكل: ${car.chassis_number}`;

  // Insert journal entry
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      company_id: companyId,
      entry_date: car.purchase_date || new Date().toISOString().split('T')[0],
      description,
      reference_type: 'purchase',
      reference_id: car.id,
      total_debit: purchasePrice,
      total_credit: purchasePrice,
      is_posted: true,
      fiscal_year_id: car.fiscal_year_id || null,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // Insert lines: Debit Inventory, Credit Supplier
  const { error: linesError } = await supabase
    .from('journal_entry_lines')
    .insert([
      {
        journal_entry_id: entry.id,
        account_id: inventoryAccountId,
        description: `مخزون - ${car.name}`,
        debit: purchasePrice,
        credit: 0,
      },
      {
        journal_entry_id: entry.id,
        account_id: supplierAccountId,
        description: `مستحقات مورد - ${car.name}`,
        debit: 0,
        credit: purchasePrice,
      },
    ]);

  if (linesError) throw linesError;
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
  const companyId = await requireCompanyId();
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
    .eq('company_id', companyId)
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

  // Also update sale_items if sale_price changed (for single-car sales)
  if (sale.sale_price !== undefined) {
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('id, car_id')
      .eq('sale_id', id);
    
    if (saleItems && saleItems.length === 1) {
      const profit = sale.profit !== undefined ? sale.profit : (sale.sale_price - 0);
      await supabase
        .from('sale_items')
        .update({ 
          sale_price: sale.sale_price,
          profit: profit,
        })
        .eq('id', saleItems[0].id);
    }
  }

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

  const companyId = await requireCompanyId();
  const { data: companyRecord } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();

  const companyType = companyRecord?.company_type;

  // Real estate dashboard uses projects + invoices (not cars + sales)
  if (companyType === 'real_estate') {
    let projectsQuery = supabase
      .from('re_projects')
      .select('id, name, status')
      .eq('company_id', companyId);

    let purchaseInvoicesQuery = supabase
      .from('invoices')
      .select('subtotal, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'purchase');

    let salesInvoicesQuery = supabase
      .from('invoices')
      .select('subtotal, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sales');

    if (fiscalYearStart && fiscalYearEnd) {
      purchaseInvoicesQuery = purchaseInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);

      salesInvoicesQuery = salesInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);
    }

    // Also fetch account 1301 (Projects Under Development) balance from journal entries
    const account1301Query = supabase
      .from('account_categories')
      .select('id')
      .eq('company_id', companyId)
      .eq('code', '1301')
      .maybeSingle();

    const [projectsResult, purchaseInvoicesResult, salesInvoicesResult, account1301Result] = await Promise.all([
      projectsQuery,
      purchaseInvoicesQuery,
      salesInvoicesQuery,
      account1301Query,
    ]);

    const projects = projectsResult.data || [];
    const purchaseInvoices = purchaseInvoicesResult.data || [];
    const salesInvoices = salesInvoicesResult.data || [];

    // Calculate totalPurchases from account 1301 journal entries (source of truth)
    let totalPurchases = 0;
    const account1301 = account1301Result.data;
    if (account1301) {
      // Get all child accounts under 1301
      const { data: allAccounts } = await supabase
        .from('account_categories')
        .select('id, parent_id, type')
        .eq('company_id', companyId);

      if (allAccounts) {
        const childrenOf = new Map<string, string[]>();
        allAccounts.forEach(a => {
          if (a.parent_id) {
            const existing = childrenOf.get(a.parent_id) || [];
            existing.push(a.id);
            childrenOf.set(a.parent_id, existing);
          }
        });

        function getLeaves(accountId: string): string[] {
          const children = childrenOf.get(accountId);
          if (!children || children.length === 0) return [accountId];
          return children.flatMap(getLeaves);
        }

        const leafIds = getLeaves(account1301.id);

        let journalQuery = supabase
          .from('journal_entry_lines')
          .select('debit, credit, journal_entries!inner(is_posted, company_id, fiscal_year_id)')
          .eq('journal_entries.company_id', companyId)
          .eq('journal_entries.is_posted', true)
          .in('account_id', leafIds);

        if (fiscalYearId) {
          journalQuery = journalQuery.eq('journal_entries.fiscal_year_id', fiscalYearId);
        }

        const { data: lines } = await journalQuery;
        if (lines) {
          totalPurchases = lines.reduce((sum: number, line: any) => {
            return sum + (Number(line.debit) || 0) - (Number(line.credit) || 0);
          }, 0);
        }
      }
    }

    // Fallback to invoice sum if no account 1301 data
    if (totalPurchases === 0 && purchaseInvoices.length > 0) {
      totalPurchases = Math.round(
        purchaseInvoices.reduce((sum: number, invoice: any) => sum + (Number(invoice.subtotal) || 0), 0)
      );
    }

    const activeProjectsList = projects.filter((project: any) => {
      const status = String(project.status || '').toLowerCase();
      return status !== 'completed' && status !== 'cancelled' && status !== 'canceled';
    });
    const activeProjects = activeProjectsList.length;
    const activeProjectNames = activeProjectsList.map((p: any) => p.name).filter(Boolean);

    const totalSalesAmount = salesInvoices.reduce(
      (sum: number, invoice: any) => sum + (Number(invoice.subtotal) || 0),
      0
    );

    const monthSalesData = salesInvoices.filter((invoice: any) => {
      const invoiceDate = invoice.invoice_date;
      return invoiceDate >= startOfMonth && invoiceDate <= endOfMonth;
    });

    const monthPurchasesData = purchaseInvoices.filter((invoice: any) => {
      const invoiceDate = invoice.invoice_date;
      return invoiceDate >= startOfMonth && invoiceDate <= endOfMonth;
    });

    const monthSalesAmount = monthSalesData.reduce(
      (sum: number, invoice: any) => sum + (Number(invoice.subtotal) || 0),
      0
    );

    const monthPurchasesAmount = monthPurchasesData.reduce(
      (sum: number, invoice: any) => sum + (Number(invoice.subtotal) || 0),
      0
    );

    return {
      availableNewCars: 0,
      availableUsedCars: 0,
      availableCars: activeProjects,
      activeProjectNames,
      todaySales: salesInvoices.filter((invoice: any) => invoice.invoice_date === today).length,
      totalProfit: totalSalesAmount,
      monthSales: monthSalesData.length,
      totalPurchases,
      monthSalesAmount,
      totalGrossProfit: totalSalesAmount,
      totalCarExpenses: 0,
      totalGeneralExpenses: 0,
      payrollExpenses: 0,
      prepaidExpensesDue: 0,
      otherGeneralExpenses: 0,
      purchasesCount: purchaseInvoices.length,
      monthSalesProfit: monthSalesAmount - monthPurchasesAmount,
      totalSalesCount: salesInvoices.length,
      totalSalesAmount,
    };
  }

  // For non-car companies: use invoices table
  if (companyType && companyType !== 'car_dealership') {
    let purchaseInvoicesQuery = supabase
      .from('invoices')
      .select('subtotal, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'purchase');

    let salesInvoicesQuery = supabase
      .from('invoices')
      .select('subtotal, invoice_date')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sales');

    if (fiscalYearStart && fiscalYearEnd) {
      purchaseInvoicesQuery = purchaseInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);
      salesInvoicesQuery = salesInvoicesQuery
        .gte('invoice_date', fiscalYearStart)
        .lte('invoice_date', fiscalYearEnd);
    }

    let expensesQueryGeneral = supabase
      .from('expenses')
      .select('amount, car_id, expense_date, payment_method')
      .eq('company_id', companyId);
    
    if (fiscalYearStart && fiscalYearEnd) {
      expensesQueryGeneral = expensesQueryGeneral
        .gte('expense_date', fiscalYearStart)
        .lte('expense_date', fiscalYearEnd);
    }

    let payrollQueryGeneral = supabase
      .from('payroll_records')
      .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
      .eq('status', 'approved')
      .eq('company_id', companyId);

    const [purchaseResult, salesResult, expensesResultGeneral, payrollResultGeneral] = await Promise.all([
      purchaseInvoicesQuery,
      salesInvoicesQuery,
      expensesQueryGeneral,
      payrollQueryGeneral,
    ]);

    const purchaseInvoices = purchaseResult.data || [];
    const salesInvoices = salesResult.data || [];
    const expensesDataGeneral = expensesResultGeneral.data || [];

    const totalPurchasesGeneral = Math.round(
      purchaseInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0)
    );
    const totalSalesAmountGeneral = salesInvoices.reduce(
      (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0
    );

    const generalExpensesAmount = expensesDataGeneral
      .filter(exp => !exp.car_id)
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    let payrollDataGeneral = payrollResultGeneral.data || [];
    if (fiscalYearStart && fiscalYearEnd) {
      const fyStartDate = parseLocalISODate(fiscalYearStart, false);
      const fyEndDate = parseLocalISODate(fiscalYearEnd, true);
      payrollDataGeneral = payrollDataGeneral.filter(p => {
        const payrollDate = new Date(Number(p.year), Number(p.month) - 1, 1);
        return payrollDate >= fyStartDate && payrollDate <= fyEndDate;
      });
    }
    const payrollExpensesGeneral = payrollDataGeneral.reduce((sum, p) => {
      return sum + (Number(p.total_base_salaries) || 0) + (Number(p.total_allowances) || 0) 
        + (Number(p.total_bonuses) || 0) + (Number(p.total_overtime) || 0) - (Number(p.total_absences) || 0);
    }, 0);

    const monthSalesInvoices = salesInvoices.filter((inv: any) => 
      inv.invoice_date >= startOfMonth && inv.invoice_date <= endOfMonth
    );
    const monthPurchaseInvoices = purchaseInvoices.filter((inv: any) => 
      inv.invoice_date >= startOfMonth && inv.invoice_date <= endOfMonth
    );
    const monthSalesAmountGeneral = monthSalesInvoices.reduce(
      (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0
    );
    const monthPurchasesAmount = monthPurchaseInvoices.reduce(
      (sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0
    );

    const totalExpensesGeneral = generalExpensesAmount + payrollExpensesGeneral;
    const netProfitGeneral = totalSalesAmountGeneral - totalPurchasesGeneral - totalExpensesGeneral;

    return {
      availableNewCars: 0,
      availableUsedCars: 0,
      availableCars: 0,
      todaySales: salesInvoices.filter((inv: any) => inv.invoice_date === today).length,
      totalProfit: netProfitGeneral,
      monthSales: monthSalesInvoices.length,
      totalPurchases: totalPurchasesGeneral,
      monthSalesAmount: monthSalesAmountGeneral,
      totalGrossProfit: totalSalesAmountGeneral - totalPurchasesGeneral,
      totalCarExpenses: 0,
      totalGeneralExpenses: totalExpensesGeneral,
      payrollExpenses: payrollExpensesGeneral,
      prepaidExpensesDue: 0,
      otherGeneralExpenses: generalExpensesAmount,
      purchasesCount: purchaseInvoices.length,
      monthSalesProfit: monthSalesAmountGeneral - monthPurchasesAmount,
      totalSalesCount: salesInvoices.length,
      totalSalesAmount: totalSalesAmountGeneral,
    };
  }

  // === Car dealership specific stats ===
  // Build all queries - always filter by company_id
  let availableCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')
    .eq('company_id', companyId);

  let availableNewCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')
    .eq('car_condition', 'new')
    .eq('company_id', companyId);

  let availableUsedCarsQuery = supabase
    .from('cars')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')
    .eq('car_condition', 'used')
    .eq('company_id', companyId);

  if (fiscalYearStart && fiscalYearEnd) {
    availableCarsQuery = availableCarsQuery
      .gte('purchase_date', fiscalYearStart)
      .lte('purchase_date', fiscalYearEnd);
    availableNewCarsQuery = availableNewCarsQuery
      .gte('purchase_date', fiscalYearStart)
      .lte('purchase_date', fiscalYearEnd);
    availableUsedCarsQuery = availableUsedCarsQuery
      .gte('purchase_date', fiscalYearStart)
      .lte('purchase_date', fiscalYearEnd);
  }

  let todaySalesQuery = supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('sale_date', today)
    .eq('company_id', companyId);
  
  if (fiscalYearStart && fiscalYearEnd) {
    todaySalesQuery = todaySalesQuery
      .gte('sale_date', fiscalYearStart)
      .lte('sale_date', fiscalYearEnd);
  }

  let salesQuery = supabase
    .from('sales')
    .select('profit, car_id, sale_date, sale_price')
    .eq('company_id', companyId);
  
  if (fiscalYearStart && fiscalYearEnd) {
    salesQuery = salesQuery
      .gte('sale_date', fiscalYearStart)
      .lte('sale_date', fiscalYearEnd);
  }

  let expensesQuery = supabase
    .from('expenses')
    .select('amount, car_id, expense_date, payment_method')
    .eq('company_id', companyId);
  
  if (fiscalYearStart && fiscalYearEnd) {
    expensesQuery = expensesQuery
      .gte('expense_date', fiscalYearStart)
      .lte('expense_date', fiscalYearEnd);
  }

  let payrollQuery = supabase
    .from('payroll_records')
    .select('month, year, total_base_salaries, total_allowances, total_bonuses, total_overtime, total_absences')
    .eq('status', 'approved')
    .eq('company_id', companyId);

  let prepaidAmortQuery = supabase
    .from('prepaid_expense_amortizations')
    .select(`
      amount,
      amortization_date,
      status,
      prepaid_expense:prepaid_expenses!inner(company_id, status)
    `)
    .lte('amortization_date', toDateOnly(now))
    .eq('prepaid_expense.company_id', companyId);
  
  if (fiscalYearStart && fiscalYearEnd) {
    prepaidAmortQuery = prepaidAmortQuery
      .gte('amortization_date', fiscalYearStart)
      .lte('amortization_date', fiscalYearEnd);
  }

  let purchasesQuery = supabase
    .from('cars')
    .select('purchase_price, car_condition')
    .eq('company_id', companyId);
  
  if (fiscalYearId) {
    if (fiscalYearStart && fiscalYearEnd) {
      purchasesQuery = purchasesQuery.or(
        `fiscal_year_id.eq.${fiscalYearId},and(fiscal_year_id.is.null,purchase_date.gte.${fiscalYearStart},purchase_date.lte.${fiscalYearEnd})`
      );
    } else {
      purchasesQuery = purchasesQuery.eq('fiscal_year_id', fiscalYearId);
    }
  }

  // Execute ALL queries in parallel for maximum performance
  const [
    availableCarsResult,
    availableNewCarsResult,
    availableUsedCarsResult,
    todaySalesResult,
    salesResult,
    expensesResult,
    payrollResult,
    prepaidAmortResult,
    purchasesResult
  ] = await Promise.all([
    availableCarsQuery,
    availableNewCarsQuery,
    availableUsedCarsQuery,
    todaySalesQuery,
    salesQuery,
    expensesQuery,
    payrollQuery,
    prepaidAmortQuery,
    purchasesQuery
  ]);

  const availableCars = availableCarsResult.count;
  const availableNewCars = availableNewCarsResult.count || 0;
  const availableUsedCars = availableUsedCarsResult.count || 0;
  const todaySales = todaySalesResult.count;
  const salesData = salesResult.data;
  const expensesData = expensesResult.data;
  const allPayrollData = payrollResult.data;
  const prepaidAmortData = prepaidAmortResult.data;
  const purchasesData = purchasesResult.data;
  
  const totalGrossProfit = salesData?.reduce((sum, sale) => sum + (Number(sale.profit) || 0), 0) || 0;

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
  
  // Filter payroll by fiscal year using month/year fields instead of created_at
  let payrollData = allPayrollData;
  if (fiscalYearStart && fiscalYearEnd) {
    const fyStartDate = parseLocalISODate(fiscalYearStart, false);
    const fyEndDate = parseLocalISODate(fiscalYearEnd, true);
    payrollData = allPayrollData?.filter(p => {
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
    monthSalesCount = salesData?.filter(sale => {
      const saleDate = sale.sale_date;
      return saleDate >= startOfMonth && saleDate <= endOfMonth;
    }).length || 0;
  } else {
    monthSalesCount = salesData?.filter(sale => sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth).length || 0;
  }

  // Total purchases - show raw amounts from database as-is
  const totalPurchases = Math.round(
    (purchasesData || []).reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0)
  );

  // Month sales amount - store as RAW amount from DB (no VAT pre-processing)
  // calculateDisplayAmount() in the UI handles VAT display modes
  let monthSalesAmount = 0;
  if (fiscalYearStart && fiscalYearEnd) {
    const monthSalesFiltered = salesData?.filter(sale => {
      const saleDate = sale.sale_date;
      return saleDate >= startOfMonth && saleDate <= endOfMonth;
    }) || [];

    monthSalesAmount = monthSalesFiltered.reduce(
      (sum, sale) => sum + (Number(sale.sale_price) || 0),
      0,
    );
  } else {
    monthSalesAmount =
      salesData?.filter(sale => sale.sale_date >= startOfMonth && sale.sale_date <= endOfMonth)
        .reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;
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
    availableNewCars,
    availableUsedCars,
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

// All-time stats (across all fiscal years)
export async function fetchAllTimeStats() {
  const companyId = await requireCompanyId();
  
  // Get company type
  const { data: companyRecord } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();

  const companyType = companyRecord?.company_type;

  // For non-car companies: use invoices
  if (companyType && companyType !== 'car_dealership') {
    const [purchaseResult, salesResult] = await Promise.all([
      supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'purchase'),
      supabase.from('invoices').select('subtotal').eq('company_id', companyId).eq('invoice_type', 'sales'),
    ]);

    const allTimePurchases = Math.round(
      (purchaseResult.data || []).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0)
    );
    const allTimeSales = (salesResult.data || []).reduce((sum: number, inv: any) => sum + (Number(inv.subtotal) || 0), 0);

    return {
      allTimePurchases,
      allTimeSales,
      allTimeSalesCount: salesResult.data?.length || 0,
      allTimeProfit: allTimeSales - allTimePurchases,
      totalCarsCount: 0,
    };
  }

  // Car dealership
  const { data: carsData } = await supabase.from('cars').select('purchase_price').eq('company_id', companyId);
  const allTimePurchases = Math.round(carsData?.reduce((sum, car) => sum + (Number(car.purchase_price) || 0), 0) || 0);
  
  const { data: salesData } = await supabase.from('sales').select('sale_price, profit').eq('company_id', companyId);
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

  const companyId = await requireCompanyId();

  // Get company type
  const { data: companyRecord } = await supabase
    .from('companies')
    .select('company_type')
    .eq('id', companyId)
    .maybeSingle();

  const companyType = companyRecord?.company_type;

  let rawData: Array<{ date: string; amount: number; profit: number }> = [];

  if (companyType && companyType !== 'car_dealership') {
    // Non-car companies: use invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_date, subtotal')
      .eq('company_id', companyId)
      .eq('invoice_type', 'sales')
      .gte('invoice_date', startDate)
      .lte('invoice_date', endDate)
      .order('invoice_date', { ascending: true });

    if (error) throw error;

    rawData = (invoices || []).map((inv: any) => ({
      date: inv.invoice_date,
      amount: Number(inv.subtotal) || 0,
      profit: Number(inv.subtotal) || 0,
    }));
  } else {
    // Car dealership: use sales table
    const { data, error } = await supabase
      .from('sales')
      .select('sale_date, sale_price, profit')
      .eq('company_id', companyId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)
      .order('sale_date', { ascending: true });

    if (error) throw error;

    rawData = (data || []).map(sale => ({
      date: sale.sale_date,
      amount: Number(sale.sale_price) || 0,
      profit: Number(sale.profit) || 0,
    }));
  }

  // Group by month
  const monthlyData: Record<string, { sales: number; profit: number }> = {};
  
  rawData.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { sales: 0, profit: 0 };
    }
    
    monthlyData[monthKey].sales += item.amount;
    monthlyData[monthKey].profit += item.profit;
  });

  // Convert to array with Arabic month names
  const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const result = [];
  
  if (fiscalYearStart && fiscalYearEnd) {
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
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('purchase_batches')
    .select(`
      *,
      supplier:suppliers(name),
      cars:cars(*)
    `)
    .eq('company_id', companyId)
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

  // Create the main sale record as DRAFT
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
      status: 'draft',
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

// Approve a draft sale (changes status to approved, triggers journal entry)
export async function approveSale(saleId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('sales')
    .update({ 
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user?.id || null,
    })
    .eq('id', saleId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function fetchSalesWithItems() {
  const companyId = await requireCompanyId();
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
    .eq('company_id', companyId)
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
