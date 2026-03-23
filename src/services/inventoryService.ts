/**
 * Inventory Service - Stock vouchers and stocktaking sessions
 */
import { supabase } from '@/integrations/supabase/client';

// Stock Vouchers
export async function fetchStockVouchers(companyId: string) {
  const { data, error } = await supabase.from('stock_vouchers').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createStockVoucher(companyId: string, form: { voucher_number: string; voucher_type: string; notes?: string | null }) {
  const { error } = await supabase.from('stock_vouchers').insert({
    company_id: companyId, voucher_number: form.voucher_number,
    voucher_type: form.voucher_type, voucher_date: new Date().toISOString().split('T')[0],
    status: 'draft', notes: form.notes || null,
  });
  if (error) throw error;
}

export async function deleteStockVoucher(id: string) {
  const { error } = await supabase.from('stock_vouchers').delete().eq('id', id);
  if (error) throw error;
}

// Stocktaking Sessions
export async function fetchStocktakingSessions(companyId: string) {
  const { data, error } = await supabase.from('stocktaking_sessions').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createStocktakingSession(companyId: string, form: { session_name: string; notes?: string | null }) {
  const { error } = await supabase.from('stocktaking_sessions').insert({
    company_id: companyId, session_name: form.session_name,
    start_date: new Date().toISOString().split('T')[0],
    status: 'in_progress', notes: form.notes || null,
  });
  if (error) throw error;
}
