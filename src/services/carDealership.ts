/**
 * Car Dealership Module - Isolated service functions for car_dealership company type only.
 * These functions should ONLY be called when company_type === 'car_dealership'.
 */
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { requireCompanyId } from '@/services/companyContext';

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

  try {
    await createPurchaseJournalEntry(companyId, data, car.supplier_id || null);
  } catch (journalError) {
    console.error('Auto journal entry for purchase failed:', journalError);
  }

  return data;
}

async function createPurchaseJournalEntry(companyId: string, car: any, supplierId: string | null) {
  const { data: settings } = await supabase
    .from('company_accounting_settings')
    .select('auto_journal_entries_enabled, auto_purchase_entries, purchase_inventory_account_id, suppliers_account_id')
    .eq('company_id', companyId)
    .maybeSingle();

  if (!settings?.auto_journal_entries_enabled || !settings?.auto_purchase_entries) return;

  const purchasePrice = Number(car.purchase_price);
  if (!purchasePrice || purchasePrice <= 0) return;

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

  let supplierAccountId = settings.suppliers_account_id;
  if (supplierId) {
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
      if (subAccount) supplierAccountId = subAccount.id;
    }
  }

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

async function recalculateSalesProfitForCar(carId: string, newPurchasePrice: number) {
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('id, sale_id, sale_price')
    .eq('car_id', carId);

  for (const item of saleItems || []) {
    const newProfit = Number(item.sale_price) - newPurchasePrice;
    await supabase.from('sale_items').update({ profit: newProfit }).eq('id', item.id);
  }

  const { data: directSales } = await supabase
    .from('sales')
    .select('id, sale_price, commission, other_expenses')
    .eq('car_id', carId);

  for (const sale of directSales || []) {
    const commission = Number(sale.commission) || 0;
    const otherExpenses = Number(sale.other_expenses) || 0;
    const newProfit = Number(sale.sale_price) - newPurchasePrice - commission - otherExpenses;
    await supabase.from('sales').update({ profit: newProfit }).eq('id', sale.id);
  }

  const uniqueSaleIds = [...new Set((saleItems || []).map(item => item.sale_id))];
  for (const saleId of uniqueSaleIds) {
    const { data: allItems } = await supabase.from('sale_items').select('profit').eq('sale_id', saleId);
    if (allItems && allItems.length > 0) {
      const totalItemsProfit = allItems.reduce((sum, item) => sum + (Number(item.profit) || 0), 0);
      const { data: saleData } = await supabase
        .from('sales')
        .select('commission, other_expenses')
        .eq('id', saleId)
        .single();
      const commission = Number(saleData?.commission) || 0;
      const otherExpenses = Number(saleData?.other_expenses) || 0;
      await supabase.from('sales').update({ profit: totalItemsProfit - commission - otherExpenses }).eq('id', saleId);
    }
  }
}

export async function recalculateCompanySalesProfits(): Promise<{ salesUpdated: number; itemsUpdated: number }> {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');

  const { data: sales, error } = await supabase
    .from('sales')
    .select(`id, sale_price, commission, other_expenses, car_id, car:cars(purchase_price), sale_items:sale_items(id, car_id, sale_price, car:cars(purchase_price))`)
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
        const { error: itemErr } = await supabase.from('sale_items').update({ profit: itemProfit }).eq('id', item.id);
        if (itemErr) throw itemErr;
        itemsUpdated += 1;
      }
      const finalProfit = totalItemsProfit - commission - otherExpenses;
      const { error: saleErr } = await supabase.from('sales').update({ profit: finalProfit }).eq('id', (sale as any).id);
      if (saleErr) throw saleErr;
      salesUpdated += 1;
    } else {
      const purchasePrice = Number((sale as any).car?.purchase_price) || 0;
      const salePrice = Number((sale as any).sale_price) || 0;
      const profit = salePrice - purchasePrice - commission - otherExpenses;
      const { error: saleErr } = await supabase.from('sales').update({ profit }).eq('id', (sale as any).id);
      if (saleErr) throw saleErr;
      salesUpdated += 1;
    }
  }

  return { salesUpdated, itemsUpdated };
}

export async function deleteCar(id: string) {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  if (error) throw error;
}

export async function updateCarStatus(carId: string, status: 'available' | 'sold') {
  const { error } = await supabase.from('cars').update({ status }).eq('id', carId);
  if (error) throw error;
}

// Sales (car-specific)
export async function fetchSales() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      car:cars(*),
      customer:customers(name, phone, address, id_number, registration_number),
      sale_items:sale_items(*, car:cars(*)),
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

  if (sale.sale_price !== undefined) {
    const { data: saleItems } = await supabase.from('sale_items').select('id, car_id').eq('sale_id', id);
    if (saleItems && saleItems.length === 1) {
      const profit = sale.profit !== undefined ? sale.profit : (sale.sale_price - 0);
      await supabase.from('sale_items').update({ sale_price: sale.sale_price, profit }).eq('id', saleItems[0].id);
    }
  }
  return data;
}

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
  items: Array<{ car_id: string; sale_price: number; purchase_price: number }>
) {
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

  await supabase.from('sale_items').delete().eq('sale_id', saleId);

  if (items.length > 0) {
    const saleItems = items.map(item => ({
      sale_id: saleId,
      car_id: item.car_id,
      sale_price: item.sale_price,
      profit: item.sale_price - item.purchase_price,
    }));
    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
    if (itemsError) throw itemsError;
  }
  return sale;
}

export async function deleteSale(id: string, carId: string) {
  const { data: saleItems, error: fetchError } = await supabase
    .from('sale_items')
    .select('car_id')
    .eq('sale_id', id);
  if (fetchError) throw fetchError;

  if (saleItems && saleItems.length > 0) {
    await supabase.from('sale_items').delete().eq('sale_id', id);
  }

  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;

  if (saleItems && saleItems.length > 0) {
    for (const item of saleItems) {
      await updateCarStatus(item.car_id, 'available');
    }
  } else {
    await updateCarStatus(carId, 'available');
  }
}

export async function reverseSale(saleId: string) {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select(`*, sale_items (id, car_id, sale_price, profit)`)
    .eq('id', saleId)
    .single();
  if (saleError) throw saleError;
  if (!sale) throw new Error('Sale not found');

  const saleItems = (sale as any).sale_items || [];

  if (saleItems.length > 0) {
    await supabase.from('sale_items').delete().eq('sale_id', saleId);
    for (const item of saleItems) {
      await updateCarStatus(item.car_id, 'available');
    }
  } else {
    await updateCarStatus(sale.car_id, 'available');
  }

  await supabase.from('journal_entries').delete().eq('reference_type', 'sale').eq('reference_id', saleId);
  const { error: deleteError } = await supabase.from('sales').delete().eq('id', saleId);
  if (deleteError) throw deleteError;
  return sale;
}

// Purchase Batches
export async function addPurchaseBatch(
  batchData: PurchaseBatchInsert & { payment_account_id?: string },
  cars: Array<Omit<CarInsert, 'batch_id'>>
) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');

  const { data: batch, error: batchError } = await supabase
    .from('purchase_batches')
    .insert({
      supplier_id: batchData.supplier_id,
      purchase_date: batchData.purchase_date,
      notes: batchData.notes,
      company_id: companyId,
    })
    .select()
    .single();
  if (batchError) throw batchError;

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
    .select(`*, supplier:suppliers(name), cars:cars(*)`)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Multi-car Sales
export async function addMultiCarSale(saleData: MultiCarSaleData) {
  const companyId = await getCurrentCompanyId();
  if (!companyId) throw new Error('No company found for user');

  const totalSalePrice = saleData.cars.reduce((sum, car) => sum + car.sale_price, 0);
  const totalPurchasePrice = saleData.cars.reduce((sum, car) => sum + car.purchase_price, 0);
  const commission = saleData.commission || 0;
  const otherExpenses = saleData.other_expenses || 0;
  const totalProfit = totalSalePrice - totalPurchasePrice - commission - otherExpenses;
  const primaryCar = saleData.cars[0];

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      customer_id: saleData.customer_id,
      car_id: primaryCar.car_id,
      sale_price: totalSalePrice,
      seller_name: saleData.seller_name || null,
      commission,
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

  const saleItems = saleData.cars.map(car => ({
    sale_id: sale.id,
    car_id: car.car_id,
    sale_price: car.sale_price,
    profit: car.sale_price - car.purchase_price,
  }));

  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
  if (itemsError) throw itemsError;

  for (const car of saleData.cars) {
    await updateCarStatus(car.car_id, 'sold');
  }
  return sale;
}

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
    .select(`*, customer:customers(name), sale_items:sale_items(*, car:cars(*))`)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteMultiCarSale(saleId: string) {
  const { data: saleItems, error: fetchError } = await supabase
    .from('sale_items')
    .select('car_id')
    .eq('sale_id', saleId);
  if (fetchError) throw fetchError;

  await supabase.from('sale_items').delete().eq('sale_id', saleId);
  const { error: saleError } = await supabase.from('sales').delete().eq('id', saleId);
  if (saleError) throw saleError;

  for (const item of saleItems || []) {
    await updateCarStatus(item.car_id, 'available');
  }
}
