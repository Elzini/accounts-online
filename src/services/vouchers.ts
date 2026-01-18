import { supabase } from '@/integrations/supabase/client';

export interface Voucher {
  id: string;
  company_id: string;
  voucher_number: number;
  voucher_type: 'receipt' | 'payment';
  amount: number;
  related_to: string | null;
  related_id: string | null;
  description: string;
  voucher_date: string;
  payment_method: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type VoucherInsert = Omit<Voucher, 'id' | 'voucher_number' | 'created_at' | 'updated_at'>;

export async function fetchVouchers(): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Voucher[];
}

export async function fetchVouchersByType(type: 'receipt' | 'payment'): Promise<Voucher[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('voucher_type', type)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Voucher[];
}

export async function addVoucher(voucher: VoucherInsert): Promise<Voucher> {
  const { data, error } = await supabase
    .from('vouchers')
    .insert(voucher)
    .select()
    .single();
  
  if (error) throw error;
  return data as Voucher;
}

export async function updateVoucher(id: string, updates: Partial<VoucherInsert>): Promise<Voucher> {
  const { data, error } = await supabase
    .from('vouchers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Voucher;
}

export async function deleteVoucher(id: string): Promise<void> {
  const { error } = await supabase
    .from('vouchers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
