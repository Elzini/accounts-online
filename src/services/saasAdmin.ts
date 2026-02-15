import { supabase } from '@/integrations/supabase/client';

// Types
export interface Plan {
  id: string;
  name: string;
  name_en: string | null;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_users: number;
  max_invoices: number | null;
  max_storage_mb: number;
  features: any[];
  feature_flags: Record<string, boolean>;
  module_limits: Record<string, number>;
  is_active: boolean;
  is_trial: boolean;
  trial_days: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  company_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  payment_reference: string | null;
  invoice_number: string | null;
  tax_amount: number;
  net_amount: number;
  gateway_fee: number;
  billing_period_start: string | null;
  billing_period_end: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  company_id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  customer_name: string | null;
  customer_email: string | null;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface SaaSKPIs {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  trialCompanies: number;
  mrr: number;
  arr: number;
  churnRate: number;
  conversionRate: number;
}

// Fetch all plans
export async function fetchPlans(): Promise<Plan[]> {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('sort_order');
  if (error) throw error;
  return (data || []) as Plan[];
}

// Create plan
export async function createPlan(plan: Partial<Plan>): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .insert(plan as any)
    .select()
    .single();
  if (error) throw error;
  return data as Plan;
}

// Update plan
export async function updatePlan(id: string, updates: Partial<Plan>): Promise<Plan> {
  const { data, error } = await supabase
    .from('plans')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Plan;
}

// Delete plan
export async function deletePlan(id: string): Promise<void> {
  const { error } = await supabase.from('plans').delete().eq('id', id);
  if (error) throw error;
}

// Fetch payments
export async function fetchPayments(): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Payment[];
}

// Fetch support tickets
export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SupportTicket[];
}

// Fetch SaaS KPIs
export async function fetchSaaSKPIs(): Promise<SaaSKPIs> {
  const [companiesRes, subsRes] = await Promise.all([
    supabase.from('companies').select('id, is_active'),
    supabase.from('subscriptions').select('id, status, mrr, amount'),
  ]);

  const companies = companiesRes.data || [];
  const subs = subsRes.data || [];

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.is_active).length;
  const suspendedCompanies = companies.filter(c => !c.is_active).length;
  const trialSubs = subs.filter(s => s.status === 'trial');
  const activeSubs = subs.filter(s => s.status === 'active');
  const cancelledSubs = subs.filter(s => s.status === 'cancelled');

  const mrr = subs.reduce((sum, s) => sum + (Number(s.mrr) || Number(s.amount) || 0), 0);
  const arr = mrr * 12;
  const churnRate = totalCompanies > 0 ? (cancelledSubs.length / totalCompanies) * 100 : 0;
  const conversionRate = trialSubs.length + activeSubs.length > 0 
    ? (activeSubs.length / (trialSubs.length + activeSubs.length)) * 100 
    : 0;

  return {
    totalCompanies,
    activeCompanies,
    suspendedCompanies,
    trialCompanies: trialSubs.length,
    mrr,
    arr,
    churnRate: Math.round(churnRate * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
  };
}
