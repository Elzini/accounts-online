import { supabase } from '@/integrations/supabase/client';
import { requireCompanyId } from '@/services/companyContext';

export async function fetchPaymentTransactions() {
  const companyId = await requireCompanyId();
  const { data, error } = await supabase.from('payment_transactions').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addPaymentTransaction(tx: { amount: number; customer_name: string; customer_email?: string; payment_method: string; transaction_ref: string }) {
  const companyId = await requireCompanyId();
  const { error } = await supabase.from('payment_transactions').insert({ ...tx, company_id: companyId, status: 'pending' });
  if (error) throw error;
}

export async function deletePaymentTransaction(id: string) {
  const { error } = await supabase.from('payment_transactions').delete().eq('id', id);
  if (error) throw error;
}
