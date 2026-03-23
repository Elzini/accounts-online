/**
 * Automation Service - Recurring invoices, collection reminders, and rules
 */
import { supabase } from '@/integrations/supabase/client';

export async function fetchRecurringInvoices(companyId: string) {
  const { data, error } = await supabase.from('recurring_invoices').select('*, customers(name), suppliers(name)').eq('company_id', companyId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchCollectionReminders(companyId: string) {
  const { data, error } = await supabase.from('collection_reminders').select('*, customers(name)').eq('company_id', companyId).order('created_at', { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
}

export async function fetchCollectionReminderRules(companyId: string) {
  const { data, error } = await supabase.from('collection_reminder_rules').select('*').eq('company_id', companyId).order('escalation_level');
  if (error) throw error;
  return data || [];
}

export async function toggleRecurringInvoice(id: string, is_active: boolean) {
  const { error } = await supabase.from('recurring_invoices').update({ is_active }).eq('id', id);
  if (error) throw error;
}

export async function deleteRecurringInvoice(id: string) {
  const { error } = await supabase.from('recurring_invoices').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleReminderRule(ruleId: string, is_active: boolean) {
  const { error } = await supabase.from('collection_reminder_rules').update({ is_active }).eq('id', ruleId);
  if (error) throw error;
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

export async function createCollectionReminderRule(companyId: string, form: {
  name: string; reminder_type: string; days_offset: number;
  reminder_method: string; escalation_level: number; message_template?: string | null;
}) {
  const { error } = await supabase.from('collection_reminder_rules').insert({
    company_id: companyId, ...form,
  });
  if (error) throw error;
}

export async function fetchCustomersList(companyId: string) {
  const { data } = await (supabase.from('customers') as any).select('id, name').eq('company_id', companyId).eq('is_active', true);
  return data || [];
}
