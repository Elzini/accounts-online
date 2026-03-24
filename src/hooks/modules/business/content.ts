/**
 * Business Services - CMS, Bookkeeping, Helpdesk
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/untypedFrom';
import { useCompany } from '@/contexts/CompanyContext';

function useCompanyId() {
  const { companyId } = useCompany();
  return companyId;
}

// ── CMS ──
export function useCMSPages() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['cms-pages', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('cms_pages').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
  });
}
export function useBookkeepingTasks() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['bookkeeping-tasks', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('bookkeeping_tasks').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 5 * 60 * 1000,
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
