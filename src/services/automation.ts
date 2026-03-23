/**
 * Automation Service - Recurring invoices only (collection tables dropped)
 */
import { supabase } from '@/integrations/supabase/client';

export async function fetchRecurringInvoices(companyId: string) {
  const { data, error } = await supabase.from('recurring_invoices').select('*, customers(name), suppliers(name)').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** @deprecated Collection reminders table was dropped - returns empty array */
export async function fetchCollectionReminders(_companyId: string) {
  return [];
}

/** @deprecated Collection reminder rules table was dropped - returns empty array */
export async function fetchCollectionReminderRules(_companyId: string) {
  return [];
}

export async function toggleRecurringInvoice(id: string, is_active: boolean) {
  const { error } = await supabase.from('recurring_invoices').update({ is_active }).eq('id', id);
  if (error) throw error;
}

export async function deleteRecurringInvoice(id: string) {
  const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
  if (error) throw error;
}

/** @deprecated Collection reminder rules table was dropped - no-op */
export async function toggleReminderRule(_ruleId: string, _is_active: boolean) {
  // no-op
}

export async function createRecurringInvoice(companyId: string, form: {
  customer_id?: string | null; invoice_type: string; frequency: string;
  start_date: string; next_due_date: string; total_amount: number;
  notes?: string; auto_approve?: boolean; max_occurrences?: number | null;
}) {
  const { error } = await supabase.from('recurring_invoices').insert({
    company_id: companyId, ...form,
  });
  if (error) throw error;
}

/** @deprecated Collection reminder rules table was dropped - no-op */
export async function createCollectionReminderRule(_companyId: string, _form: any) {
  // no-op
}

export async function fetchCustomersList(companyId: string) {
  const { data } = await (supabase.from('customers') as any).select('id, name').eq('company_id', companyId).eq('is_active', true);
  return data || [];
}
