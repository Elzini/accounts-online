import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/hooks/modules/useMiscServices';
import { useCompanyId } from './useCompanyId';
import { toast } from 'sonner';

// =================== Leads ===================
export function useRELeads() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-leads', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_leads')
        .select('*, re_projects(name), customers(name)')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveRELead() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (lead: any) => {
      const payload = { ...lead, company_id: companyId };
      if (lead.id) {
        const { data, error } = await supabase.from('re_leads').update(payload).eq('id', lead.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_leads').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-leads'] });
      toast.success('تم حفظ بيانات العميل المحتمل');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteRELead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('re_leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-leads'] });
      toast.success('تم حذف العميل المحتمل');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Follow-ups ===================
export function useREFollowUps(leadId?: string | null) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-follow-ups', companyId, leadId],
    queryFn: async () => {
      let q = supabase
        .from('re_follow_ups')
        .select('*')
        .eq('company_id', companyId!)
        .order('follow_up_date', { ascending: false });
      if (leadId) q = q.eq('lead_id', leadId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveREFollowUp() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (fu: any) => {
      const payload = { ...fu, company_id: companyId };
      if (fu.id) {
        const { data, error } = await supabase.from('re_follow_ups').update(payload).eq('id', fu.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_follow_ups').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-follow-ups'] });
      toast.success('تم حفظ المتابعة');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== Maintenance Requests ===================
export function useREMaintenanceRequests() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-maintenance', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('re_maintenance_requests')
        .select('*, re_units(unit_number, re_projects(name)), customers(name)')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}

export function useSaveREMaintenance() {
  const qc = useQueryClient();
  const companyId = useCompanyId();
  return useMutation({
    mutationFn: async (req: any) => {
      const payload = { ...req, company_id: companyId };
      if (req.id) {
        const { data, error } = await supabase.from('re_maintenance_requests').update(payload).eq('id', req.id).select().single();
        if (error) throw error;
        return data;
      } else {
        delete payload.id;
        const { data, error } = await supabase.from('re_maintenance_requests').insert(payload).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['re-maintenance'] });
      toast.success('تم حفظ طلب الصيانة');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// =================== CRM Dashboard Stats ===================
export function useRECRMStats() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['re-crm-stats', companyId],
    queryFn: async () => {
      const [leadsRes, followUpsRes] = await Promise.all([
        supabase.from('re_leads').select('id, status, source, created_at').eq('company_id', companyId!),
        supabase.from('re_follow_ups').select('id, lead_id, outcome').eq('company_id', companyId!),
      ]);
      const leads = leadsRes.data || [];
      const followUps = followUpsRes.data || [];
      const now = new Date();
      const thisMonth = leads.filter(l => new Date(l.created_at).getMonth() === now.getMonth());

      return {
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === 'new').length,
        contactedLeads: leads.filter(l => l.status === 'contacted').length,
        qualifiedLeads: leads.filter(l => l.status === 'qualified').length,
        convertedLeads: leads.filter(l => l.status === 'converted').length,
        lostLeads: leads.filter(l => l.status === 'lost').length,
        thisMonthLeads: thisMonth.length,
        totalFollowUps: followUps.length,
        sourceBreakdown: leads.reduce((acc: Record<string, number>, l) => {
          acc[l.source || 'unknown'] = (acc[l.source || 'unknown'] || 0) + 1;
          return acc;
        }, {}),
        conversionRate: leads.length > 0
          ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1)
          : '0',
      };
    },
    enabled: !!companyId,
  });
}
