import { supabase } from '@/integrations/supabase/client';

export interface CostCenter {
  id: string;
  company_id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchCostCenters(companyId: string): Promise<CostCenter[]> {
  const { data, error } = await supabase
    .from('cost_centers')
    .select('*')
    .eq('company_id', companyId)
    .order('code');
  
  if (error) throw error;
  return data || [];
}

export async function addCostCenter(companyId: string, center: { code: string; name: string; description?: string; parent_id?: string }): Promise<CostCenter> {
  const { data, error } = await supabase
    .from('cost_centers')
    .insert({ ...center, company_id: companyId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCostCenter(id: string, updates: Partial<CostCenter>): Promise<CostCenter> {
  const { data, error } = await supabase
    .from('cost_centers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCostCenter(id: string): Promise<void> {
  const { error } = await supabase
    .from('cost_centers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
