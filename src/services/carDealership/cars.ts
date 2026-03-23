/**
 * Car Dealership - Car CRUD & Journal Entries
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { requireCompanyId, getCurrentCompanyId } from '@/services/companyContext';
import type { CarInsert, CarUpdate } from './types';
import { recalculateSalesProfitForCar } from './profitCalculations';

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

export async function deleteCar(id: string) {
  const { error } = await supabase.from('cars').delete().eq('id', id);
  if (error) throw error;
}

export async function updateCarStatus(carId: string, status: 'available' | 'sold') {
  const { error } = await supabase.from('cars').update({ status }).eq('id', carId);
  if (error) throw error;
}
