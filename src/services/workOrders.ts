import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchWorkOrders() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase.from('work_orders').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addWorkOrder(order: { order_number: string; title: string; description: string | null; priority: string; due_date: string | null; status: string }) {
  const companyId = await requireCompanyId();
  const { error } = await supabase.from('work_orders').insert({ ...order, company_id: companyId });
  if (error) throw error;
}

export async function updateWorkOrderStatus(id: string, status: string) {
  const { error } = await supabase.from('work_orders').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteWorkOrder(id: string) {
  const { error } = await supabase.from('work_orders').delete().eq('id', id);
  if (error) throw error;
}
