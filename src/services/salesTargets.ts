import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchSalesTargets() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase.from('sales_targets').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addSalesTarget(target: { employee_name: string; target_amount: number; period_start: string; period_end: string }) {
  const companyId = await requireCompanyId();
  const { error } = await supabase.from('sales_targets').insert({ ...target, company_id: companyId });
  if (error) throw error;
}

export async function deleteSalesTarget(id: string) {
  const { error } = await supabase.from('sales_targets').delete().eq('id', id);
  if (error) throw error;
}
