/**
 * Business Services - CRM
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';

function useCompanyId() {
  const { companyId } = useCompany();
  return companyId;
}

export function useCRMLeads() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['crm-leads', companyId],
    queryFn: async () => { const { data, error } = await supabase.from('crm_leads').select('*').eq('company_id', companyId!).order('created_at', { ascending: false }); if (error) throw error; return data; },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
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
