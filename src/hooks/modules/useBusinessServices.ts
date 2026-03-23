/**
 * Business Modules - Service Hooks
 * Covers: CRM, CMS, Bookkeeping, Helpdesk, Loyalty, Subscriptions,
 * TimeTracking, Manufacturing, ExportImport, Commissions
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

// Custom hook to get companyId
function useCompanyId() {
  const { companyId } = useCompany();
  return companyId;
}

// ── CRM ──
export function useCRMLeads() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['crm-leads', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('crm_leads').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });
}
export function useCreateCRMLead() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { name: string; email?: string | null; phone?: string | null; source?: string | null; expected_value?: number }) => {
      const { error } = await supabase.from('crm_leads').insert({ company_id: companyId!, name: form.name, email: form.email || null, phone: form.phone || null, source: form.source || null, expected_value: form.expected_value || 0, status: 'new' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  });
}
export function useUpdateCRMLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => { const { error } = await supabase.from('crm_leads').update({ status }).eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  });
}
export function useDeleteCRMLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('crm_leads').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-leads'] }),
  });
}

// ── CMS ──
export function useCMSPages() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['cms-pages', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('cms_pages').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });
}
export function useCreateCMSPage() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { title: string; slug?: string; content?: string; excerpt?: string; page_type?: string; meta_title?: string; meta_description?: string }) => {
      const slug = form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error } = await supabase.from('cms_pages').insert({ company_id: companyId!, title: form.title, slug, content: form.content || '', excerpt: form.excerpt || '', page_type: form.page_type || 'page', meta_title: form.meta_title || '', meta_description: form.meta_description || '', status: 'draft' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-pages'] }),
  });
}
export function useDeleteCMSPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('cms_pages').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-pages'] }),
  });
}
export function useUpdateCMSPageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status }; if (status === 'published') updates.published_at = new Date().toISOString();
      const { error } = await supabase.from('cms_pages').update(updates).eq('id', id); if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-pages'] }),
  });
}

// ── Bookkeeping ──
export function useBookkeepingClients() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['bookkeeping-clients', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('bookkeeping_clients').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });
}
export function useBookkeepingTasks() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['bookkeeping-tasks', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('bookkeeping_tasks').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });
}
export function useCreateBookkeepingClient() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { client_name: string; contact_person?: string | null; phone?: string | null; monthly_fee?: number }) => {
      const { error } = await supabase.from('bookkeeping_clients').insert({ company_id: companyId!, client_name: form.client_name, contact_person: form.contact_person || null, phone: form.phone || null, monthly_fee: form.monthly_fee || 0, status: 'active' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookkeeping-clients'] }),
  });
}
export function useDeleteBookkeepingClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('bookkeeping_clients').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookkeeping-clients'] }),
  });
}

// ── Helpdesk ──
export function useSupportTickets() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['support-tickets', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('support_tickets').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });
}
export function useCreateSupportTicket() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { ticket_number: string; subject: string; description?: string; customer_name?: string; customer_email?: string; priority?: string; category?: string | null }) => {
      const { error } = await supabase.from('support_tickets').insert({ company_id: companyId!, ...form });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-tickets'] }),
  });
}
export function useDeleteSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('support_tickets').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-tickets'] }),
  });
}
export function useUpdateSupportTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status }; if (status === 'resolved') updates.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('support_tickets').update(updates).eq('id', id); if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['support-tickets'] }),
  });
}

// ── Loyalty ──
export function useLoyaltyPrograms() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['loyalty-programs', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('loyalty_programs').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
  });
}
export function useLoyaltyPoints() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['loyalty-points', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('loyalty_points').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }).limit(50); if (error) throw error; return data; },
    enabled: !!companyId,
  });
}
export function useCreateLoyaltyProgram() {
  const companyId = useCompanyId(); const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: { name: string; points_per_unit: number; unit_value: number }) => {
      const { error } = await supabase.from('loyalty_programs').insert({ company_id: companyId!, ...form, is_active: true });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-programs'] }),
  });
}
export function useDeleteLoyaltyProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from('loyalty_programs').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty-programs'] }),
  });
}

// ── Subscriptions ──
export function useSubscriptions() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['subscriptions', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('subscriptions').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
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
  });
}
export function useProductionOrders() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['production-orders', companyId],
    queryFn: async () => { if (!companyId) return []; const { data, error } = await supabase.from('production_orders').select('*, manufacturing_products(name)').eq('company_id', companyId).order('created_at', { ascending: false }); if (error) throw error; return data || []; },
    enabled: !!companyId,
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

// ── Export/Import ──
export function useLettersOfCredit(companyId: string | null) {
  return useQuery({
    queryKey: ['letters-of-credit', companyId],
    queryFn: async () => { const { data, error } = await (supabase as any).from('letters_of_credit').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data || []; },
    enabled: !!companyId,
  });
}
export function useShipments(companyId: string | null) {
  return useQuery({
    queryKey: ['shipments', companyId],
    queryFn: async () => { const { data, error } = await (supabase as any).from('shipments').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data || []; },
    enabled: !!companyId,
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
  });
}
export function useCreateCustodyAmountChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: { custody_id: string; company_id: string; change_amount: number; old_amount: number; new_amount: number; changed_at: string; notes: string }) => {
      const { error } = await supabase.from('custody_amount_changes').insert(entry);
      if (error) throw error;
      // Also update the custody amount
      const { error: updateError } = await supabase.from('custodies').update({ amount: entry.new_amount }).eq('id', entry.custody_id);
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
  });
}
// Custody settlement transactions query
export function useCustodyTransactionsForSettlement(custodyId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['custody-transactions-settlement', custodyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('custody_transactions').select('*').eq('custody_id', custodyId).order('transaction_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!custodyId,
  });
}
