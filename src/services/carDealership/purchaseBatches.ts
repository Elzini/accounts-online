/**
 * Car Dealership - Purchase Batches
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import { requireCompanyId, getCurrentCompanyId } from '@/services/companyContext';
import type { CarInsert, PurchaseBatchInsert } from './types';

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
      price_includes_tax: (batchData as any).price_includes_tax ?? false,
      invoice_number: (batchData as any).invoice_number || null,
      due_date: (batchData as any).due_date || null,
      payment_status: (batchData as any).payment_status || 'unpaid',
      supplier_invoice_number: (batchData as any).supplier_invoice_number || null,
      payment_account_id: (batchData as any).payment_account_id || null,
      project_id: (batchData as any).project_id || null,
      cost_center_id: (batchData as any).cost_center_id || null,
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
