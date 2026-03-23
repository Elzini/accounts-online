import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchSupplierPortalTokens() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('supplier_portal_tokens' as any).select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  return (data || []) as any[];
}

export async function fetchSupplierNames() {
  const companyId = await requireCompanyId();
  const { data } = await supabase.from('suppliers').select('id, name').eq('company_id', companyId).order('name');
  return data || [];
}

export async function addSupplierPortalAccess(supplierId: string, supplierName: string) {
  const companyId = await requireCompanyId();
  const { error } = await supabase.from('supplier_portal_tokens' as any).insert({
    company_id: companyId, supplier_id: supplierId, supplier_name: supplierName,
  } as any);
  if (error) throw error;
}

export async function toggleSupplierPortalAccess(id: string, active: boolean) {
  await supabase.from('supplier_portal_tokens' as any).update({ is_active: active } as any).eq('id', id);
}

export async function deleteSupplierPortalAccess(id: string) {
  await supabase.from('supplier_portal_tokens' as any).delete().eq('id', id);
}
