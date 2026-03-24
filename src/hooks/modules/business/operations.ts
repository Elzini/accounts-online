/**
 * Business Services - Loyalty (stubbed - tables dropped), Subscriptions, Time Tracking, Manufacturing
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/untypedFrom';
import { useCompany } from '@/contexts/CompanyContext';

function useCompanyId() {
  const { companyId } = useCompany();
  return companyId;
}

// ── Loyalty (STUBBED - loyalty_programs/loyalty_points tables removed) ──
export function useLoyaltyPrograms() {
  return useQuery({ queryKey: ['loyalty-programs'], queryFn: async () => [] as any[], enabled: false });
}
export function useLoyaltyPoints() {
  return useQuery({ queryKey: ['loyalty-points'], queryFn: async () => [] as any[], enabled: false });
}
export function useCreateLoyaltyProgram() {
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
    queryFn: async () => { const { data, error } = await supabase.from('subscriptions').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCreateSubscription() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { plan_name: string; amount: number; billing_cycle: string }) => {
      const { error } = await supabase.from('subscriptions').insert({ company_id: companyId!, ...form, start_date: new Date().toISOString().split('T')[0], status: 'active' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}
export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('subscriptions').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });
}

// ── Time Tracking ──
export function useTimeEntries() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['time-entries', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('time_entries').select('*').eq('company_id', companyId!).order('entry_date', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCreateTimeEntry() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { project_name?: string | null; task_name?: string | null; hours: number; billable: boolean; entry_date: string }) => {
      const { error } = await supabase.from('time_entries').insert({ company_id: companyId!, ...form });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}
export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('time_entries').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}

// ── Manufacturing ──
export function useManufacturingProducts() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['mfg-products', companyId],
    queryFn: async () => { if (!companyId) return []; const { data, error } = await supabase.from('manufacturing_products').select('*').eq('company_id', companyId).order('created_at', { ascending: false }); if (error) throw error; return data || []; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useProductionOrders() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['production-orders', companyId],
    queryFn: async () => { if (!companyId) return []; const { data, error } = await supabase.from('production_orders').select('*, manufacturing_products(name)').eq('company_id', companyId).order('created_at', { ascending: false }); if (error) throw error; return data || []; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCreateManufacturingProduct() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { name: string; code: string; unit: string; estimated_cost: number; selling_price: number; description: string }) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('manufacturing_products').insert({ company_id: companyId, ...form }); if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mfg-products'] }),
  });
}
export function useCreateProductionOrder() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { product_id: string; quantity: number; start_date?: string | null; notes?: string | null }) => {
      if (!companyId) throw new Error('No company');
      const { error } = await supabase.from('production_orders').insert({ company_id: companyId, ...form }); if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production-orders'] }),
  });
}
export function useUpdateProductionOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status }; if (status === 'completed') updates.end_date = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('production_orders').update(updates).eq('id', id); if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['production-orders'] }),
  });
}
