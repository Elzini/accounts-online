/**
 * Business Services - Construction, Export/Import, Commissions, Custody
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Export/Import ──
export function useLettersOfCredit(companyId: string | null) {
  return useQuery({
    queryKey: ['letters-of-credit', companyId],
    queryFn: async () => { const { data, error } = await (supabase as any).from('letters_of_credit').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data || []; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useShipments(companyId: string | null) {
  return useQuery({
    queryKey: ['shipments', companyId],
    queryFn: async () => { const { data, error } = await (supabase as any).from('shipments').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data || []; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Commissions ──
export function useCommissionRules(companyId: string | null) {
  return useQuery({
    queryKey: ['commission-rules', companyId],
    queryFn: async () => {
      const { data } = await supabase.from('app_settings').select('value').eq('company_id', companyId!).eq('key', 'commission_rules').maybeSingle();
      return data?.value ? JSON.parse(data.value) : [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCommissionSales(companyId: string | null, period: 'month' | 'quarter') {
  return useQuery({
    queryKey: ['commission-sales', companyId, period],
    queryFn: async () => {
      const now = new Date();
      let start: string;
      if (period === 'month') { start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; }
      else { const q = Math.floor(now.getMonth() / 3) * 3; start = new Date(now.getFullYear(), q, 1).toISOString().split('T')[0]; }
      const { data, error } = await (supabase as any).from('invoices').select('id, total_amount, salesperson_name, created_at').eq('company_id', companyId!).eq('type', 'sale').gte('created_at', start).order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useSaveCommissionRules(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rules: any[]) => {
      const existing = await supabase.from('app_settings').select('id').eq('company_id', companyId!).eq('key', 'commission_rules').maybeSingle();
      if (existing.data) {
        const { error } = await supabase.from('app_settings').update({ value: JSON.stringify(rules) }).eq('id', existing.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('app_settings').insert({ company_id: companyId!, key: 'commission_rules', value: JSON.stringify(rules) });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-rules'] }),
  });
}

// ── Construction ──
export function useConstructionProjects(companyId: string | null) {
  return useQuery({
    queryKey: ['projects', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('company_id', companyId!).order('project_number', { ascending: false });
      if (error) throw error; return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCreateConstructionProject(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('projects').insert({ company_id: companyId!, ...form });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
export function useUpdateConstructionProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('projects').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
export function useDeleteConstructionProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
export function useConstructionContracts(companyId: string | null) {
  return useQuery({
    queryKey: ['contracts', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('contracts').select('*, project:projects(project_name)').eq('company_id', companyId!).order('contract_number', { ascending: false });
      if (error) throw error; return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useProjectsList(companyId: string | null) {
  return useQuery({
    queryKey: ['projects-list', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, project_name, project_code').eq('company_id', companyId!).order('project_name');
      if (error) throw error; return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useContractsList(companyId: string | null) {
  return useQuery({
    queryKey: ['contracts-list', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('contracts').select('id, title, project_id').eq('company_id', companyId!).order('title');
      if (error) throw error; return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCreateConstructionContract(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('contracts').insert({ company_id: companyId!, ...form });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
export function useUpdateConstructionContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('contracts').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
export function useDeleteConstructionContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
export function useProgressBillings(companyId: string | null) {
  return useQuery({
    queryKey: ['progress-billings', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('progress_billings').select('*, project:projects(project_name), contract:contracts(title)').eq('company_id', companyId!).order('billing_number', { ascending: false });
      if (error) throw error; return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCreateProgressBilling(companyId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: any) => {
      const { error } = await supabase.from('progress_billings').insert({ company_id: companyId!, ...form });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-billings'] }),
  });
}
export function useUpdateProgressBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from('progress_billings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-billings'] }),
  });
}
export function useDeleteProgressBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('progress_billings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress-billings'] }),
  });
}

// ── Custody ──
export function useCustodyAmountChanges(custodyIds: string[]) {
  return useQuery({
    queryKey: ['all-custody-amount-changes', custodyIds],
    queryFn: async () => {
      if (custodyIds.length === 0) return [];
      const { data, error } = await supabase.from('custody_amount_changes').select('custody_id, change_amount').in('custody_id', custodyIds);
      if (error) throw error;
      return data || [];
    },
    enabled: custodyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCustodyAmountChangesList(custodyId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['custody-amount-changes', custodyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('custody_amount_changes').select('id, old_amount, new_amount, change_amount, changed_at, notes').eq('custody_id', custodyId).order('changed_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!custodyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCreateCustodyAmountChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { custody_id: string; company_id: string; change_amount: number; old_amount: number; new_amount: number; changed_at: string; notes: string }) => {
      const { error } = await supabase.from('custody_amount_changes').insert(entry);
      if (error) throw error;
      const { error: updateError } = await supabase.from('custodies').update({ custody_amount: entry.new_amount } as any).eq('id', entry.custody_id);
      if (updateError) throw updateError;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['custody-amount-changes'] }); qc.invalidateQueries({ queryKey: ['all-custody-amount-changes'] }); qc.invalidateQueries({ queryKey: ['custodies'] }); },
  });
}
export function useDeleteCustodyAmountChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('custody_amount_changes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['custody-amount-changes'] }); qc.invalidateQueries({ queryKey: ['all-custody-amount-changes'] }); qc.invalidateQueries({ queryKey: ['custodies'] }); },
  });
}
export function useCustodyAmountChangesPrint(custodyId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['custody-amount-changes-print', custodyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('custody_amount_changes').select('id, old_amount, new_amount, change_amount, changed_at, notes').eq('custody_id', custodyId).order('changed_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!custodyId,
    staleTime: 5 * 60 * 1000,
  });
}
export function useCustodyTransactionsForSettlement(custodyId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['custody-transactions-settlement', custodyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('custody_transactions').select('*').eq('custody_id', custodyId).order('transaction_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!custodyId,
    staleTime: 5 * 60 * 1000,
  });
}
