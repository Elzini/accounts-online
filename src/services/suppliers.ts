/**
 * Supplier Service - Isolated CRUD operations for suppliers
 */
import { supabase } from '@/hooks/modules/useMiscServices';
import type { Database } from '@/integrations/supabase/types';
import { requireCompanyId } from '@/services/companyContext';

type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

export async function fetchSuppliers() {
  const companyId = await requireCompanyId();
  // Read directly from `suppliers` (RLS already restricts access to authorized roles).
  // The `suppliers_safe` view returns masked tax/registration numbers (e.g. ••••0003)
  // which broke the ZATCA export — the tax authority requires the full number.
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map(supplier => ({
    id: supplier.id,
    company_id: supplier.company_id,
    name: supplier.name,
    phone: supplier.phone,
    address: supplier.address,
    notes: supplier.notes,
    id_number: supplier.id_number,
    registration_number: supplier.registration_number,
    created_at: supplier.created_at,
    updated_at: supplier.updated_at,
    registration_number_encrypted: null as string | null,
  })) || [];
}

export async function addSupplier(supplier: SupplierInsert) {
  const companyId = await requireCompanyId();
  console.log('[addSupplier] Inserting supplier for company:', companyId, supplier);
  const { data, error } = await supabase
    .from('suppliers')
    .insert({ ...supplier, company_id: companyId })
    .select()
    .single();
  if (error) {
    console.error('[addSupplier] Error:', error.code, error.message, error.details, error.hint);
    throw error;
  }
  console.log('[addSupplier] Success:', data);
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
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}
