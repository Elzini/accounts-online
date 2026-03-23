/**
 * Car Dealership - Sales Operations
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { defaultRepos } from '@/core/engine/supabaseRepositories';
import { requireCompanyId, getCurrentCompanyId } from '@/services/companyContext';
import type { SaleInsert, SaleUpdate, MultiCarSaleData } from './types';
import { updateCarStatus } from './cars';

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

  // Delete journal entries via repository
  const { data: entries } = await supabase.from('journal_entries').select('id').eq('reference_type', 'sale').eq('reference_id', saleId);
  for (const e of entries || []) { await defaultRepos.journalEntries.deleteLines(e.id); await defaultRepos.journalEntries.deleteEntry(e.id); }
  const { error: deleteError } = await supabase.from('sales').delete().eq('id', saleId);
  if (deleteError) throw deleteError;
  return sale;
}

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
