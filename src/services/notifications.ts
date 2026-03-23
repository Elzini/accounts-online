import { supabase } from '@/integrations/supabase/client';

export async function fetchNotifications(userId: string, companyId: string) {
  const { data } = await supabase.from('notifications').select('*')
    .eq('user_id', userId).eq('company_id', companyId)
    .order('created_at', { ascending: false }).limit(50);
  return data || [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string, companyId: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true })
    .eq('user_id', userId).eq('company_id', companyId).eq('is_read', false);
  if (error) throw error;
}

export async function fetchOverdueInvoices(companyId: string, daysOverdue: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);
  
  const { data: invoices } = await supabase.from('invoices').select('*')
    .eq('company_id', companyId).eq('invoice_type', 'sales')
    .in('status', ['pending', 'partially_paid'])
    .lt('invoice_date', cutoffDate.toISOString().split('T')[0])
    .order('invoice_date', { ascending: true });
  
  const { data: sales } = await supabase.from('sales').select('*')
    .eq('company_id', companyId)
    .eq('payment_status', 'pending')
    .lt('sale_date', cutoffDate.toISOString().split('T')[0])
    .order('sale_date', { ascending: true });
  
  return { invoices: invoices || [], sales: sales || [] };
}
