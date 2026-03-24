/**
 * Module Services - Currencies, Budgets, Loyalty, Subscriptions, Time Tracking, Work Orders
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/untypedFrom';
import { useCompanyId } from '@/hooks/useCompanyId';

// ── Currencies ──
export function useCurrencies() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['currencies', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('currencies').select('*').eq('company_id', companyId).order('is_base', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExchangeRates() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['exchange-rates', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('exchange_rates').select('*, from_currency:currencies!exchange_rates_from_currency_id_fkey(code, name_ar), to_currency:currencies!exchange_rates_to_currency_id_fkey(code, name_ar)').eq('company_id', companyId).order('effective_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddCurrency() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: any) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('currencies').insert({ company_id: companyId, ...form });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['currencies'] }); },
  });
}

export function useAddExchangeRate() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: any) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('exchange_rates').insert({ company_id: companyId, ...form });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['exchange-rates'] }); },
  });
}

export function useDeleteCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('currencies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['currencies'] }); },
  });
}

// ── Budgets ──
export function useBudgets() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['budgets', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const { data, error } = await supabase.from('budgets').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddBudget() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { name: string; start_date: string; end_date: string; notes: string; fiscal_year_id?: string }) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('budgets').insert({ company_id: companyId, ...form });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); },
  });
}

// ── Loyalty (STUBBED - tables removed) ──
export function useLoyaltyPrograms() {
  return useQuery({ queryKey: ['loyalty-programs'], queryFn: async () => [] as any[], enabled: false });
}
export function useLoyaltyPoints() {
  return useQuery({ queryKey: ['loyalty-points'], queryFn: async () => [] as any[], enabled: false });
}
export function useAddLoyaltyProgram() {
  return useMutation({ mutationFn: async (_form: any) => { throw new Error('Loyalty feature is being redesigned'); } });
}
export function useDeleteLoyaltyProgram() {
  return useMutation({ mutationFn: async (_id: string) => { throw new Error('Loyalty feature is being redesigned'); } });
}

// ── Subscriptions ──
export function useSubscriptions() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['subscriptions', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscriptions').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddSubscription() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { planName: string; amount: string; cycle: string }) => {
      const { error } = await supabase.from('subscriptions').insert({ company_id: companyId!, plan_name: form.planName, amount: Number(form.amount) || 0, billing_cycle: form.cycle, start_date: new Date().toISOString().split('T')[0], status: 'active' });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
  });
}

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('subscriptions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscriptions'] }); },
  });
}

// ── Time Tracking ──
export function useTimeEntries() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['time-entries', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('time_entries').select('*').eq('company_id', companyId!).order('entry_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddTimeEntry() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { projectName: string; taskName: string; hours: string; billable: boolean; date: string }) => {
      const { error } = await supabase.from('time_entries').insert({ company_id: companyId!, project_name: form.projectName || null, task_name: form.taskName || null, hours: Number(form.hours) || 0, billable: form.billable, entry_date: form.date });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['time-entries'] }); },
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('time_entries').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['time-entries'] }); },
  });
}

// ── Work Orders ──
export function useWorkOrders() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['work-orders', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('work_orders').select('*').eq('company_id', companyId!).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddWorkOrder() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { title: string; description: string; priority: string; dueDate: string; orderNumber: string }) => {
      const { error } = await supabase.from('work_orders').insert({ company_id: companyId!, order_number: form.orderNumber, title: form.title, description: form.description || null, priority: form.priority, due_date: form.dueDate || null, status: 'pending' });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-orders'] }); },
  });
}

export function useUpdateWorkOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from('work_orders').update({ status }).eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-orders'] }); },
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('work_orders').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['work-orders'] }); },
  });
}
